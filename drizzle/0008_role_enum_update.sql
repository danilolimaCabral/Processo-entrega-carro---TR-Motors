ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','vendedor','financeiro','administrativo','aluno','rh') NOT NULL DEFAULT 'vendedor';
