import { usePageTitle } from "@/hooks/use-page-title";
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell, CheckCheck, BellRing, ChevronLeft,
  Hammer, CheckCircle2, XCircle, PartyPopper, Link2, Info, AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

function timeAgo(date: string | Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

const TYPE_CONFIG: Record<string, { Icon: React.ElementType; bg: string; color: string }> = {
  new_claim:      { Icon: Hammer,       bg: "bg-blue-500/15",    color: "text-blue-400" },
  claim_accepted: { Icon: CheckCircle2, bg: "bg-emerald-500/15", color: "text-emerald-400" },
  claim_rejected: { Icon: XCircle,      bg: "bg-red-500/15",     color: "text-red-400" },
  job_completed:  { Icon: PartyPopper,  bg: "bg-primary/15",   color: "text-primary" },
  job_matched:    { Icon: Link2,        bg: "bg-purple-500/15",  color: "text-purple-400" },
  system:         { Icon: Info,         bg: "bg-white/8",        color: "text-white/50" },
};

const FALLBACK = { Icon: AlertCircle, bg: "bg-white/8", color: "text-white/50" };

export default function NotificationsPage() {
  usePageTitle("Notifications");
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

  function handleClick(n: { id: number; isRead: boolean; jobId?: number | null }) {
    if (!n.isRead) markRead.mutate({ id: n.id });
    if (n.jobId) setLocation(`/jobs/${n.jobId}`);
  }

  return (
    <div className="min-h-screen bg-[#0b0904]">
      {/* Header */}
      <div className="border-b border-white/6 bg-[#0f0c06] py-8">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => setLocation(-1 as unknown as string)}
            className="flex items-center gap-1 text-white/40 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <BellRing className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-white/40 text-xs mt-0.5">{unreadCount} unread</p>
                )}
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

      <div className="container max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-[#130f07] border border-white/6 rounded-2xl overflow-hidden divide-y divide-white/5">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-5 flex items-start gap-4">
                <Skeleton className="w-9 h-9 rounded-xl bg-white/8 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3 bg-white/8" />
                  <Skeleton className="h-3 w-full bg-white/5" />
                  <Skeleton className="h-3 w-1/4 bg-white/4" />
                </div>
              </div>
            ))
          ) : !(notifications ?? []).length ? (
            <div className="text-center py-16 text-white/30">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-semibold text-white/45">No notifications yet</p>
              <p className="text-sm mt-1">We'll notify you when something happens</p>
            </div>
          ) : (
            (notifications ?? []).map((n) => {
              const cfg = TYPE_CONFIG[n.type] ?? FALLBACK;
              const { Icon } = cfg;
              const clickable = !n.isRead || !!n.jobId;
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`px-6 py-4 flex items-start gap-4 transition-colors ${
                    !n.isRead ? "bg-primary/3" : ""
                  } ${clickable ? "cursor-pointer hover:bg-white/2" : ""}`}
                >
                  {/* Icon badge */}
                  <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold leading-snug ${!n.isRead ? "text-white" : "text-white/55"}`}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs text-white/25 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                    </div>
                    <p className="text-sm text-white/40 mt-0.5 leading-relaxed">{n.message}</p>
                    {n.jobId && (
                      <span className="text-xs text-primary/60 mt-1.5 inline-block hover:text-primary transition-colors">
                        View job →
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
