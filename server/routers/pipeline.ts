import { z } from "zod";
import { eq, like, desc, or, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  sales_pipeline,
  type InsertSalesPipeline,
} from "../../drizzle/schema";

/**
 * List all pipeline leads
 */
export const listPipeline = protectedProcedure
  .input(
    z.object({
      stage: z.string().optional(),
      sellerId: z.number().optional(),
    }).optional()
  )
  .query(async ({ input }) => {
    const db = await getDb();
    let query = db
      .select({
        lead: sales_pipeline,
      })
      .from(sales_pipeline);

    if (input?.stage) {
      query = query.where(eq(sales_pipeline.stage, input.stage as any));
    } else if (input?.sellerId) {
      query = query.where(eq(sales_pipeline.sellerId, input.sellerId));
    }

    return query.orderBy(desc(sales_pipeline.createdAt));
  });

/**
 * Create a new lead in the pipeline
 */
export const createLead = protectedProcedure
  .input(
    z.object({
      leadName: z.string().min(1, "Nome do lead é obrigatório"),
      leadPhone: z.string().optional(),
      leadEmail: z.string().optional(),
      source: z.string().default("balcao"),
      vehicleId: z.number().optional(),
      vehicleDescription: z.string().optional(),
      sellerId: z.number().optional(),
      notes: z.string().optional(),
      nextFollowUp: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    const insertData: InsertSalesPipeline = {
      leadName: input.leadName,
      leadPhone: input.leadPhone ?? null,
      leadEmail: input.leadEmail ?? null,
      source: input.source as any,
      vehicleId: input.vehicleId ?? null,
      vehicleDescription: input.vehicleDescription ?? null,
      sellerId: input.sellerId ?? null,
      notes: input.notes ?? null,
      nextFollowUp: input.nextFollowUp ?? null,
      stage: "novo_lead",
      sellerUserId: ctx.user.id,
    };
    const result = await db.insert(sales_pipeline).values(insertData);
    return { success: true, id: result[0].insertId };
  });

/**
 * Update a lead's stage and details
 */
export const updateLead = protectedProcedure
  .input(
    z.object({
      id: z.number(),
      leadName: z.string().optional(),
      leadPhone: z.string().optional(),
      leadEmail: z.string().optional(),
      stage: z.string().optional(),
      source: z.string().optional(),
      vehicleId: z.number().optional(),
      vehicleDescription: z.string().optional(),
      sellerId: z.number().optional(),
      proposedPrice: z.string().optional(),
      tradeInValue: z.string().optional(),
      downPayment: z.string().optional(),
      financingAmount: z.string().optional(),
      financingBank: z.string().optional(),
      notes: z.string().optional(),
      nextFollowUp: z.string().optional(),
      lostReason: z.string().optional(),
      saleRecordId: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const db = await getDb();
    const updateData: any = {};
    if (input.leadName !== undefined) updateData.leadName = input.leadName;
    if (input.leadPhone !== undefined) updateData.leadPhone = input.leadPhone;
    if (input.leadEmail !== undefined) updateData.leadEmail = input.leadEmail;
    if (input.stage !== undefined) updateData.stage = input.stage;
    if (input.source !== undefined) updateData.source = input.source;
    if (input.vehicleId !== undefined) updateData.vehicleId = input.vehicleId;
    if (input.vehicleDescription !== undefined) updateData.vehicleDescription = input.vehicleDescription;
    if (input.sellerId !== undefined) updateData.sellerId = input.sellerId;
    if (input.proposedPrice !== undefined) updateData.proposedPrice = input.proposedPrice ? (parseFloat(input.proposedPrice) as any) : null;
    if (input.tradeInValue !== undefined) updateData.tradeInValue = input.tradeInValue ? (parseFloat(input.tradeInValue) as any) : null;
    if (input.downPayment !== undefined) updateData.downPayment = input.downPayment ? (parseFloat(input.downPayment) as any) : null;
    if (input.financingAmount !== undefined) updateData.financingAmount = input.financingAmount ? (parseFloat(input.financingAmount) as any) : null;
    if (input.financingBank !== undefined) updateData.financingBank = input.financingBank;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.nextFollowUp !== undefined) updateData.nextFollowUp = input.nextFollowUp;
    if (input.lostReason !== undefined) updateData.lostReason = input.lostReason;
    if (input.saleRecordId !== undefined) updateData.saleRecordId = input.saleRecordId;

    await db.update(sales_pipeline).set(updateData).where(eq(sales_pipeline.id, input.id));
    return { success: true };
  });

/**
 * Convert a lead to a sale (advanced stage)
 */
export const convertLeadToSale = protectedProcedure
  .input(
    z.object({
      leadId: z.number(),
      saleRecordId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const db = await getDb();
    await db.update(sales_pipeline).set({
      stage: "venda_fechada",
      saleRecordId: input.saleRecordId,
    }).where(eq(sales_pipeline.id, input.leadId));
    return { success: true };
  });

/**
 * Delete a lead
 */
export const deleteLead = protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    await db.delete(sales_pipeline).where(eq(sales_pipeline.id, input.id));
    return { success: true };
  });

/**
 * Get pipeline stats by stage
 */
export const pipelineStats = protectedProcedure.query(async () => {
  const db = await getDb();
  const allLeads = await db.select().from(sales_pipeline);
  return {
    novo_lead: allLeads.filter(l => l.stage === "novo_lead").length,
    qualificado: allLeads.filter(l => l.stage === "qualificado").length,
    proposta_enviada: allLeads.filter(l => l.stage === "proposta_enviada").length,
    negociando: allLeads.filter(l => l.stage === "negociando").length,
    venda_fechada: allLeads.filter(l => l.stage === "venda_fechada").length,
    perdido: allLeads.filter(l => l.stage === "perdido").length,
    total: allLeads.length,
  };
});

/**
 * Combined pipeline router
 */
export const pipelineRouter = router({
  list: listPipeline,
  create: createLead,
  update: updateLead,
  convertToSale: convertLeadToSale,
  delete: deleteLead,
  stats: pipelineStats,
});
