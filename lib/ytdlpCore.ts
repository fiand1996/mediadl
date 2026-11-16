import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import { MediaFormatOption } from "./ytdlpTypes";
import { getFlareSolverrConfig, executeFlareSolverrCommand } from "./flareSolverr";
import { isFFmpegAvailable } from "./ffmpeg";

const execFileAsync = promisify(execFile);

export interface YtDlpCommandConfig {
  executable: string;
}

export interface YtDlpFormatInfo {
  url?: string;
  height?: number;
  vcodec?: string | null;
  acodec?: string | null;
  tbr?: number;
  format_id?: string;
  format_note?: string;
  ext?: string;
  filesize?: number;
  protocol?: string;
}

export interface YtDlpMetadata {
  id?: string;
  title?: string;
  thumbnail?: string;
  uploader?: string;
  description?: string;
  timestamp?: number;
  upload_date?: string;
  release_timestamp?: number;
  duration?: number;
  formats?: YtDlpFormatInfo[];
}

function isManifestFormat(f: YtDlpFormatInfo): boolean {
  const protocol = (f.protocol || "").toLowerCase();
  const url = (f.url || "").toLowerCase();

  return (
    protocol.includes("m3u8") ||
    protocol.includes("dash") ||
    protocol.includes("f4m") ||
    protocol.includes("ism") ||
    url.includes(".m3u8") ||
    url.includes("/hls_playlist/") ||
    url.includes("/manifest/hls") ||
    url.includes(".mpd") ||
    url.includes("/manifest/dash")
  );
}

export function extractAllFormats(
  formats: YtDlpFormatInfo[] = [],
  targetWebUrl?: string,
  hasFFmpeg: boolean = isFFmpegAvailable()
): MediaFormatOption[] {
  // Filter only direct streamable media formats (progressive MP4/WebM/M4A), discarding text manifest playlists (.m3u8/.mpd)
  const validUrlFormats = formats.filter((f) => typeof f?.url === "string" && f.url.trim().length > 0);
  const directCandidates = validUrlFormats.filter((f) => !isManifestFormat(f));

  // Always prioritize direct downloadable media streams over HLS/DASH manifest playlists
  const candidates = directCandidates.length > 0 ? directCandidates : validUrlFormats;
  if (candidates.length === 0) return [];

  const combinedFormats: MediaFormatOption[] = [];
  const audioFormats: MediaFormatOption[] = [];
  const videoOnlyFormats: MediaFormatOption[] = [];

  const seenQualities = new Set<string>();

  for (const f of candidates) {
    const hasVideo = f.vcodec && f.vcodec !== "none";
    const hasAudio = f.acodec && f.acodec !== "none";

    if (!hasVideo && !hasAudio) continue;

    const ext = f.ext || (hasVideo ? "mp4" : "m4a");
    const formatId = f.format_id || `${f.height || 'std'}-${ext}`;

    if (hasVideo && hasAudio) {
      // Complete Video + Audio (pre-merged / progressive stream)
      const resLabel = f.height ? `${f.height}p` : (f.format_note || "Standard");
      const quality = `${resLabel} (Video + Audio)`;
      if (!seenQualities.has(quality)) {
        seenQualities.add(quality);
        combinedFormats.push({
          formatId,
          quality,
          ext,
          url: f.url!,
          filesize: f.filesize,
          note: f.format_note,
        });
      }
    } else if (!hasVideo && hasAudio) {
      // Audio Only stream (songs, voice)
      const bitrate = f.tbr ? ` - ${Math.round(f.tbr)}kbps` : "";
      const quality = `Audio Only (${ext.toUpperCase()}${bitrate})`;
      if (!seenQualities.has(quality)) {
        seenQualities.add(quality);
        audioFormats.push({
          formatId,
          quality,
          ext,
          url: f.url!,
          filesize: f.filesize,
          note: f.format_note,
        });
      }
    } else if (hasVideo && !hasAudio) {
      const resLabel = f.height ? `${f.height}p` : (f.format_note || "HD");

      // When FFmpeg is available and target web URL is provided:
      // generate a merged high-res Video + Audio option!
      if (hasFFmpeg && targetWebUrl) {
        const mergedQuality = `${resLabel} (Video + Audio)`;
        if (!seenQualities.has(mergedQuality)) {
          seenQualities.add(mergedQuality);
          const mergeFormatId = `${formatId}+ba/b`;
          const mergedUrl = `/api/stream?sourceUrl=${encodeURIComponent(targetWebUrl)}&format=${encodeURIComponent(mergeFormatId)}&merge=true&ext=mp4`;
          combinedFormats.push({
            formatId: mergeFormatId,
            quality: mergedQuality,
            ext: "mp4",
            url: mergedUrl,
            filesize: f.filesize,
            note: f.format_note,
            isMerged: true,
            requiresFFmpeg: true,
          });
        }

        // Also expose the silent video-only option for users who specifically need it
        const silentQuality = `${resLabel} (Video Only - Silent)`;
        if (!seenQualities.has(silentQuality)) {
          seenQualities.add(silentQuality);
          videoOnlyFormats.push({
            formatId,
            quality: silentQuality,
            ext,
            url: f.url!,
            filesize: f.filesize,
            note: f.format_note,
          });
        }
      } else {
        // Without FFmpeg: DASH video-only stream remains labeled clearly as without audio
        const quality = `${resLabel} (Video Only - No Audio)`;
        if (!seenQualities.has(quality)) {
          seenQualities.add(quality);
          videoOnlyFormats.push({
            formatId,
            quality,
            ext,
            url: f.url!,
            filesize: f.filesize,
            note: f.format_note,
          });
        }
      }
    }
  }

  // Sort combined formats by height descending
  combinedFormats.sort((a, b) => {
    const hA = parseInt(a.quality) || 0;
    const hB = parseInt(b.quality) || 0;
    return hB - hA;
  });

  // Sort video only formats by height descending
  videoOnlyFormats.sort((a, b) => {
    const hA = parseInt(a.quality) || 0;
    const hB = parseInt(b.quality) || 0;
    return hB - hA;
  });

  // Final prioritized list:
  // 1. Combined (Video + Audio) - safest default with sound
  // 2. Audio Only (for music / podcasts)
  // 3. High-res Video Only (clearly labeled for users who only want high res visuals)
  const result = [...combinedFormats, ...audioFormats, ...videoOnlyFormats];

  if (result.length === 0 && candidates.length > 0) {
    result.push({
      formatId: "default",
      quality: "Default Quality",
      ext: candidates[0].ext || "mp4",
      url: candidates[0].url!,
    });
  }

  return result;
}

