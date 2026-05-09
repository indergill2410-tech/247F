import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetJob, useClaimJob, useUpdateClaim, useDeleteJob, useListJobReviews, useCreateReview, useGetTradieTrustCard, getGetTradieTrustCardQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Calendar, DollarSign, Clock, Zap, Briefcase, Star,
  ChevronLeft, CheckCircle, XCircle, AlertTriangle, MessageCircle,
  ThumbsUp, Award, User, ShieldCheck, Mail, Phone, Users,
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
const CLAIM_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-[#ffc800]/15 text-[#ffc800]" },
  accepted:  { label: "Accepted",  cls: "bg-emerald-500/15 text-emerald-400" },
  rejected:  { label: "Rejected",  cls: "bg-red-500/15 text-red-400" },
  withdrawn: { label: "Withdrawn", cls: "bg-white/8 text-white/40" },
  completed: { label: "Done",      cls: "bg-blue-500/15 text-blue-400" },
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
  const wks = Math.floor(days / 7);
  if (wks < 5) return `${wks}w ago`;
  return new Date(date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string | null | undefined): string {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = rating >= s;
        const half = !filled && rating > s - 1;
        return (
          <span key={s} className="relative inline-block">
            <Star className={`${cls} text-white/15`} />
            {(filled || half) && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: filled ? "100%" : "50%" }}>
                <Star className={`${cls} fill-[#ffc800] text-[#ffc800]`} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star className={`h-8 w-8 transition-colors ${s <= (hovered || value) ? "text-[#ffc800] fill-[#ffc800]" : "text-white/15"}`} />
        </button>
      ))}
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [claimMessage, setClaimMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: job, isLoading, refetch } = useGetJob(Number(id));
  const { data: reviews, refetch: refetchReviews } = useListJobReviews(Number(id));
  const { data: trustCard } = useGetTradieTrustCard(Number(id), {
    query: {
      enabled: !!(user?.role === "homeowner" || user?.role === "admin") && !!id,
      retry: false,
      queryKey: getGetTradieTrustCardQueryKey(Number(id)),
    },
  });

  const claimMutation = useClaimJob({
    mutation: {
      onSuccess: () => {
        toast({ title: "Claimed!", description: "Your claim was submitted successfully." });
        setShowClaimForm(false); setClaimMessage(""); setProposedPrice("");
        refetch();
      },
      onError: (err) => {
        const errData = err as { data?: { message?: string; error?: string; balanceCents?: number; requiredCents?: number } };
        const msg = errData?.data?.error === "insufficient_funds"
          ? `Insufficient wallet balance — ${errData.data?.message ?? "top up at Wallet."}`
          : (errData?.data?.message ?? "Failed to claim");
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  const updateClaimMutation = useUpdateClaim({
    mutation: {
      onSuccess: (_, vars) => {
        const status = (vars.data as { status?: string })?.status;
        const msg = status === "accepted" ? "Tradie accepted!" : status === "completed" ? "Job marked complete!" : "Updated!";
        toast({ title: msg });
        refetch();
      },
      onError: (err) => {
        toast({ title: "Error", description: (err as { data?: { message?: string } })?.data?.message ?? "Failed to update", variant: "destructive" });
      },
    },
  });

  const deleteMutation = useDeleteJob({
    mutation: {
      onSuccess: () => { toast({ title: "Job cancelled" }); setLocation("/jobs"); },
    },
  });

  const reviewMutation = useCreateReview({
    mutation: {
      onSuccess: () => {
        toast({ title: "Review submitted!", description: "Thank you for your feedback." });
        setShowReviewForm(false);
        setReviewRating(0);
        setReviewComment("");
        refetchReviews();
        refetch();
      },
      onError: (err) => {
        toast({ title: "Error", description: (err as { data?: { message?: string } })?.data?.message ?? "Failed to submit review", variant: "destructive" });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0904] container max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-48 bg-white/8" />
        <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />
        <Skeleton className="h-64 w-full rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0b0904] flex items-center justify-center text-center">
        <div className="text-white/35">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold text-white/50">Job not found</p>
          <button onClick={() => setLocation("/jobs")} className="mt-4 text-[#ffc800] text-sm hover:underline">← Back to Jobs</button>
        </div>
      </div>
    );
  }

  const isOwner = user?.role === "homeowner" && job.homeownerId === user.id;
  const isTradie = user?.role === "tradie";
  const isAdmin = user?.role === "admin";

  type Claim = {
    id: number; tradieId: number; tradieName: string | null;
    tradieRating: number | null; tradieReviewCount: number;
    tradieSuburb: string | null; tradieAvatarUrl?: string | null;
    tradieBio?: string | null; tradieIsVerified?: boolean | null;
    tradiePrimaryTrade?: string | null; tradieWorkPhotoUrls?: string[] | null;
    status: string;
    message: string | null; proposedPrice: number | null; createdAt: string;
    tradieEmail?: string | null; tradiePhone?: string | null;
  };
  type JobWithClaims = typeof job & {
    claims?: Claim[];
    homeownerEmail?: string | null;
    homeownerPhone?: string | null;
  };
  const jobWithClaims = job as JobWithClaims;
  const claims = jobWithClaims.claims ?? [];

  const alreadyClaimed = claims.some((c) => c.tradieId === user?.id);
  const canClaim = isTradie && ["open", "matched"].includes(job.status) && !alreadyClaimed;
  const myAcceptedClaim = claims.find((c) => c.tradieId === user?.id && c.status === "accepted");
  const acceptedClaim = claims.find((c) => c.status === "accepted");
  const alreadyReviewed = reviews?.some((r) => r.reviewerId === user?.id);
  const canReview = job.status === "completed" && !alreadyReviewed && (isOwner || (isTradie && !!myAcceptedClaim));
  const canMarkComplete = isOwner && job.status === "in_progress" && !!acceptedClaim;

  // Who is being reviewed
  const revieweeId = isTradie
    ? job.homeownerId
    : acceptedClaim?.tradieId;
  const revieweeName = isTradie
    ? (job.homeownerName ?? "Homeowner")
    : (acceptedClaim?.tradieName ?? "Tradie");

  const statusStyle  = STATUS_MAP[job.status]   ?? STATUS_MAP.cancelled;
  const urgencyStyle = URGENCY_MAP[job.urgency] ?? URGENCY_MAP.standard;
  const UrgencyIcon  = urgencyStyle.Icon;

  return (
    <div className="min-h-screen bg-[#0b0904]">
      {/* Page header */}
      <div className="border-b border-white/6 bg-[#0f0c06] py-6">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => setLocation(isTradie ? "/jobs" : "/dashboard/homeowner")}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-5 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {isTradie ? "Browse Jobs" : "My Dashboard"}
          </button>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white leading-tight">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-white/40">
                {job.categoryName && <span>{job.categoryName}</span>}
                <span>·</span>
                <span>Posted {timeAgo(job.createdAt)}</span>
                {claims.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-[#ffc800]/70 font-semibold">{claims.length} tradie{claims.length !== 1 ? "s" : ""} responded</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${statusStyle.cls}`}>{statusStyle.label}</span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ${urgencyStyle.cls}`}>
                <UrgencyIcon className="h-3 w-3" />{urgencyStyle.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── MARK JOB COMPLETE BANNER (in_progress + owner) ── */}
        {canMarkComplete && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/8 border border-emerald-500/25 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Has {acceptedClaim?.tradieName?.split(" ")[0] ?? "your tradie"} finished the work?</p>
                <p className="text-xs text-white/40 mt-0.5">Marking it complete releases the job and lets you leave a review.</p>
              </div>
            </div>
            <button
              className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-colors disabled:opacity-50 flex-shrink-0 flex items-center gap-2"
              disabled={updateClaimMutation.isPending}
              onClick={() => updateClaimMutation.mutate({ jobId: job.id, claimId: acceptedClaim!.id, data: { status: "completed" } })}
            >
              <ThumbsUp className="h-4 w-4" /> Mark Complete
            </button>
          </motion.div>
        )}

        {/* ── REVIEW PROMPT BANNER (completed + unreviewed) ── */}
        {canReview && !showReviewForm && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#ffc800]/6 border border-[#ffc800]/25 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-xl bg-[#ffc800]/12 flex items-center justify-center flex-shrink-0">
                <Award className="h-5 w-5 text-[#ffc800]" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">
                  How was {revieweeName?.split(" ")[0] ?? (isTradie ? "the homeowner" : "the tradie")}?
                </p>
                <p className="text-xs text-white/40 mt-0.5">Leave a rating — it helps the community.</p>
              </div>
            </div>
            <button
              className="h-10 px-5 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-sm transition-colors flex-shrink-0 flex items-center gap-2 active:scale-[0.97]"
              onClick={() => setShowReviewForm(true)}
            >
              <Star className="h-4 w-4" /> Rate {revieweeName?.split(" ")[0] ?? "them"}
            </button>
          </motion.div>
        )}

        {/* ── REVIEW FORM (expanded) ── */}
        <AnimatePresence>
          {showReviewForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#130f07] border border-[#ffc800]/25 rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-white/6 flex items-center gap-2">
                <Award className="h-4 w-4 text-[#ffc800]" />
                <h2 className="font-bold text-white">Rate your experience with {revieweeName}</h2>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div>
                  <p className="text-sm text-white/50 mb-3">Select a rating</p>
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                  {reviewRating > 0 && (
                    <p className="text-xs text-[#ffc800] mt-2">
                      {["", "Poor", "Fair", "Good", "Very Good", "Excellent!"][reviewRating]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-white/50 block mb-2">Comments <span className="text-white/25">(optional)</span></label>
                  <textarea
                    placeholder={`Share details about your experience with ${revieweeName?.split(" ")[0]}…`}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#ffc800]/50 transition-all resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    className="h-10 px-6 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-sm transition-colors disabled:opacity-50 active:scale-[0.97]"
                    disabled={reviewRating === 0 || reviewMutation.isPending}
                    onClick={() =>
                      reviewMutation.mutate({
                        jobId: job.id,
                        data: { revieweeId: revieweeId!, rating: reviewRating, comment: reviewComment || undefined },
                      })
                    }
                  >
                    {reviewMutation.isPending ? "Submitting…" : "Submit Review"}
                  </button>
                  <button
                    className="h-10 px-6 rounded-xl border border-white/12 text-white/55 hover:text-white text-sm transition-all"
                    onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewComment(""); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── JOB DETAILS CARD ── */}
        <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-5">
          <p className="text-white/80 leading-relaxed">{job.description}</p>

          <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-white/6">
            {(job.suburb || job.postcode) && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <MapPin className="h-4 w-4 text-[#ffc800] flex-shrink-0" />
                {[job.suburb, job.postcode].filter(Boolean).join(", ")}
              </div>
            )}
            {job.budget && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <DollarSign className="h-4 w-4 text-[#ffc800] flex-shrink-0" />
                Budget: <span className="text-white/70 font-semibold">${job.budget.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Calendar className="h-4 w-4 text-[#ffc800] flex-shrink-0" />
              Posted {timeAgo(job.createdAt)}
            </div>
            {job.scheduledFor && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Clock className="h-4 w-4 text-[#ffc800] flex-shrink-0" />
                Scheduled: {new Date(job.scheduledFor).toLocaleDateString("en-AU")}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-white/6">
            {(isOwner || isAdmin) && job.status === "open" && (
              <button
                className="h-8 px-4 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-all disabled:opacity-50"
                onClick={() => deleteMutation.mutate({ id: job.id })}
                disabled={deleteMutation.isPending}
              >
                Cancel Job
              </button>
            )}
            {(isOwner || (isTradie && alreadyClaimed)) && job.status !== "open" && (
              <button
                className="h-8 px-4 rounded-lg bg-white/6 border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-xs font-medium transition-all flex items-center gap-1.5"
                onClick={() => setLocation("/conversations")}
              >
                <MessageCircle className="h-3.5 w-3.5" /> Messages
              </button>
            )}
          </div>
        </div>

        {/* ── TRADIE: CLAIM FORM ── */}
        {canClaim && (
          <div className="bg-[#130f07] border border-[#ffc800]/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/6 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#ffc800]" />
              <h2 className="font-bold text-[#ffc800]">Claim This Job</h2>
            </div>
            {!showClaimForm ? (
              <div className="p-6">
                <p className="text-sm text-white/45 mb-4">Submit a claim to let the homeowner know you're available and interested.</p>
                <button
                  className="w-full h-11 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-[15px] transition-colors active:scale-[0.98]"
                  onClick={() => setShowClaimForm(true)}
                >
                  Submit a Claim
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-4">
                {job.urgency === "emergency" && (
                  <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3">
                    <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400/80">Emergency job — respond fast, homeowner needs urgent help.</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/60">Message to homeowner <span className="text-white/30">(optional)</span></label>
                  <textarea
                    placeholder="Describe your experience, availability, and approach…"
                    value={claimMessage}
                    onChange={(e) => setClaimMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#ffc800]/50 transition-all resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/60">Price estimate <span className="text-white/30">(optional)</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                    <input
                      type="number"
                      className="w-full bg-white/6 border border-white/10 rounded-xl px-4 pl-7 h-11 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#ffc800]/50 transition-all"
                      placeholder={job.budget ? `Homeowner budget: $${job.budget.toLocaleString()}` : "0"}
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    className="h-10 px-6 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] text-black font-bold text-sm transition-colors disabled:opacity-50 active:scale-[0.97]"
                    disabled={claimMutation.isPending}
                    onClick={() => claimMutation.mutate({ jobId: job.id, data: { message: claimMessage || undefined, proposedPrice: proposedPrice ? Number(proposedPrice) : undefined } })}
                  >
                    {claimMutation.isPending ? "Submitting…" : "Submit Claim"}
                  </button>
                  <button
                    className="h-10 px-6 rounded-xl border border-white/12 text-white/55 hover:text-white text-sm transition-all"
                    onClick={() => setShowClaimForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {alreadyClaimed && !canClaim && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${myAcceptedClaim ? "bg-emerald-500/8 border border-emerald-500/20 text-emerald-400" : "bg-white/4 border border-white/8 text-white/50"}`}>
            {myAcceptedClaim
              ? <><CheckCircle className="h-5 w-5 flex-shrink-0" /><span className="font-semibold text-sm">Your claim was accepted! Get in touch with the homeowner.</span></>
              : <><User className="h-5 w-5 flex-shrink-0" /><span className="text-sm">You've claimed this job. Waiting for the homeowner's response.</span></>
            }
          </div>
        )}

        {/* ── HOMEOWNER CONTACT (tradie view — revealed once tradie has claimed) ── */}
        {isTradie && alreadyClaimed && (jobWithClaims.homeownerEmail || jobWithClaims.homeownerPhone) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#130f07] border border-[#ffc800]/20 rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/6 flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#ffc800]" />
              <h2 className="font-bold text-white">Homeowner Contact</h2>
              <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-xl bg-[#ffc800]/12 text-[#ffc800] border border-[#ffc800]/20">
                Revealed on Claim
              </span>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-white/50">
                Contact <span className="text-white/70 font-semibold">{job.homeownerName ?? "the homeowner"}</span> directly about this job.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {jobWithClaims.homeownerEmail && (
                  <a
                    href={`mailto:${jobWithClaims.homeownerEmail}`}
                    className="flex items-center gap-2.5 bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <Mail className="h-4 w-4 text-[#ffc800] flex-shrink-0" />
                    {jobWithClaims.homeownerEmail}
                  </a>
                )}
                {jobWithClaims.homeownerPhone && (
                  <a
                    href={`tel:${jobWithClaims.homeownerPhone}`}
                    className="flex items-center gap-2.5 bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <Phone className="h-4 w-4 text-[#ffc800] flex-shrink-0" />
                    {jobWithClaims.homeownerPhone}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TRADIE TRUST CARD (homeowner view — open/matched) ── */}
        {(isOwner || isAdmin) && trustCard && ["open", "matched"].includes(job.status) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#130f07] border border-[#ffc800]/20 rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/6 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#ffc800]" />
              <h2 className="font-bold text-[#ffc800]">Responding Tradie</h2>
              {trustCard.isVerified && (
                <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <div className="p-6 space-y-4">
              {/* Tradie header */}
              <div className="flex items-start gap-4">
                {trustCard.avatarUrl ? (
                  <img src={trustCard.avatarUrl} alt={trustCard.displayName} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#ffc800]/15 text-[#ffc800] font-black text-xl flex items-center justify-center flex-shrink-0">
                    {initials(trustCard.displayName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-white text-lg leading-none">{trustCard.displayName}</p>
                    {trustCard.primaryTrade && (
                      <span className="text-[10px] font-black bg-[#ffc800] text-black px-2 py-0.5 rounded-md">
                        {trustCard.primaryTrade}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45 mt-1.5">
                    {trustCard.rating != null && (
                      <span className="flex items-center gap-1.5">
                        <StarDisplay rating={trustCard.rating} />
                        <span className="text-[#ffc800] font-semibold">{trustCard.rating.toFixed(1)}</span>
                        <span>({trustCard.reviewCount} review{trustCard.reviewCount !== 1 ? "s" : ""})</span>
                      </span>
                    )}
                    {trustCard.suburb && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{trustCard.suburb}</span>
                    )}
                  </div>
                  {(trustCard.secondaryTrades ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(trustCard.secondaryTrades ?? []).map((t) => (
                        <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#ffc800]/10 border border-[#ffc800]/20 text-[#ffc800]">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quote details */}
              {(trustCard.message || trustCard.proposedPrice != null) && (
                <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-2">
                  {trustCard.proposedPrice != null && (
                    <p className="text-sm font-black text-[#ffc800] flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" /> Quote: ${trustCard.proposedPrice.toLocaleString()}
                    </p>
                  )}
                  {trustCard.message && (
                    <p className="text-sm text-white/55 italic leading-relaxed">"{trustCard.message}"</p>
                  )}
                </div>
              )}

              {/* Recent reviews */}
              {(trustCard.recentReviews ?? []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Recent Reviews</p>
                  <div className="space-y-2">
                    {(trustCard.recentReviews ?? []).map((rev) => (
                      <div key={rev.id} className="bg-white/3 border border-white/6 rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold text-white/70">{(rev as { reviewerName?: string | null }).reviewerName ?? "Anonymous"}</p>
                          <StarDisplay rating={rev.rating} />
                        </div>
                        {rev.comment && <p className="text-xs text-white/45 leading-relaxed">{rev.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy message strip */}
              {isOwner && (
                <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-white/30 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/40 leading-relaxed">
                    You'll see <span className="text-white/60 font-semibold">{trustCard.displayName}'s</span> full contact details and business information once you accept their quote.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── HIRED TRADIE FULL DETAILS (homeowner view — in_progress/completed) ── */}
        {isOwner && acceptedClaim && ["in_progress", "completed"].includes(job.status) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#130f07] border border-emerald-500/20 rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/6 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h2 className="font-bold text-white">Your Hired Tradie</h2>
              <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                Full Details Unlocked
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 font-black text-xl flex items-center justify-center flex-shrink-0">
                  {initials(acceptedClaim.tradieName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-lg">{acceptedClaim.tradieName ?? "Tradie"}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                    {acceptedClaim.tradieRating != null && (
                      <span className="flex items-center gap-1.5 text-xs text-white/50">
                        <StarDisplay rating={acceptedClaim.tradieRating} />
                        <span className="text-[#ffc800] font-semibold">{acceptedClaim.tradieRating.toFixed(1)}</span>
                      </span>
                    )}
                    {acceptedClaim.tradieSuburb && (
                      <span className="flex items-center gap-1 text-xs text-white/50">
                        <MapPin className="h-3 w-3" />{acceptedClaim.tradieSuburb}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {(acceptedClaim as { tradieEmail?: string | null }).tradieEmail && (
                  <a
                    href={`mailto:${(acceptedClaim as { tradieEmail?: string | null }).tradieEmail}`}
                    className="flex items-center gap-2.5 bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <Mail className="h-4 w-4 text-[#ffc800] flex-shrink-0" />
                    {(acceptedClaim as { tradieEmail?: string | null }).tradieEmail}
                  </a>
                )}
                {(acceptedClaim as { tradiePhone?: string | null }).tradiePhone && (
                  <a
                    href={`tel:${(acceptedClaim as { tradiePhone?: string | null }).tradiePhone}`}
                    className="flex items-center gap-2.5 bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <Phone className="h-4 w-4 text-[#ffc800] flex-shrink-0" />
                    {(acceptedClaim as { tradiePhone?: string | null }).tradiePhone}
                  </a>
                )}
                {!(acceptedClaim as { tradieEmail?: string | null }).tradieEmail && !(acceptedClaim as { tradiePhone?: string | null }).tradiePhone && (
                  <p className="text-sm text-white/30 col-span-2">Contact details not available yet. Message the tradie directly.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── WHO'S QUOTING PANEL (homeowner + admin) ── */}
        {(isOwner || isAdmin) && (
          <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/6 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#ffc800]" />
              <h2 className="font-bold text-white">Who's Quoting</h2>
              {claims.length > 0 && (
                <span className="text-[10px] font-bold bg-[#ffc800] text-black px-2 py-0.5 rounded-full ml-1">
                  {claims.length}
                </span>
              )}
              {claims.length > 0 && (
                <span className="ml-auto text-[10px] text-white/30">Contact details visible for all quotes</span>
              )}
            </div>
            <div className="divide-y divide-white/5">
              {!claims.length ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-white/35 text-sm">No tradies have quoted yet.</p>
                  <p className="text-white/20 text-xs mt-1">Our matching engine will notify relevant tradies by email.</p>
                </div>
              ) : (
                claims.map((claim) => {
                  const cs = CLAIM_STATUS[claim.status] ?? { label: claim.status, cls: "bg-white/8 text-white/40" };
                  return (
                    <motion.div key={claim.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
                      {/* Tradie header */}
                      <div className="flex items-start gap-4">
                        {claim.tradieAvatarUrl ? (
                          <img
                            src={claim.tradieAvatarUrl}
                            alt={claim.tradieName ?? ""}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#ffc800]/15 text-[#ffc800] font-black text-sm flex items-center justify-center flex-shrink-0 select-none">
                            {initials(claim.tradieName)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-white">{claim.tradieName ?? "Tradie"}</p>
                            {claim.tradiePrimaryTrade && (
                              <span className="text-[10px] font-black bg-[#ffc800] text-black px-2 py-0.5 rounded-md">
                                {claim.tradiePrimaryTrade}
                              </span>
                            )}
                            {claim.tradieIsVerified && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Verified
                              </span>
                            )}
                            <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-md ${cs.cls}`}>{cs.label}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40 mt-1">
                            {claim.tradieRating != null && (
                              <span className="flex items-center gap-1.5">
                                <StarDisplay rating={claim.tradieRating} />
                                <span className="text-[#ffc800] font-semibold">{claim.tradieRating.toFixed(1)}</span>
                                {(claim.tradieReviewCount ?? 0) > 0 && (
                                  <span>({claim.tradieReviewCount})</span>
                                )}
                              </span>
                            )}
                            {claim.tradieSuburb && (
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{claim.tradieSuburb}</span>
                            )}
                            <span>{timeAgo(claim.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {claim.tradieBio && (
                        <p className="text-sm text-white/45 mt-3 leading-relaxed line-clamp-2">{claim.tradieBio}</p>
                      )}

                      {/* Work photos */}
                      {(claim.tradieWorkPhotoUrls ?? []).length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                          {(claim.tradieWorkPhotoUrls ?? []).slice(0, 3).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Work sample ${i + 1}`}
                              className="h-16 w-16 rounded-lg object-cover flex-shrink-0 border border-white/8"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Quote details */}
                      {(claim.message || claim.proposedPrice != null) && (
                        <div className="mt-3 bg-white/4 border border-white/8 rounded-xl p-3 space-y-1.5">
                          {claim.proposedPrice != null && (
                            <p className="text-sm font-black text-[#ffc800] flex items-center gap-1.5">
                              <DollarSign className="h-4 w-4" /> Quoted: ${claim.proposedPrice.toLocaleString()}
                            </p>
                          )}
                          {claim.message && (
                            <p className="text-sm text-white/55 italic leading-relaxed">"{claim.message}"</p>
                          )}
                        </div>
                      )}

                      {/* Contact + accept/reject actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {claim.tradieEmail && (
                          <a
                            href={`mailto:${claim.tradieEmail}`}
                            className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-xs text-white/60 hover:text-white transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5 text-[#ffc800]" />
                            {claim.tradieEmail}
                          </a>
                        )}
                        {claim.tradiePhone && (
                          <a
                            href={`tel:${claim.tradiePhone}`}
                            className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-xs text-white/60 hover:text-white transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5 text-[#ffc800]" />
                            {claim.tradiePhone}
                          </a>
                        )}
                        {claim.status === "pending" && isOwner && (
                          <div className="flex gap-2 ml-auto">
                            <button
                              className="h-8 px-4 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                              onClick={() => updateClaimMutation.mutate({ jobId: job.id, claimId: claim.id, data: { status: "accepted" } })}
                              disabled={updateClaimMutation.isPending}
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Accept
                            </button>
                            <button
                              className="h-8 px-4 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                              onClick={() => updateClaimMutation.mutate({ jobId: job.id, claimId: claim.id, data: { status: "rejected" } })}
                              disabled={updateClaimMutation.isPending}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── REVIEWS ── */}
        {(reviews && reviews.length > 0) && (
          <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/6">
              <h2 className="font-bold text-white">Reviews ({reviews.length})</h2>
            </div>
            <div className="divide-y divide-white/5">
              {reviews.map((review) => (
                <div key={review.id} className="px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {initials(review.reviewerName)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-white text-sm">{review.reviewerName ?? "Anonymous"}</p>
                          {review.revieweeName && (
                            <p className="text-[10px] text-white/30 mt-0.5">reviewing {review.revieweeName}</p>
                          )}
                        </div>
                        <StarDisplay rating={review.rating} size="md" />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-white/55 mt-2 leading-relaxed">{review.comment}</p>
                      )}
                      <p className="text-[10px] text-white/25 mt-2">{timeAgo(review.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
