import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Building2,
  Car,
  DollarSign,
  FileText,
  LayoutDashboard,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  Truck,
  Target,
  Package,
  Warehouse,
  Handshake,
  Camera,
  ArrowRight,
  CheckCircle2 as CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

// Enhanced clickable flow step card
function FlowStepCard({
  label,
  count,
  total,
  Icon,
  color,
  onClick,
  route,
}: {
  label: string;
  count: number;
  total: number;
  Icon: React.ElementType;
  color: string;
  onClick: () => void;
  route?: string;
}) {
  const isPending = count > 0;

  const bgColors: Record<string, string> = {
    slate: isPending ? "bg-slate-100 border-slate-400 shadow-md shadow-slate-200" : "bg-slate-50 border-slate-200",
    cyan: isPending ? "bg-cyan-100 border-cyan-400 shadow-md shadow-cyan-200" : "bg-cyan-50 border-cyan-200",
    amber: isPending ? "bg-amber-100 border-amber-400 shadow-md shadow-amber-200" : "bg-amber-50 border-amber-200",
    yellow: isPending ? "bg-yellow-100 border-yellow-400 shadow-md shadow-yellow-200" : "bg-yellow-50 border-yellow-200",
    blue: isPending ? "bg-blue-100 border-blue-400 shadow-md shadow-blue-200" : "bg-blue-50 border-blue-200",
    green: isPending ? "bg-green-100 border-green-400 shadow-md shadow-green-200" : "bg-green-50 border-green-200",
    purple: isPending ? "bg-purple-100 border-purple-400 shadow-md shadow-purple-200" : "bg-purple-50 border-purple-200",
    indigo: isPending ? "bg-indigo-100 border-indigo-400 shadow-md shadow-indigo-200" : "bg-indigo-50 border-indigo-200",
    teal: isPending ? "bg-teal-100 border-teal-400 shadow-md shadow-teal-200" : "bg-teal-50 border-teal-200",
  };
  const iconBgColors: Record<string, string> = {
    slate: isPending ? "bg-slate-200" : "bg-slate-100",
    cyan: isPending ? "bg-cyan-200" : "bg-cyan-100",
    amber: isPending ? "bg-amber-200" : "bg-amber-100",
    yellow: isPending ? "bg-yellow-200" : "bg-yellow-100",
    blue: isPending ? "bg-blue-200" : "bg-blue-100",
    green: isPending ? "bg-green-200" : "bg-green-100",
    purple: isPending ? "bg-purple-200" : "bg-purple-100",
    indigo: isPending ? "bg-indigo-200" : "bg-indigo-100",
    teal: isPending ? "bg-teal-200" : "bg-teal-100",
  };
  const iconColors: Record<string, string> = {
    slate: isPending ? "text-slate-700" : "text-slate-500",
    cyan: isPending ? "text-cyan-700" : "text-cyan-500",
    amber: isPending ? "text-amber-700" : "text-amber-500",
    yellow: isPending ? "text-yellow-700" : "text-yellow-500",
    blue: isPending ? "text-blue-700" : "text-blue-500",
    green: isPending ? "text-green-700" : "text-green-500",
    purple: isPending ? "text-purple-700" : "text-purple-500",
    indigo: isPending ? "text-indigo-700" : "text-indigo-500",
    teal: isPending ? "text-teal-700" : "text-teal-500",
  };
  const badgeColors: Record<string, string> = {
    slate: isPending ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-400",
    cyan: isPending ? "bg-cyan-700 text-white" : "bg-cyan-200 text-cyan-400",
    amber: isPending ? "bg-amber-700 text-white" : "bg-amber-200 text-amber-400",
    yellow: isPending ? "bg-yellow-700 text-white" : "bg-yellow-200 text-yellow-400",
    blue: isPending ? "bg-blue-700 text-white" : "bg-blue-200 text-blue-400",
    green: isPending ? "bg-green-700 text-white" : "bg-green-200 text-green-400",
    purple: isPending ? "bg-purple-700 text-white" : "bg-purple-200 text-purple-400",
    indigo: isPending ? "bg-indigo-700 text-white" : "bg-indigo-200 text-indigo-400",
    teal: isPending ? "bg-teal-700 text-white" : "bg-teal-200 text-teal-400",
  };
  const textColors: Record<string, string> = {
    slate: isPending ? "text-slate-800" : "text-slate-400",
    cyan: isPending ? "text-cyan-800" : "text-cyan-400",
    amber: isPending ? "text-amber-800" : "text-amber-400",
    yellow: isPending ? "text-yellow-800" : "text-yellow-400",
    blue: isPending ? "text-blue-800" : "text-blue-400",
    green: isPending ? "text-green-800" : "text-green-400",
    purple: isPending ? "text-purple-800" : "text-purple-400",
    indigo: isPending ? "text-indigo-800" : "text-indigo-400",
    teal: isPending ? "text-teal-800" : "text-teal-400",
  };

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 min-w-[72px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 ${bgColors[color]}`}
      title={route ? `Ir para ${label}` : label}
    >
      <div className={`p-2 rounded-lg ${iconBgColors[color]}`}>
        <Icon className={`h-5 w-5 ${iconColors[color]}`} />
      </div>
      <span className={`text-[10px] font-semibold leading-tight text-center ${textColors[color]}`}>
        {label}
      </span>
      <span className={`text-lg font-bold leading-none ${badgeColors[color]} px-2 py-0.5 rounded-lg text-sm min-w-[28px]`}>
        {count}
      </span>
      {total > 0 && (
        <span className="text-[9px] text-slate-400">de {total}</span>
      )}
      {isPending && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
      )}
      {isPending && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
      )}
    </button>
  );
}

// Arrow between flow steps
function FlowArrow() {
  return (
    <div className="hidden md:flex items-center">
      <ArrowRight className="h-4 w-4 text-slate-300" />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"vendedores" | "setores" | "modulos">("vendedores");

  const statsQuery = trpc.modules.dashboardStats.useQuery();
  const flowStatusQuery = trpc.modules.flowStatus.useQuery();
  const modulesQuery = trpc.modules.list.useQuery();
  const pipelineStatsQuery = trpc.pipeline.stats.useQuery();
  const inventoryStatsQuery = trpc.inventory.stats.useQuery();
  const deliveryStatsQuery = trpc.delivery.stats.useQuery();

  const modules = modulesQuery.data || [];
  const stats = statsQuery.data;
  const flowStatus = flowStatusQuery.data;

  // Flow steps data — driven by flowStatus
  const flowSteps = flowStatus
    ? [
        {
          key: "vistoria",
          label: "Vistoria",
          count: flowStatus.vistoria.pending,
          total: flowStatus.vistoria.total,
          icon: "Camera",
          color: "slate",
          route: "/vistoria",
        },
        {
          key: "estoque",
          label: "Estoque",
          count: flowStatus.estoque.available,
          total: flowStatus.estoque.total,
          icon: "Warehouse",
          color: "cyan",
          route: "/estoque",
        },
        {
          key: "pipeline",
          label: "Pipeline",
          count: flowStatus.pipeline.novoLead + flowStatus.pipeline.qualificado,
          total: flowStatus.pipeline.total,
          icon: "Target",
          color: "amber",
          route: "/pipeline",
        },
        {
          key: "proposta",
          label: "Proposta",
          count: flowStatus.pipeline.proposta + flowStatus.pipeline.negociando,
          total: flowStatus.pipeline.total,
          icon: "Handshake",
          color: "yellow",
          route: "/pipeline",
        },
        {
          key: "vendas",
          label: "Venda",
          count: flowStatus.vendas.pendingFinancial,
          total: flowStatus.vendas.total,
          icon: "Car",
          color: "blue",
          route: "/approval",
        },
        {
          key: "financeiro",
          label: "Financeiro",
          count: flowStatus.vendas.pendingFinancial,
          total: flowStatus.vendas.total,
          icon: "DollarSign",
          color: "green",
          route: "/approval",
        },
        {
          key: "administrativo",
          label: "Administrativo",
          count: flowStatus.vendas.pendingAdmin,
          total: flowStatus.vendas.total,
          icon: "Building2",
          color: "purple",
          route: "/approval",
        },
        {
          key: "despachante",
          label: "Despachante",
          count: flowStatus.despachante.pending,
          total: flowStatus.despachante.total,
          icon: "FileText",
          color: "indigo",
          route: "/despachante",
        },
        {
          key: "entrega",
          label: "Entrega",
          count: flowStatus.entrega.pending,
          total: flowStatus.entrega.total,
          icon: "Truck",
          color: "teal",
          route: "/entrega",
        },
      ]
    : [];
  const pipelineStats = pipelineStatsQuery.data || { total: 0, byStage: {} };
  const inventoryStats = inventoryStatsQuery.data || { total: 0, available: 0, reserved: 0, sold: 0 };
  const deliveryStats = deliveryStatsQuery.data || { total: 0, scheduled: 0, inProgress: 0, completed: 0 };

  const [, navigate] = useLocation();

  const iconMap: Record<string, React.ReactNode> = {
    Car: <Car className="h-5 w-5" />,
    FileText: <FileText className="h-5 w-5" />,
    DollarSign: <DollarSign className="h-5 w-5" />,
    Building2: <Building2 className="h-5 w-5" />,
    Users: <Users className="h-5 w-5" />,
    LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
    AlertTriangle: <AlertTriangle className="h-5 w-5" />,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Painel de Controle</h1>
          <p className="text-sm text-slate-500 mt-1">
            Olá, {user?.name}! Acompanhe o status dos documentos e vendas.
          </p>
        </div>
        {/* Quick Stats */}
        {stats && (
          <>
            {/* Alert de pendências */}
            {stats.totalPending > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-sm font-medium text-amber-800">
                  <strong>{stats.totalPending} pendência(s)</strong> aguardando liberação — {stats.setorStats.financeiro} no Financeiro, {stats.setorStats.administrativo} no Administrativo
                </p>
              </div>
            )}

            {/* Sales section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-green-200">
                <CardContent className="pt-5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-700">{stats.salesStats.totalSales}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Vendas do Mês</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-emerald-200">
                <CardContent className="pt-5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-emerald-700">{stats.salesStats.completedSales}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Aprovadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-200">
                <CardContent className="pt-5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-blue-700">R$ {stats.salesStats.totalRevenue.toLocaleString('pt-BR')}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Receita Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-purple-200">
                <CardContent className="pt-5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Car className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-purple-700">R$ {stats.salesStats.averageSaleValue.toLocaleString('pt-BR')}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Ticket Médio</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pipeline / Estoque / Entrega */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              <Card className="border-amber-200">
                <CardContent className="pt-5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <Target className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-700">{pipelineStats.total}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Leads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-cyan-200">
                <CardContent className="pt-5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-cyan-100 rounded-lg">
                      <Package className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-cyan-700">{inventoryStats.available}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Estoque</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-orange-200">
                <CardContent className="pt-5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-orange-100 rounded-lg">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-orange-700">{deliveryStats.inProgress || deliveryStats.scheduled}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Entregas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-indigo-200">
                <CardContent className="pt-5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                      <Car className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-indigo-700">{inventoryStats.sold}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Vendidos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-teal-200">
                <CardContent className="pt-5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-teal-100 rounded-lg">
                      <Truck className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-teal-700">{deliveryStats.completed}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Entregas OK</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FLOW PANEL — Visual representation of the complete process */}
            <Card className="border-2 border-blue-100 shadow-sm bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base font-semibold text-slate-800">Fluxo do Processo</CardTitle>
                  <span className="text-xs text-slate-400 ml-auto">Toque para abrir</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-slate-400">Vistoria → Estoque → Pipeline → Proposta → Venda → Financeiro → Administrativo → Despachante → Entrega</span>
                </div>
              </CardHeader>
              <CardContent>
                {/* Desktop: horizontal flow with arrows */}
                <div className="hidden md:flex items-center justify-center gap-1 overflow-x-auto pb-2 flex-wrap">
                  {flowSteps.map((step, idx) => {
                    const IconMap: Record<string, React.ElementType> = {
                      Camera: Camera,
                      Warehouse: Warehouse,
                      Target: Target,
                      Handshake: Handshake,
                      Car: Car,
                      DollarSign: DollarSign,
                      Building2: Building2,
                      FileText: FileText,
                      Truck: Truck,
                    };
                    return (
                      <div key={step.key} className="flex items-center gap-1 relative">
                        <FlowStepCard
                          label={step.label}
                          count={step.count}
                          total={step.total}
                          Icon={IconMap[step.icon] || Car}
                          color={step.color}
                          onClick={() => step.route && navigate(step.route)}
                          route={step.route}
                        />
                        {idx < flowSteps.length - 1 && <FlowArrow />}
                      </div>
                    );
                  })}
                </div>

                {/* Mobile: 3-column grid */}
                <div className="md:hidden grid grid-cols-3 gap-2">
                  {flowSteps.map((step) => {
                    const IconMap: Record<string, React.ElementType> = {
                      Camera: Camera,
                      Warehouse: Warehouse,
                      Target: Target,
                      Handshake: Handshake,
                      Car: Car,
                      DollarSign: DollarSign,
                      Building2: Building2,
                      FileText: FileText,
                      Truck: Truck,
                    };
                    return (
                      <FlowStepCard
                        key={step.key}
                        label={step.label}
                        count={step.count}
                        total={step.total}
                        Icon={IconMap[step.icon] || Car}
                        color={step.color}
                        onClick={() => step.route && navigate(step.route)}
                        route={step.route}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Existing pending stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalPending}</p>
                      <p className="text-xs text-slate-500">Documentos Parados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.setorStats.financeiro}</p>
                      <p className="text-xs text-slate-500">Pendentes (Financeiro)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.setorStats.administrativo}</p>
                      <p className="text-xs text-slate-500">Pendentes (Administrativo)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          {[
            { key: "vendedores", label: "Por Vendedor" },
            { key: "setores", label: "Por Setor" },
            { key: "modulos", label: "Módulos" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "vendedores" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Documentos Parados por Vendedor
            </h2>
            {stats && stats.vendedorStats.length > 0 ? (
              <div className="grid gap-4">
                {stats.vendedorStats.map((vendedor) => (
                  <Card key={vendedor.name}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{vendedor.name}</CardTitle>
                        <Badge variant={vendedor.pendingFinancial + vendedor.pendingAdmin > 0 ? "destructive" : "secondary"}>
                          {vendedor.pendingFinancial + vendedor.pendingAdmin} pendente(s)
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-slate-600">Financeiro:</span>
                          <Badge variant={vendedor.pendingFinancial > 0 ? "default" : "secondary"} className="ml-auto">
                            {vendedor.pendingFinancial}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-purple-500" />
                          <span className="text-sm text-slate-600">Administrativo:</span>
                          <Badge variant={vendedor.pendingAdmin > 0 ? "default" : "secondary"} className="ml-auto">
                            {vendedor.pendingAdmin}
                          </Badge>
                        </div>
                        <Progress
                          value={
                            vendedor.pendingFinancial + vendedor.pendingAdmin === 0
                              ? 100
                              : ((vendedor.pendingFinancial + vendedor.pendingAdmin) / (stats.totalPending || 1)) * 100
                          }
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Car className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Nenhuma venda registrada ainda.</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Os documentos parados por vendedor aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "setores" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Documentos Parados por Setor
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-blue-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Setor Financeiro</CardTitle>
                      <p className="text-sm text-slate-500">Aprovação de pagamentos</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600">
                      {stats?.setorStats.financeiro || 0}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {stats?.setorStats.financeiro === 0
                        ? "Tudo em dia!"
                        : "documento(s) pendente(s)"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Setor Administrativo</CardTitle>
                      <p className="text-sm text-slate-500">Aprovação de documentos</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-purple-600">
                      {stats?.setorStats.administrativo || 0}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {stats?.setorStats.administrativo === 0
                        ? "Tudo em dia!"
                        : "documento(s) pendente(s)"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "modulos" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Módulos do Sistema
            </h2>
            {modules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((mod) => (
                  <Card
                    key={mod.moduleKey}
                    className={`transition-all ${
                      !mod.isActive ? "opacity-50" : "hover:shadow-md"
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          {iconMap[mod.icon] || <FileText className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{mod.name}</h3>
                            <Badge
                              variant={mod.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {mod.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {mod.description}
                          </p>
                          {mod.route && (
                            <p className="text-xs text-slate-400 mt-2">
                              Rota: {mod.route}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Carregando módulos...</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
