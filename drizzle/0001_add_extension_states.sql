CREATE TABLE IF NOT EXISTS `extension_states` (
	`id` text PRIMARY KEY NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL
);
