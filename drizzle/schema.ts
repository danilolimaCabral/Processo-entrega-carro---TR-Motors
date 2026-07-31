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
