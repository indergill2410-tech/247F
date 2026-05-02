import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetTradiedashboard, useClaimJob } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Briefcase, CheckCircle, DollarSign, ChevronRight, MapPin, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function UrgencyBadge({ urgency }: { urgency: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    emergency: { label: "Emergency", className: "bg-red-100 text-red-700", icon: Zap },
    urgent: { label: "Urgent", className: "bg-orange-100 text-orange-700", icon: Clock },
    standard: { label: "Standard", className: "bg-gray-100 text-gray-600", icon: Briefcase },
  };
  const s = map[urgency] ?? map.standard;
  const Icon = s.icon;
  return (
    <Badge className={`${s.className} border-none text-xs flex items-center gap-1`}>
      <Icon className="h-3 w-3" />{s.label}
    </Badge>
  );
}

function ClaimStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-700",
    withdrawn: "bg-gray-100 text-gray-600",
    completed: "bg-blue-100 text-blue-800",
  };
  return <Badge className={`${map[status] ?? "bg-gray-100"} border-none capitalize`}>{status}</Badge>;
}

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
    { label: "Active Jobs", value: data?.activeJobs ?? 0, icon: Briefcase, color: "text-blue-600" },
    { label: "Completed", value: data?.completedJobs ?? 0, icon: CheckCircle, color: "text-green-600" },
    { label: "Available Leads", value: data?.availableLeads ?? 0, icon: DollarSign, color: "text-[hsl(38,92%,50%)]" },
    { label: "My Rating", value: data?.myRating ? `${data.myRating}★` : "–", icon: Star, color: "text-yellow-500" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-[hsl(222,47%,11%)] text-white px-6 py-8">
        <div className="container max-w-5xl">
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.name?.split(" ")[0]}! 🔧
          </h1>
          <p className="text-white/70 mt-1">Find jobs and manage your work.</p>
        </div>
      </div>

      <div className="container max-w-5xl py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card>
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      {isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : <p className="text-3xl font-bold mt-1">{s.value}</p>}
                    </div>
                    <s.icon className={`h-8 w-8 ${s.color} opacity-80`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Available Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Available Jobs Near You</CardTitle>
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="text-[hsl(38,92%,50%)]">
                Browse all <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : !data?.availableJobs?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No available jobs at the moment. Check back soon!</p>
              </div>
            ) : (
              data.availableJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 hover:border-[hsl(38,92%,50%)] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/jobs/${job.id}`}>
                          <p className="font-semibold hover:text-[hsl(38,92%,50%)] cursor-pointer">{job.title}</p>
                        </Link>
                        <UrgencyBadge urgency={job.urgency} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{job.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {job.suburb ?? "Remote"}
                        </span>
                        <span>{job.categoryName}</span>
                        {job.budget && <span className="font-medium text-foreground">${job.budget}</span>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[hsl(38,92%,50%)] text-white hover:bg-[hsl(38,92%,44%)] flex-shrink-0"
                      disabled={claimMutation.isPending}
                      onClick={() => claimMutation.mutate({ jobId: job.id, data: {} })}
                    >
                      Claim
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* My Recent Claims */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Recent Claims</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : !data?.recentClaims?.length ? (
              <p className="text-center py-6 text-muted-foreground">No claims yet. Start claiming jobs above!</p>
            ) : (
              data.recentClaims.map((claim) => (
                <Link href={`/jobs/${claim.jobId}`} key={claim.id}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">Job #{claim.jobId}</p>
                      <p className="text-xs text-muted-foreground">{new Date(claim.createdAt).toLocaleDateString()}</p>
                    </div>
                    <ClaimStatusBadge status={claim.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
