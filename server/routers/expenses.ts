import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, desc, and } from "drizzle-orm";
import { expense_receipts } from "../../drizzle/schema";

export const expensesRouter = router({
  // List all expense receipts (for RH/Financeiro)
  list: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (input?.status) {
        return db.select().from(expense_receipts).where(eq(expense_receipts.status, input.status)).orderBy(desc(expense_receipts.createdAt));
      }
      return db.select().from(expense_receipts).orderBy(desc(expense_receipts.createdAt));
    }),

  // My expenses (for the employee)
  listMy: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    return db.select().from(expense_receipts).where(eq(expense_receipts.submittedBy, ctx.user!.id)).orderBy(desc(expense_receipts.createdAt));
  }),

  // Summary stats
  summary: protectedProcedure.query(async () => {
    const db = await getDb();
    const all = await db.select().from(expense_receipts);
    const total = all.reduce((acc, r) => acc + parseFloat(r.amount || "0"), 0);
    const pending = all.filter(r => r.status === "pendente");
    const approved = all.filter(r => r.status === "aprovado");
    const rejected = all.filter(r => r.status === "rejeitado");
    const totalPending = pending.reduce((acc, r) => acc + parseFloat(r.amount || "0"), 0);
    const totalApproved = approved.reduce((acc, r) => acc + parseFloat(r.amount || "0"), 0);
    const totalRejected = rejected.reduce((acc, r) => acc + parseFloat(r.amount || "0"), 0);

    // By category
    const byCategory: Record<string, number> = {};
    all.forEach(r => {
      const cat = r.category || "Geral";
      byCategory[cat] = (byCategory[cat] || 0) + parseFloat(r.amount || "0");
    });

    return {
      total,
      totalPending,
      totalApproved,
      totalRejected,
      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      totalCount: all.length,
      byCategory,
    };
  }),

  // Create expense receipt (employee uploads photo + data)
  create: protectedProcedure
    .input(
      z.object({
        employeeName: z.string().min(1, "Nome obrigatório"),
        category: z.string().default("Geral"),
        description: z.string().optional(),
        amount: z.number().min(0, "Valor obrigatório"),
        receiptDate: z.string().optional(),
        notes: z.string().optional(),
        photoUrl: z.string().optional(),
        photoFilename: z.string().optional(),
        photoMimeType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const result = await db.insert(expense_receipts).values({
        ...input,
        status: "pendente",
        submittedBy: ctx.user!.id,
        description: input.description || null,
        receiptDate: input.receiptDate || null,
        notes: input.notes || null,
        photoUrl: input.photoUrl || null,
        photoFilename: input.photoFilename || null,
        photoMimeType: input.photoMimeType || null,
      });
      const insertedId = (result as any)[0]?.insertId;
      return { success: true, id: insertedId, message: "Despesa enviada!" };
    }),

  // Update status (RH/Financeiro approves/rejects)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pendente", "aprovado", "rejeitado"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await db
        .update(expense_receipts)
        .set({
          status: input.status,
          notes: input.notes || null,
          reviewedBy: ctx.user!.id,
          reviewedAt: new Date(),
        })
        .where(eq(expense_receipts.id, input.id));
      return { success: true };
    }),

  // Delete
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(expense_receipts).where(eq(expense_receipts.id, input.id));
      return { success: true };
    }),

  // OCR: Extract data from receipt/NF photo using AI vision
  extractFromPhoto: protectedProcedure
    .input(z.object({ imageDataUrl: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const { invokeLLM } = await import("../_core/llm");

        const res = await invokeLLM({
          model: "gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: "Você é um especialista em extrair dados de notas fiscais e cupons fiscais brasileiros. Analise a imagem e extraia TODOS os dados relevantes. Responda apenas em JSON.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extraia todos os dados desta nota fiscal/cupom/imagem de despesa: valor total, fornecedor/razão social, CNPJ, data, categoria da despesa (combustível, alimentação, pedágio, material, veículo, manutenção, escritório, outros), itens principais, observações.",
                },
                {
                  type: "image_url",
                  image_url: { url: input.imageDataUrl, detail: "high" },
                },
              ],
            },
          ],
          outputSchema: {
            name: "expenseData",
            schema: {
              type: "object",
              properties: {
                amount: { type: "number", description: "Valor total da despesa em reais" },
                supplier: { type: "string", description: "Nome do fornecedor ou estabelecimento" },
                cnpj: { type: "string", description: "CNPJ do fornecedor" },
                date: { type: "string", description: "Data da nota (YYYY-MM-DD)" },
                category: { type: "string", description: "Categoria: combustível, alimentação, pedágio, material, veículo, manutenção, escritório, outros" },
                description: { type: "string", description: "Resumo dos itens/descrição da despesa" },
                items: { type: "array", items: { type: "string" }, description: "Lista de itens da nota" },
                notes: { type: "string", description: "Observações adicionais" },
              },
              required: ["amount", "category"],
              additionalProperties: false,
            },
          },
        });

        const content = res.choices?.[0]?.message?.content;
        if (!content) throw new Error("Não foi possível extrair dados da imagem");
        const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
        return { ...parsed, success: true };
      } catch (err: any) {
        // Fallback gracioso quando o LLM não está configurado
        return {
          success: false,
          message: "Extração automática indisponível. Preencha os dados manualmente.",
          amount: 0,
          supplier: "",
          cnpj: "",
          date: new Date().toISOString().split("T")[0],
          category: "Outros",
          description: "",
          notes: "",
        };
      }
    }),

  // Update amount/description (edit by RH)
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        amount: z.number().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db.update(expense_receipts).set(data).where(eq(expense_receipts.id, id));
      return { success: true };
    }),
});
