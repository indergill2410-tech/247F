import { usePageTitle } from "@/hooks/use-page-title";
import { track } from "@/lib/posthog";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetTradiedashboard, useClaimJob, useGetMe } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  Briefcase,
  CheckCircle,
  ChevronRight,
  MapPin,
  Clock,
  Zap,
  MessageSquare,
  User,
  Search,
  Award,
  AlertCircle,
  Settings,
  X,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const URGENCY: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  emergency: { label: "Emergency", cls: "bg-red-500/15 text-red-400",      Icon: Zap },
  urgent:    { label: "Urgent",    cls: "bg-orange-500/15 text-orange-400", Icon: Clock },
  standard:  { label: "Standard",  cls: "bg-white/8 text-white/60",         Icon: Briefcase },
};

const CLAIM_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-primary/15 text-primary" },
  accepted:  { label: "Accepted",  cls: "bg-emerald-500/15 text-emerald-400" },
  rejected:  { label: "Rejected",  cls: "bg-red-500/15 text-red-400" },
  withdrawn: { label: "Withdrawn", cls: "bg-white/8 text-white/60" },
  completed: { label: "Completed", cls: "bg-blue-500/15 text-blue-400" },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const cardItem = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function timeAgo(date: string | Date): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const wks = Math.floor(days / 7);
  if (wks < 5) return `${wks}w ago`;
  const mths = Math.floor(days / 30);
  if (mths < 12) return `${mths}mo ago`;
  return `${Math.floor(mths / 12)}y ago`;
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating > i && rating < i + 1;
        return (
          <span key={i} className="relative inline-block">
            {/* empty base */}
            <Star className={`${cls} text-white/20`} />
            {/* filled overlay */}
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : "50%" }}
              >
                <Star className={`${cls} fill-primary text-primary`} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function ProfileBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "bg-emerald-400" : pct >= 60 ? "bg-primary" : "bg-orange-400";
  return (
    <div className="w-full bg-white/8 rounded-full h-2 overflow-hidden">
      <motion.div
        className={`h-full ${color} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

export default function TradieDashboard() {
  usePageTitle("Tradie Dashboard");
  const { user, token } = useAuth();
  const { data, isLoading, refetch } = useGetTradiedashboard();
  const { data: meData } = useGetMe();
  const { toast } = useToast();

  // Wallet balance in cents
  const [walletCents, setWalletCents] = useState<number | null>(null);
  // Minimum lead cost in cents (small job ≈ $22) — used for conservative "jobs left" estimate
  const MIN_LEAD_COST_CENTS = 2200;

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/stripe/credits`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.balanceCents === "number") setWalletCents(d.balanceCents);
      })
      .catch(() => {});
  }, [token]);

  const [showWelcomeModal, setShowWelcomeModal] = useState(() =>
    !localStorage.getItem("fixit247_tradie_welcomed")
  );
  const dismissWelcomeModal = () => {
    localStorage.setItem("fixit247_tradie_welcomed", "1");
    setShowWelcomeModal(false);
  };

  const [claimsFilter, setClaimsFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  // Available jobs filter state
  const [jobFilterCategory, setJobFilterCategory] = useState<string>("");
  const [jobFilterUrgency, setJobFilterUrgency] = useState<string>("");
  const [jobFilterSuburb, setJobFilterSuburb] = useState<string>("");
  const [jobFilterBudget, setJobFilterBudget] = useState<string>("");

  const filteredAvailableJobs = (data?.availableJobs ?? []).filter((job) => {
    if (jobFilterCategory && job.categoryName !== jobFilterCategory) return false;
    if (jobFilterUrgency && job.urgency !== jobFilterUrgency) return false;
    if (jobFilterSuburb && !(job.suburb?.toLowerCase().includes(jobFilterSuburb.toLowerCase()))) return false;
    if (jobFilterBudget && job.budget != null && job.budget > Number(jobFilterBudget)) return false;
    return true;
  });
  const availableCategories = [...new Set((data?.availableJobs ?? []).map((j) => j.categoryName).filter(Boolean))];

  // Inline claim expansion state: jobId → { message, proposedPrice }
  const [expandedClaimJobId, setExpandedClaimJobId] = useState<number | null>(null);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimPrice, setClaimPrice] = useState("");
  const [pendingClaimCost, setPendingClaimCost] = useState<number | null>(null);

  const claimMutation = useClaimJob({
    mutation: {
      onSuccess: () => {
        const costCents = pendingClaimCost;
        const costStr = costCents != null ? `$${(costCents / 100).toFixed(2)} deducted.` : "";
        track("job_claimed", { leadCostCents: costCents });
        toast({
          title: "Claimed!",
          description: `${costStr} You've successfully claimed this job.`.trim(),
        });
        setExpandedClaimJobId(null);
        setClaimMessage("");
        setClaimPrice("");
        setPendingClaimCost(null);
        refetch();
        // Refresh wallet balance
        if (token) {
          fetch(`${API_BASE}/api/stripe/credits`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => { if (typeof d.balanceCents === "number") setWalletCents(d.balanceCents); })
            .catch(() => {});
        }
      },
      onError: (err) => {
        const errData = err as { data?: { message?: string; error?: string; balanceCents?: number; requiredCents?: number } };
        if (errData?.data?.error === "insufficient_funds") {
          const bal = ((errData.data.balanceCents ?? 0) / 100).toFixed(2);
          const req = ((errData.data.requiredCents ?? MIN_LEAD_COST_CENTS) / 100).toFixed(2);
          toast({
            title: "Insufficient wallet balance",
            description: `You need $${req} to claim this job. Your balance: $${bal}. Top up at Wallet.`,
            variant: "destructive",
          });
          if (errData.data.balanceCents != null) setWalletCents(errData.data.balanceCents);
        } else {
          const msg = errData?.data?.message ?? "Failed to claim job";
          toast({ title: "Error", description: msg, variant: "destructive" });
        }
      },
    },
  });

  function handleClaimExpand(jobId: number, creditCost?: number | null) {
    if (expandedClaimJobId === jobId) {
      setExpandedClaimJobId(null);
      setPendingClaimCost(null);
    } else {
      setExpandedClaimJobId(jobId);
      setPendingClaimCost(creditCost ?? null);
      setClaimMessage("");
      setClaimPrice("");
    }
  }

  function submitClaim(jobId: number) {
    claimMutation.mutate({
      jobId,
      data: {
        message: claimMessage || undefined,
        proposedPrice: claimPrice ? Number(claimPrice) : undefined,
      },
    });
  }

  const firstName = user?.name?.split(" ")[0] ?? "Tradie";
  const initials = (user?.name ?? "T")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const pct = data?.profileCompletion ?? 0;
  const memberSince = data?.memberSince
    ? new Date(data.memberSince).toLocaleDateString("en-AU", { month: "long", year: "numeric" })
    : null;

  // Accepted claims sourced directly from dedicated API field (comprehensive, no limit)
  const acceptedClaims = data?.acceptedClaims ?? [];

  const jobsLeft = walletCents !== null ? Math.floor(walletCents / MIN_LEAD_COST_CENTS) : null;
  const walletDisplay = walletCents !== null ? `$${(walletCents / 100).toFixed(2)}` : "–";
  const walletLow = walletCents !== null && walletCents < MIN_LEAD_COST_CENTS;

  const stats = [
    {
      label: "Active Jobs",
      value: data?.activeJobs ?? 0,
      icon: Briefcase,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      desc: "pending + accepted",
    },
    {
      label: "Completed",
      value: data?.completedJobs ?? 0,
      icon: Award,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      desc: "all time",
    },
    {
      label: "Rating",
      value: data?.myRating != null ? data.myRating.toFixed(1) : "–",
      icon: Star,
      color: "text-primary",
      bg: "bg-primary/10",
      desc: `${data?.myReviewCount ?? 0} review${(data?.myReviewCount ?? 0) !== 1 ? "s" : ""}`,
    },
    {
      label: "Earned This Month",
      value: (data as { earningsThisMonth?: number } | undefined)?.earningsThisMonth != null
        ? `$${((data as { earningsThisMonth?: number }).earningsThisMonth!).toLocaleString()}`
        : "$0",
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      desc: "from completed jobs",
    },
  ];

  return (
    <>
    <AnimatePresence>
      {showWelcomeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="bg-[#1a1409] border border-[#f5ede0]/10 rounded-2xl p-7 max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/15 mx-auto mb-4">
              <DollarSign className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-black text-white text-center mb-1">Your $111 wallet is live!</h2>
            <p className="text-white/55 text-sm text-center mb-5">
              Up to 5 free job leads today — no credit card, no commission, ever.
            </p>
            <div className="space-y-3 mb-6">
              {[
                { done: true,  label: "Account created" },
                { done: false, label: "Complete your profile to unlock more jobs" },
                { done: false, label: "Claim your first job lead" },
              ].map(({ done, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/8 text-white/30"}`}>
                    {done ? "✓" : ""}
                  </span>
                  <span className={`text-sm ${done ? "text-white/70 line-through" : "text-white/80"}`}>{label}</span>
                </div>
              ))}
            </div>
            <Link to="/profile">
              <button
                onClick={dismissWelcomeModal}
                className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors mb-2"
              >
                Complete my profile →
              </button>
            </Link>
            <button
              onClick={dismissWelcomeModal}
              className="w-full text-white/40 text-sm py-2 hover:text-white/60 transition-colors"
            >
              Explore dashboard first
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <div className="min-h-screen bg-[#0d0a05]">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-0">
        {/* Hero header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-[#1a1409] border border-[#f5ede0]/6 rounded-2xl p-5 sm:p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar + status dot */}
            <div className="relative flex-shrink-0 self-start sm:self-center">
              <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-2xl font-black text-black tracking-tight">{initials}</span>
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#130f07] shadow" title="Online" />
            </div>

            {/* Name / rating / meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-black text-[#f5ede0] leading-none">{user?.name ?? firstName}</h1>
                {(meData as { primaryTrade?: string | null })?.primaryTrade && (
                  <span className="text-[10px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-md">
                    {(meData as { primaryTrade?: string | null }).primaryTrade}
                  </span>
                )}
                {(meData as { secondaryTrades?: string[] | null })?.secondaryTrades?.map((trade) => (
                  <span key={trade} className="text-[10px] font-bold bg-primary/12 text-primary px-2 py-0.5 rounded-md border border-primary/15">
                    {trade}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {data?.myRating != null ? (
                  <div className="flex items-center gap-1.5">
                    <StarRow rating={data.myRating} size="md" />
                    <span className="text-sm font-black text-primary">{data.myRating.toFixed(1)}</span>
                    {(data.myReviewCount ?? 0) > 0 && (
                      <span className="text-xs text-[#a89070]">({data.myReviewCount} review{data.myReviewCount !== 1 ? "s" : ""})</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-[#a89070] italic">No reviews yet</span>
                )}
                {memberSince && (
                  <span className="text-xs text-[#a89070] flex items-center gap-1">
                    <User className="h-3 w-3" /> Member since {memberSince}
                  </span>
                )}
              </div>

              {user?.suburb && (
                <p className="text-xs text-[#a89070] mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {user.suburb}
                </p>
              )}
            </div>

            {/* Wallet pill + action buttons */}
            <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
              <Link href="/credits">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-colors ${walletLow ? "bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/15" : "bg-primary/10 border-primary/25 hover:bg-primary/15"}`}>
                  <DollarSign className={`h-3.5 w-3.5 ${walletLow ? "text-orange-400" : "text-primary"}`} />
                  <span className={`text-sm font-black ${walletLow ? "text-orange-300" : "text-primary"}`}>
                    {walletCents !== null ? `$${(walletCents / 100).toFixed(2)}` : "–"}
                  </span>
                  <span className="text-[10px] text-[#f5ede0]/40">
                    {jobsLeft !== null ? `≈ ${jobsLeft} lead${jobsLeft !== 1 ? "s" : ""}` : "wallet"}
                  </span>
                </div>
              </Link>
              <div className="flex gap-2">
                <Link href="/jobs">
                  <button className="h-8 px-3 rounded-xl bg-primary hover:opacity-90 text-black font-bold text-xs transition-colors flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5" /> Find Jobs
                  </button>
                </Link>
                <Link href="/profile">
                  <button className="h-8 px-3 rounded-xl bg-[#f5ede0]/6 hover:bg-[#f5ede0]/10 text-[#f5ede0]/80 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-[#f5ede0]/8">
                    <Settings className="h-3.5 w-3.5" /> Profile
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 pb-8 space-y-6">
        {/* 6-stat grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {stats.map((s) => {
            const card = (
              <div className={`bg-[#1a1409] border border-[#f5ede0]/6 hover:border-white/12 rounded-2xl p-4 transition-colors h-full ${'href' in s ? "cursor-pointer" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[#a89070] font-medium">{s.label}</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-10 mt-1.5 bg-[#f5ede0]/8" />
                    ) : (
                      <p className="text-3xl font-black text-[#f5ede0] mt-1">{s.value}</p>
                    )}
                    <p className="text-[10px] text-[#f5ede0]/30 mt-0.5">{s.desc}</p>
                  </div>
                  <div className={`${s.bg} ${s.color} p-2 rounded-xl flex-shrink-0`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
            return (
              <motion.div key={s.label} variants={cardItem} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                {card}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Low wallet alert banner */}
        <AnimatePresence>
          {walletLow && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="bg-orange-500/10 border border-orange-500/30 rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-orange-300">Wallet balance is too low to claim jobs</p>
                  <p className="text-xs text-white/45 mt-0.5">
                    You need at least $22 to claim the next job lead. Top up now to keep winning work.
                  </p>
                </div>
              </div>
              <Link href="/wallet">
                <button className="flex-shrink-0 bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-orange-400 transition-colors whitespace-nowrap">
                  Top up wallet
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pipeline strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#1a1409] border border-[#f5ede0]/6 rounded-2xl p-5"
        >
          <p className="text-xs font-semibold text-[#a89070] uppercase tracking-wider mb-4">Job Pipeline</p>
          <div className="flex items-center gap-2">
            {[
              { label: "Pending",   value: data?.pendingCount ?? 0,  color: "bg-primary" },
              { label: "Accepted",  value: data?.acceptedCount ?? 0, color: "bg-emerald-400" },
              { label: "Completed", value: data?.completedJobs ?? 0, color: "bg-blue-400" },
            ].map((stage, idx) => {
              const total = (data?.pendingCount ?? 0) + (data?.acceptedCount ?? 0) + (data?.completedJobs ?? 0);
              const pctW = total > 0 ? Math.max((stage.value / total) * 100, 4) : 33.3;
              return (
                <div key={stage.label} className="flex items-center gap-2 flex-1">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-[#a89070]">{stage.label}</span>
                      <span className="text-xs font-bold text-[#f5ede0]">{isLoading ? "…" : stage.value}</span>
                    </div>
                    <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${stage.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pctW}%` }}
                        transition={{ duration: 0.7, delay: 0.4 + idx * 0.1 }}
                      />
                    </div>
                  </div>
                  {idx < 2 && <ChevronRight className="h-4 w-4 text-white/20 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Grow Your Business ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs font-semibold text-[#a89070] uppercase tracking-wider mb-3">Grow Your Business</p>
          <div className="grid lg:grid-cols-3 gap-4">

            {/* Card 1: Wallet & ROI */}
            <div className="bg-[#1a1409] border border-[#f5ede0]/6 rounded-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-[#f5ede0]">Wallet Balance</p>
                <Link href="/credits">
                  <span className="text-xs text-primary hover:opacity-80 transition-colors cursor-pointer">Top up →</span>
                </Link>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className={`text-3xl font-black ${walletLow ? "text-orange-300" : "text-primary"}`}>
                  {walletCents !== null ? `$${(walletCents / 100).toFixed(2)}` : "–"}
                </span>
                <span className="text-xs text-[#a89070] mb-1">AUD</span>
              </div>
              <p className="text-xs text-[#a89070] mb-3">
                {jobsLeft !== null ? `≈ ${jobsLeft} job lead${jobsLeft !== 1 ? "s" : ""} remaining` : "Loading…"}
              </p>
              {/* Progress bar */}
              <div className="w-full bg-[#f5ede0]/6 rounded-full h-1.5 mb-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${walletLow ? "bg-orange-400" : "bg-primary"}`}
                  style={{ width: `${walletCents !== null ? Math.min((walletCents / 11100) * 100, 100) : 0}%` }}
                />
              </div>
              <div className="bg-[#f5ede0]/4 rounded-xl p-3 mb-4">
                <p className="text-[10px] text-[#a89070] mb-1">ROI on Fixit 24/7</p>
                <p className="text-xs text-[#f5ede0]/80">Average job value is <span className="text-primary font-bold">$480</span>. Each lead from <span className="text-primary font-bold">$22</span>. That's a potential <span className="text-emerald-400 font-bold">21× return</span> on your first claim.</p>
              </div>
              <p className="text-[10px] text-[#a89070] mb-2">Quick top-up</p>
              <div className="flex gap-2 mt-auto">
                {[{ label: "$49", desc: "~2 leads" }, { label: "$99", desc: "~4 leads" }, { label: "$149", desc: "~6 leads" }].map(({ label, desc }) => (
                  <Link key={label} href="/credits">
                    <button className="flex-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold text-xs px-3 py-2 rounded-xl transition-colors text-center">
                      <div>{label}</div>
                      <div className="text-[9px] text-primary/60 font-normal">{desc}</div>
                    </button>
                  </Link>
                ))}
              </div>
            </div>

            {/* Card 2: Subscription / Plan Upsell */}
            <div className="bg-[#1a1409] border border-[#f5ede0]/6 rounded-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-[#f5ede0]">Your Plan</p>
                <span className="text-[10px] font-bold bg-[#f5ede0]/8 text-[#a89070] px-2 py-0.5 rounded-md">Free tier</span>
              </div>
              <div className="space-y-2 mb-4 flex-1">
                {[
                  { plan: "Free",            price: "$0/mo",   leads: "Up to 5 leads",     priority: false, badge: false, highlight: true  },
                  { plan: "Starter",         price: "$49/mo",  leads: "25 leads/mo",       priority: true,  badge: true,  highlight: false },
                  { plan: "Pro",             price: "$99/mo",  leads: "Unlimited leads",   priority: true,  badge: true,  highlight: false },
                ].map(({ plan, price, leads, priority, badge, highlight }) => (
                  <div
                    key={plan}
                    className={`rounded-xl p-3 border transition-colors ${highlight ? "border-primary/30 bg-primary/6" : "border-[#f5ede0]/6 bg-[#f5ede0]/2"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${highlight ? "text-primary" : "text-[#f5ede0]/70"}`}>{plan}</span>
                      <span className={`text-xs font-black ${highlight ? "text-primary" : "text-[#f5ede0]/50"}`}>{price}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-[#a89070]">{leads}</span>
                      {priority && <span className="text-emerald-400">✓ Priority matching</span>}
                      {badge && <span className="text-emerald-400">✓ Verified badge</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3 mb-4 text-xs text-[#f5ede0]/70">
                <span className="text-emerald-400 font-bold">💡 </span>Starter pays for itself after <span className="text-white font-bold">just 1 job</span> — average job value is $480.
              </div>
              <Link href="/credits">
                <button className="w-full bg-primary text-black font-black py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm">
                  Upgrade plan →
                </button>
              </Link>
            </div>

            {/* Card 3: Strategic Tips */}
            <div className="bg-[#1a1409] border border-[#f5ede0]/6 rounded-2xl p-5 flex flex-col">
              <p className="text-sm font-bold text-[#f5ede0] mb-1">Winning more work</p>
              <p className="text-xs text-[#a89070] mb-4">Smart tips based on your account</p>
              <div className="space-y-3 flex-1">
                {[
                  {
                    done: (data?.myReviewCount ?? 0) >= 5,
                    tip: "Get 5+ reviews",
                    why: "Tradies with 5+ reviews win 3× more claims",
                    action: "Ask past clients to review you",
                    href: "/profile",
                  },
                  {
                    done: pct >= 100,
                    tip: "Complete your profile",
                    why: `Your profile is ${pct}% — full profiles win 2× more`,
                    action: "Finish profile →",
                    href: "/profile",
                  },
                  {
                    done: false,
                    tip: "Respond within 1 hour",
                    why: "Fast responders win 68% of jobs they bid on",
                    action: "Enable push notifications",
                    href: "/profile",
                  },
                  {
                    done: false,
                    tip: "Add emergency availability",
                    why: "Emergency jobs pay 40% more on average",
                    action: "Update availability →",
                    href: "/profile",
                  },
                ].map(({ done, tip, why, action, href }) => (
                  <div key={tip} className={`rounded-xl p-3 border ${done ? "border-emerald-500/15 bg-emerald-500/5 opacity-60" : "border-[#f5ede0]/6 bg-[#f5ede0]/2"}`}>
                    <div className="flex items-start gap-2">
                      <span className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-black mt-0.5 ${done ? "bg-emerald-500/20 text-emerald-400" : "bg-primary/15 text-primary"}`}>
                        {done ? "✓" : "→"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${done ? "text-[#f5ede0]/40 line-through" : "text-[#f5ede0]/80"}`}>{tip}</p>
                        <p className="text-[10px] text-[#a89070] mt-0.5">{why}</p>
                        {!done && (
                          <Link href={href}>
                            <span className="text-[10px] text-primary hover:opacity-80 transition-colors cursor-pointer">{action}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Recent Claims (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Accepted / In-Progress Jobs */}
            {(isLoading || acceptedClaims.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                className="bg-[#1a1409] border border-emerald-500/20 rounded-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <h2 className="font-bold text-[#f5ede0]">Accepted Jobs</h2>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-400/10 px-2 py-0.5 rounded-md">
                    In Progress
                  </span>
                </div>
                <div className="divide-y divide-[#f5ede0]/6">
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="px-6 py-4"><Skeleton className="h-12 w-full bg-white/6" /></div>
                    ))
                  ) : (
                    acceptedClaims.map((claim) => {
                      const urg = URGENCY[claim.jobUrgency ?? "standard"] ?? URGENCY.standard;
                      const Icon = urg.Icon;
                      return (
                        <div key={claim.id} className="px-6 py-4 hover:bg-white/2 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Link href={`/jobs/${claim.jobId}`}>
                                  <span className="font-semibold text-[#f5ede0] hover:text-primary cursor-pointer transition-colors text-sm">
                                    {claim.jobTitle ?? `Job #${claim.jobId}`}
                                  </span>
                                </Link>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${urg.cls}`}>
                                  <Icon className="h-2.5 w-2.5" /> {urg.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-white/35">
                                {claim.jobSuburb && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {claim.jobSuburb}
                                  </span>
                                )}
                                {claim.proposedPrice && (
                                  <span className="text-white/60 font-semibold">${claim.proposedPrice.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                            <Link href={claim.conversationId ? `/conversations/${claim.conversationId}` : "/conversations"}>
                              <button className="h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0 border border-emerald-500/20">
                                <MessageSquare className="h-3.5 w-3.5" /> Message
                              </button>
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {/* All Recent Claims */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-[#1a1409] border border-[#f5ede0]/6 rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-white/6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-[#f5ede0]">My Recent Claims</h2>
                  <Link href="/jobs">
                    <span className="text-sm text-primary hover:opacity-90 cursor-pointer flex items-center gap-1 transition-colors">
                      All jobs <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </div>
                {/* Status filter tabs */}
                <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                  {(["all", "pending", "accepted", "rejected"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setClaimsFilter(f)}
                      className={`flex-1 py-1 rounded-md text-xs font-semibold transition-all capitalize ${
                        claimsFilter === f ? "bg-[#f5ede0]/12 text-[#f5ede0]" : "text-[#a89070] hover:text-[#f5ede0]/65"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-[#f5ede0]/6">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="px-6 py-4"><Skeleton className="h-12 w-full bg-white/6" /></div>
                  ))
                ) : !data?.recentClaims?.length ? (
                  <div className="text-center py-12 text-white/35">
                    <Briefcase className="h-8 w-8 mx-auto mb-3 text-white/15" />
                    <p className="text-sm font-medium text-white/40">No claims yet</p>
                    <p className="text-xs mt-1">Start claiming open jobs to grow your business.</p>
                    <Link href="/jobs">
                      <button className="mt-4 h-9 px-5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-bold text-sm transition-colors">
                        Browse Jobs
                      </button>
                    </Link>
                  </div>
                ) : (
                  data.recentClaims.filter((c) => claimsFilter === "all" || c.status === claimsFilter).map((claim) => {
                    const st = CLAIM_STATUS[claim.status] ?? CLAIM_STATUS.pending;
                    const urg = URGENCY[claim.jobUrgency ?? "standard"] ?? URGENCY.standard;
                    const Icon = urg.Icon;
                    return (
                      <div key={claim.id} className="px-6 py-4 hover:bg-white/2 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/jobs/${claim.jobId}`}>
                                <span className="font-semibold text-[#f5ede0] hover:text-primary cursor-pointer transition-colors text-sm">
                                  {claim.jobTitle ?? `Job #${claim.jobId}`}
                                </span>
                              </Link>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${urg.cls}`}>
                                <Icon className="h-2.5 w-2.5" /> {urg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-white/35">
                              {claim.jobSuburb && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {claim.jobSuburb}
                                </span>
                              )}
                              <span>{timeAgo(claim.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md capitalize ${st.cls}`}>
                              {st.label}
                            </span>
                            {claim.status === "accepted" && (
                              <Link href={claim.conversationId ? `/conversations/${claim.conversationId}` : "/conversations"}>
                                <button className="h-7 w-7 rounded-lg bg-white/6 hover:bg-white/12 transition-colors flex items-center justify-center" title="Open conversation">
                                  <MessageSquare className="h-3.5 w-3.5 text-white/60" />
                                </button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Post-claim: What happens next card — show when there's at least one pending claim */}
            {(data?.recentClaims ?? []).some((c) => c.status === "pending") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#1a1409] border border-primary/20 rounded-2xl p-5"
              >
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">What happens next?</p>
                <div className="space-y-3">
                  {[
                    { step: "1", text: "Homeowner reviews your quote alongside other tradies" },
                    { step: "2", text: "They accept one quote — you'll get an instant notification" },
                    { step: "3", text: "A chat opens so you can confirm details and book a time" },
                    { step: "4", text: "Complete the job, collect payment, get a review" },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-3">
                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/15 text-primary text-[10px] font-black flex items-center justify-center mt-0.5">
                        {step}
                      </span>
                      <p className="text-sm text-white/60">{text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right column: reviews + profile */}
          <div className="space-y-6">
            {/* Recent Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#1a1409] border border-[#f5ede0]/6 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
                <h2 className="font-bold text-[#f5ede0]">Recent Reviews</h2>
                <Link href="/profile">
                  <span className="text-xs text-primary hover:opacity-90 cursor-pointer transition-colors">
                    See all
                  </span>
                </Link>
              </div>
              <div className="divide-y divide-[#f5ede0]/6">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="px-5 py-4"><Skeleton className="h-14 w-full bg-white/6" /></div>
                  ))
                ) : !data?.recentReviews?.length ? (
                  <div className="text-center py-8 text-white/30 px-5">
                    <Star className="h-6 w-6 mx-auto mb-2 text-white/15" />
                    <p className="text-xs">No reviews yet. Complete jobs to earn them.</p>
                  </div>
                ) : (
                  data.recentReviews.map((rev) => (
                    <div key={rev.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <StarRow rating={rev.rating} />
                        <span className="text-[10px] text-white/30">
                          {timeAgo(rev.createdAt)}
                        </span>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-white/55 italic line-clamp-2">"{rev.comment}"</p>
                      )}
                      <p className="text-[10px] text-white/30 mt-1.5">— {rev.reviewerName ?? "Anonymous"}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Profile Completion — hidden at 100% */}
            {!isLoading && pct < 100 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-[#1a1409] border border-[#f5ede0]/6 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-[#f5ede0] text-sm">Profile Strength</h2>
                  <span className={`text-sm font-black ${pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-primary" : "text-orange-400"}`}>
                    {pct}%
                  </span>
                </div>
                <ProfileBar pct={pct} />
                <ul className="mt-3 space-y-2">
                  {[
                    { done: true,                            label: "Account created",    unlock: null },
                    { done: !!(meData?.phone ?? user?.phone), label: "Add phone number",  unlock: "Unlocks ~12 more jobs in your area" },
                    { done: !!(meData?.bio ?? user?.bio),     label: "Write a bio",        unlock: "Homeowners are 2× more likely to accept" },
                    { done: !!(meData?.suburb ?? user?.suburb), label: "Set your suburb", unlock: "Required to appear in local search results" },
                    { done: (data?.myCategories?.length ?? 0) > 0, label: "Add your skills", unlock: "Unlocks all matching job leads for your trades" },
                  ].map((s) =>
                    s.done ? (
                      <li key={s.label} className="flex items-center gap-2 text-xs text-white/30">
                        <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                        <span className="line-through">{s.label}</span>
                      </li>
                    ) : (
                      <li key={s.label}>
                        <Link href="/profile">
                          <div className="flex items-start gap-2 text-xs cursor-pointer transition-colors group">
                            <AlertCircle className="h-3 w-3 text-orange-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-white/55 group-hover:text-primary transition-colors">{s.label}</span>
                              {s.unlock && (
                                <p className="text-[10px] text-white/30 mt-0.5">{s.unlock}</p>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    )
                  )}
                </ul>
                <Link href="/profile">
                  <button className="mt-4 w-full h-8 rounded-lg bg-white/6 hover:bg-white/10 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-[#f5ede0]/8">
                    <Settings className="h-3.5 w-3.5" /> Edit Profile
                  </button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* Available Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#1a1409] border border-[#f5ede0]/6 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#f5ede0]">Available Jobs</h2>
              <Link href="/jobs">
                <span className="text-sm text-primary hover:opacity-90 cursor-pointer flex items-center gap-1 transition-colors">
                  Browse all <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2">
              <select
                value={jobFilterCategory}
                onChange={(e) => setJobFilterCategory(e.target.value)}
                className="h-7 px-2 rounded-lg bg-white/6 border border-[#f5ede0]/10 text-xs text-[#f5ede0]/70 focus:outline-none focus:border-primary/40 cursor-pointer"
              >
                <option value="">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c!}>{c}</option>
                ))}
              </select>
              <select
                value={jobFilterUrgency}
                onChange={(e) => setJobFilterUrgency(e.target.value)}
                className="h-7 px-2 rounded-lg bg-white/6 border border-[#f5ede0]/10 text-xs text-[#f5ede0]/70 focus:outline-none focus:border-primary/40 cursor-pointer"
              >
                <option value="">All Urgency</option>
                <option value="emergency">Emergency</option>
                <option value="urgent">Urgent</option>
                <option value="standard">Standard</option>
              </select>
              <input
                type="text"
                placeholder="Suburb..."
                value={jobFilterSuburb}
                onChange={(e) => setJobFilterSuburb(e.target.value)}
                className="h-7 px-2 rounded-lg bg-white/6 border border-[#f5ede0]/10 text-xs text-[#f5ede0]/70 placeholder:text-[#a89070]/50 focus:outline-none focus:border-primary/40 w-24"
              />
              <input
                type="number"
                placeholder="Max budget"
                value={jobFilterBudget}
                onChange={(e) => setJobFilterBudget(e.target.value)}
                className="h-7 px-2 rounded-lg bg-white/6 border border-[#f5ede0]/10 text-xs text-[#f5ede0]/70 placeholder:text-[#a89070]/50 focus:outline-none focus:border-primary/40 w-24"
              />
              {(jobFilterCategory || jobFilterUrgency || jobFilterSuburb || jobFilterBudget) && (
                <button
                  onClick={() => { setJobFilterCategory(""); setJobFilterUrgency(""); setJobFilterSuburb(""); setJobFilterBudget(""); }}
                  className="h-7 px-2 rounded-lg bg-white/6 border border-[#f5ede0]/10 text-xs text-[#a89070] hover:text-[#f5ede0] transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-[#f5ede0]/6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-4"><Skeleton className="h-16 w-full bg-white/6" /></div>
              ))
            ) : !data?.availableJobs?.length ? (
              <div className="text-center py-12 text-white/35">
                <Search className="h-8 w-8 mx-auto mb-3 text-white/15" />
                <p className="text-sm font-medium text-white/40">No available jobs right now</p>
                <p className="text-xs mt-1">Check back soon — new jobs are posted regularly.</p>
              </div>
            ) : !filteredAvailableJobs.length ? (
              <div className="text-center py-10 text-white/35">
                <Search className="h-7 w-7 mx-auto mb-2 text-white/15" />
                <p className="text-sm font-medium text-white/40">No jobs match your filters</p>
                <button
                  onClick={() => { setJobFilterCategory(""); setJobFilterUrgency(""); setJobFilterSuburb(""); setJobFilterBudget(""); }}
                  className="mt-3 text-xs text-primary hover:opacity-80 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredAvailableJobs.map((job) => {
                const u = URGENCY[job.urgency] ?? URGENCY.standard;
                const Icon = u.Icon;
                const isExpanded = expandedClaimJobId === job.id;
                return (
                  <div key={job.id} className="divide-y divide-white/4">
                    <div className="px-6 py-4 hover:bg-white/2 transition-colors group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Link href={`/jobs/${job.id}`}>
                              <span className="font-semibold text-[#f5ede0] group-hover:text-primary cursor-pointer transition-colors text-sm">
                                {job.title}
                              </span>
                            </Link>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${u.cls}`}>
                              <Icon className="h-2.5 w-2.5" /> {u.label}
                            </span>
                            {job.categoryName && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/6 text-white/60">
                                {job.categoryName}
                              </span>
                            )}
                            {job.leadCostCents != null && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                <CreditCard className="h-2.5 w-2.5" /> ${(job.leadCostCents / 100).toFixed(2)} to claim
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 line-clamp-1">{job.description}</p>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-white/30">
                            {job.suburb && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {job.suburb}
                              </span>
                            )}
                            {job.budget && (
                              <span className="text-white/60 font-semibold">${job.budget.toLocaleString()}</span>
                            )}
                            <span>{timeAgo(job.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/jobs/${job.id}`}>
                            <button className="h-8 px-3 rounded-lg bg-white/6 hover:bg-white/10 text-white text-xs font-semibold transition-colors border border-[#f5ede0]/8">
                              View
                            </button>
                          </Link>
                          <button
                            className={`h-8 px-4 rounded-lg font-bold text-xs transition-all ${
                              isExpanded
                                ? "bg-white/10 text-white/60 border border-[#f5ede0]/10"
                                : "bg-primary hover:opacity-90 active:scale-[0.96] text-primary-foreground"
                            }`}
                            onClick={() => handleClaimExpand(job.id, job.leadCostCents)}
                          >
                            {isExpanded ? <X className="h-3.5 w-3.5" /> : "Claim"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inline claim expansion panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 py-4 bg-[#120e07]">
                            {pendingClaimCost != null && (
                              <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg bg-[#ffc800]/8 border border-[#ffc800]/20">
                                <Zap className="h-3.5 w-3.5 text-[#ffc800] shrink-0" />
                                <span className="text-sm font-bold text-[#ffc800]">${(pendingClaimCost / 100).toFixed(2)}</span>
                                <span className="text-xs text-[#a89070]">will be deducted from your balance to claim this job</span>
                              </div>
                            )}
                            <p className="text-xs font-semibold text-[#a89070] mb-3">Claim details (optional)</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-[#a89070] block mb-1.5">Message to homeowner</label>
                                <textarea
                                  className="w-full bg-[#201a10] border border-[#f5ede0]/10 rounded-lg px-3 py-2 text-sm text-[#f5ede0] placeholder:text-[#a89070]/50 focus:outline-none focus:border-primary/50 resize-none h-20"
                                  placeholder="Briefly describe your experience and approach..."
                                  value={claimMessage}
                                  onChange={(e) => setClaimMessage(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-[#a89070] block mb-1.5">
                                  <DollarSign className="h-3 w-3 inline-block mr-0.5" />
                                  Proposed price (AUD)
                                </label>
                                <input
                                  type="number"
                                  className="w-full bg-[#201a10] border border-[#f5ede0]/10 rounded-lg px-3 py-2 text-sm text-[#f5ede0] placeholder:text-[#a89070]/50 focus:outline-none focus:border-primary/50 h-10"
                                  placeholder="e.g. 250"
                                  value={claimPrice}
                                  onChange={(e) => setClaimPrice(e.target.value)}
                                  min="0"
                                />
                                {job.budget && (
                                  <p className="text-[10px] text-white/30 mt-1">Budget: ${job.budget.toLocaleString()}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-3">
                              <button
                                className="h-8 px-4 rounded-lg bg-white/6 hover:bg-white/10 text-white text-xs font-semibold transition-colors border border-[#f5ede0]/8"
                                onClick={() => setExpandedClaimJobId(null)}
                              >
                                Cancel
                              </button>
                              <button
                                className="h-8 px-5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs transition-all active:scale-[0.97] disabled:opacity-50"
                                disabled={claimMutation.isPending}
                                onClick={() => submitClaim(job.id)}
                              >
                                {claimMutation.isPending ? "Submitting…" : "Submit Claim"}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { href: "/jobs",     Icon: Search,        label: "Find Jobs",       sub: "Browse open listings" },
            { href: "/conversations", Icon: MessageSquare,  label: "Messages",        sub: "Chat with homeowners" },
            { href: "/profile",  Icon: User,           label: "My Profile",      sub: "Edit your details" },
            { href: "/profile",  Icon: Star,           label: "See All Reviews", sub: "Your star ratings" },
          ].map(({ href, Icon, label, sub }) => (
            <Link key={label} href={href}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                className="bg-[#1a1409] border border-[#f5ede0]/6 hover:border-primary/30 rounded-2xl p-4 cursor-pointer transition-colors group hover:bg-[#1e1a0d]"
              >
                <Icon className="h-5 w-5 text-primary mb-2.5 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-[#f5ede0]">{label}</p>
                <p className="text-xs text-[#a89070] mt-0.5">{sub}</p>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
    </>
  );
}
