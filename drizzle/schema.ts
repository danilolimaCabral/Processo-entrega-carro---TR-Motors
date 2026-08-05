import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  longtext,
  timestamp,
  varchar,
  boolean,
  decimal,
} from "drizzle-orm/mysql-core";

/**
 * Users table — handles both OAuth and local authentication
 * - OAuth users have openId set
 * - Local users have passwordHash set, openId is null
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (for OAuth users) or null for local users */
  openId: varchar("openId", { length: 64 }).unique(),
  /** Bcrypt hash of password (for local users only) */
  passwordHash: text("passwordHash"),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }), // "oauth" or "local"
  /** Role: admin, vendedor, financeiro, administrativo */
  role: mysqlEnum("role", ["admin", "vendedor", "financeiro", "administrativo"])
    .default("vendedor")
    .notNull(),
  /** Whether the user account is active */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Sale records table — tracks vehicle sales through the approval workflow
 * Financeiro and administrativo review the sale in PARALLEL, independently of
 * each other. financialStatus/adminStatus are each other's source of truth;
 * the overall/derived status is computed from the two (see shared/saleStatus.ts)
 * rather than stored, to avoid a third field getting out of sync.
 */
export const sale_records = mysqlTable("sale_records", {
  id: int("id").autoincrement().primaryKey(),
  /** Vendor who created this sale */
  vendedorId: int("vendedorId").notNull(),
  /** Customer name */
  customerName: text("customerName"),
  /** Customer contact (phone/email) */
  customerContact: varchar("customerContact", { length: 320 }),
  /** Vehicle details */
  vehicleModel: text("vehicleModel"),
  vehicleYear: int("vehicleYear"),
  vehiclePlate: varchar("vehiclePlate", { length: 20 }),
  vehicleKm: int("vehicleKm"),
  vehiclePrice: decimal("vehiclePrice", { precision: 12, scale: 2 }),
  /** Financeiro's independent review status */
  financialStatus: mysqlEnum("financialStatus", ["pending", "approved", "rejected"])
    .default("pending")
    .notNull(),
  /** Reason financeiro rejected (if applicable) */
  financialRejectionReason: text("financialRejectionReason"),
  /** User who approved/rejected at financial stage */
  financialReviewedBy: int("financialReviewedBy"),
  financialReviewedAt: timestamp("financialReviewedAt"),
  /** Administrativo's independent review status */
  adminStatus: mysqlEnum("adminStatus", ["pending", "approved", "rejected"])
    .default("pending")
    .notNull(),
  /** Reason administrativo rejected (if applicable) */
  adminRejectionReason: text("adminRejectionReason"),
  /** User who approved/rejected at admin stage */
  adminReviewedBy: int("adminReviewedBy"),
  adminReviewedAt: timestamp("adminReviewedAt"),
  /** Public token for customer tracking (unique, generated on creation) */
  publicToken: varchar("publicToken", { length: 64 }).unique().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SaleRecord = typeof sale_records.$inferSelect;
export type InsertSaleRecord = typeof sale_records.$inferInsert;

/**
 * Sale documents table — stores PDF uploads linked to sale records
 * Document types: cartorio (cartório), payment (comprovante de pagamento)
 */
export const sale_documents = mysqlTable("sale_documents", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to sale_records */
  saleRecordId: int("saleRecordId").notNull(),
  /** Document type */
  documentType: mysqlEnum("documentType", ["cartorio", "payment"]).notNull(),
  /** Original filename */
  filename: varchar("filename", { length: 255 }).notNull(),
  /** S3 storage key/path */
  fileKey: text("fileKey").notNull(),
  /** Public URL to access the file */
  fileUrl: text("fileUrl").notNull(),
  /** MIME type (e.g., application/pdf) */
  mimeType: varchar("mimeType", { length: 100 }).default("application/pdf"),
  /** File size in bytes */
  fileSize: int("fileSize"),
  /** User who uploaded the document */
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SaleDocument = typeof sale_documents.$inferSelect;
export type InsertSaleDocument = typeof sale_documents.$inferInsert;

/**
 * Inspection checklist table — tracks vehicle inspection items for each sale
 * Items are filled by vendedor, validated by financeiro and administrativo
 */
export const inspection_checklists = mysqlTable("inspection_checklists", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to sale_records */
  saleRecordId: int("saleRecordId").notNull(),
  /** Which department owns/validates this item — financeiro and administrativo
   *  each only see and act on their own items. */
  responsibleRole: mysqlEnum("responsibleRole", ["financeiro", "administrativo"])
    .default("financeiro")
    .notNull(),
  /** Checklist item name */
  itemName: text("itemName").notNull(),
  /** Item description/notes */
  itemDescription: text("itemDescription"),
  /** Status: pending, ok, issue */
  status: mysqlEnum("status", ["pending", "ok", "issue"]).default("pending").notNull(),
  /** Notes/observations about the item */
  notes: text("notes"),
  /** User who filled the checklist (vendedor) */
  filledBy: int("filledBy"),
  filledAt: timestamp("filledAt"),
  /** User who validated (financeiro) */
  validatedByFinanceiro: int("validatedByFinanceiro"),
  validatedByFinanceiroAt: timestamp("validatedByFinanceiroAt"),
  /** User who validated (administrativo) */
  validatedByAdmin: int("validatedByAdmin"),
  validatedByAdminAt: timestamp("validatedByAdminAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InspectionChecklist = typeof inspection_checklists.$inferSelect;
export type InsertInspectionChecklist = typeof inspection_checklists.$inferInsert;

/**
 * Approval history table — tracks all approval actions for audit trail
 * Records when vendedor creates, financeiro approves/rejects, administrativo approves/rejects
 */
export const approval_history = mysqlTable("approval_history", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to sale_records */
  saleRecordId: int("saleRecordId").notNull(),
  /** Action type: created, financial_approved, financial_rejected, admin_approved, admin_rejected */
  actionType: mysqlEnum("actionType", [
    "created",
    "financial_approved",
    "financial_rejected",
    "admin_approved",
    "admin_rejected",
  ]).notNull(),
  /** Role of the user performing the action */
  userRole: mysqlEnum("userRole", ["vendedor", "financeiro", "administrativo"]).notNull(),
  /** User who performed the action */
  userId: int("userId").notNull(),
  /** Reason for rejection (if applicable) */
  reason: text("reason"),
  /** Timestamp of the action */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApprovalHistory = typeof approval_history.$inferSelect;
export type InsertApprovalHistory = typeof approval_history.$inferInsert;

/**
 * Documents uploaded through the "Iniciar Checklist Administrativo" /
 * "Iniciar Checklist Financeiro" multi-step flows (ChecklistForm on the
 * vendedor dashboard). Independent from `sale_documents` (the generic
 * cartório/pagamento upload) and from `inspection_checklists` (the
 * financeiro/administrativo review items) — this table only tracks the
 * step-by-step document uploads for these two wizards.
 *
 * `step` + `documentKey` identify which upload slot this is (e.g. step 1,
 * key "procuracoes"), so new steps can be added later without a new table.
 * A re-upload for the same (saleRecordId, step, documentKey) replaces the
 * existing row instead of creating a duplicate.
 *
 * fileKey/fileUrl currently hold a local data: URI (no external storage
 * configured in this environment yet) — swapping to real S3/Forge storage
 * later only changes what populates these two columns, not the schema.
 */
export const administrative_checklist_documents = mysqlTable(
  "administrative_checklist_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Reference to sale_records */
    saleRecordId: int("saleRecordId").notNull(),
    /** Which department's wizard this belongs to */
    department: mysqlEnum("department", ["financeiro", "administrativo"]).notNull(),
    /** Step number within that department's wizard (1, 2, 3...) */
    step: int("step").notNull(),
    /** Stable identifier for the upload slot within the step, e.g. "procuracoes" */
    documentKey: varchar("documentKey", { length: 64 }).notNull(),
    /** Original filename */
    filename: varchar("filename", { length: 255 }).notNull(),
    /** Storage key (local placeholder for now) */
    fileKey: text("fileKey").notNull(),
    /** File contents — local data: URI for now, real storage URL later */
    fileUrl: longtext("fileUrl").notNull(),
    mimeType: varchar("mimeType", { length: 100 }),
    fileSize: int("fileSize"),
    /** User who uploaded the document */
    uploadedBy: int("uploadedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

export type AdministrativeChecklistDocument =
  typeof administrative_checklist_documents.$inferSelect;
export type InsertAdministrativeChecklistDocument =
  typeof administrative_checklist_documents.$inferInsert;

/**
 * ERP Modules table — manages available modules in the system.
 * Admin can enable/disable modules. Inactive modules are hidden from sidebar
 * and their routes are blocked (redirect to /dashboard/modulos).
 */
export const erp_modules = mysqlTable("erp_modules", {
  id: int("id").autoincrement().primaryKey(),
  /** Stable module key (e.g. "vendas", "checklist", "financeiro") */
  moduleKey: varchar("moduleKey", { length: 64 }).unique().notNull(),
  /** Display name */
  name: text("name").notNull(),
  /** Description of the module */
  description: text("description"),
  /** Lucide icon name (e.g. "Car", "FileText", "DollarSign") */
  icon: varchar("icon", { length: 64 }).default("FileText"),
  /** Route path for the module (e.g. "/vendedor/dashboard") */
  route: varchar("route", { length: 255 }),
  /** Which roles can access this module (comma-separated or JSON) */
  allowedRoles: text("allowedRoles"),
  /** Whether the module is active/visible */
  isActive: boolean("isActive").default(true).notNull(),
  /** Sort order */
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ErpModule = typeof erp_modules.$inferSelect;
export type InsertErpModule = typeof erp_modules.$inferInsert;
/**
 * Purchase inspection table — vistoria de carro para compra
 * Tracks vehicle inspection for purchase decisions with photos, evaluations, and pricing
 */
export const purchase_inspections = mysqlTable("purchase_inspections", {
  id: int("id").autoincrement().primaryKey(),
  /** User who created the inspection (vendedor/admin) */
  createdBy: int("createdBy").notNull(),
  /** Owner name */
  ownerName: text("ownerName"),
  /** Owner contact */
  ownerContact: varchar("ownerContact", { length: 320 }),
  /** Vehicle identification */
  vehiclePlate: varchar("vehiclePlate", { length: 20 }),
  vehicleBrand: text("vehicleBrand"),
  vehicleModel: text("vehicleModel"),
  vehicleYear: int("vehicleYear"),
  vehicleKm: int("vehicleKm"),
  vehicleFuel: varchar("vehicleFuel", { length: 20 }),
  vehicleColor: varchar("vehicleColor", { length: 50 }),
  /** FIPE data */
  fipeCode: varchar("fipeCode", { length: 20 }),
  fipePrice: decimal("fipePrice", { precision: 12, scale: 2 }),
  /** Inspection items - JSON with scores */
  engineCondition: mysqlEnum("engineCondition", ["otimo", "bom", "regular", "ruim", "nao_verificado"]).default("nao_verificado").notNull(),
  transmissionCondition: mysqlEnum("transmissionCondition", ["otimo", "bom", "regular", "ruim", "nao_verificado"]).default("nao_verificado").notNull(),
  bodyworkCondition: mysqlEnum("bodyworkCondition", ["otimo", "bom", "regular", "ruim", "nao_verificado"]).default("nao_verificado").notNull(),
  interiorCondition: mysqlEnum("interiorCondition", ["otimo", "bom", "regular", "ruim", "nao_verificado"]).default("nao_verificado").notNull(),
  tiresCondition: mysqlEnum("tiresCondition", ["otimo", "bom", "regular", "ruim", "nao_verificado"]).default("nao_verificado").notNull(),
  suspensionCondition: mysqlEnum("suspensionCondition", ["otimo", "bom", "regular", "ruim", "nao_verificado"]).default("nao_verificado").notNull(),
  electricCondition: mysqlEnum("electricCondition", ["otimo", "bom", "regular", "ruim", "nao_verificado"]).default("nao_verificado").notNull(),
  /** Overall evaluation notes */
  generalNotes: longtext("generalNotes"),
  /** Calculated purchase price */
  purchasePrice: decimal("purchasePrice", { precision: 12, scale: 2 }),
  /** Inspection status */
  status: mysqlEnum("status", ["rascunho", "em_andamento", "concluida", "cancelada"])
    .default("rascunho")
    .notNull(),
  /** Who performed the inspection */
  inspectorId: int("inspectorId"),
  inspectedAt: timestamp("inspectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseInspection = typeof purchase_inspections.$inferSelect;
export type InsertPurchaseInspection = typeof purchase_inspections.$inferInsert;

/**
 * Inspection photos table — stores photos taken during vehicle inspection
 */
export const inspection_photos = mysqlTable("inspection_photos", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to purchase_inspections */
  inspectionId: int("inspectionId").notNull(),
  /** Photo category */
  photoCategory: mysqlEnum("photoCategory", [
    "frontal",
    "traseira",
    "lateral_esquerda",
    "lateral_direita",
    "painel",
    "motor",
    "portamalas",
    "interior",
    "pneu_dianteiro_esq",
    "pneu_dianteiro_dir",
    "pneu_traseiro_esq",
    "pneu_traseiro_dir",
    "documentos",
    "chassi",
    "motor_number",
    "danos",
    "outros",
  ]).notNull(),
  /** Original filename */
  filename: varchar("filename", { length: 255 }).notNull(),
  /** File key (local placeholder) */
  fileKey: text("fileKey").notNull(),
  /** File data as base64/data URI */
  fileUrl: longtext("fileUrl").notNull(),
  /** MIME type */
  mimeType: varchar("mimeType", { length: 100 }).default("image/jpeg"),
  /** File size in bytes */
  fileSize: int("fileSize"),
  /** Notes about this specific photo */
  notes: text("notes"),
  /** User who uploaded */
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InspectionPhoto = typeof inspection_photos.$inferSelect;
export type InsertInspectionPhoto = typeof inspection_photos.$inferInsert;

// ============================================================
// Despachante - Documentos e Serviços de Despachante
// ============================================================
export const despachante_documents = mysqlTable("despachante_documents", {
  id: int("id").primaryKey().autoincrement(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientCpf: varchar("client_cpf", { length: 20 }).notNull(),
  clientPhone: varchar("client_phone", { length: 20 }),
  clientEmail: varchar("client_email", { length: 255 }),
  vehiclePlate: varchar("vehicle_plate", { length: 10 }),
  vehicleBrand: varchar("vehicle_brand", { length: 100 }),
  vehicleModel: varchar("vehicle_model", { length: 100 }),
  vehicleYear: int("vehicle_year"),
  // Documentos obrigatórios
  docRg: boolean("doc_rg").default(false),
  docCpf: boolean("doc_cpf").default(false),
  docComprovanteResidencia: boolean("doc_comprovante_residencia").default(false),
  docCnh: boolean("doc_cnh").default(false),
  docCertificadoNascimento: boolean("doc_certificado_nascimento").default(false),
  docComprovantePagamento: boolean("doc_comprovante_pagamento").default(false),
  docPoderJuridica: boolean("doc_poder_juridica").default(false),
  docDut: boolean("doc_dut").default(false),
  docOutro: varchar("doc_outro", { length: 255 }),
  // Serviços de despachante
  serviceTransferencia: boolean("service_transferencia").default(false),
  serviceEmplacamento: boolean("service_emplacamento").default(false),
  serviceLicenciamento: boolean("service_licenciamento").default(false),
  serviceCrvCrlv: boolean("service_crv_crlv").default(false),
  serviceCartorio: boolean("service_cartorio").default(false),
  serviceReconhecimentoFirma: boolean("service_reconhecimento_firma").default(false),
  // Status
  status: mysqlEnum("status", [
    "pendente",
    "documentos_coletados",
    "em_processamento",
    "cartorio",
    "detran",
    "concluido",
    "cancelado",
  ]).default("pendente"),
  // Comunicação
  sentViaWhatsapp: boolean("sent_via_whatsapp").default(false),
  sentViaEmail: boolean("sent_via_email").default(false),
  whatsappAt: timestamp("whatsapp_at"),
  emailAt: timestamp("email_at"),
  // Observações
  observations: text("observations"),
  // Cartório
  cartorioStatus: mysqlEnum("cartorio_status", [
    "nao_necessario",
    "pendente",
    "enviado",
    "registrado",
    "rejeitado",
  ]).default("nao_necessario"),
  cartorioObservation: varchar("cartorio_observation", { length: 500 }),
  // Meta
  userId: int("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DespachanteDocument = typeof despachante_documents.$inferSelect;
export type InsertDespachanteDocument = typeof despachante_documents.$inferInsert;
