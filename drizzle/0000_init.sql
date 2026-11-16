CREATE TABLE IF NOT EXISTS `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text DEFAULT 'Administrator' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `cookies_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text DEFAULT 'instagram' NOT NULL,
	`name` text NOT NULL,
	`domains` text,
	`cookie_content` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`fail_count` integer DEFAULT 0 NOT NULL,
	`last_used_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `fetch_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`provider` text DEFAULT 'instagram' NOT NULL,
	`status` text NOT NULL,
	`status_code` integer NOT NULL,
	`error_message` text,
	`cookie_name` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `rate_limits` (
	`client_key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`reset_time` integer NOT NULL
);
