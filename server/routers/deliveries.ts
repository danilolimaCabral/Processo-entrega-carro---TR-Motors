import { z } from "zod";
import { eq, like, desc, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  vehicle_deliveries,
  type InsertVehicleDelivery,
} from "../../drizzle/schema";

/**
 * List all deliveries
 */
export const listDeliveries = protectedProcedure
  .input(
    z.object({
      status: z.string().optional(),
    }).optional()
  )
  .query(async ({ input }) => {
    const db = await getDb();
    let query = db
      .select({
        delivery: vehicle_deliveries,
      })
      .from(vehicle_deliveries);

    if (input?.status) {
      query = query.where(eq(vehicle_deliveries.status, input.status as any));
    }

    return query.orderBy(desc(vehicle_deliveries.createdAt));
  });

/**
 * Create a new delivery
 */
export const createDelivery = protectedProcedure
  .input(
    z.object({
      saleRecordId: z.number().optional(),
      despachanteDocId: z.number().optional(),
      customerName: z.string().min(1),
      customerPhone: z.string().optional(),
      customerCpf: z.string().optional(),
      vehicleDescription: z.string().min(1),
      vehiclePlate: z.string().optional(),
      scheduledDate: z.string().optional(),
      scheduledTime: z.string().optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    const insertData: InsertVehicleDelivery = {
      saleRecordId: input.saleRecordId ?? null,
      despachanteDocId: input.despachanteDocId ?? null,
      customerName: input.customerName,
      customerPhone: input.customerPhone ?? null,
      customerCpf: input.customerCpf ?? null,
      vehicleDescription: input.vehicleDescription,
      vehiclePlate: input.vehiclePlate ?? null,
      scheduledDate: input.scheduledDate ?? null,
      scheduledTime: input.scheduledTime ?? null,
      notes: input.notes ?? null,
      status: "agendada",
    };
    const result = await db.insert(vehicle_deliveries).values(insertData);
    return { success: true, id: result[0].insertId };
  });

/**
 * Update delivery status and checklist
 */
export const updateDelivery = protectedProcedure
  .input(
    z.object({
      id: z.number(),
      status: z.string().optional(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      vehicleDescription: z.string().optional(),
      vehiclePlate: z.string().optional(),
      scheduledDate: z.string().optional(),
      scheduledTime: z.string().optional(),
      notes: z.string().optional(),
      // Checklist items
      checklistChaves: z.boolean().optional(),
      checklistDocumentos: z.boolean().optional(),
      checklistManual: z.boolean().optional(),
      checklistKitPrimeirosSocorros: z.boolean().optional(),
      checklistMacaco: z.boolean().optional(),
      checklistEstepe: z.boolean().optional(),
      checklistChaveRodas: z.boolean().optional(),
      checklistTanqueCheio: z.boolean().optional(),
      checklistAcessorios: z.boolean().optional(),
      checklistRevisao: z.boolean().optional(),
      checklistFotoPlaca: z.boolean().optional(),
      checklistOdometro: z.boolean().optional(),
      checklistCombustivel: z.boolean().optional(),
      checklistAssinaturaContrato: z.boolean().optional(),
      // Delivery details
      deliveredBy: z.number().optional(),
      odometerAtDelivery: z.number().optional(),
      fuelLevelAtDelivery: z.string().optional(),
      customerSignature: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const db = await getDb();
    const updateData: any = {};
    
    if (input.status !== undefined) updateData.status = input.status;
    if (input.customerName !== undefined) updateData.customerName = input.customerName;
    if (input.customerPhone !== undefined) updateData.customerPhone = input.customerPhone;
    if (input.vehicleDescription !== undefined) updateData.vehicleDescription = input.vehicleDescription;
    if (input.vehiclePlate !== undefined) updateData.vehiclePlate = input.vehiclePlate;
    if (input.scheduledDate !== undefined) updateData.scheduledDate = input.scheduledDate;
    if (input.scheduledTime !== undefined) updateData.scheduledTime = input.scheduledTime;
    if (input.notes !== undefined) updateData.notes = input.notes;
    
    // Checklist
    if (input.checklistChaves !== undefined) updateData.checklistChaves = input.checklistChaves;
    if (input.checklistDocumentos !== undefined) updateData.checklistDocumentos = input.checklistDocumentos;
    if (input.checklistManual !== undefined) updateData.checklistManual = input.checklistManual;
    if (input.checklistKitPrimeirosSocorros !== undefined) updateData.checklistKitPrimeirosSocorros = input.checklistKitPrimeirosSocorros;
    if (input.checklistMacaco !== undefined) updateData.checklistMacaco = input.checklistMacaco;
    if (input.checklistEstepe !== undefined) updateData.checklistEstepe = input.checklistEstepe;
    if (input.checklistChaveRodas !== undefined) updateData.checklistChaveRodas = input.checklistChaveRodas;
    if (input.checklistTanqueCheio !== undefined) updateData.checklistTanqueCheio = input.checklistTanqueCheio;
    if (input.checklistAcessorios !== undefined) updateData.checklistAcessorios = input.checklistAcessorios;
    if (input.checklistRevisao !== undefined) updateData.checklistRevisao = input.checklistRevisao;
    if (input.checklistFotoPlaca !== undefined) updateData.checklistFotoPlaca = input.checklistFotoPlaca;
    if (input.checklistOdometro !== undefined) updateData.checklistOdometro = input.checklistOdometro;
    if (input.checklistCombustivel !== undefined) updateData.checklistCombustivel = input.checklistCombustivel;
    if (input.checklistAssinaturaContrato !== undefined) updateData.checklistAssinaturaContrato = input.checklistAssinaturaContrato;
    
    // Delivery
    if (input.deliveredBy !== undefined) updateData.deliveredBy = input.deliveredBy;
    if (input.odometerAtDelivery !== undefined) updateData.odometerAtDelivery = input.odometerAtDelivery;
    if (input.fuelLevelAtDelivery !== undefined) updateData.fuelLevelAtDelivery = input.fuelLevelAtDelivery;
    if (input.customerSignature !== undefined) updateData.customerSignature = input.customerSignature;
    if (input.status === "entregue") {
      updateData.deliveredAt = new Date();
    }

    await db.update(vehicle_deliveries).set(updateData).where(eq(vehicle_deliveries.id, input.id));
    return { success: true };
  });

/**
 * Delete a delivery
 */
export const deleteDelivery = protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    await db.delete(vehicle_deliveries).where(eq(vehicle_deliveries.id, input.id));
    return { success: true };
  });

/**
 * Get delivery stats
 */
export const deliveryStats = protectedProcedure.query(async () => {
  const db = await getDb();
  const allDeliveries = await db.select().from(vehicle_deliveries);
  return {
    scheduled: allDeliveries.filter(d => d.status === "agendada").length,
    preparing: allDeliveries.filter(d => d.status === "em_preparacao").length,
    delivered: allDeliveries.filter(d => d.status === "entregue").length,
    cancelled: allDeliveries.filter(d => d.status === "cancelada").length,
    total: allDeliveries.length,
  };
});

/**
 * Combined delivery router
 */
export const deliveryRouter = router({
  list: listDeliveries,
  create: createDelivery,
  update: updateDelivery,
  delete: deleteDelivery,
  stats: deliveryStats,
});
