import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "./use-auth";

export interface WsMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string | null;
  senderAvatarUrl: string | null;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface WsEvent {
  type: "connected" | "joined" | "message" | "typing" | "pong";
  conversationId?: number;
  userId?: number;
  message?: WsMessage;
}

interface UseConversationSocketOptions {
  conversationId: number | null;
  onMessage: (msg: WsMessage) => void;
  onTyping?: (userId: number) => void;
}

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000];
const PING_INTERVAL = 25000;

export function useConversationSocket({
  conversationId,
  onMessage,
  onTyping,
}: UseConversationSocketOptions) {
  const { token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const currentConvoRef = useRef<number | null>(null);
  const [connected, setConnected] = useState(false);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  const sendRaw = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/ws?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      reconnectAttemptRef.current = 0;
      setConnected(true);

      if (currentConvoRef.current !== null) {
        ws.send(JSON.stringify({ type: "join", conversationId: currentConvoRef.current }));
      }

      pingTimerRef.current = setInterval(() => {
        sendRaw({ type: "ping" });
      }, PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      try {
        const evt = JSON.parse(event.data as string) as WsEvent;
        if (evt.type === "message" && evt.message) {
          onMessage(evt.message);
        } else if (evt.type === "typing" && evt.userId !== undefined) {
          onTyping?.(evt.userId);
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      clearTimers();
      setConnected(false);
      if (!mountedRef.current) return;

      const delay =
        RECONNECT_DELAYS[Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1)] ?? 15000;
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [token, onMessage, onTyping, sendRaw, clearTimers]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimers();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, clearTimers]);

  useEffect(() => {
    currentConvoRef.current = conversationId;
    if (conversationId !== null) {
      sendRaw({ type: "join", conversationId });
    }
  }, [conversationId, sendRaw]);

  const sendTyping = useCallback(() => {
    if (conversationId !== null) {
      sendRaw({ type: "typing", conversationId });
    }
  }, [conversationId, sendRaw]);

  return { connected, sendTyping };
}
