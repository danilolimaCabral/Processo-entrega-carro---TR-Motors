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
  updateSaleRecordStatus,
  createSaleDocument,
  listSaleDocuments,
  deleteSaleDocument,
} from "../db";
import { storagePut, storageGet } from "../storage";

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
        vehicleColor: z.string().optional(),
        vehiclePrice: z.string().optional(), // Decimal as string
      })
    )
    .mutation(async ({ input, ctx }) => {
      const publicToken = nanoid(32);

      await createSaleRecord({
        vendedorId: ctx.user!.id,
        customerName: input.customerName,
        customerContact: input.customerContact,
        vehicleModel: input.vehicleModel,
        vehicleYear: input.vehicleYear,
        vehicleColor: input.vehicleColor,
        vehiclePrice: input.vehiclePrice
          ? (parseFloat(input.vehiclePrice) as any)
          : null,
        status: "pending_financial",
        publicToken,
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
        vehicleColor: sale.vehicleColor,
        status: sale.status,
        rejectionReason: sale.rejectionReason,
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
   * Approve sale at financial stage (financeiro only)
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

      if (sale.status !== "pending_financial") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta venda não está aguardando aprovação financeira",
        });
      }

      await updateSaleRecordStatus(
        input.saleId,
        "approved_financial",
        ctx.user!.id
      );

      return {
        success: true,
        message: "Venda aprovada na etapa financeira",
      };
    }),

  /**
   * Reject sale at financial stage (financeiro only)
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

      if (sale.status !== "pending_financial") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta venda não está aguardando aprovação financeira",
        });
      }

      await updateSaleRecordStatus(
        input.saleId,
        "rejected_financial",
        ctx.user!.id,
        input.reason
      );

      return {
        success: true,
        message: "Venda rejeitada na etapa financeira",
      };
    }),

  /**
   * Approve sale at administrative stage (administrativo only)
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

      if (sale.status !== "pending_admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta venda não está aguardando aprovação administrativa",
        });
      }

      await updateSaleRecordStatus(
        input.saleId,
        "ready_for_delivery",
        ctx.user!.id
      );

      return {
        success: true,
        message: "Venda pronta para entrega",
      };
    }),

  /**
   * Reject sale at administrative stage (administrativo only)
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

      if (sale.status !== "pending_admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta venda não está aguardando aprovação administrativa",
        });
      }

      await updateSaleRecordStatus(
        input.saleId,
        "rejected_admin",
        ctx.user!.id,
        input.reason
      );

      return {
        success: true,
        message: "Venda rejeitada na etapa administrativa",
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
});
