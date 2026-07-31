import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2, Upload, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  CHECKLIST_STEPS_BY_DEPARTMENT,
  type AdministrativeChecklistDocumentConfig,
  type ChecklistDepartment,
} from "@/lib/administrativeChecklistSteps";

interface AdministrativeChecklistWizardProps {
  saleRecordId: number;
  department: ChecklistDepartment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function DocumentUploadTile({
  saleRecordId,
  department,
  step,
  doc,
  existing,
  onUploaded,
}: {
  saleRecordId: number;
  department: ChecklistDepartment;
  step: number;
  doc: AdministrativeChecklistDocumentConfig;
  existing?: { filename: string; fileUrl: string };
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.administrativeChecklist.uploadDocument.useMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await readFileAsBase64(file);
      await uploadMutation.mutateAsync({
        saleRecordId,
        department,
        step,
        documentKey: doc.key,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        fileDataBase64: base64,
      });
      toast.success(`${doc.label} enviado com sucesso`);
      onUploaded();
    } catch (error) {
      toast.error(`Erro ao enviar ${doc.label}`);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isUploaded = !!existing;
  const isPending = uploadMutation.isPending;

  return (
    <div
      onClick={() => !isPending && inputRef.current?.click()}
      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
        isUploaded
          ? "border-green-300 bg-green-50 hover:bg-green-100"
          : "border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex-shrink-0">
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        ) : isUploaded ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <Upload className="h-5 w-5 text-slate-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-slate-900">{doc.label}</p>
        {doc.description && (
          <p className="text-xs text-slate-500">{doc.description}</p>
        )}
        <p
          className={`text-xs mt-0.5 ${isUploaded ? "text-green-700" : "text-slate-500"}`}
        >
          {isPending
            ? "Enviando..."
            : isUploaded
              ? `Enviado: ${existing!.filename} — toque para substituir`
              : "Toque para anexar foto ou PDF"}
        </p>
      </div>
      {isUploaded && (
        <a
          href={existing!.fileUrl}
          download={existing!.filename}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-blue-600 hover:underline flex-shrink-0"
        >
          Ver
        </a>
      )}
    </div>
  );
}

function ConfirmationStep() {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-8">
      <CheckCircle2 className="h-10 w-10 text-green-600" />
      <p className="font-semibold text-lg text-slate-900">Checklist enviado</p>
      <p className="text-sm text-slate-600 flex items-center gap-1.5">
        <Clock className="h-4 w-4" />
        Aguardando aprovação Administrativo
      </p>
    </div>
  );
}

export function AdministrativeChecklistWizard({
  saleRecordId,
  department,
  open,
  onOpenChange,
}: AdministrativeChecklistWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = CHECKLIST_STEPS_BY_DEPARTMENT[department];
  const currentStep = steps[stepIndex];

  const { data: documents, refetch } =
    trpc.administrativeChecklist.getDocuments.useQuery(
      { saleRecordId, department, step: currentStep?.step ?? 0 },
      { enabled: open && currentStep?.kind === "upload" }
    );

  const getExisting = (key: string) =>
    documents?.find((d) => d.documentKey === key);

  const missingDocuments =
    currentStep?.kind === "upload"
      ? currentStep.documents.filter((doc) => !getExisting(doc.key))
      : [];
  const isStepComplete = missingDocuments.length === 0;

  const title =
    department === "administrativo"
      ? "Checklist Administrativo"
      : "Checklist Financeiro";

  if (!currentStep) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setStepIndex(0);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Etapa {stepIndex + 1} de {steps.length} — {currentStep.title}
          </DialogDescription>
        </DialogHeader>

        {currentStep.kind === "confirmation" ? (
          <ConfirmationStep />
        ) : (
          <div className="space-y-3">
            {currentStep.documents.map((doc) => (
              <DocumentUploadTile
                key={doc.key}
                saleRecordId={saleRecordId}
                department={department}
                step={currentStep.step}
                doc={doc}
                existing={getExisting(doc.key)}
                onUploaded={refetch}
              />
            ))}
            {!isStepComplete && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Faltam: {missingDocuments.map((d) => d.label).join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {stepIndex > 0 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStepIndex((s) => s - 1)}
            >
              Voltar
            </Button>
          )}
          {stepIndex < steps.length - 1 ? (
            <Button
              type="button"
              className="flex-1"
              disabled={!isStepComplete}
              onClick={() => setStepIndex((s) => s + 1)}
            >
              Avançar
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
