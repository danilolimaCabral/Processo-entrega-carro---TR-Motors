import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertSaleDocument, InsertSaleRecord, InsertUser, saleDocuments, saleRecords, users } from "../drizzle/schema";
import { ENV } from './_core/env';

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

// ─── User helpers ────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

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

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      // Para o owner: define admin SOMENTE na inserção inicial (INSERT).
      // No ON DUPLICATE KEY UPDATE, NÃO sobrescrevemos o role para preservar
      // roles customizados (vendedor, financeiro, administrativo) atribuídos manualmente.
      values.role = 'admin'; // usado apenas no INSERT (novo usuário)
      // updateSet não inclui role → preserva o valor existente no banco
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: InsertUser["role"]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Sale Record helpers ──────────────────────────────────────────────────────

export async function createSaleRecord(data: InsertSaleRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = Date.now();
  const [result] = await db.insert(saleRecords).values({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return result.insertId as number;
}

export async function getSaleRecordById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(saleRecords).where(eq(saleRecords.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSaleRecordsBySeller(sellerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(saleRecords)
    .where(eq(saleRecords.sellerId, sellerId))
    .orderBy(desc(saleRecords.createdAt));
}

export async function getSaleRecordsByStatus(status: InsertSaleRecord["status"]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(saleRecords)
    .where(eq(saleRecords.status, status!))
    .orderBy(desc(saleRecords.createdAt));
}

export async function updateSaleRecordStatus(
  id: number,
  status: InsertSaleRecord["status"],
  extra?: { rejectionReason?: string; rejectedBy?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(saleRecords).set({
    status,
    rejectionReason: extra?.rejectionReason ?? null,
    rejectedBy: extra?.rejectedBy ?? null,
    updatedAt: Date.now(),
  }).where(eq(saleRecords.id, id));
}

// ─── Sale Document helpers ────────────────────────────────────────────────────

export async function createSaleDocument(data: InsertSaleDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(saleDocuments).values({
    ...data,
    uploadedAt: Date.now(),
  });
  return result.insertId as number;
}

export async function getDocumentsBySaleRecord(saleRecordId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(saleDocuments)
    .where(eq(saleDocuments.saleRecordId, saleRecordId));
}
