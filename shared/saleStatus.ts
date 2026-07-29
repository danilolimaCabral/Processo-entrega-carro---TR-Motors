/**
 * Financeiro and administrativo review a sale independently and in parallel.
 * The overall status is derived from the two, never stored, so there is no
 * third field that can drift out of sync with the two sources of truth.
 */
export type DepartmentStatus = "pending" | "approved" | "rejected";
export type OverallSaleStatus = "pending_review" | "rejected" | "ready_for_delivery";

export function getOverallSaleStatus(
  financialStatus: DepartmentStatus,
  adminStatus: DepartmentStatus
): OverallSaleStatus {
  if (financialStatus === "rejected" || adminStatus === "rejected") {
    return "rejected";
  }
  if (financialStatus === "approved" && adminStatus === "approved") {
    return "ready_for_delivery";
  }
  return "pending_review";
}

export const OVERALL_STATUS_LABELS: Record<OverallSaleStatus, string> = {
  pending_review: "Em Análise",
  rejected: "Rejeitado",
  ready_for_delivery: "Pronto para Entrega",
};

export const OVERALL_STATUS_COLORS: Record<OverallSaleStatus, string> = {
  pending_review: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
  ready_for_delivery: "bg-blue-100 text-blue-800",
};

export const DEPARTMENT_STATUS_LABELS: Record<DepartmentStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Reprovado",
};

export const DEPARTMENT_STATUS_COLORS: Record<DepartmentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};
