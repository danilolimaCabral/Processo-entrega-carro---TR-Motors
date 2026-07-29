import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getOverallSaleStatus,
  OVERALL_STATUS_LABELS,
  OVERALL_STATUS_COLORS,
  type DepartmentStatus,
} from "@shared/saleStatus";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";

interface ProcessoPublicoPageProps {
  token: string;
}

const DEPARTMENT_CONFIG: Record<
  DepartmentStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Em Análise",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <Clock className="h-5 w-5" />,
  },
  approved: {
    label: "Aprovado",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  rejected: {
    label: "Rejeitado",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: <XCircle className="h-5 w-5" />,
  },
};

function DepartmentStatusCard({
  title,
  description,
  status,
  rejectionReason,
}: {
  title: string;
  description: string;
  status: DepartmentStatus;
  rejectionReason?: string | null;
}) {
  const config = DEPARTMENT_CONFIG[status];

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge className={`${config.color} border shrink-0`}>
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      {status === "rejected" && rejectionReason && (
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Motivo da rejeição:</strong> {rejectionReason}
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
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

  const overallStatus = getOverallSaleStatus(sale.financialStatus, sale.adminStatus);

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

        {/* Overall Status Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{sale.customerName}</CardTitle>
                <CardDescription className="mt-2">
                  {sale.vehicleModel}
                  {sale.vehicleYear && ` (${sale.vehicleYear})`}
                  {sale.vehiclePlate && ` - ${sale.vehiclePlate}`}
                </CardDescription>
              </div>
              <Badge className={`${OVERALL_STATUS_COLORS[overallStatus]} border`}>
                {OVERALL_STATUS_LABELS[overallStatus]}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Financeiro and Administrativo review in parallel — shown side by side,
            since neither depends on the other. */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Análises (em paralelo)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <DepartmentStatusCard
              title="Análise Financeira"
              description="Revisão feita pela equipe financeira"
              status={sale.financialStatus}
              rejectionReason={sale.financialRejectionReason}
            />
            <DepartmentStatusCard
              title="Liberação Administrativa"
              description="Revisão feita pela equipe administrativa"
              status={sale.adminStatus}
              rejectionReason={sale.adminRejectionReason}
            />
          </div>
        </div>

        {overallStatus === "ready_for_delivery" && (
          <Alert className="border-blue-300 bg-blue-50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="text-blue-900">
              Financeiro e administrativo aprovaram — seu veículo está pronto
              para entrega!
            </AlertDescription>
          </Alert>
        )}

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
