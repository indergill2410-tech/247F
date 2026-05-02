import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, BellRing, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const TYPE_ICONS: Record<string, string> = {
  new_claim: "🔔",
  claim_accepted: "✅",
  claim_rejected: "❌",
  job_completed: "🎉",
  job_matched: "🔗",
  system: "ℹ️",
};

export default function NotificationsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: notifications, isLoading, refetch } = useListNotifications({ limit: 50 });

  const markRead = useMarkNotificationRead({
    mutation: {
      onSuccess: () => refetch(),
    },
  });

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
    <div className="min-h-screen bg-muted/30">
      <div className="bg-[hsl(222,47%,11%)] text-white px-6 py-6">
        <div className="container max-w-2xl">
          <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BellRing className="h-6 w-6 text-[hsl(38,92%,50%)]" />
              <div>
                <h1 className="text-2xl font-bold">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-white/70 text-sm">{unreadCount} unread</p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => markAllRead.mutate({})}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-2xl py-6">
        <Card>
          <CardContent className="pt-4 divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : !(notifications ?? []).length ? (
              <div className="text-center py-16 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-sm mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              (notifications ?? []).map((n) => (
                <div
                  key={n.id}
                  className={`py-4 flex items-start gap-3 cursor-pointer hover:bg-muted/20 -mx-4 px-4 transition-colors rounded-lg ${!n.isRead ? "bg-[hsl(38,92%,50%)]/5" : ""}`}
                  onClick={() => {
                    if (!n.isRead) markRead.mutate({ id: n.id });
                  }}
                >
                  <div className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? "🔔"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-[hsl(38,92%,50%)] flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
