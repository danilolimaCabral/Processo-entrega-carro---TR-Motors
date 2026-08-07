-- Full schema migration for TR Motors - Controle de Entrega de Veículos
-- Generated from drizzle/schema.ts

-- Drop existing tables (safe since we recreate everything)
DROP TABLE IF EXISTS `rh_holidays`;
DROP TABLE IF EXISTS `rh_attendance`;
DROP TABLE IF EXISTS `rh_leave_requests`;
DROP TABLE IF EXISTS `rh_employees`;
DROP TABLE IF EXISTS `rh_positions`;
DROP TABLE IF EXISTS `rh_departments`;
DROP TABLE IF EXISTS `despachante_documents`;
DROP TABLE IF EXISTS `inspection_photos`;
DROP TABLE IF EXISTS `purchase_inspections`;
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

-- Purchase Inspections table
CREATE TABLE `purchase_inspections` (
  `id` int AUTO_INCREMENT NOT NULL,
  `createdBy` int NOT NULL,
  `ownerName` text,
  `ownerContact` varchar(320),
  `vehiclePlate` varchar(20),
  `vehicleBrand` text,
  `vehicleModel` text,
  `vehicleYear` int,
  `vehicleKm` int,
  `vehicleFuel` varchar(20),
  `vehicleColor` varchar(50),
  `fipeCode` varchar(20),
  `fipePrice` decimal(12,2),
  `engineCondition` enum('otimo','bom','regular','ruim','nao_verificado') DEFAULT 'nao_verificado' NOT NULL,
  `transmissionCondition` enum('otimo','bom','regular','ruim','nao_verificado') DEFAULT 'nao_verificado' NOT NULL,
  `bodyworkCondition` enum('otimo','bom','regular','ruim','nao_verificado') DEFAULT 'nao_verificado' NOT NULL,
  `interiorCondition` enum('otimo','bom','regular','ruim','nao_verificado') DEFAULT 'nao_verificado' NOT NULL,
  `tiresCondition` enum('otimo','bom','regular','ruim','nao_verificado') DEFAULT 'nao_verificado' NOT NULL,
  `suspensionCondition` enum('otimo','bom','regular','ruim','nao_verificado') DEFAULT 'nao_verificado' NOT NULL,
  `electricCondition` enum('otimo','bom','regular','ruim','nao_verificado') DEFAULT 'nao_verificado' NOT NULL,
  `generalNotes` longtext,
  `purchasePrice` decimal(12,2),
  `status` enum('rascunho','em_andamento','concluida','cancelada') DEFAULT 'rascunho' NOT NULL,
  `inspectorId` int,
  `inspectedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `purchase_inspections_id` PRIMARY KEY(`id`)
);

-- Despachante Documents table
CREATE TABLE `despachante_documents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `client_name` varchar(255) NOT NULL,
  `client_cpf` varchar(20) NOT NULL,
  `client_phone` varchar(20),
  `client_email` varchar(255),
  `vehicle_plate` varchar(10),
  `vehicle_brand` varchar(100),
  `vehicle_model` varchar(100),
  `vehicle_year` int,
  `doc_rg` boolean DEFAULT false,
  `doc_cpf` boolean DEFAULT false,
  `doc_comprovante_residencia` boolean DEFAULT false,
  `doc_cnh` boolean DEFAULT false,
  `doc_certificado_nascimento` boolean DEFAULT false,
  `doc_comprovante_pagamento` boolean DEFAULT false,
  `doc_poder_juridica` boolean DEFAULT false,
  `doc_dut` boolean DEFAULT false,
  `doc_outro` varchar(255),
  `service_transferencia` boolean DEFAULT false,
  `service_emplacamento` boolean DEFAULT false,
  `service_licenciamento` boolean DEFAULT false,
  `service_crv_crlv` boolean DEFAULT false,
  `service_cartorio` boolean DEFAULT false,
  `service_reconhecimento_firma` boolean DEFAULT false,
  `status` enum('pendente','documentos_coletados','em_processamento','cartorio','detran','concluido','cancelado') DEFAULT 'pendente',
  `sent_via_whatsapp` boolean DEFAULT false,
  `sent_via_email` boolean DEFAULT false,
  `whatsapp_at` datetime,
  `email_at` datetime,
  `observations` text,
  `cartorio_status` enum('nao_necessario','pendente','enviado','registrado','rejeitado') DEFAULT 'nao_necessario',
  `cartorio_observation` varchar(500),
  `user_id` int,
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime NOT NULL DEFAULT (now()),
  CONSTRAINT `despachante_documents_id` PRIMARY KEY(`id`)
);

