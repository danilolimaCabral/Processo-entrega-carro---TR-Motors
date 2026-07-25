import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ROLE_LABELS } from "@shared/trMotors";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  UserPlus,
  KeyRound,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
} from "lucide-react";

interface UserWithRole {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  isActive: number | null;
  loginMethod: string | null;
  createdAt: Date;
  lastSignedIn: Date;
}

// ─── Formulário de Criação de Usuário ────────────────────────────────────────

function CreateUserDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("user");
  const [showPassword, setShowPassword] = useState(false);

  const createMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar usuário.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      role: role as "user" | "vendedor" | "financeiro" | "administrativo",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Crie um usuário com acesso ao sistema. As credenciais devem ser enviadas ao colaborador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="create-name">Nome completo</Label>
            <Input
              id="create-name"
              placeholder="João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              placeholder="joao@trmotors.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-password">Senha inicial</Label>
            <div className="relative">
              <Input
                id="create-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-9"
                disabled={createMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-role">Papel no sistema</Label>
            <Select value={role} onValueChange={setRole} disabled={createMutation.isPending}>
              <SelectTrigger id="create-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{ROLE_LABELS["user"]}</SelectItem>
                <SelectItem value="vendedor">{ROLE_LABELS["vendedor"]}</SelectItem>
                <SelectItem value="financeiro">{ROLE_LABELS["financeiro"]}</SelectItem>
                <SelectItem value="administrativo">{ROLE_LABELS["administrativo"]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Formulário de Redefinição de Senha ──────────────────────────────────────

function ResetPasswordDialog({ userId, userName }: { userId: number; userName: string }) {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetMutation = trpc.admin.resetPassword.useMutation({
    onSuccess: () => {
      toast.success(`Senha de ${userName} redefinida com sucesso!`);
      setOpen(false);
      setNewPassword("");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao redefinir senha.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Redefinir senha">
          <KeyRound className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Redefinir Senha</DialogTitle>
          <DialogDescription>
            Defina uma nova senha para <strong>{userName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-9"
                disabled={resetMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={resetMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (newPassword.length < 6) {
                toast.error("A senha deve ter pelo menos 6 caracteres.");
                return;
              }
              resetMutation.mutate({ userId, newPassword });
            }}
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página Principal do Admin ───────────────────────────────────────────────

export default function AdminPage() {
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation();
  const setActiveMutation = trpc.admin.setUserActive.useMutation();
  const deleteUserMutation = trpc.admin.deleteUser.useMutation();

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({
        userId,
        role: newRole as "vendedor" | "financeiro" | "administrativo" | "user",
      });
      toast.success("Papel atualizado com sucesso");
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar papel");
    }
  };

  const handleToggleActive = async (userId: number, currentActive: number | null) => {
    const newActive = currentActive === 0 ? true : false;
    try {
      await setActiveMutation.mutateAsync({ userId, isActive: newActive });
      toast.success(newActive ? "Usuário ativado" : "Usuário desativado");
      refetch();
    } catch (error) {
      toast.error("Erro ao alterar status do usuário");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUserMutation.mutateAsync({ userId });
      toast.success("Usuário removido com sucesso");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover usuário");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Crie, edite e controle o acesso dos colaboradores ao sistema
              </CardDescription>
            </div>
            <CreateUserDialog onSuccess={refetch} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id} className={user.isActive === 0 ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{user.name || "—"}</p>
                          {user.loginMethod && (
                            <p className="text-xs text-muted-foreground capitalize">
                              via {user.loginMethod}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">{ROLE_LABELS["user"]}</SelectItem>
                            <SelectItem value="vendedor">{ROLE_LABELS["vendedor"]}</SelectItem>
                            <SelectItem value="financeiro">{ROLE_LABELS["financeiro"]}</SelectItem>
                            <SelectItem value="administrativo">{ROLE_LABELS["administrativo"]}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive !== 0 ? "default" : "secondary"}>
                          {user.isActive !== 0 ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(user.lastSignedIn), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {/* Redefinir senha (apenas usuários locais) */}
                          {user.loginMethod === "local" && (
                            <ResetPasswordDialog
                              userId={user.id}
                              userName={user.name ?? user.email ?? "usuário"}
                            />
                          )}

                          {/* Ativar/Desativar */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={user.isActive !== 0 ? "Desativar usuário" : "Ativar usuário"}
                            onClick={() => handleToggleActive(user.id, user.isActive)}
                            disabled={setActiveMutation.isPending}
                          >
                            {user.isActive !== 0 ? (
                              <UserX className="h-3.5 w-3.5 text-destructive" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5 text-green-600" />
                            )}
                          </Button>

                          {/* Excluir */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Excluir usuário"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação é permanente e não pode ser desfeita.
                                  O usuário <strong>{user.name ?? user.email}</strong> será removido do sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum usuário cadastrado. Clique em "Novo Usuário" para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
