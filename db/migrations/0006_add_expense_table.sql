CREATE TABLE `expense` (
	`id` integer PRIMARY KEY NOT NULL,
	`shop_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`created_at` integer DEFAULT (STRFTIME('%s', 'now')) NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
