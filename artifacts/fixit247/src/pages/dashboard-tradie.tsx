import { usePageTitle } from "@/hooks/use-page-title";
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
  standard:  { label: "Standard",  cls: "bg-white/8 text-white/40",         Icon: Briefcase },
};

const CLAIM_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-[#ffc800]/15 text-[#ffc800]" },
  accepted:  { label: "Accepted",  cls: "bg-emerald-500/15 text-emerald-400" },
  rejected:  { label: "Rejected",  cls: "bg-red-500/15 text-red-400" },
  withdrawn: { label: "Withdrawn", cls: "bg-white/8 text-white/40" },
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
                <Star className={`${cls} fill-[#ffc800] text-[#ffc800]`} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function ProfileBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "bg-emerald-400" : pct >= 60 ? "bg-[#ffc800]" : "bg-orange-400";
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

  // Credit balance
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [creditsPerClaim, setCreditsPerClaim] = useState(222);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/stripe/credits`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.balance === "number") setCreditBalance(d.balance);
        if (typeof d.creditsPerClaim === "number") setCreditsPerClaim(d.creditsPerClaim);
      })
      .catch(() => {});
  }, [token]);

  // Inline claim expansion state: jobId → { message, proposedPrice }
  const [expandedClaimJobId, setExpandedClaimJobId] = useState<number | null>(null);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimPrice, setClaimPrice] = useState("");

  const claimMutation = useClaimJob({
    mutation: {
      onSuccess: () => {
        toast({ title: "Claimed!", description: `You've successfully claimed this job. ${creditsPerClaim} credits deducted.` });
        setExpandedClaimJobId(null);
        setClaimMessage("");
        setClaimPrice("");
        refetch();
        // Refresh credit balance
        if (token) {
          fetch(`${API_BASE}/api/stripe/credits`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => { if (typeof d.balance === "number") setCreditBalance(d.balance); })
            .catch(() => {});
        }
      },
      onError: (err) => {
        const errData = err as { data?: { message?: string; error?: string; balance?: number; required?: number } };
        if (errData?.data?.error === "insufficient_credits") {
          toast({
            title: "Not enough credits",
            description: `You need ${errData.data.required ?? creditsPerClaim} credits to claim. Your balance: ${errData.data.balance ?? 0}. Top up at Credits.`,
            variant: "destructive",
          });
          setCreditBalance(errData.data.balance ?? 0);
        } else {
          const msg = errData?.data?.message ?? "Failed to claim job";
          toast({ title: "Error", description: msg, variant: "destructive" });
        }
      },
    },
  });

  function handleClaimExpand(jobId: number) {
    if (expandedClaimJobId === jobId) {
      setExpandedClaimJobId(null);
    } else {
      setExpandedClaimJobId(jobId);
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

  const jobsLeft = creditBalance !== null ? Math.floor(creditBalance / creditsPerClaim) : null;

  const stats = [
    {
      label: "Credits",
      value: creditBalance !== null ? creditBalance.toLocaleString() : "–",
      icon: Zap,
      color: creditBalance !== null && creditBalance < creditsPerClaim ? "text-orange-400" : "text-[#ffc800]",
      bg: creditBalance !== null && creditBalance < creditsPerClaim ? "bg-orange-500/10" : "bg-[#ffc800]/10",
      desc: jobsLeft !== null ? `≈ ${jobsLeft} claim${jobsLeft !== 1 ? "s" : ""} left` : "loading…",
      href: "/credits",
    },
    {
      label: "Active Jobs",
      value: data?.activeJobs ?? 0,
      icon: Briefcase,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      desc: "pending + accepted",
    },
    {
      label: "Pending Responses",
      value: data?.pendingCount ?? 0,
      icon: Clock,
      color: "text-[#ffc800]",
      bg: "bg-[#ffc800]/10",
      desc: "awaiting decision",
    },
    {
      label: "Completed Jobs",
      value: data?.completedJobs ?? 0,
      icon: Award,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      desc: "total finished",
    },
    {
      label: "My Rating",
      value: data?.myRating != null ? data.myRating.toFixed(1) : "–",
      icon: Star,
      color: "text-[#ffc800]",
      bg: "bg-[#ffc800]/10",
      desc: "average score",
    },
    {
      label: "Reviews",
      value: data?.myReviewCount ?? 0,
      icon: CheckCircle,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      desc: "from homeowners",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0904]">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-0">
        {/* Hero header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-[#130f07] border border-white/6 rounded-2xl p-5 sm:p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar + status dot */}
            <div className="relative flex-shrink-0 self-start sm:self-center">
              <div className="h-16 w-16 rounded-2xl bg-[#ffc800] flex items-center justify-center shadow-lg shadow-[#ffc800]/20">
                <span className="text-2xl font-black text-black tracking-tight">{initials}</span>
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#130f07] shadow" title="Online" />
            </div>

            {/* Name / rating / meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-black text-white leading-none">{user?.name ?? firstName}</h1>
                {data?.myCategories?.map((cat) => (
                  <span key={cat.id} className="text-[10px] font-bold bg-[#ffc800]/12 text-[#ffc800] px-2 py-0.5 rounded-md border border-[#ffc800]/15">
                    {cat.name}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {data?.myRating != null ? (
                  <div className="flex items-center gap-1.5">
                    <StarRow rating={data.myRating} size="md" />
                    <span className="text-sm font-black text-[#ffc800]">{data.myRating.toFixed(1)}</span>
                    {(data.myReviewCount ?? 0) > 0 && (
                      <span className="text-xs text-white/35">({data.myReviewCount} review{data.myReviewCount !== 1 ? "s" : ""})</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-white/30 italic">No reviews yet</span>
                )}
                {memberSince && (
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    <User className="h-3 w-3" /> Member since {memberSince}
                  </span>
                )}
              </div>

              {user?.suburb && (
                <p className="text-xs text-white/30 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {user.suburb}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/jobs">
                <button className="h-9 px-4 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-xs transition-colors flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5" /> Find Jobs
                </button>
              </Link>
              <Link href="/profile">
                <button className="h-9 px-4 rounded-xl bg-white/6 hover:bg-white/10 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 border border-white/8">
                  <Settings className="h-3.5 w-3.5" /> Edit Profile
                </button>
              </Link>
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
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {stats.map((s) => {
            const card = (
              <div className={`bg-[#130f07] border border-white/6 hover:border-white/12 rounded-2xl p-4 transition-colors h-full ${'href' in s ? "cursor-pointer" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-white/40 font-medium">{s.label}</p>
                    {isLoading || ('href' in s && creditBalance === null) ? (
                      <Skeleton className="h-8 w-10 mt-1.5 bg-white/8" />
                    ) : (
                      <p className="text-3xl font-black text-white mt-1">{s.value}</p>
                    )}
                    <p className="text-[10px] text-white/25 mt-0.5">{s.desc}</p>
                  </div>
                  <div className={`${s.bg} ${s.color} p-2 rounded-xl flex-shrink-0`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
            return (
              <motion.div key={s.label} variants={cardItem} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                {'href' in s ? <Link href={s.href!}>{card}</Link> : card}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Pipeline strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#130f07] border border-white/6 rounded-2xl p-5"
        >
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Job Pipeline</p>
          <div className="flex items-center gap-2">
            {[
              { label: "Pending",   value: data?.pendingCount ?? 0,  color: "bg-[#ffc800]" },
              { label: "Accepted",  value: data?.acceptedCount ?? 0, color: "bg-emerald-400" },
              { label: "Completed", value: data?.completedJobs ?? 0, color: "bg-blue-400" },
            ].map((stage, idx) => {
              const total = (data?.pendingCount ?? 0) + (data?.acceptedCount ?? 0) + (data?.completedJobs ?? 0);
              const pctW = total > 0 ? Math.max((stage.value / total) * 100, 4) : 33.3;
              return (
                <div key={stage.label} className="flex items-center gap-2 flex-1">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-white/40">{stage.label}</span>
                      <span className="text-xs font-bold text-white">{isLoading ? "…" : stage.value}</span>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Recent Claims (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Accepted / In-Progress Jobs */}
            {(isLoading || acceptedClaims.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                className="bg-[#130f07] border border-emerald-500/20 rounded-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <h2 className="font-bold text-white">Accepted Jobs</h2>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-400/10 px-2 py-0.5 rounded-md">
                    In Progress
                  </span>
                </div>
                <div className="divide-y divide-white/5">
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
                                  <span className="font-semibold text-white hover:text-[#ffc800] cursor-pointer transition-colors text-sm">
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
              className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                <h2 className="font-bold text-white">My Recent Claims</h2>
                <Link href="/jobs">
                  <span className="text-sm text-[#ffc800] hover:text-[#e6b800] cursor-pointer flex items-center gap-1 transition-colors">
                    All jobs <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </div>
              <div className="divide-y divide-white/5">
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
                      <button className="mt-4 h-9 px-5 rounded-lg bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-sm transition-colors">
                        Browse Jobs
                      </button>
                    </Link>
                  </div>
                ) : (
                  data.recentClaims.map((claim) => {
                    const st = CLAIM_STATUS[claim.status] ?? CLAIM_STATUS.pending;
                    const urg = URGENCY[claim.jobUrgency ?? "standard"] ?? URGENCY.standard;
                    const Icon = urg.Icon;
                    return (
                      <div key={claim.id} className="px-6 py-4 hover:bg-white/2 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/jobs/${claim.jobId}`}>
                                <span className="font-semibold text-white hover:text-[#ffc800] cursor-pointer transition-colors text-sm">
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
          </div>

          {/* Right column: reviews + profile */}
          <div className="space-y-6">
            {/* Recent Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
                <h2 className="font-bold text-white">Recent Reviews</h2>
                <Link href="/profile">
                  <span className="text-xs text-[#ffc800] hover:text-[#e6b800] cursor-pointer transition-colors">
                    See all
                  </span>
                </Link>
              </div>
              <div className="divide-y divide-white/5">
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
                className="bg-[#130f07] border border-white/6 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-white text-sm">Profile Strength</h2>
                  <span className={`text-sm font-black ${pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-[#ffc800]" : "text-orange-400"}`}>
                    {pct}%
                  </span>
                </div>
                <ProfileBar pct={pct} />
                <ul className="mt-3 space-y-2">
                  {[
                    { done: true,                            label: "Account created" },
                    { done: !!(meData?.phone ?? user?.phone), label: "Add phone number" },
                    { done: !!(meData?.bio ?? user?.bio),     label: "Write a bio" },
                    { done: !!(meData?.suburb ?? user?.suburb), label: "Set your suburb" },
                    { done: (data?.myCategories?.length ?? 0) > 0, label: "Add your skills" },
                  ].map((s) =>
                    s.done ? (
                      <li key={s.label} className="flex items-center gap-2 text-xs text-white/30">
                        <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                        <span className="line-through">{s.label}</span>
                      </li>
                    ) : (
                      <li key={s.label}>
                        <Link href="/profile">
                          <div className="flex items-center gap-2 text-xs text-white/55 hover:text-[#ffc800] cursor-pointer transition-colors">
                            <AlertCircle className="h-3 w-3 text-orange-400 flex-shrink-0" />
                            <span>{s.label}</span>
                          </div>
                        </Link>
                      </li>
                    )
                  )}
                </ul>
                <Link href="/profile">
                  <button className="mt-4 w-full h-8 rounded-lg bg-white/6 hover:bg-white/10 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/8">
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
          className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
            <h2 className="font-bold text-white">Available Jobs</h2>
            <Link href="/jobs">
              <span className="text-sm text-[#ffc800] hover:text-[#e6b800] cursor-pointer flex items-center gap-1 transition-colors">
                Browse all <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
          <div className="divide-y divide-white/5">
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
            ) : (
              data.availableJobs.map((job) => {
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
                              <span className="font-semibold text-white group-hover:text-[#ffc800] cursor-pointer transition-colors text-sm">
                                {job.title}
                              </span>
                            </Link>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${u.cls}`}>
                              <Icon className="h-2.5 w-2.5" /> {u.label}
                            </span>
                            {job.categoryName && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/6 text-white/40">
                                {job.categoryName}
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
                            <button className="h-8 px-3 rounded-lg bg-white/6 hover:bg-white/10 text-white text-xs font-semibold transition-colors border border-white/8">
                              View
                            </button>
                          </Link>
                          <button
                            className={`h-8 px-4 rounded-lg font-bold text-xs transition-all ${
                              isExpanded
                                ? "bg-white/10 text-white/60 border border-white/10"
                                : "bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.96] text-black"
                            }`}
                            onClick={() => handleClaimExpand(job.id)}
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
                          <div className="px-6 py-4 bg-[#0f0c06]">
                            <p className="text-xs font-semibold text-white/50 mb-3">Claim details (optional)</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-white/40 block mb-1.5">Message to homeowner</label>
                                <textarea
                                  className="w-full bg-[#1d1a12] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#ffc800]/50 resize-none h-20"
                                  placeholder="Briefly describe your experience and approach..."
                                  value={claimMessage}
                                  onChange={(e) => setClaimMessage(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-white/40 block mb-1.5">
                                  <DollarSign className="h-3 w-3 inline-block mr-0.5" />
                                  Proposed price (AUD)
                                </label>
                                <input
                                  type="number"
                                  className="w-full bg-[#1d1a12] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#ffc800]/50 h-10"
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
                                className="h-8 px-4 rounded-lg bg-white/6 hover:bg-white/10 text-white text-xs font-semibold transition-colors border border-white/8"
                                onClick={() => setExpandedClaimJobId(null)}
                              >
                                Cancel
                              </button>
                              <button
                                className="h-8 px-5 rounded-lg bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-xs transition-all active:scale-[0.97] disabled:opacity-50"
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
                className="bg-[#130f07] border border-white/6 hover:border-[#ffc800]/30 rounded-2xl p-4 cursor-pointer transition-colors group hover:bg-[#1a1508]"
              >
                <Icon className="h-5 w-5 text-[#ffc800] mb-2.5 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="text-xs text-white/35 mt-0.5">{sub}</p>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
