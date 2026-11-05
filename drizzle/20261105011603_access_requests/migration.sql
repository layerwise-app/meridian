CREATE TABLE `access_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`visitor_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `access_requests` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`organization` text NOT NULL,
	`intended_use` text NOT NULL,
	`created_at` integer NOT NULL,
	`owner_notified_at` integer
);
--> statement-breakpoint
CREATE TABLE `site_secrets` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `access_attempts_visitor_created_idx` ON `access_attempts` (`visitor_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `access_requests_owner_notified_at_idx` ON `access_requests` (`owner_notified_at`);