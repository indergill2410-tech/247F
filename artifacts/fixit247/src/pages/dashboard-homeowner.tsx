import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetHomeownerDashboard,
  useUpdateClaim,
  useListNotifications,
  useMarkNotificationRead,
  useGetEmergencyMembershipStatus,
  useVerifyEmergencySession,
  useCancelEmergencyMembership,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Briefcase, Clock, CheckCircle, Bell, ChevronRight, Wrench,
  Star, MessageSquare, MapPin, User, Users,
  ThumbsUp, ThumbsDown, TrendingUp, Home, AlertCircle, Info, Settings,
  ShieldCheck, Zap, Droplets, Lock, Flame, Wind, Bug, Thermometer, Phone,
  Car, BatteryFull, Fuel,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating > i;
        return (
          <span key={i} className="relative inline-block">
            <Star className="h-3 w-3 text-white/20" />
            {(filled || half) && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: filled ? "100%" : "50%" }}>
                <Star className="h-3 w-3 fill-primary text-primary" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  open:        { label: "Open",        cls: "bg-blue-500/15 text-blue-400" },
  matched:     { label: "Matched",     cls: "bg-primary/15 text-primary" },
  in_progress: { label: "In Progress", cls: "bg-orange-500/15 text-orange-400" },
  completed:   { label: "Completed",   cls: "bg-emerald-500/15 text-emerald-400" },
  cancelled:   { label: "Cancelled",   cls: "bg-white/8 text-white/40" },
};
const URGENCY_MAP: Record<string, string> = {
  emergency: "bg-red-500/15 text-red-400",
  urgent:    "bg-orange-500/15 text-orange-400",
  standard:  "bg-white/8 text-white/40",
};

const NOTIF_ICON: Record<string, React.ReactNode> = {
  claim:    <Bell className="h-3.5 w-3.5 text-primary" />,
  message:  <MessageSquare className="h-3.5 w-3.5 text-blue-400" />,
  match:    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />,
  job:      <Briefcase className="h-3.5 w-3.5 text-purple-400" />,
  alert:    <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
};

function TradieName({ name }: { name: string | null }) {
  const initials = (name ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary font-black text-sm flex items-center justify-center flex-shrink-0 select-none">
      {initials}
    </div>
  );
}

const HOME_COVERAGE = [
  { icon: Droplets,    label: "Burst pipe" },
  { icon: Zap,         label: "Power outage" },
  { icon: Lock,        label: "Lockout" },
  { icon: Flame,       label: "Gas leak" },
  { icon: Wind,        label: "Storm damage" },
  { icon: Thermometer, label: "HVAC failure" },
];

const ROAD_COVERAGE = [
  { icon: Car,        label: "Breakdown" },
  { icon: Wrench,     label: "Flat tyre" },
  { icon: BatteryFull, label: "Jump-start" },
  { icon: Fuel,       label: "Fuel delivery" },
];

