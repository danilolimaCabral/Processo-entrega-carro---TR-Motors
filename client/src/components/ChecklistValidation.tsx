import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface ChecklistValidationProps {
  saleRecordId: number;
  userRole: "financeiro" | "administrativo";
}

export function ChecklistValidation({ saleRecordId, userRole }: ChecklistValidationProps) {
  const [notes, setNotes] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"ok" | "issue">("ok");

  const { data: items, refetch } = trpc.checklist.getItems.useQuery({ saleRecordId });
  const updateMutation = trpc.checklist.updateItemStatus.useMutation();

  const handleValidate = async () => {
    if (!selectedItemId) {
      toast.error("Selecione um item para validar");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        itemId: selectedItemId,
        status: selectedStatus,
        notes: notes || undefined,
      });

      toast.success(`Item marcado como ${selectedStatus === "ok" ? "aprovado" : "com problema"}`);
      setSelectedItemId(null);
      setNotes("");
      setSelectedStatus("ok");
      refetch();
    } catch (error) {
      toast.error("Erro ao validar item");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "issue":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case "issue":
        return <Badge className="bg-red-100 text-red-800">Problema</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
  };

  const isValidatedByCurrentRole = (item: any) => {
    if (userRole === "financeiro") {
      return item.validatedByFinanceiroAt;
    }
    return item.validatedByAdminAt;
  };

  // Each department only sees and validates its own checklist items.
  const myItems = items?.filter((item) => item.responsibleRole === userRole) || [];
  const pendingItems = myItems.filter((item) => !isValidatedByCurrentRole(item));
  const completedItems = myItems.filter((item) => isValidatedByCurrentRole(item));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Validação de Checklist ({userRole === "financeiro" ? "Financeiro" : "Administrativo"})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {myItems.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p>Nenhum item de checklist para o seu setor</p>
            </div>
          ) : (
            <>
              {/* Pending Items */}
              {pendingItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-slate-700">
                    Itens Pendentes ({pendingItems.length})
                  </h4>
                  <div className="space-y-2">
                    {pendingItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 border rounded-lg cursor-pointer transition ${
                          selectedItemId === item.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{item.itemName}</p>
                            {item.itemDescription && (
                              <p className="text-xs text-slate-600 mt-1">
                                {item.itemDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Form */}
              {selectedItemId && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                  <div>
                    <Label className="text-sm font-semibold">Status da Validação</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={selectedStatus === "ok" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedStatus("ok")}
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprovado
                      </Button>
                      <Button
                        variant={selectedStatus === "issue" ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => setSelectedStatus("issue")}
                        className="gap-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Problema
                      </Button>
                    </div>
                  </div>

                  {selectedStatus === "issue" && (
                    <div>
                      <Label htmlFor="notes" className="text-sm">
                        Observações
                      </Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Descreva o problema encontrado..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItemId(null);
                        setNotes("");
                        setSelectedStatus("ok");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleValidate}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? "Validando..." : "Validar"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Completed Items */}
              {completedItems.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-3 text-slate-700">
                    Itens Validados ({completedItems.length})
                  </h4>
                  <div className="space-y-2">
                    {completedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getStatusIcon(item.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{item.itemName}</p>
                              {getStatusBadge(item.status)}
                            </div>
                            {item.notes && (
                              <p className="text-xs text-slate-600 italic">
                                Observação: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
