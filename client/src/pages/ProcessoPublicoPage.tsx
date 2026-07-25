import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";

interface ProcessoPublicoPageProps {
  token: string;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  pending_financial: {
    label: "Análise Financeira",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <Clock className="h-5 w-5" />,
    description: "Seu processo está sendo analisado pela equipe financeira",
  },
  approved_financial: {
    label: "Financeiro Aprovado",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle2 className="h-5 w-5" />,
    description: "Aprovado na etapa financeira",
  },
  rejected_financial: {
    label: "Rejeitado (Financeiro)",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: <XCircle className="h-5 w-5" />,
    description: "Rejeitado na etapa financeira",
  },
  pending_admin: {
    label: "Liberação Administrativa",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <Clock className="h-5 w-5" />,
    description: "Aguardando liberação administrativa",
  },
  approved_admin: {
    label: "Administrativo Aprovado",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle2 className="h-5 w-5" />,
    description: "Aprovado na etapa administrativa",
  },
  rejected_admin: {
    label: "Rejeitado (Administrativo)",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: <XCircle className="h-5 w-5" />,
    description: "Rejeitado na etapa administrativa",
  },
  ready_for_delivery: {
    label: "Pronto para Entrega",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle2 className="h-5 w-5" />,
    description: "Seu veículo está pronto para entrega!",
  },
};

function StepIndicator({
  step,
  label,
  status,
}: {
  step: number;
  label: string;
  status: "completed" | "current" | "pending";
}) {
  const statusConfig = {
    completed: "bg-green-600 text-white",
    current: "bg-blue-600 text-white",
    pending: "bg-gray-300 text-gray-700",
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${statusConfig[status]}`}
      >
        {status === "completed" ? <CheckCircle2 className="h-6 w-6" /> : step}
      </div>
      <p className="text-xs text-center mt-2 max-w-[80px]">{label}</p>
    </div>
  );
}

export default function ProcessoPublicoPage({ token }: ProcessoPublicoPageProps) {
  const { data: sale, isLoading, error } = trpc.sales.getSaleByToken.useQuery({
    token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-32" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Processo não encontrado</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  O link de acompanhamento é inválido ou expirou. Verifique o
                  link e tente novamente.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[sale.status];
  const isRejected = sale.status.includes("rejected");
  const isCompleted = sale.status === "ready_for_delivery";

  // Determine step status
  const getStepStatus = (stepName: string) => {
    const steps = [
      "pending_financial",
      "approved_financial",
      "pending_admin",
      "approved_admin",
      "ready_for_delivery",
    ];
    const currentIndex = steps.indexOf(sale.status);
    const stepIndex = steps.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Acompanhamento de Processo
          </h1>
          <p className="text-slate-600 mt-2">TR Motors - Controle de Entrega</p>
        </div>

        {/* Status Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{sale.customerName}</CardTitle>
                <CardDescription className="mt-2">
                  {sale.vehicleModel}
                  {sale.vehicleYear && ` (${sale.vehicleYear})`}
                  {sale.vehicleColor && ` - ${sale.vehicleColor}`}
                </CardDescription>
              </div>
              <Badge className={`${config.color} border`}>
                <span className="mr-2">{config.icon}</span>
                {config.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={isRejected ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className={isRejected ? "text-red-900" : "text-blue-900"}>
                {config.description}
              </AlertDescription>
            </Alert>

            {isRejected && sale.rejectionReason && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Motivo da rejeição:</strong> {sale.rejectionReason}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Step 1: Análise Financeira */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                      getStepStatus("pending_financial") === "completed"
                        ? "bg-green-600 text-white"
                        : getStepStatus("pending_financial") === "current"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {getStepStatus("pending_financial") === "completed" ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      "1"
                    )}
                  </div>
                  {getStepStatus("pending_admin") !== "pending" && (
                    <div className="w-1 h-12 bg-gray-300 mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="font-semibold text-slate-900">
                    Análise Financeira
                  </h3>
                  <p className="text-sm text-slate-600">
                    Seu processo está sendo analisado pela equipe financeira.
                  </p>
                </div>
              </div>

              {/* Step 2: Liberação Administrativa */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                      getStepStatus("pending_admin") === "completed"
                        ? "bg-green-600 text-white"
                        : getStepStatus("pending_admin") === "current"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {getStepStatus("pending_admin") === "completed" ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      "2"
                    )}
                  </div>
                  {getStepStatus("ready_for_delivery") !== "pending" && (
                    <div className="w-1 h-12 bg-gray-300 mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="font-semibold text-slate-900">
                    Liberação Administrativa
                  </h3>
                  <p className="text-sm text-slate-600">
                    Aguardando liberação para entrega do veículo.
                  </p>
                </div>
              </div>

              {/* Step 3: Pronto para Entrega */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                      getStepStatus("ready_for_delivery") === "completed"
                        ? "bg-green-600 text-white"
                        : getStepStatus("ready_for_delivery") === "current"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {getStepStatus("ready_for_delivery") === "completed" ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      "3"
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Pronto para Entrega
                  </h3>
                  <p className="text-sm text-slate-600">
                    Seu veículo está pronto para ser entregue.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-slate-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Data de Criação</p>
                <p className="font-semibold">
                  {new Date(sale.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Última Atualização</p>
                <p className="font-semibold">
                  {new Date(sale.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
