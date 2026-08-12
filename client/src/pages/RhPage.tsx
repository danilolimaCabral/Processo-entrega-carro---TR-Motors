import { useState, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
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
  Shirt, FileText, ClipboardCheck, FolderArchive, BriefcaseBusiness,
  GraduationCap, ScrollText, UserPlus, Menu, X, LogOut, ArrowLeft,
  Receipt, BookOpen, UserCog, ChevronRight, Upload,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

type Tab = "dashboard" | "funcionarios" | "departamentos" | "cargos" | "uniformes" | "desligamento" | "documentos" | "vagas" | "candidatos" | "auditoria" | "ead" | "usuarios";

const documentFileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("Não foi possível ler o arquivo selecionado."));
  reader.onload = () => {
    const result = reader.result;
    if (typeof result !== "string" || !result.includes(",")) {
      reject(new Error("Arquivo inválido."));
      return;
    }
    resolve(result.split(",")[1]);
  };
  reader.readAsDataURL(file);
});

const isAcceptedDocumentFile = (file: File) => ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type);

const navGroups: { label: string; items: { id: Tab; label: string; icon: any }[] }[] = [
  {
    label: "",
    items: [
      { id: "dashboard", label: "Dashboard", icon: Activity },
      { id: "ead", label: "EAD Videoaulas", icon: BookOpen },
    ],
  },
  {
    label: "GESTÃO DE PESSOAS",
    items: [
      { id: "funcionarios", label: "Funcionários", icon: Users },
    ],
  },
  {
    label: "OPERACIONAL",
    items: [
      { id: "uniformes", label: "Uniformes", icon: Shirt },
    ],
  },
  {
    label: "GESTÃO",
    items: [
      { id: "desligamento", label: "Desligamento", icon: ClipboardCheck },
      { id: "documentos", label: "Documentos", icon: FolderArchive },
      { id: "vagas", label: "Vagas", icon: BriefcaseBusiness },
      { id: "candidatos", label: "Candidatos", icon: UserPlus },
    ],
  },
];

