<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MediaDL Repository Guidelines for AI Agents

## 🧩 Core Architecture Rules
1. **Extension Boundary**: All platform-specific scrapers must live inside `extensions/` as isolated modules implementing `DownloaderExtension`. **Never import anything from outside `extensions/` into an extension module.**
2. **Core yt-dlp Engine**: Universal video/audio downloads and multi-resolution format parsing (`lib/ytdlpCore.ts`) act as the core fallback engine when no platform extension matches or succeeds.
   - Always filter out HLS/DASH manifest playlists (`.m3u8`, `.mpd`) from direct download candidates so direct media streams (`videoplayback`, progressive MP4) are delivered.
   - Separate progressive formats with audio from silent DASH video-only streams and audio-only streams.
3. **Cookie Handling & Rotation**:
   - Core yt-dlp cookies are managed globally in database (`cookies_config` with provider `'yt-dlp'` and target `domains`).
   - Extension cookies are managed per extension.
   - When passing cookies to `yt-dlp`, always pipe them **in-memory via stdin (`--cookies -`)** without writing temporary cookie files to disk.
4. **Smart Anti-Bot (FlareSolverr)**: Do not hardcode domain lists or use manual manifests for FlareSolverr. Rely on lazy auto-detection (triggering FlareSolverr only when a Cloudflare challenge or `403/503` block is encountered).
5. **No Hardcoded Platform Domains in Core Logic**:
   - Never embed rigid platform domain checks (e.g. `if (url.includes('youtube'))`) inside core route handlers or utility libraries.
   - All domain knowledge, anti-hotlink referrers, and headers must reside strictly inside `extensions/` manifests (`allowedImageDomains`, `imageReferer`) or in a well-defined centralized policy pattern, resolved dynamically via `ExtensionRegistry`.
6. **Streaming & Download Delivery (`/api/stream`)**:
   - Always stream external media via `/api/stream` with `Content-Disposition: attachment` to bypass client browser CORS restrictions and prevent raw `.m3u8` manifest text files from being saved as broken video files.
7. **Next.js 16 Conventions**:
   - In Next.js 16, route interception and redirects use `proxy.ts` (named function `proxy`), replacing legacy `middleware.ts`.
   - Keep Server Components free of uncached dynamic data calls outside `<Suspense>` to ensure clean builds.
