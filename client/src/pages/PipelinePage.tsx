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

type PipelineStage = "lead" | "contacted" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

const stageLabels: Record<PipelineStage, string> = {
  lead: "Lead",
  contacted: "Contatado",
  proposal: "Proposta",
  negotiation: "Negociação",
  closed_won: "Fechado (Vendido)",
  closed_lost: "Fechado (Perdido)",
};

const stageColors: Record<PipelineStage, string> = {
  lead: "bg-gray-100 border-gray-300",
  contacted: "bg-blue-50 border-blue-300",
  proposal: "bg-yellow-50 border-yellow-300",
  negotiation: "bg-orange-50 border-orange-300",
  closed_won: "bg-green-50 border-green-300",
  closed_lost: "bg-red-50 border-red-300",
};

const stageBadgeColors: Record<PipelineStage, string> = {
  lead: "bg-gray-500",
  contacted: "bg-blue-500",
  proposal: "bg-yellow-500",
  negotiation: "bg-orange-500",
  closed_won: "bg-green-500",
  closed_lost: "bg-red-500",
};

export default function PipelinePage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", interest: "",
    vehicleId: "", stage: "lead" as PipelineStage, notes: "",
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
      setForm({ name: "", phone: "", email: "", interest: "", vehicleId: "", stage: "lead", notes: "" });
    },
    onError: (err) => toast.error(err.message),
  });

  const moveStageMutation = trpc.pipeline.moveStage.useMutation({
    onSuccess: () => {
      toast.success("Lead movido com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const pipeline = pipelineData?.data || [];
  const stats = statsData || { total: 0, byStage: {} };

  const nextStages: Record<PipelineStage, PipelineStage[]> = {
    lead: ["contacted"],
    contacted: ["proposal", "closed_lost"],
    proposal: ["negotiation", "closed_lost"],
    negotiation: ["closed_won", "closed_lost"],
    closed_won: [],
    closed_lost: ["lead"],
  };

  const handleSubmit = () => {
    if (!form.name) {
      toast.error("Nome é obrigatório");
      return;
    }
    createMutation.mutate({
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      interest: form.interest || undefined,
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
                  {pipeline.filter((p: any) => p.stage !== "closed_won" && p.stage !== "closed_lost").length}
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
                  {pipeline.filter((p: any) => p.stage === "closed_won").length}
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
                  {pipeline.filter((p: any) => p.stage === "closed_lost").length}
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
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="contacted">Contatado</SelectItem>
                        <SelectItem value="proposal">Proposta</SelectItem>
                        <SelectItem value="negotiation">Negociação</SelectItem>
                        <SelectItem value="closed_won">Fechado (Vendido)</SelectItem>
                        <SelectItem value="closed_lost">Fechado (Perdido)</SelectItem>
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
            {(["lead", "contacted", "proposal", "negotiation", "closed_won", "closed_lost"] as PipelineStage[]).map((stage) => {
              const stagePipelines = pipeline.filter((p: any) => p.stage === stage);
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
                            <p className="text-xs font-medium truncate">{p.name}</p>
                          </div>
                          {p.interest && (
                            <p className="text-[10px] text-gray-500 truncate mb-1">🚗 {p.interest}</p>
                          )}
                          <div className="flex gap-1 flex-wrap">
                            {nextStages[stage].map((next) => (
                              <Button
                                key={next}
                                size="sm"
                                variant="ghost"
                                className="h-5 text-[10px] px-1 py-0"
                                onClick={() => moveStageMutation.mutate({ id: p.id, stage: next })}
                              >
                                <ArrowRight className="h-2.5 w-2.5 mr-0.5" />
                                {stageLabels[next].split(" ")[0]}
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
            pipeline.map((p: any) => (
              <Card key={p.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      {p.interest && <p className="text-xs text-gray-500">Interesse: {p.interest}</p>}
                      <p className="text-xs text-gray-400">{p.phone || p.email || ""}</p>
                    </div>
                    <Badge className={`${stageBadgeColors[p.stage] || "bg-gray-500"} text-white text-[10px]`}>
                      {stageLabels[p.stage]}
                    </Badge>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {nextStages[p.stage].map((next) => (
                      <Button
                        key={next}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => moveStageMutation.mutate({ id: p.id, stage: next })}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        {stageLabels[next]}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
