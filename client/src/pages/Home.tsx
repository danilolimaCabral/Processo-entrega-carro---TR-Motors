import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { ROLE_LABELS } from "@shared/trMotors";
import {
  Briefcase,
  Car,
  ClipboardCheck,
  LogOut,
  PanelLeft,
  ShieldCheck,
} from "lucide-react";
import VendedorPage from "./VendedorPage";
import FinanceiroPage from "./FinanceiroPage";
import AdministrativoPage from "./AdministrativoPage";
import AdminPage from "./AdminPage";

const MENU_BY_ROLE: Record<
  string,
  { icon: React.ElementType; label: string }[]
> = {
  vendedor: [{ icon: Car, label: "Minhas vendas" }],
  financeiro: [{ icon: ClipboardCheck, label: "Análise financeira" }],
  administrativo: [{ icon: ShieldCheck, label: "Liberação de entrega" }],
  admin: [{ icon: Briefcase, label: "Gerenciar Usuários" }],
};

function PageContent({ role }: { role: string }) {
  if (role === "vendedor") return <VendedorPage />;
  if (role === "financeiro") return <FinanceiroPage />;
  if (role === "administrativo") return <AdministrativoPage />;
  if (role === "admin") return <AdminPage />;
  // admin ou user sem papel: mostra mensagem
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Briefcase className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Perfil não configurado</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Seu usuário ainda não possui um perfil de acesso atribuído. Solicite ao
          administrador do sistema que configure o seu papel.
        </p>
      </div>
    </div>
  );
}

function LayoutInner({ role }: { role: string }) {
  const { user, logout } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const menuItems = MENU_BY_ROLE[role] ?? MENU_BY_ROLE["admin"];
  const roleLabel =
    ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-2 w-full">
            <button
              onClick={toggleSidebar}
              className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none shrink-0"
              aria-label="Toggle navigation"
            >
              <PanelLeft className="h-4 w-4 text-sidebar-foreground/60" />
            </button>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight text-sidebar-foreground truncate">
                  TR Motors
                </span>
                <span className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest truncate">
                  Controle de Entrega
                </span>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0 pt-2">
          <SidebarMenu className="px-2 py-1">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  isActive={true}
                  tooltip={item.label}
                  className="h-10 transition-all font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground"
                >
                  <item.icon className="h-4 w-4 text-sidebar-primary" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/60 transition-colors w-full text-left focus:outline-none group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border">
                  <AvatarFallback className="text-xs font-semibold bg-sidebar-accent text-sidebar-accent-foreground">
                    {user?.name?.charAt(0).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                    {user?.name ?? "—"}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate mt-1 uppercase tracking-wider">
                    {roleLabel}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg" />
            <span className="text-sm font-medium text-foreground hidden sm:block">
              {menuItems[0]?.label ?? "TR Motors"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user?.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 hidden sm:block">
              · {roleLabel}
            </span>
          </div>
        </div>
        <main className="flex-1 p-6">
          <PageContent role={role} />
        </main>
      </SidebarInset>
    </>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-sm w-full text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-1">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">TR Motors</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sistema de Controle de Entrega de Veículos
              </p>
            </div>
          </div>
          <div className="w-full space-y-3">
            <p className="text-sm text-muted-foreground">
              Faça login para acessar o sistema.
            </p>
            <Button onClick={() => startLogin()} size="lg" className="w-full">
              Entrar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/60">
            Uso exclusivo para colaboradores TR Motors
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <LayoutInner role={user.role} />
    </SidebarProvider>
  );
}

