import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPE_LABELS, DocumentType } from "@shared/trMotors";
import { Download, ExternalLink, FileText } from "lucide-react";

interface Document {
  id: number;
  documentType: string;
  fileUrl: string;
  originalName: string | null;
  uploadedAt: number;
}

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  if (!documents || documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Nenhum documento anexado.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const label =
          DOCUMENT_TYPE_LABELS[doc.documentType as DocumentType] ??
          doc.documentType;
        return (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{label}</p>
                {doc.originalName && (
                  <p className="text-xs text-muted-foreground truncate">
                    {doc.originalName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => window.open(doc.fileUrl, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Visualizar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                asChild
              >
                <a href={doc.fileUrl} download={doc.originalName ?? label}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Baixar
                </a>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

