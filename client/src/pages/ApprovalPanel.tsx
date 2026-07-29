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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { DEPARTMENT_STATUS_LABELS, DEPARTMENT_STATUS_COLORS } from "@shared/saleStatus";

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

  // Each department reviews independently and in parallel: a sale shows up
  // for financeiro as soon as financialStatus is pending, regardless of
  // adminStatus, and vice-versa.
  const filteredSales = sales.filter((sale: any) => {
    if (user?.role === "financeiro") {
      return sale.financialStatus === "pending";
    }
    if (user?.role === "administrativo") {
      return sale.adminStatus === "pending";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {getPanelTitle()}
            </h1>
            <p className="text-slate-600 mt-1">{getPanelDescription()}</p>
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

        {/* Sales Table */}
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
                      <TableHead>Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale: any) => (
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
                            {sale.vehiclePrice
                              ? `R$ ${parseFloat(sale.vehiclePrice).toLocaleString(
                                  "pt-BR",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className={DEPARTMENT_STATUS_COLORS[sale.financialStatus]}>
                                Financeiro: {DEPARTMENT_STATUS_LABELS[sale.financialStatus]}
                              </Badge>
                              <Badge className={DEPARTMENT_STATUS_COLORS[sale.adminStatus]}>
                                Administrativo: {DEPARTMENT_STATUS_LABELS[sale.adminStatus]}
                              </Badge>
                            </div>
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

                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(sale.id)}
                              disabled={approveSaleFinancialMutation.isPending || approveSaleAdminMutation.isPending}
                              className="gap-1 bg-green-600 hover:bg-green-700"
                            >
                              {approveSaleFinancialMutation.isPending || approveSaleAdminMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              Aprovar
                            </Button>

                            <Dialog
                              open={
                                isRejectDialogOpen &&
                                selectedSaleId === sale.id
                              }
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
                                  className="gap-1"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Rejeitar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rejeitar Venda</DialogTitle>
                                  <DialogDescription>
                                    Explique o motivo da rejeição
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="reason">
                                      Motivo da Rejeição
                                    </Label>
                                    <Textarea
                                      id="reason"
                                      value={rejectionReason}
                                      onChange={(e) =>
                                        setRejectionReason(e.target.value)
                                      }
                                      placeholder="Descreva o motivo da rejeição..."
                                      rows={4}
                                    />
                                  </div>

                                  <div className="flex gap-2 justify-end">
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
                                        "Rejeitar"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                        {expandedHistoryId === sale.id && (
                          <TableRow key={`history-${sale.id}`}>
                            <TableCell colSpan={6} className="bg-slate-50">
                              <ApprovalHistoryTimeline saleId={sale.id} />
                            </TableCell>
                          </TableRow>
                        )}
                        {expandedChecklistId === sale.id && (
                          <TableRow key={`checklist-${sale.id}`}>
                            <TableCell colSpan={6} className="bg-slate-50">
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

        {/* Rejection Info */}
        {filteredSales.some(
          (s: any) => s.financialRejectionReason || s.adminRejectionReason
        ) && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">
                Vendas Rejeitadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredSales
                  .filter(
                    (s: any) => s.financialRejectionReason || s.adminRejectionReason
                  )
                  .map((sale: any) => (
                    <div
                      key={sale.id}
                      className="p-3 bg-white rounded border border-red-200"
                    >
                      <p className="font-semibold text-slate-900">
                        {sale.customerName} - {sale.vehicleModel}
                      </p>
                      {sale.financialRejectionReason && (
                        <p className="text-sm text-red-700 mt-1">
                          Financeiro: {sale.financialRejectionReason}
                        </p>
                      )}
                      {sale.adminRejectionReason && (
                        <p className="text-sm text-red-700 mt-1">
                          Administrativo: {sale.adminRejectionReason}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

import React from "react";
