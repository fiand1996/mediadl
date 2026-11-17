import { execFile, spawn } from "node:child_process";
import { existsSync, promises as fsPromises } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { PostResult, MediaItem } from "./types";
import { matchGalleryDlSite } from "./galleryDlMatcher";

const execFileAsync = promisify(execFile);

export interface GalleryDlCommandConfig {
  executable: string;
}

const DEFAULT_TIMEOUT_MS = 45000;
const parsedTimeout = process.env.GALLERY_DL_TIMEOUT_MS ? parseInt(process.env.GALLERY_DL_TIMEOUT_MS, 10) : NaN;
const GALLERY_DL_TIMEOUT_MS = !isNaN(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : DEFAULT_TIMEOUT_MS;

const DEFAULT_MAX_ITEMS = 50;
const parsedMax = process.env.GALLERY_DL_MAX_ITEMS ? parseInt(process.env.GALLERY_DL_MAX_ITEMS, 10) : NaN;
export const GALLERY_DL_MAX_ITEMS = !isNaN(parsedMax) && parsedMax > 0 ? parsedMax : DEFAULT_MAX_ITEMS;

/**
 * Detect gallery-dl binary from GALLERY_DL_PATH env or PATH candidates
 */
export async function detectGalleryDlBinary(): Promise<GalleryDlCommandConfig | null> {
  const explicitPath = process.env.GALLERY_DL_PATH?.trim();
  if (explicitPath) {
    if (existsSync(explicitPath)) {
      return { executable: explicitPath };
    }
    return null;
  }

  for (const candidate of ["gallery-dl", "gallery-dl.exe"]) {
    try {
      await execFileAsync(/*turbopackIgnore: true*/ candidate, ["--version"], { timeout: 15000 });
      return { executable: candidate };
    } catch {
      // Try next candidate
    }
  }

  return null;
}

function getTempDirectory(): string {
  const custom = process.env.GALLERY_DL_TEMP_DIR?.trim();
  return custom && existsSync(custom) ? custom : tmpdir();
}

interface ParsedGalleryItem {
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  author?: string;
  avatar?: string;
  date?: string;
  ext?: string;
}

/**
 * Parse stdout produced by `gallery-dl -j`
 * Format:
 * [1, "directory_name"]
 * [2, "direct_file_url", { ...metadata }]
 * [3, "direct_file_url", { ...metadata }]
 * or direct JSON objects
 */
export function parseGalleryDlJsonOutput(stdout: string): { items: ParsedGalleryItem[]; globalMeta: Record<string, unknown> } {
  const lines = stdout.split("\n");
  const items: ParsedGalleryItem[] = [];
  let globalMeta: Record<string, unknown> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    try {
      const parsed = JSON.parse(line);

      // Tuple format: [type_id, data, meta]
      if (Array.isArray(parsed)) {
        const typeId = parsed[0];

        // Type 1: Directory or Category
        if (typeId === 1 && typeof parsed[1] === "string") {
          if (!globalMeta.title) {
            globalMeta.title = parsed[1];
          }
          continue;
        }

        // Type 2 or 3: Media File
        if ((typeId === 2 || typeId === 3) && typeof parsed[1] === "string") {
          const directUrl = parsed[1];
          const meta = (parsed[2] && typeof parsed[2] === "object" ? parsed[2] : {}) as Record<string, unknown>;

          if (Object.keys(globalMeta).length === 0) {
            globalMeta = meta;
          }

          const author = (meta.author || meta.artist || meta.user || meta.username || meta.uploader || meta.channel || "") as string;
          const title = (meta.title || meta.name || meta.caption || meta.description || "") as string;
          const thumbnail = (meta.thumbnail || meta.preview || directUrl) as string;
          const date = (meta.date || meta.timestamp || "") as string;
          const ext = (meta.extension || meta.ext || "") as string;

          items.push({
            url: directUrl,
            thumbnail,
            title,
            author,
            date,
            ext,
          });
        }
      } else if (typeof parsed === "object" && parsed !== null) {
        // Raw dictionary format
        const directUrl = (parsed.url || parsed.file_url || parsed.src || "") as string;
        if (directUrl) {
          if (Object.keys(globalMeta).length === 0) {
            globalMeta = parsed;
          }
          items.push({
            url: directUrl,
            thumbnail: (parsed.thumbnail || parsed.preview || directUrl) as string,
            title: (parsed.title || parsed.caption || parsed.description || "") as string,
            author: (parsed.author || parsed.artist || parsed.username || "") as string,
            ext: (parsed.extension || parsed.ext || "") as string,
          });
        }
      }
    } catch {
      // Ignore individual malformed lines
    }
  }

  return { items, globalMeta };
}

