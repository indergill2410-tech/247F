import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Wrench, AlertCircle, Home, HardHat, Check, ChevronDown } from "lucide-react";
import { SuburbInput } from "@/components/suburb-input";

type Role = "homeowner" | "tradie";

const TRADES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Tiling",
  "HVAC / Air conditioning",
  "Locksmith",
  "Roofing",
  "Landscaping & gardening",
  "Handyman / general repairs",
  "Glazier",
  "Plasterer",
  "Flooring",
  "Appliance repair",
  "Pest control",
];

function safeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/") && !decoded.startsWith("//") && !decoded.includes(":")) {
      return decoded;
    }
  } catch { /* ignore */ }
  return null;
}

export default function RegisterPage() {
  usePageTitle("Create Account");
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultRole = (params.get("role") as Role) ?? "homeowner";
  const returnTo = safeReturnTo(params.get("returnTo"));
  const autosubmit = params.get("autosubmit") === "true";

  const { login } = useAuth();
  const [role, setRole] = useState<Role>(defaultRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState(params.get("suburb") ?? "");
  const [postcode, setPostcode] = useState("");
  const [primaryTrade, setPrimaryTrade] = useState("");
  const [secondaryTrades, setSecondaryTrades] = useState<string[]>([]);
  const [error, setError] = useState("");

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        login(data);
        if (autosubmit) { setLocation("/post-job?autosubmit=true"); return; }
        if (returnTo) { setLocation(returnTo); return; }
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
    if (role === "tradie" && !primaryTrade) {
      setError("Please select your primary trade.");
      return;
    }
    registerMutation.mutate({
      data: {
        name,
        email,
        password,
        role,
        phone: phone || undefined,
        suburb: suburb || undefined,
        postcode: postcode || undefined,
        ...(role === "tradie" ? {
          primaryTrade: primaryTrade || undefined,
          secondaryTrades: secondaryTrades.length > 0 ? secondaryTrades : undefined,
        } : {}),
      },
    });
  };

  const toggleSecondaryTrade = (trade: string) => {
    if (trade === primaryTrade) return;
    setSecondaryTrades((prev) =>
      prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade]
    );
  };

  const inputCls = "w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffc800]/50 focus:bg-white/8 transition-all";
  const labelCls = "text-sm font-medium text-white/70";

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
          <p className="text-white/45 text-sm text-center mb-7">
            {autosubmit
              ? "Create a free account to post your job — takes 30 seconds"
              : "Join Australia's fastest-growing repair marketplace"}
          </p>

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
              <label htmlFor="reg-name" className={labelCls}>Full Name</label>
              <input id="reg-name" className={inputCls} placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-email" className={labelCls}>Email</label>
              <input id="reg-email" className={inputCls} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-password" className={labelCls}>Password</label>
              <input id="reg-password" className={inputCls} type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={8} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-phone" className={labelCls}>Phone <span className="text-white/30">(optional)</span></label>
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
              labelCls={labelCls}
              layout="grid"
            />

            {/* Trade section — tradie only */}
            {role === "tradie" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 border-t border-white/8 pt-4 mt-2"
              >
                <div>
                  <p className="text-sm font-bold text-[#ffc800] mb-0.5">Your Trade Specialisation</p>
                  <p className="text-xs text-white/40">This helps us match you to the right jobs.</p>
                </div>

                {/* Primary trade */}
                <div className="space-y-1.5">
                  <label className={labelCls}>Primary Trade <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select
                      value={primaryTrade}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPrimaryTrade(val);
                        setSecondaryTrades((prev) => prev.filter((t) => t !== val));
                      }}
                      className="w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 pr-10 text-sm text-white appearance-none focus:outline-none focus:border-[#ffc800]/50 focus:bg-white/8 transition-all"
                      required
                    >
                      <option value="" className="bg-[#1a1509] text-white/50">Select your main trade…</option>
                      {TRADES.map((t) => (
                        <option key={t} value={t} className="bg-[#1a1509] text-white">{t}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                  </div>
                </div>

                {/* Secondary trades */}
                <div className="space-y-2">
                  <label className={labelCls}>Secondary Trades <span className="text-white/30">(optional)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {TRADES.filter((t) => t !== primaryTrade).map((trade) => {
                      const selected = secondaryTrades.includes(trade);
                      return (
                        <button
                          key={trade}
                          type="button"
                          onClick={() => toggleSecondaryTrade(trade)}
                          className={`h-8 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                            selected
                              ? "bg-[#ffc800]/15 border-[#ffc800]/40 text-[#ffc800]"
                              : "bg-white/4 border-white/8 text-white/45 hover:bg-white/8 hover:text-white/65"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3 flex-shrink-0" />}
                          {trade}
                        </button>
                      );
                    })}
                  </div>
                  {secondaryTrades.length > 0 && (
                    <p className="text-xs text-white/35">{secondaryTrades.length} additional trade{secondaryTrades.length !== 1 ? "s" : ""} selected</p>
                  )}
                </div>
              </motion.div>
            )}

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
            <Link href={autosubmit ? "/login?autosubmit=true" : returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"}>
              <span className="text-[#ffc800] font-semibold hover:text-[#e6b800] cursor-pointer transition-colors">Sign in</span>
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
