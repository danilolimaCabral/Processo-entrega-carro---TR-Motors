import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChecklistFormProps {
  saleRecordId: number;
}

export function ChecklistForm({ saleRecordId }: ChecklistFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist de Inspeção</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button variant="outline" className="w-full">
          Iniciar Checklist Financeiro
        </Button>
        <Button variant="outline" className="w-full">
          Iniciar Checklist Administrativo
        </Button>
      </CardContent>
    </Card>
  );
}
