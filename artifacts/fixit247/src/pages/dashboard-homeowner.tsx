import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetHomeownerDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Briefcase, Clock, CheckCircle, Bell, ChevronRight, Wrench } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  open:        { label: "Open",        cls: "bg-blue-500/15 text-blue-400" },
  matched:     { label: "Matched",     cls: "bg-[#ffc800]/15 text-[#ffc800]" },
  in_progress: { label: "In Progress", cls: "bg-orange-500/15 text-orange-400" },
  completed:   { label: "Completed",   cls: "bg-emerald-500/15 text-emerald-400" },
  cancelled:   { label: "Cancelled",   cls: "bg-white/8 text-white/40" },
};
const URGENCY_MAP: Record<string, string> = {
  emergency: "bg-red-500/15 text-red-400",
  urgent:    "bg-orange-500/15 text-orange-400",
  standard:  "bg-white/8 text-white/40",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.cancelled;
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${s.cls}`}>{s.label}</span>;
}
function UrgencyBadge({ urgency }: { urgency: string }) {
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${URGENCY_MAP[urgency] ?? "bg-white/8 text-white/40"}`}>{urgency}</span>;
}

export default function HomeownerDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useGetHomeownerDashboard();

  const greeting = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening";

  const stats = [
    { label: "Total Jobs",     value: data?.totalJobs ?? 0,      icon: Briefcase,   color: "text-blue-400",       bg: "bg-blue-500/10" },
    { label: "In Progress",    value: data?.inProgressJobs ?? 0, icon: Clock,       color: "text-orange-400",     bg: "bg-orange-500/10" },
    { label: "Completed",      value: data?.completedJobs ?? 0,  icon: CheckCircle, color: "text-emerald-400",    bg: "bg-emerald-500/10" },
    { label: "Pending Claims", value: data?.pendingClaims ?? 0,  icon: Bell,        color: "text-[#ffc800]",      bg: "bg-[#ffc800]/10" },
  ];

  return (
    <div className="min-h-screen bg-[#0b0904]">
      {/* Page header */}
      <div className="border-b border-white/6 bg-[#0f0c06] py-8">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">
              Good {greeting}, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-white/45 mt-1 text-sm">Here's what's happening with your jobs.</p>
          </div>
          <Link href="/jobs/new">
            <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] text-black font-bold text-sm transition-all">
              <Plus className="h-4 w-4" /> Post New Job
            </button>
          </Link>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -2 }}
            >
              <div className="bg-[#130f07] border border-white/6 hover:border-white/12 rounded-2xl p-5 transition-colors h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 font-medium">{s.label}</p>
                    {isLoading
                      ? <Skeleton className="h-8 w-12 mt-1.5 bg-white/8" />
                      : <p className="text-3xl font-black text-white mt-1">{s.value}</p>
                    }
                  </div>
                  <div className={`${s.bg} ${s.color} p-2.5 rounded-xl`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Jobs */}
        <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
            <h2 className="font-bold text-white">Recent Jobs</h2>
            <Link href="/jobs">
              <span className="text-sm text-[#ffc800] hover:text-[#e6b800] cursor-pointer flex items-center gap-1 transition-colors">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-4"><Skeleton className="h-12 w-full bg-white/6" /></div>
              ))
            ) : !data?.recentJobs?.length ? (
              <div className="text-center py-14 text-white/35">
                <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-white/50">No jobs yet</p>
                <p className="text-sm mt-1">Post your first job to get started</p>
                <Link href="/jobs/new">
                  <button className="mt-5 h-9 px-5 rounded-xl bg-[#ffc800] text-black font-bold text-sm hover:bg-[#e6b800] active:scale-[0.97] transition-all inline-flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> Post a Job
                  </button>
                </Link>
              </div>
            ) : (
              data.recentJobs.map((job) => (
                <Link href={`/jobs/${job.id}`} key={job.id}>
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-white/3 cursor-pointer transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white truncate group-hover:text-[#ffc800] transition-colors">{job.title}</p>
                        <StatusBadge status={job.status} />
                        <UrgencyBadge urgency={job.urgency} />
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{job.categoryName} · {job.suburb ?? "Remote"}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/25 group-hover:text-[#ffc800] flex-shrink-0 ml-3 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/jobs/new">
            <motion.div
              whileHover={{ y: -2 }}
              className="group bg-[#130f07] border border-white/6 hover:border-[#ffc800]/30 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all"
            >
              <div className="w-11 h-11 bg-[#ffc800] rounded-xl flex items-center justify-center flex-shrink-0">
                <Plus className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-[#ffc800] transition-colors">Post a New Job</p>
                <p className="text-xs text-white/40 mt-0.5">Get matched with tradies in minutes</p>
              </div>
            </motion.div>
          </Link>
          <Link href="/notifications">
            <motion.div
              whileHover={{ y: -2 }}
              className="group bg-[#130f07] border border-white/6 hover:border-[#ffc800]/30 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all"
            >
              <div className="w-11 h-11 bg-white/8 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-[#ffc800]" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-[#ffc800] transition-colors">Notifications</p>
                <p className="text-xs text-white/40 mt-0.5">See claims &amp; updates</p>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
}
