import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import LoginPage from "./LoginPage";
import AdminPage from "./AdminPage";
import EadPage from "./EadPage";
import RhPage from "./RhPage";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!user || loading) return;

    if (user.role === "vendedor") {
      navigate("/dashboard");
    } else if (user.role === "financeiro" || user.role === "administrativo") {
      navigate("/dashboard");
    } else if (user.role === "aluno") {
      navigate("/ead");
    } else if (user.role === "rh") {
      navigate("/rh");
    } else if (user.role === "admin") {
      navigate("/rh");
    }
  }, [user, loading, navigate]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return <LoginPage />;
  }

  // Route users to their respective panels
  if (user.role === "admin") {
    return <AdminPage />;
  }

  if (user.role === "vendedor" || user.role === "financeiro" || user.role === "administrativo") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <img
              src="/tr_logo.png"
              alt="TR Motors"
              className="h-16 w-auto object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Bem-vindo, {user.name}!
            </h1>
            <p className="text-slate-500">
              Use o menu lateral para navegar.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (user.role === "aluno") {
    return (
      <DashboardLayout>
        <EadPage />
      </DashboardLayout>
    );
  }

  if (user.role === "rh") {
    return <RhPage />;
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
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