function PlusMembershipWidget() {
  const { toast } = useToast();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const emergencyParam = searchParams.get("emergency");
  const sessionId = searchParams.get("session_id");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "emergency">("overview");

  const { data: membership, isLoading, refetch } = useGetEmergencyMembershipStatus();

  const verifyMutation = useVerifyEmergencySession({
    mutation: {
      onSuccess: () => {
        toast({ title: "Fixit 24/7 Plus activated!", description: "You now have priority dispatch and 24/7 emergency cover." });
        refetch();
        window.history.replaceState({}, "", "/dashboard");
      },
      onError: () => {
        refetch();
        window.history.replaceState({}, "", "/dashboard");
      },
    },
  });

  const cancelMutation = useCancelEmergencyMembership({
    mutation: {
      onSuccess: (data) => {
        const end = data.subEnd ? new Date(data.subEnd).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "";
        toast({ title: "Membership cancellation scheduled", description: `Your Fixit 24/7 Plus access continues until ${end}.` });
        setShowCancelModal(false);
        refetch();
      },
      onError: () => {
        toast({ title: "Error", description: "Could not cancel membership. Please try again.", variant: "destructive" });
        setShowCancelModal(false);
      },
    },
  });

  useEffect(() => {
    if (emergencyParam === "success" && sessionId && !verifyMutation.isPending) {
      verifyMutation.mutate({ data: { sessionId } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emergencyParam, sessionId]);

  if (isLoading) {
    return <Skeleton className="h-24 w-full bg-white/6 rounded-2xl" />;
  }

  /* ── NON-MEMBER: high-conversion upsell card ── */
  if (!membership || !membership.active) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-primary/20 overflow-hidden"
        style={{ background: "var(--app-hero-panel-gradient)" }}
      >
        <div className="p-6">
          {/* Label row */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Fixit 24/7 Plus</span>
          </div>

          {/* Headline — leading USP */}
          <h3 className="text-xl font-black text-white leading-snug mb-1">
            Home emergency or car breakdown —{" "}
            <span className="text-primary">one membership covers both.</span>
          </h3>
          <p className="text-sm text-white/50 mb-5 leading-relaxed">
            Pipe burst at midnight. Car dead on the highway. One call sorts it — any time, any day.
          </p>

          {/* Two-pillar coverage grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Home pillar */}
            <div className="bg-white/4 border border-white/6 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Home className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">At Home</span>
              </div>
              <ul className="space-y-1.5">
                {["Burst pipes", "Power outages", "Lockouts", "Gas leaks", "Storm damage"].map((i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="text-[11px] text-white/55">{i}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Road pillar */}
            <div className="bg-white/4 border border-white/6 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Car className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">On the Road</span>
              </div>
              <ul className="space-y-1.5">
                {["Car breakdown", "Flat tyres", "Battery jump-start", "Fuel delivery", "Keys locked in"].map((i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="text-[11px] text-white/55">{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Price anchor + CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <span className="text-3xl font-black text-white">A$49</span>
              <span className="text-sm text-white/40 ml-1">/month</span>
              <p className="text-[11px] text-white/30 mt-0.5">Home + road cover in one plan</p>
            </div>
            <Link to="/emergency">
              <button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-black text-sm transition-colors whitespace-nowrap">
                Get Plus — A$49/month
              </button>
            </Link>
          </div>

          {/* Trust signal */}
          <p className="text-[11px] text-white/25 mt-3">
            12-month minimum commitment · Cancel anytime after that
          </p>
        </div>
      </motion.div>
    );
  }

  /* ── MEMBER: perks card with tabs ── */
  const renewalDateStr = membership.renewalDate
    ? new Date(membership.renewalDate).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const isCancelling = membership.cancelAtPeriodEnd;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-5 ${isCancelling ? "bg-orange-500/6 border-orange-500/20" : "bg-primary/6 border-primary/25"}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCancelling ? "bg-orange-500/15" : "bg-primary/15"}`}>
            <ShieldCheck className={`h-5 w-5 ${isCancelling ? "text-orange-400" : "text-primary"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-black text-white">You're covered, 24/7.</span>
              {isCancelling ? (
                <span className="text-[10px] font-bold bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-md border border-orange-500/20">
                  Cancels {renewalDateStr}
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              Fixit 24/7 Plus ·{" "}
              {isCancelling ? `Access until ${renewalDateStr}` : `Renews ${renewalDateStr}`}
            </p>
          </div>
        </div>

        {/* Always-visible primary CTA */}
        <Link to="/emergency">
          <button className="w-full h-10 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-sm transition-colors flex items-center justify-center gap-2 mb-4">
            <Phone className="h-4 w-4" />
            Request Emergency Help
          </button>
        </Link>

        {/* Tab strip */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5 mb-4">
          {(["overview", "emergency"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === tab ? "bg-white/12 text-white" : "text-white/40 hover:text-white/65"
              }`}
            >
              {tab === "overview" ? "Overview" : "Emergency"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {/* Home coverage */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Home className="h-3 w-3 text-white/30" />
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">At Home</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {HOME_COVERAGE.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5 bg-white/4 rounded-xl p-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-[10px] text-white/50 text-center leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Road coverage */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Car className="h-3 w-3 text-white/30" />
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">On the Road</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {ROAD_COVERAGE.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5 bg-white/4 rounded-xl p-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-[10px] text-white/50 text-center leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Emergency access */}
              <div className="flex items-center justify-between bg-white/4 rounded-xl px-4 py-3">
                <span className="text-xs text-white/50">Emergency support status</span>
                <span className="text-sm font-black text-primary">Available</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="emergency"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {/* Large request button */}
              <Link to="/emergency">
                <button className="w-full h-14 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-black text-base transition-colors flex items-center justify-center gap-2">
                  <Phone className="h-5 w-5" />
                  Request Help Now
                </button>
              </Link>
              {/* 3-step dispatch flow */}
              <div className="space-y-2">
                {[
                  { step: "1", text: "Describe the emergency — we triage immediately" },
                  { step: "2", text: "We dispatch a trusted tradie, day or night" },
                  { step: "3", text: "Tradie arrives and resolves the problem" },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {step}
                    </div>
                    <span className="text-xs text-white/55">{text}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-white/30 text-center pt-1">
                Average response within 2 hours · Available 24/7, 365 days
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle cancel link */}
        {!isCancelling && (
          <div className="mt-4 pt-3 border-t border-white/6 text-center">
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={cancelMutation.isPending}
              className="text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              Cancel membership
            </button>
          </div>
        )}
      </motion.div>

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-[#17120a] border border-white/12 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-white mb-2">Cancel Fixit 24/7 Plus?</h3>
              <p className="text-sm text-white/55 leading-relaxed mb-4">
                Your membership will remain active until{" "}
                <span className="text-white/80 font-semibold">{renewalDateStr ?? "the end of this billing period"}</span>.
                {" "}Early cancellation terms apply — see your{" "}
                <a href="/membership-agreement" className="text-[#ffc800]/70 hover:text-[#ffc800] underline underline-offset-2">
                  Membership Agreement
                </a>{" "}for details.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 h-9 rounded-xl text-sm font-semibold text-white/60 border border-white/12 hover:border-white/25 hover:text-white/80 transition-colors"
                >
                  Keep membership
                </button>
                <button
                  onClick={() => cancelMutation.mutate({ data: { acknowledgedEarlyFee: true } })}
                  disabled={cancelMutation.isPending}
                  className="flex-1 h-9 rounded-xl text-sm font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/8 transition-colors disabled:opacity-50"
                >
                  {cancelMutation.isPending ? "Cancelling…" : "Confirm cancellation"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function HomeownerDashboard() {
  usePageTitle("My Dashboard");
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, isLoading, refetch } = useGetHomeownerDashboard();
  const { data: notifications, isLoading: notifLoading, refetch: refetchNotif } = useListNotifications(
    { limit: 6 } as Parameters<typeof useListNotifications>[0],
  );
  const [expandedClaim, setExpandedClaim] = useState<number | null>(null);

  const markRead = useMarkNotificationRead({ mutation: { onSuccess: () => refetchNotif() } });

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const memberSince = data?.memberSince
    ? new Date(data.memberSince).toLocaleDateString("en-AU", { month: "long", year: "numeric" })
    : null;

  const updateClaimMutation = useUpdateClaim({
    mutation: {
      onSuccess: (_, vars) => {
        const isAccept = (vars.data as { status?: string })?.status === "accepted";
        toast({
          title: isAccept ? "Tradie accepted!" : "Claim declined",
          description: isAccept
            ? "They've been notified and will be in touch."
            : "The tradie has been notified.",
        });
        refetch();
        setExpandedClaim(null);
      },
      onError: () => {
        toast({ title: "Error", description: "Could not update claim.", variant: "destructive" });
      },
    },
  });

  const stats = [
    {
      label: "Total Jobs",
      value: data?.totalJobs ?? 0,
      icon: Briefcase,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      desc: "posted by you",
    },
    {
      label: "Open",
      value: data?.openJobs ?? 0,
      icon: Bell,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      desc: "awaiting tradies",
    },
    {
      label: "In Progress",
      value: data?.inProgressJobs ?? 0,
      icon: Clock,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      desc: "active now",
    },
    {
      label: "Completed",
      value: data?.completedJobs ?? 0,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      desc: "jobs done",
    },
    {
      label: "Total Spent",
      value: data?.totalSpent ? `$${data.totalSpent.toLocaleString()}` : "$0",
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      desc: "on completed jobs",
    },
  ];

  const recentClaims = data?.recentClaims ?? [];
  const recentJobs = data?.recentJobs ?? [];
  const recentNotifs = (notifications ?? []).slice(0, 6);

  const initials = (user?.name ?? "H")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#0b0904]">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-0">
        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-[#130f07] border border-white/6 rounded-2xl p-5 sm:p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0 self-start sm:self-center">
              <div className="h-16 w-16 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                <span className="text-2xl font-black text-blue-300 tracking-tight">{initials}</span>
              </div>
              {/* Green online dot */}
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#130f07]" />
            </div>

            {/* Name / meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-xl font-black text-white leading-none">{user?.name ?? firstName}</h1>
                <span className="text-[10px] font-bold bg-blue-500/12 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/15">
                  Homeowner
                </span>
                {(data?.pendingClaims ?? 0) > 0 && (
                  <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-md border border-primary/20 animate-pulse">
                    {data!.pendingClaims} response{data!.pendingClaims !== 1 ? "s" : ""} waiting
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/35">
                {memberSince && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" /> Member since {memberSince}
                  </span>
                )}
                {user?.suburb && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {user.suburb}
                  </span>
                )}
                {(data?.totalJobs ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> {data!.totalJobs} job{data!.totalJobs !== 1 ? "s" : ""} posted
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <Link to="/jobs/new">
                <button className="h-9 px-4 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs transition-colors flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Post a Job
                </button>
              </Link>
              <Link to="/tradies">
                <button className="h-9 px-4 rounded-xl bg-white/6 hover:bg-white/10 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 border border-white/8">
                  <Users className="h-3.5 w-3.5" /> Find a Tradie
                </button>
              </Link>
              <Link to="/profile">
                <button className="h-9 px-4 rounded-xl bg-white/6 hover:bg-white/10 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 border border-white/8">
                  <Settings className="h-3.5 w-3.5" /> Profile
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 pb-8 space-y-6">

        {/* Stats grid: Total Jobs | Open | In Progress | Completed | Total Spent */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={cardItem} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
              <div className="bg-[#130f07] border border-white/6 hover:border-white/12 rounded-2xl p-4 transition-colors h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-white/40 font-medium">{s.label}</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-10 mt-1.5 bg-white/8" />
                    ) : (
                      <p className="text-2xl font-black text-white mt-1">{s.value}</p>
                    )}
                    <p className="text-[10px] text-white/25 mt-0.5">{s.desc}</p>
                  </div>
                  <div className={`${s.bg} ${s.color} p-2 rounded-xl flex-shrink-0`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Emergency 24/7 Membership Widget */}
        <PlusMembershipWidget />

        {/* Job Pipeline strip */}
        {!isLoading && (data?.totalJobs ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { label: "Open",        value: data?.openJobs ?? 0,        color: "text-sky-400",      bg: "bg-sky-500/8 border-sky-500/15",      dot: "bg-sky-400" },
              { label: "In Progress", value: data?.inProgressJobs ?? 0,  color: "text-orange-400",   bg: "bg-orange-500/8 border-orange-500/15", dot: "bg-orange-400" },
              { label: "Completed",   value: data?.completedJobs ?? 0,   color: "text-emerald-400",  bg: "bg-emerald-500/8 border-emerald-500/15", dot: "bg-emerald-400" },
            ].map((step, i) => (
              <div key={step.label} className={`rounded-2xl border px-4 py-3.5 flex items-center gap-3 ${step.bg}`}>
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${step.dot}`} />
                <div className="min-w-0">
                  <p className={`text-2xl font-black leading-none ${step.color}`}>{step.value}</p>
                  <p className="text-[10px] text-white/35 mt-0.5">{step.label}</p>
                </div>
                {i < 2 && <ChevronRight className="h-3.5 w-3.5 text-white/10 ml-auto flex-shrink-0 hidden sm:block" />}
              </div>
            ))}
          </motion.div>
        )}

        {/* Tradie Responses — the most action-driving section */}
        {(isLoading || recentClaims.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[#130f07] border border-primary/20 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-white">Tradies Responding to Your Jobs</h2>
                {recentClaims.length > 0 && (
                  <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    {recentClaims.length}
                  </span>
                )}
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="px-6 py-4"><Skeleton className="h-16 w-full bg-white/6" /></div>
                ))
              ) : (
                recentClaims.map((claim) => (
                  <div key={claim.id}>
                    <div
                      className="px-6 py-4 hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => setExpandedClaim(expandedClaim === claim.id ? null : claim.id)}
                    >
                      <div className="flex items-start gap-3">
                        <TradieName name={claim.tradieName} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">
                              {claim.tradieName ?? "Tradie"}
                            </span>
                            {claim.tradieRating != null && (
                              <div className="flex items-center gap-1">
                                <StarRow rating={claim.tradieRating} />
                                <span className="text-[10px] text-primary font-bold">{claim.tradieRating.toFixed(1)}</span>
                              </div>
                            )}
                            {claim.tradieReviewCount > 0 && (
                              <span className="text-[10px] text-white/30">{claim.tradieReviewCount} review{claim.tradieReviewCount !== 1 ? "s" : ""}</span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 mt-0.5">
                            For: <span className="text-white/60">{claim.jobTitle ?? `Job #${claim.jobId}`}</span>
                            <span className="mx-1.5 text-white/15">·</span>
                            {timeAgo(claim.createdAt)}
                          </p>
                          {claim.message && (
                            <p className="text-sm text-white/55 mt-1.5 line-clamp-2 italic">"{claim.message}"</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {claim.proposedPrice != null && (
                            <span className="text-sm font-black text-primary">
                              ${claim.proposedPrice.toLocaleString()}
                            </span>
                          )}
                          <ChevronRight className={`h-4 w-4 text-white/25 transition-transform duration-200 ${expandedClaim === claim.id ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedClaim === claim.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 bg-[#0f0c06] border-t border-white/5">
                            <div className="pt-4 flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={() => {
                                  updateClaimMutation.mutate({ jobId: claim.jobId, claimId: claim.id, data: { status: "accepted" } });
                                }}
                                disabled={updateClaimMutation.isPending}
                                className="flex-1 h-9 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-sm transition-colors flex items-center justify-center gap-2 border border-emerald-500/20 disabled:opacity-50"
                              >
                                <ThumbsUp className="h-4 w-4" /> Accept {claim.tradieName?.split(" ")[0]}
                              </button>
                              {claim.conversationId ? (
                                <Link to={`/conversations/${claim.conversationId}`}>
                                  <button className="flex-1 h-9 rounded-xl bg-white/6 hover:bg-white/10 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 border border-white/8 w-full">
                                    <MessageSquare className="h-4 w-4" /> Message
                                  </button>
                                </Link>
                              ) : (
                                <Link to="/conversations">
                                  <button className="flex-1 h-9 rounded-xl bg-white/6 hover:bg-white/10 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 border border-white/8 w-full">
                                    <MessageSquare className="h-4 w-4" /> Message
                                  </button>
                                </Link>
                              )}
                              <button
                                onClick={() => {
                                  updateClaimMutation.mutate({ jobId: claim.jobId, claimId: claim.id, data: { status: "rejected" } });
                                }}
                                disabled={updateClaimMutation.isPending}
                                className="h-9 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm transition-colors flex items-center justify-center gap-2 border border-red-500/15 disabled:opacity-50"
                              >
                                <ThumbsDown className="h-4 w-4" /> Decline
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* No pending claims but jobs exist — motivational empty state */}
        {!isLoading && recentClaims.length === 0 && (data?.totalJobs ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[#130f07] border border-white/6 rounded-2xl px-6 py-8 text-center"
          >
            <Bell className="h-8 w-8 mx-auto mb-3 text-white/15" />
            <p className="font-semibold text-white/60">No new tradie responses yet</p>
            <p className="text-sm text-white/35 mt-1">
              Tradies will respond to your open jobs — check back soon.
            </p>
          </motion.div>
        )}

        {/* My Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-white/40" />
              <h2 className="font-bold text-white">My Jobs</h2>
            </div>
            <Link to="/jobs">
              <span className="text-sm text-primary hover:opacity-90 cursor-pointer flex items-center gap-1 transition-colors">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-4"><Skeleton className="h-12 w-full bg-white/6" /></div>
              ))
            ) : !recentJobs.length ? (
              <div className="text-center py-14 text-white/35">
                <Wrench className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-semibold text-white/50">No jobs yet</p>
                <p className="text-sm mt-1">Post your first job to get matched with a tradie</p>
                <Link to="/jobs/new">
                  <button className="mt-5 h-9 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all inline-flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> Post a Job
                  </button>
                </Link>
              </div>
            ) : (
              recentJobs.map((job) => {
                const st = STATUS_MAP[job.status] ?? STATUS_MAP.cancelled;
                const urg = URGENCY_MAP[job.urgency] ?? "bg-white/8 text-white/40";
                return (
                  <Link to={`/jobs/${job.id}`} key={job.id}>
                    <div className="flex items-center justify-between px-6 py-4 hover:bg-white/2 cursor-pointer transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white truncate group-hover:text-primary transition-colors text-sm">
                            {job.title}
                          </p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${st.cls}`}>{st.label}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize ${urg}`}>{job.urgency}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-white/30 flex-wrap">
                          {job.categoryName && <span>{job.categoryName}</span>}
                          {job.suburb && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" /> {job.suburb}
                            </span>
                          )}
                          {(job.claimCount ?? 0) > 0 && (
                            <span className="text-primary/70 font-semibold">
                              {job.claimCount} tradie{job.claimCount !== 1 ? "s" : ""} responded
                            </span>
                          )}
                          <span>{timeAgo(job.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-primary flex-shrink-0 ml-3 transition-colors" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </motion.div>

        {/* First-time empty state — no jobs at all */}
        {!isLoading && (data?.totalJobs ?? 0) === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-gradient-to-br from-primary/8 to-[#130f07] border border-primary/20 rounded-2xl p-8 text-center"
          >
            <div className="w-14 h-14 bg-primary/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Home className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Welcome, {firstName}!</h3>
            <p className="text-white/50 text-sm max-w-xs mx-auto mb-6">
              Get your first home repair sorted in minutes. Post a job and verified local tradies will respond fast.
            </p>
            <Link to="/jobs/new">
              <button className="h-10 px-6 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-bold text-sm transition-all inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Post Your First Job
              </button>
            </Link>
          </motion.div>
        )}

        {/* Recent Activity strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-white/40" />
              <h2 className="font-bold text-white">Recent Activity</h2>
            </div>
            <Link to="/notifications">
              <span className="text-sm text-primary hover:opacity-90 cursor-pointer flex items-center gap-1 transition-colors">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {notifLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-3.5">
                  <Skeleton className="h-9 w-full bg-white/6" />
                </div>
              ))
            ) : recentNotifs.length === 0 ? (
              <div className="px-6 py-8 text-center text-white/30">
                <Bell className="h-7 w-7 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No recent activity yet</p>
              </div>
            ) : (
              <motion.ul variants={container} initial="hidden" animate="show">
                {recentNotifs.map((n) => {
                  const iconNode = NOTIF_ICON[n.type] ?? <Info className="h-3.5 w-3.5 text-white/40" />;
                  const href = n.jobId ? `/jobs/${n.jobId}` : "/notifications";
                  return (
                    <motion.li key={n.id} variants={cardItem}>
                      <Link to={href}>
                        <div
                          className={`flex items-start gap-3 px-6 py-3.5 hover:bg-white/2 cursor-pointer transition-colors group ${!n.isRead ? "bg-primary/2" : ""}`}
                          onClick={() => {
                            if (!n.isRead) markRead.mutate({ id: n.id });
                          }}
                        >
                          <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${!n.isRead ? "bg-primary/10" : "bg-white/5"}`}>
                            {iconNode}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${!n.isRead ? "text-white" : "text-white/60"}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{n.message}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-white/25">{timeAgo(n.createdAt)}</span>
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { href: "/jobs/new",    Icon: Plus,          label: "Post a Job",     sub: "Get matched fast" },
            { href: "/conversations",    Icon: MessageSquare, label: "Messages",       sub: "Chat with tradies" },
            { href: "/jobs",        Icon: Briefcase,     label: "My Jobs",        sub: "Track all your jobs" },
            { href: "/profile",     Icon: User,          label: "My Profile",     sub: "Edit your details" },
          ].map(({ href, Icon, label, sub }) => (
            <Link key={label} href={href}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                className="bg-[#130f07] border border-white/6 hover:border-primary/30 rounded-2xl p-4 cursor-pointer transition-colors group hover:bg-[#1a1508]"
              >
                <Icon className="h-5 w-5 text-primary mb-2.5 group-hover:scale-110 transition-transform" />
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
