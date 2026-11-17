import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createReadStream, promises as fsPromises } from "node:fs";
import { registry } from "@/extensions/registry";
import { getExtensionStatusMap } from "@/lib/extensionManager";
import { detectYtDlpBinary } from "@/lib/ytdlpCore";
import { getFFmpegPath } from "@/lib/ffmpeg";
import { getActiveCookieManagerForUrl } from "@/lib/ytdlpCookieRotator";

function isPrivateIp(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname === "169.254.169.254"
  ) {
    return true;
  }

  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  if (match) {
    const [, b1, b2] = match.map(Number);
    if (b1 === 10) return true;
    if (b1 === 172 && b2 >= 16 && b2 <= 31) return true;
    if (b1 === 192 && b2 === 168) return true;
    if (b1 === 127) return true;
    if (b1 === 0) return true;
  }

  return false;
}

// Background cleanup for stale temp merge files (>10 minutes old)
async function cleanupStaleTempFiles(dir: string) {
  try {
    const entries = await fsPromises.readdir(dir);
    const now = Date.now();
    for (const file of entries) {
      if (file.startsWith("merge_")) {
        const filePath = join(dir, file);
        const stat = await fsPromises.stat(filePath).catch(() => null);
        if (stat && now - stat.mtimeMs > 600000) {
          await fsPromises.unlink(filePath).catch(() => {});
        }
      }
    }
  } catch {
    // Ignore cleanup error
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isMerge = searchParams.get("merge") === "true";
  const sourceUrl = searchParams.get("sourceUrl");
  const formatId = searchParams.get("format");
  const targetUrl = searchParams.get("url");
  const filename = searchParams.get("filename") || "media_download";

  // Clean and sanitize filename for Content-Disposition header
  const cleanFilename = filename.replace(/["\r\n\t/\\]/g, "_");
  const encodedFilename = encodeURIComponent(cleanFilename);

  // 1. FFmpeg High-Quality Merging Mode
  if (isMerge && sourceUrl && formatId) {
    try {
      const parsedSource = new URL(sourceUrl);
      if (parsedSource.protocol !== "http:" && parsedSource.protocol !== "https:") {
        return NextResponse.json({ error: "Invalid protocol." }, { status: 400 });
      }
      if (isPrivateIp(parsedSource.hostname)) {
        return NextResponse.json({ error: "Access to private or local network is forbidden." }, { status: 403 });
      }

      const ffmpegPath = getFFmpegPath();
      if (!ffmpegPath) {
        return NextResponse.json({ error: "FFmpeg is not available on this server for merging." }, { status: 500 });
      }

      const command = await detectYtDlpBinary();
      if (!command) {
        return NextResponse.json({ error: "yt-dlp is not available on this server." }, { status: 500 });
      }

      const tempDir = join(tmpdir(), "mediadl_merges");
      await fsPromises.mkdir(tempDir, { recursive: true });
      cleanupStaleTempFiles(tempDir);

      const filePrefix = `merge_${Date.now()}_${randomUUID().slice(0, 8)}`;
      const tempOutputTemplate = join(tempDir, `${filePrefix}.%(ext)s`);

      const activeCookie = getActiveCookieManagerForUrl(sourceUrl);
      const cookieContent = activeCookie?.cookieContent || null;

      const args: string[] = [];

      args.push(
        "--no-warnings",
        "--no-playlist",
        "--ffmpeg-location", ffmpegPath,
        "-f", formatId,
        "--merge-output-format", "mp4",
        "--postprocessor-args", "ffmpeg:-movflags +faststart",
        "-o", tempOutputTemplate,
        "--no-check-certificates",
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      if (cookieContent) {
        args.push("--cookies", "-");
      }

      args.push(sourceUrl);

      // Execute yt-dlp to download and mux into a valid MP4 file with faststart
      await new Promise<void>((resolve, reject) => {
        const child = spawn(/*turbopackIgnore: true*/ command.executable, args, {
          env: process.env,
        });

        let stderr = "";
        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        if (cookieContent) {
          child.stdin.write(cookieContent);
          child.stdin.end();
        }

        child.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(stderr || `yt-dlp process exited with code ${code}`));
          }
        });

        child.on("error", (err) => {
          reject(err);
        });
      });

      // Locate the merged MP4 file generated in tempDir
      const allFiles = await fsPromises.readdir(tempDir);
      const generatedFilename = allFiles.find((f) => f.startsWith(filePrefix));
      if (!generatedFilename) {
        throw new Error("Merged file was not generated by yt-dlp.");
      }

      const generatedFilePath = join(tempDir, generatedFilename);
      const stats = await fsPromises.stat(generatedFilePath);

      const responseHeaders = new Headers();
      responseHeaders.set("Content-Type", "video/mp4");
      responseHeaders.set("Content-Disposition", `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodedFilename}`);
      responseHeaders.set("Content-Length", stats.size.toString());
      responseHeaders.set("Cache-Control", "no-cache");

      const nodeStream = createReadStream(generatedFilePath);
      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk) => {
            controller.enqueue(chunk);
          });
          nodeStream.on("end", () => {
            controller.close();
            fsPromises.unlink(generatedFilePath).catch(() => {});
          });
          nodeStream.on("error", (err) => {
            controller.error(err);
            fsPromises.unlink(generatedFilePath).catch(() => {});
          });
        },
        cancel() {
          nodeStream.destroy();
          fsPromises.unlink(generatedFilePath).catch(() => {});
        },
      });

      return new Response(webStream, {
        status: 200,
        headers: responseHeaders,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Merged streaming failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // 2. Direct Media Stream Delivery Mode (Single Files & Manifest-Free Streams)
  if (!targetUrl) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid protocol. Only HTTP and HTTPS are supported." }, { status: 400 });
    }

    if (isPrivateIp(parsed.hostname)) {
      return NextResponse.json({ error: "Access to private or local network is forbidden." }, { status: 403 });
    }

    const customReferer = searchParams.get("referer");
    const statusMap = getExtensionStatusMap();
    const disabledIds = new Set(Object.keys(statusMap).filter(k => !statusMap[k]));
    const extension = registry.findExtensionByDomain(parsed.hostname, disabledIds);
    const resolvedReferer = customReferer || extension?.manifest?.imageReferer;

    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      ...(resolvedReferer ? { Referer: resolvedReferer } : {}),
    };

    const originRes = await fetch(targetUrl, { headers });

    if (!originRes.ok) {
      return NextResponse.json(
        { error: `Origin server responded with HTTP ${originRes.status}` },
        { status: originRes.status }
      );
    }

    const contentType = originRes.headers.get("content-type") || "application/octet-stream";
    const contentLength = originRes.headers.get("content-length");

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Content-Disposition", `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodedFilename}`);
    responseHeaders.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=43200");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    return new Response(originRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Streaming failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
