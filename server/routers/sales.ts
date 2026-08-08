import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createSaleRecord,
  getSaleRecordById,
  getSaleRecordByPublicToken,
  listSaleRecordsByVendor,
  listAllSaleRecords,
  updateSaleFinancialStatus,
  updateSaleAdminStatus,
  createSaleDocument,
  listSaleDocuments,
  deleteSaleDocument,
  recordApprovalHistory,
  getApprovalHistory,
} from "../db";
import { storagePut, storageGet } from "../storage";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import {
  despachante_documents,
  rh_sales_commissions,
  rh_employees,
  vehicle_deliveries,
  vehicle_inventory,
  type InsertDespachanteDocument,
  type InsertSalesCommission,
  type InsertVehicleDelivery,
} from "../../drizzle/schema";

/**
 * Auto-automation when a sale is fully approved (both financial + admin)
 * Creates: despachante document, commission, and delivery record
 */
async function autoProcessApprovedSale(saleId: number, userId: number) {
  const db = await getDb();
  
  // Get the sale
  const sale = await getSaleRecordById(saleId);
  if (!sale) return;

  // Check if BOTH are approved
  if (sale.financialStatus !== "approved" || sale.adminStatus !== "approved") return;

  // 1. Auto-create despachante document
  await db.insert(despachante_documents).values({
    clientName: sale.customerName ?? "Cliente",
    clientCpf: "",
    clientPhone: sale.customerContact ?? "",
    vehiclePlate: sale.vehiclePlate ?? "",
    vehicleBrand: "",
    vehicleModel: sale.vehicleModel ?? "",
    vehicleYear: sale.vehicleYear ?? null,
    docRg: false,
    docCpf: false,
    docComprovanteResidencia: false,
    docCnh: false,
    docCertificadoNascimento: false,
    docComprovantePagamento: false,
    docPoderJuridica: false,
    docDut: false,
    serviceTransferencia: true,
    serviceEmplacamento: true,
    serviceLicenciamento: false,
    serviceCrvCrlv: true,
    serviceCartorio: false,
    serviceReconhecimentoFirma: false,
    observations: `Documento criado automaticamente após aprovação da venda #${saleId}`,
    cartorioStatus: "nao_necessario",
    userId,
    status: "pendente",
  } as InsertDespachanteDocument);

  // 2. Auto-create commission for the seller
  const sellerId = sale.vendedorId;
  // Find the employee linked to this seller
  const employees = await db
    .select()
    .from(rh_employees)
    .where(eq(rh_employees.userId, sellerId))
    .limit(1);

  if (employees.length > 0) {
    const employee = employees[0];
    const salePrice = parseFloat(sale.vehiclePrice ?? "0");
    const commissionPercent = parseFloat(employee.commissionPercent ?? "0");
    const commissionAmount = (salePrice * commissionPercent) / 100;
    const month = new Date().toISOString().slice(0, 7);

    await db.insert(rh_sales_commissions).values({
      employeeId: employee.id,
      saleRecordId: saleId,
      vehicleDescription: `${sale.vehicleModel ?? ""} ${sale.vehicleYear ?? ""}`.trim(),
      salePrice: salePrice as any,
      commissionPercent: commissionPercent as any,
      commissionAmount: commissionAmount as any,
      helpCost: (employee.helpCost ? parseFloat(employee.helpCost) : 0) as any,
      month,
      status: "pendente",
      createdBy: userId,
    } as InsertSalesCommission);
  }

  // 3. Auto-create delivery record
  await db.insert(vehicle_deliveries).values({
    saleRecordId: saleId,
    customerName: sale.customerName ?? "Cliente",
    customerPhone: sale.customerContact ?? "",
    vehicleDescription: `${sale.vehicleModel ?? ""} ${sale.vehicleYear ?? ""}`.trim() || "Veículo vendido",
    vehiclePlate: sale.vehiclePlate ?? "",
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: "agendada",
    notes: `Entrega criada automaticamente após aprovação da venda #${saleId}`,
  } as InsertVehicleDelivery);
}

/**
 * Procedure for vendedor (seller)
 */
const vendedorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "vendedor") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas vendedores podem acessar esta funcionalidade",
    });
  }
  return next({ ctx });
});

/**
 * Procedure for financeiro (financial)
 */
const financeiroProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "financeiro") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas analistas financeiros podem acessar esta funcionalidade",
    });
  }
  return next({ ctx });
});

/**
 * Procedure for administrativo (admin staff)
 */
const administrativoProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "administrativo") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Apenas staff administrativo podem acessar esta funcionalidade",
    });
  }
  return next({ ctx });
});

