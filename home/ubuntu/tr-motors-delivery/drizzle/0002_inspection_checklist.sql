CREATE TABLE `inspection_checklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleRecordId` int NOT NULL,
	`itemName` text NOT NULL,
	`itemDescription` text,
	`status` enum('pending','ok','issue') NOT NULL DEFAULT 'pending',
	`notes` text,
	`filledBy` int,
	`filledAt` timestamp,
	`validatedByFinanceiro` int,
	`validatedByFinanceiroAt` timestamp,
	`validatedByAdmin` int,
	`validatedByAdminAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspection_checklists_id` PRIMARY KEY(`id`)
);
