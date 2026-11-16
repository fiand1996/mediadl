# MediaDL Architecture & System Design

**MediaDL** is a modern, fast, and extensible multi-platform media downloader built with Next.js App Router, TypeScript, Tailwind CSS, and SQLite (via Drizzle ORM).

This document outlines the overall architecture, design patterns, and internal data flow of the application.

---

## 🏛️ High-Level Architecture

The application is built around a **Decoupled Plugin & Engine Pattern**, ensuring that the core application remains lightweight and agnostic of platform-specific scraping quirks.

```
Incoming Request (URL)
       │
       ▼
 ┌───────────┐     Match URL Pattern     ┌──────────────────────────┐
 │  Registry │ ────────────────────────> │ Platform Extension       │
 └───────────%                           │ (Instagram, Pixiv, etc.) │
       │                                 └──────────────────────────┘
       │ No match / Platform error
       ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │ Core Engine: yt-dlp Universal Fallback                           │
 │ (Domain-Matched Cookie Rotation + FlareSolverr Cloudflare Bypass)│
 └──────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Key Architectural Modules

### 1. Extension Registry (`extensions/`)

Instead of monolithic platform scrapers, MediaDL treats each platform as an isolated extension:

- **Base Extension (`extensions/core/base.ts`)**: Provides standardized HTTP request methods, automated cookie injection, sanitization, and **Smart Auto-Detect Cloudflare Challenge (Lazy Fallback)**.
- **Platform Modules (`extensions/instagram/`, `extensions/pixiv/`, etc.)**: Implement platform-specific parsing (e.g., mobile API extraction for Instagram, AJAX JSON parsing for Pixiv).
- **Extension Registry (`extensions/registry.ts`)**: Automatically discovers registered modules and maps incoming URLs against regex patterns (`urlPatterns`).

### 2. Core `yt-dlp` Universal Fallback (`lib/ytdlpCore.ts`)

For generic video URLs (YouTube, Vimeo, Twitter/X, TikTok, etc.) or when a platform extension fails:

- Executes `yt-dlp` as a standalone binary child process.
- **Resolution Selector (`extractAllFormats`)**: Parses all available video/audio streams and returns multi-resolution options (`1080p`, `720p`, `Audio Only`, etc.) to the frontend UI.
- **In-Memory Stdin Piping (`--cookies -`)**: Injects cookies directly into `yt-dlp` via memory stream without writing temporary cookie files to disk.

### 3. Database & Cookie Rotation (`db/` & `lib/`)

Powered by SQLite (`better-sqlite3`) and Drizzle ORM:

- **Fetch Logs (`fetch_logs`)**: Records extraction attempts, success/error statuses, and cookies utilized.
- **Cookie Manager (`cookies_config`)**:
  - **Core Cookies**: Manages global/domain-matched burner accounts for `yt-dlp` with automatic rotation (`failCount` and `lastUsedAt`).
  - **Extension Cookies**: Manages platform-specific session credentials (e.g., `PHPSESSID` for Pixiv).

### 4. Smart Anti-Bot & FlareSolverr Integration (`lib/flareSolverr.ts`)

- **Lazy Auto-Detection**: Standard requests are performed first for maximum performance. If a Cloudflare challenge or `403/503` block is encountered, the system lazily invokes FlareSolverr to solve the challenge and retrieve valid session cookies.
- **Combined Cookie Merging**: Combines manual database cookies and automated FlareSolverr cookies on the fly.

### 5. Media Streaming & Direct Attachment Delivery (`app/api/stream/route.ts`)

- **Anti-CORS Backend Streaming**: Acts as a lightweight proxy pipe for downloading binary video and audio files from external CDNs, bypassing browser cross-origin download restrictions.
- **Dynamic Referer Resolution**: Automatically queries `ExtensionRegistry` (`manifest.imageReferer`) to satisfy platform hotlink-protection policies (e.g. Pixiv, Instagram) without embedding static hardcoded domain checks in core handlers.
- **Manifest vs. Binary Enforcement**: Discards HLS/DASH manifest playlists (`.m3u8`, `.mpd`) from direct download selections so client downloads receive full binary media (`.mp4`, `.webm`, `.m4a`), preventing corrupted 26 KB playlist text downloads.
- **SSRF Hardening**: Rejects loopback, link-local, and private RFC-1918 IPv4/IPv6 address targets.

---

## 🔄 Request Lifecycle (`/api/download` & `/api/stream`)

1. **Rate Limiting & Anti-Bot Protection**: Incoming requests are fingerprinted and rate-limited. Automated scrapers (Python requests, Postman) are blocked.
2. **Registry Dispatch**: The backend asks `ExtensionRegistry` if any platform extension owns the target URL.
3. **Platform Extraction**: If matched, the extension executes its `extract()` method using domain cookies. If successful, results are returned.
4. **yt-dlp Fallback**: If no extension matches or extraction fails, the request falls back to the `yt-dlp` core engine.
5. **Format Parsing & Response**: Media metadata and multi-resolution format options (including Audio Only and Progressive streams) are returned to the `ResultCard` component.
6. **Streaming & Download Trigger**: When the user clicks download or packages a ZIP archive, requests are piped through `/api/stream` with `Content-Disposition: attachment` to initiate immediate binary file downloads with exact container extensions.

---

## 🔗 Related Documentation

- [Running and Environment Configuration Guide](./running-and-env.md) - Learn how to run MediaDL locally or via Docker (`ghcr.io/fiand1996/mediadl:latest`) and configure environment variables.
- [Cookie Management & Architecture](./cookie.md) - Learn how platform burner cookies and Netscape cookie rotation work.
