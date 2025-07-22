PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_invoices` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`type` text DEFAULT 'Invoice' NOT NULL,
	`status` text DEFAULT 'Unpaid' NOT NULL,
	`work_status` text DEFAULT 'Pending' NOT NULL,
	`total_amount` integer NOT NULL,
	`amount_due` integer NOT NULL,
	`created_at` integer DEFAULT (STRFTIME('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_invoices`("id", "user_id", "customer_id", "status", "work_status", "total_amount", "amount_due", "created_at") SELECT "id", "user_id", "customer_id", "status", "work_status", "total_amount", "amount_due", "created_at" FROM `invoices`;--> statement-breakpoint
DROP TABLE `invoices`;--> statement-breakpoint
ALTER TABLE `__new_invoices` RENAME TO `invoices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` integer PRIMARY KEY NOT NULL,
	`invoice_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text DEFAULT 'Payment' NOT NULL,
	`amount` integer NOT NULL,
	`method` text,
	`note` text,
	`created_at` integer DEFAULT (STRFTIME('%s', 'now')) NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "invoice_id", "user_id", "kind", "amount", "method", "note", "created_at") SELECT "id", "invoice_id", "user_id", "kind", "amount", "method", "note", "created_at" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;