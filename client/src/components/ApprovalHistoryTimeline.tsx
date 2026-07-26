import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ApprovalHistoryTimelineProps {
  saleId: number;
}

const ACTION_LABELS: Record<string, string> = {
  created: "Venda Criada",
  financial_approved: "Aprovado pelo Financeiro",
  financial_rejected: "Rejeitado pelo Financeiro",
  admin_approved: "Aprovado pelo Administrativo",
  admin_rejected: "Rejeitado pelo Administrativo",
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-blue-100 text-blue-800",
  financial_approved: "bg-green-100 text-green-800",
  financial_rejected: "bg-red-100 text-red-800",
  admin_approved: "bg-green-100 text-green-800",
  admin_rejected: "bg-red-100 text-red-800",
};

const ROLE_LABELS: Record<string, string> = {
  vendedor: "Vendedor",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

export function ApprovalHistoryTimeline({ saleId }: ApprovalHistoryTimelineProps) {
  const { data: history = [], isLoading } = trpc.sales.getApprovalHistory.useQuery({
    saleId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Aprovações</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Aprovações</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 text-slate-500">
          Nenhuma ação registrada ainda
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Aprovações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry: any, index: number) => (
            <div key={entry.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 border-4 border-white" />
                {index < history.length - 1 && (
                  <div className="w-1 h-12 bg-slate-200 mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge className={ACTION_COLORS[entry.actionType]}>
                      {ACTION_LABELS[entry.actionType]}
                    </Badge>
                    <p className="text-sm text-slate-600 mt-1">
                      Por: <span className="font-semibold">{ROLE_LABELS[entry.userRole]}</span>
                    </p>
                    {entry.reason && (
                      <p className="text-sm text-slate-700 mt-2 italic">
                        Motivo: {entry.reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {new Date(entry.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
