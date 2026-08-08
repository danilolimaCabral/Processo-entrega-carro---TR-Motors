import { z } from "zod";
import { eq, like, desc, and, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  vehicle_inventory,
  type InsertVehicleInventory,
  purchase_inspections,
} from "../../drizzle/schema";

/**
 * List all vehicles in inventory
 */
export const listInventory = protectedProcedure
  .input(
    z.object({
      status: z.string().optional(),
      search: z.string().optional(),
    }).optional()
  )
  .query(async ({ input }) => {
    const db = await getDb();
    let query = db
      .select({
        inventory: vehicle_inventory,
      })
      .from(vehicle_inventory);

    if (input?.status) {
      query = query.where(eq(vehicle_inventory.status, input.status as any));
    } else if (input?.search) {
      query = query.where(
        or(
          like(vehicle_inventory.brand, `%${input.search}%`),
          like(vehicle_inventory.model, `%${input.search}%`),
          like(vehicle_inventory.plate, `%${input.search}%`)
        )
      );
    }

    return query.orderBy(desc(vehicle_inventory.createdAt));
  });

/**
 * Create a new vehicle in inventory (can come from inspection)
 */
export const createInventoryItem = protectedProcedure
  .input(
    z.object({
      inspectionId: z.number().optional(),
      brand: z.string().min(1),
      model: z.string().min(1),
      year: z.number().optional(),
      km: z.number().optional(),
      fuel: z.string().optional(),
      color: z.string().optional(),
      plate: z.string().optional(),
      chassi: z.string().optional(),
      renavam: z.string().optional(),
      purchasePrice: z.string().optional(),
      reconditionCost: z.string().optional(),
      salePrice: z.string().optional(),
      fipePrice: z.string().optional(),
      status: z.string().default("disponivel"),
      location: z.string().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    const insertData: InsertVehicleInventory = {
      inspectionId: input.inspectionId,
      brand: input.brand,
      model: input.model,
      year: input.year ?? null,
      km: input.km ?? null,
      fuel: input.fuel ?? null,
      color: input.color ?? null,
      plate: input.plate ?? null,
      chassi: input.chassi ?? null,
      renavam: input.renavam ?? null,
      purchasePrice: input.purchasePrice ? (parseFloat(input.purchasePrice) as any) : null,
      reconditionCost: input.reconditionCost ? (parseFloat(input.reconditionCost) as any) : null,
      salePrice: input.salePrice ? (parseFloat(input.salePrice) as any) : null,
      fipePrice: input.fipePrice ? (parseFloat(input.fipePrice) as any) : null,
      status: input.status as any,
      location: input.location ?? null,
      notes: input.notes ?? null,
      addedBy: ctx.user.id,
    };
    const result = await db.insert(vehicle_inventory).values(insertData);
    return { success: true, id: result[0].insertId };
  });

/**
 * Create inventory from a completed inspection (auto-add)
 */
export const addFromInspection = protectedProcedure
  .input(
    z.object({
      inspectionId: z.number(),
      salePrice: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    // Get the inspection
    const inspections = await db
      .select()
      .from(purchase_inspections)
      .where(eq(purchase_inspections.id, input.inspectionId))
      .limit(1);
    
    if (inspections.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Inspeção não encontrada",
      });
    }

    const inspection = inspections[0];
    const result = await db.insert(vehicle_inventory).values({
      inspectionId: inspection.id,
      brand: inspection.vehicleBrand ?? "Não informado",
      model: inspection.vehicleModel ?? "Não informado",
      year: inspection.vehicleYear ?? null,
      km: inspection.vehicleKm ?? null,
      fuel: inspection.vehicleFuel ?? null,
      color: inspection.vehicleColor ?? null,
      plate: inspection.vehiclePlate ?? null,
      purchasePrice: inspection.purchasePrice ?? null,
      fipePrice: inspection.fipePrice ?? null,
      salePrice: input.salePrice ? (parseFloat(input.salePrice) as any) : inspection.purchasePrice,
      status: "disponivel",
      notes: `Veículo proveniente da vistoria de compra (ID: ${inspection.id})`,
      addedBy: ctx.user.id,
    });

    return { success: true, id: result[0].insertId };
  });

/**
 * Update vehicle status in inventory
 */
export const updateInventoryStatus = protectedProcedure
  .input(
    z.object({
      id: z.number(),
      status: z.enum(["disponivel", "reservado", "vendido", "em_preparacao", "transferido"]),
      soldBy: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const db = await getDb();
    const updateData: any = { status: input.status };
    if (input.soldBy) updateData.soldBy = input.soldBy;
    await db.update(vehicle_inventory).set(updateData).where(eq(vehicle_inventory.id, input.id));
    return { success: true };
  });

/**
 * Delete a vehicle from inventory
 */
export const deleteInventoryItem = protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    await db.delete(vehicle_inventory).where(eq(vehicle_inventory.id, input.id));
    return { success: true };
  });

/**
 * Get inventory stats
 */
export const inventoryStats = protectedProcedure.query(async () => {
  const db = await getDb();
  const [available, reserved, sold, preparing, transferred] = await Promise.all([
    db.select().from(vehicle_inventory).where(eq(vehicle_inventory.status, "disponivel")),
    db.select().from(vehicle_inventory).where(eq(vehicle_inventory.status, "reservado")),
    db.select().from(vehicle_inventory).where(eq(vehicle_inventory.status, "vendido")),
    db.select().from(vehicle_inventory).where(eq(vehicle_inventory.status, "em_preparacao")),
    db.select().from(vehicle_inventory).where(eq(vehicle_inventory.status, "transferido")),
  ]);

  return {
    available: available.length,
    reserved: reserved.length,
    sold: sold.length,
    preparing: preparing.length,
    transferred: transferred.length,
    total: available.length + reserved.length + sold.length + preparing.length + transferred.length,
  };
});

/**
 * Combined inventory router
 */
export const inventoryRouter = router({
  list: listInventory,
  create: createInventoryItem,
  addFromInspection: addFromInspection,
  updateStatus: updateInventoryStatus,
  delete: deleteInventoryItem,
  stats: inventoryStats,
});
