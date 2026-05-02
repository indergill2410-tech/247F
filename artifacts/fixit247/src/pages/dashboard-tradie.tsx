import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetTradiedashboard, useClaimJob } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Briefcase, CheckCircle, DollarSign, ChevronRight, MapPin, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const URGENCY: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  emergency: { label: "Emergency", cls: "bg-red-500/15 text-red-400",    Icon: Zap },
  urgent:    { label: "Urgent",    cls: "bg-orange-500/15 text-orange-400", Icon: Clock },
  standard:  { label: "Standard",  cls: "bg-white/8 text-white/40",      Icon: Briefcase },
};
const CLAIM_STATUS: Record<string, string> = {
  pending:   "bg-[#f5c518]/15 text-[#f5c518]",
  accepted:  "bg-emerald-500/15 text-emerald-400",
  rejected:  "bg-red-500/15 text-red-400",
  withdrawn: "bg-white/8 text-white/40",
  completed: "bg-blue-500/15 text-blue-400",
};

export default function TradieDashboard() {
  const { user } = useAuth();
  const { data, isLoading, refetch } = useGetTradiedashboard();
  const { toast } = useToast();

  const claimMutation = useClaimJob({
    mutation: {
      onSuccess: () => {
        toast({ title: "Claimed!", description: "You've successfully claimed this job." });
        refetch();
      },
      onError: (err) => {
        const msg = (err as { data?: { message?: string } })?.data?.message ?? "Failed to claim job";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  const stats = [
    { label: "Active Jobs",     value: data?.activeJobs ?? 0,                       icon: Briefcase,   color: "text-blue-400",    bg: "bg-blue-500/10" },
    { label: "Completed",       value: data?.completedJobs ?? 0,                    icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Available Leads", value: data?.availableLeads ?? 0,                   icon: DollarSign,  color: "text-[#f5c518]",   bg: "bg-[#f5c518]/10" },
    { label: "My Rating",       value: data?.myRating ? `${data.myRating}★` : "–", icon: Star,        color: "text-[#f5c518]",   bg: "bg-[#f5c518]/10" },
  ];

  return (
    <div className="min-h-screen bg-[#0b0904]">
      <div className="border-b border-white/6 bg-[#0f0c06] px-6 py-8">
        <div className="container max-w-6xl">
          <h1 className="text-2xl font-black text-white">Welcome back, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-white/45 mt-1 text-sm">Find jobs and manage your work.</p>
        </div>
      </div>

      <div className="container max-w-6xl py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <div className="bg-[#130f07] border border-white/6 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/45 font-medium">{s.label}</p>
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

        {/* Available Jobs */}
        <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
            <h2 className="font-bold text-white">Available Jobs Near You</h2>
            <Link href="/jobs">
              <span className="text-sm text-[#f5c518] hover:text-[#e6b800] cursor-pointer flex items-center gap-1 transition-colors">
                Browse all <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-4"><Skeleton className="h-16 w-full bg-white/6" /></div>
              ))
            ) : !data?.availableJobs?.length ? (
              <div className="text-center py-10 text-white/35">
                <p className="text-sm">No available jobs right now. Check back soon!</p>
              </div>
            ) : (
              data.availableJobs.map((job) => {
                const u = URGENCY[job.urgency] ?? URGENCY.standard;
                const Icon = u.Icon;
                return (
                  <div key={job.id} className="px-6 py-4 hover:bg-white/3 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Link href={`/jobs/${job.id}`}>
                            <span className="font-semibold text-white hover:text-[#f5c518] cursor-pointer transition-colors">{job.title}</span>
                          </Link>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${u.cls}`}>
                            <Icon className="h-3 w-3" /> {u.label}
                          </span>
                        </div>
                        <p className="text-sm text-white/45 line-clamp-1">{job.description}</p>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-white/35">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.suburb ?? "Remote"}</span>
                          <span>{job.categoryName}</span>
                          {job.budget && <span className="text-white/60 font-semibold">${job.budget}</span>}
                        </div>
                      </div>
                      <button
                        className="h-8 px-4 rounded-lg bg-[#f5c518] hover:bg-[#e6b800] text-black font-bold text-xs transition-colors flex-shrink-0 disabled:opacity-50"
                        disabled={claimMutation.isPending}
                        onClick={() => claimMutation.mutate({ jobId: job.id, data: {} })}
                      >
                        Claim
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* My Recent Claims */}
        <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/6">
            <h2 className="font-bold text-white">My Recent Claims</h2>
          </div>
          <div className="divide-y divide-white/5">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-3"><Skeleton className="h-10 w-full bg-white/6" /></div>
              ))
            ) : !data?.recentClaims?.length ? (
              <div className="text-center py-8 text-white/35 text-sm">
                No claims yet. Start claiming jobs above!
              </div>
            ) : (
              data.recentClaims.map((claim) => (
                <Link href={`/jobs/${claim.jobId}`} key={claim.id}>
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-white/3 cursor-pointer transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-white">Job #{claim.jobId}</p>
                      <p className="text-xs text-white/35 mt-0.5">{new Date(claim.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md capitalize ${CLAIM_STATUS[claim.status] ?? "bg-white/8 text-white/40"}`}>
                      {claim.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
