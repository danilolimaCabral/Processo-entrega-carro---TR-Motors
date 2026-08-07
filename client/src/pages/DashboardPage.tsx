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
} from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"vendedores" | "setores" | "modulos">("vendedores");

  const statsQuery = trpc.modules.dashboardStats.useQuery();
  const modulesQuery = trpc.modules.list.useQuery();

  const modules = modulesQuery.data || [];
  const stats = statsQuery.data;

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
