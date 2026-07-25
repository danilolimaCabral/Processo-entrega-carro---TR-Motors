import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { salesRouter } from "./routers/sales";
import { usersRouter } from "./routers/users";
import { adminRouter } from "./routers/admin";
import { localAuthRouter } from "./routers/localAuth";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    /** Login local com email e senha (sem OAuth) */
    local: localAuthRouter,
  }),
  sales: salesRouter,
  users: usersRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
