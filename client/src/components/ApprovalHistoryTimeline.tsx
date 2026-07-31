import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, CheckCircle2, XCircle, FileCheck, Wallet } from "lucide-react";

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

const ACTION_ICONS: Record<string, React.ReactNode> = {
  created: <Plus className="h-3 w-3 text-white" />,
  financial_approved: <Wallet className="h-3 w-3 text-white" />,
  financial_rejected: <XCircle className="h-3 w-3 text-white" />,
  admin_approved: <FileCheck className="h-3 w-3 text-white" />,
  admin_rejected: <XCircle className="h-3 w-3 text-white" />,
};

const ACTION_DOT_COLORS: Record<string, string> = {
  created: "bg-blue-500",
  financial_approved: "bg-green-500",
  financial_rejected: "bg-red-500",
  admin_approved: "bg-emerald-500",
  admin_rejected: "bg-red-500",
};

const ACTION_BADGE_COLORS: Record<string, string> = {
  created: "bg-blue-100 text-blue-800 border-blue-300",
  financial_approved: "bg-green-100 text-green-800 border-green-300",
  financial_rejected: "bg-red-100 text-red-800 border-red-300",
  admin_approved: "bg-emerald-100 text-emerald-800 border-emerald-300",
  admin_rejected: "bg-red-100 text-red-800 border-red-300",
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
        <div className="space-y-0">
          {history.map((entry: any, index: number) => {
            const isLast = index === history.length - 1;
            return (
              <div key={entry.id} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center pt-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ACTION_DOT_COLORS[entry.actionType]} ring-4 ring-white shadow-sm`}>
                    {ACTION_ICONS[entry.actionType]}
                  </div>
                  {!isLast && (
                    <div className="w-0.5 h-12 bg-slate-200 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Badge className={ACTION_BADGE_COLORS[entry.actionType]}>
                        {ACTION_LABELS[entry.actionType]}
                      </Badge>
                      <p className="text-sm text-slate-600 mt-1.5">
                        Por: <span className="font-semibold">{ROLE_LABELS[entry.userRole]}</span>
                      </p>
                      {entry.reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">
                            <span className="font-medium">Motivo:</span> {entry.reason}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500 font-medium">
                        {new Date(entry.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(entry.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
