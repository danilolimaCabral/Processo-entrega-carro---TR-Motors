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
  const items: { icon: typeof LayoutDashboard; label: string; path: string }[] = [];

  // Dashboard visible for all roles
  items.push({ icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" });

  if (role === "admin") {
    items.push({ icon: Car, label: "Vendas", path: "/vendedor/dashboard" });
    items.push({ icon: ClipboardList, label: "Checklist", path: "/vendedor/dashboard" });
    items.push({ icon: Camera, label: "Vistoria Compra", path: "/vistoria" });
    items.push({ icon: FileSpreadsheet, label: "Despachante", path: "/despachante" });
    items.push({ icon: DollarSign, label: "Financeiro", path: "/approval" });
    items.push({ icon: Building2, label: "Administrativo", path: "/approval" });
    items.push({ icon: Users, label: "Usuários", path: "/" });
    items.push({ icon: Blocks, label: "Módulos", path: "/modulos" });
  } else if (role === "vendedor") {
    items.push({ icon: Car, label: "Vendas", path: "/vendedor/dashboard" });
    items.push({ icon: ClipboardList, label: "Checklist", path: "/vendedor/dashboard" });
    items.push({ icon: Camera, label: "Vistoria Compra", path: "/vistoria" });
    items.push({ icon: FileSpreadsheet, label: "Despachante", path: "/despachante" });
  } else if (role === "financeiro") {
    items.push({ icon: DollarSign, label: "Financeiro", path: "/approval" });
    items.push({ icon: FileSpreadsheet, label: "Despachante", path: "/despachante" });
  } else if (role === "administrativo") {
    items.push({ icon: Building2, label: "Administrativo", path: "/approval" });
    items.push({ icon: FileSpreadsheet, label: "Despachante", path: "/despachante" });
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
      <SidebarHeader className="h-20 justify-center bg-white border-b border-slate-200">
        <div className="flex items-center gap-3 px-2 w-full">
          <img
            src="/tr_logo.png"
            alt="TR Motors"
            className="h-10 w-auto object-contain"
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
                  className={`h-11 transition-all font-normal text-slate-300 hover:text-white hover:bg-slate-800 ${
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

  // MOBILE: Use a bottom navigation bar instead of sidebar
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <img
              src="/tr_logo.png"
              alt="TR Motors"
              className="h-8 w-auto object-contain"
            />
            
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3 pb-20 overflow-y-auto">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-inset-bottom">
          <div className="flex items-center justify-around px-1 py-1">
            {menuItems.map((item) => {
              const isActive = location === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg transition min-w-0 ${
                    isActive
                      ? "text-red-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-[10px] mt-0.5 font-medium truncate max-w-[60px]">
                    {item.label.split(" ").slice(0, 2).join(" ")}
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
          <SidebarHeader className="h-20 justify-center bg-white border-b border-slate-200">
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
                    className="h-10 w-auto object-contain"
                  />
                </div>
              ) : (
                <img
                  src="/tr_logo.png"
                  alt="TR"
                  className="h-8 w-8 object-contain"
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
                      className={`h-11 transition-all font-normal text-slate-300 hover:text-white hover:bg-slate-800 ${
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
        <div className="flex border-b h-14 items-center justify-between bg-white px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-9 w-9 rounded-lg bg-slate-100" />
            <div className="flex items-center gap-3">
              <img
                src="/tr_logo.png"
                alt="TR Motors"
                className="h-8 w-auto object-contain"
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
