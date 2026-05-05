import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link } from "wouter";
import { useListJobs, useListCategories, useClaimJob } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus, Search, MapPin, DollarSign, Clock, Zap, Briefcase, ChevronRight,
  X, SlidersHorizontal, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  open:        { label: "Open",        cls: "bg-blue-500/15 text-blue-400" },
  matched:     { label: "Matched",     cls: "bg-[#ffc800]/15 text-[#ffc800]" },
  in_progress: { label: "In Progress", cls: "bg-orange-500/15 text-orange-400" },
  completed:   { label: "Completed",   cls: "bg-emerald-500/15 text-emerald-400" },
  cancelled:   { label: "Cancelled",   cls: "bg-white/8 text-white/40" },
};

const URGENCY_MAP: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  emergency: { label: "Emergency", cls: "bg-red-500/15 text-red-400",      Icon: Zap },
  urgent:    { label: "Urgent",    cls: "bg-orange-500/15 text-orange-400", Icon: Clock },
  standard:  { label: "Standard",  cls: "bg-white/8 text-white/40",         Icon: Briefcase },
};

function timeAgo(date: string | Date): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function JobsPage() {
  usePageTitle("Browse Jobs");
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter state
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [urgency, setUrgency]     = useState("all");
  const [sortBy, setSortBy]       = useState("newest");
  const [tradeFilter, setTradeFilter] = useState<"my_trades" | "all">("my_trades");

  // Inline claim expansion
  const [expandedClaimJobId, setExpandedClaimJobId] = useState<number | null>(null);
  const [claimMessage, setClaimMessage]             = useState("");
  const [claimPrice, setClaimPrice]                 = useState("");

  const { data: categories } = useListCategories();
  const { data, isLoading, refetch } = useListJobs({
    status:     status     !== "all" ? (status as string)     : undefined,
    categoryId: categoryId !== "all" ? Number(categoryId)     : undefined,
    urgency:    urgency    !== "all" ? (urgency as string)     : undefined,
    sortBy:     sortBy     !== "newest" ? sortBy              : undefined,
    filter:     user?.role === "tradie" && tradeFilter !== "all" ? tradeFilter : undefined,
    page: 1,
    limit: 50,
  } as Parameters<typeof useListJobs>[0]);

  const claimMutation = useClaimJob({
    mutation: {
      onSuccess: () => {
        toast({ title: "Claimed!", description: "Job claimed successfully. Credits deducted." });
        setExpandedClaimJobId(null);
        setClaimMessage("");
        setClaimPrice("");
        refetch();
      },
      onError: (err) => {
        const errData = err as { data?: { message?: string; error?: string } };
        const msg = errData?.data?.error === "insufficient_credits"
          ? "Not enough credits — top up at Credits page."
          : (errData?.data?.message ?? "Failed to claim job");
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  // Client-side text search on top of server-filtered results
  const filteredJobs = (data?.jobs ?? []).filter(
    (j) => !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase()) ||
      (j.suburb ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  // Active filter chips
  type Chip = { key: string; label: string; clear: () => void };
  const chips: Chip[] = [];
  if (status !== "all")     chips.push({ key: "status",   label: STATUS_MAP[status]?.label ?? status,       clear: () => setStatus("all") });
  if (categoryId !== "all") chips.push({ key: "cat",      label: (categories ?? []).find((c) => String(c.id) === categoryId)?.name ?? "Category", clear: () => setCategoryId("all") });
  if (urgency !== "all")    chips.push({ key: "urgency",  label: URGENCY_MAP[urgency]?.label ?? urgency,    clear: () => setUrgency("all") });
  if (sortBy !== "newest")  chips.push({ key: "sort",     label: { oldest: "Oldest first", budget_high: "Budget ↓", budget_low: "Budget ↑", urgency: "Most urgent" }[sortBy] ?? sortBy, clear: () => setSortBy("newest") });

  function clearAll() {
    setStatus("all"); setCategoryId("all"); setUrgency("all"); setSortBy("newest"); setSearch(""); setTradeFilter("my_trades");
  }

  function handleClaimExpand(jobId: number) {
    if (expandedClaimJobId === jobId) { setExpandedClaimJobId(null); return; }
    setExpandedClaimJobId(jobId);
    setClaimMessage("");
    setClaimPrice("");
  }

  return (
    <div className="min-h-screen bg-[#0b0904]">
      {/* Page header */}
      <div className="border-b border-white/6 bg-[#0f0c06] py-7">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">
              {user?.role === "homeowner" ? "My Jobs" : "Browse Jobs"}
            </h1>
            <p className="text-white/40 mt-0.5 text-sm">
              {isLoading ? "Loading…" : `${filteredJobs.length} of ${data?.total ?? 0} jobs`}
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
        {/* My Trades / All Jobs tab strip — tradie only */}
        {user?.role === "tradie" && (
          <div className="flex bg-white/5 border border-white/8 rounded-xl p-1">
            {(["my_trades", "all"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setTradeFilter(f)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  tradeFilter === f
                    ? "bg-[#ffc800] text-black shadow-sm"
                    : "text-white/45 hover:text-white/70"
                }`}
              >
                {f === "my_trades" ? "⚡ My Trades" : "🌐 All Nearby Jobs"}
              </button>
            ))}
          </div>
        )}

        {/* Filter bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                placeholder="Search title, suburb…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 bg-[#130f07] border border-white/8 rounded-xl pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffc800]/40 transition-all"
              />
            </div>

            {/* Category */}
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full sm:w-40 h-10 bg-[#130f07] border-white/8 text-white/70 rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1509] border-white/10 text-white">
                <SelectItem value="all">All Categories</SelectItem>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Urgency */}
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger className="w-full sm:w-36 h-10 bg-[#130f07] border-white/8 text-white/70 rounded-xl">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1509] border-white/10 text-white">
                <SelectItem value="all">Any Urgency</SelectItem>
                <SelectItem value="emergency">🔴 Emergency</SelectItem>
                <SelectItem value="urgent">🟠 Urgent</SelectItem>
                <SelectItem value="standard">⚪ Standard</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-36 h-10 bg-[#130f07] border-white/8 text-white/70 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1509] border-white/10 text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-36 h-10 bg-[#130f07] border-white/8 text-white/70 rounded-xl">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1 opacity-50" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1509] border-white/10 text-white">
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="urgency">Most urgent</SelectItem>
                <SelectItem value="budget_high">Budget: high → low</SelectItem>
                <SelectItem value="budget_low">Budget: low → high</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filter chips */}
          <AnimatePresence>
            {chips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex flex-wrap items-center gap-2"
              >
                {chips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={chip.clear}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#ffc800]/12 text-[#ffc800] text-xs font-semibold border border-[#ffc800]/20 hover:bg-[#ffc800]/20 transition-colors"
                  >
                    {chip.label}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                <button
                  onClick={clearAll}
                  className="text-xs text-white/35 hover:text-white/60 transition-colors"
                >
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Job list */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/5" />
            ))
          ) : !filteredJobs.length ? (
            <div className="text-center py-20 text-white/35">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-semibold text-white/50 text-lg">No jobs found</p>
              <p className="text-sm mt-1 mb-5">Try adjusting your filters</p>
              {chips.length > 0 && (
                <button onClick={clearAll} className="h-9 px-5 rounded-xl bg-[#ffc800] text-black font-bold text-sm hover:bg-[#e6b800] transition-colors">
                  Clear filters
                </button>
              )}
              {user?.role === "homeowner" && (
                <Link href="/jobs/new">
                  <button className="mt-3 h-9 px-5 rounded-xl bg-white/8 text-white font-semibold text-sm hover:bg-white/12 transition-colors block mx-auto">
                    Post a job
                  </button>
                </Link>
              )}
            </div>
          ) : (
            filteredJobs.map((job) => {
              const st = STATUS_MAP[job.status] ?? STATUS_MAP.open;
              const urg = URGENCY_MAP[job.urgency] ?? URGENCY_MAP.standard;
              const UrgIcon = urg.Icon;
              const isExpanded = expandedClaimJobId === job.id;
              const canClaim = user?.role === "tradie" && ["open", "matched"].includes(job.status);

              return (
                <div
                  key={job.id}
                  className={`bg-[#130f07] border rounded-2xl overflow-hidden transition-all ${
                    job.urgency === "emergency"
                      ? "border-red-500/20 hover:border-red-500/35"
                      : "border-white/6 hover:border-[#ffc800]/20"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Title + badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Link href={`/jobs/${job.id}`}>
                            <span className="font-bold text-white hover:text-[#ffc800] cursor-pointer transition-colors text-base leading-tight">
                              {job.title}
                            </span>
                          </Link>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${urg.cls}`}>
                            <UrgIcon className="h-2.5 w-2.5" /> {urg.label}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${st.cls}`}>
                            {st.label}
                          </span>
                          {job.categoryName && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/6 text-white/40">
                              {job.categoryName}
                            </span>
                          )}
                          {user?.role === "tradie" && (
                            job.creditCost != null ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#ffc800]/10 text-[#ffc800] flex items-center gap-1">
                                <Zap className="h-2.5 w-2.5" /> {job.creditCost} credits to claim
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/6 text-white/35">
                                Credits TBD
                              </span>
                            )
                          )}
                          {user?.role === "tradie" && job.creditCost != null && (
                            <span className="text-[10px] text-white/30">
                              Sized to job scope
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-white/45 line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-white/35">
                          {(job.suburb || job.postcode) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[job.suburb, job.postcode].filter(Boolean).join(", ")}
                            </span>
                          )}
                          {job.budget && (
                            <span className="flex items-center gap-1 text-white/60 font-semibold">
                              <DollarSign className="h-3 w-3" />${job.budget.toLocaleString()} budget
                            </span>
                          )}
                          {(job.claimCount ?? 0) > 0 && (
                            <span className="text-[#ffc800]/70 font-semibold">
                              {job.claimCount} tradie{(job.claimCount ?? 0) !== 1 ? "s" : ""} responded
                            </span>
                          )}
                          <span>{timeAgo(job.createdAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Link href={`/jobs/${job.id}`}>
                          <button className="h-9 px-4 rounded-xl border border-white/12 text-white/60 hover:text-white hover:border-white/25 text-xs font-semibold transition-all flex items-center gap-1.5">
                            View <ChevronRight className="h-3 w-3" />
                          </button>
                        </Link>
                        {canClaim && (
                          <button
                            className={`h-9 px-4 rounded-xl font-bold text-xs transition-all ${
                              isExpanded
                                ? "bg-white/10 text-white/60 border border-white/10"
                                : "bg-[#ffc800] hover:bg-[#e6b800] active:scale-[0.97] text-black"
                            }`}
                            onClick={() => handleClaimExpand(job.id)}
                          >
                            {isExpanded ? <X className="h-3.5 w-3.5 mx-auto" /> : "Claim"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inline claim expansion */}
                  <AnimatePresence>
                    {isExpanded && canClaim && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-2 bg-[#0f0c06] border-t border-white/5">
                          <p className="text-xs font-semibold text-white/40 mb-3">Claim details <span className="text-white/25 font-normal">(optional)</span></p>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-white/40 block mb-1.5">Message to homeowner</label>
                              <textarea
                                className="w-full bg-[#1d1a12] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#ffc800]/50 resize-none h-20"
                                placeholder="Briefly describe your experience and approach…"
                                value={claimMessage}
                                onChange={(e) => setClaimMessage(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-white/40 block mb-1.5">
                                Proposed price (AUD)
                              </label>
                              <input
                                type="number"
                                className="w-full bg-[#1d1a12] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#ffc800]/50 h-10"
                                placeholder="e.g. 250"
                                value={claimPrice}
                                onChange={(e) => setClaimPrice(e.target.value)}
                                min="0"
                              />
                              {job.budget && (
                                <p className="text-[10px] text-white/30 mt-1">Homeowner budget: ${job.budget.toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                          {job.urgency === "emergency" && (
                            <div className="flex items-center gap-2 mt-3 bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                              <p className="text-xs text-red-400/80">Emergency job — homeowner needs urgent help. Respond fast.</p>
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-2 mt-3">
                            <button
                              className="h-9 px-4 rounded-xl bg-white/6 hover:bg-white/10 text-white text-xs font-semibold transition-colors border border-white/8"
                              onClick={() => setExpandedClaimJobId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              className="h-9 px-5 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-xs transition-all active:scale-[0.97] disabled:opacity-50"
                              disabled={claimMutation.isPending}
                              onClick={() => claimMutation.mutate({ jobId: job.id, data: { message: claimMessage || undefined, proposedPrice: claimPrice ? Number(claimPrice) : undefined } })}
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
      </div>
    </div>
  );
}
