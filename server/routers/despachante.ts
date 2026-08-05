import { z } from "zod";
import { eq, like, or } from "drizzle-orm";
import { protectedProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { despachante_documents, type InsertDespachanteDocument } from "../../drizzle/schema";

/**
 * Consulta placa via APIBrasil (100 req/dia grátis)
 */
async function queryApiBrasil(plate: string): Promise<Record<string, any> | null> {
  const token = process.env.APIBRASIL_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(
      `https://app.apibrasil.io/api/v1/veiculos/dados?placa=${plate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      brand: data.marca || data.brand || null,
      model: data.modelo || data.model || null,
      year: data.ano || data.year || null,
      fuel: data.combustivel || data.fuel || null,
      color: data.cor || data.color || null,
      uf: data.uf || data.state || null,
      city: data.municipio || data.city || null,
      chassi: data.chassi || data.chassis || null,
    };
  } catch {
    return null;
  }
}

/**
 * Consulta placa via PuxaPlaca (usa token se configurado)
 */
async function queryPuxaPlaca(plate: string): Promise<Record<string, any> | null> {
  const token = process.env.PUXAPLACA_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(
      `https://sis.puxaplaca.app/api/consulta/placa/${plate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      brand: data.marca || data.brand || null,
      model: data.modelo || data.model || null,
      year: data.ano || data.year || null,
      fuel: data.combustivel || data.fuel || null,
      color: data.cor || data.color || null,
      uf: data.uf || null,
      chassi: data.chassi || null,
      renavam: data.renavam || null,
      fipe: data.fipe || null,
    };
  } catch {
    return null;
  }
}

/**
 * Consulta placa via APIPlacas (usa token se configurado)
 */
