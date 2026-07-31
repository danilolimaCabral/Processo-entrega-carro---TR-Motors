import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getSaleRecordById,
  getAdministrativeChecklistDocuments,
  upsertAdministrativeChecklistDocument,
} from "../db";

const departmentSchema = z.enum(["financeiro", "administrativo"]);

/**
 * Backs the "Iniciar Checklist Financeiro" / "Iniciar Checklist
 * Administrativo" multi-step wizards on the vendedor dashboard
 * (ChecklistForm.tsx). Steps are identified by number, and each step has a
 * fixed set of document slots (documentKey) — see
 * client/src/lib/administrativeChecklistSteps.ts. Adding a new step later
 * only needs new frontend config; this router stays the same.
 *
 * Storage note: fileUrl currently holds a local `data:` URI because no
 * external storage (Forge/S3) is configured in this environment. Swapping
 * to real storage later only changes what uploadDocument writes into
 * fileKey/fileUrl below.
 */
export const administrativeChecklistRouter = router({
  getDocuments: protectedProcedure
    .input(
      z.object({
        saleRecordId: z.number(),
        department: departmentSchema,
        step: z.number().int().min(1),
      })
    )
    .query(async ({ input }) => {
      return await getAdministrativeChecklistDocuments(
        input.saleRecordId,
        input.department,
        input.step
      );
    }),

  uploadDocument: protectedProcedure
    .input(
      z.object({
        saleRecordId: z.number(),
        department: departmentSchema,
        step: z.number().int().min(1),
        documentKey: z.string().min(1),
        filename: z.string().min(1),
        mimeType: z.string().min(1),
        fileDataBase64: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "vendedor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas vendedores podem enviar documentos do checklist",
        });
      }

      const sale = await getSaleRecordById(input.saleRecordId);
      if (!sale) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Venda não encontrada",
        });
      }

      if (sale.vendedorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a esta venda",
        });
      }

      const fileUrl = `data:${input.mimeType};base64,${input.fileDataBase64}`;
      const fileSize = Math.round((input.fileDataBase64.length * 3) / 4);

      await upsertAdministrativeChecklistDocument({
        saleRecordId: input.saleRecordId,
        department: input.department,
        step: input.step,
        documentKey: input.documentKey,
        filename: input.filename,
        fileKey: `local/${input.saleRecordId}/${input.department}/${input.step}/${input.documentKey}`,
        fileUrl,
        mimeType: input.mimeType,
        fileSize,
        uploadedBy: ctx.user.id,
      });

      return { success: true };
    }),
});
