import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Card, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Camera, Receipt, Check, X, Clock, Trash2, ScanLine,
  TrendingUp, DollarSign, ArrowLeft, Plus,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Combustível", "Alimentação", "Pedágio", "Material",
  "Veículo", "Manutenção", "Escritório", "Outros",
];

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-amber-50 text-amber-700 border-amber-200",
  aprovado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejeitado: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_DOT: Record<string, string> = {
  pendente: "bg-amber-500",
  aprovado: "bg-emerald-500",
  rejeitado: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

type TabKey = "todas" | "pendentes" | "aprovadas";

export default function ExpensesPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("todas");
  const [createOpen, setCreateOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeName: user?.name || "",
    category: "Geral",
    description: "",
    amount: "",
    receiptDate: new Date().toISOString().split("T")[0],
    notes: "",
    supplier: "",
    cnpj: "",
  });

  // Queries
  const isRH = user?.role === "rh" || user?.role === "admin" || user?.role === "financeiro";
  const expensesQuery = trpc.expenses.list.useQuery(undefined, { enabled: isRH });
  const myExpensesQuery = trpc.expenses.listMy.useQuery(undefined, { enabled: !isRH });
  const summaryQuery = trpc.expenses.summary.useQuery(undefined, {
    refetchInterval: 10000,
  });

  // Mutations
  const createMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      toast.success("Despesa enviada com sucesso!");
      setCreateOpen(false);
      setPreviewImage(null);
      setFormData({
        employeeName: user?.name || "",
        category: "Geral",
        description: "",
        amount: "",
        receiptDate: new Date().toISOString().split("T")[0],
        notes: "",
        supplier: "",
        cnpj: "",
      });
      summaryQuery.refetch();
      expensesQuery.refetch();
      myExpensesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatusMutation = trpc.expenses.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      summaryQuery.refetch();
      expensesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      toast.success("Despesa removida!");
      summaryQuery.refetch();
      expensesQuery.refetch();
    },
  });

  const extractMutation = trpc.expenses.extractFromPhoto.useMutation({
    onSuccess: (data) => {
      setExtracting(false);
      if (data.amount) setFormData(f => ({ ...f, amount: String(data.amount) }));
      if (data.category) setFormData(f => ({ ...f, category: data.category }));
      if (data.description) setFormData(f => ({ ...f, description: data.description }));
      if (data.supplier) setFormData(f => ({ ...f, supplier: data.supplier }));
      if (data.cnpj) setFormData(f => ({ ...f, cnpj: data.cnpj }));
      if (data.date) setFormData(f => ({ ...f, receiptDate: data.date }));
      if (data.notes) setFormData(f => ({ ...f, notes: data.notes }));
      toast.success("Dados extraídos da nota! Confira e ajuste se necessário.");
    },
    onError: (err) => {
      setExtracting(false);
      toast.error("Erro ao extrair dados: " + err.message);
    },
  });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewImage(dataUrl);
      setExtracting(true);
      extractMutation.mutate({ imageDataUrl: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!formData.employeeName.trim()) {
      toast.error("Nome do funcionário é obrigatório");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Informe o valor da despesa");
      return;
    }
    const description = formData.supplier
      ? `${formData.description || formData.category} - ${formData.supplier}${formData.cnpj ? ` (${formData.cnpj})` : ""}`
      : formData.description || formData.category;
    createMutation.mutate({
      employeeName: formData.employeeName,
      category: formData.category,
      description,
      amount: parseFloat(formData.amount),
      receiptDate: formData.receiptDate,
      notes: formData.notes,
      photoUrl: previewImage || undefined,
      photoFilename: `despesa_${Date.now()}.jpg`,
      photoMimeType: "image/jpeg",
    });
  };

  const expenses = isRH ? (expensesQuery.data || []) : (myExpensesQuery.data || []);
  const summary = summaryQuery.data;

  const formatBRL = (val: string | number) => {
    const n = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
  };

  const formatDate = (d: string | Date | null) => {
    if (!d) return "-";
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR");
  };

  // Filter expenses by tab
  const filteredExpenses = activeTab === "pendentes"
    ? expenses.filter(e => e.status === "pendente")
    : activeTab === "aprovadas"
    ? expenses.filter(e => e.status === "aprovado")
    : expenses;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "todas", label: isRH ? "Todas Despesas" : "Minhas Despesas", count: expenses.length },
    { key: "pendentes", label: "Pendentes", count: expenses.filter(e => e.status === "pendente").length },
    { key: "aprovadas", label: "Aprovadas", count: expenses.filter(e => e.status === "aprovado").length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation("/dashboard")}
                className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                  Controle de Despesas
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">
                  Tire foto da NF → Extração automática → Controle
                </p>
              </div>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nova Despesa</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-gray-900">
                    <Receipt className="h-5 w-5 text-red-600" />
                    Nova Despesa
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Photo Capture */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Foto da NF / Cupom</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhoto}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                        previewImage
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300 hover:border-red-400 hover:bg-red-50"
                      )}
                    >
                      {previewImage ? (
                        <div className="space-y-2">
                          <img src={previewImage} alt="NF" className="max-h-40 mx-auto rounded-lg shadow" />
                          <p className="text-sm text-red-600 font-medium">Foto carregada - dados extraídos</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Camera className="h-10 w-10 mx-auto text-gray-400" />
                          <p className="text-sm text-gray-500">Toque para tirar foto da NF</p>
                          <p className="text-xs text-gray-400">Os dados serão extraídos automaticamente</p>
                        </div>
                      )}
                    </div>
                    {extracting && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <ScanLine className="h-4 w-4 animate-pulse" />
                        Extraindo dados da nota...
                      </div>
                    )}
                  </div>
                  {/* Employee Name */}
                  <div>
                    <Label>Nome do Funcionário</Label>
                    <Input
                      value={formData.employeeName}
                      onChange={e => setFormData(f => ({ ...f, employeeName: e.target.value }))}
                      placeholder="Ex: Tiago Silva"
                    />
                  </div>
                  {/* Amount + Category side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <Select value={formData.category} onValueChange={v => setFormData(f => ({ ...f, category: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Date */}
                  <div>
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={formData.receiptDate}
                      onChange={e => setFormData(f => ({ ...f, receiptDate: e.target.value }))}
                    />
                  </div>
                  {/* Description */}
                  <div>
                    <Label>Descrição / Itens</Label>
                    <Textarea
                      value={formData.description}
                      onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                      placeholder="Itens da nota..."
                      rows={2}
                    />
                  </div>
                  {/* Supplier + CNPJ side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Fornecedor</Label>
                      <Input
                        value={formData.supplier}
                        onChange={e => setFormData(f => ({ ...f, supplier: e.target.value }))}
                        placeholder="Estabelecimento"
                      />
                    </div>
                    <div>
                      <Label>CNPJ</Label>
                      <Input
                        value={formData.cnpj}
                        onChange={e => setFormData(f => ({ ...f, cnpj: e.target.value }))}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>
                  {/* Notes */}
                  <div>
                    <Label>Observações</Label>
                    <Input
                      value={formData.notes}
                      onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Observações (opcional)"
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                    className="w-full bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
                  >
                    {createMutation.isPending ? "Enviando..." : "Enviar Despesa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Summary Cards - Clean minimal style */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Total Geral</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatBRL(summary.total)}</p>
            </div>
            {/* Pending */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Pendentes</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatBRL(summary.totalPending)}</p>
              <p className="text-xs text-amber-600 mt-0.5">{summary.pendingCount} aguardando</p>
            </div>
            {/* Approved */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Aprovados</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatBRL(summary.totalApproved)}</p>
              <p className="text-xs text-emerald-600 mt-0.5">{summary.approvedCount} aprovados</p>
            </div>
            {/* Rejected */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <X className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">Rejeitados</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatBRL(summary.totalRejected)}</p>
              <p className="text-xs text-red-600 mt-0.5">{summary.rejectedCount} rejeitados</p>
            </div>
          </div>
        )}

        {/* Category Breakdown - Compact */}
        {summary && Object.keys(summary.byCategory).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Por Categoria</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byCategory).map(([cat, val]) => (
                <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                  <span className="font-medium text-gray-700">{cat}</span>
                  <span className="text-gray-400">·</span>
                  <span className="font-semibold text-gray-900">{formatBRL(val)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Segmented Control Tabs */}
        <div className="bg-gray-100 rounded-xl p-1 inline-flex gap-1 w-full sm:w-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "ml-2 text-xs px-1.5 py-0.5 rounded-full",
                  activeTab === tab.key
                    ? "bg-gray-100 text-gray-600"
                    : "bg-gray-200 text-gray-500"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Expenses List / Empty State */}
        {filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 px-4">
            <div className="h-16 w-16 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">Nenhuma despesa registrada</p>
            <p className="text-sm text-gray-300 mt-1">Clique em "Nova Despesa" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map(exp => (
              <div
                key={exp.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Top row: name + status */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold text-sm text-gray-900">{exp.employeeName}</span>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", STATUS_COLORS[exp.status])}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[exp.status])} />
                          {STATUS_LABELS[exp.status]}
                        </span>
                      </div>
                      {/* Category + description */}
                      <p className="text-sm text-gray-500 truncate">
                        {exp.category} — {exp.description || "Sem descrição"}
                      </p>
                      {/* Date + supplier */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-400">{formatDate(exp.receiptDate)}</span>
                        {exp.notes && (
                          <span className="text-xs text-gray-400 truncate">{exp.notes}</span>
                        )}
                      </div>
                    </div>
                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">{formatBRL(exp.amount)}</p>
                    </div>
                  </div>

                  {/* Photo thumbnail */}
                  {exp.photoUrl && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <img
                        src={exp.photoUrl}
                        alt="NF"
                        className="h-16 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition"
                        onClick={() => exp.photoUrl && window.open(exp.photoUrl, "_blank")}
                      />
                    </div>
                  )}

                  {/* RH Actions */}
                  {isRH && exp.status === "pendente" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                        onClick={() => updateStatusMutation.mutate({ id: exp.id, status: "aprovado" })}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300"
                        onClick={() => updateStatusMutation.mutate({ id: exp.id, status: "rejeitado" })}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-gray-700"
                        onClick={() => {
                          if (confirm("Remover despesa?")) deleteMutation.mutate({ id: exp.id });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
