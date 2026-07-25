import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ROLE_LABELS } from "@shared/trMotors";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserWithRole {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date;
  lastSignedIn: Date;
}

export default function AdminPage() {
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation();
  const [selectedRole, setSelectedRole] = useState<Record<number, string>>({});

  useEffect(() => {
    if (users) {
      const initialRoles: Record<number, string> = {};
      users.forEach((user) => {
        initialRoles[user.id] = user.role;
      });
      setSelectedRole(initialRoles);
    }
  }, [users]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    setSelectedRole((prev) => ({ ...prev, [userId]: newRole }));

    try {
      await updateRoleMutation.mutateAsync({
        userId,
        role: newRole as "vendedor" | "financeiro" | "administrativo" | "user",
      });
      toast.success("Papel atualizado com sucesso");
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar papel");
      // Revert on error
      if (users) {
        const user = users.find((u) => u.id === userId);
        if (user) {
          setSelectedRole((prev) => ({ ...prev, [userId]: user.role }));
        }
      }
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
          <CardTitle>Gerenciar Usuários</CardTitle>
          <CardDescription>
            Visualize todos os usuários cadastrados e atribua papéis de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Último acesso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={selectedRole[user.id] || user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              {ROLE_LABELS["user"]}
                            </SelectItem>
                            <SelectItem value="vendedor">
                              {ROLE_LABELS["vendedor"]}
                            </SelectItem>
                            <SelectItem value="financeiro">
                              {ROLE_LABELS["financeiro"]}
                            </SelectItem>
                            <SelectItem value="administrativo">
                              {ROLE_LABELS["administrativo"]}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(user.lastSignedIn), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum usuário cadastrado
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
