import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListMessages, useSendMessage, useListConversations } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Send, Briefcase, AlertTriangle } from "lucide-react";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations } = useListConversations();
  const convo = conversations?.find((c) => c.id === convoId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messages, isLoading, refetch } = useListMessages(convoId, {
    query: { enabled: !isNaN(convoId), refetchInterval: 5000 } as any,
  });

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

  const isHomeowner = user?.id === convo?.homeownerId;
  const otherName = convo ? (isHomeowner ? convo.tradieName : convo.homeownerName) : null;

  return (
    <div className="min-h-screen bg-[#0b0904] flex flex-col">
      {/* Header */}
      <div className="border-b border-white/6 bg-[#0f0c06] px-4 py-4 flex-shrink-0">
        <div className="container max-w-2xl flex items-center gap-3">
          <button onClick={() => setLocation("/messages")} className="text-white/40 hover:text-white transition-colors p-1 -ml-1">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-[#f5c518] text-black font-black text-base flex items-center justify-center flex-shrink-0">
            {(otherName ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white truncate">{otherName ?? "Loading…"}</p>
            {convo?.jobTitle && (
              <p className="text-xs text-white/35 flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {convo.jobTitle}
              </p>
            )}
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
          ) : !messages?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="h-8 w-8 text-white/15 mb-3" />
              <p className="text-white/40 font-medium">No messages yet</p>
              <p className="text-white/25 text-sm mt-1">Send the first message below.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
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
                            ? "bg-[#f5c518] text-black font-medium rounded-br-sm"
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
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/6 bg-[#0f0c06] px-4 py-4 flex-shrink-0">
        <div className="container max-w-2xl flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f5c518]/50 transition-all resize-none max-h-32"
            style={{ scrollbarWidth: "none" }}
          />
          <button
            onClick={handleSend}
            disabled={!body.trim() || sendMutation.isPending}
            className="h-11 w-11 rounded-xl bg-[#f5c518] hover:bg-[#e6b800] text-black flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
