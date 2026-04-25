ALTER TABLE `expense` ADD `display_number` integer;--> statement-breakpoint
UPDATE expense
SET display_number = (
	SELECT COUNT(*)
	FROM expense AS e2
	WHERE e2.shop_id = expense.shop_id
		AND (
			e2.created_at < expense.created_at
			OR (e2.created_at = expense.created_at AND e2.id <= expense.id)
		)
)
WHERE display_number IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `expense_shop_display_number_idx` ON `expense` (`shop_id`,`display_number`);
