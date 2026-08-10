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
        // Extrair base64 da data URL (remover prefixo data:image/...;base64,)
        const base64Match = input.imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
          return { success: false, message: "Formato de imagem inválido", amount: 0, supplier: "", cnpj: "", date: new Date().toISOString().split("T")[0], category: "Outros", description: "", notes: "" };
        }
        const base64Data = base64Match[2];

        // Usar OCR.space (API gratuita, sem necessidade de registro/API key própria)
        // A key "helloworld" é a key pública de demonstração gratuita (500 req/dia por IP)
        const ocrApiKey = process.env.OCR_SPACE_API_KEY || "helloworld";
        const ocrRes = await fetch("https://api.ocr.space/parse/image", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            apikey: ocrApiKey,
            base64Image: base64Data,
            language: "por",
            isTable: "true",
            scale: "true",
            OCREngine: "2",
          }),
        });

        if (!ocrRes.ok) {
          console.error("OCR.space error:", ocrRes.status);
          return { success: false, message: "Erro na extração. Preencha manualmente.", amount: 0, supplier: "", cnpj: "", date: new Date().toISOString().split("T")[0], category: "Outros", description: "", notes: "" };
        }

        const ocrData = await ocrRes.json();
        const rawText = ocrData?.ParsedResults?.[0]?.ParsedText || "";
        if (!rawText.trim()) {
          return { success: false, message: "Não foi possível extrair texto da imagem. Preencha manualmente.", amount: 0, supplier: "", cnpj: "", date: new Date().toISOString().split("T")[0], category: "Outros", description: "", notes: "" };
        }

        // Parsear o texto extraído com regex para encontrar dados da NF
        const parsed = parseReceiptText(rawText);
        return { ...parsed, success: true, rawText: rawText.substring(0, 500) };
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

// Função para parsear texto extraído de NF/cupom fiscal e extrair dados estruturados
function parseReceiptText(text: string): {
  amount: number;
  supplier: string;
  cnpj: string;
  date: string;
  category: string;
  description: string;
  notes: string;
} {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const fullText = text;

  // Extrair CNPJ (formato XX.XXX.XXX/XXXX-XX)
  const cnpjMatch = fullText.match(/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/);
  const cnpj = cnpjMatch ? cnpjMatch[1] : "";

  // Extrair valor total - procurar por "TOTAL", "VALOR TOTAL", ou o último valor com R$
  let amount = 0;
  let amountStr = "";
  const totalMatch = fullText.match(/(?:TOTAL|VALOR\s+TOTAL|TROCO|TOTAL\s+DA\s+NOTA)[\s:]*R?\$?\s*([\d.,]+)/i);
  if (totalMatch) {
    amountStr = totalMatch[1];
  } else {
    // Pegar o último valor com R$ ou número no formato brasileiro
    const allValues = Array.from(fullText.matchAll(/R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/g));
    if (allValues.length > 0) {
      amountStr = allValues[allValues.length - 1][1];
    }
  }
  if (amountStr) {
    amount = parseFloat(amountStr.replace(/\./g, "").replace(",", ".")) || 0;
  }

  // Extrair data (formato DD/MM/YYYY ou DD/MM/YY)
  const dateMatch = fullText.match(/(\d{2})\/(\d{2})\/(\d{4}|\d{2})/);
  let date = new Date().toISOString().split("T")[0];
  if (dateMatch) {
    const day = dateMatch[1];
    const month = dateMatch[2];
    let year = dateMatch[3];
    if (year.length === 2) year = "20" + year;
    date = `${year}-${month}-${day}`;
  }

  // Extrair fornecedor (geralmente nas primeiras linhas, antes do CNPJ)
  let supplier = "";
  for (const line of lines.slice(0, 10)) {
    if (/CNPJ|CPF|IE|IM|DATA|HORA|ENDEREÇO|RUA|AV\.|CEP/i.test(line)) continue;
    if (/^\d{2}\/\d{2}/.test(line)) continue;
    if (line.length > 3 && line.length < 60 && /[A-Z]/.test(line) && !/^\d/.test(line)) {
      supplier = line;
      break;
    }
  }

  // Detectar categoria baseada em palavras-chave
  const textLower = fullText.toLowerCase();
  let category = "Outros";
  const categories: Record<string, string[]> = {
    "Combustível": ["combustivel", "combustível", "gasolina", "etanol", "diesel", "posto", "shell", "petrobras", "ipiranga", "raizen"],
    "Alimentação": ["alimentacao", "alimentação", "restaurante", "lanche", "padaria", "mercado", "supermercado", "pao de acucar", "carrefour", "extra", "assai", "mateus", "atacadarejo"],
    "Pedágio": ["pedagio", "pedágio", "concessionaria", "concessionária", "autoban", "ecovias", "cart"],
    "Material": ["material", "ferragem", "construcao", "construção", "loja", "casa"],
    "Veículo": ["veiculo", "veículo", "oficina", "mecanica", "mecânica", "peca", "peça", "auto", "pneu", "pneus", "borracharia"],
    "Manutenção": ["manutencao", "manutenção", "servico", "serviço", "reparo", "conserto"],
    "Escritório": ["escritorio", "escritório", "papelaria", "material expediente", "cartucho", "toner", "impressora"],
  };
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      category = cat;
      break;
    }
  }

  // Descrição: primeiras linhas relevantes
  const descLines = lines.slice(0, 5).filter(l => !/CNPJ|CPF|IE|DATA|HORA/i.test(l)).join(" ");
  const description = descLines.substring(0, 200);

  return {
    amount,
    supplier: supplier || (cnpj ? "Fornecedor sem nome" : ""),
    cnpj,
    date,
    category,
    description,
    notes: "",
  };
}
