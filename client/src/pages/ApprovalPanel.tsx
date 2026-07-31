import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ChecklistValidation } from "@/components/ChecklistValidation";
import { ApprovalHistoryTimeline } from "@/components/ApprovalHistoryTimeline";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  LogOut,
  AlertCircle,
  FileCheck,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { DEPARTMENT_STATUS_LABELS, DEPARTMENT_STATUS_COLORS, type DepartmentStatus } from "@shared/saleStatus";

export default function ApprovalPanel() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [expandedChecklistId, setExpandedChecklistId] = useState<number | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: sales = [], isLoading } = trpc.sales.listAllSales.useQuery();

  // Filter sales pending for the current department
  const filteredSales = sales.filter((sale: any) => {
    if (user?.role === "financeiro") {
      return sale.financialStatus === "pending";
    }
    if (user?.role === "administrativo") {
      return sale.adminStatus === "pending";
    }
    return false;
  });

  // Also show completed sales for context
  const completedSales = sales.filter((sale: any) => {
    if (user?.role === "financeiro") {
      return sale.financialStatus !== "pending";
    }
    if (user?.role === "administrativo") {
      return sale.adminStatus !== "pending";
    }
    return false;
  });

  const approveSaleFinancialMutation =
    trpc.sales.approveSaleFinancial.useMutation({
      onSuccess: () => {
        toast.success("Venda aprovada na etapa financeira!");
        utils.sales.listAllSales.invalidate();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const rejectSaleFinancialMutation =
    trpc.sales.rejectSaleFinancial.useMutation({
      onSuccess: () => {
        toast.success("Venda rejeitada na etapa financeira!");
        setRejectionReason("");
        setIsRejectDialogOpen(false);
        setSelectedSaleId(null);
        utils.sales.listAllSales.invalidate();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const approveSaleAdminMutation =
    trpc.sales.approveSaleAdmin.useMutation({
      onSuccess: () => {
        toast.success("Venda aprovada pelo administrativo!");
        utils.sales.listAllSales.invalidate();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const rejectSaleAdminMutation = trpc.sales.rejectSaleAdmin.useMutation({
    onSuccess: () => {
      toast.success("Venda rejeitada na etapa administrativa!");
      setRejectionReason("");
      setIsRejectDialogOpen(false);
      setSelectedSaleId(null);
      utils.sales.listAllSales.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleApprove = async (saleId: number) => {
    if (user?.role === "financeiro") {
      await approveSaleFinancialMutation.mutateAsync({ saleId });
    } else if (user?.role === "administrativo") {
      await approveSaleAdminMutation.mutateAsync({ saleId });
    }
  };

  const handleReject = async () => {
    if (!selectedSaleId || !rejectionReason) {
      toast.error("Preencha o motivo da rejeição");
      return;
    }

    if (user?.role === "financeiro") {
      await rejectSaleFinancialMutation.mutateAsync({
        saleId: selectedSaleId,
        reason: rejectionReason,
      });
    } else if (user?.role === "administrativo") {
      await rejectSaleAdminMutation.mutateAsync({
        saleId: selectedSaleId,
        reason: rejectionReason,
      });
    }
  };

  const getPanelTitle = () => {
    if (user?.role === "financeiro") {
      return "Painel de Análise Financeira";
    }
    return "Painel de Liberação Administrativa";
  };

  const getPanelDescription = () => {
    if (user?.role === "financeiro") {
      return "Revise e aprove ou rejeite os registros de venda";
    }
    return "Libere os registros para entrega ou rejeite";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {getPanelTitle()}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">{getPanelDescription()}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{filteredSales.length}</p>
                  <p className="text-xs text-slate-500">Pendentes</p>
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
                  <p className="text-2xl font-bold text-slate-900">
                    {completedSales.filter((s: any) =>
                      user?.role === "financeiro" ? s.financialStatus === "approved" : s.adminStatus === "approved"
                    ).length}
                  </p>
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
                  <p className="text-2xl font-bold text-slate-900">
                    {completedSales.filter((s: any) =>
                      user?.role === "financeiro" ? s.financialStatus === "rejected" : s.adminStatus === "rejected"
                    ).length}
                  </p>
                  <p className="text-xs text-slate-500">Rejeitadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas Pendentes</CardTitle>
            <CardDescription>
              {user?.role === "financeiro"
                ? "Registros aguardando análise financeira"
                : "Registros aguardando liberação administrativa"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : filteredSales.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma venda pendente no momento
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead className="hidden md:table-cell">Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale: any) => (
                      <React.Fragment key={sale.id}>
                        <TableRow className="hover:bg-slate-50">
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
                          <TableCell className="hidden md:table-cell">
                            {sale.vehiclePrice
                              ? `R$ ${parseFloat(sale.vehiclePrice).toLocaleString(
                                  "pt-BR",
                                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                )}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className={DEPARTMENT_STATUS_COLORS[sale.financialStatus as DepartmentStatus]}>
                                Financeiro: {DEPARTMENT_STATUS_LABELS[sale.financialStatus as DepartmentStatus]}
                              </Badge>
                              <Badge className={DEPARTMENT_STATUS_COLORS[sale.adminStatus as DepartmentStatus]}>
                                Administrativo: {DEPARTMENT_STATUS_LABELS[sale.adminStatus as DepartmentStatus]}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-slate-500">
                            {formatDate(sale.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
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
                                <Eye className="h-4 w-4" />
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
                                <FileCheck className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(sale.id)}
                                disabled={approveSaleFinancialMutation.isPending || approveSaleAdminMutation.isPending}
                                className="gap-1 bg-green-600 hover:bg-green-700 h-8"
                              >
                                {approveSaleFinancialMutation.isPending || approveSaleAdminMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                <span className="hidden sm:inline">Aprovar</span>
                              </Button>

                              <Dialog
                                open={isRejectDialogOpen && selectedSaleId === sale.id}
                                onOpenChange={(open) => {
                                  setIsRejectDialogOpen(open);
                                  if (open) setSelectedSaleId(sale.id);
                                  else setRejectionReason("");
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="gap-1 h-8"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    <span className="hidden sm:inline">Rejeitar</span>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Rejeitar Venda</DialogTitle>
                                    <DialogDescription>
                                      Explique o motivo da rejeição para {sale.customerName}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="reason">Motivo da Rejeição *</Label>
                                      <Textarea
                                        id="reason"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Descreva o motivo da rejeição..."
                                        rows={4}
                                      />
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setIsRejectDialogOpen(false);
                                          setRejectionReason("");
                                        }}
                                      >
                                        Cancelar
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={handleReject}
                                        disabled={
                                          rejectSaleFinancialMutation.isPending ||
                                          rejectSaleAdminMutation.isPending ||
                                          !rejectionReason
                                        }
                                      >
                                        {rejectSaleFinancialMutation.isPending ||
                                        rejectSaleAdminMutation.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Rejeitando...
                                          </>
                                        ) : (
                                          "Confirmar Rejeição"
                                        )}
                                      </Button>
                                    </DialogFooter>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedHistoryId === sale.id && (
                          <TableRow key={`history-${sale.id}`}>
                            <TableCell colSpan={6} className="bg-slate-50 p-4">
                              <ApprovalHistoryTimeline saleId={sale.id} />
                            </TableCell>
                          </TableRow>
                        )}
                        {expandedChecklistId === sale.id && (
                          <TableRow key={`checklist-${sale.id}`}>
                            <TableCell colSpan={6} className="bg-slate-50 p-4">
                              <ChecklistValidation
                                saleRecordId={sale.id}
                                userRole={user?.role as "financeiro" | "administrativo"}
                              />
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

        {/* Completed Sales */}
        {completedSales.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vendas Processadas</CardTitle>
              <CardDescription>
                Histórico de vendas já analisadas pelo seu setor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Status Final</TableHead>
                      <TableHead className="hidden sm:table-cell">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedSales.map((sale: any) => {
                      const status = user?.role === "financeiro" ? sale.financialStatus : sale.adminStatus;
                      return (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">{sale.customerName}</TableCell>
                          <TableCell>{sale.vehicleModel}</TableCell>
                          <TableCell>
                            <Badge className={DEPARTMENT_STATUS_COLORS[status as DepartmentStatus]}>
                              {DEPARTMENT_STATUS_LABELS[status as DepartmentStatus]}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-slate-500">
                            {formatDate(sale.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

import React from "react";
import { Clock } from "lucide-react";
