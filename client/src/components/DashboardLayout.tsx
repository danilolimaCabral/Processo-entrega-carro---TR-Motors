import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  Car,
  DollarSign,
  Building2,
  Blocks,
  ClipboardList,
  Camera,
  FileSpreadsheet,
  FileText,
  Briefcase,
  Settings,
  UserCog,
  AlertTriangle,
  Warehouse,
  Target,
  Truck,
  GraduationCap,
  Receipt,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
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

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  shortLabel: string;
  path: string;
  group?: string;
}

function getMenuItems(role: string): MenuItem[] {
  const items: MenuItem[] = [];
  if (role === "admin") {
    items.push({ icon: LayoutDashboard, label: "Dashboard", shortLabel: "Dash", path: "/dashboard", group: "principal" });
    items.push({ icon: Car, label: "Vendas", shortLabel: "Vendas", path: "/vendedor/dashboard", group: "comercial" });
    items.push({ icon: Camera, label: "Vistoria Compra", shortLabel: "Vistoria", path: "/vistoria", group: "comercial" });
    items.push({ icon: Warehouse, label: "Estoque", shortLabel: "Estoque", path: "/estoque", group: "comercial" });
    items.push({ icon: Target, label: "Pipeline CRM", shortLabel: "Pipeline", path: "/pipeline", group: "comercial" });
    items.push({ icon: Briefcase, label: "Despachante", shortLabel: "Despach", path: "/despachante", group: "operacional" });
    items.push({ icon: DollarSign, label: "Financeiro", shortLabel: "Financ", path: "/approval", group: "operacional" });
    items.push({ icon: Building2, label: "Administrativo", shortLabel: "Admin", path: "/approval", group: "operacional" });
    items.push({ icon: Truck, label: "Entrega", shortLabel: "Entrega", path: "/entrega", group: "operacional" });
    items.push({ icon: UserCog, label: "RH", shortLabel: "RH", path: "/rh", group: "gestao" });
    items.push({ icon: Receipt, label: "Despesas", shortLabel: "Desp.", path: "/despesas", group: "gestao" });
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead", group: "gestao" });
    items.push({ icon: Settings, label: "Configurações", shortLabel: "Config", path: "/configuracoes", group: "sistema" });
  } else if (role === "vendedor") {
    items.push({ icon: LayoutDashboard, label: "Dashboard", shortLabel: "Dash", path: "/dashboard", group: "principal" });
    items.push({ icon: Car, label: "Vendas", shortLabel: "Vendas", path: "/vendedor/dashboard", group: "comercial" });
    items.push({ icon: Camera, label: "Vistoria Compra", shortLabel: "Vistoria", path: "/vistoria", group: "comercial" });
    items.push({ icon: Target, label: "Pipeline CRM", shortLabel: "Pipeline", path: "/pipeline", group: "comercial" });
    items.push({ icon: Warehouse, label: "Estoque", shortLabel: "Estoque", path: "/estoque", group: "comercial" });
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead", group: "gestao" });
  } else if (role === "gerente") {
    items.push({ icon: LayoutDashboard, label: "Dashboard", shortLabel: "Dash", path: "/dashboard", group: "principal" });
    items.push({ icon: Car, label: "Vendas", shortLabel: "Vendas", path: "/vendedor/dashboard", group: "comercial" });
    items.push({ icon: Camera, label: "Vistoria Compra", shortLabel: "Vistoria", path: "/vistoria", group: "comercial" });
    items.push({ icon: Target, label: "Pipeline CRM", shortLabel: "Pipeline", path: "/pipeline", group: "comercial" });
    items.push({ icon: Warehouse, label: "Estoque", shortLabel: "Estoque", path: "/estoque", group: "comercial" });
    items.push({ icon: Briefcase, label: "Despachante", shortLabel: "Despach", path: "/despachante", group: "operacional" });
    items.push({ icon: Truck, label: "Entrega", shortLabel: "Entrega", path: "/entrega", group: "operacional" });
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead", group: "gestao" });
  } else if (role === "financeiro") {
    items.push({ icon: LayoutDashboard, label: "Dashboard", shortLabel: "Dash", path: "/dashboard", group: "principal" });
    items.push({ icon: DollarSign, label: "Financeiro", shortLabel: "Financ", path: "/approval", group: "operacional" });
    items.push({ icon: Briefcase, label: "Despachante", shortLabel: "Despach", path: "/despachante", group: "operacional" });
    items.push({ icon: Truck, label: "Entrega", shortLabel: "Entrega", path: "/entrega", group: "operacional" });
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead", group: "gestao" });
  } else if (role === "administrativo") {
    items.push({ icon: LayoutDashboard, label: "Dashboard", shortLabel: "Dash", path: "/dashboard", group: "principal" });
    items.push({ icon: Building2, label: "Administrativo", shortLabel: "Admin", path: "/approval", group: "operacional" });
    items.push({ icon: Briefcase, label: "Despachante", shortLabel: "Despach", path: "/despachante", group: "operacional" });
    items.push({ icon: Truck, label: "Entrega", shortLabel: "Entrega", path: "/entrega", group: "operacional" });
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead", group: "gestao" });
  } else if (role === "aluno") {
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead", group: "gestao" });
  } else if (role === "rh") {
    items.push({ icon: UserCog, label: "RH", shortLabel: "RH", path: "/rh", group: "gestao" });
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead", group: "gestao" });
  }
  return items;
}

