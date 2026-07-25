import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  sale_records,
  SaleRecord,
  InsertSaleRecord,
  sale_documents,
  SaleDocument,
  InsertSaleDocument,
  inspection_checklists,
  InspectionChecklist,
  InsertInspectionChecklist,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Upsert user — handles both OAuth and local users
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {};
    const updateSet: Record<string, unknown> = {};

    // Handle openId (OAuth users)
    if (user.openId) {
      values.openId = user.openId;
    }

    // Handle passwordHash (local users)
    if (user.passwordHash !== undefined) {
      values.passwordHash = user.passwordHash;
      updateSet.passwordHash = user.passwordHash;
    }

    // Handle text fields
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    // Handle role
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    // Handle isActive
    if (user.isActive !== undefined) {
      values.isActive = user.isActive;
      updateSet.isActive = user.isActive;
    }

    // Handle lastSignedIn
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // For local users, use email as unique key; for OAuth, use openId
    if (user.email && !user.openId) {
      // Local user — upsert by email
      await db.insert(users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
      });
    } else if (user.openId) {
      // OAuth user — upsert by openId
      await db.insert(users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

/**
 * Get user by openId (OAuth users)
 */
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by email (local users)
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * List all users (admin only)
 */
export async function listUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list users: database not available");
    return [];
  }

  return await db.select().from(users).orderBy(users.createdAt);
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update password: database not available");
    return;
  }

  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Toggle user active status
 */
export async function toggleUserActive(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot toggle user: database not available");
    return;
  }

  await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Delete user
 */
export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete user: database not available");
    return;
  }

  await db.delete(users).where(eq(users.id, userId));
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: number,
  role: "admin" | "vendedor" | "financeiro" | "administrativo"
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update role: database not available");
    return;
  }

  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Create a new sale record
 */
export async function createSaleRecord(data: InsertSaleRecord) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create sale record: database not available");
    return undefined;
  }

  const result = await db.insert(sale_records).values(data);
  return result;
}

/**
 * Get sale record by ID
 */
export async function getSaleRecordById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sale record: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(sale_records)
    .where(eq(sale_records.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get sale record by public token
 */
export async function getSaleRecordByPublicToken(token: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sale record: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(sale_records)
    .where(eq(sale_records.publicToken, token))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * List sale records by vendor
 */
export async function listSaleRecordsByVendor(vendorId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list sale records: database not available");
    return [];
  }

  return await db
    .select()
    .from(sale_records)
    .where(eq(sale_records.vendedorId, vendorId))
    .orderBy(sale_records.createdAt);
}

/**
 * List all sale records (admin/financeiro/administrativo)
 */
export async function listAllSaleRecords() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list sale records: database not available");
    return [];
  }

  return await db.select().from(sale_records).orderBy(sale_records.createdAt);
}

/**
 * Update sale record status
 */
export async function updateSaleRecordStatus(
  recordId: number,
  status: SaleRecord["status"],
  reviewedBy?: number,
  rejectionReason?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update sale record: database not available");
    return;
  }

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }

  // Determine which review fields to update based on status
  if (status.includes("financial")) {
    updateData.financialReviewedBy = reviewedBy;
    updateData.financialReviewedAt = new Date();
  } else if (status.includes("admin")) {
    updateData.adminReviewedBy = reviewedBy;
    updateData.adminReviewedAt = new Date();
  }

  await db
    .update(sale_records)
    .set(updateData)
    .where(eq(sale_records.id, recordId));
}

/**
 * Create a sale document
 */
export async function createSaleDocument(data: InsertSaleDocument) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create sale document: database not available");
    return undefined;
  }

  const result = await db.insert(sale_documents).values(data);
  return result;
}

/**
 * List documents for a sale record
 */
export async function listSaleDocuments(saleRecordId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list documents: database not available");
    return [];
  }

  return await db
    .select()
    .from(sale_documents)
    .where(eq(sale_documents.saleRecordId, saleRecordId))
    .orderBy(sale_documents.createdAt);
}

/**
 * Delete a sale document
 */
export async function deleteSaleDocument(documentId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete document: database not available");
    return;
  }

  await db.delete(sale_documents).where(eq(sale_documents.id, documentId));
}

/**
 * Create inspection checklist items
 */
export async function createChecklistItem(data: InsertInspectionChecklist) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create checklist item: database not available");
    return undefined;
  }

  const result = await db.insert(inspection_checklists).values(data);
  return result;
}

/**
 * Get checklist items for a sale record
 */
export async function getChecklistItems(saleRecordId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get checklist items: database not available");
    return [];
  }

  return await db
    .select()
    .from(inspection_checklists)
    .where(eq(inspection_checklists.saleRecordId, saleRecordId))
    .orderBy(inspection_checklists.createdAt);
}

/**
 * Update checklist item status
 */
export async function updateChecklistItemStatus(
  itemId: number,
  status: InspectionChecklist["status"],
  notes?: string,
  validatedBy?: { role: "financeiro" | "administrativo"; userId: number }
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update checklist item: database not available");
    return;
  }

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (notes) {
    updateData.notes = notes;
  }

  if (validatedBy) {
    if (validatedBy.role === "financeiro") {
      updateData.validatedByFinanceiro = validatedBy.userId;
      updateData.validatedByFinanceiroAt = new Date();
    } else if (validatedBy.role === "administrativo") {
      updateData.validatedByAdmin = validatedBy.userId;
      updateData.validatedByAdminAt = new Date();
    }
  }

  await db
    .update(inspection_checklists)
    .set(updateData)
    .where(eq(inspection_checklists.id, itemId));
}

/**
 * Delete checklist item
 */
export async function deleteChecklistItem(itemId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete checklist item: database not available");
    return;
  }

  await db.delete(inspection_checklists).where(eq(inspection_checklists.id, itemId));
}
