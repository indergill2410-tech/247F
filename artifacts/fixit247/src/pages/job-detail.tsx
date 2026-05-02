import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetJob, useClaimJob, useUpdateClaim, useDeleteJob, useListJobReviews, useCreateReview } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, DollarSign, Clock, Zap, Briefcase, Star, ChevronLeft, CheckCircle, XCircle, AlertTriangle, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  open:        { label: "Open",        cls: "bg-blue-500/15 text-blue-400" },
  matched:     { label: "Matched",     cls: "bg-[#f5c518]/15 text-[#f5c518]" },
  in_progress: { label: "In Progress", cls: "bg-orange-500/15 text-orange-400" },
  completed:   { label: "Completed",   cls: "bg-emerald-500/15 text-emerald-400" },
  cancelled:   { label: "Cancelled",   cls: "bg-white/8 text-white/40" },
};
const URGENCY_MAP: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
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

const inputCls = "w-full bg-white/6 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f5c518]/50 focus:bg-white/8 transition-all";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-7 w-7 transition-colors ${s <= (hovered || value) ? "text-[#f5c518] fill-[#f5c518]" : "text-white/20"}`}
          />
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

  const claimMutation = useClaimJob({
    mutation: {
      onSuccess: () => {
        toast({ title: "Claimed!", description: "Your claim was submitted successfully." });
        setShowClaimForm(false); setClaimMessage(""); setProposedPrice("");
        refetch();
      },
      onError: (err) => {
        toast({ title: "Error", description: (err as { data?: { message?: string } })?.data?.message ?? "Failed to claim", variant: "destructive" });
      },
    },
  });

  const updateClaimMutation = useUpdateClaim({
    mutation: {
      onSuccess: () => { toast({ title: "Updated!" }); refetch(); },
      onError: (err) => {
        toast({ title: "Error", description: (err as { data?: { message?: string } })?.data?.message ?? "Failed to update", variant: "destructive" });
      },
    },
  });

  const deleteMutation = useDeleteJob({
    mutation: { onSuccess: () => { toast({ title: "Cancelled" }); setLocation("/jobs"); } },
  });

  const reviewMutation = useCreateReview({
    mutation: {
      onSuccess: () => {
        toast({ title: "Review submitted!", description: "Thank you for your feedback." });
        setShowReviewForm(false);
        setReviewRating(0);
        setReviewComment("");
        refetchReviews();
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
          <button onClick={() => setLocation("/jobs")} className="mt-4 text-[#f5c518] text-sm hover:underline">← Back to Jobs</button>
        </div>
      </div>
    );
  }

  const isOwner = user?.role === "homeowner" && job.homeownerId === user.id;
  const isTradie = user?.role === "tradie";
  const isAdmin = user?.role === "admin";
  type JobWithClaims = typeof job & { claims?: { id: number; tradieId: number; tradieName: string | null; tradieRating: number | null; tradieReviewCount: number; tradieSuburb: string | null; status: string; message: string | null; proposedPrice: number | null; createdAt: string }[] };
  const jobWithClaims = job as JobWithClaims;
  const alreadyClaimed = jobWithClaims.claims?.some((c) => c.tradieId === user?.id);
  const canClaim = isTradie && ["open", "matched"].includes(job.status) && !alreadyClaimed;
  const myAcceptedClaim = jobWithClaims.claims?.find((c) => c.tradieId === user?.id && c.status === "accepted");
  const alreadyReviewed = reviews?.some((r) => r.reviewerId === user?.id);

  const statusStyle = STATUS_MAP[job.status] ?? STATUS_MAP.cancelled;
  const urgencyStyle = URGENCY_MAP[job.urgency] ?? URGENCY_MAP.standard;
  const UrgencyIcon = urgencyStyle.Icon;

  // For tradie: revieweeId is the homeowner; for homeowner: revieweeId is the accepted tradie
  const revieweeId = isTradie
    ? job.homeownerId
    : myAcceptedClaim?.tradieId ?? jobWithClaims.claims?.find((c) => c.status === "accepted")?.tradieId;

  const canReview = job.status === "completed" && !alreadyReviewed && (isOwner || (isTradie && myAcceptedClaim));

  return (
    <div className="min-h-screen bg-[#0b0904]">
      {/* Header */}
      <div className="border-b border-white/6 bg-[#0f0c06] py-6">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6">
          <button onClick={() => setLocation("/jobs")} className="flex items-center gap-1 text-white/40 hover:text-white text-sm mb-5 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Jobs
          </button>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white leading-tight">{job.title}</h1>
              <p className="text-white/45 mt-1 text-sm">{job.categoryName}</p>
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
        {/* Job details */}
        <div className="bg-[#130f07] border border-white/6 rounded-2xl p-6 space-y-5">
          <p className="text-white/80 leading-relaxed">{job.description}</p>
          <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-white/6">
            {(job.suburb || job.postcode) && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <MapPin className="h-4 w-4 text-[#f5c518]" />
                {[job.suburb, job.postcode].filter(Boolean).join(", ")}
              </div>
            )}
            {job.budget && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <DollarSign className="h-4 w-4 text-[#f5c518]" />Budget: ${job.budget}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Calendar className="h-4 w-4 text-[#f5c518]" />
              Posted: {new Date(job.createdAt).toLocaleDateString()}
            </div>
          </div>

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
            {/* Message button for participants */}
            {(isOwner || (isTradie && alreadyClaimed)) && job.status !== "open" && (
              <button
                className="h-8 px-4 rounded-lg bg-white/6 border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-xs font-medium transition-all flex items-center gap-1.5"
                onClick={() => setLocation("/messages")}
              >
                <MessageCircle className="h-3.5 w-3.5" /> Messages
              </button>
            )}
          </div>
        </div>

        {/* Tradie claim form */}
        {canClaim && (
          <div className="bg-[#130f07] border border-[#f5c518]/20 rounded-2xl p-6">
            <h2 className="font-bold text-[#f5c518] mb-4">Claim This Job</h2>
            {!showClaimForm ? (
              <button
                className="w-full h-11 rounded-xl bg-[#f5c518] hover:bg-[#e6b800] text-black font-bold text-[15px] transition-colors"
                onClick={() => setShowClaimForm(true)}
              >
                Submit a Claim
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/65">Message to homeowner (optional)</label>
                  <textarea
                    placeholder="Tell the homeowner about your experience, availability…"
                    value={claimMessage}
                    onChange={(e) => setClaimMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f5c518]/50 transition-all resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/65">Your price estimate (optional)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                    <input
                      type="number"
                      className={`${inputCls} h-11 pl-7`}
                      placeholder="0"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    className="h-10 px-6 rounded-xl bg-[#f5c518] hover:bg-[#e6b800] text-black font-bold text-sm transition-colors disabled:opacity-50"
                    disabled={claimMutation.isPending}
                    onClick={() => claimMutation.mutate({ jobId: job.id, data: { message: claimMessage || undefined, proposedPrice: proposedPrice ? Number(proposedPrice) : undefined } })}
                  >
                    {claimMutation.isPending ? "Submitting…" : "Submit Claim"}
                  </button>
                  <button
                    className="h-10 px-6 rounded-xl border border-white/12 text-white/60 hover:text-white hover:border-white/25 text-sm transition-all"
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
          <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 text-emerald-400">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium text-sm">You've already claimed this job. Waiting for homeowner response.</span>
          </div>
        )}

        {/* Claims list */}
        {(isOwner || isAdmin) && jobWithClaims.claims && (
          <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/6">
              <h2 className="font-bold text-white">Claims ({jobWithClaims.claims.length})</h2>
            </div>
            <div className="divide-y divide-white/5">
              {!jobWithClaims.claims.length ? (
                <p className="text-white/35 text-center py-8 text-sm">No claims yet. Your job is being matched.</p>
              ) : (
                jobWithClaims.claims.map((claim) => (
                  <motion.div key={claim.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#f5c518] text-black font-black text-sm flex items-center justify-center flex-shrink-0">
                          {claim.tradieName?.charAt(0) ?? "T"}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{claim.tradieName ?? "Tradie"}</p>
                          <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                            {claim.tradieRating && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-[#f5c518] fill-[#f5c518]" />
                                {claim.tradieRating}
                                {(claim.tradieReviewCount ?? 0) > 0 && ` (${claim.tradieReviewCount})`}
                              </span>
                            )}
                            {claim.tradieSuburb && (
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{claim.tradieSuburb}</span>
                            )}
                          </div>
                          {claim.message && <p className="text-sm mt-2 text-white/55">{claim.message}</p>}
                          {claim.proposedPrice && (
                            <p className="text-sm font-semibold mt-1 text-[#f5c518] flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />Quoted: ${claim.proposedPrice}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md capitalize ${CLAIM_STATUS[claim.status] ?? "bg-white/8 text-white/40"}`}>
                          {claim.status}
                        </span>
                        {claim.status === "pending" && isOwner && (
                          <div className="flex gap-2">
                            <button
                              className="h-7 px-3 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                              onClick={() => updateClaimMutation.mutate({ jobId: job.id, claimId: claim.id, data: { status: "accepted" } })}
                              disabled={updateClaimMutation.isPending}
                            >
                              <CheckCircle className="h-3 w-3" /> Accept
                            </button>
                            <button
                              className="h-7 px-3 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                              onClick={() => updateClaimMutation.mutate({ jobId: job.id, claimId: claim.id, data: { status: "rejected" } })}
                              disabled={updateClaimMutation.isPending}
                            >
                              <XCircle className="h-3 w-3" /> Reject
                            </button>
                          </div>
                        )}
                        {claim.status === "accepted" && isOwner && job.status === "in_progress" && (
                          <button
                            className="h-7 px-3 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                            onClick={() => updateClaimMutation.mutate({ jobId: job.id, claimId: claim.id, data: { status: "completed" } })}
                            disabled={updateClaimMutation.isPending}
                          >
                            <CheckCircle className="h-3 w-3" /> Mark Done
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Reviews section */}
        {(reviews && reviews.length > 0 || canReview) && (
          <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
              <h2 className="font-bold text-white">Reviews {reviews?.length ? `(${reviews.length})` : ""}</h2>
              {canReview && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="text-[#f5c518] text-xs font-semibold hover:underline"
                >
                  + Leave a Review
                </button>
              )}
            </div>

            {/* Review form */}
            {showReviewForm && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-5 border-b border-white/5">
                <p className="text-sm font-medium text-white/65 mb-3">Rate your experience</p>
                <StarRating value={reviewRating} onChange={setReviewRating} />
                <textarea
                  placeholder="Share details about your experience (optional)"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full mt-4 bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f5c518]/50 transition-all resize-none"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    className="h-9 px-5 rounded-xl bg-[#f5c518] hover:bg-[#e6b800] text-black font-bold text-sm transition-colors disabled:opacity-50"
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
                    className="h-9 px-5 rounded-xl border border-white/12 text-white/55 hover:text-white text-sm transition-all"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* Existing reviews */}
            <div className="divide-y divide-white/5">
              {reviews?.map((review) => (
                <div key={review.id} className="px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {(review.reviewerName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-white text-sm">{review.reviewerName ?? "Anonymous"}</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "text-[#f5c518] fill-[#f5c518]" : "text-white/15"}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-white/55 mt-1.5 leading-relaxed">{review.comment}</p>}
                      <p className="text-[10px] text-white/25 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
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
