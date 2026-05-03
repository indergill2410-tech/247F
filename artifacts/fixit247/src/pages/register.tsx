import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Wrench, AlertCircle, Home, HardHat } from "lucide-react";
import { SuburbInput } from "@/components/suburb-input";

type Role = "homeowner" | "tradie";

export default function RegisterPage() {
  usePageTitle("Create Account");
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultRole = (params.get("role") as Role) ?? "homeowner";

  const { login } = useAuth();
  const [role, setRole] = useState<Role>(defaultRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState(params.get("suburb") ?? "");
  const [postcode, setPostcode] = useState("");
  const [error, setError] = useState("");

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        login(data);
        if (data.user.role === "tradie") setLocation("/dashboard/tradie");
        else setLocation("/dashboard");
      },
      onError: (err) => {
        const msg = (err as { data?: { message?: string } })?.data?.message;
        setError(msg ?? "Registration failed. Please try again.");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    registerMutation.mutate({
      data: { name, email, password, role, phone: phone || undefined, suburb: suburb || undefined, postcode: postcode || undefined },
    });
  };

  const inputCls = "w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffc800]/50 focus:bg-white/8 transition-all";

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

        <div className="bg-[#130f07] border border-white/8 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-white text-center mb-1">Create account</h1>
          <p className="text-white/45 text-sm text-center mb-7">Join Australia's fastest-growing repair marketplace</p>

          {/* Role toggle */}
          <div className="flex bg-white/5 border border-white/8 rounded-xl p-1 mb-6">
            {(["homeowner", "tradie"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  role === r
                    ? "bg-[#ffc800] text-black shadow-sm"
                    : "text-white/45 hover:text-white/70"
                }`}
              >
                {r === "homeowner" ? <Home className="h-4 w-4" /> : <HardHat className="h-4 w-4" />}
                {r === "homeowner" ? "Homeowner" : "Tradie"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="text-sm font-medium text-white/70">Full Name</label>
              <input id="reg-name" className={inputCls} placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="text-sm font-medium text-white/70">Email</label>
              <input id="reg-email" className={inputCls} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="text-sm font-medium text-white/70">Password</label>
              <input id="reg-password" className={inputCls} type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={8} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-phone" className="text-sm font-medium text-white/70">Phone <span className="text-white/30">(optional)</span></label>
              <input id="reg-phone" className={inputCls} type="tel" placeholder="04xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </div>

            <SuburbInput
              suburb={suburb}
              postcode={postcode}
              onSuburbChange={setSuburb}
              onPostcodeChange={setPostcode}
              suburbLabel="Suburb"
              postcodeLabel="Postcode"
              inputCls={inputCls}
              labelCls="text-sm font-medium text-white/70"
              layout="grid"
            />

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full h-11 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-[15px] transition-colors disabled:opacity-60 mt-2"
            >
              {registerMutation.isPending
                ? "Creating account…"
                : `Create ${role === "homeowner" ? "Homeowner" : "Tradie"} Account`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-[#ffc800] font-semibold hover:text-[#e6b800] cursor-pointer transition-colors">Sign in</span>
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
