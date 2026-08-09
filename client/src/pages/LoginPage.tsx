import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Car, ClipboardCheck, GraduationCap, Users, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      // Store token in localStorage for mobile WebView support
      if (data?.token) {
        try {
          localStorage.setItem("trmotors_auth_token", data.token);
          sessionStorage.setItem("manus-cookie", `app_session_id=${data.token}`);
        } catch {}
      }
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

  const features = [
    { icon: Car, label: "Estoque & Vistorias", desc: "Controle total de veículos" },
    { icon: ClipboardCheck, label: "Pipeline & Entrega", desc: "Fluxo de vendas completo" },
    { icon: Users, label: "RH & Financeiro", desc: "Pessoas e finanças integrados" },
    { icon: GraduationCap, label: "EAD & Treinamento", desc: "Capacitação da equipe" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f8] flex flex-col lg:flex-row overflow-hidden">
      {/* ============ LEFT BRAND PANEL ============ */}
      <div className="relative hidden lg:flex lg:w-[55%] bg-white flex-col justify-between p-12 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-red-600/8 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-gray-900/5 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(rgba(0,0,0,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

        {/* Top: logo */}
        <div className="relative flex items-center gap-3">
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 px-4 py-2.5">
            <img src="/tr_logo.png" alt="TR Motors" className="h-12 w-auto object-contain" />
          </div>
        </div>

        {/* Center: hero */}
        <div className="relative max-w-xl">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-100 mb-6">
            <Sparkles size={12} />
            Sistema ERP Profissional para Concessionárias
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-[1.1] mb-5 tracking-tight">
            Gestão completa do seu
            <span className="block text-red-600">processo de venda</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-10">
            Da vistoria de compra à entrega do veículo: controle de estoque,
            CRM, aprovações, despachante, RH, EAD e finanças em uma única plataforma.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm shadow-black/5 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
                  <f.icon className="h-5 w-5 text-red-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{f.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="relative text-gray-400 text-sm">
          © {new Date().getFullYear()} TR Motors — Todos os direitos reservados
        </p>
      </div>

      {/* ============ RIGHT FORM PANEL ============ */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center px-6 py-10 sm:px-10 lg:py-0 bg-gradient-to-b from-white to-[#f7f7f8]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 px-5 py-3">
              <img src="/tr_logo.png" alt="TR Motors" className="h-14 w-auto object-contain" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Bem-vindo de volta</h2>
          <p className="text-gray-500 text-sm mt-2 mb-8">
            Faça login para acessar o painel da sua concessionária
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
                className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-red-500 focus:ring-red-500/15 focus:ring-4 rounded-xl transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Senha</label>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                  className="h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 focus:border-red-500 focus:ring-red-500/15 focus:ring-4 rounded-xl pr-12 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Mostrar senha"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-12 bg-gray-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/25 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Test credentials */}
          <div className="mt-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Acesso de demonstração
            </p>
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500">
                Email:{" "}
                <button
                  type="button"
                  onClick={() => { setEmail("admin@test.com"); navigator.clipboard?.writeText("admin@test.com"); toast.success("Email copiado"); }}
                  className="bg-gray-900 text-white px-1.5 py-0.5 rounded font-mono hover:bg-black transition-colors"
                >
                  admin@test.com
                </button>
              </p>
              <p className="text-xs text-gray-500">
                Senha:{" "}
                <button
                  type="button"
                  onClick={() => { setPassword("123456"); navigator.clipboard?.writeText("123456"); toast.success("Senha copiada"); }}
                  className="bg-gray-900 text-white px-1.5 py-0.5 rounded font-mono hover:bg-black transition-colors"
                >
                  123456
                </button>
                <span className="text-gray-300 ml-1">(copiar ao tocar)</span>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8 lg:hidden">
            © {new Date().getFullYear()} TR Motors — Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
