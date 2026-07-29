ALTER TABLE `inspection_checklists` ADD `responsibleRole` enum('financeiro','administrativo') DEFAULT 'financeiro' NOT NULL;--> statement-breakpoint
ALTER TABLE `sale_records` ADD `financialStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `sale_records` ADD `financialRejectionReason` text;--> statement-breakpoint
ALTER TABLE `sale_records` ADD `adminStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `sale_records` ADD `adminRejectionReason` text;