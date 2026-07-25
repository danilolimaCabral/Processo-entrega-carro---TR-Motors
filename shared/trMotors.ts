/**
 * Constantes e tipos compartilhados do domínio TR Motors.
 * Importar tanto no servidor quanto no cliente para consistência.
 */

export const DOCUMENT_TYPE_LABELS = {
  documentacao_cartorio: "Documentação de cartório",
  comprovante_pagamento: "Comprovante de pagamento",
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPE_LABELS;

export const ROLE_LABELS = {
  user: "Usuário",
  admin: "Administrador",
  vendedor: "Vendedor",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
} as const;

export type UserRole = keyof typeof ROLE_LABELS;

