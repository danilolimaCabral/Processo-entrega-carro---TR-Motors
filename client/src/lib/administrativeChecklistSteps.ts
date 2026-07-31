/**
 * Step configuration for the "Iniciar Checklist Administrativo" wizard
 * (and, in the future, "Iniciar Checklist Financeiro", using the same
 * component/table with department: "financeiro").
 *
 * To add a new step later: append an entry to ADMINISTRATIVO_CHECKLIST_STEPS
 * with the next step number and its document slots — no changes needed in
 * AdministrativeChecklistWizard.tsx or the backend router.
 */

export interface AdministrativeChecklistDocumentConfig {
  /** Stable identifier stored in the database (documentKey) */
  key: string;
  label: string;
  description?: string;
}

export interface AdministrativeChecklistStepConfig {
  step: number;
  title: string;
  documents: AdministrativeChecklistDocumentConfig[];
}

export const ADMINISTRATIVO_CHECKLIST_STEPS: AdministrativeChecklistStepConfig[] = [
  {
    step: 1,
    title: "Docs de Cartório",
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
];
