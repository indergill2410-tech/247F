import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Zap, CreditCard, Clock, CheckCircle, AlertTriangle, ArrowUpRight, Package, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Pack {
  id: string;
  name: string;
  description: string;
  metadata: { credits?: string };
  prices: { id: string; unitAmount: number; currency: string; credits: string | null }[];
}

interface CreditTx {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

interface CreditsData {
  balanceCents: number;
  leadCostCentsDefault: number;
  welcomeGrantCents: number;
  transactions: CreditTx[];
}

const TX_ICONS: Record<string, { Icon: React.ElementType; cls: string; label: string }> = {
  welcome_grant:      { Icon: Zap,         cls: "text-primary bg-primary/10",           label: "Welcome Grant" },
  subscription_grant: { Icon: Clock,       cls: "text-blue-400 bg-blue-500/10",         label: "Monthly Renewal" },
  purchase:           { Icon: CreditCard,  cls: "text-emerald-400 bg-emerald-500/10",   label: "Top-up Purchase" },
  lead_deduct:        { Icon: Package,     cls: "text-white/40 bg-white/6",             label: "Job Claim" },
  refund:             { Icon: CheckCircle, cls: "text-emerald-400 bg-emerald-500/10",   label: "Refund" },
  adjustment:         { Icon: CreditCard,  cls: "text-blue-400 bg-blue-500/10",         label: "Adjustment" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function fmtAud(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function CreditsPage() {
  usePageTitle("Buy Credits");
  const { token } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [creditsData, setCreditsData] = useState<CreditsData | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Check for payment success/cancel query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const sessionId = params.get("session_id");

    if (payment === "success" && sessionId) {
      // Verify the session and grant credits
      fetch(`${API_BASE}/api/stripe/verify-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && !data.alreadyProcessed) {
            toast({ title: "Funds added!", description: `$${((data.creditsAdded ?? 0) / 100).toFixed(0)} AUD has been added to your wallet.` });
          } else if (data.alreadyProcessed) {
            toast({ title: "Already processed", description: "This payment was already applied to your account." });
          }
          // Remove query params
          navigate("/credits");
        })
        .catch(() => toast({ title: "Verification failed", description: "Please contact support.", variant: "destructive" }));
    } else if (payment === "cancelled") {
      toast({ title: "Payment cancelled", description: "Your payment was not processed.", variant: "destructive" });
      navigate("/credits");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/stripe/credits`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API_BASE}/api/stripe/packs`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([credits, packsData]) => {
        setCreditsData(credits);
        setPacks(packsData.packs ?? []);
      })
      .catch(() => toast({ title: "Failed to load wallet", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleBuy(priceId: string) {
    if (!token) return;
    setPurchasing(priceId);
    try {
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Checkout failed", description: data.message ?? "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not start checkout.", variant: "destructive" });
    } finally {
      setPurchasing(null);
    }
  }

  const balanceCents = creditsData?.balanceCents ?? 0;
  const leadCostCents = creditsData?.leadCostCentsDefault ?? 2200;
  const jobsLeft = Math.floor(balanceCents / leadCostCents);

  const PACK_HIGHLIGHTS = [
    { credits: "300", color: "border-white/10",   badge: "" },
    { credits: "600", color: "border-primary/30", badge: "Best Value" },
    { credits: "900", color: "border-white/10",   badge: "Pro" },
  ];

  const PACK_SUBTITLES: Record<string, string> = {
    "300": "≈ 2 job claims at the standard $22 rate",
    "600": "≈ 4–5 job claims · best value",
    "900": "≈ 7–8 job claims · maximum reach",
  };

  return (
    <div className="min-h-screen bg-[#0b0904]">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-black text-white">Wallet</h1>
          <p className="text-sm text-white/40 mt-1">Use your wallet balance to claim jobs. Cost varies by job size — from $22 for small jobs.</p>
        </motion.div>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#130f07] border border-white/8 rounded-2xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">Wallet Balance</p>
              {loading ? (
                <div className="h-12 w-28 bg-white/6 rounded-xl animate-pulse" />
              ) : (
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black text-white">{fmtAud(balanceCents)}</span>
                  <span className="text-lg text-white/40 font-semibold pb-1">AUD</span>
                </div>
              )}
              {!loading && (
                <p className={`text-sm mt-2 font-semibold ${balanceCents > 0 ? "text-emerald-400" : "text-orange-400"}`}>
                  {balanceCents > 0
                    ? `Up to ${jobsLeft} claim${jobsLeft !== 1 ? "s" : ""} (varies by job size)`
                    : "No funds — top up your wallet to claim jobs"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${balanceCents > 0 ? "bg-primary/10" : "bg-orange-500/10"}`}>
                <Zap className={`h-8 w-8 ${balanceCents > 0 ? "text-primary" : "text-orange-400"}`} />
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {!loading && creditsData && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-white/30 mb-2">
                <span>$0</span>
                <span>{fmtAud(creditsData.welcomeGrantCents)} (full month)</span>
              </div>
              <div className="h-2.5 bg-white/6 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${balanceCents > 0 ? "bg-primary" : "bg-orange-400"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((balanceCents / creditsData.welcomeGrantCents) * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Alert: low credits */}
        <AnimatePresence>
          {!loading && balanceCents < leadCostCents && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-start gap-3"
            >
              <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-orange-300">Your wallet is empty</p>
                <p className="text-xs text-orange-300/70 mt-0.5">
                  You need at least ${(leadCostCents / 100).toFixed(0)} AUD to claim a job. Top up your wallet below to keep working.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#130f07] border border-white/6 rounded-2xl p-5"
        >
          <h2 className="font-bold text-white text-sm mb-4">How your wallet works</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Zap, color: "text-primary bg-primary/10", title: "$111 AUD free every month", desc: "$111 AUD wallet credit — automatically renewed on the 1st of each month for every active tradie." },
              { icon: Package, color: "text-blue-400 bg-blue-500/10", title: "Cost varies by job size", desc: "Small jobs start from $22. Larger jobs cost more. The exact cost is shown upfront on every job card before you claim — no surprises." },
              { icon: CreditCard, color: "text-emerald-400 bg-emerald-500/10", title: "Top up anytime", desc: "Wallet top-up packs from $49 AUD. Funds never expire." },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Credit packs */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-bold text-white text-sm mb-4"
          >
            Top up your wallet
          </motion.h2>

          {loading ? (
            <div className="grid sm:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-[#130f07] border border-white/6 rounded-2xl p-5 animate-pulse h-48" />
              ))}
            </div>
          ) : packs.length === 0 ? (
            <div className="bg-[#130f07] border border-white/6 rounded-2xl p-8 text-center">
              <Package className="h-8 w-8 mx-auto mb-3 text-white/20" />
              <p className="text-sm text-white/40">Credit packs are being set up.</p>
              <p className="text-xs text-white/25 mt-1">Check back shortly or contact support.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid sm:grid-cols-3 gap-4"
            >
              {packs
                .map((pack) => {
                const credits = pack.metadata?.credits ?? "0";
                const price = pack.prices[0];
                const highlight = PACK_HIGHLIGHTS.find((h) => h.credits === credits);
                const isBuying = purchasing === price?.id;
                const subtitle = PACK_SUBTITLES[credits] ?? null;

                return (
                  <motion.div
                    key={pack.id}
                    whileHover={{ y: -4, transition: { duration: 0.15 } }}
                    className={`bg-[#130f07] border rounded-2xl p-5 flex flex-col relative overflow-hidden ${highlight?.color ?? "border-white/10"}`}
                  >
                    {highlight?.badge && (
                      <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                        {highlight.badge}
                      </div>
                    )}
                    <div className="mb-4">
                      <p className="text-3xl font-black text-white">{price ? fmtAud(price.unitAmount ?? 0) : "—"}</p>
                      <p className="text-xs text-white/40 mt-0.5">AUD added to wallet</p>
                    </div>
                    <p className="text-sm font-semibold text-white/70 mb-1">{pack.name.replace("Fixit 247 ", "")}</p>
                    {price && (
                      <>
                        {subtitle && (
                          <p className="text-xs text-white/35">{subtitle}</p>
                        )}
                        <div className="mt-auto pt-4">
                          <p className="text-xl font-black text-primary mb-3">{fmtAud(price.unitAmount)} AUD</p>
                          <button
                            className="w-full h-10 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                            disabled={!!purchasing}
                            onClick={() => handleBuy(price.id)}
                          >
                            {isBuying ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                              </>
                            ) : (
                              <>
                                Buy Now <ArrowUpRight className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Transaction history */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/6">
            <h2 className="font-bold text-white">Wallet History</h2>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse">
                  <div className="h-10 bg-white/6 rounded-lg" />
                </div>
              ))
            ) : !creditsData?.transactions?.length ? (
              <div className="text-center py-10 text-white/30">
                <Clock className="h-6 w-6 mx-auto mb-2 text-white/15" />
                <p className="text-sm">No transactions yet.</p>
              </div>
            ) : (
              creditsData.transactions.map((tx) => {
                const meta = TX_ICONS[tx.type] ?? TX_ICONS.claim_deduct;
                const { Icon } = meta;
                const isPositive = tx.amount > 0;
                return (
                  <div key={tx.id} className="px-6 py-4 flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.cls}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{meta.label}</p>
                      {tx.description && (
                        <p className="text-xs text-white/35 mt-0.5 truncate">{tx.description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${isPositive ? "text-emerald-400" : "text-white/50"}`}>
                        {isPositive ? "+" : "−"}${(Math.abs(tx.amount) / 100).toFixed(0)}
                      </p>
                      <p className="text-[10px] text-white/25">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
