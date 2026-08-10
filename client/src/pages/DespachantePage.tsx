import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Plus,
  FileText,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  ClipboardList,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  MessageCircle,
  Printer,
  Send,
  Loader2,
} from "lucide-react";

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  documentos_coletados: "bg-blue-100 text-blue-800",
  em_processamento: "bg-purple-100 text-purple-800",
  cartorio: "bg-orange-100 text-orange-800",
  detran: "bg-indigo-100 text-indigo-800",
  concluido: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  documentos_coletados: "Docs Coletados",
  em_processamento: "Em Processamento",
  cartorio: "No Cartório",
  detran: "No Detran",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const cartorioStatusColors: Record<string, string> = {
  nao_necessario: "bg-gray-100 text-gray-600",
  pendente: "bg-yellow-100 text-yellow-800",
  enviado: "bg-blue-100 text-blue-800",
  registrado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
};

const cartorioStatusLabels: Record<string, string> = {
  nao_necessario: "N/A",
  pendente: "Pendente",
  enviado: "Enviado",
  registrado: "Registrado",
  rejeitado: "Rejeitado",
};

type DocForm = {
  clientName: string;
  clientCpf: string;
  clientPhone: string;
  clientEmail: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  docRg: boolean;
  docCpf: boolean;
  docComprovanteResidencia: boolean;
  docCnh: boolean;
  docCertificadoNascimento: boolean;
  docComprovantePagamento: boolean;
  docPoderJuridica: boolean;
  docDut: boolean;
  docOutro: string;
  serviceTransferencia: boolean;
  serviceEmplacamento: boolean;
  serviceLicenciamento: boolean;
  serviceCrvCrlv: boolean;
  serviceCartorio: boolean;
  serviceReconhecimentoFirma: boolean;
  observations: string;
  cartorioStatus: string;
  cartorioObservation: string;
};

const emptyForm: DocForm = {
  clientName: "",
  clientCpf: "",
  clientPhone: "",
  clientEmail: "",
  vehiclePlate: "",
  vehicleBrand: "",
  vehicleModel: "",
  vehicleYear: "",
  docRg: true,
  docCpf: true,
  docComprovanteResidencia: true,
  docCnh: false,
  docCertificadoNascimento: false,
  docComprovantePagamento: true,
  docPoderJuridica: false,
  docDut: false,
  docOutro: "",
  serviceTransferencia: true,
  serviceEmplacamento: false,
  serviceLicenciamento: false,
  serviceCrvCrlv: false,
  serviceCartorio: false,
  serviceReconhecimentoFirma: false,
  observations: "",
  cartorioStatus: "nao_necessario",
  cartorioObservation: "",
};

