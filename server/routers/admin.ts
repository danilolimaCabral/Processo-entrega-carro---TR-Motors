import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getAllUsers, updateUserRole, resetReprovadoForResubmit, getSaleRecordById } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

// ─── Admin-only middleware ────────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao administrador." });
  }
  return next({ ctx });
});

// ─── Admin Router ─────────────────────────────────────────────────────────────

export const adminRouter = router({
  /**
   * Admin: lista todos os usuários com seus papéis atuais.
   */
  listUsers: adminProcedure
    .query(async () => {
      const users = await getAllUsers();
      return users;
    }),

  /**
   * Admin: atualiza o papel de um usuário.
   */
  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["vendedor", "financeiro", "administrativo", "user"]),
    }))
    .mutation(async ({ input }) => {
      await updateUserRole(input.userId, input.role);
      return { success: true };
    }),

  /**
   * Vendedor: reseta um registro reprovado para reenvio de documentos.
   * Apenas o vendedor dono do registro pode fazer isso.
   */
  resetReprovadoForResubmit: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const record = await getSaleRecordById(input.id);
      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado." });
      }

      // Apenas o vendedor dono do registro pode resetar
      if (ctx.user.role === "vendedor" && record.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para resetar este registro." });
      }

      // Apenas registros reprovados podem ser resetados
      if (record.status !== "reprovado") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Apenas registros reprovados podem ser reenviados." });
      }

      await resetReprovadoForResubmit(input.id);
      return { success: true };
    }),
});
