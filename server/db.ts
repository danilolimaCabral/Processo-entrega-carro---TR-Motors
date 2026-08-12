import { eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql2 from "mysql2/promise";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
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
  approval_history,
  InsertApprovalHistory,
  administrative_checklist_documents,
  InsertAdministrativeChecklistDocument,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql2.Pool | null = null;

const TWO_FACTOR_SECRET_PREFIX = "enc:v1:";

function getTwoFactorEncryptionKey(): Buffer {
  const keyMaterial = ENV.cookieSecret || ENV.databaseUrl || ENV.appId;
  if (!keyMaterial) {
    throw new Error("JWT_SECRET deve ser configurado para proteger a autenticação em dois fatores.");
  }
  return createHash("sha256").update(keyMaterial).digest();
}

function encryptTwoFactorSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getTwoFactorEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${TWO_FACTOR_SECRET_PREFIX}${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptTwoFactorSecret(value: string): string {
  // Compatibilidade controlada para configurações criadas antes da criptografia.
  if (!value.startsWith(TWO_FACTOR_SECRET_PREFIX)) return value;

  const [encodedIv, encodedTag, encodedSecret] = value.slice(TWO_FACTOR_SECRET_PREFIX.length).split(".");
  if (!encodedIv || !encodedTag || !encodedSecret) {
    throw new Error("Configuração de autenticação em dois fatores inválida.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getTwoFactorEncryptionKey(),
    Buffer.from(encodedIv, "base64url")
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedSecret, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

// Lazily create the mysql2 pool with SSL and connection pool for Railway.
// Railway MySQL (TiDB Cloud) requires SSL — without it, queries hang ~12s then fail with 500.
export async function getPool(): Promise<mysql2.Pool | null> {
  if (!_pool && process.env.DATABASE_URL) {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const isRailwayInternal = dbUrl.hostname.includes('railway.internal');
    console.log("[Database] Creating pool to:", dbUrl.hostname, dbUrl.port || 3306, dbUrl.pathname.slice(1), "SSL:", !isRailwayInternal);
    _pool = mysql2.createPool({
      host: dbUrl.hostname,
      port: dbUrl.port ? parseInt(dbUrl.port) : 3306,
      user: dbUrl.username,
      password: decodeURIComponent(dbUrl.password),
      database: dbUrl.pathname.slice(1),
      // Only use SSL for external databases (TiDB Cloud). Railway internal MySQL doesn't support SSL.
      ...(isRailwayInternal ? {} : { ssl: { rejectUnauthorized: true } }),
      connectionLimit: 10,
      connectTimeout: 10000,
      waitForConnections: true,
      queueLimit: 50,
    });
  }
  return _pool;
}

// Lazily create the drizzle instance with SSL and connection pool for Railway.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    const pool = await getPool();
    if (!pool) return null;
    try {
      // Test the connection before passing to drizzle
      const [rows] = await pool.execute('SELECT 1 as ok');
      console.log("[Database] Pool connection test OK");
      _db = drizzle(pool as any);
      const dbUrl = new URL(process.env.DATABASE_URL);
      const isRailwayInternal = dbUrl.hostname.includes('railway.internal');
      console.log("[Database] Connected with pool, SSL:", !isRailwayInternal);
    } catch (error: any) {
      console.error("[Database] Connection FAILED:", error?.message || error, "code:", error?.code, "errno:", error?.errno);
      throw error;
    }
  }
  return _db;
}

/**
 * Create a user directly using raw SQL to avoid Drizzle's autoincrement default issue
 */
export async function createUserDirect(
  email: string,
  name: string,
  passwordHash: string,
  role: string,
  loginMethod: string = "local",
  isActive: boolean = true
): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create user: database not available");
    throw new Error("Banco de dados indisponível para criar o acesso do funcionário.");
  }

  // Use mysql2 pool directly via db.$client to bypass Drizzle's insert() issue
  try {
    const pool = db.$client as any;
    const [result] = await pool.execute(
      `INSERT INTO users (passwordHash, name, email, loginMethod, role, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [passwordHash, name, email, loginMethod, role, isActive]
    );
    return Number((result as any).insertId);
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    throw error;
  }
}

/**
 * Upsert user — handles both OAuth and local users
 * Uses check-then-insert/update to avoid Drizzle's default value issue with onDuplicateKeyUpdate
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  const pool = await getPool();
  if (!pool) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    if (user.openId) {
      // OAuth user — check by openId
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE openId = ? LIMIT 1',
        [user.openId]
      );
      const existingRows = existing as any[];

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (user.passwordHash !== undefined) updateData.passwordHash = user.passwordHash;
      if (user.name !== undefined) updateData.name = user.name;
      if (user.email !== undefined) updateData.email = user.email;
      if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
      if (user.role !== undefined) updateData.role = user.role;
      if (user.isActive !== undefined) updateData.isActive = user.isActive;
      updateData.lastSignedIn = user.lastSignedIn ?? new Date();

      if (existingRows.length > 0) {
        const setClauses = Object.keys(updateData).map(k => `\`${k}\` = ?`).join(', ');
        const setValues = Object.values(updateData);
        await pool.execute(
          `UPDATE users SET ${setClauses} WHERE openId = ?`,
          [...setValues, user.openId]
        );
      } else {
        const insertData: Record<string, unknown> = { updatedAt: new Date() };
        Object.assign(insertData, updateData);
        const columns = Object.keys(insertData).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(insertData).map(() => '?').join(', ');
        const values = Object.values(insertData);
        await pool.execute(
          `INSERT INTO users (${columns}) VALUES (${placeholders})`,
          values
        );
      }
    } else if (user.email) {
      // Local user — check by email
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [user.email]
      );
      const existingRows = existing as any[];

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (user.passwordHash !== undefined) updateData.passwordHash = user.passwordHash;
      if (user.name !== undefined) updateData.name = user.name;
      if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
      if (user.role !== undefined) updateData.role = user.role;
      if (user.isActive !== undefined) updateData.isActive = user.isActive;
      updateData.lastSignedIn = user.lastSignedIn ?? new Date();

      if (existingRows.length > 0) {
        // User exists — update all fields including role and password
        const setClauses = Object.keys(updateData).map(k => `\`${k}\` = ?`).join(', ');
        const setValues = Object.values(updateData);
        await pool.execute(
          `UPDATE users SET ${setClauses} WHERE email = ?`,
          [...setValues, user.email]
        );
      } else {
        // User doesn't exist — insert
        const insertData: Record<string, unknown> = { updatedAt: new Date() };
        Object.assign(insertData, updateData);
        insertData.email = user.email;
        const columns = Object.keys(insertData).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(insertData).map(() => '?').join(', ');
        const values = Object.values(insertData);
        await pool.execute(
          `INSERT INTO users (${columns}) VALUES (${placeholders})`,
          values
        );
      }
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
  const pool = await getPool();
  if (!pool) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  try {
    // Use mysql2 directly to bypass Drizzle's DrizzleQueryError which hides the real MySQL error
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1',
      [email.toLowerCase()]
    );
    const result = rows as any[];
    return result.length > 0 ? result[0] : undefined;
  } catch (error: any) {
    console.error("[Database] getUserByEmail RAW MySQL ERROR:", JSON.stringify({
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack?.split('\n').slice(0, 5).join('\n')
    }));
    throw error;
  }
}

