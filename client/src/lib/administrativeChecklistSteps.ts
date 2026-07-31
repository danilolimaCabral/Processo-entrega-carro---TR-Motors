/**
 * Step configuration for the "Iniciar Checklist Administrativo" /
 * "Iniciar Checklist Financeiro" wizards (AdministrativeChecklistWizard.tsx).
 *
 * Each department has its own ordered list of steps. A step is either:
 * - "upload": a set of document upload slots (documentKey), gated — the
 *   user can't advance past it until every slot has a file.
 * - "confirmation": a plain informational screen, no upload slots.
 *
 * To add a new step later: append an entry to that department's array with
 * the next step number — no changes needed in AdministrativeChecklistWizard.tsx
 * or the backend router.
 */

export interface AdministrativeChecklistDocumentConfig {
  /** Stable identifier stored in the database (documentKey) */
  key: string;
  label: string;
  description?: string;
}

export type AdministrativeChecklistStepKind = "upload" | "confirmation";

export interface AdministrativeChecklistStepConfig {
  step: number;
  title: string;
  kind: AdministrativeChecklistStepKind;
  /** Empty for "confirmation" steps */
  documents: AdministrativeChecklistDocumentConfig[];
}

export type ChecklistDepartment = "financeiro" | "administrativo";

export const CHECKLIST_STEPS_BY_DEPARTMENT: Record<
  ChecklistDepartment,
  AdministrativeChecklistStepConfig[]
> = {
  administrativo: [
    {
      step: 1,
      title: "Docs de Cartório",
      kind: "upload",
      documents: [
        { key: "procuracoes", label: "Procurações" },
        { key: "contrato_compra_venda", label: "Contrato de Compra e Venda" },
        { key: "certificado_garantia", label: "Certificado de Garantia" },
        {
          key: "termo_responsabilidade",
          label: "Termo de Responsabilidade",
          description: "Caso transferência for com a loja",
        },
      ],
    },
    {
      step: 2,
      title: "Documentos Cliente",
      kind: "upload",
      documents: [
        { key: "cnh_rg_autenticados", label: "CNH ou RG autenticados" },
        { key: "comprovante_residencia", label: "Comprovante de Residência" },
      ],
    },
    {
      step: 3,
      title: "Confirmação",
      kind: "confirmation",
      documents: [],
    },
  ],
  // Filled in when the Checklist Financeiro flow is built.
  financeiro: [],
};
