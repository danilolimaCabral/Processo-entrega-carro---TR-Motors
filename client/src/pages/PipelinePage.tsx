import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Target, Plus, User, Phone, Mail, Car, ArrowRight,
  XCircle, CheckCircle, Clock,
} from "lucide-react";

type PipelineStage = "novo_lead" | "qualificado" | "proposta_enviada" | "negociando" | "venda_fechada" | "perdido";

const stageLabels: Record<PipelineStage, string> = {
  novo_lead: "Novo Lead",
  qualificado: "Qualificado",
  proposta_enviada: "Proposta",
  negociando: "Negociando",
  venda_fechada: "Venda Fechada",
  perdido: "Perdido",
};

const stageColors: Record<PipelineStage, string> = {
  novo_lead: "bg-gray-100 border-gray-300",
  qualificado: "bg-blue-50 border-blue-300",
  proposta_enviada: "bg-yellow-50 border-yellow-300",
  negociando: "bg-orange-50 border-orange-300",
  venda_fechada: "bg-green-50 border-green-300",
  perdido: "bg-red-50 border-red-300",
};

const stageBadgeColors: Record<PipelineStage, string> = {
  novo_lead: "bg-gray-500",
  qualificado: "bg-blue-500",
  proposta_enviada: "bg-yellow-500",
  negociando: "bg-orange-500",
  venda_fechada: "bg-green-500",
  perdido: "bg-red-500",
};

export default function PipelinePage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", interest: "",
    vehicleId: "", stage: "novo_lead" as PipelineStage, notes: "",
  });

  const { data: pipelineData, isLoading, refetch } = trpc.pipeline.list.useQuery(
    { search: search || undefined },
    { refetchInterval: 10000 }
  );

  const { data: statsData } = trpc.pipeline.stats.useQuery();

  const createMutation = trpc.pipeline.create.useMutation({
    onSuccess: () => {
      toast.success("Lead adicionado ao pipeline!");
      setDialogOpen(false);
      refetch();
      setForm({ name: "", phone: "", email: "", interest: "", vehicleId: "", stage: "novo_lead", notes: "" });
    },
    onError: (err) => toast.error(err.message),
  });

  const moveStageMutation = trpc.pipeline.update.useMutation({
    onSuccess: () => {
      toast.success("Lead movido com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const pipeline = (pipelineData || []).map((p: any) => p.lead || p);
  const stats = statsData || { total: 0, byStage: {} };

  // Helper to get lead properties safely
  const getLead = (p: any) => p.lead || p;

  const nextStages: Record<PipelineStage, PipelineStage[]> = {
    novo_lead: ["qualificado", "perdido"],
    qualificado: ["proposta_enviada", "perdido"],
    proposta_enviada: ["negociando", "perdido"],
    negociando: ["venda_fechada", "perdido"],
    venda_fechada: [],
    perdido: ["novo_lead"],
  };

  const handleSubmit = () => {
    if (!form.name) {
      toast.error("Nome é obrigatório");
      return;
    }
    createMutation.mutate({
      leadName: form.name,
      leadPhone: form.phone || undefined,
      leadEmail: form.email || undefined,
      vehicleDescription: form.interest || undefined,
      vehicleId: form.vehicleId ? parseInt(form.vehicleId) : undefined,
      stage: form.stage,
      notes: form.notes || undefined,
    });
  };

  return (
    <DashboardLayout title="Pipeline CRM">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total || pipeline.length}</p>
                <p className="text-xs text-gray-500">Total Leads</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {pipeline.filter((p: any) => getLead(p).stage !== "venda_fechada" && getLead(p).stage !== "perdido").length}
                </p>
                <p className="text-xs text-gray-500">Em andamento</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {pipeline.filter((p: any) => getLead(p).stage === "venda_fechada").length}
                </p>
                <p className="text-xs text-gray-500">Vendidos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {pipeline.filter((p: any) => getLead(p).stage === "perdido").length}
                </p>
                <p className="text-xs text-gray-500">Perdidos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" /> Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Novo Lead / Oportunidade</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Nome do Cliente *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="João da Silva" />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-1">
                    <Label>E-mail</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@email.com" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Veículo de Interesse</Label>
                    <Input value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} placeholder="Honda Civic 2024" />
                  </div>
                  <div className="space-y-1">
                    <Label>Etapa</Label>
                    <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as PipelineStage })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo_lead">Novo Lead</SelectItem>
                        <SelectItem value="qualificado">Qualificado</SelectItem>
                        <SelectItem value="proposta_enviada">Proposta Enviada</SelectItem>
                        <SelectItem value="negociando">Negociando</SelectItem>
                        <SelectItem value="venda_fechada">Venda Fechada</SelectItem>
                        <SelectItem value="perdido">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Observações</Label>
                    <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalhes..." />
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full bg-red-600 hover:bg-red-700" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Adicionar Lead"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
          <div className="w-full sm:w-64">
            <Input
              placeholder="Buscar lead..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Pipeline Board - Desktop */}
          <div className="hidden lg:block">
          <div className="grid grid-cols-6 gap-2">
            {(["novo_lead", "qualificado", "proposta_enviada", "negociando", "venda_fechada", "perdido"] as PipelineStage[]).map((stage) => {
              const stagePipelines = pipeline.filter((p: any) => getLead(p).stage === stage);
              return (
                <div key={stage} className={`rounded-lg border p-2 min-h-[300px] ${stageColors[stage]}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-gray-700">{stageLabels[stage]}</h3>
                    <Badge variant="secondary" className="text-[10px]">{stagePipelines.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {stagePipelines.map((p: any) => (
                      <Card key={p.id} className="p-2 cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="flex items-center gap-1 mb-1">
                            <User className="h-3 w-3 text-gray-400" />
                            <p className="text-xs font-medium truncate">{getLead(p).leadName || "-"}</p>
                          </div>
                          {getLead(p).vehicleDescription && (
                            <p className="text-[10px] text-gray-500 truncate mb-1">🚗 {getLead(p).vehicleDescription}</p>
                          )}
                      <div className="flex gap-1 flex-wrap">
                        {nextStages[stage].map((next) => (
                              <Button
                                key={next}
                                size="sm"
                                variant="ghost"
                                className="h-5 text-[10px] px-1 py-0"
                                onClick={() => moveStageMutation.mutate({ id: getLead(p).id, stage: next })}
                              >
                            <ArrowRight className="h-2.5 w-2.5 mr-0.5" />
                            {stageLabels[next]}
                          </Button>
                        ))}
                      </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline List - Mobile */}
        <div className="lg:hidden space-y-2">
          {isLoading ? (
            <Card><CardContent className="p-8 text-center text-gray-500">Carregando pipeline...</CardContent></Card>
          ) : pipeline.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum lead no pipeline</p>
              <p className="text-sm mt-1">Adicione leads e acompanhe as vendas</p>
            </CardContent></Card>
          ) : (
            pipeline.map((p: any) => {
              const lead = getLead(p);
              return (
              <Card key={lead.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{lead.leadName || "-"}</p>
                      {lead.vehicleDescription && <p className="text-xs text-gray-500">Interesse: {lead.vehicleDescription}</p>}
                      <p className="text-xs text-gray-400">{lead.leadPhone || lead.leadEmail || ""}</p>
                    </div>
                    <Badge className={`${stageBadgeColors[lead.stage] || "bg-gray-500"} text-white text-[10px]`}>
                      {stageLabels[lead.stage]}
                    </Badge>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {nextStages[lead.stage].map((next) => (
                      <Button
                        key={next}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => moveStageMutation.mutate({ id: lead.id, stage: next })}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        {stageLabels[next]}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
