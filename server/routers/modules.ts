import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  erp_modules,
  sale_records,
  inspection_checklists,
  users as usersTable,
  type ErpModule,
} from "../../drizzle/schema";

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

export const modulesRouter = router({
  /**
   * List all modules (admin sees all, others see only active ones for their role)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (ctx.user?.role === "admin") {
      return db.select().from(erp_modules).orderBy(erp_modules.sortOrder);
    }
    return db
      .select()
      .from(erp_modules)
      .where(eq(erp_modules.isActive, true))
      .orderBy(erp_modules.sortOrder);
  }),

  /**
   * Toggle module active status
   */
  toggle: adminProcedure
    .input(z.object({ moduleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const existing = await db
        .select()
        .from(erp_modules)
        .where(eq(erp_modules.id, input.moduleId));

      if (!existing || existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Módulo não encontrado",
        });
      }

      await db
        .update(erp_modules)
        .set({ isActive: !existing[0].isActive })
        .where(eq(erp_modules.id, input.moduleId));

      return {
        success: true,
        message: `Módulo ${existing[0].isActive ? "desativado" : "ativado"} com sucesso`,
      };
    }),

  /**
   * Get dashboard stats — pending documents per seller and sector
   */
  dashboardStats: protectedProcedure.query(async () => {
    const db = await getDb();

    // Get all sale records
    const allSales = await db.select().from(sale_records);

    // Get all users for vendedor names
    const allUsers = await db.select().from(usersTable);
    const userMap = new Map<number, { name: string }>();
    for (const u of allUsers) {
      userMap.set(u.id, { name: u.name || "Desconhecido" });
    }

    // Count pending items per vendedor
    const vendedorStats: Record<
      string,
      { name: string; pendingFinancial: number; pendingAdmin: number }
    > = {};

    for (const sale of allSales) {
      const vendedorId = sale.vendedorId;
      const vendedor = userMap.get(vendedorId);
      const vendedorName = vendedor?.name || `Vendedor #${vendedorId}`;

      if (!vendedorStats[vendedorName]) {
        vendedorStats[vendedorName] = {
          name: vendedorName,
          pendingFinancial: 0,
          pendingAdmin: 0,
        };
      }

      if (sale.financialStatus === "pending") {
        vendedorStats[vendedorName].pendingFinancial++;
      }
      if (sale.adminStatus === "pending") {
        vendedorStats[vendedorName].pendingAdmin++;
      }
    }

    // Count pending checklist items per setor
    const pendingChecklistItems = await db
      .select()
      .from(inspection_checklists)
      .where(eq(inspection_checklists.status, "pending"));

    const setorStats = {
      financeiro: pendingChecklistItems.filter(
        (item) => item.responsibleRole === "financeiro"
      ).length,
      administrativo: pendingChecklistItems.filter(
        (item) => item.responsibleRole === "administrativo"
      ).length,
    };

    const totalPending = Object.values(vendedorStats).reduce(
      (sum, v) => sum + v.pendingFinancial + v.pendingAdmin,
      0
    );

    return {
      vendedorStats: Object.values(vendedorStats),
      setorStats,
      totalPending,
    };
  }),

  /**
   * Seed default modules (runs once on first deploy)
   */
  seed: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Apenas administradores podem criar módulos",
      });
    }

    const existing = await db.select().from(erp_modules).limit(1);
    if (existing.length > 0)
      return { success: true, message: "Módulos já existem" };

    const defaultModules = [
      {
        moduleKey: "vendas",
        name: "Vendas",
        description: "Gerenciar vendas de veículos",
        icon: "Car",
        route: "/vendedor/dashboard",
        allowedRoles: "vendedor,admin",
        isActive: true,
        sortOrder: 1,
      },
      {
        moduleKey: "checklist",
        name: "Checklist",
        description: "Checklist de inspeção de veículos",
        icon: "ClipboardList",
        route: "/vendedor/dashboard",
        allowedRoles: "vendedor,financeiro,administrativo,admin",
        isActive: true,
        sortOrder: 2,
      },
      {
        moduleKey: "financeiro",
        name: "Financeiro",
        description: "Aprovação financeira de vendas",
        icon: "DollarSign",
        route: "/approval",
        allowedRoles: "financeiro,admin",
        isActive: true,
        sortOrder: 3,
      },
      {
        moduleKey: "administrativo",
        name: "Administrativo",
        description: "Aprovação administrativa",
        icon: "Building2",
        route: "/approval",
        allowedRoles: "administrativo,admin",
        isActive: true,
        sortOrder: 4,
      },
      {
        moduleKey: "dashboard",
        name: "Dashboard",
        description: "Visão geral de documentos parados",
        icon: "LayoutDashboard",
        route: "/dashboard",
        allowedRoles: "admin,vendedor,financeiro,administrativo",
        isActive: true,
        sortOrder: 5,
      },
      {
        moduleKey: "usuarios",
        name: "Usuários",
        description: "Gerenciar usuários do sistema",
        icon: "Users",
        route: "/",
        allowedRoles: "admin",
        isActive: true,
        sortOrder: 6,
      },
      {
        moduleKey: "representantes",
        name: "Representantes",
        description: "Gestão de representantes",
        icon: "UsersRound",
        route: "/representantes",
        allowedRoles: "admin",
        isActive: false,
        sortOrder: 7,
      },
      {
        moduleKey: "nfe",
        name: "Nota Fiscal Eletrônica",
        description: "Geração de NF-e",
        icon: "FileText",
        route: "/nfe",
        allowedRoles: "admin,financeiro",
        isActive: false,
        sortOrder: 8,
      },
      {
        moduleKey: "relatorios",
        name: "Relatórios",
        description: "Relatórios e análises",
        icon: "BarChart3",
        route: "/relatorios",
        allowedRoles: "admin",
        isActive: false,
        sortOrder: 9,
      },
      {
        moduleKey: "vistoria",
        name: "Vistoria de Compra",
        description: "Vistoria completa de veículos para compra - fotos, avaliação e valor",
        icon: "Camera",
        route: "/vistoria",
        allowedRoles: "vendedor,admin,financeiro",
        isActive: true,
        sortOrder: 10,
      },
    ];

    for (const mod of defaultModules) {
      await db.insert(erp_modules).values(mod);
    }

    return { success: true, message: `${defaultModules.length} módulos criados` };
  }),
});
