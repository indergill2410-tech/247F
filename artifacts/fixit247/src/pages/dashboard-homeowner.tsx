import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetHomeownerDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Briefcase, Clock, CheckCircle, Bell, ChevronRight, Wrench } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-blue-100 text-blue-800" },
    matched: { label: "Matched", className: "bg-yellow-100 text-yellow-800" },
    in_progress: { label: "In Progress", className: "bg-orange-100 text-orange-800" },
    completed: { label: "Completed", className: "bg-green-100 text-green-800" },
    cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600" },
  };
  const s = map[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return <Badge className={`${s.className} border-none font-medium`}>{s.label}</Badge>;
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const map: Record<string, string> = {
    emergency: "bg-red-100 text-red-700",
    urgent: "bg-orange-100 text-orange-700",
    standard: "bg-gray-100 text-gray-600",
  };
  return <Badge className={`${map[urgency] ?? "bg-gray-100 text-gray-600"} border-none text-xs capitalize`}>{urgency}</Badge>;
}

export default function HomeownerDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useGetHomeownerDashboard();

  const stats = [
    { label: "Total Jobs", value: data?.totalJobs ?? 0, icon: Briefcase, color: "text-blue-600" },
    { label: "In Progress", value: data?.inProgressJobs ?? 0, icon: Clock, color: "text-orange-600" },
    { label: "Completed", value: data?.completedJobs ?? 0, icon: CheckCircle, color: "text-green-600" },
    { label: "Pending Claims", value: data?.pendingClaims ?? 0, icon: Bell, color: "text-[hsl(38,92%,50%)]" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-[hsl(222,47%,11%)] text-white px-6 py-8">
        <div className="container max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
                {user?.name?.split(" ")[0]}! 👋
              </h1>
              <p className="text-white/70 mt-1">Here's what's happening with your jobs.</p>
            </div>
            <Link href="/jobs/new">
              <Button className="bg-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,44%)] text-white font-semibold">
                <Plus className="h-4 w-4 mr-2" /> Post New Job
              </Button>
            </Link>
          </div>
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
                      {isLoading ? (
                        <Skeleton className="h-8 w-12 mt-1" />
                      ) : (
                        <p className="text-3xl font-bold mt-1">{s.value}</p>
                      )}
                    </div>
                    <div className={`${s.color} bg-current/10 p-3 rounded-full bg-opacity-10`}>
                      <s.icon className={`h-6 w-6 ${s.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Jobs</CardTitle>
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="text-[hsl(38,92%,50%)] hover:text-[hsl(38,92%,40%)]">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : !data?.recentJobs?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No jobs yet</p>
                <p className="text-sm mt-1">Post your first job to get started</p>
                <Link href="/jobs/new">
                  <Button className="mt-4 bg-[hsl(38,92%,50%)] text-white hover:bg-[hsl(38,92%,44%)]">
                    <Plus className="h-4 w-4 mr-2" /> Post a Job
                  </Button>
                </Link>
              </div>
            ) : (
              data.recentJobs.map((job) => (
                <Link href={`/jobs/${job.id}`} key={job.id}>
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:border-[hsl(38,92%,50%)] hover:bg-muted/30 transition-all cursor-pointer group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{job.title}</p>
                        <StatusBadge status={job.status} />
                        <UrgencyBadge urgency={job.urgency} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {job.categoryName} · {job.suburb ?? "Remote"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[hsl(38,92%,50%)] flex-shrink-0 ml-2" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/jobs/new">
            <Card className="cursor-pointer hover:border-[hsl(38,92%,50%)] transition-colors group">
              <CardContent className="flex items-center gap-4 pt-6 pb-6">
                <div className="w-12 h-12 bg-[hsl(38,92%,50%)] rounded-full flex items-center justify-center">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-[hsl(38,92%,50%)] transition-colors">Post a New Job</p>
                  <p className="text-sm text-muted-foreground">Get matched in minutes</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/notifications">
            <Card className="cursor-pointer hover:border-[hsl(38,92%,50%)] transition-colors group">
              <CardContent className="flex items-center gap-4 pt-6 pb-6">
                <div className="w-12 h-12 bg-[hsl(222,47%,11%)] rounded-full flex items-center justify-center">
                  <Bell className="h-6 w-6 text-[hsl(38,92%,50%)]" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-[hsl(38,92%,50%)] transition-colors">Notifications</p>
                  <p className="text-sm text-muted-foreground">See claims & updates</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
