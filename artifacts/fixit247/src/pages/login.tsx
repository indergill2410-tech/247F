import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Wrench, AlertCircle, Eye, EyeOff } from "lucide-react";

const DEMOS = [
  { label: "Homeowner", email: "homeowner@fixit247.com", pw: "password123" },
  { label: "Tradie", email: "tradie@fixit247.com", pw: "password123" },
  { label: "Admin", email: "admin@fixit247.com", pw: "admin123" },
];

function safeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    // Must be a relative path — no protocol, no double-slash (open-redirect guard)
    if (decoded.startsWith("/") && !decoded.startsWith("//") && !decoded.includes(":")) {
      return decoded;
    }
  } catch {
    // ignore malformed URIs
  }
  return null;
}

export default function LoginPage() {
  usePageTitle("Sign In");
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const returnTo = safeReturnTo(new URLSearchParams(searchString).get("returnTo"));

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        login(data);
        if (returnTo) { setLocation(returnTo); return; }
        const role = data.user.role;
        if (role === "admin") setLocation("/admin");
        else if (role === "tradie") setLocation("/dashboard/tradie");
        else setLocation("/dashboard");
      },
      onError: (err) => {
        const msg = (err as { data?: { message?: string } })?.data?.message;
        setError(msg ?? "Invalid email or password");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: "radial-gradient(ellipse at 30% 60%, #1f1808 0%, #0b0904 60%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center justify-center gap-2 mb-10 cursor-pointer">
            <Wrench className="h-6 w-6 text-[#ffc800]" />
            <span className="text-2xl font-black text-white tracking-tight">
              Fixit <span className="text-[#ffc800]">24/7</span>
            </span>
          </div>
        </Link>

        {/* Card */}
        <div className="bg-[#130f07] border border-white/8 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-white text-center mb-1">Welcome back</h1>
          <p className="text-white/45 text-sm text-center mb-8">Sign in to your Fixit 24/7 account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-white/70">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffc800]/50 focus:bg-white/8 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-white/70">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffc800]/50 focus:bg-white/8 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-11 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-[15px] transition-colors disabled:opacity-60 mt-2"
            >
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 border-t border-white/8 pt-6">
            <p className="text-xs text-white/35 text-center mb-3 uppercase tracking-wider font-medium">Demo accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMOS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs font-medium text-white/60 hover:text-white hover:border-white/20 hover:bg-white/8 transition-all"
                  onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-white/40">
            Don't have an account?{" "}
            <Link href="/signup">
              <span className="text-[#ffc800] font-semibold hover:text-[#e6b800] cursor-pointer transition-colors">
                Sign up free
              </span>
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