export default function RhPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeLabel = navGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || "RH";
  const handleLogout = () => { logout(); setLocation("/"); };
  const goBack = () => setLocation("/dashboard");

  return (
    <div className="min-h-screen bg-gray-100 flex rh-no-scrollbar">
      {/* ============ SIDEBAR RH - DESKTOP ============ */}
      <aside className="hidden lg:flex flex-col w-56 bg-gray-950 fixed inset-y-0 left-0 z-40">
        {/* Logo + Back */}
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <button onClick={goBack} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div className="bg-red-600 rounded-lg p-1.5">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Recursos</p>
              <p className="text-xs text-gray-500">Humanos</p>
            </div>
          </div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-3 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {navGroups.map((group, gi) => (
            <div key={gi} className="space-y-1">
              {group.label && (
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">{group.label}</p>
              )}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all min-h-[40px] ${
                    activeTab === item.id
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        {/* User + Logout */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || "Usuário"}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || "rh"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors min-h-[40px]"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* ============ SIDEBAR RH - MOBILE (drawer) ============ */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-gray-950 shadow-2xl">
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={goBack} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <div className="bg-red-600 rounded-lg p-1.5">
                  <Users size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Recursos</p>
                  <p className="text-xs text-gray-500">Humanos</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-2 space-y-3 overflow-y-auto">
              {navGroups.map((group, gi) => (
                <div key={gi} className="space-y-1">
                  {group.label && (
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">{group.label}</p>
                  )}
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all min-h-[40px] ${
                        activeTab === item.id
                          ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            <div className="p-3 border-t border-gray-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors min-h-[40px]"
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 lg:ml-56 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-gray-900 text-white shrink-0"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-red-600" />
            <h2 className="text-lg font-bold text-gray-900">{activeLabel}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "funcionarios" && <EmployeesTab search={search} setSearch={setSearch} />}
          {activeTab === "departamentos" && <DepartmentsTab />}
          {activeTab === "cargos" && <PositionsTab />}
          {activeTab === "uniformes" && <UniformsTab />}
          {activeTab === "desligamento" && <ExitChecklistTab />}
          {activeTab === "documentos" && <EmployeeDocumentsTab />}
          {activeTab === "vagas" && <VacanciesTab />}
          {activeTab === "candidatos" && <CandidatesTab />}
          {activeTab === "auditoria" && <AuditLogsTab />}
          {activeTab === "ead" && <EadLinkTab />}
          {activeTab === "usuarios" && <CreateUsersTab />}
        </div>
      </main>
    </div>
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
  const { user } = useAuth();
  const { data: employees, isLoading, refetch } = trpc.rh.listEmployees.useQuery({ search: search || undefined });
  const { data: departments } = trpc.rh.listDepartments.useQuery();
  const { data: positions } = trpc.rh.listPositions.useQuery();
  const utils = trpc.useUtils();
  const createMutation = trpc.rh.createEmployee.useMutation();
  const updateMutation = trpc.rh.updateEmployee.useMutation();
  const deleteMutation = trpc.rh.deleteEmployee.useMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string; role: string } | null>(null);
  // RH gerencia o processo; o administrador mantém acesso de superusuário.
  const canManageEmployees = user?.role === "rh" || user?.role === "admin";

  const [form, setForm] = useState({
    name: "", cpf: "", email: "", phone: "",
    positionId: undefined as number | undefined,
    departmentId: undefined as number | undefined,
    hireDate: "", salary: "", helpCost: "", commissionPercent: "", status: "ativo",
    address: "", emergencyContact: "", emergencyPhone: "", notes: "", accessRole: "vendedor" as "vendedor" | "gerente" | "financeiro" | "administrativo" | "aluno" | "rh",
  });

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!editId && !form.email.trim()) { toast.error("E-mail é obrigatório para criar o acesso do funcionário"); return; }
    const optional = (value: string) => value.trim() || undefined;
    const { accessRole, ...employeeForm } = form;
    const data = {
      ...employeeForm,
      name: employeeForm.name.trim(),
      cpf: optional(employeeForm.cpf),
      email: optional(employeeForm.email),
      phone: optional(employeeForm.phone),
      hireDate: optional(employeeForm.hireDate),
      salary: optional(employeeForm.salary),
      helpCost: optional(employeeForm.helpCost),
      commissionPercent: optional(employeeForm.commissionPercent),
      address: optional(employeeForm.address),
      emergencyContact: optional(employeeForm.emergencyContact),
      emergencyPhone: optional(employeeForm.emergencyPhone),
      notes: optional(employeeForm.notes),
      positionId: employeeForm.positionId,
      departmentId: employeeForm.departmentId,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, ...data }, {
        onSuccess: async () => {
          toast.success("Funcionário atualizado!");
          setDialogOpen(false);
          await utils.rh.listEmployees.invalidate();
        },
        onError: (error) => toast.error(error.message || "Não foi possível atualizar o funcionário"),
      });
    } else {
      createMutation.mutate({ ...data, email: form.email.trim(), accessRole }, {
        onSuccess: async (result) => {
          toast.success("Funcionário e acesso cadastrados!");
          setDialogOpen(false);
          await utils.rh.listEmployees.invalidate();
          setCreatedCredentials({ name: form.name.trim(), email: form.email.trim(), password: result.temporaryPassword, role: result.accessRole });
        },
        onError: (error) => toast.error(error.message || "Não foi possível cadastrar o funcionário"),
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
      emergencyPhone: emp.emergencyPhone || "", notes: emp.notes || "", accessRole: "vendedor",
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
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setEditId(null); setForm({ name: "", cpf: "", email: "", phone: "", positionId: undefined, departmentId: undefined, hireDate: "", salary: "", helpCost: "", commissionPercent: "", status: "ativo", address: "", emergencyContact: "", emergencyPhone: "", notes: "", accessRole: "vendedor" }); } setDialogOpen(o); }}>
          {canManageEmployees && <DialogTrigger asChild>
            <Button size="sm"><Plus size={16} /> Novo Funcionário</Button>
          </DialogTrigger>}
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Funcionário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>{editId ? "Email" : "Email para acesso *"}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              {!editId && <div className="space-y-1.5">
                <Label>Perfil de acesso</Label>
                <Select value={form.accessRole} onValueChange={(value) => setForm({ ...form, accessRole: value as typeof form.accessRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="aluno">Aluno</SelectItem>
                    <SelectItem value="rh">RH</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Uma senha temporária segura será criada e exibida apenas ao RH após o cadastro.</p>
              </div>}
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
                  <tr key={emp.id} onClick={() => setSelectedEmployee(emp)} className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-red-50/50">
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
                        <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); setSelectedEmployee(emp); }} className="hidden h-8 gap-1 sm:inline-flex"><span>Ficha</span><ChevronRight size={14} /></Button>
                        {canManageEmployees && <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); handleEdit(emp); }}><Edit size={14} /></Button>}
                        {canManageEmployees && <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); handleDelete(emp.id); }} className="text-red-500"><Trash2 size={14} /></Button>}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <EmployeeProfileDialog
        employee={selectedEmployee}
        departments={departments}
        positions={positions}
        open={Boolean(selectedEmployee)}
        onOpenChange={(open) => { if (!open) setSelectedEmployee(null); }}
      />
      <Dialog open={Boolean(createdCredentials)} onOpenChange={(open) => { if (!open) setCreatedCredentials(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Acesso criado para {createdCredentials?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">Guarde e entregue esta senha ao colaborador. Por segurança, ela só é exibida nesta confirmação.</p>
            <div><Label>Email</Label><Input readOnly value={createdCredentials?.email || ""} /></div>
            <div><Label>Senha temporária</Label><Input readOnly value={createdCredentials?.password || ""} /></div>
            <div><Label>Perfil</Label><Input readOnly value={createdCredentials?.role || ""} /></div>
            <Button className="w-full" onClick={() => setCreatedCredentials(null)}>Concluído</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Ficha do Colaborador ====================
function EmployeeProfileDialog({ employee, departments, positions, open, onOpenChange }: {
  employee: any | null;
  departments?: any[];
  positions?: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [profileTab, setProfileTab] = useState<"dados" | "uniformes" | "documentos">("dados");
  const [showUniformForm, setShowUniformForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [uniformForm, setUniformForm] = useState({ type: "", size: "", quantity: "1", dateIssued: "", status: "entregue" });
  const [documentForm, setDocumentForm] = useState<{ category: string; documentName: string; expiryDate: string; file: File | null }>({ category: "", documentName: "", expiryDate: "", file: null });
  const employeeId = employee?.id;
  const { data: uniforms } = trpc.rh.listUniforms.useQuery(
    employeeId ? { employeeId } : undefined,
    { enabled: Boolean(employeeId) },
  );
  const { data: documents } = trpc.rh.listEmployeeDocuments.useQuery(
    employeeId ? { employeeId } : undefined,
    { enabled: Boolean(employeeId) },
  );
  const createUniform = trpc.rh.createUniform.useMutation({
    onSuccess: async () => {
      await utils.rh.listUniforms.invalidate();
      setUniformForm({ type: "", size: "", quantity: "1", dateIssued: "", status: "entregue" });
      setShowUniformForm(false);
      toast.success("Uniforme vinculado ao colaborador");
    },
    onError: (error) => toast.error(error.message || "Não foi possível registrar o uniforme"),
  });
  const deleteUniform = trpc.rh.deleteUniform.useMutation({
    onSuccess: async () => { await utils.rh.listUniforms.invalidate(); toast.success("Uniforme removido"); },
    onError: (error) => toast.error(error.message),
  });
  const uploadDocument = trpc.rh.uploadEmployeeDocument.useMutation({
    onSuccess: async () => {
      await utils.rh.listEmployeeDocuments.invalidate();
      setDocumentForm({ category: "", documentName: "", expiryDate: "", file: null });
      setShowDocumentForm(false);
      toast.success("Arquivo armazenado na Pasta Digital");
    },
    onError: (error) => toast.error(error.message || "Não foi possível enviar o arquivo"),
  });
  const deleteDocument = trpc.rh.deleteEmployeeDocument.useMutation({
    onSuccess: async () => { await utils.rh.listEmployeeDocuments.invalidate(); toast.success("Documento removido"); },
    onError: (error) => toast.error(error.message),
  });

  if (!employee) return null;

  const department = departments?.find((item) => item.id === employee.departmentId);
  const position = positions?.find((item) => item.id === employee.positionId);
  const requiredDocuments = [
    { name: "Carteira de Trabalho (CTPS)", category: "Admissão" },
    { name: "RG / CNH", category: "Identificação" },
    { name: "CPF", category: "Identificação" },
    { name: "Comprovante de Residência", category: "Comprovante" },
    { name: "Exame Admissional", category: "Exame Médico" },
  ];
  const statusLabel: Record<string, string> = { ativo: "Ativo", ativo_ferias: "Em férias", afastado: "Afastado", desligado: "Desligado" };
  const statusClass: Record<string, string> = { ativo: "bg-emerald-100 text-emerald-700", ativo_ferias: "bg-amber-100 text-amber-700", afastado: "bg-slate-100 text-slate-700", desligado: "bg-red-100 text-red-700" };
  const categories = ["Identificação", "Admissão", "Exame Médico", "Formação", "Comprovante", "Nota Fiscal / Recibo", "Outro"];
  const hasDocument = (name: string) => documents?.some((document: any) => document.documentName.trim().toLowerCase() === name.toLowerCase());
  const openRequiredDocument = (name: string, category: string) => {
    setDocumentForm({ category, documentName: name, expiryDate: "", file: null });
    setShowDocumentForm(true);
  };
  const selectProfileDocumentFile = (file: File | null) => {
    if (!file) return;
    if (!isAcceptedDocumentFile(file) || file.size > 10 * 1024 * 1024) {
      toast.error("Envie um PDF, JPG, PNG ou WEBP de até 10 MB.");
      return;
    }
    setDocumentForm((current) => ({
      ...current,
      file,
      documentName: current.documentName || file.name.replace(/\.[^.]+$/, ""),
    }));
  };
  const submitProfileDocument = async () => {
    if (!documentForm.file) {
      toast.error("Selecione o arquivo que deseja armazenar.");
      return;
    }
    try {
      const fileData = await documentFileToBase64(documentForm.file);
      uploadDocument.mutate({
        employeeId: employee.id,
        category: documentForm.category,
        documentName: documentForm.documentName.trim(),
        expiryDate: documentForm.expiryDate || undefined,
        filename: documentForm.file.name,
        mimeType: documentForm.file.type as "application/pdf" | "image/jpeg" | "image/png" | "image/webp",
        fileData,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível preparar o arquivo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-5 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-300">Ficha do colaborador</p>
              <DialogTitle className="mt-1 text-2xl text-white">{employee.name}</DialogTitle>
              <p className="mt-1 text-sm text-slate-300">{position?.title || "Cargo não informado"} · {department?.name || "Departamento não informado"}</p>
            </div>
            <Badge className={statusClass[employee.status] || "bg-slate-100 text-slate-700"}>{statusLabel[employee.status] || employee.status}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 pb-6 pt-5">
          <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {[
              { id: "dados", label: "Dados" },
              { id: "uniformes", label: `Uniformes${uniforms?.length ? ` (${uniforms.length})` : ""}` },
              { id: "documentos", label: `Documentos${documents?.length ? ` (${documents.length})` : ""}` },
            ].map((tab) => (
              <button key={tab.id} type="button" onClick={() => setProfileTab(tab.id as "dados" | "uniformes" | "documentos")} className={profileTab === tab.id ? "rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm" : "rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"}>{tab.label}</button>
            ))}
          </div>

          {profileTab === "dados" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ProfileField label="CPF" value={employee.cpf} />
                <ProfileField label="E-mail" value={employee.email} />
                <ProfileField label="Telefone" value={employee.phone} />
                <ProfileField label="Admissão" value={employee.hireDate} />
                <ProfileField label="Departamento" value={department?.name} />
                <ProfileField label="Cargo" value={position?.title} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileField label="Endereço" value={employee.address} />
                <ProfileField label="Contato de emergência" value={[employee.emergencyContact, employee.emergencyPhone].filter(Boolean).join(" · ")} />
              </div>
              {employee.notes && <Card className="border-slate-200"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observações</p><p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{employee.notes}</p></CardContent></Card>}
            </div>
          )}

          {profileTab === "uniformes" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold text-slate-900">Uniformes vinculados</h4><p className="text-sm text-slate-500">Registre entregas e pendências deste colaborador.</p></div><Button onClick={() => setShowUniformForm((visible) => !visible)} className="bg-red-600 hover:bg-red-700"><Plus className="mr-1 h-4 w-4" /> Novo uniforme</Button></div>
              {showUniformForm && <Card className="border-red-100 bg-red-50/40"><CardContent className="grid gap-3 p-4 sm:grid-cols-2"><Input placeholder="Tipo (ex.: Camisa polo)" value={uniformForm.type} onChange={(event) => setUniformForm({ ...uniformForm, type: event.target.value })} /><Select value={uniformForm.size || undefined} onValueChange={(value) => setUniformForm({ ...uniformForm, size: value })}><SelectTrigger><SelectValue placeholder="Tamanho" /></SelectTrigger><SelectContent>{["PP", "P", "M", "G", "GG", "XG"].map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}</SelectContent></Select><Input type="number" min="1" placeholder="Quantidade" value={uniformForm.quantity} onChange={(event) => setUniformForm({ ...uniformForm, quantity: event.target.value })} /><Input type="date" value={uniformForm.dateIssued} onChange={(event) => setUniformForm({ ...uniformForm, dateIssued: event.target.value })} /><Select value={uniformForm.status} onValueChange={(value) => setUniformForm({ ...uniformForm, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="entregue">Entregue</SelectItem><SelectItem value="solicitado">Solicitado</SelectItem><SelectItem value="pendente">Pendente</SelectItem></SelectContent></Select><Button disabled={!uniformForm.type.trim() || createUniform.isPending} onClick={() => createUniform.mutate({ employeeId: employee.id, type: uniformForm.type.trim(), size: uniformForm.size || undefined, quantity: Number(uniformForm.quantity) || 1, dateIssued: uniformForm.dateIssued || undefined, status: uniformForm.status })}>{createUniform.isPending ? "Salvando..." : "Vincular uniforme"}</Button></CardContent></Card>}
              {uniforms?.length ? uniforms.map((uniform) => <Card key={uniform.id} className="border-slate-200"><CardContent className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium text-slate-900">{uniform.type} {uniform.size && <Badge variant="secondary" className="ml-2">{uniform.size}</Badge>}</p><p className="mt-1 text-sm text-slate-500">Quantidade: {uniform.quantity} · {uniform.dateIssued ? `Entrega: ${uniform.dateIssued}` : "Data não informada"}</p></div><div className="flex items-center gap-2"><Badge variant={uniform.status === "entregue" ? "default" : "secondary"}>{uniform.status}</Badge><Button variant="ghost" size="icon" className="text-red-500" onClick={() => { if (confirm("Remover este uniforme da ficha?")) deleteUniform.mutate({ id: uniform.id }); }}><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>) : <EmptyProfileState icon={<Shirt className="h-8 w-8" />} message="Nenhum uniforme registrado para este colaborador." />}
            </div>
          )}

          {profileTab === "documentos" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold text-slate-900">Documentação vinculada</h4><p className="text-sm text-slate-500">Envie e armazene documentos obrigatórios e outros arquivos nesta ficha.</p></div><Button onClick={() => { setDocumentForm({ category: "", documentName: "", expiryDate: "", file: null }); setShowDocumentForm((visible) => !visible); }} className="bg-red-600 hover:bg-red-700"><Plus className="mr-1 h-4 w-4" /> Adicionar documento</Button></div>
              {showDocumentForm && <Card className="border-red-100 bg-red-50/40"><CardContent className="grid gap-3 p-4 sm:grid-cols-2"><Select value={documentForm.category} onValueChange={(value) => setDocumentForm({ ...documentForm, category: value })}><SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select><Input placeholder="Nome do documento" value={documentForm.documentName} onChange={(event) => setDocumentForm({ ...documentForm, documentName: event.target.value })} /><Input type="date" value={documentForm.expiryDate} onChange={(event) => setDocumentForm({ ...documentForm, expiryDate: event.target.value })} /><div className="sm:col-span-2"><Label htmlFor="profile-document-file">Arquivo</Label><Input id="profile-document-file" className="mt-1 cursor-pointer bg-white" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => selectProfileDocumentFile(event.target.files?.[0] || null)} /><p className="mt-1 text-xs text-slate-500">PDF, JPG, PNG ou WEBP, até 10 MB{documentForm.file ? ` · ${documentForm.file.name}` : ""}</p></div><Button className="sm:col-span-2" disabled={!documentForm.category || !documentForm.documentName.trim() || !documentForm.file || uploadDocument.isPending} onClick={submitProfileDocument}>{uploadDocument.isPending ? "Enviando arquivo..." : "Enviar e armazenar documento"}</Button></CardContent></Card>}
              <Card className="border-slate-200"><CardHeader className="pb-3"><CardTitle className="text-base">Documentos obrigatórios</CardTitle></CardHeader><CardContent className="space-y-2">{requiredDocuments.map((required) => { const sent = hasDocument(required.name); return <div key={required.name} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"><div className="flex items-center gap-3"><FileText className={sent ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-amber-500"} /><div><p className="text-sm font-medium text-slate-800">{required.name}</p><p className="text-xs text-slate-500">{sent ? "Documento vinculado" : "Aguardando envio"}</p></div></div>{sent ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Enviado</Badge> : <Button variant="outline" size="sm" onClick={() => openRequiredDocument(required.name, required.category)}>Enviar</Button>}</div>; })}</CardContent></Card>
              <div className="space-y-2"><h5 className="text-sm font-semibold text-slate-700">Arquivos adicionados</h5>{documents?.length ? documents.map((document) => <Card key={document.id} className="border-slate-200"><CardContent className="flex items-center justify-between gap-3 p-3"><div className="flex items-center gap-3"><FileText className="h-7 w-7 text-slate-400" /><div><p className="font-medium text-slate-800">{document.documentName}</p><p className="text-xs text-slate-500">{document.category}{document.expiryDate ? ` · Validade: ${document.expiryDate}` : ""}</p></div></div><div className="flex items-center gap-1">{document.fileUrl && <a href={document.fileUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm">Ver</Button></a>}<Button variant="ghost" size="icon" className="text-red-500" onClick={() => { if (confirm("Remover este documento da ficha?")) deleteDocument.mutate({ id: document.id }); }}><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>) : <EmptyProfileState icon={<FolderArchive className="h-8 w-8" />} message="Nenhum documento vinculado a esta ficha." />}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return <Card className="border-slate-200"><CardContent className="p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value || "Não informado"}</p></CardContent></Card>;
}

function EmptyProfileState({ icon, message }: { icon: ReactNode; message: string }) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-slate-400">{icon}<p className="mt-2 text-sm">{message}</p></div>;
}

// ==================== Departments Tab ====================
export function DepartmentsTab() {
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
export function PositionsTab() {
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

// ==================== Payroll (Folha de Pagamento) Tab ====================
function PayrollTab() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data: payroll, refetch } = trpc.rh.payrollSummary.useQuery(
    { month: selectedMonth },
    { refetchInterval: 5000 }
  );

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-blue-600" />
            <Label className="text-sm">Competência:</Label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="max-w-[180px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Total Folha (R$)</p>
            <p className="text-xl font-bold text-blue-700">
              R$ {payroll?.totals.totalPayroll.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Salários Base (R$)</p>
            <p className="text-xl font-bold text-green-700">
              R$ {payroll?.totals.totalBaseSalary.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Comissões (R$)</p>
            <p className="text-xl font-bold text-purple-700">
              R$ {payroll?.totals.totalCommissions.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Ajuda de Custo (R$)</p>
            <p className="text-xl font-bold text-amber-700">
              R$ {payroll?.totals.totalHelpCost.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Count */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Users size={16} />
        <span>{payroll?.totals.employeeCount || 0} funcionário(s) ativo(s) nesta competência</span>
      </div>

      {/* Payroll Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="p-2">Funcionário</th>
              <th className="p-2 hidden md:table-cell">Salário Base</th>
              <th className="p-2 hidden md:table-cell">Ajuda Custo</th>
              <th className="p-2 hidden md:table-cell">Comissão</th>
              <th className="p-2 hidden sm:table-cell">Dias</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {payroll?.payrollItems.map((item) => (
              <tr key={item.employeeId} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-medium">{item.employeeName}</td>
                <td className="p-2 hidden md:table-cell">R$ {item.baseSalary.toFixed(2)}</td>
                <td className="p-2 hidden md:table-cell">R$ {item.helpCost.toFixed(2)}</td>
                <td className="p-2 hidden md:table-cell">R$ {item.commission.toFixed(2)}</td>
                <td className="p-2 hidden sm:table-cell">{item.daysWorked}</td>
                <td className="p-2 font-bold text-green-700">R$ {item.totalPayroll.toFixed(2)}</td>
              </tr>
            ))}
            {(!payroll?.payrollItems || payroll.payrollItems.length === 0) && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Nenhum funcionário ativo para esta competência
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// ============================================================
// Uniformes Tab
// ============================================================
function UniformsTab() {
  const { data: uniforms, refetch } = trpc.rh.listUniforms.useQuery();
  const { data: employees } = trpc.rh.listEmployees.useQuery();
  const createUniform = trpc.rh.createUniform.useMutation({
    onSuccess: () => { toast.success("Uniforme cadastrado!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteUniform = trpc.rh.deleteUniform.useMutation({
    onSuccess: () => { toast.success("Uniforme removido!"); refetch(); },
  });

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ employeeId: "", type: "", size: "", quantity: "1", dateIssued: "", status: "entregue" });

  const handleCreate = () => {
    if (!form.employeeId || !form.type) { toast.error("Preencha funcionário e tipo"); return; }
    createUniform.mutate({
      employeeId: Number(form.employeeId),
      type: form.type,
      size: form.size || undefined,
      quantity: Number(form.quantity) || 1,
      dateIssued: form.dateIssued || undefined,
      status: form.status,
    });
    setShowDialog(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Controle de Uniformes</h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="min-h-[40px]"><Plus className="h-4 w-4 mr-1" /> Novo Uniforme</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Registrar Uniforme</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.employeeId || undefined} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
                <SelectTrigger className="min-h-[40px]"><SelectValue placeholder="Selecione o funcionário" /></SelectTrigger>
                <SelectContent>{employees?.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Tipo (ex: Camisa Polo)" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="min-h-[40px]" />
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.size || undefined} onValueChange={(v) => setForm({ ...form, size: v })}>
                  <SelectTrigger className="min-h-[40px]"><SelectValue placeholder="Tamanho" /></SelectTrigger>
                  <SelectContent>
                    {["PP", "P", "M", "G", "GG", "XG"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Qtd" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} type="number" className="min-h-[40px]" />
              </div>
              <Input placeholder="Data de entrega" value={form.dateIssued} onChange={e => setForm({ ...form, dateIssued: e.target.value })} type="date" className="min-h-[40px]" />
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="min-h-[40px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="solicitado">Solicitado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} className="w-full min-h-[40px]">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{uniforms?.length || 0}</div><div className="text-xs text-muted-foreground">Total Uniformes</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{uniforms?.filter(u => u.status === "entregue").length || 0}</div><div className="text-xs text-muted-foreground">Entregues</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-yellow-600">{uniforms?.filter(u => u.status === "pendente").length || 0}</div><div className="text-xs text-muted-foreground">Pendentes</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{uniforms?.filter(u => u.status === "solicitado").length || 0}</div><div className="text-xs text-muted-foreground">Solicitados</div></CardContent></Card>
      </div>

      {/* List */}
      <div className="space-y-2">
        {uniforms?.map(u => {
          const emp = employees?.find(e => e.id === u.employeeId);
          return (
            <Card key={u.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{u.type} <Badge variant="secondary" className="ml-2">{u.size}</Badge></p>
                  <p className="text-sm text-muted-foreground">{emp?.name || "Funcionário"} · Qtd: {u.quantity} · {u.dateIssued ? `Entrega: ${u.dateIssued}` : "Sem data"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={u.status === "entregue" ? "default" : u.status === "pendente" ? "secondary" : "outline"}>{u.status}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteUniform.mutate({ id: u.id })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!uniforms?.length && <p className="text-center text-muted-foreground py-4">Nenhum uniforme registrado</p>}
      </div>
    </div>
  );
}

// ============================================================
// NF Custos Tab
// ============================================================
function CostInvoicesTab() {
  const { data: invoices, refetch } = trpc.rh.listCostInvoices.useQuery();
  const { data: summary } = trpc.rh.costInvoicesSummary.useQuery();
  const createInvoice = trpc.rh.createCostInvoice.useMutation({
    onSuccess: () => { toast.success("NF cadastrada!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateInvoice = trpc.rh.updateCostInvoice.useMutation({
    onSuccess: () => { toast.success("NF atualizada!"); refetch(); },
  });
  const deleteInvoice = trpc.rh.deleteCostInvoice.useMutation({
    onSuccess: () => { toast.success("NF removida!"); refetch(); },
  });

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ invoiceNumber: "", supplier: "", description: "", category: "Geral", amount: "", invoiceDate: "", status: "pendente" });

  const handleCreate = () => {
    if (!form.amount) { toast.error("Informe o valor"); return; }
    createInvoice.mutate({
      invoiceNumber: form.invoiceNumber || undefined,
      supplier: form.supplier || undefined,
      description: form.description || undefined,
      category: form.category,
      amount: Number(form.amount),
      invoiceDate: form.invoiceDate || undefined,
      status: form.status,
    });
    setShowDialog(false);
  };

  const toggleStatus = (id: number, current: string) => {
    updateInvoice.mutate({ id, status: current === "pendente" ? "pago" : "pendente" });
  };

  const fmt = (val: string) => Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notas Fiscais de Custos</h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="min-h-[40px]"><Plus className="h-4 w-4 mr-1" /> Nova NF</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Cadastrar NF de Custo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Número da NF" value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} className="min-h-[40px]" />
              <Input placeholder="Fornecedor" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="min-h-[40px]" />
              <Input placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="min-h-[40px]" />
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="min-h-[40px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Geral", "EPI", "Material Escritório", "Veículo", "Combustível", "Manutenção"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Valor (R$)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} type="number" step="0.01" className="min-h-[40px]" />
              <Input placeholder="Data" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} type="date" className="min-h-[40px]" />
              <Button onClick={handleCreate} className="w-full min-h-[40px]">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{fmt(String(summary?.total || 0))}</div><div className="text-xs text-muted-foreground">Total Geral</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-red-600">{fmt(String(summary?.totalPending || 0))}</div><div className="text-xs text-muted-foreground">Pendentes</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-green-600">{fmt(String(summary?.totalPaid || 0))}</div><div className="text-xs text-muted-foreground">Pagas</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-purple-600">{summary?.count || 0}</div><div className="text-xs text-muted-foreground">NFs</div></CardContent></Card>
      </div>

      {/* List */}
      <div className="space-y-2">
        {invoices?.map(inv => (
          <Card key={inv.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{inv.supplier || "Sem fornecedor"} <Badge variant="outline" className="ml-2">{inv.category}</Badge></p>
                <p className="text-sm text-muted-foreground">{inv.description} · NF: {inv.invoiceNumber} · {String(inv.invoiceDate || "Sem data")}</p>
                <p className="text-lg font-bold text-green-600">{fmt(inv.amount)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[32px]"
                  onClick={() => toggleStatus(inv.id, inv.status || "pendente")}
                >
                  {inv.status === "pendente" ? "Marcar Pago" : "Marcar Pendente"}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteInvoice.mutate({ id: inv.id })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!invoices?.length && <p className="text-center text-muted-foreground py-4">Nenhuma NF registrada</p>}
      </div>
    </div>
  );
}


// ===================== CHECKLIST DE SAÍDA (DESLIGAMENTO) =====================
function ExitChecklistTab() {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ employeeName: "", reason: "" });
  const utils = trpc.useUtils();

  const { data: checklists } = trpc.rh.listExitChecklists.useQuery();
  const createChecklist = trpc.rh.createExitChecklist.useMutation({
    onSuccess: () => { utils.invalidate(); setShowDialog(false); toast.success("Checklist criado"); setForm({ employeeName: "", reason: "" }); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const updateItem = trpc.rh.updateExitChecklistItem.useMutation({ onSuccess: () => utils.invalidate() });

  const sectors = ["RH", "TI", "Financeiro", "Operacional", "Direção"];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Checklist de Saída (Desligamento)</h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button className="min-h-[40px]"><Plus className="h-4 w-4 mr-1" /> Novo Desligamento</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Checklist de Saída</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome do funcionário" value={form.employeeName} onChange={e => setForm({ ...form, employeeName: e.target.value })} className="min-h-[40px]" />
              <Input placeholder="Motivo" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="min-h-[40px]" />
              <Button onClick={() => createChecklist.mutate({ employeeId: user?.id || 1, employeeName: form.employeeName, initiatedBy: user?.id || 1, reason: form.reason })} className="w-full min-h-[40px]">Criar Checklist</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {checklists?.map((cl: any) => {
          const items = cl.items || [];
          const completed = items.filter((i: any) => i.status === "concluido").length;
          const total = items.length || sectors.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          return (
            <Card key={cl.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{cl.employeeName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{cl.reason} · Saída: {cl.exitDate || "N/D"}</p>
                  </div>
                  <Badge variant={pct === 100 ? "default" : "secondary"}>{pct}% concluído</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {sectors.map((sector) => {
                    const item = items.find((i: any) => i.sector === sector);
                    const status = item?.status || "pendente";
                    return (
                      <div key={sector} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                        <span className="text-sm font-medium">{sector}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={status === "concluido" ? "default" : status === "nao_aplicavel" ? "secondary" : "outline"}>
                            {status === "concluido" ? "Concluído" : status === "nao_aplicavel" ? "Não Aplicável" : "Pendente"}
                          </Badge>
                          <Select
                            value={status}
                            onValueChange={(v) => item?.id && updateItem.mutate({ id: item.id, status: v as "pendente" | "concluido" | "nao_aplicavel" })}
                          >
                            <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="concluido">Concluído</SelectItem>
                              <SelectItem value="nao_aplicavel">Não Aplicável</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!checklists?.length && <p className="text-center text-muted-foreground py-4">Nenhum checklist de saída criado</p>}
      </div>
    </div>
  );
}

// ===================== DOCUMENTOS DO COLABORADOR =====================
function EmployeeDocumentsTab() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [form, setForm] = useState<{ category: string; docName: string; expiryDate: string; file: File | null }>({ category: "", docName: "", expiryDate: "", file: null });
  const utils = trpc.useUtils();

  const { data: employees } = trpc.rh.listEmployees.useQuery({});
  const { data: docs } = trpc.rh.listEmployeeDocuments.useQuery(
    selectedEmployeeId ? { employeeId: Number(selectedEmployeeId) } : undefined,
    { enabled: Boolean(selectedEmployeeId) },
  );
  const uploadDoc = trpc.rh.uploadEmployeeDocument.useMutation({
    onSuccess: () => { utils.invalidate(); setShowDialog(false); toast.success("Arquivo armazenado na Pasta Digital"); setForm({ category: "", docName: "", expiryDate: "", file: null }); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const deleteDoc = trpc.rh.deleteEmployeeDocument.useMutation({ onSuccess: () => utils.invalidate() });

  const categories = ["Identificação", "Admissão", "Exame Médico", "Formação", "Comprovante", "Nota Fiscal / Recibo", "Outro"];
  const requiredDocuments = [
    { name: "Carteira de Trabalho (CTPS)", category: "Admissão" },
    { name: "RG / CNH", category: "Identificação" },
    { name: "CPF", category: "Identificação" },
    { name: "Certidão de Nascimento / Casamento", category: "Admissão" },
    { name: "Comprovante de Residência", category: "Comprovante" },
    { name: "Exame Admissional", category: "Exame Médico" },
    { name: "Exame Periódico", category: "Exame Médico" },
    { name: "Foto 3×4", category: "Identificação" },
  ];
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const selectedEmployee = employees?.find((employee) => String(employee.id) === selectedEmployeeId);
  const employeeDocuments = docs || [];
  const openUpload = (documentName: string, category: string) => {
    if (!selectedEmployeeId) {
      toast.error("Selecione um colaborador antes de enviar documentos");
      return;
    }
    setForm({ category, docName: documentName, expiryDate: "", file: null });
    setShowDialog(true);
  };
  const selectDocumentFile = (file: File | null) => {
    if (!file) return;
    if (!isAcceptedDocumentFile(file) || file.size > 10 * 1024 * 1024) {
      toast.error("Envie um PDF, JPG, PNG ou WEBP de até 10 MB.");
      return;
    }
    setForm((current) => ({ ...current, file, docName: current.docName || file.name.replace(/\.[^.]+$/, "") }));
  };
  const submitDocument = async () => {
    if (!selectedEmployeeId || !form.file) {
      toast.error("Selecione um colaborador e o arquivo que deseja armazenar.");
      return;
    }
    try {
      const fileData = await documentFileToBase64(form.file);
      uploadDoc.mutate({
        employeeId: Number(selectedEmployeeId),
        category: form.category,
        documentName: form.docName.trim(),
        expiryDate: form.expiryDate || undefined,
        filename: form.file.name,
        mimeType: form.file.type as "application/pdf" | "image/jpeg" | "image/png" | "image/webp",
        fileData,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível preparar o arquivo.");
    }
  };

  const today = new Date();
  const isExpiringSoon = (date: string) => {
    if (!date) return false;
    const d = new Date(date);
    const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 30 && diff > 0;
  };
  const isExpired = (date: string) => {
    if (!date) return false;
    return new Date(date) < today;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Gestão de pessoas</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Pasta Digital do Colaborador</h3>
          <p className="mt-1 text-sm text-slate-500">Centralize documentos de admissão e comprovantes mensais em um só lugar.</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button disabled={!selectedEmployeeId} className="min-h-[42px] bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4 mr-2" /> Adicionar documento</Button></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Adicionar à Pasta Digital</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {selectedEmployee ? <>Colaborador: <strong className="text-slate-900">{selectedEmployee.name}</strong></> : "Selecione um colaborador na tela antes de continuar."}
              </div>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="min-h-[40px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Nome do documento" value={form.docName} onChange={e => setForm({ ...form, docName: e.target.value })} className="min-h-[40px]" />
              <Input type="date" placeholder="Validade" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} className="min-h-[40px]" />
              <div><Label htmlFor="digital-folder-file">Arquivo</Label><Input id="digital-folder-file" className="mt-1 cursor-pointer" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => selectDocumentFile(e.target.files?.[0] || null)} /><p className="mt-1 text-xs text-slate-500">PDF, JPG, PNG ou WEBP, até 10 MB{form.file ? ` · ${form.file.name}` : ""}</p></div>
              <Button disabled={!selectedEmployeeId || !form.category || !form.docName || !form.file || uploadDoc.isPending} onClick={submitDocument} className="w-full min-h-[40px] bg-red-600 hover:bg-red-700"><Upload className="mr-2 h-4 w-4" />{uploadDoc.isPending ? "Enviando arquivo..." : "Enviar e armazenar documento"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <Label className="text-sm font-semibold text-slate-700">Colaborador</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="mt-2 h-11"><SelectValue placeholder="Selecione o colaborador para abrir a Pasta Digital" /></SelectTrigger>
                <SelectContent>{employees?.map((employee) => <SelectItem key={employee.id} value={String(employee.id)}>{employee.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedEmployee && <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800"><strong>{selectedEmployee.name}</strong><br /><span className="text-red-600">Pasta digital ativa</span></div>}
          </div>
        </CardContent>
      </Card>

      {!selectedEmployeeId ? (
        <Card className="border-dashed border-slate-300 bg-slate-50"><CardContent className="py-14 text-center"><FolderArchive className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">Selecione um colaborador</p><p className="mt-1 text-sm text-slate-500">Os documentos obrigatórios e comprovantes aparecerão aqui.</p></CardContent></Card>
      ) : <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-lg">Documentos obrigatórios</CardTitle><p className="text-sm font-normal text-slate-500">Acompanhe os itens necessários para admissão e manutenção do cadastro.</p></CardHeader>
        <CardContent className="space-y-2">
          {requiredDocuments.map((required) => {
            const uploaded = employeeDocuments.find((doc: any) => doc.documentName.trim().toLowerCase() === required.name.toLowerCase());
            return <div key={required.name} className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><div className={uploaded ? "rounded-lg bg-emerald-50 p-2 text-emerald-600" : "rounded-lg bg-amber-50 p-2 text-amber-600"}><FileText className="h-4 w-4" /></div><div><p className="font-medium text-slate-800">{required.name}</p><p className="text-xs text-slate-500">{uploaded ? "Documento cadastrado na Pasta Digital" : "Aguardando envio"}</p></div></div>
              {uploaded ? <Badge className="w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Enviado</Badge> : <Button variant="outline" size="sm" onClick={() => openUpload(required.name, required.category)}><Plus className="mr-1 h-3.5 w-3.5" /> Enviar</Button>}
            </div>;
          })}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-lg">Notas Fiscais / Recibos — {new Date().getFullYear()}</CardTitle><p className="text-sm font-normal text-slate-500">Envie comprovantes mensais relacionados ao colaborador.</p></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {months.map((month) => {
            const documentName = `NF/Recibo - ${month} ${new Date().getFullYear()}`;
            const sent = employeeDocuments.some((doc: any) => doc.documentName === documentName);
            return <button type="button" onClick={() => !sent && openUpload(documentName, "Nota Fiscal / Recibo")} key={month} className={sent ? "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-4 text-center" : "rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center transition-colors hover:border-red-300 hover:bg-red-50"}><p className="font-semibold text-slate-800">{month}</p><p className={sent ? "mt-2 text-xs font-medium text-emerald-700" : "mt-2 text-xs font-medium text-red-600"}>{sent ? "Enviado" : "Enviar"}</p></button>;
          })}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h4 className="px-1 text-sm font-semibold text-slate-700">Documentos enviados</h4>
        {employeeDocuments.map((doc: any) => (
          <Card key={doc.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-slate-400" />
                <div>
                  <p className="font-medium">{doc.documentName}</p>
                  <p className="text-sm text-muted-foreground">Colaborador #{doc.employeeId} · {doc.category}</p>
                  {doc.expiryDate && (
                    <Badge variant={isExpired(doc.expiryDate) ? "destructive" : isExpiringSoon(doc.expiryDate) ? "secondary" : "outline"} className="mt-1">
                      {isExpired(doc.expiryDate) ? "Vencido" : isExpiringSoon(doc.expiryDate) ? "Vence em breve" : "Válido até " + doc.expiryDate}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.fileUrl && <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="min-h-[32px]">Ver</Button></a>}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteDoc.mutate({ id: doc.id })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!employeeDocuments.length && <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-muted-foreground">Nenhum documento enviado para este colaborador.</p>}
      </div>
      </>}
    </div>
  );
}

// ===================== VAGAS (CRM DE RECRUTAMENTO) =====================
function VacanciesTab() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ title: "", department: "", description: "", requirements: "", salaryRange: "", status: "aberta" });
  const utils = trpc.useUtils();

  const { data: vacancies } = trpc.rh.listVacancies.useQuery();
  const createVacancy = trpc.rh.createVacancy.useMutation({
    onSuccess: () => { utils.invalidate(); setShowDialog(false); toast.success("Vaga criada"); setForm({ title: "", department: "", description: "", requirements: "", salaryRange: "", status: "aberta" }); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const updateVacancy = trpc.rh.updateVacancy.useMutation({ onSuccess: () => utils.invalidate() });
  const deleteVacancy = trpc.rh.deleteVacancy.useMutation({ onSuccess: () => utils.invalidate() });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vagas Disponíveis</h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button className="min-h-[40px]"><Plus className="h-4 w-4 mr-1" /> Nova Vaga</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Vaga</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Título da vaga" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="min-h-[40px]" />
              <Input placeholder="Departamento" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="min-h-[40px]" />
              <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <Textarea placeholder="Requisitos" value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} />
              <Input placeholder="Faixa salarial (ex: R$ 2.000 - R$ 3.000)" value={form.salaryRange} onChange={e => setForm({ ...form, salaryRange: e.target.value })} className="min-h-[40px]" />
              <Button onClick={() => createVacancy.mutate(form)} className="w-full min-h-[40px]">Criar Vaga</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {vacancies?.map((v: any) => (
          <Card key={v.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{v.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{v.department} · {v.salaryRange || "Salário não informado"}</p>
                </div>
                <Badge variant={v.status === "aberta" ? "default" : "secondary"}>{v.status === "aberta" ? "Aberta" : "Fechada"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">{v.description}</p>
              {v.requirements && <p className="text-xs text-muted-foreground">Requisitos: {v.requirements}</p>}
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="min-h-[32px]" onClick={() => updateVacancy.mutate({ id: v.id, status: v.status === "aberta" ? "fechada" : "aberta" })}>
                  {v.status === "aberta" ? "Fechar Vaga" : "Reabrir Vaga"}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteVacancy.mutate({ id: v.id })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!vacancies?.length && <p className="text-center text-muted-foreground py-4">Nenhuma vaga criada</p>}
      </div>
    </div>
  );
}

// ===================== CANDIDATOS =====================
function CandidatesTab() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", vacancyId: "" });
  const utils = trpc.useUtils();

  const { data: candidates } = trpc.rh.listCandidates.useQuery();
  const { data: vacancies } = trpc.rh.listVacancies.useQuery();
  const createCandidate = trpc.rh.createCandidate.useMutation({
    onSuccess: () => { utils.invalidate(); setShowDialog(false); toast.success("Candidato cadastrado"); setForm({ name: "", email: "", phone: "", vacancyId: "" }); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const updateStage = trpc.rh.updateCandidateStage.useMutation({ onSuccess: () => utils.invalidate() });

  const stages = ["inscrito", "triagem", "entrevista", "aprovado", "reprovado"];
  const stageLabels: Record<string, string> = {
    inscrito: "Inscrito", triagem: "Triagem", entrevista: "Entrevista",
    aprovado: "Aprovado", reprovado: "Reprovado",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Candidatos</h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button className="min-h-[40px]"><Plus className="h-4 w-4 mr-1" /> Novo Candidato</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Candidato</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="min-h-[40px]" />
              <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="min-h-[40px]" />
              <Input placeholder="Telefone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="min-h-[40px]" />
              <Select value={form.vacancyId} onValueChange={(v) => setForm({ ...form, vacancyId: v })}>
                <SelectTrigger className="min-h-[40px]"><SelectValue placeholder="Vaga" /></SelectTrigger>
                <SelectContent>{vacancies?.map((v: any) => <SelectItem key={v.id} value={String(v.id)}>{v.title}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={() => createCandidate.mutate({ vacancyId: Number(form.vacancyId), name: form.name, email: form.email, phone: form.phone })} className="w-full min-h-[40px]">Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Funil visual */}
      <div className="grid gap-2 md:grid-cols-5">
        {stages.map(stage => {
          const stageCandidates = candidates?.filter((c: any) => c.stage === stage) || [];
          return (
            <div key={stage} className="space-y-1">
              <div className="text-xs font-semibold text-center pb-1 border-b-2 border-slate-200">{stageLabels[stage]} ({stageCandidates.length})</div>
              {stageCandidates.map((c: any) => (
                <Card key={c.id} className="p-2">
                  <p className="text-xs font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                  <Select value={c.stage} onValueChange={(v) => updateStage.mutate({ id: c.id, stage: v as "inscrito" | "triagem" | "entrevista" | "aprovado" | "reprovado" })}>
                    <SelectTrigger className="h-7 mt-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{stages.map(s => <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </Card>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== LOG DE AUDITORIA =====================
export function AuditLogsTab() {
  const [filter, setFilter] = useState("");
  const { data: logs } = trpc.rh.listAuditLogs.useQuery({ limit: 100 });

  const actionLabels: Record<string, string> = {
    create: "Criação", update: "Atualização", delete: "Exclusão", login: "Login", logout: "Logout",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Log de Auditoria</h3>
        <Input placeholder="Filtrar..." value={filter} onChange={e => setFilter(e.target.value)} className="max-w-xs min-h-[40px]" />
      </div>

      <div className="space-y-1">
        {logs?.filter((l: any) => !filter || l.entityName?.includes(filter) || l.action?.includes(filter) || l.userName?.includes(filter))
          .map((l: any) => (
          <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
            <Badge variant="outline" className="shrink-0">{actionLabels[l.action] || l.action}</Badge>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{l.userName} · {l.entityName}</p>
              <p className="text-xs text-muted-foreground">{l.details} · {new Date(l.createdAt).toLocaleString("pt-BR")}</p>
            </div>
          </div>
        ))}
        {!logs?.length && <p className="text-center text-muted-foreground py-4">Nenhum log de auditoria</p>}
      </div>
    </div>
  );
}

// ===================== SALÁRIO (FOLHA DE PAGAMENTO) =====================
function SalaryTab() {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    employeeName: "",
    baseSalary: "",
    bonuses: "",
    deductions: "",
    commission: "",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    notes: "",
  });
  const utils = trpc.useUtils();

  const { data: salaries } = trpc.rh.listSalaryRecords.useQuery();
  const { data: summary } = trpc.rh.salarySummary.useQuery();
  const createSalary = trpc.rh.createSalaryRecord.useMutation({
    onSuccess: () => { utils.invalidate(); setShowDialog(false); toast.success("Folha criada"); setForm({ employeeName: "", baseSalary: "", bonuses: "", deductions: "", commission: "", month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), notes: "" }); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const approveSalary = trpc.rh.approveSalaryRecord.useMutation({ onSuccess: () => { utils.invalidate(); toast.success("Folha aprovada"); } });
  const paySalary = trpc.rh.paySalaryRecord.useMutation({ onSuccess: () => { utils.invalidate(); toast.success("Folha paga"); } });
  const deleteSalary = trpc.rh.deleteSalaryRecord.useMutation({ onSuccess: () => utils.invalidate() });

  const fmt = (val: string | number) => Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const handleCreate = () => {
    if (!form.employeeName || !form.baseSalary) { toast.error("Preencha nome e salário base"); return; }
    createSalary.mutate({
      employeeId: user?.id || 1,
      employeeName: form.employeeName,
      baseSalary: Number(form.baseSalary),
      bonuses: Number(form.bonuses) || 0,
      deductions: Number(form.deductions) || 0,
      commission: Number(form.commission) || 0,
      month: Number(form.month),
      year: Number(form.year),
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Folha de Pagamento</h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button className="min-h-[40px]"><Plus className="h-4 w-4 mr-1" /> Nova Folha</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Cadastrar Folha de Pagamento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome do funcionário" value={form.employeeName} onChange={e => setForm({ ...form, employeeName: e.target.value })} className="min-h-[40px]" />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Salário base" value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: e.target.value })} type="number" step="0.01" className="min-h-[40px]" />
                <Input placeholder="Comissão" value={form.commission} onChange={e => setForm({ ...form, commission: e.target.value })} type="number" step="0.01" className="min-h-[40px]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Bônus" value={form.bonuses} onChange={e => setForm({ ...form, bonuses: e.target.value })} type="number" step="0.01" className="min-h-[40px]" />
                <Input placeholder="Descontos" value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })} type="number" step="0.01" className="min-h-[40px]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v })}>
                  <SelectTrigger className="min-h-[40px]"><SelectValue placeholder="Mês" /></SelectTrigger>
                  <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Ano" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} type="number" className="min-h-[40px]" />
              </div>
              <Textarea placeholder="Observações" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={handleCreate} className="w-full min-h-[40px]">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{fmt(String(summary?.total || 0))}</div><div className="text-xs text-muted-foreground">Total Geral</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-green-600">{fmt(String(summary?.totalCommission || 0))}</div><div className="text-xs text-muted-foreground">Comissões</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-orange-600">{summary?.pendingCount || 0}</div><div className="text-xs text-muted-foreground">Rascunhos</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-purple-600">{summary?.paidCount || 0}</div><div className="text-xs text-muted-foreground">Pagas</div></CardContent></Card>
      </div>

      {/* List */}
      <div className="space-y-2">
        {salaries?.map((s: any) => (
          <Card key={s.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{s.employeeName} <Badge variant="outline" className="ml-2">{months[s.month - 1]}/{s.year}</Badge></p>
                <p className="text-sm text-muted-foreground">
                  Base: {fmt(s.baseSalary)} · Comissão: {fmt(s.commission)} · Bônus: {fmt(s.bonuses)} · Descontos: {fmt(s.deductions)}
                </p>
                <p className="text-lg font-bold text-green-600">Líquido: {fmt(s.netSalary)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={s.status === "pago" ? "default" : s.status === "aprovado" ? "secondary" : "outline"}>
                  {s.status === "pago" ? "Pago" : s.status === "aprovado" ? "Aprovado" : "Rascunho"}
                </Badge>
                {s.status === "rascunho" && (
                  <Button variant="outline" size="sm" className="min-h-[32px]" onClick={() => approveSalary.mutate({ id: s.id })}>Aprovar</Button>
                )}
                {s.status === "aprovado" && (
                  <Button variant="outline" size="sm" className="min-h-[32px]" onClick={() => paySalary.mutate({ id: s.id })}>Marcar Pago</Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteSalary.mutate({ id: s.id })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!salaries?.length && <p className="text-center text-muted-foreground py-4">Nenhuma folha de pagamento cadastrada</p>}
      </div>
    </div>
  );
}

// ===================== AJUDA DE CUSTO =====================
function CostHelpTab() {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    employeeName: "",
    category: "combustivel",
    description: "",
    amount: "",
    receiptUrl: "",
    notes: "",
  });
  const utils = trpc.useUtils();

  const { data: requests } = trpc.rh.listCostHelpRequests.useQuery();
  const { data: summary } = trpc.rh.costHelpSummary.useQuery();
  const createRequest = trpc.rh.createCostHelpRequest.useMutation({
    onSuccess: () => { utils.invalidate(); setShowDialog(false); toast.success("Solicitação criada"); setForm({ employeeName: "", category: "combustivel", description: "", amount: "", receiptUrl: "", notes: "" }); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const approveRequest = trpc.rh.approveCostHelpRequest.useMutation({ onSuccess: () => { utils.invalidate(); toast.success("Solicitação aprovada"); } });
  const rejectRequest = trpc.rh.rejectCostHelpRequest.useMutation({ onSuccess: () => { utils.invalidate(); toast.success("Solicitação reprovada"); } });
  const payRequest = trpc.rh.payCostHelpRequest.useMutation({ onSuccess: () => { utils.invalidate(); toast.success("Solicitação paga"); } });
  const deleteRequest = trpc.rh.deleteCostHelpRequest.useMutation({ onSuccess: () => utils.invalidate() });

  const fmt = (val: string | number) => Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const categories = [
    { value: "combustivel", label: "Combustível" },
    { value: "manutencao", label: "Manutenção" },
    { value: "material", label: "Material" },
    { value: "viagem", label: "Viagem" },
    { value: "alimentacao", label: "Alimentação" },
    { value: "outros", label: "Outros" },
  ];

  const categoryLabels: Record<string, string> = Object.fromEntries(categories.map(c => [c.value, c.label]));

  const handleCreate = () => {
    if (!form.employeeName || !form.amount) { toast.error("Preencha nome e valor"); return; }
    createRequest.mutate({
      employeeId: user?.id || 1,
      employeeName: form.employeeName,
      category: form.category as "combustivel" | "manutencao" | "material" | "viagem" | "alimentacao" | "outros",
      description: form.description || undefined,
      amount: Number(form.amount),
      receiptUrl: form.receiptUrl || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ajuda de Custo</h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button className="min-h-[40px]"><Plus className="h-4 w-4 mr-1" /> Nova Solicitação</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Solicitar Ajuda de Custo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome do funcionário" value={form.employeeName} onChange={e => setForm({ ...form, employeeName: e.target.value })} className="min-h-[40px]" />
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="min-h-[40px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="min-h-[40px]" />
              <Input placeholder="Valor (R$)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} type="number" step="0.01" className="min-h-[40px]" />
              <Input placeholder="URL do recibo" value={form.receiptUrl} onChange={e => setForm({ ...form, receiptUrl: e.target.value })} className="min-h-[40px]" />
              <Textarea placeholder="Observações" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={handleCreate} className="w-full min-h-[40px]">Solicitar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{fmt(String(summary?.total || 0))}</div><div className="text-xs text-muted-foreground">Total Geral</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-orange-600">{fmt(String(summary?.totalPending || 0))}</div><div className="text-xs text-muted-foreground">Pendentes</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-green-600">{fmt(String(summary?.totalPaid || 0))}</div><div className="text-xs text-muted-foreground">Pagas</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-purple-600">{summary?.count || 0}</div><div className="text-xs text-muted-foreground">Solicitações</div></CardContent></Card>
      </div>

      {/* List */}
      <div className="space-y-2">
        {requests?.map((r: any) => (
          <Card key={r.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{r.employeeName} <Badge variant="outline" className="ml-2">{categoryLabels[r.category] || r.category}</Badge></p>
                <p className="text-sm text-muted-foreground">{r.description} · {r.month && r.year ? `${r.month}/${r.year}` : ""}</p>
                <p className="text-lg font-bold text-green-600">{fmt(r.amount)}</p>
                {r.rejectionReason && <p className="text-xs text-red-500">Motivo reprovação: {r.rejectionReason}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === "pago" ? "default" : r.status === "aprovado" ? "secondary" : r.status === "reprovado" ? "destructive" : "outline"}>
                  {r.status === "pago" ? "Pago" : r.status === "aprovado" ? "Aprovado" : r.status === "reprovado" ? "Reprovado" : "Pendente"}
                </Badge>
                {r.status === "pendente" && (
                  <>
                    <Button variant="outline" size="sm" className="min-h-[32px]" onClick={() => approveRequest.mutate({ id: r.id })}>Aprovar</Button>
                    <Button variant="ghost" size="sm" className="min-h-[32px] text-red-500" onClick={() => rejectRequest.mutate({ id: r.id })}>Reprovar</Button>
                  </>
                )}
                {r.status === "aprovado" && (
                  <Button variant="outline" size="sm" className="min-h-[32px]" onClick={() => payRequest.mutate({ id: r.id })}>Marcar Pago</Button>
                )}
                {r.receiptUrl && <a href={r.receiptUrl} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm" className="min-h-[32px]">Ver Recibo</Button></a>}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteRequest.mutate({ id: r.id })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!requests?.length && <p className="text-center text-muted-foreground py-4">Nenhuma solicitação de ajuda de custo</p>}
      </div>
    </div>
  );
}

// ==================== Despesas Link Tab ====================
function DespesasLinkTab() {
  const [, setLocation] = useLocation();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
        <Receipt size={24} className="text-red-600" />
        <div className="flex-1">
          <p className="font-semibold text-gray-900">Controle de Despesas</p>
          <p className="text-sm text-gray-500">Gerencie notas fiscais, reembolsos e aprovações</p>
        </div>
        <Button onClick={() => setLocation("/despesas")} className="bg-red-600 hover:bg-red-700">
          Abrir Despesas
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Receipt size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Tirar foto da NF</p>
            <p className="text-xs text-gray-400 mt-1">Extração automática de dados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ClipboardCheck size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Aprovar/Rejeitar</p>
            <p className="text-xs text-gray-400 mt-1">RH aprova as despesas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Controle Financeiro</p>
            <p className="text-xs text-gray-400 mt-1">Relatórios e totais</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== EAD Link Tab ====================
function EadLinkTab() {
  const [, setLocation] = useLocation();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
        <BookOpen size={24} className="text-red-600" />
        <div className="flex-1">
          <p className="font-semibold text-gray-900">EAD - Videoaulas</p>
          <p className="text-sm text-gray-500">Plataforma de ensino a distância com cursos e trilhas</p>
        </div>
        <Button onClick={() => setLocation("/ead")} className="bg-red-600 hover:bg-red-700">
          Abrir EAD
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Cursos e Trilhas</p>
            <p className="text-xs text-gray-400 mt-1">Onboarding com videoaulas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Alunos</p>
            <p className="text-xs text-gray-400 mt-1">Criar e gerenciar alunos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ScrollText size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Certificados</p>
            <p className="text-xs text-gray-400 mt-1">Conclusão de cursos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== Create Users Tab ====================
function CreateUsersTab() {
  const { user } = useAuth();
  const [form, setForm] = useState<{ name: string; email: string; password: string; role: string }>({
    name: "",
    email: "",
    password: "123456",
    role: "vendedor",
  });
  const createMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      setForm({ name: "", email: "", password: "123456", role: "vendedor" });
    },
    onError: (err) => toast.error("Erro ao criar usuário: " + err.message),
  });

  const { data: users } = trpc.admin.listUsers.useQuery();

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus size={20} className="text-red-600" />
            Criar Novo Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome Completo</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="joao@trmotors.com.br"
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Senha inicial"
              />
            </div>
            <div>
              <Label>Perfil de Acesso</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="rh">RH</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                  <SelectItem value="aluno">Aluno (EAD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate(form as any)}
            disabled={createMutation.isPending || !form.name || !form.email}
            className="bg-red-600 hover:bg-red-700"
          >
            {createMutation.isPending ? "Criando..." : "Criar Usuário"}
          </Button>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users?.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
                  {u.name?.charAt(0) || "U"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <Badge variant={u.role === "admin" ? "default" : "outline"}>
                  {u.role}
                </Badge>
              </div>
            ))}
            {!users?.length && (
              <p className="text-center text-gray-400 py-4">Nenhum usuário cadastrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
