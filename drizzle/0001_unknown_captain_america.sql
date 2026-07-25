CREATE TABLE `sale_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleRecordId` int NOT NULL,
	`documentType` enum('cartorio','payment') NOT NULL,
	`filename` varchar(255) NOT NULL,
	`fileKey` text NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(100) DEFAULT 'application/pdf',
	`fileSize` int,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sale_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sale_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendedorId` int NOT NULL,
	`customerName` text,
	`customerContact` varchar(320),
	`vehicleModel` text,
	`vehicleYear` int,
	`vehicleColor` text,
	`vehiclePrice` decimal(12,2),
	`status` enum('pending_financial','approved_financial','rejected_financial','pending_admin','approved_admin','rejected_admin','ready_for_delivery') NOT NULL DEFAULT 'pending_financial',
	`rejectionReason` text,
	`financialReviewedBy` int,
	`financialReviewedAt` timestamp,
	`adminReviewedBy` int,
	`adminReviewedAt` timestamp,
	`publicToken` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sale_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `sale_records_publicToken_unique` UNIQUE(`publicToken`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','vendedor','financeiro','administrativo') NOT NULL DEFAULT 'vendedor';--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);