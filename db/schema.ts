import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Table to store fetch URL history logs
export const fetchLogs = sqliteTable("fetch_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  provider: text("provider").notNull().default("instagram"),
  status: text("status").notNull(), // 'success' | 'error'
  statusCode: integer("status_code").notNull(),
  errorMessage: text("error_message"),
  cookieUsed: text("cookie_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Table for cookies management (multiple per provider & rotation)
export const cookiesConfig = sqliteTable("cookies_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider").notNull().default("instagram"), // 'instagram' | 'yt-dlp' | etc.
  name: text("name").notNull(), // Account label name (e.g. "Main Burner Account")
  domains: text("domains"), // Comma-separated or JSON array of target domains for yt-dlp cookies
  cookieContent: text("cookie_content").notNull(), // Netscape cookies text content
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  failCount: integer("fail_count").notNull().default(0),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Table to store extension status (enabled/disabled)
export const extensionStates = sqliteTable("extension_states", {
  id: text("id").primaryKey(), // extension id e.g. 'instagram', 'pixiv'
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Table for rate limiting tracking (Client IP + Fingerprint)
export const rateLimits = sqliteTable("rate_limits", {
  clientKey: text("client_key").primaryKey(),
  count: integer("count").notNull().default(1),
  resetTime: integer("reset_time", { mode: "number" }).notNull(),
});

// Table for admin users (email/password with hashed password)
export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default("Administrator"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
