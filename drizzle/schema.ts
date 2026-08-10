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
  date,
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
  /** Role: admin, vendedor, financeiro, administrativo, aluno */
  role: mysqlEnum("role", ["admin", "vendedor", "financeiro", "administrativo", "aluno", "rh"])
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
// ============================================================
// Módulo RH - Recursos Humanos
// ============================================================

export const rh_departments = mysqlTable("rh_departments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Department = typeof rh_departments.$inferSelect;
export type InsertDepartment = typeof rh_departments.$inferInsert;

export const rh_positions = mysqlTable("rh_positions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  salaryMin: decimal("salary_min", { precision: 12, scale: 2 }),
  salaryMax: decimal("salary_max", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Position = typeof rh_positions.$inferSelect;
export type InsertPosition = typeof rh_positions.$inferInsert;

export const rh_employees = mysqlTable("rh_employees", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  positionId: int("position_id").references(() => rh_positions.id),
  departmentId: int("department_id").references(() => rh_departments.id),
  hireDate: varchar("hire_date", { length: 10 }), // YYYY-MM-DD
  salary: decimal("salary", { precision: 12, scale: 2 }),
  helpCost: decimal("help_cost", { precision: 12, scale: 2 }),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }),
  salesCount: int("sales_count").default(0),
  totalSales: decimal("total_sales", { precision: 14, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["ativo", "ativo_ferias", "desligado", "afastado"]).default("ativo").notNull(),
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 255 }),
  emergencyPhone: varchar("emergency_phone", { length: 20 }),
  notes: text("notes"),
  userId: int("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Employee = typeof rh_employees.$inferSelect;
export type InsertEmployee = typeof rh_employees.$inferInsert;

export const rh_leave_requests = mysqlTable("rh_leave_requests", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").references(() => rh_employees.id).notNull(),
  type: mysqlEnum("type", ["ferias", "licenca_medica", "licenca_maternidade", "folga", "falta_justificada", "falta_injustificada"]).notNull(),
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }).notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pendente", "aprovado", "rejeitado", "cancelado"]).default("pendente").notNull(),
  approvedBy: int("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type LeaveRequest = typeof rh_leave_requests.$inferSelect;
export type InsertLeaveRequest = typeof rh_leave_requests.$inferInsert;

export const rh_attendance = mysqlTable("rh_attendance", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").references(() => rh_employees.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  clockIn: varchar("clock_in", { length: 5 }), // HH:MM
  clockOut: varchar("clock_out", { length: 5 }), // HH:MM
  breakStart: varchar("break_start", { length: 5 }),
  breakEnd: varchar("break_end", { length: 5 }),
  type: mysqlEnum("type", ["presencial", "home_office", "campo"]).default("presencial"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Attendance = typeof rh_attendance.$inferSelect;
export type InsertAttendance = typeof rh_attendance.$inferInsert;

export const rh_holidays = mysqlTable("rh_holidays", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  type: mysqlEnum("type", ["nacional", "municipal", "empresa"]).default("nacional"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Holiday = typeof rh_holidays.$inferSelect;
export type InsertHoliday = typeof rh_holidays.$inferInsert;
// RH Sales Commissions - registro de vendas e comissões por funcionário
export const rh_sales_commissions = mysqlTable("rh_sales_commissions", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").references(() => rh_employees.id).notNull(),
  saleRecordId: int("sale_record_id"),
  vehicleDescription: varchar("vehicle_description", { length: 255 }), // e.g. "Honda Civic 2024"
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }),
  helpCost: decimal("help_cost", { precision: 12, scale: 2 }),
  month: varchar("month", { length: 7 }), // YYYY-MM
  status: mysqlEnum("status", ["pendente", "pago", "cancelado"]).default("pendente").notNull(),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type SalesCommission = typeof rh_sales_commissions.$inferSelect;
export type InsertSalesCommission = typeof rh_sales_commissions.$inferInsert;
// ============================================================
// Módulo Estoque - Veículos disponíveis para venda
// ============================================================
export const vehicle_inventory = mysqlTable("vehicle_inventory", {
  id: int("id").autoincrement().primaryKey(),
  /** Source inspection (if bought from trade-in) */
  inspectionId: int("inspection_id").references(() => purchase_inspections.id),
  /** Vehicle details */
  brand: varchar("brand", { length: 100 }).notNull(),
  model: varchar("model", { length: 200 }).notNull(),
  year: int("year"),
  km: int("km"),
  fuel: varchar("fuel", { length: 20 }),
  color: varchar("color", { length: 50 }),
  plate: varchar("plate", { length: 20 }),
  chassi: varchar("chassi", { length: 50 }),
  renavam: varchar("renavam", { length: 30 }),
  /** External sync fields */
  externalId: int("external_id"),
  externalSource: varchar("external_source", { length: 50 }),
  modelDetail: varchar("model_detail", { length: 200 }),
  fabricYear: int("fabric_year"),
  doors: int("doors"),
  motorization: varchar("motorization", { length: 50 }),
  hp: int("hp"),
  bodyType: varchar("body_type", { length: 50 }),
  condition: varchar("condition", { length: 30 }),
  gear: varchar("gear", { length: 20 }),
  accessories: text("accessories"),
  description: text("description"),
  promoPrice: decimal("promo_price", { precision: 12, scale: 2 }),
  images: text("images"),
  imagesLarge: text("images_large"),
  /** Pricing */
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
  reconditionCost: decimal("recondition_cost", { precision: 12, scale: 2 }).default("0"),
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }),
  fipePrice: decimal("fipe_price", { precision: 12, scale: 2 }),
  /** Status */
  status: mysqlEnum("status", [
    "disponivel",
    "reservado",
    "vendido",
    "em_preparacao",
    "transferido",
  ]).default("disponivel").notNull(),
  /** Location */
  location: varchar("location", { length: 100 }),
  /** Notes */
  notes: text("notes"),
  /** Who added to inventory */
  addedBy: int("added_by").references(() => users.id),
  /** Who sold it */
  soldBy: int("sold_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type VehicleInventory = typeof vehicle_inventory.$inferSelect;
export type InsertVehicleInventory = typeof vehicle_inventory.$inferInsert;

// ============================================================
// Módulo Pipeline/CRM - Funil de vendas
// ============================================================
export const sales_pipeline = mysqlTable("sales_pipeline", {
  id: int("id").autoincrement().primaryKey(),
  /** Lead name */
  leadName: varchar("lead_name", { length: 255 }).notNull(),
  leadPhone: varchar("lead_phone", { length: 20 }),
  leadEmail: varchar("lead_email", { length: 255 }),
  /** Lead source */
  source: mysqlEnum("source", [
    "balcao",
    "whatsapp",
    "portal",
    "instagram",
    "indicacao",
    "telefone",
    "outro",
  ]).default("balcao"),
  /** Pipeline stage */
  stage: mysqlEnum("stage", [
    "novo_lead",
    "qualificado",
    "proposta_enviada",
    "negociando",
    "venda_fechada",
    "perdido",
  ]).default("novo_lead").notNull(),
  /** Vehicle of interest (from inventory) */
  vehicleId: int("vehicle_id").references(() => vehicle_inventory.id),
  vehicleDescription: varchar("vehicle_description", { length: 300 }),
  /** Assigned seller */
  sellerId: int("seller_id").references(() => rh_employees.id),
  sellerUserId: int("seller_user_id").references(() => users.id),
  /** Proposal details */
  proposedPrice: decimal("proposed_price", { precision: 12, scale: 2 }),
  tradeInValue: decimal("trade_in_value", { precision: 12, scale: 2 }),
  downPayment: decimal("down_payment", { precision: 12, scale: 2 }),
  financingAmount: decimal("financing_amount", { precision: 12, scale: 2 }),
  financingBank: varchar("financing_bank", { length: 100 }),
  /** Notes and follow-up */
  notes: text("notes"),
  nextFollowUp: varchar("next_follow_up", { length: 10 }), // YYYY-MM-DD
  /** Sale record reference (when converted) */
  saleRecordId: int("sale_record_id"),
  /** Lost reason */
  lostReason: text("lost_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type SalesPipeline = typeof sales_pipeline.$inferSelect;
export type InsertSalesPipeline = typeof sales_pipeline.$inferInsert;

// ============================================================
// Módulo Entrega - Checklist de entrega do veículo
// ============================================================
export const vehicle_deliveries = mysqlTable("vehicle_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  saleRecordId: int("sale_record_id").references(() => sale_records.id),
  despachanteDocId: int("despachante_doc_id").references(() => despachante_documents.id),
  /** Customer info */
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerCpf: varchar("customer_cpf", { length: 20 }),
  /** Vehicle */
  vehicleDescription: varchar("vehicle_description", { length: 300 }).notNull(),
  vehiclePlate: varchar("vehicle_plate", { length: 20 }),
  /** Delivery checklist items */
  checklistChaves: boolean("checklist_chaves").default(false),
  checklistDocumentos: boolean("checklist_documentos").default(false),
  checklistManual: boolean("checklist_manual").default(false),
  checklistKitPrimeirosSocorros: boolean("checklist_kit_primeiros_socorros").default(false),
  checklistMacaco: boolean("checklist_macaco").default(false),
  checklistEstepe: boolean("checklist_estepe").default(false),
  checklistChaveRodas: boolean("checklist_chave_rodas").default(false),
  checklistTanqueCheio: boolean("checklist_tanque_cheio").default(false),
  checklistAcessorios: boolean("checklist_acessorios").default(false),
  checklistRevisao: boolean("checklist_revisao").default(false),
  checklistFotoPlaca: boolean("checklist_foto_placa").default(false),
  checklistOdometro: boolean("checklist_odometro").default(false),
  checklistCombustivel: boolean("checklist_combustivel").default(false),
  checklistAssinaturaContrato: boolean("checklist_assinatura_contrato").default(false),
  /** Delivery status */
  status: mysqlEnum("status", ["agendada", "em_preparacao", "entregue", "cancelada"])
    .default("agendada")
    .notNull(),
  /** Scheduled date */
  scheduledDate: varchar("scheduled_date", { length: 10 }), // YYYY-MM-DD
  scheduledTime: varchar("scheduled_time", { length: 5 }), // HH:MM
  /** Delivery details */
  deliveredBy: int("delivered_by").references(() => users.id),
  deliveredAt: timestamp("delivered_at"),
  /** Odometer at delivery */
  odometerAtDelivery: int("odometer_at_delivery"),
  /** Fuel level at delivery */
  fuelLevelAtDelivery: varchar("fuel_level_at_delivery", { length: 20 }),
  /** Customer signature (name or base64) */
  customerSignature: text("customer_signature"),
  /** Notes */
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type VehicleDelivery = typeof vehicle_deliveries.$inferSelect;
export type InsertVehicleDelivery = typeof vehicle_deliveries.$inferInsert;
// ============================================================
// Módulo EAD — Plataforma de Videoaulas e Cursos
// ============================================================
export const ead_courses = mysqlTable("ead_courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  category: varchar("category", { length: 50 }).default("Geral").notNull(),
  status: mysqlEnum("status", ["rascunho", "publicado", "arquivado"]).default("rascunho").notNull(),
  instructor: varchar("instructor", { length: 255 }),
  durationHours: decimal("duration_hours", { precision: 5, scale: 2 }),
  totalLessons: int("total_lessons").default(0),
  visibility: mysqlEnum("visibility", ["todos", "apenas_vendedores", "apenas_admin", "privado"]).default("todos").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type EadCourse = typeof ead_courses.$inferSelect;
export type InsertEadCourse = typeof ead_courses.$inferInsert;

export const ead_lessons = mysqlTable("ead_lessons", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("course_id").references(() => ead_courses.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  moduleName: varchar("module_name", { length: 100 }),
  orderIndex: int("order_index").default(0),
  videoType: mysqlEnum("video_type", ["youtube", "vimeo", "url", "upload"]).default("youtube").notNull(),
  videoId: varchar("video_id", { length: 100 }),
  videoUrl: text("video_url"),
  durationMinutes: int("duration_minutes").default(0),
  status: mysqlEnum("status", ["ativo", "inativo"]).default("ativo").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type EadLesson = typeof ead_lessons.$inferSelect;
export type InsertEadLesson = typeof ead_lessons.$inferInsert;

export const ead_progress = mysqlTable("ead_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id).notNull(),
  courseId: int("course_id").references(() => ead_courses.id).notNull(),
  lessonId: int("lesson_id").references(() => ead_lessons.id).notNull(),
  completed: boolean("completed").default(false),
  watchedPercent: int("watched_percent").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type EadProgress = typeof ead_progress.$inferSelect;
export type InsertEadProgress = typeof ead_progress.$inferInsert;

export const ead_certificates = mysqlTable("ead_certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id).notNull(),
  courseId: int("course_id").references(() => ead_courses.id).notNull(),
  certificateCode: varchar("certificate_code", { length: 50 }).notNull(),
  quizScore: decimal("quiz_score", { precision: 5, scale: 2 }),
  issuedAt: timestamp("issued_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type EadCertificate = typeof ead_certificates.$inferSelect;
export type InsertEadCertificate = typeof ead_certificates.$inferInsert;
// ============================================================
// RH Uniformes
// ============================================================
export const rh_uniforms = mysqlTable("rh_uniforms", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  size: varchar("size", { length: 10 }),
  quantity: int("quantity").default(1),
  dateIssued: date("date_issued"),
  status: varchar("status", { length: 20 }).default("entregue"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type RhUniform = typeof rh_uniforms.$inferSelect;
export type InsertRhUniform = typeof rh_uniforms.$inferInsert;

// ============================================================
// RH NF Custos (Notas Fiscais de Custos)
// ============================================================
export const rh_cost_invoices = mysqlTable("rh_cost_invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  supplier: varchar("supplier", { length: 100 }),
  description: varchar("description", { length: 255 }),
  category: varchar("category", { length: 50 }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  invoiceDate: date("invoice_date"),
  status: varchar("status", { length: 20 }).default("pendente"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type RhCostInvoice = typeof rh_cost_invoices.$inferSelect;
export type InsertRhCostInvoice = typeof rh_cost_invoices.$inferInsert;
/**
 * Expense receipts — photos of expense receipts (fuel, toll, food, supplies, etc.)
 * submitted by employees for RH/Financeiro control
 */
export const expense_receipts = mysqlTable("expense_receipts", {
  id: int("id").primaryKey().autoincrement(),
  employeeName: varchar("employee_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull().default("Geral"),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  receiptDate: date("receipt_date"),
  status: varchar("status", { length: 50 }).notNull().default("pendente"),
  notes: text("notes"),
  photoUrl: longtext("photo_url"),
  photoFilename: varchar("photo_filename", { length: 500 }),
  photoMimeType: varchar("photo_mime_type", { length: 100 }).default("image/jpeg"),
  submittedBy: int("submitted_by"),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type InsertExpenseReceipt = typeof expense_receipts.$inferInsert;

// ============================================================
// RH MODULES — From Briefing
// ============================================================

// --- 1. Uniform Control ---
export const uniforms = mysqlTable("uniforms", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").notNull(),
  itemType: varchar("item_type", { length: 100 }).notNull(), // camisa, calca, sapato, etc
  size: varchar("size", { length: 20 }),
  quantity: int("quantity").default(1).notNull(),
  dateIssued: date("date_issued").notNull(),
  dateReturned: date("date_returned"),
  status: mysqlEnum("status", ["entregue", "devolvido", "pendente"]).default("entregue").notNull(),
  notes: text("notes"),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Uniform = typeof uniforms.$inferSelect;
export type InsertUniform = typeof uniforms.$inferInsert;

// --- 2. Exit Checklist (Desligamento) ---
export const exit_checklists = mysqlTable("exit_checklists", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").notNull(),
  employeeName: varchar("employee_name", { length: 255 }).notNull(),
  initiatedBy: int("initiated_by").notNull(),
  initiatedAt: timestamp("initiated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  status: mysqlEnum("status", ["em_andamento", "concluido", "cancelado"]).default("em_andamento").notNull(),
  reason: varchar("reason", { length: 255 }), // demissao, rescisao, etc
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type ExitChecklist = typeof exit_checklists.$inferSelect;
export type InsertExitChecklist = typeof exit_checklists.$inferInsert;

export const exit_checklist_items = mysqlTable("exit_checklist_items", {
  id: int("id").autoincrement().primaryKey(),
  checklistId: int("checklist_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sector: varchar("sector", { length: 50 }).notNull(), // RH, TI, Financeiro, Gestor
  responsibleRole: varchar("responsible_role", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["pendente", "concluido", "nao_aplicavel"]).default("pendente").notNull(),
  completedBy: int("completed_by"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type ExitChecklistItem = typeof exit_checklist_items.$inferSelect;
export type InsertExitChecklistItem = typeof exit_checklist_items.$inferInsert;

// --- 3. Employee Documents (Pasta Digital) ---
export const employee_documents = mysqlTable("employee_documents", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // contrato, cnh, exame, recibo, etc
  documentName: varchar("document_name", { length: 255 }).notNull(),
  fileUrl: longtext("file_url"),
  fileMimeType: varchar("file_mime_type", { length: 100 }).default("application/pdf"),
  expiryDate: date("expiry_date"),
  uploadedBy: int("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type EmployeeDocument = typeof employee_documents.$inferSelect;
export type InsertEmployeeDocument = typeof employee_documents.$inferInsert;

// --- 4. CRM de Candidatos ---
export const job_vacancies = mysqlTable("job_vacancies", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  department: varchar("department", { length: 100 }),
  description: longtext("description"),
  requirements: longtext("requirements"),
  salaryRange: varchar("salary_range", { length: 100 }),
  status: mysqlEnum("status", ["aberta", "pausada", "fechada"]).default("aberta").notNull(),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type JobVacancy = typeof job_vacancies.$inferSelect;
export type InsertJobVacancy = typeof job_vacancies.$inferInsert;

export const candidates = mysqlTable("candidates", {
  id: int("id").autoincrement().primaryKey(),
  vacancyId: int("vacancy_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  resume: longtext("resume"), // base64 or URL
  coverLetter: longtext("cover_letter"),
  stage: mysqlEnum("stage", ["inscrito", "triagem", "entrevista", "aprovado", "reprovado"]).default("inscrito").notNull(),
  rating: int("rating"), // 1-5
  notes: longtext("notes"),
  salaryExpectation: varchar("salary_expectation", { length: 100 }),
  interviewDate: timestamp("interview_date"),
  hiredAt: timestamp("hired_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

// --- 5. Learning Paths (Onboarding) ---
export const learning_paths = mysqlTable("learning_paths", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(), // vendas, administrativo, recepcao
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type LearningPath = typeof learning_paths.$inferSelect;
export type InsertLearningPath = typeof learning_paths.$inferInsert;

export const learning_path_courses = mysqlTable("learning_path_courses", {
  id: int("id").autoincrement().primaryKey(),
  pathId: int("path_id").notNull(),
  courseId: int("course_id").notNull(),
  order: int("order").default(0).notNull(),
  isRequired: boolean("is_required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type LearningPathCourse = typeof learning_path_courses.$inferSelect;
export type InsertLearningPathCourse = typeof learning_path_courses.$inferInsert;

// --- 6. Quizzes ---
export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("course_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  passingScore: int("passing_score").default(70).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

export const quiz_questions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quiz_id").notNull(),
  question: text("question").notNull(),
  optionA: varchar("option_a", { length: 500 }).notNull(),
  optionB: varchar("option_b", { length: 500 }).notNull(),
  optionC: varchar("option_c", { length: 500 }),
  optionD: varchar("option_d", { length: 500 }),
  correctAnswer: mysqlEnum("correct_answer", ["A", "B", "C", "D"]).notNull(),
  order: int("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type QuizQuestion = typeof quiz_questions.$inferSelect;
export type InsertQuizQuestion = typeof quiz_questions.$inferInsert;

export const quiz_answers = mysqlTable("quiz_answers", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quiz_id").notNull(),
  questionId: int("question_id").notNull(),
  userId: int("user_id").notNull(),
  selectedAnswer: mysqlEnum("selected_answer", ["A", "B", "C", "D"]).notNull(),
  isCorrect: boolean("is_correct").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type QuizAnswer = typeof quiz_answers.$inferSelect;
export type InsertQuizAnswer = typeof quiz_answers.$inferInsert;

// --- 7. Audit Log ---
export const audit_logs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  userName: varchar("user_name", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(), // create, update, delete, login, logout
  module: varchar("module", { length: 50 }).notNull(), // rh, ead, sales, etc
  entityId: int("entity_id"),
  entityName: varchar("entity_name", { length: 255 }),
  details: longtext("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AuditLog = typeof audit_logs.$inferSelect;
export type InsertAuditLog = typeof audit_logs.$inferInsert;
