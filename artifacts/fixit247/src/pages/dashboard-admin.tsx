import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetAdminDashboard,
  useAdminListUsers,
  useAdminListJobs,
  useAdminUpdateUser,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Briefcase,
  Grid3x3,
  TrendingUp,
  ShieldCheck,
  ShieldX,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Star,
  Search,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const ROLE_COLORS: Record<string, string> = {
  homeowner: "bg-blue-500/15 text-blue-400",
  tradie: "bg-emerald-500/15 text-emerald-400",
  admin: "bg-purple-500/15 text-purple-400",
};

const JOB_STATUS: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-400",
  matched: "bg-[#ffc800]/15 text-[#ffc800]",
  in_progress: "bg-orange-500/15 text-orange-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-white/8 text-white/40",
};

function timeAgo(date: string | Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  suburb?: string | null;
  postcode?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  rating?: number | null;
  reviewCount: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string | Date;
};

function UserAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "w-12 h-12 text-base" : "w-8 h-8 text-xs";
  return (
    <div className={`${sz} rounded-xl bg-[#ffc800] text-black flex items-center justify-center font-black flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function TradieCard({
  user,
  onVerify,
  onReject,
  loading,
}: {
  user: AdminUser;
  onVerify: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      variants={item}
      className="bg-[#0f0c06] border border-white/8 hover:border-[#ffc800]/30 rounded-2xl p-5 transition-colors"
    >
      <div className="flex items-start gap-4">
        <UserAvatar name={user.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold text-white text-sm">{user.name}</p>
              <p className="text-xs text-white/40 mt-0.5">{user.email}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400">
                <Clock className="h-3 w-3" /> Pending
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/45">
            {user.suburb && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {user.suburb}{user.postcode ? ` ${user.postcode}` : ""}
              </span>
            )}
            {user.phone && <span>📞 {user.phone}</span>}
            {(user.reviewCount ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-[#ffc800]" />
                {user.rating?.toFixed(1) ?? "—"} ({user.reviewCount} reviews)
              </span>
            )}
            <span className="text-white/30">Joined {timeAgo(user.createdAt)}</span>
          </div>

          {user.bio && (
            <p className="mt-2.5 text-xs text-white/55 leading-relaxed line-clamp-2 bg-white/3 rounded-lg px-3 py-2">
              {user.bio}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={onVerify}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-all disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" /> Verify Tradie
            </button>
            <button
              onClick={onReject}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all disabled:opacity-50 active:scale-95"
            >
              <XCircle className="h-4 w-4" /> Suspend
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetAdminDashboard();
  const { data: usersData, refetch: refetchUsers } = useAdminListUsers({});
  const { data: jobsData } = useAdminListJobs({});

  const [activeTab, setActiveTab] = useState("verification");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "homeowner" | "tradie" | "admin">("all");
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const updateUser = useAdminUpdateUser({
    mutation: {
      onSuccess: () => {
        refetchUsers();
        refetchStats();
      },
    },
  });

  function mutate(id: number, data: { isActive?: boolean; isVerified?: boolean }, successMsg: string) {
    setPendingIds((p) => new Set(p).add(id));
    updateUser.mutate(
      { id, data },
      {
        onSuccess: () => {
          toast({ title: "Done", description: successMsg });
          setPendingIds((p) => { const n = new Set(p); n.delete(id); return n; });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update user.", variant: "destructive" });
          setPendingIds((p) => { const n = new Set(p); n.delete(id); return n; });
        },
      }
    );
  }

  const filteredUsers = (usersData?.users ?? []).filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const q = userSearch.toLowerCase();
    const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const pendingTradies = (stats?.pendingTradies ?? []) as AdminUser[];
  const pendingCount = stats?.pendingVerification ?? 0;

  const statCards = [
    { label: "Total Users",    value: stats?.totalUsers ?? 0,          color: "text-blue-400",    bg: "bg-blue-500/10",    icon: Users },
    { label: "Homeowners",     value: stats?.totalHomeowners ?? 0,     color: "text-indigo-400",  bg: "bg-indigo-500/10",  icon: Users },
    { label: "Tradies",        value: stats?.totalTradies ?? 0,        color: "text-emerald-400", bg: "bg-emerald-500/10", icon: ShieldCheck },
    { label: "Verified",       value: stats?.verifiedTradies ?? 0,     color: "text-[#ffc800]",   bg: "bg-[#ffc800]/10",   icon: UserCheck },
    { label: "Total Jobs",     value: stats?.totalJobs ?? 0,           color: "text-orange-400",  bg: "bg-orange-500/10",  icon: Briefcase },
    { label: "Categories",     value: stats?.totalCategories ?? 0,     color: "text-purple-400",  bg: "bg-purple-500/10",  icon: Grid3x3 },
    { label: "Open Jobs",      value: stats?.openJobs ?? 0,            color: "text-red-400",     bg: "bg-red-500/10",     icon: TrendingUp },
    { label: "Completed Jobs", value: stats?.completedJobs ?? 0,       color: "text-teal-400",    bg: "bg-teal-500/10",    icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-[#0b0904]">
      <div className="border-b border-white/6 bg-[#0f0c06] py-8">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
            <p className="text-white/45 mt-1 text-sm">Platform management &amp; tradie verification</p>
          </div>
          {pendingCount > 0 && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setActiveTab("verification")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-sm font-bold hover:bg-amber-500/25 transition-all"
            >
              <AlertCircle className="h-4 w-4" />
              {pendingCount} awaiting verification
            </motion.button>
          )}
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Stats Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3"
        >
          {statCards.map((s) => (
            <motion.div
              key={s.label}
              variants={item}
              whileHover={{ y: -2 }}
              className="bg-[#130f07] border border-white/6 hover:border-white/12 rounded-2xl p-4 text-center transition-colors cursor-default col-span-1"
            >
              <div className={`w-8 h-8 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <s.icon className="h-3.5 w-3.5" />
              </div>
              {statsLoading
                ? <Skeleton className="h-6 w-8 mx-auto mb-1 bg-white/8" />
                : <p className="text-xl font-black text-white">{s.value}</p>
              }
              <p className="text-[10px] text-white/40 mt-0.5 leading-tight">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#130f07] border border-white/8 p-1 rounded-xl h-auto gap-1 flex-wrap">
            <TabsTrigger
              value="verification"
              className="rounded-lg text-white/50 data-[state=active]:bg-[#ffc800] data-[state=active]:text-black data-[state=active]:font-bold px-4 py-2 transition-all relative"
            >
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              Verify Tradies
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-lg text-white/50 data-[state=active]:bg-[#ffc800] data-[state=active]:text-black data-[state=active]:font-bold px-4 py-2 transition-all"
            >
              <Users className="h-4 w-4 mr-1.5" /> All Users
            </TabsTrigger>
            <TabsTrigger
              value="jobs"
              className="rounded-lg text-white/50 data-[state=active]:bg-[#ffc800] data-[state=active]:text-black data-[state=active]:font-bold px-4 py-2 transition-all"
            >
              <Briefcase className="h-4 w-4 mr-1.5" /> Jobs
            </TabsTrigger>
          </TabsList>

          {/* ── VERIFICATION TAB ── */}
          <TabsContent value="verification" className="mt-4">
            <motion.div key="verification" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
              {pendingTradies.length === 0 ? (
                <div className="bg-[#130f07] border border-white/6 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="h-8 w-8 text-emerald-400" />
                  </div>
                  <p className="text-white font-bold text-lg">All caught up!</p>
                  <p className="text-white/40 text-sm mt-1">No tradies pending verification.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-white">
                      Pending Verification
                      <span className="ml-2 text-white/35 text-sm font-normal">({pendingTradies.length})</span>
                    </h2>
                    <p className="text-xs text-white/35">Review each tradie before approving</p>
                  </div>
                  <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {pendingTradies.map((u) => (
                      <TradieCard
                        key={u.id}
                        user={u}
                        loading={pendingIds.has(u.id)}
                        onVerify={() => mutate(u.id, { isVerified: true }, `${u.name} has been verified.`)}
                        onReject={() => mutate(u.id, { isActive: false }, `${u.name} has been suspended.`)}
                      />
                    ))}
                  </motion.div>
                </>
              )}
            </motion.div>
          </TabsContent>

          {/* ── USERS TAB ── */}
          <TabsContent value="users" className="mt-4">
            <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

              {/* Search + Filter */}
              <div className="flex gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#130f07] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#ffc800]/50 transition-colors"
                  />
                </div>
                <div className="flex gap-1.5">
                  {(["all", "homeowner", "tradie", "admin"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
                        roleFilter === r
                          ? "bg-[#ffc800] text-black"
                          : "bg-[#130f07] border border-white/8 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                  <h2 className="font-bold text-white">All Users</h2>
                  <span className="text-xs text-white/35 font-medium">{filteredUsers.length} shown</span>
                </div>
                <div className="divide-y divide-white/5">
                  <AnimatePresence>
                    {filteredUsers.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-between px-6 py-3.5 hover:bg-white/2 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar name={user.name} />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-white truncate">{user.name}</p>
                            <p className="text-xs text-white/35 truncate">{user.email}</p>
                            {user.suburb && <p className="text-xs text-white/25">{user.suburb}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md capitalize hidden sm:block ${ROLE_COLORS[user.role] ?? "bg-white/8 text-white/40"}`}>
                            {user.role}
                          </span>
                          {user.role === "tradie" && (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md hidden md:block ${user.isVerified ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                              {user.isVerified ? "Verified" : "Unverified"}
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md hidden sm:block ${user.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                            {user.isActive ? "Active" : "Suspended"}
                          </span>
                          {/* Verify tradie toggle */}
                          {user.role === "tradie" && (
                            <button
                              onClick={() => mutate(
                                user.id,
                                { isVerified: !user.isVerified },
                                user.isVerified ? `${user.name} unverified.` : `${user.name} verified!`
                              )}
                              disabled={pendingIds.has(user.id)}
                              title={user.isVerified ? "Revoke verification" : "Verify tradie"}
                              className="transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                            >
                              {user.isVerified
                                ? <ShieldCheck className="h-5 w-5 text-emerald-400 hover:text-emerald-300" />
                                : <ShieldX className="h-5 w-5 text-amber-400 hover:text-amber-300" />
                              }
                            </button>
                          )}
                          {/* Active/suspend toggle */}
                          <button
                            onClick={() => mutate(
                              user.id,
                              { isActive: !user.isActive },
                              user.isActive ? `${user.name} suspended.` : `${user.name} activated.`
                            )}
                            disabled={pendingIds.has(user.id)}
                            title={user.isActive ? "Suspend user" : "Activate user"}
                            className="transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                          >
                            {user.isActive
                              ? <ToggleRight className="h-6 w-6 text-emerald-400 hover:text-emerald-300" />
                              : <ToggleLeft className="h-6 w-6 text-red-400 hover:text-red-300" />
                            }
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {filteredUsers.length === 0 && (
                    <div className="px-6 py-10 text-center text-white/35 text-sm">No users found.</div>
                  )}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ── JOBS TAB ── */}
          <TabsContent value="jobs" className="mt-4">
            <motion.div key="jobs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
              <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                  <h2 className="font-bold text-white">All Jobs</h2>
                  <span className="text-xs text-white/35 font-medium">{jobsData?.total ?? 0} total</span>
                </div>
                <div className="divide-y divide-white/5">
                  {(jobsData?.jobs ?? []).map((job) => (
                    <Link href={`/jobs/${job.id}`} key={job.id}>
                      <div className="flex items-center justify-between px-6 py-3.5 hover:bg-white/2 cursor-pointer transition-colors group">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white truncate group-hover:text-[#ffc800] transition-colors">
                            {job.title}
                          </p>
                          <p className="text-xs text-white/35 mt-0.5">
                            {job.categoryName} · {job.suburb ?? "Remote"} · {timeAgo(job.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          {job.budget && (
                            <span className="text-xs text-white/40 hidden sm:block">
                              ${Number(job.budget).toLocaleString()}
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md capitalize ${JOB_STATUS[job.status] ?? "bg-white/8 text-white/40"}`}>
                            {job.status.replace("_", " ")}
                          </span>
                          <ChevronRight className="h-4 w-4 text-white/25 group-hover:text-[#ffc800] transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {(jobsData?.jobs ?? []).length === 0 && (
                    <div className="px-6 py-10 text-center text-white/35 text-sm">No jobs yet.</div>
                  )}
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