const groupLabels: Record<string, string> = {
  principal: "Principal",
  comercial: "Comercial",
  operacional: "Operacional",
  gestao: "Gestão",
  sistema: "Sistema",
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img
              src="/tr_logo.png"
              alt="Trmotors"
              className="h-24 w-auto object-contain drop-shadow-2xl"
            />
          </div>
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 text-center shadow-2xl border border-white/20">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Trmotors Hub
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Sistema de Controle de Entrega de Veículos
            </p>
            <Button
              onClick={() => (window.location.href = "/")}
              size="lg"
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/30 transition-all"
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth} title={title}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  title?: string;
};

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "Administrador",
    gerente: "Gerente",
    vendedor: "Vendedor",
    financeiro: "Financeiro",
    administrativo: "Administrativo",
    rh: "Recursos Humanos",
    aluno: "Aluno",
  };
  return labels[role] || role;
}

function MenuContent({ location, setLocation, logout, user, menuItems }: {
  location: string;
  setLocation: (path: string) => void;
  logout: () => void;
  user: any;
  menuItems: MenuItem[];
}) {
  // Group items by group
  const groupedItems = menuItems.reduce((acc, item) => {
    const group = item.group || "principal";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const groupOrder = ["gestao", "sistema"];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <SidebarHeader className="h-16 justify-center bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50">
        <div className="flex items-center gap-3 px-2 w-full">
          <img
            src="/tr_logo.png"
            alt="Trmotors"
            className="h-9 w-auto object-contain"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 bg-transparent flex-1 overflow-y-auto">
        {groupOrder.map((group) => {
          const items = groupedItems[group];
          if (!items || items.length === 0) return null;
          return (
            <div key={group} className="px-2 pt-3 pb-1">
              <div className="px-3 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {groupLabels[group] || group}
                </span>
              </div>
              <SidebarMenu className="gap-0.5">
                {items.map((item) => {
                  const isActive = location === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => {
                          setLocation(item.path);
                        }}
                        className={`h-10 transition-all duration-200 font-normal text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg ${
                          isActive
                            ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-600 hover:to-red-700 hover:text-white shadow-md shadow-red-900/40"
                            : ""
                        }`}
                      >
                        <item.icon
                          className={`h-[18px] w-[18px] ${isActive ? "text-white" : "text-slate-500"}`}
                        />
                        <span className="text-[13px]">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-3 bg-slate-950 border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-slate-800 transition-colors w-full text-left focus:outline-none">
              <Avatar className="h-9 w-9 border border-slate-700 shrink-0 bg-gradient-to-br from-red-600 to-red-700">
                <AvatarFallback className="text-xs font-medium text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-none text-white">
                  {user?.name || "-"}
                </p>
                <p className="text-xs text-slate-500 truncate mt-1.5">
                  {getRoleLabel(user?.role)}
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
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </div>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  title,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const allItems = user ? getMenuItems(user.role) : [];
  const menuItems = allItems.filter((item) => item.group === "gestao" || item.group === "sistema");
  const activeMenuItem = menuItems.find((item) => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // MOBILE: Use a compact bottom navigation bar
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header - compact */}
        <header className="bg-white border-b border-gray-200 px-3 h-14 flex items-center justify-between sticky top-0 z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <img
              src="/tr_logo.png"
              alt="TR"
              className="h-8 w-auto object-contain"
            />
            <h1 className="text-sm font-semibold text-slate-800 truncate ml-1">
              {title || activeMenuItem?.label || "Trmotors"}
            </h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition px-2 py-1 rounded-lg hover:bg-gray-100">
                <Avatar className="h-6 w-6 border border-slate-300 bg-gradient-to-br from-red-600 to-red-700">
                  <AvatarFallback className="text-[9px] font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="text-xs text-slate-500" disabled>
                {user?.name}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                <span className="text-sm">Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content - scrollable */}
        <main className="flex-1 overflow-y-auto pb-16">
          <div className="p-3">
            {children}
          </div>
        </main>

        {/* Bottom Navigation - compact & scrollable horizontally */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-inset-bottom shadow-[0_-4px_10px_rgba(0,0,0,0.08)]">
          <div className="flex items-center overflow-x-auto overflow-y-hidden scrollbar-hide px-2 py-1 gap-0.5 -webkit-overflow-scrolling-touch">
            {menuItems.map((item) => {
              const isActive = location === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-lg transition shrink-0 min-w-[56px] max-w-[72px] ${
                    isActive
                      ? "text-red-600 bg-red-50"
                      : "text-slate-400 hover:text-slate-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon size={20} className="shrink-0" />
                  <span className="text-[10px] mt-0.5 font-medium truncate leading-tight">
                    {item.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // DESKTOP: Use sidebar
  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0 bg-slate-900 border-slate-800"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-slate-700/60 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-slate-400" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src="/tr_logo.png"
                    alt="Trmotors"
                    className="h-9 w-auto object-contain"
                  />
                </div>
              ) : (
                <img
                  src="/tr_logo.png"
                  alt="TR"
                  className="h-7 w-7 object-contain"
                />
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
            {(() => {
              const groupedItems = menuItems.reduce((acc, item) => {
                const group = item.group || "principal";
                if (!acc[group]) acc[group] = [];
                acc[group].push(item);
                return acc;
              }, {} as Record<string, MenuItem[]>);

              const groupOrder = ["gestao", "sistema"];

              return groupOrder.map((group) => {
                const items = groupedItems[group];
                if (!items || items.length === 0) return null;
                return (
                  <div key={group} className="px-2 pt-3 pb-1">
                    {!isCollapsed && (
                      <div className="px-3 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                          {groupLabels[group] || group}
                        </span>
                      </div>
                    )}
                    <SidebarMenu className="gap-0.5">
                      {items.map((item) => {
                        const isActive = location === item.path;
                        return (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => setLocation(item.path)}
                              tooltip={item.label}
                              className={`h-10 transition-all duration-200 font-normal text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg ${
                                isActive
                                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-600 hover:to-red-700 hover:text-white shadow-md shadow-red-900/40"
                                  : ""
                              }`}
                            >
                              <item.icon
                                className={`h-[18px] w-[18px] ${isActive ? "text-white" : "text-slate-500"}`}
                              />
                              <span className="text-[13px]">{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </div>
                );
              });
            })()}
          </SidebarContent>

          <SidebarFooter className="p-3 bg-slate-950 border-t border-slate-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-slate-800 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                  <Avatar className="h-9 w-9 border border-slate-700 shrink-0 bg-gradient-to-br from-red-600 to-red-700">
                    <AvatarFallback className="text-xs font-medium text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-white">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-1.5">
                      {getRoleLabel(user?.role ?? "")}
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
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-red-500/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-gray-50">
        <div className="flex border-b h-12 items-center justify-between bg-white px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors" />
            <div className="flex items-center gap-2">
              <img
                src="/tr_logo.png"
                alt="TR"
                className="h-7 w-auto object-contain"
              />
              {activeMenuItem && (
                <span className="text-sm font-medium text-slate-600 ml-2 hidden sm:inline">
                  {activeMenuItem.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