/** Dados persistidos do aplicativo autenticador de cada usuário. */
export type TwoFactorConfig = {
  userId: number;
  secret: string;
  enabled: boolean;
};

/**
 * Mantém a criação da tabela segura em deploys já existentes, sem DROP/TRUNCATE.
 */
export async function ensureTwoFactorTable(): Promise<void> {
  const pool = await getPool();
  if (!pool) throw new Error("Banco de dados indisponível para autenticação em dois fatores.");

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_two_factor (
      user_id INT NOT NULL PRIMARY KEY,
      secret VARCHAR(128) NOT NULL,
      enabled TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

export async function getTwoFactorConfig(userId: number): Promise<TwoFactorConfig | null> {
  await ensureTwoFactorTable();
  const pool = await getPool();
  if (!pool) return null;

  const [rows] = await pool.execute(
    "SELECT user_id AS userId, secret, enabled FROM user_two_factor WHERE user_id = ? LIMIT 1",
    [userId]
  );
  const item = (rows as any[])[0];
  return item
    ? { userId: Number(item.userId), secret: decryptTwoFactorSecret(String(item.secret)), enabled: Boolean(item.enabled) }
    : null;
}

export async function saveTwoFactorConfig(userId: number, secret: string, enabled: boolean): Promise<void> {
  await ensureTwoFactorTable();
  const pool = await getPool();
  if (!pool) throw new Error("Banco de dados indisponível para autenticação em dois fatores.");

  await pool.execute(
    `INSERT INTO user_two_factor (user_id, secret, enabled)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE secret = VALUES(secret), enabled = VALUES(enabled), updated_at = CURRENT_TIMESTAMP`,
    [userId, encryptTwoFactorSecret(secret), enabled ? 1 : 0]
  );
}

/**
 * Remove a vinculação TOTP de um usuário para que ele faça uma nova configuração
 * no próximo login. A ação é restrita ao fluxo administrativo.
 */
export async function resetTwoFactorConfig(userId: number): Promise<void> {
  await ensureTwoFactorTable();
  const pool = await getPool();
  if (!pool) throw new Error("Banco de dados indisponível para redefinir a autenticação em dois fatores.");

  await pool.execute("DELETE FROM user_two_factor WHERE user_id = ?", [userId]);
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
  role: "admin" | "gerente" | "vendedor" | "financeiro" | "administrativo" | "aluno" | "rh"
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

  // mysql2 returns [ResultSetHeader, FieldPacket[]] for inserts
  const insertedId = (result as any)[0]?.insertId;
  if (!insertedId) {
    return undefined;
  }

  // Fetch and return the created record
  return await getSaleRecordById(insertedId);
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
 * Update financeiro's independent review status for a sale.
 * Never touches adminStatus — the two departments review in parallel.
 */
export async function updateSaleFinancialStatus(
  recordId: number,
  status: SaleRecord["financialStatus"],
  reviewedBy: number,
  rejectionReason?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update sale record: database not available");
    return;
  }

  await db
    .update(sale_records)
    .set({
      financialStatus: status,
      financialReviewedBy: reviewedBy,
      financialReviewedAt: new Date(),
      financialRejectionReason: rejectionReason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(sale_records.id, recordId));
}

/**
 * Update administrativo's independent review status for a sale.
 * Never touches financialStatus — the two departments review in parallel.
 */
export async function updateSaleAdminStatus(
  recordId: number,
  status: SaleRecord["adminStatus"],
  reviewedBy: number,
  rejectionReason?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update sale record: database not available");
    return;
  }

  await db
    .update(sale_records)
    .set({
      adminStatus: status,
      adminReviewedBy: reviewedBy,
      adminReviewedAt: new Date(),
      adminRejectionReason: rejectionReason ?? null,
      updatedAt: new Date(),
    })
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
 * Get a single checklist item by id (used to check its responsibleRole
 * before allowing a financeiro/administrativo user to validate it)
 */
export async function getChecklistItemById(itemId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get checklist item: database not available");
    return undefined;
  }

  const [item] = await db
    .select()
    .from(inspection_checklists)
    .where(eq(inspection_checklists.id, itemId))
    .limit(1);

  return item;
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

/**
 * Record approval history
 */
export async function recordApprovalHistory(data: InsertApprovalHistory) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot record approval history: database not available");
    return undefined;
  }

  const result = await db.insert(approval_history).values(data);
  return result;
}

/**
 * Get approval history for a sale record
 */
export async function getApprovalHistory(saleRecordId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get approval history: database not available");
    return [];
  }

  return await db
    .select()
    .from(approval_history)
    .where(eq(approval_history.saleRecordId, saleRecordId))
    .orderBy(approval_history.createdAt);
}

