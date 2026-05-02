import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useListConversations } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Briefcase, ChevronRight, Clock } from "lucide-react";

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function MessagesPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: conversations, isLoading } = useListConversations();

  return (
    <div className="min-h-screen bg-[#0b0904]">
      <div className="border-b border-white/6 bg-[#0f0c06] py-8">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffc800]/15 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-[#ffc800]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Messages</h1>
              <p className="text-white/40 text-sm mt-0.5">Conversations with your {user?.role === "tradie" ? "clients" : "tradies"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : !conversations?.length ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-white/20" />
            </div>
            <p className="text-white/50 font-medium">No conversations yet</p>
            <p className="text-white/30 text-sm mt-1">
              {user?.role === "tradie"
                ? "When a homeowner accepts your claim, a conversation will open here."
                : "When you accept a tradie's claim, a conversation will open here."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {conversations.map((convo, i) => {
              const isHomeowner = user?.id === convo.homeownerId;
              const otherName = isHomeowner ? convo.tradieName : convo.homeownerName;
              const otherInitial = (otherName ?? "?").charAt(0).toUpperCase();
              const hasUnread = (convo.unreadCount ?? 0) > 0;

              return (
                <motion.div
                  key={convo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setLocation(`/conversations/${convo.id}`)}
                  className="bg-[#130f07] border border-white/6 rounded-2xl p-4 cursor-pointer hover:border-[#ffc800]/25 hover:bg-[#1a1508] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-[#ffc800] text-black font-black text-lg flex items-center justify-center">
                        {otherInitial}
                      </div>
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ffc800] rounded-full border-2 border-[#0b0904]" />
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold truncate ${hasUnread ? "text-white" : "text-white/80"}`}>
                          {otherName ?? "Unknown"}
                        </p>
                        <span className="text-xs text-white/30 flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {timeAgo(convo.lastMessageAt ?? convo.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Briefcase className="h-3 w-3 text-white/25 flex-shrink-0" />
                        <p className="text-xs text-white/40 truncate">{convo.jobTitle ?? `Job #${convo.jobId}`}</p>
                      </div>
                      {convo.lastMessageBody && (
                        <p className={`text-sm mt-1 truncate ${hasUnread ? "text-white/70 font-medium" : "text-white/35"}`}>
                          {convo.lastMessageBody}
                        </p>
                      )}
                    </div>

                    {/* Arrow + unread badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasUnread && (
                        <span className="min-w-[20px] h-5 bg-[#ffc800] text-black text-[10px] font-black rounded-full flex items-center justify-center px-1">
                          {(convo.unreadCount ?? 0) > 9 ? "9+" : convo.unreadCount}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
