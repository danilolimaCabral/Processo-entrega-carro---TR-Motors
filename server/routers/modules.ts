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
  /**
   * Get the full flow status — visual pipeline showing where each item is stuck
   */
  flowStatus: protectedProcedure.query(async () => {
    const db = await getDb();
    const schema = await import("../../drizzle/schema");

    // Purchase inspections (vistoria de compra)
    const inspections = await db.select().from(inspection_checklists);
    const inspectionsPending = inspections.filter(
      (i) => i.status === "pending" || i.status === "in_progress"
    ).length;
    const inspectionsCompleted = inspections.filter(
      (i) => i.status === "completed" || i.status === "approved"
    ).length;

    // Inventory vehicles
    const inventory = await db.select().from(schema.vehicle_inventory);
    const availableVehicles = inventory.filter(
      (v) => v.status === "disponivel"
    ).length;
    const reservedVehicles = inventory.filter(
      (v) => v.status === "reservado"
    ).length;

    // Pipeline leads
    const pipeline = await db.select().from(schema.sales_pipeline);
    const pipelineByStage: Record<string, number> = {};
    pipeline.forEach((l) => {
      pipelineByStage[l.stage] = (pipelineByStage[l.stage] || 0) + 1;
    });
    const pipelineNovo = pipelineByStage["novo_lead"] || 0;
    const pipelineQualificado = pipelineByStage["qualificado"] || 0;
    const pipelineProposta = pipelineByStage["proposta_enviada"] || 0;
    const pipelineNegociando = pipelineByStage["negociando"] || 0;
    const pipelineVendido = pipelineByStage["venda_fechada"] || 0;

    // Sales records
    const sales = await db.select().from(sale_records);
    const pendingSales = sales.filter(
      (s) => s.financialStatus === "pending" || s.adminStatus === "pending"
    ).length;
    const approvedSales = sales.filter(
      (s) => s.financialStatus === "approved" && s.adminStatus === "approved"
    ).length;
    const pendingFinancial = sales.filter(
      (s) => s.financialStatus === "pending"
    ).length;
    const pendingAdmin = sales.filter(
      (s) => s.adminStatus === "pending" && s.financialStatus === "approved"
    ).length;

    // Despachante documents
    const docs = await db.select().from(schema.despachante_documents);
    const despachantePending = docs.filter(
      (d) => d.status === "pendente" || d.status === "documentos_coletados" || d.status === "em_processamento" || d.status === "cartorio" || d.status === "detran"
    ).length;
    const despachanteCompleted = docs.filter(
      (d) => d.status === "concluido"
    ).length;

    // Delivery
    const deliveries = await db.select().from(schema.vehicle_deliveries);
    const pendingDeliveries = deliveries.filter(
      (d) => d.status !== "entregue"
    ).length;
    const completedDeliveries = deliveries.filter(
      (d) => d.status === "entregue"
    ).length;

    return {
      vistoria: {
        pending: inspectionsPending,
        completed: inspectionsCompleted,
        total: inspections.length,
      },
      estoque: {
        available: availableVehicles,
        reserved: reservedVehicles,
        total: inventory.length,
      },
      pipeline: {
        novoLead: pipelineNovo,
        qualificado: pipelineQualificado,
        proposta: pipelineProposta,
        negociando: pipelineNegociando,
        vendido: pipelineVendido,
        total: pipeline.length,
      },
      vendas: {
        pendingFinancial,
        pendingAdmin,
        pendingTotal: pendingSales,
        approved: approvedSales,
        total: sales.length,
      },
      despachante: {
        pending: despachantePending,
        completed: despachanteCompleted,
        total: docs.length,
      },
      entrega: {
        pending: pendingDeliveries,
        completed: completedDeliveries,
        total: deliveries.length,
      },
    };
  }),

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

    // Sales stats for this month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthSales = allSales.filter(s => {
      const saleDate = new Date(s.createdAt);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });

    // Status is derived: approved = both financial and admin approved
    const isCompleted = (s: typeof allSales[0]) => 
      s.financialStatus === "approved" && s.adminStatus === "approved";
    const isPending = (s: typeof allSales[0]) => !isCompleted(s);

    const completedSales = monthSales.filter(isCompleted).length;
    const pendingSales = monthSales.filter(isPending).length;
    const totalRevenue = monthSales.reduce((sum, s) => sum + parseFloat(s.vehiclePrice || "0"), 0);
    const avgSaleValue = monthSales.length > 0 ? totalRevenue / monthSales.length : 0;

    return {
      vendedorStats: Object.values(vendedorStats),
      setorStats,
      totalPending,
      salesStats: {
        totalSales: monthSales.length,
        completedSales,
        pendingSales,
        totalRevenue,
        averageSaleValue: Math.round(avgSaleValue),
      },
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
      {
        moduleKey: "rh",
        name: "Recursos Humanos",
        description: "Gestão de funcionários, folha de pagamento, ponto, férias e comissões",
        icon: "UserCog",
        route: "/rh",
        allowedRoles: "admin,financeiro,administrativo",
        isActive: true,
        sortOrder: 11,
      },
      {
        moduleKey: "pipeline",
        name: "Pipeline CRM",
        description: "Gestão de leads e funil de vendas",
        icon: "Target",
        route: "/pipeline",
        allowedRoles: "vendedor,admin",
        isActive: true,
        sortOrder: 12,
      },
      {
        moduleKey: "estoque",
        name: "Estoque de Veículos",
        description: "Gestão de veículos disponíveis para venda",
        icon: "Warehouse",
        route: "/estoque",
        allowedRoles: "vendedor,admin",
        isActive: true,
        sortOrder: 13,
      },
      {
        moduleKey: "entrega",
        name: "Entrega",
        description: "Checklist de entrega do veículo ao cliente",
        icon: "Truck",
        route: "/entrega",
        allowedRoles: "admin,financeiro,administrativo",
        isActive: true,
        sortOrder: 14,
      },
      {
        moduleKey: "ead",
        name: "EAD",
        description: "Plataforma de videoaulas e treinamento",
        icon: "GraduationCap",
        route: "/ead",
        allowedRoles: "admin,vendedor,financeiro,administrativo",
        isActive: true,
        sortOrder: 15,
      },
    ];

    for (const mod of defaultModules) {
      await db.insert(erp_modules).values(mod);
    }

    return { success: true, message: `${defaultModules.length} módulos criados` };
  }),
});
