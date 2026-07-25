import { Express, Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import { createSaleDocument, getSaleRecordById } from "./db";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos PDF são aceitos."));
    }
  },
});

export function registerUploadRoute(app: Express) {
  /**
   * POST /api/upload-document
   * Recebe um PDF e associa ao registro de venda.
   * Requer autenticação (cookie de sessão ou Bearer token).
   * Apenas o vendedor dono do registro pode fazer upload.
   *
   * Body (multipart/form-data):
   *   - file: arquivo PDF
   *   - saleRecordId: ID do registro de venda
   *   - documentType: "documentacao_cartorio" | "comprovante_pagamento"
   */
  app.post(
    "/api/upload-document",
    upload.single("file"),
    async (req: Request & { file?: Express.Multer.File }, res: Response) => {
      try {
        // ── Autenticação ──────────────────────────────────────────────────────
        let currentUser: Awaited<ReturnType<typeof sdk.authenticateRequest>> | null = null;
        try {
          currentUser = await sdk.authenticateRequest(req as any);
        } catch {
          return res.status(401).json({ error: "Não autenticado. Faça login para continuar." });
        }

        if (!currentUser) {
          return res.status(401).json({ error: "Não autenticado." });
        }

        // Apenas vendedores e admins podem fazer upload
        if (currentUser.role !== "vendedor" && currentUser.role !== "admin") {
          return res.status(403).json({ error: "Apenas vendedores podem anexar documentos." });
        }

        // ── Validação do arquivo ──────────────────────────────────────────────
        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: "Nenhum arquivo enviado." });
        }

        const { saleRecordId, documentType } = req.body as {
          saleRecordId: string;
          documentType: string;
        };

        if (!saleRecordId || !documentType) {
          return res.status(400).json({ error: "saleRecordId e documentType são obrigatórios." });
        }

        const validTypes = ["documentacao_cartorio", "comprovante_pagamento"];
        if (!validTypes.includes(documentType)) {
          return res.status(400).json({ error: "Tipo de documento inválido." });
        }

        const recordId = parseInt(saleRecordId, 10);
        if (isNaN(recordId)) {
          return res.status(400).json({ error: "saleRecordId inválido." });
        }

        // ── Verificação de propriedade do registro ────────────────────────────
        const record = await getSaleRecordById(recordId);
        if (!record) {
          return res.status(404).json({ error: "Registro de venda não encontrado." });
        }

        // Vendedor só pode anexar documentos aos seus próprios registros
        if (currentUser.role === "vendedor" && record.sellerId !== currentUser.id) {
          return res.status(403).json({ error: "Você não tem permissão para anexar documentos a este registro." });
        }

        // ── Upload para S3 ────────────────────────────────────────────────────
        const fileKey = `sale-documents/${recordId}/${documentType}-${Date.now()}`;
        const { key, url } = await storagePut(fileKey, file.buffer, "application/pdf");

        // ── Salvar referência no banco ────────────────────────────────────────
        const docId = await createSaleDocument({
          saleRecordId: recordId,
          documentType: documentType as "documentacao_cartorio" | "comprovante_pagamento",
          fileKey: key,
          fileUrl: url,
          originalName: file.originalname,
          uploadedAt: Date.now(),
        });

        return res.json({ success: true, documentId: docId, fileUrl: url });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro interno no upload.";
        console.error("[Upload] Error:", err);
        return res.status(500).json({ error: message });
      }
    }
  );
}
