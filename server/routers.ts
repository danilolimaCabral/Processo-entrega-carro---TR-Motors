import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { localAuthRouter } from "./routers/localAuth";
import { adminRouter } from "./routers/admin";
import { salesRouter } from "./routers/sales";
import { checklistRouter } from "./routers/checklist";
import { administrativeChecklistRouter } from "./routers/administrativeChecklist";
import { modulesRouter } from "./routers/modules";
import { purchaseInspectionRouter } from "./routers/purchaseInspection";
import { despachanteRouter } from "./routers/despachante";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: localAuthRouter._def.procedures.login,
    register: localAuthRouter._def.procedures.register,
  }),

  admin: adminRouter,
  sales: salesRouter,
  checklist: checklistRouter,
  administrativeChecklist: administrativeChecklistRouter,
  modules: modulesRouter,
  purchaseInspection: purchaseInspectionRouter,
  despachante: despachanteRouter,
});

export type AppRouter = typeof appRouter;
