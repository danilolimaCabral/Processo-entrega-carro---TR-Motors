import { z } from "zod";
import { eq, like, desc, and, between, or, count, inArray } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  rh_departments,
  rh_positions,
  rh_employees,
  rh_leave_requests,
  rh_attendance,
  rh_holidays,
  rh_sales_commissions,
  rh_uniforms,
  rh_cost_invoices,
  type InsertDepartment,
  type InsertPosition,
  type InsertEmployee,
  type InsertLeaveRequest,
  type InsertAttendance,
  type InsertHoliday,
  type InsertSalesCommission,
} from "../../drizzle/schema";

export const rhRouter = router({
  // ==================== Departments ====================
  listDepartments: protectedProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(rh_departments).orderBy(desc(rh_departments.createdAt));
  }),

  createDepartment: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.insert(rh_departments).values(input as InsertDepartment);
      return { success: true, id: result[0].insertId };
    }),

  updateDepartment: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db.update(rh_departments).set(data).where(eq(rh_departments.id, id));
      return { success: true };
    }),

  deleteDepartment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(rh_departments).where(eq(rh_departments.id, input.id));
      return { success: true };
    }),

  // ==================== Positions ====================
  listPositions: protectedProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(rh_positions).orderBy(desc(rh_positions.createdAt));
  }),

  createPosition: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        salaryMin: z.string().optional(),
        salaryMax: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.insert(rh_positions).values(input as InsertPosition);
      return { success: true, id: result[0].insertId };
    }),

  updatePosition: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        salaryMin: z.string().optional(),
        salaryMax: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db.update(rh_positions).set(data).where(eq(rh_positions.id, id));
      return { success: true };
    }),

  deletePosition: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(rh_positions).where(eq(rh_positions.id, input.id));
      return { success: true };
    }),

  // ==================== Employees ====================
  listEmployees: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        departmentId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      let query = db.select().from(rh_employees);
      if (input?.search) {
        query = query.where(
          or(
            like(rh_employees.name, `%${input.search}%`),
            like(rh_employees.cpf, `%${input.search}%`),
            like(rh_employees.email, `%${input.search}%`)
          )
        );
      } else if (input?.status) {
        query = query.where(eq(rh_employees.status, input.status as any));
      } else if (input?.departmentId) {
        query = query.where(eq(rh_employees.departmentId, input.departmentId));
      }
      return query.orderBy(desc(rh_employees.createdAt));
    }),

  getEmployeeById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const result = await db.select().from(rh_employees).where(eq(rh_employees.id, input.id));
      return result[0] || null;
    }),

  createEmployee: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        cpf: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        positionId: z.number().optional(),
        departmentId: z.number().optional(),
        hireDate: z.string().optional(),
        salary: z.string().optional(),
        status: z.string().optional(),
        address: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.insert(rh_employees).values({
        ...input,
        status: (input.status as any) || "ativo",
      } as InsertEmployee);
      return { success: true, id: result[0].insertId };
    }),

  updateEmployee: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        cpf: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        positionId: z.number().optional(),
        departmentId: z.number().optional(),
        hireDate: z.string().optional(),
        salary: z.string().optional(),
        status: z.string().optional(),
        address: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db.update(rh_employees).set(data as Partial<InsertEmployee>).where(eq(rh_employees.id, id));
      return { success: true };
    }),

  deleteEmployee: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(rh_employees).where(eq(rh_employees.id, input.id));
      return { success: true };
    }),

  // ==================== Leave Requests ====================
  listLeaveRequests: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        status: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      let query = db
        .select({
          leave: rh_leave_requests,
          employee: rh_employees,
        })
        .from(rh_leave_requests)
        .innerJoin(rh_employees, eq(rh_leave_requests.employeeId, rh_employees.id));

      if (input?.employeeId) {
        query = query.where(eq(rh_leave_requests.employeeId, input.employeeId));
      } else if (input?.status) {
        query = query.where(eq(rh_leave_requests.status, input.status as any));
      }
      return query.orderBy(desc(rh_leave_requests.createdAt));
    }),

  createLeaveRequest: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        type: z.string(),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.insert(rh_leave_requests).values(input as InsertLeaveRequest);
      return { success: true, id: result[0].insertId };
    }),

  updateLeaveStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pendente", "aprovado", "rejeitado", "cancelado"]),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const data: any = {
        status: input.status,
        approvedAt: new Date(),
      };
      if (input.rejectionReason) data.rejectionReason = input.rejectionReason;
      await db.update(rh_leave_requests).set(data).where(eq(rh_leave_requests.id, input.id));
      return { success: true };
    }),

  // ==================== Attendance ====================
  listAttendance: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        date: z.string().optional(),
        dateRange: z.object({ start: z.string(), end: z.string() }).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      let query = db
        .select({
          attendance: rh_attendance,
          employee: rh_employees,
        })
        .from(rh_attendance)
        .innerJoin(rh_employees, eq(rh_attendance.employeeId, rh_employees.id));

      if (input?.employeeId) {
        query = query.where(eq(rh_attendance.employeeId, input.employeeId));
      } else if (input?.date) {
        query = query.where(eq(rh_attendance.date, input.date));
      } else if (input?.dateRange) {
        query = query.where(between(rh_attendance.date, input.dateRange.start, input.dateRange.end));
      }
      return query.orderBy(desc(rh_attendance.date));
    }),

  createAttendance: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        date: z.string().min(1),
        clockIn: z.string().optional(),
        clockOut: z.string().optional(),
        breakStart: z.string().optional(),
        breakEnd: z.string().optional(),
        type: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.insert(rh_attendance).values(input as InsertAttendance);
      return { success: true, id: result[0].insertId };
    }),

  updateAttendance: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        clockIn: z.string().optional(),
        clockOut: z.string().optional(),
        breakStart: z.string().optional(),
        breakEnd: z.string().optional(),
        type: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db.update(rh_attendance).set(data as Partial<InsertAttendance>).where(eq(rh_attendance.id, id));
      return { success: true };
    }),

  // ==================== Holidays ====================
  listHolidays: protectedProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(rh_holidays).orderBy(rh_holidays.date);
  }),

  createHoliday: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        date: z.string().min(1),
        type: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.insert(rh_holidays).values(input as InsertHoliday);
      return { success: true, id: result[0].insertId };
    }),

  deleteHoliday: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(rh_holidays).where(eq(rh_holidays.id, input.id));
      return { success: true };
    }),

  // ==================== Sales Commissions ====================
  listCommissions: protectedProcedure
    .input(
      z.object({
        employeeId: z.number().optional(),
        month: z.string().optional(),
        status: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      let query = db
        .select({
          commission: rh_sales_commissions,
          employee: rh_employees,
        })
        .from(rh_sales_commissions)
        .innerJoin(rh_employees, eq(rh_sales_commissions.employeeId, rh_employees.id));

      if (input?.employeeId) {
        query = query.where(eq(rh_sales_commissions.employeeId, input.employeeId));
      } else if (input?.month) {
        query = query.where(eq(rh_sales_commissions.month, input.month));
      } else if (input?.status) {
        query = query.where(eq(rh_sales_commissions.status, input.status as any));
      }
      return query.orderBy(desc(rh_sales_commissions.createdAt));
    }),

  createCommission: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        saleRecordId: z.number().optional(),
        vehicleDescription: z.string().optional(),
        salePrice: z.string(),
        commissionPercent: z.string(),
        helpCost: z.string().optional(),
        month: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const salePrice = parseFloat(input.salePrice);
      const commissionPercent = parseFloat(input.commissionPercent);
      const helpCost = parseFloat(input.helpCost || "0");
      const commissionAmount = (salePrice * commissionPercent) / 100;
      const month = input.month || new Date().toISOString().slice(0, 7);

      const result = await db.insert(rh_sales_commissions).values({
        ...input,
        helpCost: helpCost,
        commissionAmount: commissionAmount.toString(),
        month,
        status: "pendente",
        createdBy: ctx.user?.id,
      } as InsertSalesCommission);

      // Update employee stats
      await db.update(rh_employees)
        .set({
          salesCount: (await db.select({ c: count() }).from(rh_employees).where(eq(rh_employees.id, input.employeeId)))[0]?.c !== undefined
            ? 1
            : undefined,
        })
        .where(eq(rh_employees.id, input.employeeId));

      return { success: true, id: result[0].insertId, commissionAmount };
    }),

  updateCommissionStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pendente", "pago", "cancelado"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const data: any = { status: input.status };
      if (input.status === "pago") data.paidAt = new Date();
      await db.update(rh_sales_commissions).set(data).where(eq(rh_sales_commissions.id, input.id));
      return { success: true };
    }),

  deleteCommission: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(rh_sales_commissions).where(eq(rh_sales_commissions.id, input.id));
      return { success: true };
    }),

  commissionSummary: protectedProcedure
    .input(z.object({ month: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const month = input?.month || new Date().toISOString().slice(0, 7);
      const commissions = await db
        .select()
        .from(rh_sales_commissions)
        .where(eq(rh_sales_commissions.month, month));

      const totalCommission = commissions.reduce((sum, c) => sum + parseFloat(c.commissionAmount || "0"), 0);
      const totalHelpCost = commissions.reduce((sum, c) => sum + parseFloat(c.helpCost || "0"), 0);
      const paid = commissions.filter(c => c.status === "pago").length;
      const pending = commissions.filter(c => c.status === "pendente").length;

      return { totalCommission, totalHelpCost, paid, pending, count: commissions.length, month };
    }),

  // ==================== Payroll (Folha de Pagamento) ====================
  payrollSummary: protectedProcedure
    .input(z.object({ month: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const month = input?.month || new Date().toISOString().slice(0, 7);

      // Get all active employees
      const employees = await db
        .select()
        .from(rh_employees)
        .where(eq(rh_employees.status, "ativo"));

      // Get commissions for this month
      const commissions = await db
        .select()
        .from(rh_sales_commissions)
        .where(eq(rh_sales_commissions.month, month));

      // Get attendance for this month
      const attendanceStart = `${month}-01`;
      const attendanceEnd = `${month}-31`;
      const attendanceRecords = await db
        .select()
        .from(rh_attendance)
        .where(between(rh_attendance.date, attendanceStart, attendanceEnd));

      // Calculate payroll per employee
      const payrollItems = employees.map((emp) => {
        const baseSalary = parseFloat(emp.salary || "0");
        const helpCost = parseFloat(emp.helpCost || "0");

        // Commissions for this employee this month
        const empCommissions = commissions.filter((c) => c.employeeId === emp.id);
        const totalCommission = empCommissions.reduce(
          (sum, c) => sum + parseFloat(c.commissionAmount || "0"),
          0
        );

        // Attendance count this month
        const empAttendance = attendanceRecords.filter(
          (a) => a.employeeId === emp.id
        );
        const daysWorked = empAttendance.length;

        const totalPayroll = baseSalary + helpCost + totalCommission;

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          baseSalary,
          helpCost,
          commission: totalCommission,
          daysWorked,
          totalPayroll,
          status: emp.status,
        };
      });

      const totalPayroll = payrollItems.reduce((sum, item) => sum + item.totalPayroll, 0);
      const totalCommissions = payrollItems.reduce((sum, item) => sum + item.commission, 0);
      const totalHelpCostAll = payrollItems.reduce((sum, item) => sum + item.helpCost, 0);
      const totalBaseSalary = payrollItems.reduce((sum, item) => sum + item.baseSalary, 0);

      return {
        month,
        payrollItems,
        totals: {
          totalPayroll,
          totalCommissions,
          totalHelpCost: totalHelpCostAll,
          totalBaseSalary,
          employeeCount: payrollItems.length,
        },
      };
    }),

  // ==================== Dashboard Stats ====================
  dashboardStats: protectedProcedure.query(async () => {
    const db = await getDb();
    const [totalEmployees, activeEmployees, onVacation, pendingLeaves] = await Promise.all([
      db.select({ count: count() }).from(rh_employees),
      db.select({ count: count() }).from(rh_employees).where(eq(rh_employees.status, "ativo")),
      db.select({ count: count() }).from(rh_employees).where(eq(rh_employees.status, "ativo_ferias")),
      db.select({ count: count() }).from(rh_leave_requests).where(eq(rh_leave_requests.status, "pendente")),
    ]);

    const todayLeaves = await db
      .select({ count: count() })
      .from(rh_attendance)
      .where(eq(rh_attendance.date, new Date().toISOString().split("T")[0]));

    return {
      totalEmployees: totalEmployees[0]?.count || 0,
      activeEmployees: activeEmployees[0]?.count || 0,
      onVacation: onVacation[0]?.count || 0,
      pendingLeaves: pendingLeaves[0]?.count || 0,
      todayAttendance: todayLeaves[0]?.count || 0,
    };
  }),

  // ==================== Uniformes ====================
  listUniforms: protectedProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(rh_uniforms).orderBy(desc(rh_uniforms.createdAt));
  }),

  createUniform: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        type: z.string().min(1, "Tipo obrigatório"),
        size: z.string().optional(),
        quantity: z.number().default(1),
        dateIssued: z.string().optional(),
        status: z.string().default("entregue"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.insert(rh_uniforms).values(input);
      return { success: true };
    }),

  deleteUniform: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(rh_uniforms).where(eq(rh_uniforms.id, input.id));
      return { success: true };
    }),

  // ==================== NF Custos ====================
  listCostInvoices: protectedProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(rh_cost_invoices).orderBy(desc(rh_cost_invoices.invoiceDate));
  }),

  createCostInvoice: protectedProcedure
    .input(
      z.object({
        invoiceNumber: z.string().optional(),
        supplier: z.string().optional(),
        description: z.string().optional(),
        category: z.string().default("Geral"),
        amount: z.number().min(0),
        invoiceDate: z.string().optional(),
        status: z.string().default("pendente"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.insert(rh_cost_invoices).values(input);
      return { success: true };
    }),

  updateCostInvoice: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.string().optional(),
        invoiceNumber: z.string().optional(),
        supplier: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        amount: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      if (Object.keys(data).length > 0) {
        await db.update(rh_cost_invoices).set(data).where(eq(rh_cost_invoices.id, id));
      }
      return { success: true };
    }),

  deleteCostInvoice: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(rh_cost_invoices).where(eq(rh_cost_invoices.id, input.id));
      return { success: true };
    }),

  costInvoicesSummary: protectedProcedure.query(async () => {
    const db = await getDb();
    const invoices = await db.select().from(rh_cost_invoices);
    const total = invoices.reduce((acc, inv) => acc + parseFloat(inv.amount || "0"), 0);
    const pending = invoices.filter(i => i.status === "pendente");
    const paid = invoices.filter(i => i.status === "pago");
    const totalPending = pending.reduce((acc, inv) => acc + parseFloat(inv.amount || "0"), 0);
    const totalPaid = paid.reduce((acc, inv) => acc + parseFloat(inv.amount || "0"), 0);
    return { total, totalPending, totalPaid, count: invoices.length, pendingCount: pending.length, paidCount: paid.length };
  }),

  // ==================== Exit Checklists (Desligamento) ====================
  listExitChecklists: protectedProcedure.query(async () => {
    const db = await getDb();
    const { exit_checklists } = await import("../../drizzle/schema");
    return db.select().from(exit_checklists).orderBy(desc(exit_checklists.createdAt));
  }),
  createExitChecklist: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      employeeName: z.string().min(1),
      initiatedBy: z.number(),
      reason: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { exit_checklists, exit_checklist_items, audit_logs } = await import("../../drizzle/schema");
      const result = await db.insert(exit_checklists).values(input);
      const checklistId = result[0].insertId;
      const defaultItems = [
        { title: "Devolução de uniformes", sector: "RH", responsibleRole: "rh" },
        { title: "Entrega de crachá/equipamentos", sector: "TI", responsibleRole: "admin" },
        { title: "Liberação de pagamentos pendentes", sector: "Financeiro", responsibleRole: "financeiro" },
        { title: "Entrevista de desligamento", sector: "RH", responsibleRole: "rh" },
        { title: "Desativação de acessos", sector: "TI", responsibleRole: "admin" },
      ];
      for (const item of defaultItems) {
        await db.insert(exit_checklist_items).values({
          checklistId,
          title: item.title,
          sector: item.sector,
          responsibleRole: item.responsibleRole,
          status: "pendente",
        });
      }
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "create",
          module: "rh",
          entityId: checklistId,
          entityName: input.employeeName,
          details: "Checklist de saída criado",
        });
      }
      return { success: true, id: checklistId };
    }),
  updateExitChecklistItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pendente", "concluido", "nao_aplicavel"]),
      notes: z.string().optional(),
      completedBy: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { exit_checklist_items, audit_logs } = await import("../../drizzle/schema");
      const data: any = { status: input.status, notes: input.notes };
      if (input.status === "concluido") {
        data.completedAt = new Date();
        if (input.completedBy) data.completedBy = input.completedBy;
        else if (ctx.user) data.completedBy = ctx.user.id;
      }
      await db.update(exit_checklist_items).set(data).where(eq(exit_checklist_items.id, input.id));
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "update",
          module: "rh",
          entityId: input.id,
          details: `Item do checklist atualizado: ${input.status}`,
        });
      }
      return { success: true };
    }),

  // ==================== Employee Documents (Pasta Digital) ====================
  listEmployeeDocuments: protectedProcedure
    .input(z.object({ employeeId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const { employee_documents } = await import("../../drizzle/schema");
      if (input?.employeeId) {
        return db.select().from(employee_documents).where(eq(employee_documents.employeeId, input.employeeId)).orderBy(desc(employee_documents.createdAt));
      }
      return db.select().from(employee_documents).orderBy(desc(employee_documents.createdAt));
    }),
  createEmployeeDocument: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      category: z.string().min(1),
      documentName: z.string().min(1),
      fileUrl: z.string().optional(),
      fileMimeType: z.string().default("application/pdf"),
      expiryDate: z.string().optional(),
      uploadedBy: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { employee_documents, audit_logs } = await import("../../drizzle/schema");
      const data = { ...input, uploadedBy: input.uploadedBy || ctx.user?.id };
      const result = await db.insert(employee_documents).values(data);
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "create",
          module: "rh",
          entityId: result[0].insertId,
          entityName: input.documentName,
          details: `Documento adicionado: ${input.category}`,
        });
      }
      return { success: true, id: result[0].insertId };
    }),
  deleteEmployeeDocument: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { employee_documents, audit_logs } = await import("../../drizzle/schema");
      await db.delete(employee_documents).where(eq(employee_documents.id, input.id));
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "delete",
          module: "rh",
          entityId: input.id,
          details: "Documento excluído",
        });
      }
      return { success: true };
    }),

  // ==================== Job Vacancies (CRM de Candidatos) ====================
  listVacancies: protectedProcedure.query(async () => {
    const db = await getDb();
    const { job_vacancies } = await import("../../drizzle/schema");
    return db.select().from(job_vacancies).orderBy(desc(job_vacancies.createdAt));
  }),
  createVacancy: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      department: z.string().optional(),
      description: z.string().optional(),
      requirements: z.string().optional(),
      salaryRange: z.string().optional(),
      createdBy: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { job_vacancies, audit_logs } = await import("../../drizzle/schema");
      const data = { ...input, createdBy: input.createdBy || ctx.user?.id };
      const result = await db.insert(job_vacancies).values(data);
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "create",
          module: "rh",
          entityId: result[0].insertId,
          entityName: input.title,
          details: "Vaga criada",
        });
      }
      return { success: true, id: result[0].insertId };
    }),
  updateVacancy: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["aberta", "pausada", "fechada"]).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      requirements: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { job_vacancies } = await import("../../drizzle/schema");
      const { id, ...data } = input;
      if (Object.keys(data).length > 0) {
        await db.update(job_vacancies).set(data).where(eq(job_vacancies.id, id));
      }
      return { success: true };
    }),

  // ==================== Candidates ====================
  listCandidates: protectedProcedure
    .input(z.object({ vacancyId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const { candidates } = await import("../../drizzle/schema");
      if (input?.vacancyId) {
        return db.select().from(candidates).where(eq(candidates.vacancyId, input.vacancyId)).orderBy(desc(candidates.createdAt));
      }
      return db.select().from(candidates).orderBy(desc(candidates.createdAt));
    }),
  createCandidate: protectedProcedure
    .input(z.object({
      vacancyId: z.number(),
      name: z.string().min(1),
      email: z.string().optional(),
      phone: z.string().optional(),
      resume: z.string().optional(),
      coverLetter: z.string().optional(),
      salaryExpectation: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { candidates, audit_logs } = await import("../../drizzle/schema");
      const result = await db.insert(candidates).values(input);
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "create",
          module: "rh",
          entityId: result[0].insertId,
          entityName: input.name,
          details: "Candidato cadastrado",
        });
      }
      return { success: true, id: result[0].insertId };
    }),
  updateCandidateStage: protectedProcedure
    .input(z.object({
      id: z.number(),
      stage: z.enum(["inscrito", "triagem", "entrevista", "aprovado", "reprovado"]),
      notes: z.string().optional(),
      rating: z.number().optional(),
      interviewDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { candidates, audit_logs } = await import("../../drizzle/schema");
      const { id, ...data } = input;
      if (data.stage === "aprovado") data.hiredAt = new Date() as any;
      await db.update(candidates).set(data).where(eq(candidates.id, id));
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "update",
          module: "rh",
          entityId: id,
          details: `Candidato movido para: ${input.stage}`,
        });
      }
      return { success: true };
    }),

  // ==================== Learning Paths (Onboarding) ====================
  listLearningPaths: protectedProcedure.query(async () => {
    const db = await getDb();
      const { learning_paths } = await import("../../drizzle/schema");
    return db.select().from(learning_paths).orderBy(desc(learning_paths.createdAt));
  }),
  createLearningPath: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      role: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { learning_paths } = await import("../../drizzle/schema");
      const result = await db.insert(learning_paths).values({ ...input, isActive: true });
      return { success: true, id: result[0].insertId };
    }),

  deleteVacancy: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { job_vacancies, audit_logs } = await import("../../drizzle/schema");
      await db.delete(job_vacancies).where(eq(job_vacancies.id, input.id));
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "delete",
          module: "rh",
          entityId: input.id,
          details: "Vaga excluída",
        });
      }
      return { success: true };
    }),
  deleteLearningPath: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { learning_paths, audit_logs } = await import("../../drizzle/schema");
      await db.delete(learning_paths).where(eq(learning_paths.id, input.id));
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "delete",
          module: "rh",
          entityId: input.id,
          details: "Trilha de onboarding excluída",
        });
      }
      return { success: true };
    }),

  // ==================== Quizzes ====================
  listQuizzes: protectedProcedure
    .input(z.object({ courseId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const { quizzes } = await import("../../drizzle/schema");
      if (input?.courseId) {
        return db.select().from(quizzes).where(eq(quizzes.courseId, input.courseId));
      }
      return db.select().from(quizzes);
    }),
  createQuiz: protectedProcedure
    .input(z.object({
      courseId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      passingScore: z.number().default(70),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { quizzes } = await import("../../drizzle/schema");
      const result = await db.insert(quizzes).values(input);
      return { success: true, id: result[0].insertId };
    }),
  createQuizQuestion: protectedProcedure
    .input(z.object({
      quizId: z.number(),
      question: z.string().min(1),
      optionA: z.string().min(1),
      optionB: z.string().min(1),
      optionC: z.string().optional(),
      optionD: z.string().optional(),
      correctAnswer: z.enum(["A", "B", "C", "D"]),
      order: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { quiz_questions } = await import("../../drizzle/schema");
      const result = await db.insert(quiz_questions).values(input);
      return { success: true, id: result[0].insertId };
    }),
  submitQuizAnswer: protectedProcedure
    .input(z.object({
      quizId: z.number(),
      questionId: z.number(),
      selectedAnswer: z.enum(["A", "B", "C", "D"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { quiz_questions, quiz_answers } = await import("../../drizzle/schema");
      const [question] = await db.select().from(quiz_questions).where(eq(quiz_questions.id, input.questionId));
      const isCorrect = question?.correctAnswer === input.selectedAnswer;
      await db.insert(quiz_answers).values({
        quizId: input.quizId,
        questionId: input.questionId,
        userId: ctx.user?.id || 0,
        selectedAnswer: input.selectedAnswer,
        isCorrect,
      });
      return { success: true, isCorrect, correctAnswer: question?.correctAnswer };
    }),

  // ==================== Audit Logs ====================
  listAuditLogs: protectedProcedure
    .input(z.object({ module: z.string().optional(), limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const { audit_logs } = await import("../../drizzle/schema");
      const limit = input?.limit || 50;
      if (input?.module) {
        return db.select().from(audit_logs).where(eq(audit_logs.module, input.module)).limit(limit).orderBy(desc(audit_logs.createdAt));
      }
      return db.select().from(audit_logs).limit(limit).orderBy(desc(audit_logs.createdAt));
    }),

  // ==================== Salary Records (Folha de Pagamento) ====================
  listSalaryRecords: protectedProcedure
    .input(z.object({ month: z.number().optional(), year: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const { salary_records } = await import("../../drizzle/schema");
      let query = db.select().from(salary_records);
      if (input?.month) query = query.where(eq(salary_records.month, input.month));
      if (input?.year) query = query.where(eq(salary_records.year, input.year));
      return query.orderBy(desc(salary_records.createdAt));
    }),
  createSalaryRecord: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      employeeName: z.string().min(1),
      baseSalary: z.number(),
      bonuses: z.number().default(0),
      deductions: z.number().default(0),
      commission: z.number().default(0),
      month: z.number().min(1).max(12),
      year: z.number().min(2020),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { salary_records, audit_logs } = await import("../../drizzle/schema");
      const netSalary = input.baseSalary + input.bonuses + input.commission - input.deductions;
      const result = await db.insert(salary_records).values({ ...input, netSalary });
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "create",
          module: "rh",
          entityId: result[0].insertId,
          entityName: input.employeeName,
          details: `Folha criada: ${input.month}/${input.year} - R$ ${netSalary.toFixed(2)}`,
        });
      }
      return { success: true, id: result[0].insertId, netSalary };
    }),
  approveSalaryRecord: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { salary_records, audit_logs } = await import("../../drizzle/schema");
      await db.update(salary_records).set({ status: "aprovado", approvedBy: ctx.user?.id }).where(eq(salary_records.id, input.id));
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "update",
          module: "rh",
          entityId: input.id,
          details: "Folha de pagamento aprovada",
        });
      }
      return { success: true };
    }),
  paySalaryRecord: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { salary_records, audit_logs } = await import("../../drizzle/schema");
      await db.update(salary_records).set({ status: "pago", paidAt: new Date() }).where(eq(salary_records.id, input.id));
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "update",
          module: "rh",
          entityId: input.id,
          details: "Folha de pagamento marcada como paga",
        });
      }
      return { success: true };
    }),
  deleteSalaryRecord: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { salary_records, audit_logs } = await import("../../drizzle/schema");
      await db.delete(salary_records).where(eq(salary_records.id, input.id));
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "delete",
          module: "rh",
          entityId: input.id,
          details: "Folha de pagamento excluída",
        });
      }
      return { success: true };
    }),
  salarySummary: protectedProcedure
    .input(z.object({ month: z.number().optional(), year: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const { salary_records } = await import("../../drizzle/schema");
      let records = await db.select().from(salary_records);
      if (input?.month) records = records.filter(r => r.month === input.month);
      if (input?.year) records = records.filter(r => r.year === input.year);
      const total = records.reduce((acc, r) => acc + parseFloat(r.netSalary || "0"), 0);
      const totalBase = records.reduce((acc, r) => acc + parseFloat(r.baseSalary || "0"), 0);
      const totalCommission = records.reduce((acc, r) => acc + parseFloat(r.commission || "0"), 0);
      const totalBonuses = records.reduce((acc, r) => acc + parseFloat(r.bonuses || "0"), 0);
      const totalDeductions = records.reduce((acc, r) => acc + parseFloat(r.deductions || "0"), 0);
      const paidCount = records.filter(r => r.status === "pago").length;
      const pendingCount = records.filter(r => r.status === "rascunho").length;
      const approvedCount = records.filter(r => r.status === "aprovado").length;
      return { total, totalBase, totalCommission, totalBonuses, totalDeductions, count: records.length, paidCount, pendingCount, approvedCount };
    }),

  // ==================== Cost Help Requests (Ajuda de Custo) ====================
  listCostHelpRequests: protectedProcedure
    .input(z.object({ status: z.string().optional(), employeeId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const { cost_help_requests } = await import("../../drizzle/schema");
      let query = db.select().from(cost_help_requests);
      if (input?.status) query = query.where(eq(cost_help_requests.status, input.status as any));
      if (input?.employeeId) query = query.where(eq(cost_help_requests.employeeId, input.employeeId));
      return query.orderBy(desc(cost_help_requests.createdAt));
    }),
  createCostHelpRequest: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      employeeName: z.string().min(1),
      category: z.enum(["combustivel", "manutencao", "material", "viagem", "alimentacao", "outros"]),
      description: z.string().optional(),
      amount: z.number(),
      receiptUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { cost_help_requests, audit_logs } = await import("../../drizzle/schema");
      const now = new Date();
      const result = await db.insert(cost_help_requests).values({
        ...input,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "create",
          module: "rh",
          entityId: result[0].insertId,
          entityName: input.employeeName,
          details: `Ajuda de custo solicitada: ${input.category} - R$ ${input.amount.toFixed(2)}`,
        });
      }
      return { success: true, id: result[0].insertId };
    }),
  approveCostHelpRequest: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { cost_help_requests, audit_logs } = await import("../../drizzle/schema");
      await db.update(cost_help_requests).set({ status: "aprovado", approvedBy: ctx.user?.id, approvedAt: new Date() }).where(eq(cost_help_requests.id, input.id));
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "update",
          module: "rh",
          entityId: input.id,
          details: "Ajuda de custo aprovada",
        });
      }
      return { success: true };
    }),
  rejectCostHelpRequest: protectedProcedure
    .input(z.object({ id: z.number(), rejectionReason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { cost_help_requests, audit_logs } = await import("../../drizzle/schema");
      await db.update(cost_help_requests).set({ status: "reprovado", rejectionReason: input.rejectionReason }).where(eq(cost_help_requests.id, input.id));
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "update",
          module: "rh",
          entityId: input.id,
          details: `Ajuda de custo reprovada: ${input.rejectionReason || "Sem motivo"}`,
        });
      }
      return { success: true };
    }),
  payCostHelpRequest: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { cost_help_requests, audit_logs } = await import("../../drizzle/schema");
      await db.update(cost_help_requests).set({ status: "pago", paidAt: new Date() }).where(eq(cost_help_requests.id, input.id));
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "update",
          module: "rh",
          entityId: input.id,
          details: "Ajuda de custo paga",
        });
      }
      return { success: true };
    }),
  deleteCostHelpRequest: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { cost_help_requests, audit_logs } = await import("../../drizzle/schema");
      await db.delete(cost_help_requests).where(eq(cost_help_requests.id, input.id));
      if (ctx.user) {
        await db.insert(audit_logs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.email,
          action: "delete",
          module: "rh",
          entityId: input.id,
          details: "Ajuda de custo excluída",
        });
      }
      return { success: true };
    }),
  costHelpSummary: protectedProcedure
    .query(async () => {
      const db = await getDb();
      const { cost_help_requests } = await import("../../drizzle/schema");
      const records = await db.select().from(cost_help_requests);
      const total = records.reduce((acc, r) => acc + parseFloat(r.amount || "0"), 0);
      const pendingCount = records.filter(r => r.status === "pendente").length;
      const approvedCount = records.filter(r => r.status === "aprovado").length;
      const paidCount = records.filter(r => r.status === "pago").length;
      const rejectedCount = records.filter(r => r.status === "reprovado").length;
      const totalPending = records.filter(r => r.status === "pendente").reduce((acc, r) => acc + parseFloat(r.amount || "0"), 0);
      const totalPaid = records.filter(r => r.status === "pago").reduce((acc, r) => acc + parseFloat(r.amount || "0"), 0);
      return { total, totalPending, totalPaid, count: records.length, pendingCount, approvedCount, paidCount, rejectedCount };
    }),
});
