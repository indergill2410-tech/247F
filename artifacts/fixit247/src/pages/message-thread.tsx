import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListMessages, useSendMessage, useListConversations } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useConversationSocket, type WsMessage } from "@/hooks/use-conversation-socket";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Send, Briefcase, Wifi, WifiOff } from "lucide-react";

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageThreadPage() {
  const { id } = useParams<{ id: string }>();
  const convoId = Number(id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [typingUserId, setTypingUserId] = useState<number | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations } = useListConversations();
  const convo = conversations?.find((c) => c.id === convoId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messages, isLoading, refetch } = useListMessages(convoId, {
    query: { enabled: !isNaN(convoId), refetchInterval: 30000 } as any,
  });

  // Local optimistic messages pushed via WebSocket
  const [wsMessages, setWsMessages] = useState<WsMessage[]>([]);

  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (msg.senderId === user?.id) return; // own messages already shown
    setWsMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, [user?.id]);

  const handleTyping = useCallback((userId: number) => {
    setTypingUserId(userId);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setTypingUserId(null), 3000);
  }, []);

  const { connected, sendTyping } = useConversationSocket({
    conversationId: isNaN(convoId) ? null : convoId,
    onMessage: handleWsMessage,
    onTyping: handleTyping,
  });

  // Merge REST messages with WS-pushed messages (deduplicate by id)
  const allMessages = (() => {
    const base = messages ?? [];
    const extra = wsMessages.filter((w) => !base.some((m) => m.id === w.id));
    return [...base, ...extra].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  })();

  const sendMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        setBody("");
        refetch();
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      },
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear WS messages when REST data refreshes (they're now in REST response)
  useEffect(() => {
    if (messages) setWsMessages([]);
  }, [messages]);

  const handleSend = () => {
    const trimmed = body.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate({ id: convoId, data: { body: trimmed } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    sendTyping();
  };

  const isHomeowner = user?.id === convo?.homeownerId;
  const otherName = convo ? (isHomeowner ? convo.tradieName : convo.homeownerName) : null;
  const typingName = typingUserId ? otherName : null;

  return (
    <div className="min-h-screen bg-[#0b0904] flex flex-col">
      {/* Header */}
      <div className="border-b border-white/6 bg-[#0f0c06] px-4 py-4 flex-shrink-0">
        <div className="container max-w-2xl flex items-center gap-3">
          <button onClick={() => setLocation("/messages")} className="text-white/40 hover:text-white transition-colors p-1 -ml-1">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-[#ffc800] text-black font-black text-base flex items-center justify-center flex-shrink-0">
            {(otherName ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white truncate">{otherName ?? "Loading…"}</p>
            {convo?.jobTitle && (
              <p className="text-xs text-white/35 flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {convo.jobTitle}
              </p>
            )}
          </div>
          {/* Live connection status */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
            connected
              ? "text-emerald-400 bg-emerald-400/8 border-emerald-400/20"
              : "text-white/30 bg-white/4 border-white/8"
          }`}>
            {connected
              ? <><Wifi className="h-3 w-3" /> Live</>
              : <><WifiOff className="h-3 w-3" /> Reconnecting…</>
            }
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-2xl py-6 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                  <Skeleton className="h-12 w-56 rounded-2xl bg-white/5" />
                </div>
              ))}
            </div>
          ) : !allMessages.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
                <Send className="h-6 w-6 text-white/20" />
              </div>
              <p className="text-white/40 font-medium">No messages yet</p>
              <p className="text-white/25 text-sm mt-1">Send the first message below.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {allMessages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      {!isMine && (
                        <p className="text-[10px] text-white/30 mb-1 px-1">{msg.senderName ?? "Unknown"}</p>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? "bg-[#ffc800] text-black font-medium rounded-br-sm"
                            : "bg-[#1d1a12] text-white/85 border border-white/6 rounded-bl-sm"
                        }`}
                      >
                        {msg.body}
                      </div>
                      <p className="text-[10px] text-white/25 mt-1 px-1">{formatTime(msg.createdAt)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {/* Typing indicator */}
          <AnimatePresence>
            {typingName && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex justify-start"
              >
                <div className="bg-[#1d1a12] border border-white/6 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white/40"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/6 bg-[#0f0c06] px-4 py-4 flex-shrink-0">
        <div className="container max-w-2xl flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ffc800]/50 transition-all resize-none max-h-32"
            style={{ scrollbarWidth: "none" }}
          />
          <button
            onClick={handleSend}
            disabled={!body.trim() || sendMutation.isPending}
            className="h-11 w-11 rounded-xl bg-[#ffc800] hover:bg-[#e6b800] text-black flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
