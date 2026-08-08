import { z } from "zod";
import { eq, like, desc, and, or, isNull } from "drizzle-orm";
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
      limit: z.number().optional(),
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

    let results = await query.orderBy(desc(vehicle_inventory.createdAt));
    if (input?.limit) {
      results = results.slice(0, input.limit);
    }
    return results;
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
 * Sync inventory from Revenda Mais API
 * Fetches all vehicles from the external API and upserts them into the database
 */
export const syncFromRevendaMais = protectedProcedure.mutation(async ({ ctx }) => {
  const db = await getDb();

  const API_URL = "http://app.revendamais.com.br/application/index.php/apiGeneratorXml/generator/appdaloja/99700b3d91e196316183441a307a1e1e5555.json";

  try {
    const response = await fetch(API_URL, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Erro ao buscar dados do Revenda Mais: HTTP ${response.status}`,
      });
    }

    const data: any = await response.json();
    const vehicles = data.vehicles || [];

    if (vehicles.length === 0) {
      // Still try to match old vehicles even if API returns empty
      const oldVehicles = await db.select().from(vehicle_inventory).where(isNull(vehicle_inventory.externalId));
      let matched = 0;
      for (const oldV of oldVehicles) {
        const match = vehicles.find((v: any) => {
          const apiBrand = (v.make || "").trim().toUpperCase();
          const apiModel = (v.base_model || v.model || "").trim().toUpperCase();
          const localBrand = (oldV.brand || "").trim().toUpperCase();
          const localModel = (oldV.model || oldV.modelDetail || "").trim().toUpperCase();
          return apiBrand === localBrand && (apiModel.includes(localModel) || localModel.includes(apiModel));
        });
        if (match && match.images) {
          await db.update(vehicle_inventory).set({
            images: JSON.stringify(proxyImages(match.images)),
            imagesLarge: match.images_large ? JSON.stringify(proxyImages(match.images_large)) : null,
            salePrice: match.price ? (parseFloat(match.price) as any) : null,
            promoPrice: match.promotion_price && parseFloat(match.promotion_price) > 0 ? (parseFloat(match.promotion_price) as any) : null,
            fipePrice: match.valor_fipe ? (parseFloat(match.valor_fipe) as any) : null,
            updatedAt: new Date(),
          }).where(eq(vehicle_inventory.id, oldV.id));
          matched++;
        }
      }
      return { success: true, created: 0, updated: matched, total: 0, message: `API vazia, mas ${matched} veículos antigos atualizados com fotos` };
    }

    let created = 0;
    let updated = 0;

    // First pass: try to match old vehicles (without externalId) to Revenda Mais vehicles by brand+model
    // This fills in images for old demo data
    const oldVehicles = await db.select().from(vehicle_inventory).where(isNull(vehicle_inventory.externalId));
    for (const oldV of oldVehicles) {
      const match = vehicles.find((v: any) => {
        const apiBrand = (v.make || "").trim().toUpperCase();
        const apiModel = (v.base_model || v.model || "").trim().toUpperCase();
        const localBrand = (oldV.brand || "").trim().toUpperCase();
        const localModel = (oldV.model || oldV.modelDetail || "").trim().toUpperCase();
        return apiBrand === localBrand && (apiModel.includes(localModel) || localModel.includes(apiModel));
      });
      if (match && match.images) {
        await db.update(vehicle_inventory).set({
          images: JSON.stringify(proxyImages(match.images)),
          imagesLarge: match.images_large ? JSON.stringify(proxyImages(match.images_large)) : null,
          salePrice: match.price ? (parseFloat(match.price) as any) : null,
          promoPrice: match.promotion_price && parseFloat(match.promotion_price) > 0 ? (parseFloat(match.promotion_price) as any) : null,
          fipePrice: match.valor_fipe ? (parseFloat(match.valor_fipe) as any) : null,
          updatedAt: new Date(),
        }).where(eq(vehicle_inventory.id, oldV.id));
        updated++;
      }
    }

    for (const v of vehicles) {
      // Check if vehicle already exists (by vehicle_id from Revenda Mais)
      const existing = await db
        .select()
        .from(vehicle_inventory)
        .where(eq(vehicle_inventory.externalId, v.vehicle_id))
        .limit(1);

      const vehicleData = {
        externalId: v.vehicle_id,
        externalSource: "revendamaais",
        brand: v.make || "",
        model: v.base_model || v.model || "",
        modelDetail: v.model || "",
        year: v.year ? parseInt(v.year) : null,
        fabricYear: v.fabric_year ? parseInt(v.fabric_year) : null,
        km: v.mileage ? parseInt(v.mileage) : null,
        fuel: v.fuel || null,
        color: v.color || null,
        plate: v.plate || null,
        chassi: v.chassi || null,
        doors: v.doors ? parseInt(v.doors) : null,
        motorization: v.motorization || null,
        hp: v.hp ? parseInt(v.hp) : null,
        bodyType: v.body_type || null,
        condition: v.condition || null,
        gear: v.gear || null,
        accessories: v.accessories || null,
        description: v.description || null,
        purchasePrice: v.valor_fipe ? (parseFloat(v.valor_fipe) as any) : null,
        salePrice: v.price ? (parseFloat(v.price) as any) : null,
        promoPrice: v.promotion_price && parseFloat(v.promotion_price) > 0 ? (parseFloat(v.promotion_price) as any) : null,
        fipePrice: v.valor_fipe ? (parseFloat(v.valor_fipe) as any) : null,
        images: v.images ? JSON.stringify(proxyImages(v.images)) : null,
        imagesLarge: v.images_large ? JSON.stringify(proxyImages(v.images_large)) : null,
        location: [v.location_city, v.location_state].filter(Boolean).join(", "),
        status: "disponivel" as any,
        notes: `Sincronizado do Revenda Mais (ID: ${v.vehicle_id})`,
        addedBy: ctx.user.id,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        // Update existing vehicle
        const { externalId, ...updateData } = vehicleData;
        await db.update(vehicle_inventory).set(updateData).where(eq(vehicle_inventory.id, existing[0].id));
        updated++;
      } else {
        // Create new vehicle
        await db.insert(vehicle_inventory).values(vehicleData);
        created++;
      }
    }

    return {
      success: true,
      created,
      updated,
      total: vehicles.length,
      message: `Sincronizado! ${created} novos, ${updated} atualizados de ${vehicles.length} veículos`,
    };
  } catch (error: any) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Erro ao sincronizar com Revenda Mais: ${error.message}`,
    });
  }
});

/**
 * Proxy images through weserv to bypass S3 hotlink protection
 */
function proxyImages(urls: string[]): string[] {
  return urls.map((url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}`);
}

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
  syncRevendaMais: syncFromRevendaMais,
});
