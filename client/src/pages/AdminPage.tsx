import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Plus,
  Trash2,
  Edit,
  LogOut,
  AlertCircle,
  LayoutDashboard,
  Blocks,
  Users,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { DepartmentsTab, PositionsTab, AuditLogsTab } from "./RhPage";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  vendedor: "Vendedor",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
  aluno: "Aluno",
  rh: "RH",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  gerente: "bg-indigo-100 text-indigo-800",
  vendedor: "bg-blue-100 text-blue-800",
  financeiro: "bg-green-100 text-green-800",
  administrativo: "bg-purple-100 text-purple-800",
  aluno: "bg-yellow-100 text-yellow-800",
  rh: "bg-teal-100 text-teal-800",
};

type AssignableRole = "admin" | "gerente" | "vendedor" | "financeiro" | "administrativo" | "aluno" | "rh";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: AssignableRole;
  }>({
    name: "",
    email: "",
    password: "",
    role: "vendedor",
  });
  const [resetForm, setResetForm] = useState({
    userId: 0,
    userName: "",
    newPassword: "",
  });

  const usersQuery = trpc.admin.listUsers.useQuery(undefined, {
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000,
    refetchOnWindowFocus: false,
    enabled: user?.role === "admin",
  });
  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      setIsCreateDialogOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "vendedor" });
      usersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar usuário");
    },
  });

  const resetPasswordMutation = trpc.admin.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso!");
      setIsResetDialogOpen(false);
      setResetForm({ userId: 0, userName: "", newPassword: "" });
    },
    onError: (error) => {
      const msg = error.message;
      if (msg.includes("newPassword") && msg.includes("too_small")) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
      } else {
        toast.error(msg || "Erro ao redefinir senha");
      }
    },
  });

  const resetTwoFactorMutation = trpc.admin.resetTwoFactor.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Autenticador redefinido com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao redefinir o autenticador");
    },
  });

  const toggleActiveMutation = trpc.admin.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      usersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário deletado!");
      setIsDeleteDialogOpen(false);
      usersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar usuário");
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUserMutation.mutateAsync(createForm);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetPasswordMutation.mutateAsync({
      userId: resetForm.userId,
      newPassword: resetForm.newPassword,
    });
  };

  const handleResetTwoFactor = async (userId: number) => {
    await resetTwoFactorMutation.mutateAsync({ userId });
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    await toggleActiveMutation.mutateAsync({
      userId,
      isActive: !currentStatus,
    });
  };

  const handleDeleteUser = async (userId: number) => {
    await deleteUserMutation.mutateAsync({ userId });
  };

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <Card className="max-w-xl mx-auto mt-10 border-red-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <ShieldCheck className="h-5 w-5 text-red-600" />
              Acesso restrito
            </CardTitle>
            <CardDescription>
              As Configurações são exclusivas para administradores do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/rh")} className="bg-red-600 hover:bg-red-700">
              Voltar para RH
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/modulos")}
            className="gap-2"
          >
            <Blocks className="h-4 w-4" />
            Módulos
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="gap-2 bg-red-50 text-red-700 border-red-200"
          >
            <Users className="h-4 w-4" />
            Usuários
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-red-600" />
              Configurações
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Usuários, módulos, estrutura organizacional e auditoria
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => logout()}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        <Card className="border-red-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configurações administrativas</CardTitle>
            <CardDescription>Somente administradores podem alterar estas informações.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/modulos")}><Blocks className="h-4 w-4" /> Liberar módulos</Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => document.getElementById("departamentos-config")?.scrollIntoView({ behavior: "smooth" })}><Users className="h-4 w-4" /> Departamentos</Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => document.getElementById("cargos-config")?.scrollIntoView({ behavior: "smooth" })}><ShieldCheck className="h-4 w-4" /> Cargos</Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => document.getElementById("auditoria-config")?.scrollIntoView({ behavior: "smooth" })}><LayoutDashboard className="h-4 w-4" /> Auditoria</Button>
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo usuário do sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Nome completo"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@empresa.com"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Papel</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(val) =>
                    setCreateForm({ ...createForm, role: val as AssignableRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="aluno">Aluno (EAD)</SelectItem>
                    <SelectItem value="rh">RH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Usuário"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
              <DialogDescription>
                Digite a nova senha para {resetForm.userName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={resetForm.newPassword}
                  onChange={(e) =>
                    setResetForm({ ...resetForm, newPassword: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  "Redefinir"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>
              Gerencie todos os usuários cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : usersQuery.isError ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600 mb-3">
                  Erro ao carregar usuários
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => usersQuery.refetch()}
                  className="mx-auto"
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div>
                {/* Desktop Table */}
                <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQuery.data?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={ROLE_COLORS[user.role] || ""}>
                            {ROLE_LABELS[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                            className={
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }
                          >
                            {user.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {user.lastSignedIn
                            ? new Date(user.lastSignedIn).toLocaleDateString(
                                "pt-BR"
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                setResetForm({
                                  userId: user.id,
                                  userName: user.name,
                                  newPassword: "",
                                });
                                setIsResetDialogOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                              Redefinir Senha
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1">
                                  <KeyRound className="h-3 w-3" />
                                  Redefinir 2FA
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <div className="space-y-2">
                                  <h2 className="text-lg font-semibold">Redefinir autenticador</h2>
                                  <p className="text-sm text-slate-600">
                                    No próximo acesso, {user.name} deverá cadastrar uma nova chave no aplicativo autenticador.
                                  </p>
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleResetTwoFactor(user.id)}
                                    disabled={resetTwoFactorMutation.isPending}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                  >
                                    {resetTwoFactorMutation.isPending ? "Redefinindo..." : "Redefinir 2FA"}
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleToggleActive(user.id, user.isActive)
                              }
                            >
                              {user.isActive ? "Desativar" : "Ativar"}
                            </Button>

                            <AlertDialog
                              open={
                                isDeleteDialogOpen &&
                                selectedUserId === user.id
                              }
                              onOpenChange={(open) => {
                                setIsDeleteDialogOpen(open);
                                if (open) setSelectedUserId(user.id);
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <div className="space-y-2">
                                  <h2 className="text-lg font-semibold">
                                    Deletar Usuário
                                  </h2>
                                  <p className="text-sm text-slate-600">
                                    Tem certeza que deseja deletar {user.name}?
                                    Esta ação não pode ser desfeita.
                                  </p>
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deleteUserMutation.isPending}
                                  >
                                    {deleteUserMutation.isPending ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deletando...
                                      </>
                                    ) : (
                                      "Deletar"
                                    )}
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {usersQuery.data?.map((user) => (
                    <Card key={user.id} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 bg-red-100">
                            <AvatarFallback className="text-xs font-medium text-red-700">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Badge className={ROLE_COLORS[user.role] || ""}>
                            {ROLE_LABELS[user.role] || user.role}
                          </Badge>
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                            className={
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }
                          >
                            {user.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 justify-end border-t pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs min-h-[40px]"
                          onClick={() => {
                            setResetForm({
                              userId: user.id,
                              userName: user.name,
                              newPassword: "",
                            });
                            setIsResetDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Senha
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 text-xs min-h-[40px]">
                              <KeyRound className="h-3 w-3 mr-1" />
                              2FA
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <div className="space-y-2">
                              <h2 className="text-lg font-semibold">Redefinir autenticador</h2>
                              <p className="text-sm text-slate-600">
                                No próximo acesso, {user.name} deverá cadastrar uma nova chave no aplicativo autenticador.
                              </p>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleResetTwoFactor(user.id)}
                                disabled={resetTwoFactorMutation.isPending}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                {resetTwoFactorMutation.isPending ? "Redefinindo..." : "Redefinir 2FA"}
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs min-h-[40px]"
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                        >
                          {user.isActive ? "Desativar" : "Ativar"}
                        </Button>
                        <AlertDialog
                          open={isDeleteDialogOpen && selectedUserId === user.id}
                          onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (open) setSelectedUserId(user.id);
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1 text-xs min-h-[40px]"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Deletar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <div className="space-y-2">
                              <h2 className="text-lg font-semibold">Deletar Usuário</h2>
                              <p className="text-sm text-slate-600">
                                Tem certeza que deseja deletar {user.name}?
                              </p>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Deletar
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <section id="departamentos-config" className="scroll-mt-6">
          <DepartmentsTab />
        </section>

        <section id="cargos-config" className="scroll-mt-6">
          <PositionsTab />
        </section>

        <section id="auditoria-config" className="scroll-mt-6">
          <AuditLogsTab />
        </section>
      </div>
    </DashboardLayout>
  );
}
