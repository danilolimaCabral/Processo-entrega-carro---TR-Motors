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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DocumentList } from "@/components/DocumentList";
import { RejectModal } from "@/components/RejectModal";
import { StatusBadge } from "@/components/StatusBadge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, FileSearch, Loader2, User, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type SaleRecord = {
  id: number;
  licensePlate: string;
  status: string;
  sellerName: string | null;
  createdAt: number;
  rejectionReason: string | null;
  documents: Array<{
    id: number;
    documentType: string;
    fileUrl: string;
    originalName: string | null;
    uploadedAt: number;
  }>;
};

export default function AdministrativoPage() {
  const utils = trpc.useUtils();
  const { data: records, isLoading } = trpc.sales.listForAdministrativo.useQuery();
  const [selected, setSelected] = useState<SaleRecord | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const approve = trpc.sales.approveAdministrativo.useMutation({
    onSuccess: () => {
      toast.success("Entrega liberada com sucesso!");
      setSelected(null);
      utils.sales.listForAdministrativo.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const reject = trpc.sales.rejectAdministrativo.useMutation({
    onSuccess: () => {
      toast.success("Registro reprovado.");
      setRejectOpen(false);
      setSelected(null);
      utils.sales.listForAdministrativo.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Painel Administrativo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Confira a documentação aprovada pelo Financeiro e libere a entrega.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-base">Aguardando liberação administrativa</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {records?.length ?? 0} registro(s) pendente(s)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !records || records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <FileSearch className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum registro pendente
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Todos os registros foram analisados.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 font-semibold text-xs uppercase tracking-wide">Placa</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Vendedor</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Data de criação</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Status</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-mono font-semibold tracking-widest text-sm">
                      {r.licensePlate}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {r.sellerName ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setSelected(r as SaleRecord)}
                      >
                        Analisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono tracking-widest">{selected?.licensePlate}</span>
              {selected && <StatusBadge status={selected.status} />}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Vendedor</p>
                  <p className="font-medium">{selected.sellerName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Data de criação</p>
                  <p className="font-medium">
                    {new Date(selected.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Documentos
                </p>
                <DocumentList documents={selected.documents} />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  className="flex-1"
                  onClick={() => approve.mutate({ id: selected.id })}
                  disabled={approve.isPending}
                >
                  {approve.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Liberar entrega
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setRejectOpen(true)}
                  disabled={reject.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reprovar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => selected && reject.mutate({ id: selected.id, reason })}
        isLoading={reject.isPending}
        title="Reprovar — Análise Administrativa"
      />
    </div>
  );
}

