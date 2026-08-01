
-- 0000_far_jamie_braddock.sql
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);


-- 0001_unknown_captain_america.sql
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

-- 0002_inspection_checklist.sql
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


-- 0002_silent_kang.sql
CREATE TABLE `approval_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleRecordId` int NOT NULL,
	`actionType` enum('created','financial_approved','financial_rejected','admin_approved','admin_rejected') NOT NULL,
	`userRole` enum('vendedor','financeiro','administrativo') NOT NULL,
	`userId` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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


-- 0003_milky_marrow.sql
ALTER TABLE `sale_records` ADD `vehiclePlate` varchar(20);--> statement-breakpoint
ALTER TABLE `sale_records` ADD `vehicleKm` int;

-- 0004_slim_pixie.sql
ALTER TABLE `sale_records` DROP COLUMN `vehicleColor`;

-- 0005_romantic_christian_walker.sql
ALTER TABLE `inspection_checklists` ADD `responsibleRole` enum('financeiro','administrativo') DEFAULT 'financeiro' NOT NULL;--> statement-breakpoint
ALTER TABLE `sale_records` ADD `financialStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `sale_records` ADD `financialRejectionReason` text;--> statement-breakpoint
ALTER TABLE `sale_records` ADD `adminStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `sale_records` ADD `adminRejectionReason` text;

-- 0006_broken_blink.sql
ALTER TABLE `sale_records` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `sale_records` DROP COLUMN `rejectionReason`;

-- 0007_living_vivisector.sql
CREATE TABLE `administrative_checklist_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleRecordId` int NOT NULL,
	`department` enum('financeiro','administrativo') NOT NULL,
	`step` int NOT NULL,
	`documentKey` varchar(64) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`fileKey` text NOT NULL,
	`fileUrl` longtext NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `administrative_checklist_documents_id` PRIMARY KEY(`id`)
);

