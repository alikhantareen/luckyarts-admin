CREATE TABLE `customers` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`phone` text
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`status` text DEFAULT 'Unpaid' NOT NULL,
	`work_status` text DEFAULT 'Pending' NOT NULL,
	`total_amount` integer NOT NULL,
	`amount_due` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` integer PRIMARY KEY NOT NULL,
	`invoice_id` integer,
	`name` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`quantity` integer NOT NULL,
	`discount` integer,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY NOT NULL,
	`invoice_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text DEFAULT 'Payment' NOT NULL,
	`amount` integer NOT NULL,
	`method` text,
	`note` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL
);
