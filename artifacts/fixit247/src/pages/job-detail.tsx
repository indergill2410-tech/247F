import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useGetJob,
  useClaimJob,
  useUpdateClaim,
  useDeleteJob,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Calendar, DollarSign, Clock, Zap, Briefcase, Star, ChevronLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-blue-100 text-blue-800" },
    matched: { label: "Matched", className: "bg-yellow-100 text-yellow-800" },
    in_progress: { label: "In Progress", className: "bg-orange-100 text-orange-800" },
    completed: { label: "Completed", className: "bg-green-100 text-green-800" },
    cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600" },
  };
  const s = map[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return <Badge className={`${s.className} border-none font-medium px-3 py-1`}>{s.label}</Badge>;
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    emergency: { label: "Emergency", className: "bg-red-100 text-red-700 border-red-200", icon: Zap },
    urgent: { label: "Urgent", className: "bg-orange-100 text-orange-700 border-orange-200", icon: Clock },
    standard: { label: "Standard", className: "bg-gray-100 text-gray-600 border-gray-200", icon: Briefcase },
  };
  const s = map[urgency] ?? map.standard;
  const Icon = s.icon;
  return (
    <Badge className={`${s.className} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />{s.label}
    </Badge>
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

  const { data: job, isLoading, refetch } = useGetJob(Number(id));

  const claimMutation = useClaimJob({
    mutation: {
      onSuccess: () => {
        toast({ title: "Claimed!", description: "Your claim was submitted successfully." });
        setShowClaimForm(false);
        setClaimMessage("");
        setProposedPrice("");
        refetch();
      },
      onError: (err) => {
        const msg = (err as { data?: { message?: string } })?.data?.message ?? "Failed to claim";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  const updateClaimMutation = useUpdateClaim({
    mutation: {
      onSuccess: () => {
        toast({ title: "Updated!", description: "Claim status updated." });
        refetch();
      },
      onError: (err) => {
        const msg = (err as { data?: { message?: string } })?.data?.message ?? "Failed to update claim";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  const deleteMutation = useDeleteJob({
    mutation: {
      onSuccess: () => {
        toast({ title: "Cancelled", description: "Job has been cancelled." });
        setLocation("/jobs");
      },
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container max-w-3xl py-16 text-center text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Job not found</p>
        <Button variant="link" onClick={() => setLocation("/jobs")} className="mt-2">← Back to Jobs</Button>
      </div>
    );
  }

  const isOwner = user?.role === "homeowner" && job.homeownerId === user.userId;
  const isTradie = user?.role === "tradie";
  const isAdmin = user?.role === "admin";
  const alreadyClaimed = (job as typeof job & { claims?: { tradieId: number }[] }).claims?.some(
    (c) => c.tradieId === user?.userId
  );
  const canClaim = isTradie && ["open", "matched"].includes(job.status) && !alreadyClaimed;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-[hsl(222,47%,11%)] text-white px-6 py-6">
        <div className="container max-w-3xl">
          <button onClick={() => setLocation("/jobs")} className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Jobs
          </button>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-tight">{job.title}</h1>
              <p className="text-white/70 mt-1">{job.categoryName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={job.status} />
              <UrgencyBadge urgency={job.urgency} />
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl py-6 space-y-6">
        {/* Job details */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-foreground leading-relaxed">{job.description}</p>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {(job.suburb || job.postcode) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-[hsl(38,92%,50%)]" />
                  <span>{[job.suburb, job.postcode].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {job.budget && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 text-[hsl(38,92%,50%)]" />
                  <span>Budget: ${job.budget}</span>
                </div>
              )}
              {job.scheduledFor && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-[hsl(38,92%,50%)]" />
                  <span>Scheduled: {new Date(job.scheduledFor).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-[hsl(38,92%,50%)]" />
                <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {/* Owner actions */}
            {(isOwner || isAdmin) && job.status === "open" && (
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => deleteMutation.mutate({ id: job.id })}
                  disabled={deleteMutation.isPending}
                >
                  Cancel Job
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claim form for tradies */}
        {canClaim && (
          <Card className="border-[hsl(38,92%,50%)]">
            <CardHeader>
              <CardTitle className="text-lg text-[hsl(38,92%,50%)]">Claim This Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showClaimForm ? (
                <Button
                  className="bg-[hsl(38,92%,50%)] text-white hover:bg-[hsl(38,92%,44%)] w-full"
                  onClick={() => setShowClaimForm(true)}
                >
                  Submit a Claim
                </Button>
              ) : (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Message to homeowner (optional)</Label>
                    <Textarea
                      placeholder="Tell the homeowner about your experience, availability…"
                      value={claimMessage}
                      onChange={(e) => setClaimMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Your price estimate (optional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        className="pl-7"
                        placeholder="0"
                        value={proposedPrice}
                        onChange={(e) => setProposedPrice(e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="bg-[hsl(38,92%,50%)] text-white hover:bg-[hsl(38,92%,44%)]"
                      disabled={claimMutation.isPending}
                      onClick={() =>
                        claimMutation.mutate({
                          jobId: job.id,
                          data: {
                            message: claimMessage || undefined,
                            proposedPrice: proposedPrice ? Number(proposedPrice) : undefined,
                          },
                        })
                      }
                    >
                      {claimMutation.isPending ? "Submitting…" : "Submit Claim"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowClaimForm(false)}>Cancel</Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}

        {alreadyClaimed && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4 pb-4 flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">You've already claimed this job. Waiting for homeowner response.</span>
            </CardContent>
          </Card>
        )}

        {/* Claims list */}
        {(isOwner || isAdmin) && (job as typeof job & { claims?: unknown[] }).claims && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Claims ({(job as typeof job & { claims?: unknown[] }).claims?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!(job as typeof job & { claims?: unknown[] }).claims?.length ? (
                <p className="text-muted-foreground text-center py-4">No claims yet. Your job is being matched.</p>
              ) : (
                (job as typeof job & { claims?: { id: number; tradieId: number; tradieName: string | null; tradieRating: number | null; tradieReviewCount: number; tradieSuburb: string | null; status: string; message: string | null; proposedPrice: number | null; createdAt: string }[] }).claims?.map((claim) => (
                  <motion.div key={claim.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="bg-[hsl(222,47%,11%)] text-white text-sm">
                            {claim.tradieName?.charAt(0) ?? "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{claim.tradieName ?? "Tradie"}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {claim.tradieRating && (
                              <span className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                {claim.tradieRating}
                                {claim.tradieReviewCount > 0 && ` (${claim.tradieReviewCount})`}
                              </span>
                            )}
                            {claim.tradieSuburb && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{claim.tradieSuburb}
                              </span>
                            )}
                          </div>
                          {claim.message && <p className="text-sm mt-2 text-muted-foreground">{claim.message}</p>}
                          {claim.proposedPrice && (
                            <p className="text-sm font-medium mt-1 text-foreground flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />Quoted: ${claim.proposedPrice}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`border-none capitalize text-xs ${
                          claim.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          claim.status === "accepted" ? "bg-green-100 text-green-800" :
                          claim.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{claim.status}</Badge>
                        {claim.status === "pending" && isOwner && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-7 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => updateClaimMutation.mutate({ jobId: job.id, claimId: claim.id, data: { status: "accepted" } })}
                              disabled={updateClaimMutation.isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => updateClaimMutation.mutate({ jobId: job.id, claimId: claim.id, data: { status: "rejected" } })}
                              disabled={updateClaimMutation.isPending}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                        {claim.status === "accepted" && isOwner && job.status === "in_progress" && (
                          <Button
                            size="sm"
                            className="h-7 bg-green-700 hover:bg-green-800 text-white"
                            onClick={() => updateClaimMutation.mutate({ jobId: job.id, claimId: claim.id, data: { status: "completed" } })}
                            disabled={updateClaimMutation.isPending}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" /> Mark Done
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
