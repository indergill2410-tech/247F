import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, BellRing, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const TYPE_ICONS: Record<string, string> = {
  new_claim:      "🔔",
  claim_accepted: "✅",
  claim_rejected: "❌",
  job_completed:  "🎉",
  job_matched:    "🔗",
  system:         "ℹ️",
};

export default function NotificationsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: notifications, isLoading, refetch } = useListNotifications();

  const markRead = useMarkNotificationRead({ mutation: { onSuccess: () => refetch() } });
  const markAllRead = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        toast({ title: "All read", description: "Marked all notifications as read." });
        refetch();
      },
    },
  });

  const unreadCount = (notifications ?? []).filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#0b0904]">
      {/* Header */}
      <div className="border-b border-white/6 bg-[#0f0c06] px-6 py-6">
        <div className="container max-w-2xl">
          <button
            onClick={() => setLocation(-1 as unknown as string)}
            className="flex items-center gap-1 text-white/40 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BellRing className="h-5 w-5 text-[#f5c518]" />
              <div>
                <h1 className="text-2xl font-black text-white">Notifications</h1>
                {unreadCount > 0 && <p className="text-white/40 text-xs mt-0.5">{unreadCount} unread</p>}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="h-9 px-4 rounded-xl border border-white/12 text-white/60 hover:text-white hover:border-white/25 text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-2xl py-6">
        <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden divide-y divide-white/5">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-5">
                <Skeleton className="h-4 w-2/3 mb-2 bg-white/8" />
                <Skeleton className="h-3 w-full bg-white/5" />
              </div>
            ))
          ) : !(notifications ?? []).length ? (
            <div className="text-center py-16 text-white/30">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-semibold text-white/45">No notifications yet</p>
              <p className="text-sm mt-1">We'll notify you when something happens</p>
            </div>
          ) : (
            (notifications ?? []).map((n) => (
              <div
                key={n.id}
                className={`px-6 py-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-white/2 ${
                  !n.isRead ? "bg-[#f5c518]/3" : ""
                }`}
                onClick={() => { if (!n.isRead) markRead.mutate({ id: n.id }); }}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.isRead ? "text-white" : "text-white/55"}`}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#f5c518] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-white/40 mt-0.5">{n.message}</p>
                  <p className="text-xs text-white/25 mt-1.5">
                    {new Date(n.createdAt).toLocaleDateString()} at{" "}
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
