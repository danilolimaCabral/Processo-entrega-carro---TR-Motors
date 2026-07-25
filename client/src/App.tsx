import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useParams } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ProcessoPublicoPage from "./pages/ProcessoPublicoPage";

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
      <Route path="/404" component={NotFound} />
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