/**
 * Get uploaded documents for one step of a department's checklist wizard
 * (e.g. "Iniciar Checklist Administrativo", step 1).
 */
export async function getAdministrativeChecklistDocuments(
  saleRecordId: number,
  department: "financeiro" | "administrativo",
  step: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get checklist documents: database not available");
    return [];
  }

  return await db
    .select()
    .from(administrative_checklist_documents)
    .where(
      and(
        eq(administrative_checklist_documents.saleRecordId, saleRecordId),
        eq(administrative_checklist_documents.department, department),
        eq(administrative_checklist_documents.step, step)
      )
    );
}

/**
 * Upload (or replace) the document for one slot (department + step +
 * documentKey). A second upload to the same slot overwrites the first
 * instead of creating a duplicate row.
 */
export async function upsertAdministrativeChecklistDocument(
  data: InsertAdministrativeChecklistDocument
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save checklist document: database not available");
    return;
  }

  const existing = await db
    .select({ id: administrative_checklist_documents.id })
    .from(administrative_checklist_documents)
    .where(
      and(
        eq(administrative_checklist_documents.saleRecordId, data.saleRecordId),
        eq(administrative_checklist_documents.department, data.department),
        eq(administrative_checklist_documents.step, data.step),
        eq(administrative_checklist_documents.documentKey, data.documentKey)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(administrative_checklist_documents)
      .set({
        filename: data.filename,
        fileKey: data.fileKey,
        fileUrl: data.fileUrl,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        uploadedBy: data.uploadedBy,
        updatedAt: new Date(),
      })
      .where(eq(administrative_checklist_documents.id, existing[0].id));
  } else {
    await db.insert(administrative_checklist_documents).values(data);
  }
}
