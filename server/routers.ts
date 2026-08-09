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
import { rhRouter } from "./routers/rh";
import { inventoryRouter } from "./routers/inventory";
import { pipelineRouter } from "./routers/pipeline";
import { deliveryRouter } from "./routers/deliveries";

import { eadRouter } from "./routers/ead";
import { expensesRouter } from "./routers/expenses";

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
  rh: rhRouter,
  inventory: inventoryRouter,
  pipeline: pipelineRouter,
  delivery: deliveryRouter,
  ead: eadRouter,
  expenses: expensesRouter,
});

export type AppRouter = typeof appRouter;
