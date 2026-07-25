import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getUserById, updateUserRole } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

export const usersRouter = router({
  /**
   * Retorna o perfil do usuário autenticado.
   */
  me: protectedProcedure.query(({ ctx }) => ctx.user),

  /**
   * Admin: atualiza o papel de um usuário.
   * Usado para atribuir os papéis vendedor/financeiro/administrativo.
   */
  updateRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin", "vendedor", "financeiro", "administrativo"]),
    }))
    .mutation(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado." });
      await updateUserRole(input.userId, input.role);
      return { success: true };
    }),
});
