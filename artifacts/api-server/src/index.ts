import { createServer } from "http";
import { WebSocketServer } from "ws";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { verifyToken } from "./lib/auth.js";
import { joinRoom, leaveRoom, leaveAllRooms, broadcastToRoom, type AuthedClient } from "./lib/ws-manager.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "", `http://${req.headers.host}`);

  if (url.pathname !== "/api/ws") {
    socket.destroy();
    return;
  }

  const token = url.searchParams.get("token");
  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    (ws as unknown as { _authPayload: typeof payload })._authPayload = payload;
    wss.emit("connection", ws, payload);
  });
});

wss.on("connection", (ws, payload: ReturnType<typeof verifyToken>) => {
  if (!payload) {
    ws.close(1008, "Unauthorized");
    return;
  }

  const client: AuthedClient = { ws, userId: payload.userId };

  logger.info({ userId: payload.userId }, "WS client connected");

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as Record<string, unknown>;

      if (msg["type"] === "join" && typeof msg["conversationId"] === "number") {
        joinRoom(msg["conversationId"] as number, client);
        ws.send(JSON.stringify({ type: "joined", conversationId: msg["conversationId"] }));
      } else if (msg["type"] === "leave" && typeof msg["conversationId"] === "number") {
        leaveRoom(msg["conversationId"] as number, client);
      } else if (msg["type"] === "typing" && typeof msg["conversationId"] === "number") {
        broadcastToRoom(
          msg["conversationId"] as number,
          { type: "typing", conversationId: msg["conversationId"], userId: payload.userId },
          payload.userId,
        );
      } else if (msg["type"] === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
      }
    } catch {
      // ignore parse errors
    }
  });

  ws.on("close", () => {
    leaveAllRooms(client);
    logger.info({ userId: payload.userId }, "WS client disconnected");
  });

  ws.on("error", (err) => {
    logger.warn({ err, userId: payload.userId }, "WS client error");
    leaveAllRooms(client);
  });

  ws.send(JSON.stringify({ type: "connected", userId: payload.userId }));
});

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
