import { useState } from "react";
import { Link } from "wouter";
import { useListJobs, useListCategories, useClaimJob } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MapPin, DollarSign, Clock, Zap, Briefcase, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_MAP: Record<string, string> = {
  open:        "bg-blue-500/15 text-blue-400",
  matched:     "bg-[#ffc800]/15 text-[#ffc800]",
  in_progress: "bg-orange-500/15 text-orange-400",
  completed:   "bg-emerald-500/15 text-emerald-400",
  cancelled:   "bg-white/8 text-white/40",
};

function UrgencyIcon({ urgency }: { urgency: string }) {
  if (urgency === "emergency") return <Zap className="h-3.5 w-3.5 text-red-400" />;
  if (urgency === "urgent") return <Clock className="h-3.5 w-3.5 text-orange-400" />;
  return <Briefcase className="h-3.5 w-3.5 text-white/30" />;
}

export default function JobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryId, setCategoryId] = useState("all");

  const { data: categories } = useListCategories();
  const { data, isLoading, refetch } = useListJobs({
    status: status !== "all" ? (status as string) : undefined,
    categoryId: categoryId !== "all" ? Number(categoryId) : undefined,
    page: 1,
    limit: 20,
  });

  const claimMutation = useClaimJob({
    mutation: {
      onSuccess: () => {
        toast({ title: "Claimed!", description: "You've successfully claimed this job." });
        refetch();
      },
      onError: (err) => {
        const msg = (err as { data?: { message?: string } })?.data?.message ?? "Failed to claim";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  const filteredJobs = (data?.jobs ?? []).filter(
    (j) => !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase()) ||
      (j.suburb ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#0b0904]">
      {/* Header */}
      <div className="border-b border-white/6 bg-[#0f0c06] py-8">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">
              {user?.role === "homeowner" ? "My Jobs" : "Browse Jobs"}
            </h1>
            <p className="text-white/45 mt-1 text-sm">
              {data?.total ?? 0} job{(data?.total ?? 0) !== 1 ? "s" : ""} found
            </p>
          </div>
          {user?.role === "homeowner" && (
            <Link href="/jobs/new">
              <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-sm transition-colors">
                <Plus className="h-4 w-4" /> Post Job
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search jobs, suburb…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-[#130f07] border border-white/8 rounded-xl pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffc800]/40 transition-all"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40 h-10 bg-[#130f07] border-white/8 text-white/70 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1509] border-white/10 text-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full sm:w-44 h-10 bg-[#130f07] border-white/8 text-white/70 rounded-xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1509] border-white/10 text-white">
              <SelectItem value="all">All Categories</SelectItem>
              {(categories ?? []).map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Job list */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl bg-white/5" />
            ))
          ) : !filteredJobs.length ? (
            <div className="text-center py-16 text-white/35">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-semibold text-white/50">No jobs found</p>
              {user?.role === "homeowner" && (
                <Link href="/jobs/new">
                  <button className="mt-5 h-10 px-6 rounded-xl bg-[#ffc800] text-black font-bold text-sm hover:bg-[#e6b800] transition-colors">
                    Post your first job
                  </button>
                </Link>
              )}
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.id} className="bg-[#130f07] border border-white/6 hover:border-[#ffc800]/25 rounded-2xl p-5 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <UrgencyIcon urgency={job.urgency} />
                      <Link href={`/jobs/${job.id}`}>
                        <span className="font-bold text-white hover:text-[#ffc800] cursor-pointer transition-colors">{job.title}</span>
                      </Link>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${STATUS_MAP[job.status] ?? "bg-white/8 text-white/40"}`}>
                        {job.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-white/45 line-clamp-2">{job.description}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-white/35">
                      {(job.suburb || job.postcode) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[job.suburb, job.postcode].filter(Boolean).join(" ")}
                        </span>
                      )}
                      {job.categoryName && <span>{job.categoryName}</span>}
                      {job.budget && (
                        <span className="flex items-center gap-1 text-white/60 font-semibold">
                          <DollarSign className="h-3 w-3" />${job.budget}
                        </span>
                      )}
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link href={`/jobs/${job.id}`}>
                      <button className="h-8 px-4 rounded-lg border border-white/12 text-white/60 hover:text-white hover:border-white/25 text-xs font-medium transition-all flex items-center gap-1">
                        View <ChevronRight className="h-3 w-3" />
                      </button>
                    </Link>
                    {user?.role === "tradie" && ["open", "matched"].includes(job.status) && (
                      <button
                        className="h-8 px-4 rounded-lg bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-xs transition-colors disabled:opacity-50"
                        disabled={claimMutation.isPending}
                        onClick={() => claimMutation.mutate({ jobId: job.id, data: {} })}
                      >
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
