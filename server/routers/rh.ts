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
});
