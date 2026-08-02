import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Car, Shield, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || "Email ou senha incorretos");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await loginMutation.mutateAsync({ email, password });
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative min-h-screen flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 relative">
          {/* Top branding */}
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-3 shadow-2xl shadow-red-900/20">
              <img src="/tr_logo.png" alt="TR Motors" className="h-16 w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">TR Motors</h1>
              <p className="text-red-400 text-sm font-medium">Sistema ERP Profissional</p>
            </div>
          </div>

          {/* Center content */}
          <div className="max-w-lg mx-auto text-center">
            <div className="mb-8 flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <img src="/tr_logo.png" alt="TR Motors" className="h-32 w-auto object-contain" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Gestão Inteligente<br />
              <span className="text-red-500">de Veículos</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Controle completo de entregas, vendas, vistorias e processos administrativos em uma única plataforma.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Car, label: "Vistorias" },
                { icon: Shield, label: "Segurança" },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
                  <item.icon className="h-6 w-6 text-red-400 mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} TR Motors — Todos os direitos reservados
          </p>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="bg-white rounded-xl p-3 shadow-xl">
                <img src="/tr_logo.png" alt="TR Motors" className="h-14 w-auto object-contain" />
              </div>
            </div>

            <div className="lg:hidden mb-6">
              <h1 className="text-2xl font-bold text-white">TR Motors</h1>
              <p className="text-gray-400 text-sm">Sistema ERP Profissional</p>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">Bem-vindo</h2>
            <p className="text-gray-400 text-sm mb-8">Faça login para acessar o sistema</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 focus:ring-2 rounded-xl transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Senha</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 focus:ring-2 rounded-xl pr-12 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-red-900/30 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <p className="text-xs text-gray-400 mb-2">
                <strong className="text-gray-300">Dados de teste:</strong>
              </p>
              <p className="text-xs text-gray-500">
                Email: <code className="bg-white/10 px-1.5 py-0.5 rounded text-red-400">admin@test.com</code>
              </p>
              <p className="text-xs text-gray-500">
                Senha: <code className="bg-white/10 px-1.5 py-0.5 rounded text-red-400">123456</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
