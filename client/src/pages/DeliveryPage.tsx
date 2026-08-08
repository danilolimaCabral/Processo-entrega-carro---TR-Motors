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

type DeliveryStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

const statusLabels: Record<DeliveryStatus, string> = {
  scheduled: "Agendada",
  in_progress: "Em Andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const statusColors: Record<DeliveryStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function DeliveryPage() {
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: deliveriesData, isLoading, refetch } = trpc.deliveries.list.useQuery(
    {},
    { refetchInterval: 10000 }
  );

  const { data: statsData } = trpc.deliveries.stats.useQuery();

  const updateStatusMutation = trpc.deliveries.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
      setDetailId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateChecklistMutation = trpc.deliveries.updateChecklist.useMutation({
    onSuccess: () => {
      toast.success("Checklist atualizado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deliveries = deliveriesData?.data || [];
  const stats = statsData || { total: 0, scheduled: 0, inProgress: 0, completed: 0 };

  const checklistItems = [
    "Documentos do veículo entregues",
    "Chaves entregues",
    "Manual do proprietário entregue",
    "Nota fiscal emitida",
    "Contrato assinado",
    "Seguro contratado",
    "IPVA/Detran regularizado",
    "Carro limpo e revisado",
    "Cliente orientado sobre garantia",
    "Foto do cliente com o carro",
  ];

  const selectedDelivery = detailId ? deliveries.find((d: any) => d.id === detailId) : null;

  const toggleChecklistItem = (deliveryId: number, item: string, checked: boolean) => {
    const delivery = deliveries.find((d: any) => d.id === deliveryId);
    if (!delivery) return;
    const currentChecklist = delivery.checklist || {};
    updateChecklistMutation.mutate({
      id: deliveryId,
      checklist: { ...currentChecklist, [item]: checked },
    });
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
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress || 0}</p>
                <p className="text-xs text-gray-500">Em Andamento</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed || 0}</p>
                <p className="text-xs text-gray-500">Concluídas</p>
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
              const checklist = d.checklist || {};
              const checklistCount = Object.values(checklist).filter(Boolean).length;
              const checklistTotal = checklistItems.length;
              const progress = Math.round((checklistCount / checklistTotal) * 100);

              return (
                <Card key={d.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailId(d.id === detailId ? null : d.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Car className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{d.vehicleInfo || `Veículo #${d.saleRecordId}`}</p>
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
                          {checklistItems.map((item) => (
                            <label key={item} className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={!!checklist[item]}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleChecklistItem(d.id, item, e.target.checked);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-red-600"
                              />
                              <span className={checklist[item] ? "text-green-700 line-through" : ""}>{item}</span>
                            </label>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-4">
                          {d.status === "scheduled" && (
                            <Button size="sm" onClick={(e) => {
                              e.stopPropagation();
                              updateStatusMutation.mutate({ id: d.id, status: "in_progress" });
                            }}>
                              <Eye className="h-4 w-4 mr-1" /> Iniciar
                            </Button>
                          )}
                          {d.status === "in_progress" && (
                            <Button size="sm" className="bg-green-600" onClick={(e) => {
                              e.stopPropagation();
                              updateStatusMutation.mutate({ id: d.id, status: "completed" });
                            }}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Concluir
                            </Button>
                          )}
                          {d.status === "completed" && (
                            <Button size="sm" variant="outline" onClick={(e) => {
                              e.stopPropagation();
                              updateStatusMutation.mutate({ id: d.id, status: "scheduled" });
                            }}>
                              <Clock className="h-4 w-4 mr-1" /> Reabrir
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
