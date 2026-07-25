import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import LoginPage from "./LoginPage";
import AdminPage from "./AdminPage";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, refresh } = useAuth();
  const [, navigate] = useLocation();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          if (refresh) refresh();
          else window.location.reload();
        }}
      />
    );
  }

  // Route users to their respective panels
  if (user.role === "admin") {
    return <AdminPage />;
  }

  if (user.role === "vendedor") {
    navigate("/vendedor/dashboard");
    return <DashboardLayoutSkeleton />;
  }

  if (user.role === "financeiro" || user.role === "administrativo") {
    navigate("/approval");
    return <DashboardLayoutSkeleton />;
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Bem-vindo, {user.name}!
        </h1>
        <p className="text-slate-600 mb-4">
          Seu papel não está configurado corretamente.
        </p>
        <p className="text-sm text-slate-500">
          Papel: <strong>{user.role}</strong>
        </p>
      </div>
    </div>
  );
}
