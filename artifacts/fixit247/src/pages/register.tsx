import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { track, identifyUser } from "@/lib/posthog";
import {
  Wrench, AlertCircle, Home, HardHat, Check, ChevronDown,
  Gift, ArrowLeft, ChevronRight, Lock, Clock, Shield,
  CheckCircle2, Star, Users,
} from "lucide-react";
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

// What happens after sign-up — shown on the homeowner step 2 card
const HOMEOWNER_NEXT_STEPS = [
  { icon: Wrench, text: "Post your first job in under 2 minutes" },
  { icon: Users, text: "Get up to 5 quotes from local tradies" },
  { icon: Check, text: "Choose the tradie that suits you best" },
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

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < step ? "bg-primary" : "bg-white/10"
          }`}
          aria-hidden="true"
        />
      ))}
      <span className="text-xs text-white/35 shrink-0 ml-1">{step}/{total}</span>
    </div>
  );
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

  // Step management: 1 = core details, 2 = location + trade
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [role, setRole] = useState<Role>(defaultRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 fields
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState(params.get("suburb") ?? "");
  const [postcode, setPostcode] = useState("");
  const [primaryTrade, setPrimaryTrade] = useState("");

  const [error, setError] = useState("");

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        login(data);
        identifyUser(data.user.id, { email: data.user.email, role: data.user.role, name: data.user.name });
        track("user_registered", { role: data.user.role });
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

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
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
        ...(role === "tradie" ? { primaryTrade: primaryTrade || undefined } : {}),
      },
    });
  };

  const inputCls = "w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all";
  const labelCls = "text-sm font-medium text-white/70";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: "var(--app-hero-gradient)" }}
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
            <Wrench className="h-6 w-6 text-primary" />
            <span className="text-2xl font-black text-white tracking-tight">
              Fixit <span className="text-primary">24/7</span>
            </span>
          </div>
        </Link>

        <div className="bg-[#130f07] border border-white/8 rounded-2xl p-8 shadow-2xl">
          <ProgressBar step={step} total={2} />

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl font-black text-white text-center mb-1">You're 30 seconds away</h1>
                <p className="text-white/45 text-sm text-center mb-7">
                  {autosubmit
                    ? "Create a free account to post your job — takes 30 seconds"
                    : role === "tradie"
                      ? "Your $111 wallet credit is waiting. No credit card needed."
                      : "Post a job free. Get your first quote in minutes."}
                </p>

                {/* Role toggle */}
                <div className="flex bg-white/5 border border-white/8 rounded-xl p-1 mb-5">
                  {(["homeowner", "tradie"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                        role === r
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-white/45 hover:text-white/70"
                      }`}
                    >
                      {r === "homeowner" ? <Home className="h-4 w-4" /> : <HardHat className="h-4 w-4" />}
                      {r === "homeowner" ? "Homeowner" : "Tradie"}
                    </button>
                  ))}
                </div>

                {role === "tradie" && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3">
                    <Gift className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-bold text-white">$111 AUD in free job leads — every month for 6 months</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/50">Hits your wallet the moment you join. Each claim costs from $22 — that's up to 5 free leads today. No credit card. No commission. Ever.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleStep1} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="reg-name" className={labelCls}>Full Name</label>
                    <input
                      id="reg-name"
                      className={inputCls}
                      placeholder="Jane Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reg-email" className={labelCls}>Email</label>
                    <input
                      id="reg-email"
                      className={inputCls}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reg-password" className={labelCls}>Password</label>
                    <input
                      id="reg-password"
                      className={inputCls}
                      type="password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      minLength={8}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-[15px] transition-colors mt-2 inline-flex items-center justify-center gap-2"
                  >
                    Next — pick your location
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>

                {/* Reassurance micro-copy */}
                <div className="flex items-center justify-center gap-3 mt-4">
                  <span className="flex items-center gap-1 text-[11px] text-white/30">
                    <Lock className="h-3 w-3" aria-hidden="true" /> No credit card
                  </span>
                  <span className="text-white/15">·</span>
                  <span className="flex items-center gap-1 text-[11px] text-white/30">
                    <Clock className="h-3 w-3" aria-hidden="true" /> 30 seconds
                  </span>
                  <span className="text-white/15">·</span>
                  <span className="flex items-center gap-1 text-[11px] text-white/30">
                    <Shield className="h-3 w-3" aria-hidden="true" /> Cancel anytime
                  </span>
                </div>

                <p className="mt-5 text-center text-sm text-white/40">
                  Already have an account?{" "}
                  <Link href={autosubmit ? "/login?autosubmit=true" : returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"}>
                    <span className="text-primary font-semibold hover:opacity-90 cursor-pointer transition-colors">Sign in</span>
                  </Link>
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors mb-5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back
                </button>

                <h1 className="text-2xl font-black text-white mb-1">
                  {role === "tradie" ? "Your trade & location" : "Last step — where are you?"}
                </h1>
                <p className="text-white/45 text-sm mb-7">
                  {role === "tradie"
                    ? "Help us match you to the right jobs in your area."
                    : "Helps us show you verified tradies nearby."}
                </p>

                <form onSubmit={handleStep2} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="reg-phone" className={labelCls}>
                      Phone <span className="text-white/30">(optional)</span>
                    </label>
                    <input
                      id="reg-phone"
                      className={inputCls}
                      type="tel"
                      placeholder="04xx xxx xxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                    />
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

                  {/* Primary trade — tradie only */}
                  {role === "tradie" && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-1.5"
                    >
                      <label className={labelCls}>
                        Primary Trade <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={primaryTrade}
                          onChange={(e) => setPrimaryTrade(e.target.value)}
                          className="w-full h-11 bg-white/6 border border-white/10 rounded-xl px-4 pr-10 text-sm text-white appearance-none focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all"
                          required
                        >
                          <option value="" className="bg-[#1a1509] text-white/50">Select your main trade…</option>
                          {TRADES.map((t) => (
                            <option key={t} value={t} className="bg-[#1a1509] text-white">{t}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                      </div>
                      <p className="text-xs text-white/30">You can add additional trades from your profile after sign-up.</p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full h-11 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-[15px] transition-colors disabled:opacity-60 mt-2"
                  >
                    {registerMutation.isPending
                      ? "Creating account…"
                      : role === "tradie"
                        ? "Claim $111 in free leads & join"
                        : "Create account & find tradies"}
                  </button>
                </form>

                {/* What happens next — homeowner only */}
                {role === "homeowner" && (
                  <div className="mt-6 rounded-xl border border-white/6 bg-white/2 p-4">
                    <p className="text-xs font-bold text-white/45 uppercase tracking-wider mb-3">What happens next</p>
                    <ul className="space-y-2.5">
                      {HOMEOWNER_NEXT_STEPS.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                            <Icon className="h-3 w-3 text-primary" aria-hidden="true" />
                          </div>
                          <span className="text-xs text-white/50 leading-snug">{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reassurance micro-copy */}
                <div className="flex items-center justify-center gap-3 mt-4">
                  <span className="flex items-center gap-1 text-[11px] text-white/30">
                    <Lock className="h-3 w-3" aria-hidden="true" /> No credit card
                  </span>
                  <span className="text-white/15">·</span>
                  <span className="flex items-center gap-1 text-[11px] text-white/30">
                    <Shield className="h-3 w-3" aria-hidden="true" /> Cancel anytime
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
