CREATE TABLE `sale_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleRecordId` int NOT NULL,
	`documentType` enum('documentacao_cartorio','comprovante_pagamento') NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(512) NOT NULL,
	`originalName` varchar(255),
	`uploadedAt` bigint NOT NULL,
	CONSTRAINT `sale_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sale_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`licensePlate` varchar(20) NOT NULL,
	`status` enum('aguardando_financeiro','aguardando_administrativo','liberado_para_entrega','reprovado') NOT NULL DEFAULT 'aguardando_financeiro',
	`rejectionReason` text,
	`rejectedBy` varchar(64),
	`sellerId` int NOT NULL,
	`sellerName` text,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `sale_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','vendedor','financeiro','administrativo') NOT NULL DEFAULT 'user';