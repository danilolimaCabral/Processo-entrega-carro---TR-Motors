import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  createSaleRecord,
  getDocumentsBySaleRecord,
  getSaleRecordById,
  getSaleRecordByPublicToken,
  getSaleRecordsBySeller,
  getSaleRecordsByStatus,
  updateSaleRecordStatus,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

// ─── Role-gated middleware helpers ───────────────────────────────────────────

const vendedorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "vendedor" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao perfil Vendedor." });
  }
  return next({ ctx });
});

const financeiroProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "financeiro" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao perfil Financeiro." });
  }
  return next({ ctx });
});

const administrativoProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "administrativo" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao perfil Administrativo." });
  }
  return next({ ctx });
});

// ─── Sales Router ─────────────────────────────────────────────────────────────

export const salesRouter = router({
  /**
   * Vendedor: cria um novo registro de venda.
   * Gera automaticamente um publicToken para o link de acompanhamento do cliente.
   * Os documentos são enviados separadamente via /api/upload-document.
   */
  create: vendedorProcedure
    .input(z.object({
      licensePlate: z.string().min(1).max(20),
      customerName: z.string().optional(),
      customerContact: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const publicToken = nanoid(32);
      const id = await createSaleRecord({
        licensePlate: input.licensePlate.toUpperCase().trim(),
        customerName: input.customerName ?? null,
        customerContact: input.customerContact ?? null,
        status: "aguardando_financeiro",
        sellerId: ctx.user.id,
        sellerName: ctx.user.name ?? "Vendedor",
        publicToken,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { id, publicToken };
    }),

  /**
   * Vendedor: lista os próprios registros de venda.
   */
  listMine: vendedorProcedure
    .query(async ({ ctx }) => {
      const records = await getSaleRecordsBySeller(ctx.user.id);
      const withDocs = await Promise.all(
        records.map(async (r) => ({
          ...r,
          documents: await getDocumentsBySaleRecord(r.id),
        }))
      );
      return withDocs;
    }),

  /**
   * Financeiro: lista registros aguardando aprovação financeira.
   */
  listForFinanceiro: financeiroProcedure
    .query(async () => {
      const records = await getSaleRecordsByStatus("aguardando_financeiro");
      const withDocs = await Promise.all(
        records.map(async (r) => ({
          ...r,
          documents: await getDocumentsBySaleRecord(r.id),
        }))
      );
      return withDocs;
    }),

  /**
   * Administrativo: lista registros aguardando aprovação administrativa.
   */
  listForAdministrativo: administrativoProcedure
    .query(async () => {
      const records = await getSaleRecordsByStatus("aguardando_administrativo");
      const withDocs = await Promise.all(
        records.map(async (r) => ({
          ...r,
          documents: await getDocumentsBySaleRecord(r.id),
        }))
      );
      return withDocs;
    }),

  /**
   * Qualquer papel autenticado: busca um registro por ID com seus documentos.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const record = await getSaleRecordById(input.id);
      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado." });
      }
      // Vendedor só pode ver os seus próprios registros
      if (ctx.user.role === "vendedor" && record.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado." });
      }
      const documents = await getDocumentsBySaleRecord(record.id);
      return { ...record, documents };
    }),

  /**
   * Rota PÚBLICA: busca o status de um processo pelo token único.
   * Não requer autenticação. Usado para o link de acompanhamento do cliente.
   * Retorna apenas informações seguras (sem dados internos sensíveis).
   */
  getByPublicToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const record = await getSaleRecordByPublicToken(input.token);
      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado. Verifique o link." });
      }
      // Retorna apenas dados seguros para exibição pública
      return {
        id: record.id,
        licensePlate: record.licensePlate,
        customerName: record.customerName,
        status: record.status,
        rejectionReason: record.rejectionReason,
        rejectedBy: record.rejectedBy,
        sellerName: record.sellerName,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    }),

  /**
   * Financeiro: aprova o registro, avançando para "Aguardando Administrativo".
   */
  approveFinanceiro: financeiroProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const record = await getSaleRecordById(input.id);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado." });
      if (record.status !== "aguardando_financeiro") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este registro não está aguardando aprovação do Financeiro." });
      }
      await updateSaleRecordStatus(input.id, "aguardando_administrativo");
      return { success: true };
    }),

  /**
   * Financeiro: reprova o registro com motivo obrigatório.
   */
  rejectFinanceiro: financeiroProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().min(1, "O motivo da reprovação é obrigatório."),
    }))
    .mutation(async ({ input }) => {
      const record = await getSaleRecordById(input.id);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado." });
      if (record.status !== "aguardando_financeiro") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este registro não está aguardando aprovação do Financeiro." });
      }
      await updateSaleRecordStatus(input.id, "reprovado", {
        rejectionReason: input.reason,
        rejectedBy: "financeiro",
      });
      return { success: true };
    }),

  /**
   * Administrativo: aprova o registro, liberando para entrega.
   */
  approveAdministrativo: administrativoProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const record = await getSaleRecordById(input.id);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado." });
      if (record.status !== "aguardando_administrativo") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este registro não está aguardando aprovação do Administrativo." });
      }
      await updateSaleRecordStatus(input.id, "liberado_para_entrega");
      return { success: true };
    }),

  /**
   * Administrativo: reprova o registro com motivo obrigatório.
   */
  rejectAdministrativo: administrativoProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().min(1, "O motivo da reprovação é obrigatório."),
    }))
    .mutation(async ({ input }) => {
      const record = await getSaleRecordById(input.id);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado." });
      if (record.status !== "aguardando_administrativo") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este registro não está aguardando aprovação do Administrativo." });
      }
      await updateSaleRecordStatus(input.id, "reprovado", {
        rejectionReason: input.reason,
        rejectedBy: "administrativo",
      });
      return { success: true };
    }),
});
