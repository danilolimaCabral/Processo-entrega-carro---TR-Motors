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

/**
 * A group of extra document slots shown *within* a step (not a separate
 * step in the stepper) once a condition on that step is met — e.g. Etapa 1's
 * "Veículo na troca" = Sim. Groups in the same step's `conditionalGroups`
 * array are revealed one at a time: the first shows as soon as the
 * condition is met, the next only once the previous group is fully
 * complete, and so on.
 */
export interface AdministrativeChecklistConditionalGroup {
  id: string;
  title: string;
  documents: AdministrativeChecklistDocumentConfig[];
}

export interface AdministrativeChecklistStepConfig {
  step: number;
  title: string;
  kind: AdministrativeChecklistStepKind;
  /** Empty for "confirmation" steps */
  documents: AdministrativeChecklistDocumentConfig[];
  /** Optional — only Etapa 1 uses this today (see "Veículo na troca") */
  conditionalGroups?: AdministrativeChecklistConditionalGroup[];
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
      conditionalGroups: [
        {
          id: "vehicle_trade_in_docs",
          title: "Com Veículo na Troca",
          documents: [
            { key: "procuracoes_2vias", label: "Procurações - 2 vias" },
            { key: "termo_multa", label: "Termo de Multa" },
          ],
        },
        {
          id: "vehicle_client_docs",
          title: "Documentos Veículo/Cliente",
          documents: [
            { key: "crlv_dut", label: "CRLV ou DUT" },
            { key: "extrato_debitos", label: "Extrato de Débitos" },
            {
              key: "comprovante_residencia_troca",
              label: "Comprovante de Residência",
            },
            {
              key: "cnh_rg_autenticados_troca",
              label: "CNH ou RG Autenticados",
            },
          ],
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
