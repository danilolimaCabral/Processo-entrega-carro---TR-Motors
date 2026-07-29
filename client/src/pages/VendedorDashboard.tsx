import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ChecklistForm } from "@/components/ChecklistForm";
import { ApprovalHistoryTimeline } from "@/components/ApprovalHistoryTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Plus,
  Copy,
  FileUp,
  LogOut,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  pending_financial: "Análise Financeira",
  approved_financial: "Financeiro Aprovado",
  rejected_financial: "Rejeitado (Financeiro)",
  pending_admin: "Liberação Administrativa",
  approved_admin: "Administrativo Aprovado",
  rejected_admin: "Rejeitado (Administrativo)",
  ready_for_delivery: "Pronto para Entrega",
};

const STATUS_COLORS: Record<string, string> = {
  pending_financial: "bg-yellow-100 text-yellow-800",
  approved_financial: "bg-green-100 text-green-800",
  rejected_financial: "bg-red-100 text-red-800",
  pending_admin: "bg-yellow-100 text-yellow-800",
  approved_admin: "bg-green-100 text-green-800",
  rejected_admin: "bg-red-100 text-red-800",
  ready_for_delivery: "bg-blue-100 text-blue-800",
};

export default function VendedorDashboard() {
  const { logout } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [expandedChecklistId, setExpandedChecklistId] = useState<number | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerContact: "",
    vehicleModel: "",
    vehicleYear: "",
    vehiclePlate: "",
    vehicleKm: "",
    vehiclePrice: "",
  });

  const [documentType, setDocumentType] = useState<"cartorio" | "payment">(
    "cartorio"
  );

  const utils = trpc.useUtils();
  const { data: sales = [], isLoading } = trpc.sales.listMySales.useQuery();

  const createSaleMutation = trpc.sales.createSale.useMutation({
    onSuccess: (data) => {
      toast.success("Venda criada com sucesso!");
      toast.info(`Link de acompanhamento copiado: ${data.publicToken}`);
      setFormData({
        customerName: "",
        customerContact: "",
        vehicleModel: "",
        vehicleYear: "",
        vehiclePlate: "",
        vehicleKm: "",
        vehiclePrice: "",
      });
      setIsCreateDialogOpen(false);
      utils.sales.listMySales.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const uploadDocumentMutation = trpc.sales.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado com sucesso!");
      setIsDocumentDialogOpen(false);
      setSelectedSaleId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.vehicleModel) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    await createSaleMutation.mutateAsync({
      customerName: formData.customerName,
      customerContact: formData.customerContact || undefined,
      vehicleModel: formData.vehicleModel,
      vehicleYear: formData.vehicleYear ? parseInt(formData.vehicleYear) : undefined,
      vehiclePlate: formData.vehiclePlate || undefined,
      vehicleKm: formData.vehicleKm ? parseInt(formData.vehicleKm) : undefined,
      vehiclePrice: formData.vehiclePrice || undefined,
    });
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0] || !selectedSaleId) {
      toast.error("Selecione um arquivo");
      return;
    }

    const file = fileInputRef.current.files[0];
    if (!file.name.endsWith(".pdf")) {
      toast.error("Apenas arquivos PDF são permitidos");
      return;
    }

    const buffer = await file.arrayBuffer();
    await uploadDocumentMutation.mutateAsync({
      saleId: selectedSaleId,
      documentType,
      filename: file.name,
      fileData: new Uint8Array(buffer) as any,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/processo/${text}`
    );
    toast.success("Link copiado para a área de transferência!");
  };

  const getStatusIcon = (status: string) => {
    if (status.includes("approved") || status === "ready_for_delivery") {
      return <CheckCircle2 className="h-4 w-4" />;
    }
    if (status.includes("rejected")) {
      return <XCircle className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Dashboard de Vendas
            </h1>
            <p className="text-slate-600 mt-1">
              Gerencie seus registros de venda e documentos
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => logout()}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        {/* Create Sale Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Venda</DialogTitle>
              <DialogDescription>
                Preencha os dados do cliente e veículo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSale} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nome do Cliente *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  placeholder="João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerContact">Contato</Label>
                <Input
                  id="customerContact"
                  value={formData.customerContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customerContact: e.target.value,
                    })
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleModel">Modelo do Veículo *</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleModel: e.target.value })
                  }
                  placeholder="Honda Civic"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleYear">Ano</Label>
                  <Input
                    id="vehicleYear"
                    type="number"
                    value={formData.vehicleYear}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleYear: e.target.value })
                    }
                    placeholder="2023"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehiclePlate">Placa</Label>
                  <Input
                    id="vehiclePlate"
                    value={formData.vehiclePlate}
                    onChange={(e) =>
                      setFormData({ ...formData, vehiclePlate: e.target.value })
                    }
                    placeholder="ABC1D23"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleKm">Km</Label>
                  <Input
                    id="vehicleKm"
                    type="number"
                    value={formData.vehicleKm}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleKm: e.target.value })
                    }
                    placeholder="30000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehiclePrice">Preço</Label>
                  <Input
                    id="vehiclePrice"
                    type="number"
                    step="0.01"
                    value={formData.vehiclePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, vehiclePrice: e.target.value })
                    }
                    placeholder="50000.00"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createSaleMutation.isPending}
              >
                {createSaleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Venda"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Minhas Vendas</CardTitle>
            <CardDescription>
              Lista de todos os seus registros de venda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : sales.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma venda registrada ainda
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale: any) => (
                      <React.Fragment key={sale.id}>
                        <TableRow>
                          <TableCell className="font-medium">
                            {sale.customerName}
                          </TableCell>
                          <TableCell>
                            {sale.vehicleModel}
                            {sale.vehicleYear && ` (${sale.vehicleYear})`}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[sale.status]}>
                              <span className="mr-1">
                                {getStatusIcon(sale.status)}
                              </span>
                              {STATUS_LABELS[sale.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(sale.createdAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(sale.publicToken)
                              }
                              className="gap-1"
                            >
                              <Copy className="h-3 w-3" />
                              Copiar Link
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setExpandedHistoryId(
                                  expandedHistoryId === sale.id ? null : sale.id
                                )
                              }
                              className="gap-1"
                            >
                              Histórico
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setExpandedChecklistId(
                                  expandedChecklistId === sale.id ? null : sale.id
                                )
                              }
                              className="gap-1"
                            >
                              Checklist
                            </Button>

                            <Dialog
                              open={
                                isDocumentDialogOpen &&
                                selectedSaleId === sale.id
                              }
                              onOpenChange={(open) => {
                                setIsDocumentDialogOpen(open);
                                if (open) setSelectedSaleId(sale.id);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                >
                                  <FileUp className="h-3 w-3" />
                                  Upload
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Enviar Documento</DialogTitle>
                                  <DialogDescription>
                                    Envie documentos de cartório ou comprovante de
                                    pagamento
                                  </DialogDescription>
                                </DialogHeader>
                                <form
                                  onSubmit={handleUploadDocument}
                                  className="space-y-4"
                                >
                                  <div className="space-y-2">
                                    <Label htmlFor="docType">
                                      Tipo de Documento
                                    </Label>
                                    <select
                                      id="docType"
                                      value={documentType}
                                      onChange={(e) =>
                                        setDocumentType(
                                          e.target.value as "cartorio" | "payment"
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                                    >
                                      <option value="cartorio">
                                        Documentação de Cartório
                                      </option>
                                      <option value="payment">
                                        Comprovante de Pagamento
                                      </option>
                                    </select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="file">Arquivo PDF</Label>
                                    <input
                                      id="file"
                                      ref={fileInputRef}
                                      type="file"
                                      accept=".pdf"
                                      className="w-full"
                                    />
                                  </div>

                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        setIsDocumentDialogOpen(false)
                                      }
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={uploadDocumentMutation.isPending}
                                    >
                                      {uploadDocumentMutation.isPending ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Enviando...
                                        </>
                                      ) : (
                                        "Enviar"
                                      )}
                                    </Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                        {expandedHistoryId === sale.id && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-slate-50">
                              <ApprovalHistoryTimeline saleId={sale.id} />
                            </TableCell>
                          </TableRow>
                        )}
                        {expandedChecklistId === sale.id && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-slate-50">
                              <ChecklistForm saleRecordId={sale.id} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React from "react";