function DocumentForm({
  form,
  setForm,
  isEdit,
}: {
  form: DocForm;
  setForm: (f: DocForm) => void;
  isEdit: boolean;
}) {
  const updateField = (field: keyof DocForm, value: any) => {
    setForm({ ...form, [field]: value });
  };

  // Busca automática de placa desativada - preencha manualmente

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Dados do Cliente */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <FileText size={16} /> Dados do Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nome Completo *</Label>
            <Input
              placeholder="Nome do cliente"
              value={form.clientName}
              onChange={(e) => updateField("clientName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>CPF *</Label>
            <Input
              placeholder="000.000.000-00"
              value={form.clientCpf}
              onChange={(e) => updateField("clientCpf", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone / WhatsApp</Label>
            <Input
              placeholder="(00) 00000-0000"
              value={form.clientPhone}
              onChange={(e) => updateField("clientPhone", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={form.clientEmail}
              onChange={(e) => updateField("clientEmail", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Dados do Veículo */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <ClipboardList size={16} /> Dados do Veículo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Placa</Label>
            <Input
              placeholder="ABC-1234"
              value={form.vehiclePlate}
              onChange={(e) => updateField("vehiclePlate", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Input
              placeholder="Toyota"
              value={form.vehicleBrand}
              onChange={(e) => updateField("vehicleBrand", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <Input
              placeholder="Corolla"
              value={form.vehicleModel}
              onChange={(e) => updateField("vehicleModel", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ano</Label>
            <Input
              type="number"
              placeholder="2024"
              value={form.vehicleYear}
              onChange={(e) => updateField("vehicleYear", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Documentos Necessários */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <FileText size={16} /> Documentos Necessários
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { key: "docRg", label: "RG" },
            { key: "docCpf", label: "CPF" },
            { key: "docComprovanteResidencia", label: "Comprovante de Residência" },
            { key: "docCnh", label: "CNH" },
            { key: "docCertificadoNascimento", label: "Certidão Nascimento/Casamento" },
            { key: "docComprovantePagamento", label: "Comprovante de Pagamento" },
            { key: "docPoderJuridica", label: "Procuração/Assinatura" },
            { key: "docDut", label: "DUT" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                checked={(form as any)[key]}
                onCheckedChange={(checked) => updateField(key, checked)}
                id={key}
              />
              <Label htmlFor={key} className="text-sm cursor-pointer">
                {label}
              </Label>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label>Outro documento</Label>
          <Input
            placeholder="Especifique outro documento necessário"
            value={form.docOutro}
            onChange={(e) => updateField("docOutro", e.target.value)}
          />
        </div>
      </div>

      {/* Serviços */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <Building2 size={16} /> Serviços de Despachante
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { key: "serviceTransferencia", label: "Transferência de Propriedade" },
            { key: "serviceEmplacamento", label: "Emplacamento" },
            { key: "serviceLicenciamento", label: "Licenciamento" },
            { key: "serviceCrvCrlv", label: "CRV / CRLV" },
            { key: "serviceCartorio", label: "Registro em Cartório" },
            { key: "serviceReconhecimentoFirma", label: "Reconhecimento de Firma" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                checked={(form as any)[key]}
                onCheckedChange={(checked) => updateField(key, checked)}
                id={key}
              />
              <Label htmlFor={key} className="text-sm cursor-pointer">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Cartório */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <Building2 size={16} /> Registro em Cartório
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Status no Cartório</Label>
            <Select
              value={form.cartorioStatus}
              onValueChange={(v) => updateField("cartorioStatus", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nao_necessario">Não Necessário</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="registrado">Registrado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Observação do Cartório</Label>
          <Input
            placeholder="Detalhes sobre o registro no cartório"
            value={form.cartorioObservation}
            onChange={(e) => updateField("cartorioObservation", e.target.value)}
          />
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-1.5">
        <Label>Observações Gerais</Label>
        <Textarea
          placeholder="Observações sobre o processo..."
          value={form.observations}
          onChange={(e) => updateField("observations", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}

export default function DespachantePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [form, setForm] = useState<DocForm>(emptyForm);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: listData, isLoading, refetch } = trpc.despachante.list.useQuery(
    { search, status: statusFilter },
    { refetchInterval: 10000 }
  );
  const { data: stats } = trpc.despachante.stats.useQuery();
  const createMutation = trpc.despachante.create.useMutation();
  const updateMutation = trpc.despachante.update.useMutation();
  const deleteMutation = trpc.despachante.delete.useMutation();
  const sendWhatsappMutation = trpc.despachante.sendWhatsapp.useMutation();
  const { data: detailDoc } = trpc.despachante.getById.useQuery(
    { id: detailId || 0 },
    { enabled: !!detailId }
  );

  const handleCreate = async () => {
    if (!form.clientName || !form.clientCpf) {
      toast.error("Nome e CPF são obrigatórios");
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        ...form,
        vehicleYear: form.vehicleYear ? parseInt(form.vehicleYear) : undefined,
      });
      toast.success("Documento criado com sucesso!");
      setForm(emptyForm);
      setDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar");
    }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    try {
      await updateMutation.mutateAsync({
        id: editId,
        ...form,
        vehicleYear: form.vehicleYear ? parseInt(form.vehicleYear) : undefined,
      });
      toast.success("Atualizado com sucesso!");
      setForm(emptyForm);
      setEditId(null);
      setDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir este registro?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Excluído com sucesso!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir");
    }
  };

  const handleSendWhatsapp = async (id: number) => {
    try {
      const result = await sendWhatsappMutation.mutateAsync({ id });
      if (result.success && result.url) {
        window.open(result.url, "_blank");
        refetch();
      } else {
        toast.error(result.message || "Telefone não cadastrado");
      }
    } catch (err: any) {
      toast.error("Erro ao enviar WhatsApp");
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id, status: newStatus });
      toast.success("Status atualizado!");
      refetch();
    } catch (err: any) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleCartorioChange = async (id: number, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id, cartorioStatus: newStatus });
      toast.success("Status do cartório atualizado!");
      refetch();
    } catch (err: any) {
      toast.error("Erro ao atualizar");
    }
  };

  const openEdit = (doc: any) => {
    setForm({
      clientName: doc.clientName || "",
      clientCpf: doc.clientCpf || "",
      clientPhone: doc.clientPhone || "",
      clientEmail: doc.clientEmail || "",
      vehiclePlate: doc.vehiclePlate || "",
      vehicleBrand: doc.vehicleBrand || "",
      vehicleModel: doc.vehicleModel || "",
      vehicleYear: doc.vehicleYear?.toString() || "",
      docRg: doc.docRg || false,
      docCpf: doc.docCpf || false,
      docComprovanteResidencia: doc.docComprovanteResidencia || false,
      docCnh: doc.docCnh || false,
      docCertificadoNascimento: doc.docCertificadoNascimento || false,
      docComprovantePagamento: doc.docComprovantePagamento || false,
      docPoderJuridica: doc.docPoderJuridica || false,
      docDut: doc.docDut || false,
      docOutro: doc.docOutro || "",
      serviceTransferencia: doc.serviceTransferencia || false,
      serviceEmplacamento: doc.serviceEmplacamento || false,
      serviceLicenciamento: doc.serviceLicenciamento || false,
      serviceCrvCrlv: doc.serviceCrvCrlv || false,
      serviceCartorio: doc.serviceCartorio || false,
      serviceReconhecimentoFirma: doc.serviceReconhecimentoFirma || false,
      observations: doc.observations || "",
      cartorioStatus: doc.cartorioStatus || "nao_necessario",
      cartorioObservation: doc.cartorioObservation || "",
    });
    setEditId(doc.id);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout title="Despachante">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Despachante</h1>
            <p className="text-slate-500 text-sm mt-1">
              Gerencie documentos, serviços de despachante e registro em cartório
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setForm(emptyForm); setEditId(null); }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
                <Plus size={16} /> Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editId ? "Editar Registro" : "Novo Registro - Despachante"}
                </DialogTitle>
                <DialogDescription>
                  Cadastre os dados do cliente e serviços necessários
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">
                <DocumentForm form={form} setForm={setForm} isEdit={!!editId} />
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => { setDialogOpen(false); setEditId(null); }}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white ml-auto"
                  onClick={editId ? handleUpdate : handleCreate}
                >
                  {editId ? "Salvar Alterações" : "Criar Registro"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Total", value: stats.total, color: "bg-slate-100 text-slate-700" },
              { label: "Pendentes", value: stats.pendente, color: "bg-yellow-100 text-yellow-700" },
              { label: "Docs Coletados", value: stats.documentosColetados, color: "bg-blue-100 text-blue-700" },
              { label: "Processando", value: stats.emProcessamento, color: "bg-purple-100 text-purple-700" },
              { label: "Cartório", value: stats.cartorio, color: "bg-orange-100 text-orange-700" },
              { label: "Detran", value: stats.detran, color: "bg-indigo-100 text-indigo-700" },
              { label: "Concluídos", value: stats.concluido, color: "bg-green-100 text-green-700" },
            ].map((s) => (
              <Card key={s.label} className={s.color}>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs font-medium">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Pesquisar por nome, CPF, placa, marca, modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="documentos_coletados">Docs Coletados</SelectItem>
              <SelectItem value="em_processamento">Em Processamento</SelectItem>
              <SelectItem value="cartorio">No Cartório</SelectItem>
              <SelectItem value="detran">No Detran</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
          </div>
        ) : listData?.data.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhum registro encontrado</p>
              <p className="text-sm mt-1">Clique em "Novo Registro" para começar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {listData?.data.map((doc: any) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {doc.clientName}
                        </h3>
                        <Badge className={statusColors[doc.status] || "bg-gray-100 text-gray-600"}>
                          {statusLabels[doc.status] || doc.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>CPF: {doc.clientCpf}</span>
                        {doc.vehiclePlate && <span>Placa: {doc.vehiclePlate}</span>}
                        {(doc.vehicleBrand || doc.vehicleModel) && (
                          <span>{doc.vehicleBrand} {doc.vehicleModel} {doc.vehicleYear}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Serviços badges */}
                        {doc.serviceTransferencia && (
                          <Badge variant="outline" className="text-xs">Transferência</Badge>
                        )}
                        {doc.serviceEmplacamento && (
                          <Badge variant="outline" className="text-xs">Emplacamento</Badge>
                        )}
                        {doc.serviceLicenciamento && (
                          <Badge variant="outline" className="text-xs">Licenciamento</Badge>
                        )}
                        {doc.serviceCartorio && (
                          <Badge className={cartorioStatusColors[doc.cartorioStatus] || "bg-gray-100"}>
                            Cartório: {cartorioStatusLabels[doc.cartorioStatus]}
                          </Badge>
                        )}
                        {doc.sentViaWhatsapp && (
                          <span className="text-green-600 text-xs flex items-center gap-1">
                            <MessageCircle size={12} /> WhatsApp enviado
                          </span>
                        )}
                        {doc.sentViaEmail && (
                          <span className="text-blue-600 text-xs flex items-center gap-1">
                            <Mail size={12} /> E-mail enviado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendWhatsapp(doc.id)}
                        title="Enviar via WhatsApp"
                        className="min-h-[40px] min-w-[40px]"
                      >
                        <MessageCircle size={16} className="text-green-600" />
                      </Button>
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setDetailId(doc.id); setDetailDialogOpen(true); }}
                        title="Ver detalhes"
                        className="min-h-[40px] min-w-[40px]"
                      >
                        <Eye size={16} />
                      </Button>
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(doc)}
                        title="Editar"
                        className="min-h-[40px] min-w-[40px]"
                      >
                        <Edit size={16} />
                      </Button>

                      {/* Status selector */}
                      <Select
                        value={doc.status}
                        onValueChange={(v) => handleStatusChange(doc.id, v)}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="documentos_coletados">Docs Coletados</SelectItem>
                          <SelectItem value="em_processamento">Em Processamento</SelectItem>
                          <SelectItem value="cartorio">No Cartório</SelectItem>
                          <SelectItem value="detran">No Detran</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Cartório status */}
                      <Select
                        value={doc.cartorioStatus}
                        onValueChange={(v) => handleCartorioChange(doc.id, v)}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao_necessario">Cartório: N/A</SelectItem>
                          <SelectItem value="pendente">Cartório: Pendente</SelectItem>
                          <SelectItem value="enviado">Cartório: Enviado</SelectItem>
                          <SelectItem value="registrado">Cartório: Registrado</SelectItem>
                          <SelectItem value="rejeitado">Cartório: Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>

                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        title="Excluir"
                        className="min-h-[40px] min-w-[40px]"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro #{detailId}</DialogTitle>
          </DialogHeader>
          {detailDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Cliente</p>
                  <p className="font-medium">{detailDoc.clientName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">CPF</p>
                  <p className="font-medium">{detailDoc.clientCpf}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Telefone</p>
                  <p className="font-medium">{detailDoc.clientPhone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">E-mail</p>
                  <p className="font-medium">{detailDoc.clientEmail || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Placa</p>
                  <p className="font-medium">{detailDoc.vehiclePlate || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Veículo</p>
                  <p className="font-medium">{detailDoc.vehicleBrand} {detailDoc.vehicleModel} {detailDoc.vehicleYear}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Documentos</p>
                <div className="flex flex-wrap gap-1">
                  {detailDoc.docRg && <Badge variant="outline">RG</Badge>}
                  {detailDoc.docCpf && <Badge variant="outline">CPF</Badge>}
                  {detailDoc.docComprovanteResidencia && <Badge variant="outline">Residência</Badge>}
                  {detailDoc.docCnh && <Badge variant="outline">CNH</Badge>}
                  {detailDoc.docCertificadoNascimento && <Badge variant="outline">Certidão</Badge>}
                  {detailDoc.docComprovantePagamento && <Badge variant="outline">Pagamento</Badge>}
                  {detailDoc.docPoderJuridica && <Badge variant="outline">Procuração</Badge>}
                  {detailDoc.docDut && <Badge variant="outline">DUT</Badge>}
                  {detailDoc.docOutro && <Badge variant="outline">{detailDoc.docOutro}</Badge>}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Serviços</p>
                <div className="flex flex-wrap gap-1">
                  {detailDoc.serviceTransferencia && <Badge>Transferência</Badge>}
                  {detailDoc.serviceEmplacamento && <Badge>Emplacamento</Badge>}
                  {detailDoc.serviceLicenciamento && <Badge>Licenciamento</Badge>}
                  {detailDoc.serviceCrvCrlv && <Badge>CRV/CRLV</Badge>}
                  {detailDoc.serviceCartorio && <Badge variant="destructive">Cartório</Badge>}
                  {detailDoc.serviceReconhecimentoFirma && <Badge>Reconh. Firma</Badge>}
                </div>
              </div>

              {detailDoc.observations && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Observações</p>
                  <p className="text-sm bg-slate-50 p-3 rounded-lg">{detailDoc.observations}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                {detailDoc.clientPhone && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 gap-2 min-h-[44px] w-full"
                    onClick={() => handleSendWhatsapp(detailDoc.id)}
                  >
                    <MessageCircle size={14} /> Enviar WhatsApp
                  </Button>
                )}
                {detailDoc.clientEmail && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 min-h-[44px] w-full"
                    onClick={() => {
                      // Compose email with documents list
                      const subject = `Trmotors - Documentos para Despachante - ${detailDoc.clientName}`;
                      let body = `Olá ${detailDoc.clientName}!\n\n`;
                      body += `Trmotors - Documentos para Despachante\n\n`;
                      body += `Solicitação: ${detailDoc.id}\n`;
                      body += `Placa: ${detailDoc.vehiclePlate || "N/I"}\n`;
                      body += `Veículo: ${detailDoc.vehicleBrand || ""} ${detailDoc.vehicleModel || ""} ${detailDoc.vehicleYear || ""}\n\n`;
                      body += `Documentos necessários:\n`;
                      if (detailDoc.docRg) body += `- RG\n`;
                      if (detailDoc.docCpf) body += `- CPF\n`;
                      if (detailDoc.docComprovanteResidencia) body += `- Comprovante de Residência\n`;
                      if (detailDoc.docCnh) body += `- CNH\n`;
                      if (detailDoc.docCertificadoNascimento) body += `- Certidão de Nascimento/Casamento\n`;
                      if (detailDoc.docComprovantePagamento) body += `- Comprovante de Pagamento\n`;
                      if (detailDoc.docPoderJuridica) body += `- Procuração/Assinatura\n`;
                      if (detailDoc.docDut) body += `- DUT\n`;
                      if (detailDoc.observations) body += `\nObservações:\n${detailDoc.observations}`;

                      window.open(
                        `mailto:${detailDoc.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
                        "_blank"
                      );
                    }}
                  >
                    <Mail size={14} /> Enviar E-mail
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
