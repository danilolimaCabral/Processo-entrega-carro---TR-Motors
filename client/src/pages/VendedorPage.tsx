import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { trpc } from "@/lib/trpc";
import { DOCUMENT_TYPE_LABELS } from "@shared/trMotors";
import { Car, FilePlus, Loader2, Upload, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function VendedorPage() {
  const utils = trpc.useUtils();
  const { data: records, isLoading } = trpc.sales.listMine.useQuery();

  const [plate, setPlate] = useState("");
  const [cartorioFile, setCartorioFile] = useState<File | null>(null);
  const [pagamentoFile, setPagamentoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resubmitDialogOpen, setResubmitDialogOpen] = useState(false);
  const [resubmitRecordId, setResubmitRecordId] = useState<number | null>(null);
  const [resubmitCartorioFile, setResubmitCartorioFile] = useState<File | null>(null);
  const [resubmitPagamentoFile, setResubmitPagamentoFile] = useState<File | null>(null);
  const [resubmitting, setResubmitting] = useState(false);

  const cartorioRef = useRef<HTMLInputElement>(null);
  const pagamentoRef = useRef<HTMLInputElement>(null);
  const resubmitCartorioRef = useRef<HTMLInputElement>(null);
  const resubmitPagamentoRef = useRef<HTMLInputElement>(null);

  const createSale = trpc.sales.create.useMutation();
  const resetReprovado = trpc.admin.resetReprovadoForResubmit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) {
      toast.error("Informe a placa do veículo.");
      return;
    }
    if (!cartorioFile) {
      toast.error("Anexe o documento de cartório.");
      return;
    }
    if (!pagamentoFile) {
      toast.error("Anexe o comprovante de pagamento.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Criar o registro de venda
      const { id: saleRecordId } = await createSale.mutateAsync({
        licensePlate: plate,
      });

      // 2. Upload dos dois documentos
      const uploadDoc = async (file: File, documentType: string) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("saleRecordId", String(saleRecordId));
        formData.append("documentType", documentType);
        const res = await fetch("/api/upload-document", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Erro no upload" }));
          throw new Error(err.error ?? "Erro no upload do documento.");
        }
      };

      await uploadDoc(cartorioFile, "documentacao_cartorio");
      await uploadDoc(pagamentoFile, "comprovante_pagamento");

      toast.success("Registro criado com sucesso! Aguardando análise do Financeiro.");
      setPlate("");
      setCartorioFile(null);
      setPagamentoFile(null);
      if (cartorioRef.current) cartorioRef.current.value = "";
      if (pagamentoRef.current) pagamentoRef.current.value = "";
      utils.sales.listMine.invalidate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar registro.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitRecordId) return;
    if (!resubmitCartorioFile) {
      toast.error("Anexe o documento de cartório.");
      return;
    }
    if (!resubmitPagamentoFile) {
      toast.error("Anexe o comprovante de pagamento.");
      return;
    }

    setResubmitting(true);
    try {
      // 1. Upload dos dois documentos
      const uploadDoc = async (file: File, documentType: string) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("saleRecordId", String(resubmitRecordId));
        formData.append("documentType", documentType);
        const res = await fetch("/api/upload-document", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Erro no upload" }));
          throw new Error(err.error ?? "Erro no upload do documento.");
        }
      };

      await uploadDoc(resubmitCartorioFile, "documentacao_cartorio");
      await uploadDoc(resubmitPagamentoFile, "comprovante_pagamento");

      // 2. Resetar o status para "aguardando_financeiro"
      await resetReprovado.mutateAsync({ id: resubmitRecordId });

      toast.success("Documentos reenviados com sucesso! Aguardando análise do Financeiro.");
      setResubmitDialogOpen(false);
      setResubmitRecordId(null);
      setResubmitCartorioFile(null);
      setResubmitPagamentoFile(null);
      if (resubmitCartorioRef.current) resubmitCartorioRef.current.value = "";
      if (resubmitPagamentoRef.current) resubmitPagamentoRef.current.value = "";
      utils.sales.listMine.invalidate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao reenviar documentos.";
      toast.error(msg);
    } finally {
      setResubmitting(false);
    }
  };

  const openResubmitDialog = (recordId: number) => {
    setResubmitRecordId(recordId);
    setResubmitDialogOpen(true);
  };

  const closeResubmitDialog = () => {
    setResubmitDialogOpen(false);
    setResubmitRecordId(null);
    setResubmitCartorioFile(null);
    setResubmitPagamentoFile(null);
    if (resubmitCartorioRef.current) resubmitCartorioRef.current.value = "";
    if (resubmitPagamentoRef.current) resubmitPagamentoRef.current.value = "";
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Painel do Vendedor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crie novos registros de venda e acompanhe o status de aprovação.
        </p>
      </div>

      {/* Formulário de novo registro */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FilePlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Novo registro de venda</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Preencha os dados e anexe os documentos obrigatórios em PDF.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Placa */}
            <div className="space-y-1.5">
              <Label htmlFor="plate" className="text-sm font-medium">
                Placa do veículo <span className="text-red-500">*</span>
              </Label>
              <div className="relative max-w-xs">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="plate"
                  placeholder="ABC-1234"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  className="pl-9 uppercase font-mono tracking-widest"
                  maxLength={8}
                />
              </div>
            </div>

            {/* Documentos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  {
                    key: "documentacao_cartorio",
                    ref: cartorioRef,
                    file: cartorioFile,
                    setFile: setCartorioFile,
                  },
                  {
                    key: "comprovante_pagamento",
                    ref: pagamentoRef,
                    file: pagamentoFile,
                    setFile: setPagamentoFile,
                  },
                ] as const
              ).map(({ key, ref, file, setFile }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {DOCUMENT_TYPE_LABELS[key]}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <label
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 cursor-pointer transition-colors ${
                      file
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <Upload
                      className={`h-5 w-5 ${file ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="text-xs text-center text-muted-foreground">
                      {file ? (
                        <span className="text-primary font-medium truncate max-w-[160px] block">
                          {file.name}
                        </span>
                      ) : (
                        "Clique para selecionar PDF"
                      )}
                    </span>
                    <input
                      ref={ref}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              ))}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar para aprovação"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Listagem de registros */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Meus registros</CardTitle>
          <CardDescription className="text-xs">
            Acompanhe o status de cada venda enviada para aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !records || records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Car className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum registro criado ainda
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Use o formulário acima para criar seu primeiro registro.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 font-semibold text-xs uppercase tracking-wide">Placa</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Data de criação</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Status</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Motivo (se reprovado)</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-mono font-semibold tracking-widest text-sm">
                      {r.licensePlate}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      {r.rejectionReason ? (
                        <span className="text-red-600 text-xs">{r.rejectionReason}</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.status === "reprovado" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openResubmitDialog(r.id)}
                          className="h-7 text-xs"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reenviar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de reenvio */}
      <Dialog open={resubmitDialogOpen} onOpenChange={closeResubmitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reenviar documentos</DialogTitle>
            <DialogDescription>
              Anexe novamente os documentos para reenviar para aprovação.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {(
                [
                  {
                    key: "documentacao_cartorio",
                    ref: resubmitCartorioRef,
                    file: resubmitCartorioFile,
                    setFile: setResubmitCartorioFile,
                  },
                  {
                    key: "comprovante_pagamento",
                    ref: resubmitPagamentoRef,
                    file: resubmitPagamentoFile,
                    setFile: setResubmitPagamentoFile,
                  },
                ] as const
              ).map(({ key, ref, file, setFile }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {DOCUMENT_TYPE_LABELS[key]}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <label
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors ${
                      file
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <Upload
                      className={`h-4 w-4 ${file ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="text-xs text-center text-muted-foreground">
                      {file ? (
                        <span className="text-primary font-medium truncate max-w-[120px] block">
                          {file.name}
                        </span>
                      ) : (
                        "Clique para selecionar PDF"
                      )}
                    </span>
                    <input
                      ref={ref}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeResubmitDialog}
                disabled={resubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={resubmitting}>
                {resubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reenviar
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
