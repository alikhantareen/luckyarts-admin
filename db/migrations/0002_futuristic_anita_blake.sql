CREATE TABLE `shops` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
INSERT INTO shops (id, name) VALUES (1, 'Main Shop');
--> statement-breakpoint
ALTER TABLE `customers` ADD `shop_id` integer NOT NULL DEFAULT 1 REFERENCES shops(id);--> statement-breakpoint
ALTER TABLE `invoices` ADD `shop_id` integer NOT NULL DEFAULT 1 REFERENCES shops(id);--> statement-breakpoint
ALTER TABLE `items` ADD `shop_id` integer NOT NULL DEFAULT 1 REFERENCES shops(id);--> statement-breakpoint
ALTER TABLE `transactions` ADD `shop_id` integer NOT NULL DEFAULT 1 REFERENCES shops(id);--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'ShopAdmin' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `shop_id` integer DEFAULT 1 REFERENCES shops(id);
