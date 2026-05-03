import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable, usersTable, jobsTable, notificationsTable } from "@workspace/db";
import { eq, and, or, desc, count, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/require-auth.js";
import { logger } from "../lib/logger.js";
import { broadcastToRoom } from "../lib/ws-manager.js";
import { sendNewMessageNotification } from "../lib/email.js";

const router = Router();

// GET /api/conversations
router.get("/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const convos = await db
    .select({
      id: conversationsTable.id,
      jobId: conversationsTable.jobId,
      jobTitle: jobsTable.title,
      homeownerId: conversationsTable.homeownerId,
      homeownerName: sql<string>`ho.name`,
      tradieId: conversationsTable.tradieId,
      tradieName: sql<string>`tr.name`,
      lastMessageAt: conversationsTable.lastMessageAt,
      createdAt: conversationsTable.createdAt,
    })
    .from(conversationsTable)
    .leftJoin(jobsTable, eq(jobsTable.id, conversationsTable.jobId))
    .leftJoin(sql`${usersTable} ho`, sql`ho.id = ${conversationsTable.homeownerId}`)
    .leftJoin(sql`${usersTable} tr`, sql`tr.id = ${conversationsTable.tradieId}`)
    .where(or(eq(conversationsTable.homeownerId, userId), eq(conversationsTable.tradieId, userId)))
    .orderBy(desc(conversationsTable.lastMessageAt), desc(conversationsTable.createdAt));

  // Get unread counts and last message for each
  const results = await Promise.all(
    convos.map(async (c) => {
      const [unreadRow] = await db
        .select({ count: count() })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.conversationId, c.id),
            eq(messagesTable.isRead, false),
            // don't count messages you sent
            sql`${messagesTable.senderId} != ${userId}`
          )
        );
      const [lastMsg] = await db
        .select({ body: messagesTable.body })
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, c.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);
      return {
        ...c,
        unreadCount: Number(unreadRow?.count ?? 0),
        lastMessageBody: lastMsg?.body ?? null,
      };
    })
  );

  res.status(200).json(results);
});

// GET /api/conversations/:id/messages
router.get("/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const convoId = Number(req.params.id);
  const userId = req.user!.userId;

  const [convo] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, convoId));

  if (!convo) {
    res.status(404).json({ error: "not_found", message: "Conversation not found" });
    return;
  }

  if (convo.homeownerId !== userId && convo.tradieId !== userId && req.user!.role !== "admin") {
    res.status(403).json({ error: "forbidden", message: "Not a participant" });
    return;
  }

  const messages = await db
    .select({
      id: messagesTable.id,
      conversationId: messagesTable.conversationId,
      senderId: messagesTable.senderId,
      senderName: usersTable.name,
      senderAvatarUrl: usersTable.avatarUrl,
      body: messagesTable.body,
      isRead: messagesTable.isRead,
      createdAt: messagesTable.createdAt,
    })
    .from(messagesTable)
    .leftJoin(usersTable, eq(usersTable.id, messagesTable.senderId))
    .where(eq(messagesTable.conversationId, convoId))
    .orderBy(messagesTable.createdAt);

  // Mark unread messages from the other party as read
  await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(
      and(
        eq(messagesTable.conversationId, convoId),
        eq(messagesTable.isRead, false),
        sql`${messagesTable.senderId} != ${userId}`
      )
    )
    .catch((err) => logger.error({ err }, "Failed to mark messages read"));

  res.status(200).json(messages);
});

// POST /api/conversations/:id/messages
router.post("/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const convoId = Number(req.params.id);
  const userId = req.user!.userId;
  const body: string = req.body?.body;

  if (!body || body.trim().length === 0) {
    res.status(400).json({ error: "validation_error", message: "Message body is required" });
    return;
  }

  const [convo] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, convoId));

  if (!convo) {
    res.status(404).json({ error: "not_found", message: "Conversation not found" });
    return;
  }

  if (convo.homeownerId !== userId && convo.tradieId !== userId) {
    res.status(403).json({ error: "forbidden", message: "Not a participant" });
    return;
  }

  const [message] = await db
    .insert(messagesTable)
    .values({ conversationId: convoId, senderId: userId, body: body.trim() })
    .returning();

  if (!message) {
    res.status(500).json({ error: "server_error", message: "Failed to send message" });
    return;
  }

  // Update conversation lastMessageAt
  await db
    .update(conversationsTable)
    .set({ lastMessageAt: sql`NOW()` })
    .where(eq(conversationsTable.id, convoId))
    .catch(() => {});

  // Notify the other participant
  const recipientId = userId === convo.homeownerId ? convo.tradieId : convo.homeownerId;
  const [sender] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const [job] = await db.select({ title: jobsTable.title }).from(jobsTable).where(eq(jobsTable.id, convo.jobId));
  const [recipient] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, recipientId));

  await db
    .insert(notificationsTable)
    .values({
      userId: recipientId,
      type: "new_message",
      title: "New Message",
      message: `${sender?.name ?? "Someone"} sent you a message about "${job?.title ?? "a job"}"`,
      jobId: convo.jobId,
    })
    .catch((err) => logger.error({ err }, "Failed to send message notification"));

  // Fire-and-forget: email the recipient
  if (recipient?.email) {
    sendNewMessageNotification({
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      senderName: sender?.name ?? "Someone",
      jobTitle: job?.title ?? "a job",
      conversationId: convoId,
    }).catch(() => {});
  }

  const [senderFull] = await db
    .select({ name: usersTable.name, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  const fullMessage = {
    ...message,
    senderName: senderFull?.name ?? null,
    senderAvatarUrl: senderFull?.avatarUrl ?? null,
  };

  // Broadcast to all WS clients in this conversation room
  broadcastToRoom(convoId, { type: "message", conversationId: convoId, message: fullMessage });

  res.status(201).json(fullMessage);
});

export default router;
