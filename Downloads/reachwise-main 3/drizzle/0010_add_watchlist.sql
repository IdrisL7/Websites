CREATE TABLE IF NOT EXISTS `watchlist` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
	`company_url` text NOT NULL,
	`company_name` text,
	`created_at` text NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `watchlist_user_id_idx` ON `watchlist` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `watchlist_user_company_idx` ON `watchlist` (`user_id`, `company_url`);
