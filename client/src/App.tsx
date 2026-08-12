import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useParams } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ProcessoPublicoPage from "./pages/ProcessoPublicoPage";
import VendedorDashboard from "./pages/VendedorDashboard";
import ApprovalPanel from "./pages/ApprovalPanel";
import DashboardPage from "./pages/DashboardPage";
import ModulesPage from "./pages/ModulesPage";
import PurchaseInspectionPage from "./pages/PurchaseInspectionPage";
import DespachantePage from "./pages/DespachantePage";
import RhPage from "./pages/RhPage";
import InventoryPage from "./pages/InventoryPage";
import PipelinePage from "./pages/PipelinePage";
import DeliveryPage from "./pages/DeliveryPage";
import EadPage from "./pages/EadPage";
import ExpensesPage from "./pages/ExpensesPage";
import AdminPage from "./pages/AdminPage";

/**
 * Wrapper para a página pública de acompanhamento de processo.
 * Extrai o token da URL e passa como prop.
 */
function ProcessoPublicoRoute() {
  const params = useParams<{ token: string }>();
  return <ProcessoPublicoPage token={params.token ?? ""} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Rota pública para acompanhamento de processo pelo cliente (sem autenticação) */}
      <Route path="/processo/:token" component={ProcessoPublicoRoute} />
      {/* Dashboard para vendedores */}
      <Route path="/vendedor/dashboard" component={VendedorDashboard} />
      {/* Painel de aprovação para financeiro e administrativo */}
      <Route path="/approval" component={ApprovalPanel} />
      {/* Dashboard geral (todos) */}
      <Route path="/dashboard" component={DashboardPage} />
      {/* Gestão de módulos (admin) */}
      <Route path="/modulos" component={ModulesPage} />
      <Route path="/configuracoes" component={AdminPage} />
      {/* Vistoria de compra */}
      <Route path="/vistoria" component={PurchaseInspectionPage} />
      <Route path="/vistoria/nova" component={PurchaseInspectionPage} />
      <Route path="/vistoria/:id" component={PurchaseInspectionPage} />
      {/* Despachante */}
      <Route path="/despachante" component={DespachantePage} />
      <Route path="/rh" component={RhPage} />
      <Route path="/estoque" component={InventoryPage} />
      <Route path="/pipeline" component={PipelinePage} />
      <Route path="/entrega" component={DeliveryPage} />
      {/* EAD - Videoaulas */}
      <Route path="/ead" component={EadPage} />
      <Route path="/despesas" component={ExpensesPage} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
