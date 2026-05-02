import { useState } from "react";
import { Link } from "wouter";
import { useListJobs, useListCategories, useClaimJob } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MapPin, DollarSign, Clock, Zap, Briefcase, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function UrgencyIcon({ urgency }: { urgency: string }) {
  if (urgency === "emergency") return <Zap className="h-3.5 w-3.5 text-red-500" />;
  if (urgency === "urgent") return <Clock className="h-3.5 w-3.5 text-orange-500" />;
  return <Briefcase className="h-3.5 w-3.5 text-gray-400" />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    matched: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return (
    <Badge className={`${map[status] ?? "bg-gray-100"} border-none text-xs capitalize`}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export default function JobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [page] = useState(1);

  const { data: categories } = useListCategories();
  const { data, isLoading, refetch } = useListJobs({
    status: status !== "all" ? (status as Parameters<typeof useListJobs>[0]["status"]) : undefined,
    categoryId: categoryId !== "all" ? Number(categoryId) : undefined,
    page,
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
    (j) =>
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase()) ||
      (j.suburb ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-[hsl(222,47%,11%)] text-white px-6 py-8">
        <div className="container max-w-5xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{user?.role === "homeowner" ? "My Jobs" : "Browse Jobs"}</h1>
            <p className="text-white/70 mt-1">
              {data?.total ?? 0} job{(data?.total ?? 0) !== 1 ? "s" : ""} found
            </p>
          </div>
          {user?.role === "homeowner" && (
            <Link href="/jobs/new">
              <Button className="bg-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,44%)] text-white font-semibold">
                <Plus className="h-4 w-4 mr-2" /> Post Job
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="container max-w-5xl py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, suburb…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
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
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          ) : !filteredJobs.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No jobs found</p>
              {user?.role === "homeowner" && (
                <Link href="/jobs/new">
                  <Button className="mt-4 bg-[hsl(38,92%,50%)] text-white hover:bg-[hsl(38,92%,44%)]">
                    Post your first job
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            filteredJobs.map((job) => (
              <Card key={job.id} className="hover:border-[hsl(38,92%,50%)] transition-colors">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <UrgencyIcon urgency={job.urgency} />
                        <Link href={`/jobs/${job.id}`}>
                          <p className="font-semibold text-lg hover:text-[hsl(38,92%,50%)] cursor-pointer">{job.title}</p>
                        </Link>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                        {(job.suburb || job.postcode) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {[job.suburb, job.postcode].filter(Boolean).join(" ")}
                          </span>
                        )}
                        {job.categoryName && <span>{job.categoryName}</span>}
                        {job.budget && (
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <DollarSign className="h-3.5 w-3.5" />${job.budget}
                          </span>
                        )}
                        <span className="text-xs">{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          View <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                      {user?.role === "tradie" && ["open", "matched"].includes(job.status) && (
                        <Button
                          size="sm"
                          className="bg-[hsl(38,92%,50%)] text-white hover:bg-[hsl(38,92%,44%)]"
                          disabled={claimMutation.isPending}
                          onClick={() => claimMutation.mutate({ jobId: job.id, data: {} })}
                        >
                          Claim
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