function isVideoExtension(urlOrExt: string): boolean {
  const lower = urlOrExt.toLowerCase();
  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mkv") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".gif") ||
    lower.includes("mp4") ||
    lower.includes("video")
  );
}

/**
 * Executes gallery-dl CLI and transforms output into MediaDL PostResult
 */
export async function fetchGalleryDlMetadataWithCookies(
  targetUrl: string,
  cookieContent?: string | null
): Promise<PostResult> {
  const command = await detectGalleryDlBinary();

  if (!command) {
    throw new Error(
      "gallery-dl is not installed or not available in PATH. Set GALLERY_DL_PATH environment variable or ensure gallery-dl binary is installed."
    );
  }

  const siteInfo = matchGalleryDlSite(targetUrl);
  const platformName = siteInfo?.name || "Gallery";

  let tempCookiePath: string | null = null;
  const tempDir = getTempDirectory();

  try {
    const args: string[] = [
      "--dump-json",
      "--no-download",
      "--no-check-certificate",
      "--range",
      `1-${GALLERY_DL_MAX_ITEMS}`,
      "--user-agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ];

    // Handle temporary cookie file (cross-platform compatible: Windows, Mac, Linux, Docker)
    if (cookieContent && cookieContent.trim()) {
      tempCookiePath = join(tempDir, `gdl_cookie_${Date.now()}_${randomUUID().slice(0, 8)}.txt`);
      await fsPromises.writeFile(tempCookiePath, cookieContent, "utf-8");
      args.push("--cookies", tempCookiePath);
    }

    args.push(targetUrl);

    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn(/*turbopackIgnore: true*/ command.executable, args, {
        env: process.env,
      });

      let out = "";
      let err = "";
      let isSettled = false;

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            child.kill("SIGKILL");
          } catch {
            // Ignore kill error
          }
          reject(new Error(`gallery-dl timed out after ${Math.round(GALLERY_DL_TIMEOUT_MS / 1000)} seconds.`));
        }
      }, GALLERY_DL_TIMEOUT_MS);

      child.stdout.on("data", (chunk) => {
        out += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        err += chunk.toString();
      });

      child.on("error", (spawnErr) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timer);
          reject(new Error(spawnErr.message || "Failed to execute gallery-dl binary."));
        }
      });

      child.on("close", (code) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);

        if (code !== 0 && !out.trim()) {
          reject(new Error(err || `gallery-dl exited with status code ${code}`));
          return;
        }

        resolve(out);
      });
    });

    const { items: parsedItems, globalMeta } = parseGalleryDlJsonOutput(stdout);

    if (parsedItems.length === 0) {
      throw new Error("gallery-dl found no downloadable media items for this URL.");
    }

    // Limit to configured max items
    const limitedItems = parsedItems.slice(0, GALLERY_DL_MAX_ITEMS);

    const referer = siteInfo?.url || targetUrl;

    const mediaItems: MediaItem[] = limitedItems.map((item, index) => {
      const isVideo = isVideoExtension(item.ext || item.url);
      const streamUrl = `/api/stream?url=${encodeURIComponent(item.url)}&referer=${encodeURIComponent(referer)}`;

      return {
        id: `${index + 1}`,
        type: isVideo ? "video" : "image",
        url: streamUrl,
        thumbnail: item.thumbnail ? `/api/stream?url=${encodeURIComponent(item.thumbnail)}&referer=${encodeURIComponent(referer)}` : streamUrl,
        quality: item.ext ? item.ext.toUpperCase() : "Original",
      };
    });

    const firstItem = limitedItems[0];
    const username =
      firstItem.author ||
      (globalMeta.author as string) ||
      (globalMeta.user as string) ||
      (globalMeta.uploader as string) ||
      platformName;

    const caption =
      firstItem.title ||
      (globalMeta.title as string) ||
      (globalMeta.description as string) ||
      (globalMeta.caption as string) ||
      "";

    const mediaType = mediaItems.length > 1 ? "carousel" : mediaItems[0].type === "video" ? "single_video" : "single_image";

    const postResult: PostResult = {
      id: (globalMeta.id as string) || String(Date.now()),
      platform: platformName,
      author: {
        username: String(username),
        avatar: "",
        verified: false,
      },
      caption: String(caption),
      mediaType,
      items: mediaItems,
      timestamp: new Date().toISOString(),
    };

    return postResult;
  } finally {
    // Always clean up transient cookie file immediately
    if (tempCookiePath) {
      await fsPromises.unlink(tempCookiePath).catch(() => {});
    }
  }
}