export async function detectYtDlpBinary(): Promise<YtDlpCommandConfig | null> {
  const explicitPath = process.env.YTDLP_PATH?.trim();
  if (explicitPath) {
    if (existsSync(explicitPath)) {
      return { executable: explicitPath };
    }
    return null;
  }

  for (const candidate of ["yt-dlp", "yt-dlp.exe"]) {
    try {
      await execFileAsync(candidate, ["--version"], { timeout: 15000 });
      return { executable: candidate };
    } catch {
      // Try next candidate.
    }
  }

  return null;
}

function buildMergedCookieContent(dbCookieContent?: string | null, flareCookies?: Array<{ domain: string; name: string; value: string; path?: string }> | null): string {
  let mergedContent = "# Netscape HTTP Cookie File\n# Combined Database and FlareSolverr Cookies\n\n";

  if (dbCookieContent) {
    mergedContent += dbCookieContent.trim() + "\n\n";
  }

  if (flareCookies && Array.isArray(flareCookies)) {
    for (const c of flareCookies) {
      const domain = c.domain;
      const path = c.path || "/";
      mergedContent += `${domain}\tTRUE\t${path}\tFALSE\t0\t${c.name}\t${c.value}\n`;
    }
  }

  return mergedContent;
}

const DEFAULT_TIMEOUT = 45000; // 45 seconds
const parsedTimeout = process.env.YTDLP_TIMEOUT_MS ? parseInt(process.env.YTDLP_TIMEOUT_MS, 10) : NaN;
const YTDLP_TIMEOUT_MS = !isNaN(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : DEFAULT_TIMEOUT;

function runYtDlpProcess(
  command: YtDlpCommandConfig,
  commandArgs: string[],
  cookieContent?: string | null,
  timeoutMs: number = YTDLP_TIMEOUT_MS
): Promise<YtDlpMetadata> {
  return new Promise((resolve, reject) => {
    const child = spawn(command.executable, commandArgs, {
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    let isSettled = false;

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        try {
          child.kill("SIGKILL");
        } catch {
          // Ignore kill error
        }
        reject(new Error(`yt-dlp execution timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
      }
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        reject(new Error(err.message || "yt-dlp execution failed."));
      }
    });

    child.on("close", (code) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);

      if (code !== 0) {
        reject(new Error(stderr || `yt-dlp exited with status code ${code}`));
        return;
      }

      try {
        const data = JSON.parse(stdout) as YtDlpMetadata;
        resolve(data);
      } catch {
        reject(new Error("Failed to parse yt-dlp JSON output."));
      }
    });

    if (cookieContent) {
      child.stdin.write(cookieContent);
      child.stdin.end();
    }
  });
}

export async function fetchYtDlpMetadataWithCookies(
  url: string,
  dbCookieContent?: string | null
): Promise<YtDlpMetadata> {
  const command = await detectYtDlpBinary();

  if (!command) {
    throw new Error(
      "yt-dlp is not installed or not available in PATH. Set YTDLP_PATH environment variable or ensure yt-dlp binary is installed."
    );
  }

  const buildArgs = (hasCookies: boolean) => {
    const args: string[] = [];

    args.push(
      "--no-warnings",
      "--skip-download",
      "--dump-json",
      "--no-check-certificates",
      "--no-playlist",
      "--user-agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    if (hasCookies) {
      args.push("--cookies", "-");
    }

    args.push(url);

    return args;
  };

  // 1. Try initial direct run with DB cookies (lazy anti-bot: zero FlareSolverr overhead for standard platforms)
  try {
    const initialArgs = buildArgs(Boolean(dbCookieContent));
    return await runYtDlpProcess(command, initialArgs, dbCookieContent);
  } catch (initialErr: unknown) {
    const errorMessage = initialErr instanceof Error ? initialErr.message : String(initialErr);
    
    // Check if error is specifically caused by Cloudflare anti-bot challenge
    const isCloudflareChallenge = /cloudflare|cf-browser-verification|challenges\.cloudflare\.com|cf-turnstile|just a moment\.\.\./i.test(errorMessage);
    const flareConfig = getFlareSolverrConfig();

    if (flareConfig.enabled && isCloudflareChallenge) {
      try {
        const data = await executeFlareSolverrCommand(flareConfig, {
          cmd: "request.get",
          url: url,
        });

        if (data.status === "ok" && data.solution?.cookies && data.solution.cookies.length > 0) {
          const mergedContent = buildMergedCookieContent(dbCookieContent, data.solution.cookies);
          const retryArgs = buildArgs(true);
          return await runYtDlpProcess(command, retryArgs, mergedContent);
        }
      } catch {
        // Fallback to rethrowing initial error if FlareSolverr fails
      }
    }

    throw initialErr;
  }
}
