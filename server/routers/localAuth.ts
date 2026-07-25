import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserByEmail } from "../db";
import { sdk } from "../_core/sdk";
import { publicProcedure, router } from "../_core/trpc";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME } from "@shared/const";

/**
 * Router de autenticação local (usuário/senha).
 * Permite que usuários criados pelo administrador façam login
 * sem necessidade de OAuth externo.
 */
export const localAuthRouter = router({
  /**
   * Login com email e senha.
   * Retorna o usuário autenticado e define o cookie de sessão.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha obrigatória"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(input.email);

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos.",
        });
      }

      if (!user.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Conta desativada. Entre em contato com o administrador.",
        });
      }

      if (!user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Este usuário não possui senha configurada. Use o login OAuth.",
        });
      }

      const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos.",
        });
      }

      // Gera token de sessão usando o openId do usuário (ou email como fallback)
      const sessionId = user.openId ?? `local_${user.id}`;
      const sessionToken = await sdk.createSessionToken(sessionId, {
        name: user.name ?? user.email ?? "",
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),
});
