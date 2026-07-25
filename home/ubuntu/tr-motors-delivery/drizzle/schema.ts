import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
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
 * Status flow: pending_financial → approved_financial → pending_admin → approved_admin → ready_for_delivery
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
  vehicleColor: text("vehicleColor"),
  vehiclePrice: decimal("vehiclePrice", { precision: 12, scale: 2 }),
  /** Approval workflow status */
  status: mysqlEnum("status", [
    "pending_financial",
    "approved_financial",
    "rejected_financial",
    "pending_admin",
    "approved_admin",
    "rejected_admin",
    "ready_for_delivery",
  ])
    .default("pending_financial")
    .notNull(),
  /** Reason for rejection (if applicable) */
  rejectionReason: text("rejectionReason"),
  /** User who approved/rejected at financial stage */
  financialReviewedBy: int("financialReviewedBy"),
  financialReviewedAt: timestamp("financialReviewedAt"),
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
