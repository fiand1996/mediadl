# MediaDL Architecture & System Design

**MediaDL** is a modern, fast, and extensible multi-platform media downloader built with Next.js App Router, TypeScript, Tailwind CSS, and SQLite (via Drizzle ORM).

This document outlines the overall architecture, design patterns, and internal data flow of the application.

---

## 🏛️ High-Level Architecture

The application is built around a **3-Tier Priority Execution Pipeline**, ensuring optimal performance, platform-specific customization, and broad site coverage:

```
Incoming Request (URL)
       │
       ▼
 ┌───────────┐     Match URL Pattern     ┌──────────────────────────┐
 │  Registry │ ────────────────────────> │ Priority 1: Extensions   │
 └───────────┘                           │ (Instagram, Pixiv, etc.) │
       │                                 └──────────────────────────┘
       │ No extension matched                          │
       ▼                                               │ (If fails: STOP,
 ┌───────────────────────────┐     Domain in JSON     │  no fallback)
 │ galleryDlMatcher          │ ─────────────────────> ┌──────────────────────────────┐
 └───────────────────────────┘                        │ Priority 2: gallery-dl       │
       │                                              │ (350+ Photo / Art / Boorus)  │
       │ Not a gallery site                           └──────────────────────────────┘
       │                                                             │
       ▼                                                             │ (If fails: STOP,
 ┌─────────────────────────────────────────────────────────────┐     │  no fallback)
 │ Priority 3: yt-dlp Universal Fallback                       │ <───┘ (Excluded)
 │ (Universal Video/Audio Streaming Platforms)                 │
 └─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Key Architectural Modules

### 1. Decoupled Extension System (`lib/extensionRegistry.ts`, `lib/extensionRuntime.ts`, `mediadl-extensions`)

Instead of monolithic platform scrapers inside the core repository, MediaDL uses a decoupled extension system:

- **External Repository (`mediadl-extensions`)**: Extensions are developed, maintained, and bundled in a separate repository with automated CI/CD compiling to `dist/<id>.js` and `dist/index.json`.
- **Database Storage (`installed_extensions`)**: Installed extensions are persisted directly in SQLite with version tracking, regex patterns, cookie configurations, and compiled bundles.
- **Sandboxed VM Runtime (`lib/extensionRuntime.ts`)**: Evaluates extension bundles inside an isolated Node.js VM context with NO access to `process.env` or server files. Network concerns (FlareSolverr anti-bot, proxies) are managed transparently by the host application via `context.fetch`.
- **Dynamic Extension Registry (`lib/extensionRegistry.ts`)**: Automatically routes incoming requests to active installed extensions based on regex patterns.
- **Admin Marketplace**: Manage installed scrapers, toggle active/disabled status, update to newer versions, or install community extensions via the dashboard.
- **Exclusive Authority & Terminating Fallback**: Extensions take strict Priority 1. If an active extension matches an incoming URL, it processes the request exclusively. If disabled, fallback continues to `gallery-dl` and `yt-dlp`.

### 2. `gallery-dl` Gallery & Image Engine (`lib/galleryDlCore.ts` & `lib/galleryDlMatcher.ts`)

For image-heavy platforms, boorus, manga, comics, and art communities:

- **0ms In-Memory Domain Matcher (`lib/galleryDlMatcher.ts`)**: Pre-indexes over 350 supported sites from `galleryDlSupportedSites.json`.
- **Item Limit Safety**: Applies `--range 1-${maxItems}` via `GALLERY_DL_MAX_ITEMS` (default `50`) to prevent runaway memory usage on massive galleries.
- **Cross-Platform Transient Cookies**: Automatically writes Netscape cookies to the platform-native temporary directory (`os.tmpdir()` or `GALLERY_DL_TEMP_DIR`) and guarantees instant cleanup in `finally`.
- **Decisive Error Handling**: If a URL belongs to a gallery site and extraction fails, execution halts immediately without forwarding to `yt-dlp`.

### 3. Core `yt-dlp` Universal Fallback (`lib/ytdlpCore.ts`)

For generic video and audio URLs (YouTube, Vimeo, Twitter/X, TikTok, Facebook, etc.) that are neither handled by an extension nor covered by `gallery-dl`:

- Executes `yt-dlp` as a standalone binary child process.
- **Resolution Selector (`extractAllFormats`)**: Parses all available video/audio streams and returns multi-resolution options (`1080p`, `720p`, `Audio Only`, etc.) to the frontend UI.
- **In-Memory Stdin Piping (`--cookies -`)**: Injects cookies directly into `yt-dlp` via memory stream without writing temporary cookie files to disk.

### 4. Database & Cookie Rotation (`db/` & `lib/`)

Powered by SQLite (`better-sqlite3`) and Drizzle ORM:

- **Fetch Logs (`fetch_logs`)**: Records extraction attempts, success/error statuses, and cookies utilized.
- **Cookie Manager (`cookies_config`)**:
  - **Engine Profiles (`yt-dlp` & `gallery-dl`)**: Manages domain-matched burner accounts with automatic fair rotation based on `failCount` and `lastUsedAt`.
  - **Extension Cookies**: Manages platform-specific session credentials (e.g., `PHPSESSID` for Pixiv, sessionid for Instagram).

### 5. Smart Anti-Bot & FlareSolverr Integration (`lib/flareSolverr.ts`)

- **Lazy Auto-Detection**: Standard requests are performed first for maximum performance. If a Cloudflare challenge or `403/503` block is encountered, the system lazily invokes FlareSolverr to solve the challenge and retrieve valid session cookies.
- **Combined Cookie Merging**: Combines manual database cookies and automated FlareSolverr cookies on the fly.

### 6. Media Streaming & Direct Attachment Delivery (`app/api/stream/route.ts`)

- **Anti-CORS Backend Streaming**: Acts as a lightweight proxy pipe for downloading binary video and audio files from external CDNs, bypassing browser cross-origin download restrictions.
- **Dynamic Referer Resolution**: Automatically queries `ExtensionRegistry` (`manifest.imageReferer`) and passes custom referers to satisfy platform hotlink-protection policies (e.g. Pixiv, Danbooru) without embedding static hardcoded domain checks in core handlers.
- **Manifest vs. Binary Enforcement**: Discards HLS/DASH manifest playlists (`.m3u8`, `.mpd`) from direct download selections so client downloads receive full binary media (`.mp4`, `.webm`, `.m4a`), preventing corrupted 26 KB playlist text downloads.
- **SSRF Hardening**: Rejects loopback, link-local, and private RFC-1918 IPv4/IPv6 address targets.

---

## 🔄 Request Lifecycle (`/api/download` & `/api/stream`)

1. **Rate Limiting & Anti-Bot Protection**: Incoming requests are fingerprinted and rate-limited. Automated scrapers (Python requests, Postman) are blocked.
2. **Priority 1 (Registry Dispatch)**: The backend asks `ExtensionRegistry` if any platform extension owns the target URL. If matched, it extracts media using extension cookies. If extraction fails, execution halts immediately with an error response (terminating, never falling back to `gallery-dl` or `yt-dlp`).
3. **Priority 2 (gallery-dl Match & Extraction)**: If no extension matched, `galleryDlMatcher` checks if the domain belongs to any of the 350+ supported gallery sites. If matched, `gallery-dl` processes the media. Any failure here terminates immediately with an error response.
4. **Priority 3 (yt-dlp Fallback)**: If the URL is neither an extension nor a gallery site, it falls back to the `yt-dlp` universal engine.
5. **Format Parsing & Response**: Media metadata and multi-resolution format options (including Audio Only, progressive streams, or carousel galleries) are returned to the `ResultCard` component.
6. **Streaming & Download Trigger**: When the user clicks download or packages a ZIP archive, requests are piped through `/api/stream` with `Content-Disposition: attachment` to initiate immediate binary file downloads with exact container extensions.

---

## 🔗 Related Documentation

- [Running and Environment Configuration Guide](./running-and-env.md) - Learn how to run MediaDL locally or via Docker (`ghcr.io/fiand1996/mediadl:latest`) and configure environment variables.
- [Cookie Management & Architecture](./cookie.md) - Learn how platform burner cookies and Netscape cookie rotation work.
