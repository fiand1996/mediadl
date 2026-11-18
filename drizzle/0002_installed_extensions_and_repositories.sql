CREATE TABLE `extension_repositories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `installed_extensions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`description` text,
	`url_patterns` text NOT NULL,
	`cookies_support` integer DEFAULT false NOT NULL,
	`cookies_required` integer DEFAULT false NOT NULL,
	`cookies_description` text,
	`allowed_image_domains` text,
	`image_referer` text,
	`bundle_code` text NOT NULL,
	`bundle_sha256` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`installed_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
