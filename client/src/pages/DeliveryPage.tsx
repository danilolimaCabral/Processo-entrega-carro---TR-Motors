import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Truck, Calendar, CheckCircle, Clock, XCircle, Eye,
  ClipboardCheck, Key, FileText, Car, User,
} from "lucide-react";

const checklistConfig = [
  { key: "checklistChaves", label: "Chaves entregues" },
  { key: "checklistDocumentos", label: "Documentos do veículo" },
  { key: "checklistManual", label: "Manual do proprietário" },
  { key: "checklistKitPrimeirosSocorros", label: "Kit primeiros socorros" },
  { key: "checklistMacaco", label: "Macaco" },
  { key: "checklistEstepe", label: "Estepe" },
  { key: "checklistChaveRodas", label: "Chave de rodas" },
  { key: "checklistTanqueCheio", label: "Tanque cheio" },
  { key: "checklistAcessorios", label: "Acessórios" },
  { key: "checklistRevisao", label: "Revisão feita" },
  { key: "checklistFotoPlaca", label: "Foto da placa" },
  { key: "checklistOdometro", label: "Odômetro anotado" },
  { key: "checklistCombustivel", label: "Nível de combustível" },
  { key: "checklistAssinaturaContrato", label: "Contrato assinado" },
];

export default function DeliveryPage() {
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: deliveriesData, isLoading, refetch } = trpc.delivery.list.useQuery(
    {},
    { refetchInterval: 10000 }
  );

  const { data: statsData } = trpc.delivery.stats.useQuery();

  const updateStatusMutation = trpc.delivery.update.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateChecklistMutation = trpc.delivery.update.useMutation({
    onSuccess: () => {
      toast.success("Checklist atualizado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deliveries = deliveriesData || [];
  const stats = statsData || { total: 0, scheduled: 0, preparing: 0, delivered: 0 };

  const selectedDelivery = detailId ? deliveries.find((d: any) => d.id === detailId) : null;

  const toggleChecklistItem = (deliveryId: number, key: string, checked: boolean) => {
    const input: Record<string, any> = { id: deliveryId };
    input[key] = checked;
    updateChecklistMutation.mutate(input);
  };

  const getChecklistCount = (d: any) => {
    return checklistConfig.filter(c => d[c.key]).length;
  };

  return (
    <DashboardLayout title="Entrega de Veículos">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Truck className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total || deliveries.length}</p>
                <p className="text-xs text-gray-500">Total Entregas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled || 0}</p>
                <p className="text-xs text-gray-500">Agendadas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.preparing || 0}</p>
                <p className="text-xs text-gray-500">Em Preparação</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.delivered || 0}</p>
                <p className="text-xs text-gray-500">Entregues</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deliveries List */}
        {isLoading ? (
          <Card><CardContent className="p-8 text-center text-gray-500">Carregando entregas...</CardContent></Card>
        ) : deliveries.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500">
            <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma entrega agendada</p>
            <p className="text-sm mt-1">As entregas são criadas automaticamente quando uma venda é aprovada</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {deliveries.map((d: any) => {
              const checklistCount = getChecklistCount(d);
              const checklistTotal = checklistConfig.length;
              const progress = Math.round((checklistCount / checklistTotal) * 100);

              const statusColors: Record<string, string> = {
                agendada: "bg-blue-100 text-blue-800",
                em_preparacao: "bg-yellow-100 text-yellow-800",
                entregue: "bg-green-100 text-green-800",
                cancelada: "bg-red-100 text-red-800",
              };
              const statusLabels: Record<string, string> = {
                agendada: "Agendada",
                em_preparacao: "Em Preparação",
                entregue: "Entregue",
                cancelada: "Cancelada",
              };

              return (
                <Card key={d.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailId(d.id === detailId ? null : d.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Car className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{d.vehicleDescription || `Veículo #${d.saleRecordId}`}</p>
                          <p className="text-xs text-gray-500">Cliente: {d.customerName || "N/A"}</p>
                          <p className="text-xs text-gray-400">
                            {d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString("pt-BR") : "Sem data"}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusColors[d.status] || "bg-gray-100 text-gray-800"}>
                        {statusLabels[d.status] || d.status}
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Checklist</span>
                        <span>{checklistCount}/{checklistTotal} ({progress}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {d.id === detailId && (
                      <div className="mt-4 pt-3 border-t">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4" /> Checklist de Entrega
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {checklistConfig.map((item) => (
                            <label key={item.key} className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={!!d[item.key]}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleChecklistItem(d.id, item.key, e.target.checked);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-red-600"
                              />
                              <span className={d[item.key] ? "text-green-700 line-through" : ""}>{item.label}</span>
                            </label>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-4 flex-wrap">
                          {d.status === "agendada" && (
                            <Button size="sm" onClick={(e) => {
                              e.stopPropagation();
                              updateStatusMutation.mutate({ id: d.id, status: "em_preparacao" });
                            }}>
                              <Eye className="h-4 w-4 mr-1" /> Iniciar Preparação
                            </Button>
                          )}
                          {d.status === "em_preparacao" && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={(e) => {
                              e.stopPropagation();
                              updateStatusMutation.mutate({ id: d.id, status: "entregue" });
                            }}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Marcar Entregue
                            </Button>
                          )}
                          {d.status === "entregue" && (
                            <Button size="sm" variant="outline" onClick={(e) => {
                              e.stopPropagation();
                              updateStatusMutation.mutate({ id: d.id, status: "agendada" });
                            }}>
                              <Clock className="h-4 w-4 mr-1" /> Reabrir
                            </Button>
                          )}
                          {d.status !== "cancelada" && (
                            <Button size="sm" variant="destructive" onClick={(e) => {
                              e.stopPropagation();
                              updateStatusMutation.mutate({ id: d.id, status: "cancelada" });
                            }}>
                              <XCircle className="h-4 w-4 mr-1" /> Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