export const salesRouter = router({
  /**
   * Create a new sale record (vendedor only)
   */
  createSale: vendedorProcedure
    .input(
      z.object({
        customerName: z.string().min(1, "Nome do cliente é obrigatório"),
        customerContact: z.string().optional(),
        vehicleModel: z.string().min(1, "Modelo do veículo é obrigatório"),
        vehicleYear: z.number().int().min(1900).max(2100).optional(),
        vehiclePlate: z.string().optional(),
        vehicleKm: z.number().int().min(0).optional(),
        vehiclePrice: z.string().optional(), // Decimal as string
      })
    )
    .mutation(async ({ input, ctx }) => {
      const publicToken = nanoid(32);

      const sale = await createSaleRecord({
        vendedorId: ctx.user!.id,
        customerName: input.customerName,
        customerContact: input.customerContact,
        vehicleModel: input.vehicleModel,
        vehicleYear: input.vehicleYear,
        vehiclePlate: input.vehiclePlate,
        vehicleKm: input.vehicleKm,
        vehiclePrice: input.vehiclePrice
          ? (parseFloat(input.vehiclePrice) as any)
          : null,
        // Financeiro and administrativo both start reviewing in parallel
        // as soon as the sale is created.
        financialStatus: "pending",
        adminStatus: "pending",
        publicToken,
      });

      if (!sale) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar venda",
        });
      }

      // Record approval history
      await recordApprovalHistory({
        saleRecordId: sale.id,
        actionType: "created",
        userRole: "vendedor",
        userId: ctx.user!.id,
      });

      return {
        success: true,
        publicToken,
        message: "Venda criada com sucesso",
      };
    }),

  /**
   * Get sale record by ID
   */
  getSale: protectedProcedure
    .input(z.object({ saleId: z.number() }))
    .query(async ({ input, ctx }) => {
      const sale = await getSaleRecordById(input.saleId);
      if (!sale) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venda não encontrada",
        });
      }

      // Check access: vendedor can only see their own, others can see all
      if (
        ctx.user?.role === "vendedor" &&
        sale.vendedorId !== ctx.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a esta venda",
        });
      }

      return sale;
    }),

  /**
   * Get sale record by public token (public, no auth required)
   */
  getSaleByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const sale = await getSaleRecordByPublicToken(input.token);
      if (!sale) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Processo não encontrado",
        });
      }

      return {
        id: sale.id,
        customerName: sale.customerName,
        vehicleModel: sale.vehicleModel,
        vehicleYear: sale.vehicleYear,
        vehiclePlate: sale.vehiclePlate,
        vehicleKm: sale.vehicleKm,
        financialStatus: sale.financialStatus,
        adminStatus: sale.adminStatus,
        financialRejectionReason: sale.financialRejectionReason,
        adminRejectionReason: sale.adminRejectionReason,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
      };
    }),

  /**
   * List sales for current vendedor
   */
  listMySales: vendedorProcedure.query(async ({ ctx }) => {
    return await listSaleRecordsByVendor(ctx.user!.id);
  }),

  /**
   * List all sales (financeiro and administrativo)
   */
  listAllSales: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role === "vendedor") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Vendedores não podem listar todas as vendas",
      });
    }
    return await listAllSaleRecords();
  }),

  /**
   * Approve sale on the financial side (financeiro only).
   * Independent of adminStatus — reviewed in parallel, not sequentially.
   */
  approveSaleFinancial: financeiroProcedure
    .input(z.object({ saleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const sale = await getSaleRecordById(input.saleId);
      if (!sale) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venda não encontrada",
        });
      }

      if (sale.financialStatus !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta venda já foi analisada pelo financeiro",
        });
      }

      await updateSaleFinancialStatus(input.saleId, "approved", ctx.user!.id);

            await recordApprovalHistory({
        saleRecordId: input.saleId,
        actionType: "financial_approved",
        userRole: "financeiro",
        userId: ctx.user!.id,
      });
      // Auto-automation: create despachante, commission, delivery
      await autoProcessApprovedSale(input.saleId, ctx.user!.id);
      return {
        success: true,
        message: "Venda aprovada pelo financeiro",
      };
    }),

  /**
   * Reject sale on the financial side (financeiro only).
   * Independent of adminStatus — administrativo keeps reviewing regardless.
   */
  rejectSaleFinancial: financeiroProcedure
    .input(
      z.object({
        saleId: z.number(),
        reason: z.string().min(1, "Motivo é obrigatório"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const sale = await getSaleRecordById(input.saleId);
      if (!sale) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venda não encontrada",
        });
      }

      if (sale.financialStatus !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta venda já foi analisada pelo financeiro",
        });
      }

      await updateSaleFinancialStatus(
        input.saleId,
        "rejected",
        ctx.user!.id,
        input.reason
      );

      await recordApprovalHistory({
        saleRecordId: input.saleId,
        actionType: "financial_rejected",
        userRole: "financeiro",
        userId: ctx.user!.id,
        reason: input.reason,
      });

      return {
        success: true,
        message: "Venda rejeitada pelo financeiro",
      };
    }),

  /**
   * Approve sale on the administrative side (administrativo only).
   * Independent of financialStatus — reviewed in parallel, not sequentially.
   */
  approveSaleAdmin: administrativoProcedure
    .input(z.object({ saleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const sale = await getSaleRecordById(input.saleId);
      if (!sale) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venda não encontrada",
        });
      }

      if (sale.adminStatus !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta venda já foi analisada pelo administrativo",
        });
      }

      await updateSaleAdminStatus(input.saleId, "approved", ctx.user!.id);

            await recordApprovalHistory({
        saleRecordId: input.saleId,
        actionType: "admin_approved",
        userRole: "administrativo",
        userId: ctx.user!.id,
      });
      // Auto-automation: create despachante, commission, delivery
      await autoProcessApprovedSale(input.saleId, ctx.user!.id);
      return {
        success: true,
        message: "Venda aprovada pelo administrativo",
      };
    }),

  /**
   * Reject sale on the administrative side (administrativo only).
   * Independent of financialStatus — financeiro keeps reviewing regardless.
   */
  rejectSaleAdmin: administrativoProcedure
    .input(
      z.object({
        saleId: z.number(),
        reason: z.string().min(1, "Motivo é obrigatório"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const sale = await getSaleRecordById(input.saleId);
      if (!sale) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venda não encontrada",
        });
      }

      if (sale.adminStatus !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta venda já foi analisada pelo administrativo",
        });
      }

      await updateSaleAdminStatus(
        input.saleId,
        "rejected",
        ctx.user!.id,
        input.reason
      );

      await recordApprovalHistory({
        saleRecordId: input.saleId,
        actionType: "admin_rejected",
        userRole: "administrativo",
        userId: ctx.user!.id,
        reason: input.reason,
      });

      return {
        success: true,
        message: "Venda rejeitada pelo administrativo",
      };
    }),

  /**
   * Upload a document (PDF) for a sale
   */
  uploadDocument: vendedorProcedure
    .input(
      z.object({
        saleId: z.number(),
        documentType: z.enum(["cartorio", "payment"]),
        filename: z.string(),
        fileData: z.instanceof(Buffer),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const sale = await getSaleRecordById(input.saleId);
      if (!sale) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venda não encontrada",
        });
      }

      // Verify ownership
      if (sale.vendedorId !== ctx.user!.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a esta venda",
        });
      }

      // Upload to S3
      const storageResult = await storagePut(
        `sales/${input.saleId}/${input.documentType}/${input.filename}`,
        input.fileData,
        "application/pdf"
      );

      // Create document record
      await createSaleDocument({
        saleRecordId: input.saleId,
        documentType: input.documentType,
        filename: input.filename,
        fileKey: storageResult.key,
        fileUrl: storageResult.url,
        mimeType: "application/pdf",
        fileSize: input.fileData.length,
        uploadedBy: ctx.user!.id,
      });

      return {
        success: true,
        url: storageResult.url,
        message: "Documento enviado com sucesso",
      };
    }),

  /**
   * List documents for a sale
   */
  listDocuments: protectedProcedure
    .input(z.object({ saleId: z.number() }))
    .query(async ({ input, ctx }) => {
      const sale = await getSaleRecordById(input.saleId);
      if (!sale) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venda não encontrada",
        });
      }

      // Check access
      if (
        ctx.user?.role === "vendedor" &&
        sale.vendedorId !== ctx.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a esta venda",
        });
      }

      return await listSaleDocuments(input.saleId);
    }),

  /**
   * Delete a document
   */
  deleteDocument: vendedorProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteSaleDocument(input.documentId);

      return {
        success: true,
        message: "Documento deletado com sucesso",
      };
    }),

  /**
   * Get approval history for a sale
   */
  getApprovalHistory: protectedProcedure
    .input(z.object({ saleId: z.number() }))
    .query(async ({ input, ctx }) => {
      const sale = await getSaleRecordById(input.saleId);
      if (!sale) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venda não encontrada",
        });
      }

      // Check access
      if (
        ctx.user?.role === "vendedor" &&
        sale.vendedorId !== ctx.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a esta venda",
        });
      }

      return await getApprovalHistory(input.saleId);
    }),
});