-- Inspection Photos table
CREATE TABLE `inspection_photos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `inspectionId` int NOT NULL,
  `photoCategory` enum('frontal','traseira','lateral_esquerda','lateral_direita','painel','motor','portamalas','interior','pneu_dianteiro_esq','pneu_dianteiro_dir','pneu_traseiro_esq','pneu_traseiro_dir','documentos','chassi','motor_number','danos','outros') NOT NULL,
  `filename` varchar(255) NOT NULL,
  `fileKey` text NOT NULL,
  `fileUrl` longtext NOT NULL,
  `mimeType` varchar(100) DEFAULT 'image/jpeg',
  `fileSize` int,
  `notes` text,
  `uploadedBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `inspection_photos_id` PRIMARY KEY(`id`)
);

-- RH Departments table
CREATE TABLE `rh_departments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `rh_departments_id` PRIMARY KEY(`id`)
);

-- RH Positions table
CREATE TABLE `rh_positions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `salary_min` decimal(12,2),
  `salary_max` decimal(12,2),
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `rh_positions_id` PRIMARY KEY(`id`)
);

-- RH Employees table
CREATE TABLE `rh_employees` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `cpf` varchar(14),
  `email` varchar(320),
  `phone` varchar(20),
  `position_id` int,
  `department_id` int,
  `hire_date` varchar(10),
  `salary` decimal(12,2),
  `help_cost` decimal(12,2),
  `commission_percent` decimal(5,2),
  `sales_count` int DEFAULT 0,
  `total_sales` decimal(14,2) DEFAULT 0,
  `status` enum('ativo','ativo_ferias','desligado','afastado') NOT NULL DEFAULT 'ativo',
  `address` text,
  `emergency_contact` varchar(255),
  `emergency_phone` varchar(20),
  `notes` text,
  `user_id` int,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `rh_employees_id` PRIMARY KEY(`id`)
);

-- RH Leave Requests table
CREATE TABLE `rh_leave_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `employee_id` int NOT NULL,
  `type` enum('ferias','licenca_medica','licenca_maternidade','folga','falta_justificada','falta_injustificada') NOT NULL,
  `start_date` varchar(10) NOT NULL,
  `end_date` varchar(10) NOT NULL,
  `reason` text,
  `status` enum('pendente','aprovado','rejeitado','cancelado') NOT NULL DEFAULT 'pendente',
  `approved_by` int,
  `approved_at` timestamp,
  `rejection_reason` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `rh_leave_requests_id` PRIMARY KEY(`id`)
);

-- RH Attendance table
CREATE TABLE `rh_attendance` (
  `id` int AUTO_INCREMENT NOT NULL,
  `employee_id` int NOT NULL,
  `date` varchar(10) NOT NULL,
  `clock_in` varchar(5),
  `clock_out` varchar(5),
  `break_start` varchar(5),
  `break_end` varchar(5),
  `type` enum('presencial','home_office','campo') NOT NULL DEFAULT 'presencial',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `rh_attendance_id` PRIMARY KEY(`id`)
);

-- RH Holidays table
CREATE TABLE `rh_holidays` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `date` varchar(10) NOT NULL,
  `type` enum('nacional','municipal','empresa') NOT NULL DEFAULT 'nacional',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `rh_holidays_id` PRIMARY KEY(`id`)
);

-- RH Sales Commissions table
CREATE TABLE `rh_sales_commissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `employee_id` int NOT NULL,
  `sale_record_id` int,
  `vehicle_description` varchar(255),
  `sale_price` decimal(12,2),
  `commission_percent` decimal(5,2),
  `commission_amount` decimal(12,2),
  `help_cost` decimal(12,2),
  `month` varchar(7),
  `status` enum('pendente','pago','cancelado') NOT NULL DEFAULT 'pendente',
  `paid_at` timestamp,
  `notes` text,
  `created_by` int,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `rh_sales_commissions_id` PRIMARY KEY(`id`)
);

