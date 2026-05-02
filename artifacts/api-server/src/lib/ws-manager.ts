import type { WebSocket } from "ws";

export interface AuthedClient {
  ws: WebSocket;
  userId: number;
}

const rooms = new Map<number, Set<AuthedClient>>();

export function joinRoom(conversationId: number, client: AuthedClient): void {
  if (!rooms.has(conversationId)) rooms.set(conversationId, new Set());
  rooms.get(conversationId)!.add(client);
}

export function leaveRoom(conversationId: number, client: AuthedClient): void {
  const room = rooms.get(conversationId);
  if (!room) return;
  room.delete(client);
  if (room.size === 0) rooms.delete(conversationId);
}

export function leaveAllRooms(client: AuthedClient): void {
  for (const [convoId, clients] of rooms.entries()) {
    clients.delete(client);
    if (clients.size === 0) rooms.delete(convoId);
  }
}

export function broadcastToRoom(
  conversationId: number,
  data: object,
  excludeUserId?: number,
): void {
  const room = rooms.get(conversationId);
  if (!room) return;
  const payload = JSON.stringify(data);
  for (const client of room) {
    if (excludeUserId !== undefined && client.userId === excludeUserId) continue;
    if (client.ws.readyState === 1 ) {
      client.ws.send(payload);
    }
  }
}

export function getRoomSize(conversationId: number): number {
  return rooms.get(conversationId)?.size ?? 0;
}
