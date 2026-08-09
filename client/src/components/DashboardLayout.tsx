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

function getMenuItems(role: string) {
  const items: { icon: typeof LayoutDashboard; label: string; shortLabel: string; path: string }[] = [];
  // Dashboard visible for all roles
  items.push({ icon: LayoutDashboard, label: "Dashboard", shortLabel: "Dash", path: "/dashboard" });
  if (role === "admin") {
    // Admin sees everything
    items.push({ icon: Car, label: "Vendas", shortLabel: "Vendas", path: "/vendedor/dashboard" });
    items.push({ icon: Camera, label: "Vistoria Compra", shortLabel: "Vistoria", path: "/vistoria" });
    items.push({ icon: Warehouse, label: "Estoque", shortLabel: "Estoque", path: "/estoque" });
    items.push({ icon: Target, label: "Pipeline CRM", shortLabel: "Pipeline", path: "/pipeline" });
    items.push({ icon: Briefcase, label: "Despachante", shortLabel: "Despach", path: "/despachante" });
    items.push({ icon: DollarSign, label: "Financeiro", shortLabel: "Financ", path: "/approval" });
    items.push({ icon: Building2, label: "Administrativo", shortLabel: "Admin", path: "/approval" });
    items.push({ icon: Truck, label: "Entrega", shortLabel: "Entrega", path: "/entrega" });
    items.push({ icon: UserCog, label: "RH", shortLabel: "RH", path: "/rh" });
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead" });
    items.push({ icon: Users, label: "Usuários", shortLabel: "Users", path: "/" });
    items.push({ icon: Blocks, label: "Módulos", shortLabel: "Módulos", path: "/modulos" });
  } else if (role === "vendedor") {
    items.push({ icon: Car, label: "Vendas", shortLabel: "Vendas", path: "/vendedor/dashboard" });
    items.push({ icon: Camera, label: "Vistoria Compra", shortLabel: "Vistoria", path: "/vistoria" });
    items.push({ icon: Target, label: "Pipeline CRM", shortLabel: "Pipeline", path: "/pipeline" });
    items.push({ icon: Warehouse, label: "Estoque", shortLabel: "Estoque", path: "/estoque" });
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead" });
  } else if (role === "financeiro") {
    items.push({ icon: DollarSign, label: "Financeiro", shortLabel: "Financ", path: "/approval" });
    items.push({ icon: Briefcase, label: "Despachante", shortLabel: "Despach", path: "/despachante" });
    items.push({ icon: Truck, label: "Entrega", shortLabel: "Entrega", path: "/entrega" });
    items.push({ icon: UserCog, label: "RH", shortLabel: "RH", path: "/rh" });
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead" });
  } else if (role === "administrativo") {
    items.push({ icon: Building2, label: "Administrativo", shortLabel: "Admin", path: "/approval" });
    items.push({ icon: Briefcase, label: "Despachante", shortLabel: "Despach", path: "/despachante" });
    items.push({ icon: Truck, label: "Entrega", shortLabel: "Entrega", path: "/entrega" });
    items.push({ icon: UserCog, label: "RH", shortLabel: "RH", path: "/rh" });
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead" });
  } else if (role === "aluno") {
    // Aluno sees only EAD and Dashboard
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead" });
  } else if (role === "rh") {
    // RH sees only RH and EAD
    items.push({ icon: UserCog, label: "RH", shortLabel: "RH", path: "/rh" });
    items.push({ icon: GraduationCap, label: "EAD Videoaulas", shortLabel: "EAD", path: "/ead" });
  }
  return items;
}

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img
              src="/tr_logo.png"
              alt="TR Motors"
              className="h-24 w-auto object-contain"
            />
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              TR Motors
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Sistema de Controle de Entrega de Veículos
            </p>
            <Button
              onClick={() => (window.location.href = "/")}
              size="lg"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
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

function MenuContent({ location, setLocation, logout, user, menuItems }: {
  location: string;
  setLocation: (path: string) => void;
  logout: () => void;
  user: any;
  menuItems: { icon: typeof LayoutDashboard; label: string; path: string }[];
}) {
  return (
    <div className="flex flex-col h-full bg-slate-900">
      <SidebarHeader className="h-16 justify-center bg-white border-b border-slate-200">
        <div className="flex items-center gap-3 px-2 w-full">
          <img
            src="/tr_logo.png"
            alt="TR Motors"
            className="h-9 w-auto object-contain"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 bg-slate-900 flex-1">
        <SidebarMenu className="px-2 py-2">
          {menuItems.map((item) => {
            const isActive = location === item.path;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={isActive}
                  onClick={() => {
                    setLocation(item.path);
                  }}
                  className={`h-10 transition-all font-normal text-slate-300 hover:text-white hover:bg-slate-800 ${
                    isActive
                      ? "bg-red-600/20 text-red-400 hover:bg-red-600/20 hover:text-red-400 border-l-2 border-red-500"
                      : ""
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 ${isActive ? "text-red-400" : "text-slate-500"}`}
                  />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 bg-slate-950 border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-slate-800 transition-colors w-full text-left focus:outline-none">
              <Avatar className="h-9 w-9 border border-slate-700 shrink-0 bg-red-600">
                <AvatarFallback className="text-xs font-medium text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-none text-white">
                  {user?.name || "-"}
                </p>
                <p className="text-xs text-slate-500 truncate mt-1.5">
                  {user?.role === "admin"
                    ? "Administrador"
                    : user?.role === "vendedor"
                    ? "Vendedor"
                    : user?.role === "financeiro"
                    ? "Financeiro"
                    : user?.role === "administrativo"
                    ? "Administrativo"
                    : "-"}
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
  const menuItems = user ? getMenuItems(user.role) : [];
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
              {title || activeMenuItem?.label || "TR Motors"}
            </h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition px-2 py-1 rounded-lg hover:bg-gray-100">
                <Avatar className="h-6 w-6 border border-slate-300 bg-red-600">
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
          <SidebarHeader className="h-16 justify-center bg-white border-b border-slate-200">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-slate-600" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src="/tr_logo.png"
                    alt="TR Motors"
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

          <SidebarContent className="gap-0 bg-slate-900">
            <SidebarMenu className="px-2 py-2">
              {menuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal text-slate-300 hover:text-white hover:bg-slate-800 ${
                        isActive
                          ? "bg-red-600/20 text-red-400 hover:bg-red-600/20 hover:text-red-400 border-l-2 border-red-500"
                          : ""
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-red-400" : "text-slate-500"}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 bg-slate-950 border-t border-slate-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-slate-800 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                  <Avatar className="h-9 w-9 border border-slate-700 shrink-0 bg-red-600">
                    <AvatarFallback className="text-xs font-medium text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-white">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-1.5">
                      {user?.role === "admin"
                        ? "Administrador"
                        : user?.role === "vendedor"
                        ? "Vendedor"
                        : user?.role === "financeiro"
                        ? "Financeiro"
                        : user?.role === "administrativo"
                        ? "Administrativo"
                        : "-"}
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
            <SidebarTrigger className="h-8 w-8 rounded-lg bg-slate-100" />
            <div className="flex items-center gap-2">
              <img
                src="/tr_logo.png"
                alt="TR"
                className="h-7 w-auto object-contain"
              />
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
