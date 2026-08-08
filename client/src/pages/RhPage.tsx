import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Users, Briefcase, Building2, Calendar, Clock, Plus, Edit, Trash2,
  UserCheck, UserX, Coffee, CalendarDays, Activity, DollarSign,
} from "lucide-react";

type Tab = "dashboard" | "funcionarios" | "departamentos" | "cargos" | "comissoes" | "ferias" | "ponto" | "feriados";

export default function RhPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [search, setSearch] = useState("");

  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: Activity },
    { id: "funcionarios" as Tab, label: "Funcionários", icon: Users },
    { id: "departamentos" as Tab, label: "Departamentos", icon: Building2 },
    { id: "cargos" as Tab, label: "Cargos", icon: Briefcase },
    { id: "comissoes" as Tab, label: "Comissões", icon: DollarSign },
    { id: "ferias" as Tab, label: "Férias", icon: Calendar },
    { id: "ponto" as Tab, label: "Ponto", icon: Clock },
    { id: "feriados" as Tab, label: "Feriados", icon: CalendarDays },
  ];

  return (
    <DashboardLayout title="Recursos Humanos">
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-hide -webkit-overflow-scrolling-touch">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors shrink-0 active:scale-95 ${
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
              }`}
            >
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden text-xs">{tab.label.slice(0, 4)}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "funcionarios" && <EmployeesTab search={search} setSearch={setSearch} />}
        {activeTab === "departamentos" && <DepartmentsTab />}
        {activeTab === "cargos" && <PositionsTab />}
        {activeTab === "comissoes" && <CommissionsTab />}
        {activeTab === "ferias" && <LeavesTab />}
        {activeTab === "ponto" && <AttendanceTab />}
        {activeTab === "feriados" && <HolidaysTab />}
      </div>
    </DashboardLayout>
  );
}

// ==================== Dashboard Tab ====================
function DashboardTab() {
  const { data: stats } = trpc.rh.dashboardStats.useQuery();
  const { data: employees } = trpc.rh.listEmployees.useQuery();
  const { data: pendingLeaves } = trpc.rh.listLeaveRequests.useQuery({ status: "pendente" });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Users size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalEmployees || 0}</p>
              <p className="text-xs text-slate-500">Total Funcionários</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><UserCheck size={20} className="text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold">{stats?.activeEmployees || 0}</p>
              <p className="text-xs text-slate-500">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Coffee size={20} className="text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold">{stats?.onVacation || 0}</p>
              <p className="text-xs text-slate-500">De Férias</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><Calendar size={20} className="text-orange-600" /></div>
            <div>
              <p className="text-2xl font-bold">{stats?.pendingLeaves || 0}</p>
              <p className="text-xs text-slate-500">Férias Pendentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Solicitações de Férias Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingLeaves && pendingLeaves.length > 0 ? (
            <div className="space-y-2">
              {pendingLeaves.slice(0, 5).map((item) => (
                <div key={item.leave.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-slate-400" />
                    <div>
                      <p className="font-medium text-sm">{item.employee.name}</p>
                      <p className="text-xs text-slate-500">{item.leave.type} - {item.leave.startDate} até {item.leave.endDate}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pendente</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Nenhuma solicitação pendente.</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funcionários Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {employees && employees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {employees.filter(e => e.status === "ativo").slice(0, 8).map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.hireDate || "Sem data"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Nenhum funcionário cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Employees Tab ====================
function EmployeesTab({ search, setSearch }: { search: string; setSearch: (s: string) => void }) {
  const { data: employees, isLoading, refetch } = trpc.rh.listEmployees.useQuery({ search: search || undefined });
  const { data: departments } = trpc.rh.listDepartments.useQuery();
  const { data: positions } = trpc.rh.listPositions.useQuery();
  const createMutation = trpc.rh.createEmployee.useMutation();
  const updateMutation = trpc.rh.updateEmployee.useMutation();
  const deleteMutation = trpc.rh.deleteEmployee.useMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "", cpf: "", email: "", phone: "",
    positionId: undefined as number | undefined,
    departmentId: undefined as number | undefined,
    hireDate: "", salary: "", helpCost: "", commissionPercent: "", status: "ativo",
    address: "", emergencyContact: "", emergencyPhone: "", notes: "",
  });

  const handleSubmit = () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    const data = { ...form, positionId: form.positionId, departmentId: form.departmentId };
    if (editId) {
      updateMutation.mutate({ id: editId, ...data }, {
        onSuccess: () => { toast.success("Funcionário atualizado!"); setDialogOpen(false); refetch(); },
        onError: () => toast.error("Erro ao atualizar"),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => { toast.success("Funcionário cadastrado!"); setDialogOpen(false); refetch(); },
        onError: () => toast.error("Erro ao cadastrar"),
      });
    }
  };

  const handleEdit = (emp: any) => {
    setEditId(emp.id);
    setForm({
      name: emp.name, cpf: emp.cpf || "", email: emp.email || "", phone: emp.phone || "",
      positionId: emp.positionId || undefined, departmentId: emp.departmentId || undefined,
      hireDate: emp.hireDate || "", salary: emp.salary || "", helpCost: emp.helpCost || "", commissionPercent: emp.commissionPercent || "", status: emp.status,
      address: emp.address || "", emergencyContact: emp.emergencyContact || "",
      emergencyPhone: emp.emergencyPhone || "", notes: emp.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este funcionário?")) {
      deleteMutation.mutate({ id }, { onSuccess: () => { toast.success("Excluído!"); refetch(); } });
    }
  };

  const statusColors: Record<string, string> = {
    ativo: "bg-green-100 text-green-700",
    ativo_ferias: "bg-yellow-100 text-yellow-700",
    desligado: "bg-red-100 text-red-700",
    afastado: "bg-slate-100 text-slate-700",
  };

  const statusLabels: Record<string, string> = {
    ativo: "Ativo",
    ativo_ferias: "Férias",
    desligado: "Desligado",
    afastado: "Afastado",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Buscar por nome, CPF ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setEditId(null); setForm({ name: "", cpf: "", email: "", phone: "", hireDate: "", salary: "", helpCost: "", commissionPercent: "", status: "ativo", address: "", emergencyContact: "", emergencyPhone: "", notes: "" }); } setDialogOpen(o); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={16} /> Novo Funcionário</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Funcionário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Departamento</Label>
                  <Select value={form.departmentId ? String(form.departmentId) : undefined} onValueChange={(v) => setForm({ ...form, departmentId: Number(v) })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {departments?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Cargo</Label>
                  <Select value={form.positionId ? String(form.positionId) : undefined} onValueChange={(v) => setForm({ ...form, positionId: Number(v) })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {positions?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Data Admissão</Label><Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Salário (R$)</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Ajuda de Custo (R$)</Label><Input type="number" value={form.helpCost} onChange={(e) => setForm({ ...form, helpCost: e.target.value })} placeholder="0,00" /></div>
                <div className="space-y-1.5"><Label>Comissão Vendas (%)</Label><Input type="number" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })} placeholder="0,00" step="0.01" /></div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="ativo_ferias">Ativo (Férias)</SelectItem>
                    <SelectItem value="afastado">Afastado</SelectItem>
                    <SelectItem value="desligado">Desligado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Contato Emergência</Label><Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Tel. Emergência</Label><Input value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <Button onClick={handleSubmit} className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="p-2">Nome</th>
              <th className="p-2 hidden md:table-cell">Departamento</th>
              <th className="p-2 hidden lg:table-cell">Cargo</th>
              <th className="p-2 hidden lg:table-cell">Admissão</th>
              <th className="p-2">Status</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-500">Carregando...</td></tr>
            ) : employees?.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-500">Nenhum funcionário encontrado</td></tr>
            ) : (
              employees?.map((emp) => {
                const dept = departments?.find(d => d.id === emp.departmentId);
                const pos = positions?.find(p => p.id === emp.positionId);
                return (
                  <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.email || emp.phone || ""}</p>
                      </div>
                    </td>
                    <td className="p-2 hidden md:table-cell">{dept?.name || "-"}</td>
                    <td className="p-2 hidden lg:table-cell">{pos?.title || "-"}</td>
                    <td className="p-2 hidden lg:table-cell">{emp.hireDate || "-"}</td>
                    <td className="p-2"><Badge className={statusColors[emp.status] || "bg-slate-100"}>{statusLabels[emp.status] || emp.status}</Badge></td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)}><Edit size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)} className="text-red-500"><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== Departments Tab ====================
function DepartmentsTab() {
  const { data: departments, refetch } = trpc.rh.listDepartments.useQuery();
  const createMutation = trpc.rh.createDepartment.useMutation();
  const deleteMutation = trpc.rh.deleteDepartment.useMutation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name) { toast.error("Nome é obrigatório"); return; }
    createMutation.mutate({ name, description: description || undefined }, {
      onSuccess: () => { toast.success("Departamento criado!"); setName(""); setDescription(""); refetch(); },
      onError: () => toast.error("Erro ao criar"),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3">
            <Input placeholder="Nome do departamento" value={name} onChange={(e) => setName(e.target.value)} className="min-h-[44px]" />
            <Input placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[44px]" />
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="min-h-[44px] sm:w-auto w-full">
              <Plus size={16} /> Criar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {departments?.map((dept) => (
          <Card key={dept.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 size={20} className="text-blue-500" />
                <div>
                  <p className="font-medium">{dept.name}</p>
                  <p className="text-xs text-slate-500">{dept.description || "Sem descrição"}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => {
                if (confirm("Excluir departamento?")) {
                  deleteMutation.mutate({ id: dept.id }, { onSuccess: () => refetch() });
                }
              }} className="text-red-400"><Trash2 size={14} /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ==================== Positions Tab ====================
function PositionsTab() {
  const { data: positions, refetch } = trpc.rh.listPositions.useQuery();
  const createMutation = trpc.rh.createPosition.useMutation();
  const deleteMutation = trpc.rh.deletePosition.useMutation();
  const [title, setTitle] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const handleCreate = () => {
    if (!title) { toast.error("Título é obrigatório"); return; }
    createMutation.mutate({ title, salaryMin: salaryMin || undefined, salaryMax: salaryMax || undefined }, {
      onSuccess: () => { toast.success("Cargo criado!"); setTitle(""); setSalaryMin(""); setSalaryMax(""); refetch(); },
      onError: () => toast.error("Erro ao criar"),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3">
            <Input placeholder="Título do cargo" value={title} onChange={(e) => setTitle(e.target.value)} className="min-h-[44px]" />
            <Input placeholder="Salário mín." value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} type="number" className="min-h-[44px]" />
            <Input placeholder="Salário máx." value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} type="number" />
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <Plus size={16} /> Criar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-600">
              <th className="p-2">Cargo</th>
              <th className="p-2 hidden md:table-cell">Salário Mín.</th>
              <th className="p-2 hidden md:table-cell">Salário Máx.</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {positions?.map((pos) => (
              <tr key={pos.id} className="border-b hover:bg-slate-50">
                <td className="p-2 font-medium">{pos.title}</td>
                <td className="p-2 hidden md:table-cell">{pos.salaryMin ? `R$ ${Number(pos.salaryMin).toLocaleString()}` : "-"}</td>
                <td className="p-2 hidden md:table-cell">{pos.salaryMax ? `R$ ${Number(pos.salaryMax).toLocaleString()}` : "-"}</td>
                <td className="p-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (confirm("Excluir cargo?")) {
                      deleteMutation.mutate({ id: pos.id }, { onSuccess: () => refetch() });
                    }
                  }} className="text-red-400"><Trash2 size={14} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== Leaves Tab ====================
// ==================== Commissions Tab ====================
function CommissionsTab() {
  const { data: commissions, refetch } = trpc.rh.listCommissions.useQuery({}, { refetchInterval: 5000 });
  const { data: summary, refetch: refetchSummary } = trpc.rh.commissionSummary.useQuery({}, { refetchInterval: 5000 });
  const { data: employees } = trpc.rh.listEmployees.useQuery({});
  const createMutation = trpc.rh.createCommission.useMutation();
  const updateMutation = trpc.rh.updateCommissionStatus.useMutation({
    onSuccess: () => {
      refetch();
      refetchSummary();
    },
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    employeeId: undefined as number | undefined,
    vehicleDescription: "",
    salePrice: "",
    commissionPercent: "",
    helpCost: "",
    month: new Date().toISOString().slice(0, 7),
    notes: "",
  });

  const handleSubmit = () => {
    if (!form.employeeId || !form.salePrice || !form.commissionPercent) {
      toast.error("Funcionário, preço de venda e % de comissão são obrigatórios");
      return;
    }
    createMutation.mutate(form as any, {
      onSuccess: (res: any) => {
        toast.success(`Comissão de R$ ${parseFloat(res.commissionAmount).toFixed(2)} calculada!`);
        setDialogOpen(false);
        refetch();
        refetchSummary();
      },
      onError: () => toast.error("Erro ao criar comissão"),
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-slate-500">Total Comissões (Mês)</p><p className="text-xl font-bold text-blue-600">R$ {summary?.totalCommission.toFixed(2) || "0.00"}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-slate-500">Ajuda de Custo (Mês)</p><p className="text-xl font-bold text-green-600">R$ {summary?.totalHelpCost.toFixed(2) || "0.00"}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-slate-500">Pagas</p><p className="text-xl font-bold text-emerald-600">{summary?.paid || 0}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-slate-500">Pendentes</p><p className="text-xl font-bold text-amber-600">{summary?.pending || 0}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setForm({ employeeId: undefined, vehicleDescription: "", salePrice: "", commissionPercent: "", helpCost: "", month: new Date().toISOString().slice(0, 7), notes: "" }); } setDialogOpen(o); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={16} /> Nova Comissão</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nova Comissão de Venda</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Funcionário *</Label>
                <Select value={form.employeeId ? String(form.employeeId) : undefined} onValueChange={(v) => setForm({ ...form, employeeId: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o funcionário..." /></SelectTrigger>
                  <SelectContent>
                    {employees?.map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.commissionPercent || 0}%)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Veículo (marca/modelo/ano)</Label><Input value={form.vehicleDescription} onChange={(e) => setForm({ ...form, vehicleDescription: e.target.value })} placeholder="Ex: Honda Civic 2024" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Preço de Venda (R$)</Label><Input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Comissão (%)</Label><Input type="number" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })} step="0.01" /></div>
              </div>
              <div className="space-y-1.5"><Label>Ajuda de Custo (R$)</Label><Input type="number" value={form.helpCost} onChange={(e) => setForm({ ...form, helpCost: e.target.value })} placeholder="0,00" /></div>
              <div className="space-y-1.5"><Label>Mês</Label><Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <Button onClick={handleSubmit} className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Calcular e Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Commissions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="p-2">Funcionário</th>
              <th className="p-2 hidden md:table-cell">Veículo</th>
              <th className="p-2">Preço Venda</th>
              <th className="p-2">Comissão %</th>
              <th className="p-2">Comissão R$</th>
              <th className="p-2 hidden md:table-cell">Ajuda Custo</th>
              <th className="p-2 hidden lg:table-cell">Mês</th>
              <th className="p-2">Status</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {commissions?.map(({ commission, employee }: any) => (
              <tr key={commission.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2">{employee?.name || "-"}</td>
                <td className="p-2 hidden md:table-cell">{commission.vehicleDescription || "-"}</td>
                <td className="p-2">R$ {parseFloat(commission.salePrice || "0").toFixed(2)}</td>
                <td className="p-2">{commission.commissionPercent}%</td>
                <td className="p-2 font-semibold text-blue-600">R$ {parseFloat(commission.commissionAmount || "0").toFixed(2)}</td>
                <td className="p-2 hidden md:table-cell">R$ {parseFloat(commission.helpCost || "0").toFixed(2)}</td>
                <td className="p-2 hidden lg:table-cell">{commission.month || "-"}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    commission.status === "pago" ? "bg-green-100 text-green-700" :
                    commission.status === "pendente" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>
                    {commission.status === "pago" ? "Pago" : commission.status === "pendente" ? "Pendente" : "Cancelado"}
                  </span>
                </td>
                <td className="p-2">
                  {commission.status === "pendente" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: commission.id, status: "pago" })}>
                        <UserCheck size={12} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: commission.id, status: "cancelado" })}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!commissions?.length && (
              <tr><td colSpan={9} className="p-8 text-center text-slate-500">Nenhuma comissão registrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeavesTab() {
  const { data: leaves, refetch } = trpc.rh.listLeaveRequests.useQuery();
  const { data: employees } = trpc.rh.listEmployees.useQuery();
  const createMutation = trpc.rh.createLeaveRequest.useMutation();
  const updateMutation = trpc.rh.updateLeaveStatus.useMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: undefined as number | undefined, type: "ferias", startDate: "", endDate: "", reason: "" });

  const handleCreate = () => {
    if (!form.employeeId || !form.startDate || !form.endDate) { toast.error("Preencha todos os campos obrigatórios"); return; }
    createMutation.mutate(form as any, {
      onSuccess: () => { toast.success("Solicitação criada!"); setDialogOpen(false); refetch(); },
      onError: () => toast.error("Erro ao criar"),
    });
  };

  const handleStatus = (id: number, status: "aprovado" | "rejeitado") => {
    updateMutation.mutate({ id, status }, {
      onSuccess: () => { toast.success(`Solicitação ${status === "aprovado" ? "aprovada" : "rejeitada"}!`); refetch(); },
      onError: () => toast.error("Erro ao atualizar"),
    });
  };

  const statusColors: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-700",
    aprovado: "bg-green-100 text-green-700",
    rejeitado: "bg-red-100 text-red-700",
    cancelado: "bg-slate-100 text-slate-700",
  };

  const typeLabels: Record<string, string> = {
    ferias: "Férias",
    licenca_medica: "Licença Médica",
    licenca_maternidade: "Licença Maternidade",
    folga: "Folga",
    falta_justificada: "Falta Justificada",
    falta_injustificada: "Falta Injustificada",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Solicitações de Ausência</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={16} /> Nova Solicitação</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nova Solicitação de Ausência</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Funcionário *</Label>
                <Select value={form.employeeId ? String(form.employeeId) : undefined} onValueChange={(v) => setForm({ ...form, employeeId: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {employees?.filter(e => e.status === "ativo" || e.status === "ativo_ferias").map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ferias">Férias</SelectItem>
                    <SelectItem value="licenca_medica">Licença Médica</SelectItem>
                    <SelectItem value="licenca_maternidade">Licença Maternidade</SelectItem>
                    <SelectItem value="folga">Folga</SelectItem>
                    <SelectItem value="falta_justificada">Falta Justificada</SelectItem>
                    <SelectItem value="falta_injustificada">Falta Injustificada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Data Início *</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Data Fim *</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Motivo</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} /></div>
              <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>Enviar Solicitação</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {leaves?.map((item) => (
          <Card key={item.leave.id}>
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-slate-400" />
                <div>
                  <p className="font-medium text-sm">{item.employee.name}</p>
                  <p className="text-xs text-slate-500">{typeLabels[item.leave.type] || item.leave.type} | {item.leave.startDate} → {item.leave.endDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[item.leave.status]}>{item.leave.status}</Badge>
                {item.leave.status === "pendente" && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-300" onClick={() => handleStatus(item.leave.id, "aprovado")}>Aprovar</Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => handleStatus(item.leave.id, "rejeitado")}>Rejeitar</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ==================== Attendance Tab ====================
function AttendanceTab() {
  const { data: attendance, refetch } = trpc.rh.listAttendance.useQuery({ date: new Date().toISOString().split("T")[0] });
  const { data: employees } = trpc.rh.listEmployees.useQuery();
  const createMutation = trpc.rh.createAttendance.useMutation();
  const [form, setForm] = useState({ employeeId: undefined as number | undefined, clockIn: "", clockOut: "", type: "presencial" });

  const handleCreate = () => {
    if (!form.employeeId || !form.clockIn) { toast.error("Selecione funcionário e horário de entrada"); return; }
    createMutation.mutate({
      ...form,
      date: new Date().toISOString().split("T")[0],
      employeeId: form.employeeId,
    } as any, {
      onSuccess: () => { toast.success("Ponto registrado!"); setForm({ employeeId: undefined, clockIn: "", clockOut: "", type: "presencial" }); refetch(); },
      onError: () => toast.error("Erro ao registrar"),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Registrar Ponto - Hoje ({new Date().toLocaleDateString("pt-BR")})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_auto_auto_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Funcionário</Label>
              <Select value={form.employeeId ? String(form.employeeId) : undefined} onValueChange={(v) => setForm({ ...form, employeeId: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {employees?.filter(e => e.status === "ativo").map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Entrada</Label>
              <Input type="time" value={form.clockIn} onChange={(e) => setForm({ ...form, clockIn: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Saída</Label>
              <Input type="time" value={form.clockOut} onChange={(e) => setForm({ ...form, clockOut: e.target.value })} />
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending} size="sm">Registrar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-600">
              <th className="p-2">Funcionário</th>
              <th className="p-2">Data</th>
              <th className="p-2">Entrada</th>
              <th className="p-2">Saída</th>
              <th className="p-2 hidden md:table-cell">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {attendance?.map((item) => (
              <tr key={item.attendance.id} className="border-b hover:bg-slate-50">
                <td className="p-2 font-medium">{item.employee.name}</td>
                <td className="p-2">{item.attendance.date}</td>
                <td className="p-2">{item.attendance.clockIn || "-"}</td>
                <td className="p-2">{item.attendance.clockOut || "-"}</td>
                <td className="p-2 hidden md:table-cell">{item.attendance.type}</td>
              </tr>
            ))}
            {(!attendance || attendance.length === 0) && (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500">Nenhum registro hoje</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== Holidays Tab ====================
function HolidaysTab() {
  const { data: holidays, refetch } = trpc.rh.listHolidays.useQuery();
  const createMutation = trpc.rh.createHoliday.useMutation();
  const deleteMutation = trpc.rh.deleteHoliday.useMutation();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  const handleCreate = () => {
    if (!name || !date) { toast.error("Preencha nome e data"); return; }
    createMutation.mutate({ name, date }, {
      onSuccess: () => { toast.success("Feriado adicionado!"); setName(""); setDate(""); refetch(); },
      onError: () => toast.error("Erro ao criar"),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_auto_auto] gap-3 items-end">
            <Input placeholder="Nome do feriado" value={name} onChange={(e) => setName(e.target.value)} className="min-h-[44px]" />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-[44px]" />
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="min-h-[44px] w-full sm:w-auto"><Plus size={16} /> Adicionar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {holidays?.map((h) => (
          <Card key={h.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays size={18} className="text-blue-500" />
                <div>
                  <p className="font-medium text-sm">{h.name}</p>
                  <p className="text-xs text-slate-500">{h.date}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => {
                if (confirm("Excluir feriado?")) {
                  deleteMutation.mutate({ id: h.id }, { onSuccess: () => refetch() });
                }
              }} className="text-red-400"><Trash2 size={14} /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
