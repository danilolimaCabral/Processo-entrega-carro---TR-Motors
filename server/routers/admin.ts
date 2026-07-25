import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  getAllUsers,
  updateUserRole,
  resetReprovadoForResubmit,
  getSaleRecordById,
  createLocalUser,
  updateUserActiveStatus,
  deleteUser,
  updateUserPassword,
  getUserByEmail,
} from "../db";
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
   * Admin: cria um novo usuário com credenciais locais (email + senha).
   * O usuário receberá um link de acesso que pode ser enviado a ele.
   */
  createUser: adminProcedure
    .input(z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z.string().email("Email inválido"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      role: z.enum(["user", "vendedor", "financeiro", "administrativo"]),
    }))
    .mutation(async ({ input }) => {
      // Verifica se o email já está em uso
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um usuário com este email.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const userId = await createLocalUser({
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      });

      return { success: true, userId };
    }),

  /**
   * Admin: redefine a senha de um usuário.
   */
  resetPassword: adminProcedure
    .input(z.object({
      userId: z.number(),
      newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ input }) => {
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await updateUserPassword(input.userId, passwordHash);
      return { success: true };
    }),

  /**
   * Admin: ativa ou desativa um usuário.
   */
  setUserActive: adminProcedure
    .input(z.object({
      userId: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      await updateUserActiveStatus(input.userId, input.isActive ? 1 : 0);
      return { success: true };
    }),

  /**
   * Admin: remove permanentemente um usuário do sistema.
   */
  deleteUser: adminProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Impede que o admin se auto-exclua
      if (ctx.user.id === input.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não pode excluir sua própria conta.",
        });
      }
      await deleteUser(input.userId);
      return { success: true };
    }),

  /**
   * Vendedor/Admin: reseta um registro reprovado para reenvio de documentos.
   * Apenas o vendedor dono do registro pode fazer isso.
   */
  resetReprovadoForResubmit: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const record = await getSaleRecordById(input.id);
      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado." });
      }

      // Apenas o vendedor dono do registro ou admin podem resetar
      const isOwner = record.sellerId === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";
      if (!isOwner && !isAdmin) {
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
