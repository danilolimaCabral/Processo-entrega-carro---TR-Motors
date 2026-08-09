import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Camera, Receipt, Check, X, Clock, Trash2, ScanLine, Upload,
  TrendingUp, AlertCircle, FileText, DollarSign,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Combustível", "Alimentação", "Pedágio", "Material",
  "Veículo", "Manutenção", "Escritório", "Outros",
];

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  aprovado: "bg-green-100 text-green-800 border-green-300",
  rejeitado: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pendente: <Clock className="h-3.5 w-3.5" />,
  aprovado: <Check className="h-3.5 w-3.5" />,
  rejeitado: <X className="h-3.5 w-3.5" />,
};

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export default function ExpensesPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("lista");
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
      // Auto-fill form with extracted data
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

  // Handle photo capture
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewImage(dataUrl);

      // Extract data from photo using OCR
      setExtracting(true);
      extractMutation.mutate({ imageDataUrl: dataUrl });
    };
    reader.readAsDataURL(file);
    // Reset input
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Controle de Despesas</h1>
          <p className="text-sm text-muted-foreground">
            Tire foto da NF → Extração automática → Controle
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white min-h-[44px] shadow-md">
              <Camera className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
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
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                  )}
                >
                  {previewImage ? (
                    <div className="space-y-2">
                      <img src={previewImage} alt="NF" className="max-h-40 mx-auto rounded-lg shadow" />
                      <p className="text-sm text-emerald-600 font-medium">✓ Foto carregada</p>
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

              {/* Amount */}
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

              {/* Category */}
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
                  rows={3}
                />
              </div>

              {/* Supplier */}
              <div>
                <Label>Fornecedor</Label>
                <Input
                  value={formData.supplier}
                  onChange={e => setFormData(f => ({ ...f, supplier: e.target.value }))}
                  placeholder="Nome do estabelecimento"
                />
              </div>

              {/* CNPJ */}
              <div>
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj}
                  onChange={e => setFormData(f => ({ ...f, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                />
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
              >
                {createMutation.isPending ? "Enviando..." : "Enviar Despesa"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-2 border-blue-100">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatBRL(summary.total)}</p>
                <p className="text-xs text-muted-foreground">Total Geral</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-yellow-100">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatBRL(summary.totalPending)}</p>
                <p className="text-xs text-muted-foreground">{summary.pendingCount} Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-100">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatBRL(summary.totalApproved)}</p>
                <p className="text-xs text-muted-foreground">{summary.approvedCount} Aprovados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-100">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatBRL(summary.totalRejected)}</p>
                <p className="text-xs text-muted-foreground">{summary.rejectedCount} Rejeitados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category breakdown */}
      {summary && Object.keys(summary.byCategory).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byCategory).map(([cat, val]) => (
                <Badge key={cat} variant="outline" className="py-1.5 px-3">
                  {cat}: {formatBRL(val)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto min-h-[48px]">
          <TabsTrigger value="lista" className="min-h-[40px]">
            {isRH ? "Todas" : "Minhas"} Despesas
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="min-h-[40px]">Pendentes</TabsTrigger>
          <TabsTrigger value="aprovadas" className="min-h-[40px]">Aprovadas</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-4">
          {expenses.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma despesa registrada</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {expenses.map(exp => (
                <Card key={exp.id} className={cn(
                  "border-2 transition-all",
                  exp.status === "pendente" && "border-yellow-200",
                  exp.status === "aprovado" && "border-green-200",
                  exp.status === "rejeitado" && "border-red-200",
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{exp.employeeName}</span>
                          <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[exp.status])}>
                            {STATUS_ICONS[exp.status]}
                            {STATUS_LABELS[exp.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {exp.category} — {exp.description || "Sem descrição"}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(exp.receiptDate)}
                          </span>
                          {exp.supplier && (
                            <span className="text-xs text-muted-foreground">
                              🏪 {exp.supplier}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">
                          {formatBRL(exp.amount)}
                        </p>
                      </div>
                    </div>

                    {/* Photo thumbnail */}
                    {exp.photoUrl && (
                      <div className="mt-2">
                        <img
                          src={exp.photoUrl}
                          alt="NF"
                          className="h-20 rounded-lg object-cover border"
                          onClick={() => window.open(exp.photoUrl, "_blank")}
                        />
                      </div>
                    )}

                    {/* RH Actions */}
                    {isRH && exp.status === "pendente" && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50 min-h-[36px]"
                          onClick={() => updateStatusMutation.mutate({ id: exp.id, status: "aprovado" })}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50 min-h-[36px]"
                          onClick={() => updateStatusMutation.mutate({ id: exp.id, status: "rejeitado" })}
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-500 min-h-[36px]"
                          onClick={() => {
                            if (confirm("Remover despesa?")) deleteMutation.mutate({ id: exp.id });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pendentes" className="mt-4">
          <ExpenseList
            expenses={expenses.filter(e => e.status === "pendente")}
            isRH={isRH}
            formatBRL={formatBRL}
            formatDate={formatDate}
            updateStatusMutation={updateStatusMutation}
            deleteMutation={deleteMutation}
          />
        </TabsContent>

        <TabsContent value="aprovadas" className="mt-4">
          <ExpenseList
            expenses={expenses.filter(e => e.status === "aprovado")}
            isRH={isRH}
            formatBRL={formatBRL}
            formatDate={formatDate}
            updateStatusMutation={updateStatusMutation}
            deleteMutation={deleteMutation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Shared expense list component
function ExpenseList({ expenses, isRH, formatBRL, formatDate, updateStatusMutation, deleteMutation }: {
  expenses: any[];
  isRH: boolean;
  formatBRL: (val: string | number) => string;
  formatDate: (d: string | Date | null) => string;
  updateStatusMutation: any;
  deleteMutation: any;
}) {
  if (expenses.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p>Nenhuma despesa encontrada</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map(exp => (
        <Card key={exp.id} className="border-2 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm">{exp.employeeName}</p>
                <p className="text-xs text-muted-foreground">{exp.category} — {exp.description || "-"}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(exp.receiptDate)}</p>
              </div>
              <p className="text-lg font-bold text-emerald-600">{formatBRL(exp.amount)}</p>
            </div>
            {exp.photoUrl && (
              <img src={exp.photoUrl} alt="NF" className="h-16 rounded mt-2 object-cover border"
                onClick={() => window.open(exp.photoUrl, "_blank")} />
            )}
            {isRH && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="text-green-600 border-green-300 min-h-[36px]"
                  onClick={() => updateStatusMutation.mutate({ id: exp.id, status: "aprovado" })}>
                  <Check className="h-3 w-3 mr-1" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-300 min-h-[36px]"
                  onClick={() => updateStatusMutation.mutate({ id: exp.id, status: "rejeitado" })}>
                  <X className="h-3 w-3 mr-1" /> Rejeitar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
