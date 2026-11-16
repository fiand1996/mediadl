# Cookie Handling & Rotation Architecture

**MediaDL** features a robust, database-driven cookie management and rotation system designed to handle authenticated requests, bypass rate limits, and navigate anti-bot protections (such as Cloudflare challenges) across native platform extensions and universal `yt-dlp` extractions.

---

## 🏗️ Overview & Architecture

Cookie handling is split into two distinct tiers:

1. **Extension-Specific Cookies**: Managed via individual extension settings and utilized by platform-specific scrapers (e.g., Instagram, Pixiv, E-Hentai).
2. **`yt-dlp` Cookies**: Managed globally via the **Cookie Manager** (`/admin/cookies`), supporting domain-matched routing and automatic rotation for universal video/audio extractions.

---

## 🗄️ Database Schema (`cookies_config`)

Cookies are securely stored in SQLite using Drizzle ORM (`db/schema.ts`):

```typescript
export const cookiesConfig = sqliteTable("cookies_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider").notNull().default("instagram"), // 'instagram' | 'yt-dlp' | etc.
  name: text("name").notNull(), // Account label (e.g. "Primary YouTube Burner")
  domains: text("domains"), // Target domains for yt-dlp cookies (e.g. "youtube.com,youtu.be")
  cookieContent: text("cookie_content").notNull(), // Raw Netscape HTTP cookie text content
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  failCount: integer("fail_count").notNull().default(0), // Consecutive failure tracking for rotation
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

---

## 🔄 `yt-dlp` Cookie Routing & Domain Matching

When a user submits a generic video URL, the backend (`lib/ytdlpCookieRotator.ts`) dynamically resolves the appropriate cookie:

1. **Hostname Extraction**: Parses the target URL hostname (e.g., `www.youtube.com` $\rightarrow$ `youtube.com`).
2. **Domain Filtering**: Queries active `yt-dlp` cookies from the database and matches them against the target hostname (supporting both exact matches and wildcard subdomains). If no domain restriction is set, the cookie acts globally.
3. **Smart Rotation**: Sorts matching active accounts by the lowest `failCount` and oldest `lastUsedAt` timestamp to evenly distribute request load and prevent rate-limiting bans.

---

## 🛡️ FlareSolverr & Automated Cookie Merging

For sites protected by Cloudflare or advanced anti-bot firewalls:

1. **Lazy Auto-Detection**: The system initially attempts a standard direct request. If a Cloudflare challenge (`403`, `503`, `401`, or challenge HTML signatures) is encountered, **FlareSolverr** is automatically triggered behind the scenes.
2. **In-Memory Cookie Merging**:
   - Manual user cookies (from the Database Cookie Manager) and automated session cookies (from FlareSolverr) are merged dynamically **in-memory**.
   - **No Temp Files**: Rather than writing temporary `.txt` files to disk, the combined Netscape cookie content is piped directly into `yt-dlp` via **Standard Input (`stdin`)** using `--cookies -`.

---

## 🩺 Health & Failure Recovery

- **Success Reset**: When an extraction succeeds using a specific cookie, `markCookieSuccess()` resets its `failCount` to `0` and updates `lastUsedAt`.
- **Failure Quarantine**: If an extraction fails, `markCookieFail()` increments the account's `failCount`. If an account fails 3 times consecutively, `isActive` is automatically toggled to `false` (temporary quarantine) so the router falls back to the next healthy burner account.

---

## 🔗 Related Documentation

- [Running and Environment Configuration Guide](./running-and-env.md) - Learn how to run MediaDL locally or via Docker and configure environment variables.
- [Architecture & System Design](./architecture.md) - Learn about the decoupled extension registry, core `yt-dlp` engine, and streaming proxy.
