import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
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
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Plus,
  FileUp,
  LogOut,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Car,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getOverallSaleStatus,
  OVERALL_STATUS_LABELS,
  OVERALL_STATUS_COLORS,
  DEPARTMENT_STATUS_LABELS,
  DEPARTMENT_STATUS_COLORS,
  type DepartmentStatus,
} from "@shared/saleStatus";

export default function VendedorDashboard() {
  const { logout } = useAuth();
  const [, navigate] = useLocation();
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [saleFormStep, setSaleFormStep] = useState(1);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [expandedChecklistId, setExpandedChecklistId] = useState<number | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const [activeRowId, setActiveRowId] = useState<number | null>(null);
  const [lastCreatedToken, setLastCreatedToken] = useState<string | null>(null);
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
      setLastCreatedToken(data.publicToken);
      setFormData({
        customerName: "",
        customerContact: "",
        vehicleModel: "",
        vehicleYear: "",
        vehiclePlate: "",
        vehicleKm: "",
        vehiclePrice: "",
      });
      setSaleFormStep(1);
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

  const SALE_FORM_STEPS = ["Dados do Cliente", "Dados do Veículo", "Valores da Venda"];

  const canAdvanceSaleFormStep = (step: number) => {
    if (step === 1) return formData.customerName.trim().length > 0;
    if (step === 2) return formData.vehicleModel.trim().length > 0;
    return true;
  };

  const handleNextSaleFormStep = () => {
    if (!canAdvanceSaleFormStep(saleFormStep)) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setSaleFormStep((s) => Math.min(s + 1, SALE_FORM_STEPS.length));
  };

  const handlePrevSaleFormStep = () => {
    setSaleFormStep((s) => Math.max(s - 1, 1));
  };

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

  const getStatusIcon = (status: "pending_review" | "rejected" | "ready_for_delivery") => {
    if (status === "ready_for_delivery") {
      return <CheckCircle2 className="h-4 w-4" />;
    }
    if (status === "rejected") {
      return <XCircle className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  // Stats
  const pendingCount = sales.filter((s: any) => {
    const overall = getOverallSaleStatus(s.financialStatus, s.adminStatus);
    return overall === "pending_review";
  }).length;
  const readyCount = sales.filter((s: any) => {
    const overall = getOverallSaleStatus(s.financialStatus, s.adminStatus);
    return overall === "ready_for_delivery";
  }).length;
  const rejectedCount = sales.filter((s: any) => {
    const overall = getOverallSaleStatus(s.financialStatus, s.adminStatus);
    return overall === "rejected";
  }).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Car className="h-7 w-7 text-slate-700" />
              Dashboard de Vendas
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Gerencie seus registros de venda e documentos
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                  <p className="text-xs text-slate-500">Em Análise</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{readyCount}</p>
                  <p className="text-xs text-slate-500">Aprovadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{rejectedCount}</p>
                  <p className="text-xs text-slate-500">Rejeitadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Sale Button */}
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setSaleFormStep(1);
              setLastCreatedToken(null);
            }
          }}
        >
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

            {/* Show token after creation */}
            {lastCreatedToken && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="text-sm font-medium text-blue-800">Venda criada! Link de acompanhamento:</p>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-white px-3 py-2 rounded border border-blue-100 break-all">
                    {lastCreatedToken}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(lastCreatedToken);
                      toast.success("Token copiado!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step progress indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Etapa {saleFormStep} de {SALE_FORM_STEPS.length}
                </span>
                <span className="text-sm text-slate-500">
                  {SALE_FORM_STEPS[saleFormStep - 1]}
                </span>
              </div>
              <div className="flex gap-2">
                {SALE_FORM_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      index + 1 <= saleFormStep ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-4">
              {saleFormStep === 1 && (
                <>
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
                </>
              )}

              {saleFormStep === 2 && (
                <>
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
                </>
              )}

              {saleFormStep === 3 && (
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
              )}

              <div className="flex gap-2 pt-2">
                {saleFormStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handlePrevSaleFormStep}
                  >
                    Voltar
                  </Button>
                )}

                {saleFormStep < SALE_FORM_STEPS.length ? (
                  <Button
                    key="next-step-button"
                    type="button"
                    className="flex-1"
                    onClick={handleNextSaleFormStep}
                  >
                    Avançar
                  </Button>
                ) : (
                  <Button
                    key="submit-sale-button"
                    type="submit"
                    className="flex-1"
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
                )}
              </div>
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
                  Nenhuma venda registrada ainda. Clique em "Nova Venda" para começar.
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
                      <TableHead className="hidden sm:table-cell">Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale: any) => (
                      <React.Fragment key={sale.id}>
                        <TableRow
                          className={`group hover:bg-slate-50 ${
                            activeRowId === sale.id ? "bg-slate-50" : ""
                          }`}
                          onClick={() =>
                            setActiveRowId((prev) =>
                              prev === sale.id ? null : sale.id
                            )
                          }
                        >
                          <TableCell className="font-medium">
                            {sale.customerName}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sale.vehicleModel}</p>
                              {sale.vehicleYear && (
                                <p className="text-xs text-slate-500">({sale.vehicleYear})</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const overallStatus = getOverallSaleStatus(
                                sale.financialStatus,
                                sale.adminStatus
                              );
                              return (
                                <div className="space-y-1.5">
                                  <Badge className={OVERALL_STATUS_COLORS[overallStatus]}>
                                    <span className="mr-1">
                                      {getStatusIcon(overallStatus)}
                                    </span>
                                    {OVERALL_STATUS_LABELS[overallStatus]}
                                  </Badge>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline" className={`text-xs ${DEPARTMENT_STATUS_COLORS[sale.financialStatus as DepartmentStatus]}`}>
                                      Fin: {DEPARTMENT_STATUS_LABELS[sale.financialStatus as DepartmentStatus]}
                                    </Badge>
                                    <Badge variant="outline" className={`text-xs ${DEPARTMENT_STATUS_COLORS[sale.adminStatus as DepartmentStatus]}`}>
                                      Admin: {DEPARTMENT_STATUS_LABELS[sale.adminStatus as DepartmentStatus]}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <p className="text-xs text-slate-500">
                              {new Date(sale.createdAt).toLocaleDateString(
                                "pt-BR"
                              )}
                            </p>
                          </TableCell>
                          <TableCell
                            className={`text-right space-x-1 transition-opacity ${
                              activeRowId === sale.id
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedHistoryId(
                                  expandedHistoryId === sale.id ? null : sale.id
                                )
                              }
                              className="h-8 w-8 p-0"
                              title="Histórico"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedChecklistId(
                                  expandedChecklistId === sale.id ? null : sale.id
                                )
                              }
                              className="h-8 w-8 p-0"
                              title="Checklist"
                            >
                              <CheckCircle2 className="h-4 w-4" />
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
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Upload"
                                >
                                  <FileUp className="h-4 w-4" />
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
                          <TableRow key={`history-${sale.id}`}>
                            <TableCell colSpan={5} className="bg-slate-50 p-4">
                              <ApprovalHistoryTimeline saleId={sale.id} />
                            </TableCell>
                          </TableRow>
                        )}
                        {expandedChecklistId === sale.id && (
                          <TableRow key={`checklist-${sale.id}`}>
                            <TableCell colSpan={5} className="bg-slate-50 p-4">
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
    </DashboardLayout>
  );
}
