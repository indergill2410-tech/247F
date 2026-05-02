import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/require-auth.js";

const router = Router();

// GET /api/notifications
router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const unreadOnly = req.query.unreadOnly === "true";
  const userId = req.user!.userId;

  const conditions = [eq(notificationsTable.userId, userId)];
  if (unreadOnly) conditions.push(eq(notificationsTable.isRead, false));

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(and(...conditions))
    .orderBy(sql`${notificationsTable.createdAt} DESC`)
    .limit(50);

  res.status(200).json(notifications);
});

// PUT /api/notifications/:id/read
router.put("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const userId = req.user!.userId;

  const [updated] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Notification not found" });
    return;
  }

  res.status(200).json(updated);
});

// POST /api/notifications/read-all
router.post("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));

  res.status(200).json({ success: true, message: "All notifications marked as read" });
});

// GET /api/notifications/unread-count
router.get("/notifications/unread-count", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const [result] = await db
    .select({ count: count() })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));

  res.status(200).json({ count: Number(result?.count ?? 0) });
});

export default router;