-- Seed test users (password: 123456, bcrypt hash)
INSERT INTO `users` (`openId`, `passwordHash`, `name`, `email`, `loginMethod`, `role`, `isActive`) VALUES
(NULL, '$2b$10$pSbg1ttcrfYNe0pj1i3snOzuw9.EVdtIW0uegZ32dudByS.JJOYSq', 'Administrador', 'admin@test.com', 'local', 'admin', true),
(NULL, '$2b$10$pSbg1ttcrfYNe0pj1i3snOzuw9.EVdtIW0uegZ32dudByS.JJOYSq', 'Vendedor', 'vendedor@test.com', 'local', 'vendedor', true),
(NULL, '$2b$10$pSbg1ttcrfYNe0pj1i3snOzuw9.EVdtIW0uegZ32dudByS.JJOYSq', 'Financeiro', 'financeiro@test.com', 'local', 'financeiro', true),
(NULL, '$2b$10$pSbg1ttcrfYNe0pj1i3snOzuw9.EVdtIW0uegZ32dudByS.JJOYSq', 'Administrativo', 'administrativo@test.com', 'local', 'administrativo', true);

-- Seed ERP Modules
INSERT INTO `erp_modules` (`moduleKey`, `name`, `description`, `icon`, `route`, `allowedRoles`, `isActive`, `sortOrder`) VALUES
('entrega', 'Entrega de Veículo', 'Processo completo de entrega de veículos ao cliente', 'Car', '/entrega', '["admin","vendedor","financeiro","administrativo"]', true, 1),
('documentos', 'Check Financeiro', 'Checklist financeiro e documental', 'FileCheck', '/financeiro', '["admin","vendedor","financeiro"]', true, 2),
('dashboard', 'Dashboard', 'Painel de documentos parados por vendedor e setor', 'LayoutDashboard', '/dashboard', '["admin","vendedor","financeiro","administrativo"]', true, 3),
('vistoria', 'Vistoria de Compra', 'Vistoria completa de veículos para compra com API FIPE', 'CarFront', '/vistoria', '["admin","vendedor"]', true, 4),
('relatorios', 'Relatórios', 'Relatórios e análises de vendas', 'BarChart3', '/relatorios', '["admin","financeiro"]', true, 5),
('clientes', 'Clientes', 'Cadastro e gestão de clientes', 'Users', '/clientes', '["admin","vendedor"]', true, 6),
('veiculos', 'Estoque', 'Gestão de estoque de veículos', 'Warehouse', '/veiculos', '["admin","vendedor"]', true, 7),
('configuracoes', 'Configurações', 'Configurações do sistema e usuários', 'Settings', '/configuracoes', '["admin"]', true, 8),
('modulos', 'Gestão de Módulos', 'Ativar e desativar módulos do sistema', 'Puzzle', '/modulos', '["admin"]', true, 9),
('despachante', 'Despachante', 'Gestão de documentos, serviços de despachante e registro em cartório', 'FileSpreadsheet', '/despachante', '["admin","vendedor","financeiro","administrativo"]', true, 10),
('rh', 'Recursos Humanos', 'Gestão de funcionários, departamentos, férias, ponto e feriados', 'Users', '/rh', '["admin","financeiro","administrativo"]', true, 11);
