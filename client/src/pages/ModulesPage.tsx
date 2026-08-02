import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  BarChart3,
  Building2,
  Car,
  ClipboardList,
  DollarSign,
  FileText,
  LayoutDashboard,
  Users,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const iconMap: Record<string, React.ReactNode> = {
  Car: <Car className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  DollarSign: <DollarSign className="h-5 w-5" />,
  Building2: <Building2 className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  ClipboardList: <ClipboardList className="h-5 w-5" />,
  UsersRound: <UsersRound className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
};

export default function ModulesPage() {
  const utils = trpc.useUtils();
  const modulesQuery = trpc.modules.list.useQuery();
  const modules = modulesQuery.data || [];

  const toggleMutation = trpc.modules.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.modules.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar módulo");
    },
  });

  const seedMutation = trpc.modules.seed.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.modules.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar módulos");
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Módulos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ative ou desative módulos do sistema ERP.
          </p>
        </div>
        {modules.length === 0 && (
          <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
            {seedMutation.isPending ? "Criando..." : "Criar Módulos Padrão"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((mod) => (
          <Card key={mod.id} className={!mod.isActive ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${mod.isActive ? "bg-blue-100" : "bg-slate-100"}`}>
                    {iconMap[mod.icon] || <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{mod.name}</CardTitle>
                    <Badge variant={mod.isActive ? "default" : "secondary"} className="mt-1 text-xs">
                      {mod.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
                <Switch
                  checked={mod.isActive}
                  onCheckedChange={() => toggleMutation.mutate({ moduleId: mod.id })}
                  disabled={toggleMutation.isPending}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{mod.description}</p>
              {mod.route && (
                <p className="text-xs text-slate-400 mt-2">Rota: {mod.route}</p>
              )}
              {mod.allowedRoles && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {mod.allowedRoles.split(",").map((role) => (
                    <Badge key={role} variant="outline" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </DashboardLayout>
  );
}
