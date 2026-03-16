CREATE TABLE IF NOT EXISTS `user_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
	`hook_text` text NOT NULL,
	`angle` text CHECK(`angle` IN ('trigger', 'risk', 'tradeoff')),
	`company_url` text,
	`company_name` text,
	`note` text,
	`created_at` text NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_templates_user_id_idx` ON `user_templates` (`user_id`);
