import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface ChecklistFormProps {
  saleRecordId: number;
}

export function ChecklistForm({ saleRecordId }: ChecklistFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");

  const { data: items, refetch } = trpc.checklist.getItems.useQuery({ saleRecordId });
  const createMutation = trpc.checklist.createItem.useMutation();
  const deleteMutation = trpc.checklist.deleteItem.useMutation();

  const handleCreate = async () => {
    if (!itemName.trim()) {
      toast.error("Nome do item é obrigatório");
      return;
    }

    try {
      await createMutation.mutateAsync({
        saleRecordId,
        itemName,
        itemDescription,
      });

      toast.success("Item de checklist criado com sucesso");
      setItemName("");
      setItemDescription("");
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao criar item de checklist");
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await deleteMutation.mutateAsync({ itemId });
      toast.success("Item deletado com sucesso");
      refetch();
    } catch (error) {
      toast.error("Erro ao deletar item");
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Checklist de Inspeção</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Item de Checklist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome do Item *</label>
                  <Input
                    placeholder="Ex: Pneus"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    placeholder="Ex: Verificar estado dos pneus"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Criando..." : "Criar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {!items || items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Nenhum item de checklist criado ainda</p>
              <p className="text-sm">Adicione itens para que o financeiro e administrativo validem</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{item.itemName}</h4>
                      {getStatusBadge(item.status)}
                    </div>
                    {item.itemDescription && (
                      <p className="text-sm text-slate-600 mb-1">{item.itemDescription}</p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-slate-500 italic">
                        Observação: {item.notes}
                      </p>
                    )}
                    <div className="flex gap-2 text-xs text-slate-500 mt-2">
                      {item.validatedByFinanceiroAt && (
                        <span>✓ Financeiro validou</span>
                      )}
                      {item.validatedByAdminAt && (
                        <span>✓ Admin validou</span>
                      )}
                    </div>
                  </div>
                  {item.status === "pending" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O item será removido do checklist.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-2 justify-end">
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Deletar
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
