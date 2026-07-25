import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  /**
   * Roles do sistema:
   * - user / admin: papéis padrão do template
   * - vendedor / financeiro / administrativo: papéis do negócio TR Motors
   * Extensível: adicionar novos valores conforme necessário.
   */
  role: mysqlEnum("role", ["user", "admin", "vendedor", "financeiro", "administrativo"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Registro de venda criado pelo Vendedor.
 * Cada registro representa uma entrega pendente de aprovação.
 * Projetado para ser extensível: novos campos podem ser adicionados sem reestruturação.
 */
export const saleRecords = mysqlTable("sale_records", {
  id: int("id").autoincrement().primaryKey(),
  /** Placa do veículo vendido */
  licensePlate: varchar("licensePlate", { length: 20 }).notNull(),
  /**
   * Status atual no fluxo de aprovação.
   * Extensível: adicionar novos valores ao enum conforme o fluxo crescer.
   */
  status: mysqlEnum("status", [
    "aguardando_financeiro",
    "aguardando_administrativo",
    "liberado_para_entrega",
    "reprovado",
  ]).default("aguardando_financeiro").notNull(),
  /** Motivo de reprovação, preenchido quando status = 'reprovado' */
  rejectionReason: text("rejectionReason"),
  /** Papel que reprovou: 'financeiro' ou 'administrativo' */
  rejectedBy: varchar("rejectedBy", { length: 64 }),
  /** FK para o usuário vendedor que criou o registro */
  sellerId: int("sellerId").notNull(),
  /** Nome do vendedor no momento da criação (desnormalizado para consultas rápidas) */
  sellerName: text("sellerName"),
  /** Timestamps em UTC milissegundos para consistência de fuso horário */
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type SaleRecord = typeof saleRecords.$inferSelect;
export type InsertSaleRecord = typeof saleRecords.$inferInsert;

/**
 * Documentos PDF anexados a um registro de venda.
 * Cada registro possui exatamente dois documentos: documentacao_cartorio e comprovante_pagamento.
 * Extensível: novos tipos de documento podem ser adicionados ao enum.
 */
export const saleDocuments = mysqlTable("sale_documents", {
  id: int("id").autoincrement().primaryKey(),
  /** FK para o registro de venda */
  saleRecordId: int("saleRecordId").notNull(),
  /**
   * Tipo do documento.
   * Extensível: adicionar novos tipos conforme necessário.
   */
  documentType: mysqlEnum("documentType", [
    "documentacao_cartorio",
    "comprovante_pagamento",
  ]).notNull(),
  /** Chave S3 para recuperar o arquivo */
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  /** URL relativa para acesso via /manus-storage/ */
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
  /** Nome original do arquivo enviado pelo usuário */
  originalName: varchar("originalName", { length: 255 }),
  /** Timestamp UTC em milissegundos */
  uploadedAt: bigint("uploadedAt", { mode: "number" }).notNull(),
});

export type SaleDocument = typeof saleDocuments.$inferSelect;
export type InsertSaleDocument = typeof saleDocuments.$inferInsert;