async function queryApiPlacas(plate: string): Promise<Record<string, any> | null> {
  const token = process.env.APIPLACAS_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(
      `https://apiplacas.com.br/api/consulta/${plate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      brand: data.marca || data.brand || null,
      model: data.modelo || data.model || null,
      year: data.ano || data.year || null,
      fuel: data.combustivel || data.fuel || null,
      color: data.cor || data.color || null,
      uf: data.uf || null,
    };
  } catch {
    return null;
  }
}

/**
 * Consulta placa com fallback entre APIs gratuitas
 * Tenta: APIBrasil -> PuxaPlaca -> APIPlacas
 */
async function queryPlateWithFallback(plate: string): Promise<Record<string, any> | null> {
  const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (cleanPlate.length < 7 || cleanPlate.length > 8) {
    return null;
  }

  // Tenta cada API em ordem de preferência
  const apis = [queryApiBrasil, queryPuxaPlaca, queryApiPlacas];
  for (const apiFn of apis) {
    const result = await apiFn(cleanPlate);
    if (result && (result.brand || result.model)) {
      return result;
    }
  }

  return null;
}

export const despachanteRouter = router({
  /**
   * List all despachante documents with optional search
   */
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional().default(""),
        status: z.string().optional().default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const conditions = [];

      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            like(despachante_documents.clientName, searchTerm),
            like(despachante_documents.clientCpf, searchTerm),
            like(despachante_documents.vehiclePlate, searchTerm),
            like(despachante_documents.vehicleBrand, searchTerm),
            like(despachante_documents.vehicleModel, searchTerm)
          )
        );
      }

      if (input.status && input.status !== "all") {
        conditions.push(eq(despachante_documents.status, input.status as any));
      }

      const query = db.select().from(despachante_documents);
      if (conditions.length > 0) {
        query.where(conditions[0]);
      }
      query.orderBy(despachante_documents.createdAt, "desc");

      const result = await query;
      return {
        data: result,
        total: result.length,
      };
    }),

  /**
   * Get a single despachante document by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const result = await db
        .select()
        .from(despachante_documents)
        .where(eq(despachante_documents.id, input.id));
      return result[0] || null;
    }),

  /**
   * Create a new despachante document
   */
  create: protectedProcedure
    .input(
      z.object({
        clientName: z.string().min(1, "Nome do cliente é obrigatório"),
        clientCpf: z.string().min(1, "CPF é obrigatório"),
        clientPhone: z.string().optional(),
        clientEmail: z.string().optional(),
        vehiclePlate: z.string().optional(),
        vehicleBrand: z.string().optional(),
        vehicleModel: z.string().optional(),
        vehicleYear: z.number().optional(),
        docRg: z.boolean().default(false),
        docCpf: z.boolean().default(false),
        docComprovanteResidencia: z.boolean().default(false),
        docCnh: z.boolean().default(false),
        docCertificadoNascimento: z.boolean().default(false),
        docComprovantePagamento: z.boolean().default(false),
        docPoderJuridica: z.boolean().default(false),
        docDut: z.boolean().default(false),
        docOutro: z.string().optional(),
        serviceTransferencia: z.boolean().default(false),
        serviceEmplacamento: z.boolean().default(false),
        serviceLicenciamento: z.boolean().default(false),
        serviceCrvCrlv: z.boolean().default(false),
        serviceCartorio: z.boolean().default(false),
        serviceReconhecimentoFirma: z.boolean().default(false),
        observations: z.string().optional(),
        cartorioStatus: z.string().default("nao_necessario"),
        cartorioObservation: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const insertData: InsertDespachanteDocument = {
        ...input,
        userId: ctx.user.id,
        status: "pendente",
      } as InsertDespachanteDocument;
      const result = await db.insert(despachante_documents).values(insertData);
      return { success: true, id: result[0].insertId };
    }),

  /**
   * Update a despachante document
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        clientName: z.string().optional(),
        clientCpf: z.string().optional(),
        clientPhone: z.string().optional(),
        clientEmail: z.string().optional(),
        vehiclePlate: z.string().optional(),
        vehicleBrand: z.string().optional(),
        vehicleModel: z.string().optional(),
        vehicleYear: z.number().optional(),
        docRg: z.boolean().optional(),
        docCpf: z.boolean().optional(),
        docComprovanteResidencia: z.boolean().optional(),
        docCnh: z.boolean().optional(),
        docCertificadoNascimento: z.boolean().optional(),
        docComprovantePagamento: z.boolean().optional(),
        docPoderJuridica: z.boolean().optional(),
        docDut: z.boolean().optional(),
        docOutro: z.string().optional(),
        serviceTransferencia: z.boolean().optional(),
        serviceEmplacamento: z.boolean().optional(),
        serviceLicenciamento: z.boolean().optional(),
        serviceCrvCrlv: z.boolean().optional(),
        serviceCartorio: z.boolean().optional(),
        serviceReconhecimentoFirma: z.boolean().optional(),
        status: z.string().optional(),
        observations: z.string().optional(),
        cartorioStatus: z.string().optional(),
        cartorioObservation: z.string().optional(),
        sentViaWhatsapp: z.boolean().optional(),
        sentViaEmail: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const { id, ...updateData } = input;
      const data: any = { ...updateData };

      if (updateData.sentViaWhatsapp) {
        data.whatsappAt = new Date();
      }
      if (updateData.sentViaEmail) {
        data.emailAt = new Date();
      }

      await db
        .update(despachante_documents)
        .set(data)
        .where(eq(despachante_documents.id, id));
      return { success: true };
    }),

  /**
   * Delete a despachante document
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await db
        .delete(despachante_documents)
        .where(eq(despachante_documents.id, input.id));
      return { success: true };
    }),

  /**
   * Send document list via WhatsApp (opens WhatsApp Web with pre-filled message)
   */
  sendWhatsapp: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const doc = await db
        .select()
        .from(despachante_documents)
        .where(eq(despachante_documents.id, input.id));

      if (!doc[0] || !doc[0].clientPhone) {
        return { success: false, message: "Telefone não cadastrado" };
      }

      // Build WhatsApp message
      const message = `Olá ${doc[0].clientName}!%0A%0A*TR Motors - Documentos para Despachante*%0A%0A*Solicitação:* ${doc[0].id}%0A*Placa:* ${doc[0].vehiclePlate || "N/I"}%0A*Veículo:* ${doc[0].vehicleBrand || ""} ${doc[0].vehicleModel || ""} ${doc[0].vehicleYear || ""}%0A%0A*Documentos necessários:*%0A${
        doc[0].docRg ? "- RG%0A" : ""
      }${doc[0].docCpf ? "- CPF%0A" : ""}${
        doc[0].docComprovanteResidencia ? "- Comprovante de Residência%0A" : ""
      }${doc[0].docCnh ? "- CNH%0A" : ""}${
        doc[0].docCertificadoNascimento ? "- Certidão de Nascimento/Casamento%0A" : ""
      }${doc[0].docComprovantePagamento ? "- Comprovante de Pagamento%0A" : ""}${
        doc[0].docPoderJuridica ? "- Procuração/Assinatura%0A" : ""
      }${doc[0].docDut ? "- DUT%0A" : ""}%0A${
        doc[0].observations ? `*Observações:*%0A${doc[0].observations}` : ""
      }%0A%0AFavor enviar os documentos pendentes o mais breve possível.`;

      const phone = doc[0].clientPhone.replace(/\D/g, "");
      const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

      // Mark as sent
      await db
        .update(despachante_documents)
        .set({
          sentViaWhatsapp: true,
          whatsappAt: new Date(),
        })
        .where(eq(despachante_documents.id, input.id));

      return { success: true, url: whatsappUrl };
    }),

  /**
   * Consulta dados do veículo pela placa usando APIs gratuitas
   */
  consultPlate: protectedProcedure
    .input(z.object({ plate: z.string().min(7) }))
    .query(async ({ input }) => {
      const result = await queryPlateWithFallback(input.plate);
      if (!result) {
        return {
          success: false,
          message: "Veículo não encontrado. Verifique a placa ou configure uma API de consulta.",
          data: null,
          configuredApis: {
            apiBrasil: !!process.env.APIBRASIL_TOKEN,
            puxaPlaca: !!process.env.PUXAPLACA_TOKEN,
            apiPlacas: !!process.env.APIPLACAS_TOKEN,
          },
        };
      }
      return {
        success: true,
        message: "Dados encontrados com sucesso!",
        data: result,
        configuredApis: {
          apiBrasil: !!process.env.APIBRASIL_TOKEN,
          puxaPlaca: !!process.env.PUXAPLACA_TOKEN,
          apiPlacas: !!process.env.APIPLACAS_TOKEN,
        },
      };
    }),

  /**
   * Get statistics for dashboard
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const all = await db.select().from(despachante_documents);

    const stats = {
      total: all.length,
      pendente: all.filter((d) => d.status === "pendente").length,
      documentosColetados: all.filter((d) => d.status === "documentos_coletados").length,
      emProcessamento: all.filter((d) => d.status === "em_processamento").length,
      cartorio: all.filter((d) => d.status === "cartorio").length,
      detran: all.filter((d) => d.status === "detran").length,
      concluido: all.filter((d) => d.status === "concluido").length,
      cancelado: all.filter((d) => d.status === "cancelado").length,
      // Cartório stats
      cartorioPendente: all.filter(
        (d) => d.cartorioStatus === "pendente" || d.cartorioStatus === "enviado"
      ).length,
      cartorioRegistrado: all.filter(
        (d) => d.cartorioStatus === "registrado"
      ).length,
    };

    return stats;
  }),
});
