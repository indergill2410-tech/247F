import { Link } from "wouter";
import { useGetAdminDashboard, useAdminListUsers, useAdminListJobs, useAdminUpdateUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, Grid3x3, TrendingUp, ShieldCheck, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    homeowner: "bg-blue-100 text-blue-800",
    tradie: "bg-green-100 text-green-800",
    admin: "bg-purple-100 text-purple-800",
  };
  return <Badge className={`${map[role] ?? "bg-gray-100"} border-none capitalize text-xs`}>{role}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    matched: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return <Badge className={`${map[status] ?? "bg-gray-100"} border-none text-xs`}>{status.replace("_", " ")}</Badge>;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = useGetAdminDashboard();
  const { data: usersData, refetch: refetchUsers } = useAdminListUsers({});
  const { data: jobsData } = useAdminListJobs({});

  const updateUserMutation = useAdminUpdateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Updated", description: "User updated successfully." });
        refetchUsers();
      },
    },
  });

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600" },
    { label: "Homeowners", value: stats?.totalHomeowners ?? 0, icon: Users, color: "text-indigo-600" },
    { label: "Tradies", value: stats?.totalTradies ?? 0, icon: ShieldCheck, color: "text-green-600" },
    { label: "Total Jobs", value: stats?.totalJobs ?? 0, icon: Briefcase, color: "text-orange-600" },
    { label: "Open Jobs", value: stats?.openJobs ?? 0, icon: TrendingUp, color: "text-red-600" },
    { label: "Categories", value: stats?.totalCategories ?? 0, icon: Grid3x3, color: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-[hsl(222,47%,11%)] text-white px-6 py-8">
        <div className="container max-w-6xl">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-white/70 mt-1">Platform overview and management</p>
        </div>
      </div>

      <div className="container max-w-6xl py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((s, i) => (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-5 text-center">
                <s.icon className={`h-6 w-6 ${s.color} mx-auto mb-2`} />
                {statsLoading ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold">{s.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList className="bg-[hsl(222,47%,11%)]">
            <TabsTrigger value="users" className="text-white/70 data-[state=active]:bg-[hsl(38,92%,50%)] data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="jobs" className="text-white/70 data-[state=active]:bg-[hsl(38,92%,50%)] data-[state=active]:text-white">
              <Briefcase className="h-4 w-4 mr-2" /> Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle className="text-lg">All Users ({usersData?.total ?? 0})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(usersData?.users ?? []).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[hsl(222,47%,11%)] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <RoleBadge role={user.role} />
                        <Badge className={user.isActive ? "bg-green-100 text-green-700 border-none" : "bg-red-100 text-red-700 border-none"}>
                          {user.isActive ? "Active" : "Suspended"}
                        </Badge>
                        <button
                          onClick={() => updateUserMutation.mutate({ id: user.id, data: { isActive: !user.isActive } })}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title={user.isActive ? "Suspend user" : "Activate user"}
                        >
                          {user.isActive ? (
                            <ToggleRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-red-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader><CardTitle className="text-lg">All Jobs ({jobsData?.total ?? 0})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(jobsData?.jobs ?? []).map((job) => (
                    <Link href={`/jobs/${job.id}`} key={job.id}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.categoryName} · {job.suburb ?? "Remote"}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <StatusBadge status={job.status} />
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
