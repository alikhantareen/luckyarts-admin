ALTER TABLE `invoices` ADD `display_number` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `shop_type_display_number_idx` ON `invoices` (`shop_id`,`type`,`display_number`);