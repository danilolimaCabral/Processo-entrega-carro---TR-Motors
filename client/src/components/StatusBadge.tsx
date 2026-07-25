import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SaleStatus =
  | "aguardando_financeiro"
  | "aguardando_administrativo"
  | "liberado_para_entrega"
  | "reprovado";

export const STATUS_LABELS: Record<SaleStatus, string> = {
  aguardando_financeiro: "Aguardando Financeiro",
  aguardando_administrativo: "Aguardando Administrativo",
  liberado_para_entrega: "Liberado para entrega",
  reprovado: "Reprovado",
};

export const STATUS_STYLES: Record<SaleStatus, string> = {
  aguardando_financeiro:
    "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  aguardando_administrativo:
    "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  liberado_para_entrega:
    "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  reprovado:
    "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
};

export function StatusBadge({ status }: { status: string }) {
  const s = status as SaleStatus;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium px-2.5 py-0.5 rounded-full border",
        STATUS_STYLES[s] ?? "bg-gray-100 text-gray-700 border-gray-200"
      )}
    >
      {STATUS_LABELS[s] ?? status}
    </Badge>
  );
}
