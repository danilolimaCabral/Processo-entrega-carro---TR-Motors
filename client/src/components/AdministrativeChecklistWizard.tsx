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
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Upload, Loader2, Clock, X } from "lucide-react";
import { toast } from "sonner";
import {
  CHECKLIST_STEPS_BY_DEPARTMENT,
  type AdministrativeChecklistDocumentConfig,
  type AdministrativeChecklistConditionalGroup,
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  existing?: { filename: string; fileUrl: string; fileSize?: number | null };
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
      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
        isUploaded
          ? "border-green-300 bg-green-50 hover:bg-green-100"
          : "border-dashed border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400"
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
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100">
            <Upload className="h-4 w-4 text-slate-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-slate-900">{doc.label}</p>
        {doc.description && (
          <p className="text-xs text-slate-500">{doc.description}</p>
        )}
        <p
          className={`text-xs mt-0.5 ${isUploaded ? "text-green-700" : "text-slate-400"}`}
        >
          {isPending
            ? "Enviando..."
            : isUploaded
              ? `${existing!.filename}${existing?.fileSize ? ` (${formatFileSize(existing.fileSize)})` : ""} — toque para substituir`
              : "Toque para anexar foto ou PDF"}
        </p>
      </div>
      {isUploaded && (
        <a
          href={existing!.fileUrl}
          download={existing!.filename}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex-shrink-0 font-medium"
        >
          Ver
        </a>
      )}
    </div>
  );
}

function ConditionalGroupSection({
  group,
  saleRecordId,
  department,
  step,
  getExisting,
  onUploaded,
}: {
  group: AdministrativeChecklistConditionalGroup;
  saleRecordId: number;
  department: ChecklistDepartment;
  step: number;
  getExisting: (key: string) => { filename: string; fileUrl: string; fileSize?: number | null } | undefined;
  onUploaded: () => void;
}) {
  const missing = group.documents.filter((doc) => !getExisting(doc.key));
  const completed = group.documents.filter((doc) => !!getExisting(doc.key));

  return (
    <div className="space-y-3 pt-4 border-t border-slate-200">
      <p className="text-sm font-semibold text-slate-700">{group.title}</p>
      {group.documents.map((doc) => (
        <DocumentUploadTile
          key={doc.key}
          saleRecordId={saleRecordId}
          department={department}
          step={step}
          doc={doc}
          existing={getExisting(doc.key)}
          onUploaded={onUploaded}
        />
      ))}
      {missing.length > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Faltam: {missing.map((d) => d.label).join(", ")}
        </p>
      )}
      {completed.length === group.documents.length && (
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Todos os documentos desta seção estão completos
        </p>
      )}
    </div>
  );
}

function ConfirmationStep({ department }: { department: ChecklistDepartment }) {
  const title = department === "financeiro" ? "Financeiro" : "Administrativo";
  return (
    <div className="flex flex-col items-center text-center gap-3 py-8">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <p className="font-semibold text-lg text-slate-900">Checklist enviado!</p>
      <p className="text-sm text-slate-600 flex items-center gap-1.5">
        <Clock className="h-4 w-4" />
        Aguardando aprovação do setor {title}
      </p>
      <p className="text-xs text-slate-500 mt-2">
        A equipe {title} irá revisar os documentos enviados.
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
  const [vehicleTradeIn, setVehicleTradeIn] = useState<"sim" | "nao" | null>(null);
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

  const conditionalGroups =
    stepIndex === 0 && vehicleTradeIn === "sim"
      ? currentStep?.conditionalGroups ?? []
      : [];
  const isGroupComplete = (group: AdministrativeChecklistConditionalGroup) =>
    group.documents.every((doc) => !!getExisting(doc.key));
  const missingConditionalDocuments = conditionalGroups
    .flatMap((group) => group.documents)
    .filter((doc) => !getExisting(doc.key));

  const isStepComplete =
    missingDocuments.length === 0 &&
    missingConditionalDocuments.length === 0 &&
    (stepIndex !== 0 || vehicleTradeIn !== null);

  const title =
    department === "administrativo"
      ? "Checklist Administrativo"
      : "Checklist Financeiro";

  const progressPercent = steps.length > 1 ? Math.round((stepIndex / (steps.length - 1)) * 100) : 100;

  if (!currentStep) return null;

  const handleAdvance = () => {
    setStepIndex((s) => s + 1);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setStepIndex(0);
          setVehicleTradeIn(null);
        }
      }}
    >
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
          </DialogTitle>
          <DialogDescription>
            Etapa {stepIndex + 1} de {steps.length} — {currentStep.title}
          </DialogDescription>
          {currentStep.kind === "upload" && (
            <Progress value={progressPercent} className="h-1.5 mt-2" />
          )}
        </DialogHeader>

        {currentStep.kind === "confirmation" ? (
          <ConfirmationStep department={department} />
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
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
            {missingDocuments.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <X className="h-3 w-3 flex-shrink-0" />
                <span>Faltam: {missingDocuments.map((d) => d.label).join(", ")}</span>
              </div>
            )}

            {stepIndex === 0 && (
              <div className="flex items-center justify-between gap-2 px-1 pt-2">
                <span className="text-xs font-medium text-slate-600">Veículo na troca?</span>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={vehicleTradeIn === "sim" ? "default" : "outline"}
                    className="h-8 px-3 text-xs"
                    onClick={() => setVehicleTradeIn("sim")}
                  >
                    Sim
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={vehicleTradeIn === "nao" ? "default" : "outline"}
                    className="h-8 px-3 text-xs"
                    onClick={() => setVehicleTradeIn("nao")}
                  >
                    Não
                  </Button>
                </div>
              </div>
            )}

            {conditionalGroups.map((group, index) => {
              const previousGroups = conditionalGroups.slice(0, index);
              const previousComplete = previousGroups.every(isGroupComplete);
              if (!previousComplete) return null;

              return (
                <ConditionalGroupSection
                  key={group.id}
                  group={group}
                  saleRecordId={saleRecordId}
                  department={department}
                  step={currentStep.step}
                  getExisting={getExisting}
                  onUploaded={refetch}
                />
              );
            })}
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-slate-100">
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
              onClick={handleAdvance}
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
