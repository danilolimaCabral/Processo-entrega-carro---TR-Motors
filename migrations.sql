-- Full schema migration for TR Motors - Controle de Entrega de Veículos
-- Generated from drizzle/schema.ts

-- Drop existing tables (safe since we recreate everything)
DROP TABLE IF EXISTS `erp_modules`;
DROP TABLE IF EXISTS `administrative_checklist_documents`;
DROP TABLE IF EXISTS `approval_history`;
DROP TABLE IF EXISTS `inspection_checklists`;
DROP TABLE IF EXISTS `sale_documents`;
DROP TABLE IF EXISTS `sale_records`;
DROP TABLE IF EXISTS `users`;

-- Users table
CREATE TABLE `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(64),
  `passwordHash` text,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('admin','vendedor','financeiro','administrativo') NOT NULL DEFAULT 'vendedor',
  `isActive` boolean DEFAULT true NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
  CONSTRAINT `users_email_unique` UNIQUE(`email`)
);

-- Sale records table
CREATE TABLE `sale_records` (
  `id` int AUTO_INCREMENT NOT NULL,
  `vendedorId` int NOT NULL,
  `customerName` text,
  `customerContact` varchar(320),
  `vehicleModel` text,
  `vehicleYear` int,
  `vehiclePlate` varchar(20),
  `vehicleKm` int,
  `vehiclePrice` decimal(12,2),
  `financialStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL,
  `financialRejectionReason` text,
  `financialReviewedBy` int,
  `financialReviewedAt` timestamp,
  `adminStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL,
  `adminRejectionReason` text,
  `adminReviewedBy` int,
  `adminReviewedAt` timestamp,
  `publicToken` varchar(64) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `sale_records_id` PRIMARY KEY(`id`),
  CONSTRAINT `sale_records_publicToken_unique` UNIQUE(`publicToken`)
);

-- Sale documents table
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

-- Inspection checklists table
CREATE TABLE `inspection_checklists` (
  `id` int AUTO_INCREMENT NOT NULL,
  `saleRecordId` int NOT NULL,
  `responsibleRole` enum('financeiro','administrativo') DEFAULT 'financeiro' NOT NULL,
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

-- Approval history table
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

-- Administrative checklist documents table
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

-- ERP Modules table
CREATE TABLE `erp_modules` (
  `id` int AUTO_INCREMENT NOT NULL,
  `moduleKey` varchar(64) NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `icon` varchar(64) DEFAULT 'FileText',
  `route` varchar(255),
  `allowedRoles` text,
  `isActive` boolean DEFAULT true NOT NULL,
  `sortOrder` int DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `erp_modules_id` PRIMARY KEY(`id`),
  CONSTRAINT `erp_modules_moduleKey_unique` UNIQUE(`moduleKey`)
);

-- Seed test users (password: 123456, bcrypt hash)
INSERT INTO `users` (`openId`, `passwordHash`, `name`, `email`, `loginMethod`, `role`, `isActive`) VALUES
(NULL, '$2b$10$pSbg1ttcrfYNe0pj1i3snOzuw9.EVdtIW0uegZ32dudByS.JJOYSq', 'Administrador', 'admin@test.com', 'local', 'admin', true),
(NULL, '$2b$10$pSbg1ttcrfYNe0pj1i3snOzuw9.EVdtIW0uegZ32dudByS.JJOYSq', 'Vendedor', 'vendedor@test.com', 'local', 'vendedor', true),
(NULL, '$2b$10$pSbg1ttcrfYNe0pj1i3snOzuw9.EVdtIW0uegZ32dudByS.JJOYSq', 'Financeiro', 'financeiro@test.com', 'local', 'financeiro', true),
(NULL, '$2b$10$pSbg1ttcrfYNe0pj1i3snOzuw9.EVdtIW0uegZ32dudByS.JJOYSq', 'Administrativo', 'administrativo@test.com', 'local', 'administrativo', true);
