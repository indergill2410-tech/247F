import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetAdminDashboard, useAdminListUsers, useAdminListJobs, useAdminUpdateUser } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, Grid3x3, TrendingUp, ShieldCheck, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ROLE_COLORS: Record<string, string> = {
  homeowner: "bg-blue-500/15 text-blue-400",
  tradie:    "bg-emerald-500/15 text-emerald-400",
  admin:     "bg-purple-500/15 text-purple-400",
};
const JOB_STATUS: Record<string, string> = {
  open:        "bg-blue-500/15 text-blue-400",
  matched:     "bg-[#f5c518]/15 text-[#f5c518]",
  in_progress: "bg-orange-500/15 text-orange-400",
  completed:   "bg-emerald-500/15 text-emerald-400",
  cancelled:   "bg-white/8 text-white/40",
};

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
    { label: "Total Users",  value: stats?.totalUsers ?? 0,      icon: Users,      color: "text-blue-400",    bg: "bg-blue-500/10" },
    { label: "Homeowners",   value: stats?.totalHomeowners ?? 0, icon: Users,      color: "text-indigo-400",  bg: "bg-indigo-500/10" },
    { label: "Tradies",      value: stats?.totalTradies ?? 0,    icon: ShieldCheck,color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Total Jobs",   value: stats?.totalJobs ?? 0,       icon: Briefcase,  color: "text-orange-400",  bg: "bg-orange-500/10" },
    { label: "Open Jobs",    value: stats?.openJobs ?? 0,        icon: TrendingUp, color: "text-red-400",     bg: "bg-red-500/10" },
    { label: "Categories",   value: stats?.totalCategories ?? 0, icon: Grid3x3,    color: "text-purple-400",  bg: "bg-purple-500/10" },
  ];

  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="min-h-screen bg-[#0b0904]">
      <div className="border-b border-white/6 bg-[#0f0c06] py-8">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
          <p className="text-white/45 mt-1 text-sm">Platform overview and management</p>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className="bg-[#130f07] border border-white/6 hover:border-white/12 rounded-2xl p-5 text-center transition-colors cursor-default"
            >
              <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <s.icon className="h-4 w-4" />
              </div>
              {statsLoading
                ? <Skeleton className="h-7 w-10 mx-auto mb-1 bg-white/8" />
                : <p className="text-2xl font-black text-white">{s.value}</p>
              }
              <p className="text-xs text-white/40 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#130f07] border border-white/8 p-1 rounded-xl h-auto gap-1">
            <TabsTrigger
              value="users"
              className="rounded-lg text-white/50 data-[state=active]:bg-[#f5c518] data-[state=active]:text-black data-[state=active]:font-bold px-5 py-2 transition-all"
            >
              <Users className="h-4 w-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger
              value="jobs"
              className="rounded-lg text-white/50 data-[state=active]:bg-[#f5c518] data-[state=active]:text-black data-[state=active]:font-bold px-5 py-2 transition-all"
            >
              <Briefcase className="h-4 w-4 mr-2" /> Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                  <h2 className="font-bold text-white">All Users</h2>
                  <span className="text-xs text-white/35 font-medium">{usersData?.total ?? 0} total</span>
                </div>
                <div className="divide-y divide-white/5">
                  {(usersData?.users ?? []).map((user) => (
                    <div key={user.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/2 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#f5c518] text-black flex items-center justify-center font-black text-xs flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-white">{user.name}</p>
                          <p className="text-xs text-white/35">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md capitalize ${ROLE_COLORS[user.role] ?? "bg-white/8 text-white/40"}`}>
                          {user.role}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${user.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                          {user.isActive ? "Active" : "Suspended"}
                        </span>
                        <button
                          onClick={() => updateUserMutation.mutate({ id: user.id, data: { isActive: !user.isActive } })}
                          title={user.isActive ? "Suspend user" : "Activate user"}
                          className="transition-all hover:scale-110 active:scale-95"
                        >
                          {user.isActive
                            ? <ToggleRight className="h-6 w-6 text-emerald-400 hover:text-emerald-300" />
                            : <ToggleLeft className="h-6 w-6 text-red-400 hover:text-red-300" />
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="jobs" className="mt-4">
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                  <h2 className="font-bold text-white">All Jobs</h2>
                  <span className="text-xs text-white/35 font-medium">{jobsData?.total ?? 0} total</span>
                </div>
                <div className="divide-y divide-white/5">
                  {(jobsData?.jobs ?? []).map((job) => (
                    <Link href={`/jobs/${job.id}`} key={job.id}>
                      <div className="flex items-center justify-between px-6 py-3.5 hover:bg-white/2 cursor-pointer transition-colors group">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white truncate group-hover:text-[#f5c518] transition-colors">{job.title}</p>
                          <p className="text-xs text-white/35 mt-0.5">{job.categoryName} · {job.suburb ?? "Remote"}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md capitalize ${JOB_STATUS[job.status] ?? "bg-white/8 text-white/40"}`}>
                            {job.status.replace("_", " ")}
                          </span>
                          <ChevronRight className="h-4 w-4 text-white/25 group-hover:text-[#f5c518] transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
