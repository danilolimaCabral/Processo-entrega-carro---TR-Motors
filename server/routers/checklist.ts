import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createChecklistItem,
  getChecklistItems,
  getChecklistItemById,
  updateChecklistItemStatus,
  deleteChecklistItem,
  getSaleRecordById,
} from "../db";

export const checklistRouter = router({
  /**
   * Get all checklist items for a sale record
   */
  getItems: protectedProcedure
    .input(z.object({ saleRecordId: z.number() }))
    .query(async ({ input }) => {
      const items = await getChecklistItems(input.saleRecordId);
      return items;
    }),

  /**
   * Create a new checklist item (vendedor only)
   */
  createItem: protectedProcedure
    .input(
      z.object({
        saleRecordId: z.number(),
        itemName: z.string().min(1, "Nome do item é obrigatório"),
        itemDescription: z.string().optional(),
        responsibleRole: z.enum(["financeiro", "administrativo"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "vendedor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas vendedores podem criar itens de checklist",
        });
      }

      // Verify sale record exists and belongs to this vendor
      const saleRecord = await getSaleRecordById(input.saleRecordId);
      if (!saleRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registro de venda não encontrado",
        });
      }

      if (saleRecord.vendedorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para adicionar itens a esta venda",
        });
      }

      const result = await createChecklistItem({
        saleRecordId: input.saleRecordId,
        itemName: input.itemName,
        itemDescription: input.itemDescription,
        responsibleRole: input.responsibleRole,
        status: "pending",
        filledBy: ctx.user.id,
        filledAt: new Date(),
      });

      return {
        success: true,
        message: "Item de checklist criado com sucesso",
      };
    }),

  /**
   * Update checklist item status (financeiro or administrativo)
   */
  updateItemStatus: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
        status: z.enum(["pending", "ok", "issue"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "financeiro" && ctx.user?.role !== "administrativo") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas financeiro e administrativo podem validar itens",
        });
      }

      const item = await getChecklistItemById(input.itemId);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item de checklist não encontrado",
        });
      }

      if (item.responsibleRole !== ctx.user.role) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Este item pertence a outro setor",
        });
      }

      await updateChecklistItemStatus(
        input.itemId,
        input.status,
        input.notes,
        {
          role: ctx.user.role as "financeiro" | "administrativo",
          userId: ctx.user.id,
        }
      );

      return {
        success: true,
        message: "Item atualizado com sucesso",
      };
    }),

  /**
   * Delete checklist item (vendedor only)
   */
  deleteItem: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "vendedor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas vendedores podem deletar itens",
        });
      }

      await deleteChecklistItem(input.itemId);

      return {
        success: true,
        message: "Item deletado com sucesso",
      };
    }),
});
