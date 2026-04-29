CREATE TABLE `expense_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`expense_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`row_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`expense_id`) REFERENCES `expense`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `expense_items` (`expense_id`, `amount`, `description`, `row_order`)
SELECT `id`, `amount`, `description`, 0
FROM `expense`;
