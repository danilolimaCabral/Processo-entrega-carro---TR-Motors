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
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return {
            success: false,
            message: "Extração automática indisponível. Configure GEMINI_API_KEY ou preencha manualmente.",
            amount: 0,
            supplier: "",
            cnpj: "",
            date: new Date().toISOString().split("T")[0],
            category: "Outros",
            description: "",
            notes: "",
          };
        }

        // Extrair base64 da data URL (remover prefixo data:image/...;base64,)
        const base64Match = input.imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
          return { success: false, message: "Formato de imagem inválido", amount: 0, supplier: "", cnpj: "", date: new Date().toISOString().split("T")[0], category: "Outros", description: "", notes: "" };
        }
        const mimeType = base64Match[1];
        const base64Data = base64Match[2];

        // Chamar Google Gemini API (gemini-2.0-flash - tier gratuito)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const prompt = "Extraia todos os dados desta nota fiscal/cupom/imagem de despesa brasileira. Retorne APENAS um JSON válido (sem markdown, sem code blocks) com: amount (número, valor total em reais), supplier (string, nome do fornecedor), cnpj (string, CNPJ), date (string, formato YYYY-MM-DD), category (string, uma de: combustível, alimentação, pedágio, material, veículo, manutenção, escritório, outros), description (string, resumo dos itens), notes (string, observações).";

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: `image/${mimeType}`, data: base64Data } },
              ],
            }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          console.error("Gemini API error:", errText);
          return { success: false, message: "Erro na extração. Preencha manualmente.", amount: 0, supplier: "", cnpj: "", date: new Date().toISOString().split("T")[0], category: "Outros", description: "", notes: "" };
        }

        const geminiData = await geminiRes.json();
        const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          return { success: false, message: "Não foi possível extrair dados. Preencha manualmente.", amount: 0, supplier: "", cnpj: "", date: new Date().toISOString().split("T")[0], category: "Outros", description: "", notes: "" };
        }

        // Parsear resposta JSON do Gemini
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          // Tentar extrair JSON de dentro de markdown code blocks
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Resposta não é JSON válido");
          }
        }

        return { ...parsed, success: true };
      } catch (err: any) {
        console.error("Extract error:", err.message);
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
