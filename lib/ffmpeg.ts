import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

let cachedFFmpegPath: string | null = null;
let isFFmpegChecked = false;

/**
 * Resolves the available FFmpeg executable path.
 * Checks:
 * 1. Explicit FFMPEG_PATH environment variable
 * 2. Standard system locations (/usr/local/bin/ffmpeg, /opt/homebrew/bin/ffmpeg, /usr/bin/ffmpeg, PATH)
 * Returns null if FFmpeg is unavailable or non-executable.
 */
export function getFFmpegPath(): string | null {
  if (isFFmpegChecked) return cachedFFmpegPath;
  isFFmpegChecked = true;

  // 1. Explicit path in environment variables
  const envPath = process.env.FFMPEG_PATH?.trim();
  if (envPath && existsSync(envPath)) {
    try {
      execFileSync(envPath, ["-version"], { timeout: 3000, stdio: "ignore" });
      cachedFFmpegPath = envPath;
      return cachedFFmpegPath;
    } catch {
      // not executable
    }
  }

  // 2. Standard system paths and PATH lookup
  const candidates = [
    "ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
  ];

  for (const candidate of candidates) {
    try {
      execFileSync(/*turbopackIgnore: true*/ candidate, ["-version"], { timeout: 3000, stdio: "ignore" });
      cachedFFmpegPath = candidate;
      return cachedFFmpegPath;
    } catch {
      // continue to next candidate
    }
  }

  cachedFFmpegPath = null;
  return null;
}

/**
 * Returns true if FFmpeg is available and executable.
 */
export function isFFmpegAvailable(): boolean {
  return Boolean(getFFmpegPath());
}
