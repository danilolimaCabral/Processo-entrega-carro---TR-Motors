-- Migration: Adiciona suporte a autenticação local e links públicos de processo

-- Torna openId nullable (usuários locais não têm openId OAuth)
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);

-- Adiciona campo de senha (hash bcrypt) para usuários locais
ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255);

-- Adiciona campo de status ativo/inativo para controle pelo admin
ALTER TABLE `users` ADD COLUMN `isActive` int NOT NULL DEFAULT 1;

-- Garante unicidade de email (necessário para login local)
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320);
ALTER TABLE `users` ADD UNIQUE INDEX `users_email_unique` (`email`);

-- Adiciona campos de cliente no registro de venda
ALTER TABLE `sale_records` ADD COLUMN `customerName` varchar(255);
ALTER TABLE `sale_records` ADD COLUMN `customerContact` varchar(100);

-- Adiciona token público único para link de acompanhamento do cliente
ALTER TABLE `sale_records` ADD COLUMN `publicToken` varchar(64);
ALTER TABLE `sale_records` ADD UNIQUE INDEX `sale_records_publicToken_unique` (`publicToken`);
