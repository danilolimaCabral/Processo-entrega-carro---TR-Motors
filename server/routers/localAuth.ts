import { z } from "zod";
import bcryptjs from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { hrProcedure, publicProcedure, router } from "../_core/trpc";
import { getTwoFactorConfig, getUserByEmail, saveTwoFactorConfig, upsertUser } from "../db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import crypto from "node:crypto";

const TWO_FACTOR_ISSUER = "Trmotors Hub";
const TWO_FACTOR_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const TWO_FACTOR_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

type TwoFactorChallenge = {
  user: any;
  secret: string;
  setupRequired: boolean;
  expiresAt: number;
};

const twoFactorChallenges = new Map<string, TwoFactorChallenge>();

function generateTwoFactorSecret(): string {
  const bytes = crypto.randomBytes(20);
  let bits = "";
  for (let index = 0; index < bytes.length; index += 1) {
    bits += bytes[index].toString(2).padStart(8, "0");
  }
  let secret = "";
  for (let index = 0; index + 5 <= bits.length; index += 5) {
    secret += TWO_FACTOR_ALPHABET[parseInt(bits.slice(index, index + 5), 2)];
  }
  return secret;
}

function decodeTwoFactorSecret(secret: string): Buffer {
  let bits = "";
  for (const character of secret.replace(/\s/g, "").toUpperCase()) {
    const value = TWO_FACTOR_ALPHABET.indexOf(character);
    if (value < 0) throw new Error("Segredo de autenticação inválido.");
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

function createTotpCode(secret: string, timeStep: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(timeStep));
  const hash = crypto.createHmac("sha1", decodeTwoFactorSecret(secret)).update(counter).digest();
  const offset = hash[hash.length - 1] & 0x0f;
  const value = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) | ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
  return String(value % 1_000_000).padStart(6, "0");
}

function isTotpCodeValid(secret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const currentStep = Math.floor(Date.now() / 30_000);
  return [-1, 0, 1].some((offset) => {
    const expected = createTotpCode(secret, currentStep + offset);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(code));
  });
}

function createTwoFactorChallenge(user: any, secret: string, setupRequired: boolean): string {
  const challengeId = crypto.randomUUID();
  twoFactorChallenges.set(challengeId, {
    user,
    secret,
    setupRequired,
    expiresAt: Date.now() + TWO_FACTOR_CHALLENGE_TTL_MS,
  });
  return challengeId;
}

async function createAuthenticatedSession(ctx: any, user: any) {
  await upsertUser({ ...user, lastSignedIn: new Date() });
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const token = await sdk.createSessionToken(`local_${user.email}`, {
    expiresInMs: thirtyDaysMs,
    name: user.name || "Usuário",
  });
  ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
  return {
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

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
      let user;
      try {
        user = await getUserByEmail(email);
      } catch (dbError: any) {
        console.error("[Auth] Database error during login:", JSON.stringify({
          message: dbError?.message,
          code: dbError?.code,
          sqlMessage: dbError?.sqlMessage,
          errno: dbError?.errno,
          sqlState: dbError?.sqlState,
          fullError: JSON.stringify(dbError, Object.getOwnPropertyNames(dbError)).slice(0, 500)
        }));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `DB ERROR: ${dbError?.code || ''} ${dbError?.sqlMessage || dbError?.message || 'Erro desconhecido'} (errno=${dbError?.errno}, state=${dbError?.sqlState})`,
        });
      }

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

      const config = await getTwoFactorConfig(Number(user.id));
      const setupRequired = !config?.enabled;
      const secret = config?.secret ?? generateTwoFactorSecret();

      if (!config) {
        await saveTwoFactorConfig(Number(user.id), secret, false);
      }

      const challengeId = createTwoFactorChallenge(user, secret, setupRequired);
      return {
        success: true,
        requiresTwoFactor: true,
        challengeId,
        setupRequired,
        manualKey: setupRequired ? secret : undefined,
        otpauthUrl: setupRequired
          ? `otpauth://totp/${encodeURIComponent(`${TWO_FACTOR_ISSUER}:${user.email}`)}?secret=${secret}&issuer=${encodeURIComponent(TWO_FACTOR_ISSUER)}&period=30&digits=6`
          : undefined,
      };
    }),

  verifyTwoFactor: publicProcedure
    .input(z.object({ challengeId: z.string().uuid(), code: z.string().trim() }))
    .mutation(async ({ input, ctx }) => {
      const challenge = twoFactorChallenges.get(input.challengeId);
      if (!challenge || challenge.expiresAt < Date.now()) {
        twoFactorChallenges.delete(input.challengeId);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Esta solicitação expirou. Faça login novamente." });
      }

      if (!isTotpCodeValid(challenge.secret, input.code)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Código de autenticação inválido." });
      }

      if (challenge.setupRequired) {
        await saveTwoFactorConfig(Number(challenge.user.id), challenge.secret, true);
      }
      twoFactorChallenges.delete(input.challengeId);
      return createAuthenticatedSession(ctx, challenge.user);
    }),

  /**
   * Register a new local user (admin only)
   * This is called by the admin panel to create users
   */
  register: hrProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        role: z.enum(["vendedor", "gerente", "financeiro", "administrativo", "aluno", "rh"]),
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
