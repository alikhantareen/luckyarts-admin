CREATE TABLE `shops` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
INSERT INTO shops (id, name) VALUES (1, 'Main Shop');
--> statement-breakpoint
ALTER TABLE `customers` ADD `shop_id` integer REFERENCES shops(id);--> statement-breakpoint
UPDATE `customers` SET `shop_id` = 1;--> statement-breakpoint
ALTER TABLE `invoices` ADD `shop_id` integer REFERENCES shops(id);--> statement-breakpoint
UPDATE `invoices` SET `shop_id` = 1;--> statement-breakpoint
ALTER TABLE `items` ADD `shop_id` integer REFERENCES shops(id);--> statement-breakpoint
UPDATE `items` SET `shop_id` = 1;--> statement-breakpoint
ALTER TABLE `transactions` ADD `shop_id` integer REFERENCES shops(id);--> statement-breakpoint
UPDATE `transactions` SET `shop_id` = 1;--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'SuperAdmin' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `shop_id` integer REFERENCES shops(id);--> statement-breakpoint
UPDATE `users` SET `shop_id` = 1;
