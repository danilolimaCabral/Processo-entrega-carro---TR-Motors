import { z } from "zod";
import bcryptjs from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  listUsers,
  getUserById,
  getUserByEmail,
  updateUserPassword,
  toggleUserActive,
  deleteUser,
  updateUserRole,
  upsertUser,
} from "../db";

/**
 * Admin procedure — only admins can access
 */
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas administradores podem acessar esta funcionalidade",
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  /**
   * List all users
   */
  listUsers: adminProcedure.query(async () => {
    const users = await listUsers();
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      loginMethod: user.loginMethod,
      createdAt: user.createdAt,
      lastSignedIn: user.lastSignedIn,
    }));
  }),

  /**
   * Get user details
   */
  getUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        loginMethod: user.loginMethod,
        createdAt: user.createdAt,
        lastSignedIn: user.lastSignedIn,
      };
    }),

  /**
   * Create a new user
   */
  createUser: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        role: z.enum(["admin", "vendedor", "financeiro", "administrativo", "aluno", "rh"]),
      })
    )
    .mutation(async ({ input }) => {
      const { name, email, password, role } = input;

      // Check if user already exists
      const existing = await getUserByEmail(email);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este email já está em uso",
        });
      }

      // Hash password
      const passwordHash = await bcryptjs.hash(password, 10);

      // Create user
      await upsertUser({
        email,
        name,
        passwordHash,
        role,
        loginMethod: "local",
        isActive: true,
        lastSignedIn: new Date(),
      });

      return {
        success: true,
        message: "Usuário criado com sucesso",
      };
    }),

  /**
   * Reset user password
   */
  resetPassword: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        newPassword: z
          .string()
          .min(6, "Senha deve ter pelo menos 6 caracteres"),
      })
    )
    .mutation(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      const passwordHash = await bcryptjs.hash(input.newPassword, 10);
      await updateUserPassword(input.userId, passwordHash);

      return {
        success: true,
        message: "Senha redefinida com sucesso",
      };
    }),

  /**
   * Toggle user active status
   */
  toggleActive: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      await toggleUserActive(input.userId, input.isActive);

      return {
        success: true,
        message: input.isActive ? "Usuário ativado" : "Usuário desativado",
      };
    }),

  /**
   * Update user role
   */
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["vendedor", "financeiro", "administrativo"]),
      })
    )
    .mutation(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      await updateUserRole(input.userId, input.role);

      return {
        success: true,
        message: "Papel do usuário atualizado",
      };
    }),

  /**
   * Delete user
   */
  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      await deleteUser(input.userId);

      return {
        success: true,
        message: "Usuário deletado com sucesso",
      };
    }),
});
