import { z } from "zod";
import bcryptjs from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { getUserByEmail, upsertUser } from "../db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";

export const localAuthRouter = router({
  /**
   * Login with email and password
   * Returns JWT token that gets set as a session cookie
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      // Find user by email
      const user = await getUserByEmail(email);

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuário foi desativado",
        });
      }

      // Check if user has a password hash (local user)
      if (!user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Este usuário não pode fazer login com email/senha",
        });
      }

      // Verify password
      const passwordValid = await bcryptjs.compare(password, user.passwordHash);

      if (!passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos",
        });
      }

      // Update last signed in
      await upsertUser({
        ...user,
        lastSignedIn: new Date(),
      });

      // Generate JWT token (30 days)
      // Use email as the unique identifier for local users
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const token = await sdk.createSessionToken(`local_${user.email}`, {
        expiresInMs: thirtyDaysMs,
        name: user.name || "Usuário",
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  /**
   * Register a new local user (admin only)
   * This is called by the admin panel to create users
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        role: z.enum(["vendedor", "financeiro", "administrativo", "aluno", "rh"]),
      })
    )
    .mutation(async ({ input }) => {
      const { name, email, password, role } = input;

      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este email já está registrado",
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
});
