import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable, jobsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/require-auth.js";
import { sendReviewReceivedNotification } from "../lib/email.js";

const router = Router();

// GET /api/jobs/:jobId/reviews
router.get("/jobs/:jobId/reviews", requireAuth, async (req, res): Promise<void> => {
  const jobId = Number(req.params.jobId);
  if (Number.isNaN(jobId)) {
    res.status(400).json({ error: "validation_error", message: "Invalid jobId" });
    return;
  }

  const reviews = await db
    .select({
      id: reviewsTable.id,
      jobId: reviewsTable.jobId,
      reviewerId: reviewsTable.reviewerId,
      reviewerName: sql<string>`rv.name`,
      reviewerAvatarUrl: sql<string>`rv.avatar_url`,
      revieweeId: reviewsTable.revieweeId,
      revieweeName: sql<string>`re.name`,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
    })
    .from(reviewsTable)
    .leftJoin(sql`${usersTable} rv`, sql`rv.id = ${reviewsTable.reviewerId}`)
    .leftJoin(sql`${usersTable} re`, sql`re.id = ${reviewsTable.revieweeId}`)
    .where(eq(reviewsTable.jobId, jobId))
    .orderBy(reviewsTable.createdAt);

  res.status(200).json(reviews);
});

// POST /api/jobs/:jobId/reviews
router.post("/jobs/:jobId/reviews", requireAuth, async (req, res): Promise<void> => {
  const jobId = Number(req.params.jobId);
  if (Number.isNaN(jobId)) {
    res.status(400).json({ error: "validation_error", message: "Invalid jobId" });
    return;
  }

  const { revieweeId, rating, comment } = req.body ?? {};
  if (!revieweeId || !rating) {
    res.status(400).json({ error: "validation_error", message: "revieweeId and rating are required" });
    return;
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    res.status(400).json({ error: "validation_error", message: "Rating must be 1–5" });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) {
    res.status(404).json({ error: "not_found", message: "Job not found" });
    return;
  }
  if (job.status !== "completed") {
    res.status(409).json({ error: "conflict", message: "Can only review completed jobs" });
    return;
  }

  const reviewerId = req.user!.userId;
  const [existing] = await db
    .select({ id: reviewsTable.id })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.jobId, jobId), eq(reviewsTable.reviewerId, reviewerId)));
  if (existing) {
    res.status(409).json({ error: "conflict", message: "You have already reviewed this job" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({ jobId, reviewerId, revieweeId: Number(revieweeId), rating, comment: comment ?? null })
    .returning();

  if (!review) {
    res.status(500).json({ error: "server_error", message: "Failed to save review" });
    return;
  }

  // Update reviewee's average rating
  const allReviews = await db
    .select({ rating: reviewsTable.rating })
    .from(reviewsTable)
    .where(eq(reviewsTable.revieweeId, Number(revieweeId)));
  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
  await db
    .update(usersTable)
    .set({ rating: Math.round(avg * 10) / 10, reviewCount: allReviews.length, updatedAt: sql`NOW()` })
    .where(eq(usersTable.id, Number(revieweeId)))
    .catch(() => {});

  const [reviewer] = await db
    .select({ name: usersTable.name, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, reviewerId));
  const [reviewee] = await db
    .select({ name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, Number(revieweeId)));

  // Fire-and-forget: email the reviewee (tradie) that they received a review
  if (reviewee?.email) {
    sendReviewReceivedNotification({
      tradieEmail: reviewee.email,
      tradieName: reviewee.name,
      reviewerName: reviewer?.name ?? "Anonymous",
      rating,
      comment: comment ?? null,
      jobTitle: job.title,
    }).catch(() => {});
  }

  res.status(201).json({
    ...review,
    reviewerName: reviewer?.name ?? null,
    reviewerAvatarUrl: reviewer?.avatarUrl ?? null,
    revieweeName: reviewee?.name ?? null,
  });
});

export default router;
