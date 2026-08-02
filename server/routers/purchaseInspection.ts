import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  purchase_inspections,
  inspection_photos,
  type PurchaseInspection,
} from "../../drizzle/schema";

/**
 * Consulta API FIPE - retorna marca, modelo, ano e preço
 */
async function queryFipePrice(
  vehicleType: string,
  brandId: number,
  modelId: number,
  yearId: string
): Promise<{
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  price: string;
  codeFipe: string;
  referenceMonth: string;
} | null> {
  try {
    const res = await fetch(
      `https://fipe.parallelum.com.br/api/v2/${vehicleType}/brands/${brandId}/models/${modelId}/years/${yearId}`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Busca marcas na FIPE
 */
async function queryFipeBrands(vehicleType: string = "cars"): Promise<
  Array<{ code: string; name: string }>
> {
  try {
    const res = await fetch(
      `https://fipe.parallelum.com.br/api/v2/${vehicleType}/brands`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Busca modelos de uma marca na FIPE
 */
async function queryFipeModels(
  vehicleType: string,
  brandId: number
): Promise<Array<{ code: string; name: string }>> {
  try {
    const res = await fetch(
      `https://fipe.parallelum.com.br/api/v2/${vehicleType}/brands/${brandId}/models`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Busca anos de um modelo na FIPE
 */
async function queryFipeYears(
  vehicleType: string,
  brandId: number,
  modelId: number
): Promise<Array<{ code: string; name: string }>> {
  try {
    const res = await fetch(
      `https://fipe.parallelum.com.br/api/v2/${vehicleType}/brands/${brandId}/models/${modelId}/years`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Calcula valor de compra baseado nas condições
 * Cada condição afeta o preço FIPE
 */
function calculatePurchasePrice(
  fipePriceStr: string,
  conditions: {
    engine: string;
    transmission: string;
    bodywork: string;
    interior: string;
    tires: string;
    suspension: string;
    electric: string;
  }
): { baseValue: number; deductions: number; finalPrice: number; breakdown: string[] } {
  // Parse FIPE price: "R$ 100.000,00"
  const priceStr = fipePriceStr.replace(/R\$|\.|,/g, "").trim();
  const fipeValue = parseFloat(priceStr) || 0;

  if (fipeValue === 0) {
    return { baseValue: 0, deductions: 0, finalPrice: 0, breakdown: [] };
  }

  const conditionDiscounts: Record<string, number> = {
    otimo: 0,
    bom: 0.02,
    regular: 0.08,
    ruim: 0.2,
    nao_verificado: 0.05,
  };

  let totalDiscount = 0;
  const breakdown: string[] = [];

  const items: Record<string, string> = {
    engine: "Motor",
    transmission: "Câmbio",
    bodywork: "Lataria",
    interior: "Interior",
    tires: "Pneus",
    suspension: "Suspensão",
    electric: "Elétrica",
  };

  for (const [key, label] of Object.entries(items)) {
    const condition = conditions[key as keyof typeof conditions];
    const discount = conditionDiscounts[condition] || 0.05;
    const discountValue = fipeValue * discount;
    totalDiscount += discountValue;
    breakdown.push(
      `${label}: ${condition} → -R$ ${discountValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    );
  }

  // Margem de lucro da loja (10%)
  const margin = fipeValue * 0.1;
  totalDiscount += margin;
  breakdown.push(
    `Margem loja: → -R$ ${margin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  );

  const finalPrice = Math.max(0, fipeValue - totalDiscount);

  return {
    baseValue: fipeValue,
    deductions: totalDiscount,
    finalPrice: Math.round(finalPrice * 100) / 100,
    breakdown,
  };
}

/**
 * Mapeia condição para valor percentual de avaliação
 */
function conditionToPercent(condition: string): number {
  switch (condition) {
    case "otimo": return 100;
    case "bom": return 80;
    case "regular": return 60;
    case "ruim": return 30;
    default: return 50;
  }
}

export const purchaseInspectionRouter = router({
  /**
   * List all purchase inspections
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    return db
      .select()
      .from(purchase_inspections)
      .orderBy(purchase_inspections.createdAt);
  }),

  /**
   * Get a single inspection with photos
   */
  getById: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const inspections = await db
        .select()
        .from(purchase_inspections)
        .where(eq(purchase_inspections.id, input.inspectionId))
        .limit(1);

      if (inspections.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vistoria não encontrada",
        });
      }

      const photos = await db
        .select()
        .from(inspection_photos)
        .where(eq(inspection_photos.inspectionId, input.inspectionId))
        .orderBy(inspection_photos.createdAt);

      return {
        ...inspections[0],
        photos,
      };
    }),

  /**
   * Create a new purchase inspection (rascunho)
   */
  create: protectedProcedure
    .input(
      z.object({
        ownerName: z.string().optional(),
        ownerContact: z.string().optional(),
        vehiclePlate: z.string().optional(),
        vehicleBrand: z.string().optional(),
        vehicleModel: z.string().optional(),
        vehicleYear: z.number().optional(),
        vehicleKm: z.number().optional(),
        vehicleFuel: z.string().optional(),
        vehicleColor: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const result = await db.insert(purchase_inspections).values({
        createdBy: ctx.user!.id,
        ownerName: input.ownerName || null,
        ownerContact: input.ownerContact || null,
        vehiclePlate: input.vehiclePlate || null,
        vehicleBrand: input.vehicleBrand || null,
        vehicleModel: input.vehicleModel || null,
        vehicleYear: input.vehicleYear || null,
        vehicleKm: input.vehicleKm || null,
        vehicleFuel: input.vehicleFuel || null,
        vehicleColor: input.vehicleColor || null,
        status: "rascunho",
      });

      const insertedId = (result as any)[0]?.insertId;
      return {
        success: true,
        inspectionId: insertedId,
        message: "Vistoria criada com sucesso",
      };
    }),

  /**
   * Update inspection data
   */
  update: protectedProcedure
    .input(
      z.object({
        inspectionId: z.number(),
        ownerName: z.string().optional(),
        ownerContact: z.string().optional(),
        vehiclePlate: z.string().optional(),
        vehicleBrand: z.string().optional(),
        vehicleModel: z.string().optional(),
        vehicleYear: z.number().optional(),
        vehicleKm: z.number().optional(),
        vehicleFuel: z.string().optional(),
        vehicleColor: z.string().optional(),
        fipeCode: z.string().optional(),
        fipePrice: z.number().optional(),
        engineCondition: z.enum(["otimo", "bom", "regular", "ruim", "nao_verificado"]).optional(),
        transmissionCondition: z.enum(["otimo", "bom", "regular", "ruim", "nao_verificado"]).optional(),
        bodyworkCondition: z.enum(["otimo", "bom", "regular", "ruim", "nao_verificado"]).optional(),
        interiorCondition: z.enum(["otimo", "bom", "regular", "ruim", "nao_verificado"]).optional(),
        tiresCondition: z.enum(["otimo", "bom", "regular", "ruim", "nao_verificado"]).optional(),
        suspensionCondition: z.enum(["otimo", "bom", "regular", "ruim", "nao_verificado"]).optional(),
        electricCondition: z.enum(["otimo", "bom", "regular", "ruim", "nao_verificado"]).optional(),
        generalNotes: z.string().optional(),
        purchasePrice: z.number().optional(),
        status: z.enum(["rascunho", "em_andamento", "concluida", "cancelada"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (input.ownerName !== undefined) updateData.ownerName = input.ownerName;
      if (input.ownerContact !== undefined) updateData.ownerContact = input.ownerContact;
      if (input.vehiclePlate !== undefined) updateData.vehiclePlate = input.vehiclePlate;
      if (input.vehicleBrand !== undefined) updateData.vehicleBrand = input.vehicleBrand;
      if (input.vehicleModel !== undefined) updateData.vehicleModel = input.vehicleModel;
      if (input.vehicleYear !== undefined) updateData.vehicleYear = input.vehicleYear;
      if (input.vehicleKm !== undefined) updateData.vehicleKm = input.vehicleKm;
      if (input.vehicleFuel !== undefined) updateData.vehicleFuel = input.vehicleFuel;
      if (input.vehicleColor !== undefined) updateData.vehicleColor = input.vehicleColor;
      if (input.fipeCode !== undefined) updateData.fipeCode = input.fipeCode;
      if (input.fipePrice !== undefined) updateData.fipePrice = input.fipePrice;
      if (input.engineCondition !== undefined) updateData.engineCondition = input.engineCondition;
      if (input.transmissionCondition !== undefined) updateData.transmissionCondition = input.transmissionCondition;
      if (input.bodyworkCondition !== undefined) updateData.bodyworkCondition = input.bodyworkCondition;
      if (input.interiorCondition !== undefined) updateData.interiorCondition = input.interiorCondition;
      if (input.tiresCondition !== undefined) updateData.tiresCondition = input.tiresCondition;
      if (input.suspensionCondition !== undefined) updateData.suspensionCondition = input.suspensionCondition;
      if (input.electricCondition !== undefined) updateData.electricCondition = input.electricCondition;
      if (input.generalNotes !== undefined) updateData.generalNotes = input.generalNotes;
      if (input.purchasePrice !== undefined) updateData.purchasePrice = input.purchasePrice;
      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === "concluida") {
          updateData.inspectedAt = new Date();
          updateData.inspectorId = ctx.user?.id;
        }
      }

      await db
        .update(purchase_inspections)
        .set(updateData)
        .where(eq(purchase_inspections.id, input.inspectionId));

      return { success: true, message: "Vistoria atualizada" };
    }),

  /**
   * Upload a photo for an inspection
   */
  uploadPhoto: protectedProcedure
    .input(
      z.object({
        inspectionId: z.number(),
        photoCategory: z.enum([
          "frontal", "traseira", "lateral_esquerda", "lateral_direita",
          "painel", "motor", "portamalas", "interior",
          "pneu_dianteiro_esq", "pneu_dianteiro_dir",
          "pneu_traseiro_esq", "pneu_traseiro_dir",
          "documentos", "chassi", "motor_number", "danos", "outros",
        ]),
        filename: z.string(),
        fileUrl: z.string(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const result = await db.insert(inspection_photos).values({
        inspectionId: input.inspectionId,
        photoCategory: input.photoCategory,
        filename: input.filename,
        fileKey: `inspection/${input.inspectionId}/${Date.now()}`,
        fileUrl: input.fileUrl,
        mimeType: input.mimeType || "image/jpeg",
        fileSize: input.fileSize || null,
        notes: input.notes || null,
        uploadedBy: ctx.user!.id,
      });

      const insertedId = (result as any)[0]?.insertId;
      return {
        success: true,
        photoId: insertedId,
        message: "Foto enviada com sucesso",
      };
    }),

  /**
   * Delete a photo
   */
  deletePhoto: protectedProcedure
    .input(z.object({ photoId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .delete(inspection_photos)
        .where(eq(inspection_photos.id, input.photoId));
      return { success: true, message: "Foto removida" };
    }),

  /**
   * Get FIPE brands
   */
  fipeBrands: protectedProcedure.query(async () => {
    return queryFipeBrands("cars");
  }),

  /**
   * Get FIPE models for a brand
   */
  fipeModels: protectedProcedure
    .input(z.object({ brandId: z.number() }))
    .query(async ({ input }) => {
      return queryFipeModels("cars", input.brandId);
    }),

  /**
   * Get FIPE years for a model
   */
  fipeYears: protectedProcedure
    .input(z.object({ brandId: z.number(), modelId: z.number() }))
    .query(async ({ input }) => {
      return queryFipeYears("cars", input.brandId, input.modelId);
    }),

  /**
   * Get FIPE price and calculate purchase value
   */
  fipePrice: protectedProcedure
    .input(
      z.object({
        brandId: z.number(),
        modelId: z.number(),
        yearId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const fipeData = await queryFipePrice("cars", input.brandId, input.modelId, input.yearId);
      if (!fipeData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Não foi possível consultar o valor FIPE",
        });
      }
      return fipeData;
    }),

  /**
   * Calculate purchase price based on conditions and FIPE value
   */
  calculatePrice: protectedProcedure
    .input(
      z.object({
        inspectionId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      const inspections = await db
        .select()
        .from(purchase_inspections)
        .where(eq(purchase_inspections.id, input.inspectionId))
        .limit(1);

      if (inspections.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vistoria não encontrada",
        });
      }

      const inspection = inspections[0];
      const fipePriceStr = inspection.fipePrice
        ? `R$ ${Number(inspection.fipePrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : "";

      if (!fipePriceStr || fipePriceStr === "R$ 0,00") {
        return {
          baseValue: 0,
          deductions: 0,
          finalPrice: 0,
          breakdown: ["Valor FIPE não informado"],
        };
      }

      return calculatePurchasePrice(fipePriceStr, {
        engine: inspection.engineCondition || "nao_verificado",
        transmission: inspection.transmissionCondition || "nao_verificado",
        bodywork: inspection.bodyworkCondition || "nao_verificado",
        interior: inspection.interiorCondition || "nao_verificado",
        tires: inspection.tiresCondition || "nao_verificado",
        suspension: inspection.suspensionCondition || "nao_verificado",
        electric: inspection.electricCondition || "nao_verificado",
      });
    }),

  /**
   * Delete an inspection
   */
  delete: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db
        .delete(inspection_photos)
        .where(eq(inspection_photos.inspectionId, input.inspectionId));
      await db
        .delete(purchase_inspections)
        .where(eq(purchase_inspections.id, input.inspectionId));
      return { success: true, message: "Vistoria removida" };
    }),
});
