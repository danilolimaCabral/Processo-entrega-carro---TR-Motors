import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdministrativeChecklistWizard } from "@/components/AdministrativeChecklistWizard";
import { FileText, CreditCard, CheckCircle2 } from "lucide-react";

interface ChecklistFormProps {
  saleRecordId: number;
}

export function ChecklistForm({ saleRecordId }: ChecklistFormProps) {
  const [isFinancialChecklistOpen, setIsFinancialChecklistOpen] = useState(false);
  const [isAdminChecklistOpen, setIsAdminChecklistOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle2 className="h-5 w-5 text-slate-600" />
          Checklist de Inspeção
        </CardTitle>
        <CardDescription>
          Inicie o checklist para o setor desejado
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-4"
          onClick={() => setIsFinancialChecklistOpen(true)}
        >
          <CreditCard className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 text-left">
            <p className="font-semibold text-sm">Checklist Financeiro</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprovante de pagamento, aprovação de crédito
            </p>
          </div>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-4"
          onClick={() => setIsAdminChecklistOpen(true)}
        >
          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1 text-left">
            <p className="font-semibold text-sm">Checklist Administrativo</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Docs de cartório, documentos do cliente
            </p>
          </div>
        </Button>
      </CardContent>

      <AdministrativeChecklistWizard
        saleRecordId={saleRecordId}
        department="financeiro"
        open={isFinancialChecklistOpen}
        onOpenChange={setIsFinancialChecklistOpen}
      />

      <AdministrativeChecklistWizard
        saleRecordId={saleRecordId}
        department="administrativo"
        open={isAdminChecklistOpen}
        onOpenChange={setIsAdminChecklistOpen}
      />
    </Card>
  );
}
