import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdministrativeChecklistWizard } from "@/components/AdministrativeChecklistWizard";

interface ChecklistFormProps {
  saleRecordId: number;
}

export function ChecklistForm({ saleRecordId }: ChecklistFormProps) {
  const [isAdminChecklistOpen, setIsAdminChecklistOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist de Inspeção</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button variant="outline" className="w-full">
          Iniciar Checklist Financeiro
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsAdminChecklistOpen(true)}
        >
          Iniciar Checklist Administrativo
        </Button>
      </CardContent>

      <AdministrativeChecklistWizard
        saleRecordId={saleRecordId}
        department="administrativo"
        open={isAdminChecklistOpen}
        onOpenChange={setIsAdminChecklistOpen}
      />
    </Card>
  );
}
