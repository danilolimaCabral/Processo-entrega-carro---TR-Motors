import { trpc } from "@/lib/trpc";
import { Car, CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProcessoPublicoPageProps {
  token: string;
}

const STATUS_CONFIG = {
  aguardando_financeiro: {
    label: "Aguardando Análise Financeira",
    description: "Seu processo está sendo analisado pelo setor financeiro.",
    icon: Clock,
    color: "text-yellow-600",
    badgeVariant: "secondary" as const,
    step: 1,
  },
  aguardando_administrativo: {
    label: "Aguardando Liberação Administrativa",
    description: "A análise financeira foi aprovada. Aguardando liberação pelo setor administrativo.",
    icon: Clock,
    color: "text-blue-600",
    badgeVariant: "default" as const,
    step: 2,
  },
  liberado_para_entrega: {
    label: "Liberado para Entrega!",
    description: "Parabéns! Seu veículo foi aprovado em todas as etapas e está liberado para entrega.",
    icon: CheckCircle2,
    color: "text-green-600",
    badgeVariant: "default" as const,
    step: 3,
  },
  reprovado: {
    label: "Documentação Reprovada",
    description: "Houve uma pendência na análise do seu processo. Entre em contato com o vendedor.",
    icon: XCircle,
    color: "text-red-600",
    badgeVariant: "destructive" as const,
    step: 0,
  },
};

const STEPS = [
  { label: "Documentação Enviada", step: 0 },
  { label: "Análise Financeira", step: 1 },
  { label: "Liberação Administrativa", step: 2 },
  { label: "Pronto para Entrega", step: 3 },
];

export default function ProcessoPublicoPage({ token }: ProcessoPublicoPageProps) {
  const { data: processo, isLoading, error } = trpc.sales.getByPublicToken.useQuery(
    { token },
    { retry: false }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Buscando informações do processo...</p>
        </div>
      </div>
    );
  }

  if (error || !processo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Processo não encontrado</h2>
            <p className="text-sm text-muted-foreground mt-2">
              O link que você acessou é inválido ou expirou.
              Entre em contato com o vendedor para obter um novo link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[processo.status];
  const StatusIcon = statusConfig.icon;
  const currentStep = statusConfig.step;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none">TR Motors</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Acompanhamento de Processo</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Status Principal */}
        <Card className="overflow-hidden">
          <div className={`h-1.5 w-full ${
            processo.status === "liberado_para_entrega" ? "bg-green-500" :
            processo.status === "reprovado" ? "bg-red-500" :
            processo.status === "aguardando_administrativo" ? "bg-blue-500" :
            "bg-yellow-500"
          }`} />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${statusConfig.color}`}>
                  <StatusIcon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base leading-tight">{statusConfig.label}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{statusConfig.description}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          {processo.status === "reprovado" && processo.rejectionReason && (
            <CardContent className="pt-0">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm font-medium text-destructive">Motivo da reprovação:</p>
                <p className="text-sm text-destructive/80 mt-1">{processo.rejectionReason}</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Progresso por etapas */}
        {processo.status !== "reprovado" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Etapas do Processo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {STEPS.map((step, index) => {
                  const isCompleted = currentStep > step.step;
                  const isCurrent = currentStep === step.step;
                  const isPending = currentStep < step.step;

                  return (
                    <div key={step.step} className="flex items-center gap-3">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isCompleted ? "bg-green-500 text-white" :
                        isCurrent ? "bg-primary text-primary-foreground" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className={`text-sm ${
                        isCompleted ? "text-foreground line-through decoration-muted-foreground/50" :
                        isCurrent ? "text-foreground font-medium" :
                        "text-muted-foreground"
                      }`}>
                        {step.label}
                      </span>
                      {isCurrent && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Em andamento
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalhes do Veículo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Detalhes do Veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Placa</span>
                <span className="text-sm font-semibold font-mono tracking-wider">
                  {processo.licensePlate}
                </span>
              </div>
              {processo.customerName && (
                <div className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">Cliente</span>
                  <span className="text-sm font-medium">{processo.customerName}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Vendedor</span>
                <span className="text-sm font-medium">{processo.sellerName ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Abertura do processo</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(processo.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Última atualização</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(processo.updatedAt), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center pb-4">
          TR Motors — Sistema de Controle de Entrega de Veículos
        </p>
      </div>
    </div>
  );
}
