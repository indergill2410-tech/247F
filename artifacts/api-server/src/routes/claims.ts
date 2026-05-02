import { Router } from "express";
import { db } from "@workspace/db";
import { claimsTable, jobsTable, usersTable, notificationsTable, conversationsTable } from "@workspace/db";
import { eq, and, count, inArray, desc, sql } from "drizzle-orm";
import {
  ClaimJobParams,
  ClaimJobBody,
  UpdateClaimParams,
  UpdateClaimBody,
  WithdrawClaimParams,
  ListJobClaimsParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/require-auth.js";
import { logger } from "../lib/logger.js";

const MAX_CLAIMS_PER_JOB = 5;
const MAX_ACTIVE_JOBS_PER_TRADIE = 11;

const router = Router();

function buildClaimResponse(claim: {
  id: number;
  jobId: number;
  tradieId: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn" | "completed";
  message: string | null;
  proposedPrice: number | null;
  createdAt: Date;
  tradieName?: string | null;
  tradieRating?: number | null;
  tradieReviewCount?: number | null;
  tradieSuburb?: string | null;
  tradieAvatarUrl?: string | null;
}) {
  return {
    id: claim.id,
    jobId: claim.jobId,
    tradieId: claim.tradieId,
    tradieName: claim.tradieName ?? null,
    tradieRating: claim.tradieRating ?? null,
    tradieReviewCount: claim.tradieReviewCount ?? 0,
    tradieSuburb: claim.tradieSuburb ?? null,
    tradieAvatarUrl: claim.tradieAvatarUrl ?? null,
    status: claim.status,
    message: claim.message,
    proposedPrice: claim.proposedPrice,
    createdAt: claim.createdAt,
  };
}

// GET /api/jobs/:jobId/claims
router.get("/jobs/:jobId/claims", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListJobClaimsParams.safeParse({ jobId: Number(req.params.jobId) });
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid jobId" });
    return;
  }

  const claims = await db
    .select({
      id: claimsTable.id,
      jobId: claimsTable.jobId,
      tradieId: claimsTable.tradieId,
      tradieName: usersTable.name,
      tradieRating: usersTable.rating,
      tradieReviewCount: usersTable.reviewCount,
      tradieSuburb: usersTable.suburb,
      tradieAvatarUrl: usersTable.avatarUrl,
      status: claimsTable.status,
      message: claimsTable.message,
      proposedPrice: claimsTable.proposedPrice,
      createdAt: claimsTable.createdAt,
    })
    .from(claimsTable)
    .leftJoin(usersTable, eq(usersTable.id, claimsTable.tradieId))
    .where(eq(claimsTable.jobId, parsed.data.jobId))
    .orderBy(desc(claimsTable.createdAt));

  res.status(200).json(claims.map(buildClaimResponse));
});

// POST /api/jobs/:jobId/claims
router.post("/jobs/:jobId/claims", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "tradie") {
    res.status(403).json({ error: "forbidden", message: "Only tradies can claim jobs" });
    return;
  }

  const paramParsed = ClaimJobParams.safeParse({ jobId: Number(req.params.jobId) });
  if (!paramParsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid jobId" });
    return;
  }

  const bodyParsed = ClaimJobBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "validation_error", message: bodyParsed.error.message });
    return;
  }

  const jobId = paramParsed.data.jobId;
  const tradieId = req.user!.userId;

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
  if (!job) {
    res.status(404).json({ error: "not_found", message: "Job not found" });
    return;
  }
  if (!["open", "matched"].includes(job.status)) {
    res.status(409).json({ error: "conflict", message: "Job is not available for claiming" });
    return;
  }

  const [existing] = await db
    .select({ id: claimsTable.id })
    .from(claimsTable)
    .where(and(eq(claimsTable.jobId, jobId), eq(claimsTable.tradieId, tradieId)));
  if (existing) {
    res.status(409).json({ error: "conflict", message: "You have already claimed this job" });
    return;
  }

  const [jobClaimsCount] = await db
    .select({ count: count() })
    .from(claimsTable)
    .where(and(eq(claimsTable.jobId, jobId), inArray(claimsTable.status, ["pending", "accepted"])));
  if (Number(jobClaimsCount?.count ?? 0) >= MAX_CLAIMS_PER_JOB) {
    res.status(409).json({ error: "conflict", message: `This job already has ${MAX_CLAIMS_PER_JOB} claims` });
    return;
  }

  const [tradieActiveCount] = await db
    .select({ count: count() })
    .from(claimsTable)
    .where(and(eq(claimsTable.tradieId, tradieId), inArray(claimsTable.status, ["pending", "accepted"])));
  if (Number(tradieActiveCount?.count ?? 0) >= MAX_ACTIVE_JOBS_PER_TRADIE) {
    res.status(409).json({ error: "conflict", message: `You already have ${MAX_ACTIVE_JOBS_PER_TRADIE} active jobs` });
    return;
  }

  const [claim] = await db.insert(claimsTable).values({
    jobId,
    tradieId,
    status: "pending",
    message: bodyParsed.data.message ?? null,
    proposedPrice: bodyParsed.data.proposedPrice ?? null,
  }).returning();

  if (!claim) {
    res.status(500).json({ error: "server_error", message: "Failed to create claim" });
    return;
  }

  await db.insert(notificationsTable).values({
    userId: job.homeownerId,
    type: "new_claim",
    title: "New Claim on Your Job",
    message: `A tradie has claimed your job "${job.title}". Review their offer.`,
    jobId,
  }).catch((err) => logger.error({ err }, "Failed to notify homeowner of claim"));

  const [tradie] = await db.select().from(usersTable).where(eq(usersTable.id, tradieId));
  res.status(201).json(buildClaimResponse({
    ...claim,
    tradieName: tradie?.name ?? null,
    tradieRating: tradie?.rating ?? null,
    tradieReviewCount: tradie?.reviewCount ?? 0,
    tradieSuburb: tradie?.suburb ?? null,
    tradieAvatarUrl: tradie?.avatarUrl ?? null,
  }));
});

// PUT /api/jobs/:jobId/claims/:claimId
router.put("/jobs/:jobId/claims/:claimId", requireAuth, async (req, res): Promise<void> => {
  const paramParsed = UpdateClaimParams.safeParse({
    jobId: Number(req.params.jobId),
    claimId: Number(req.params.claimId),
  });
  if (!paramParsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid params" });
    return;
  }

  const bodyParsed = UpdateClaimBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "validation_error", message: bodyParsed.error.message });
    return;
  }

  const { jobId, claimId } = paramParsed.data;
  const { status } = bodyParsed.data;

  const [claim] = await db
    .select()
    .from(claimsTable)
    .where(and(eq(claimsTable.id, claimId), eq(claimsTable.jobId, jobId)));

  if (!claim) {
    res.status(404).json({ error: "not_found", message: "Claim not found" });
    return;
  }

  const user = req.user!;
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));

  if (status === "accepted" || status === "rejected") {
    if (user.role !== "homeowner" || job?.homeownerId !== user.userId) {
      res.status(403).json({ error: "forbidden", message: "Only the homeowner can accept/reject" });
      return;
    }
  }
  if (status === "withdrawn") {
    if (user.role !== "tradie" || claim.tradieId !== user.userId) {
      res.status(403).json({ error: "forbidden", message: "Only the tradie can withdraw" });
      return;
    }
  }
  if (status === "completed") {
    if (user.role !== "homeowner" || job?.homeownerId !== user.userId) {
      res.status(403).json({ error: "forbidden", message: "Only the homeowner can mark complete" });
      return;
    }
  }

  const [updated] = await db
    .update(claimsTable)
    .set({ status: status as typeof claimsTable.$inferSelect["status"], updatedAt: sql`NOW()` })
    .where(eq(claimsTable.id, claimId))
    .returning();

  // If accepted: update job to in_progress + auto-create conversation
  if (status === "accepted" && job) {
    await db.update(jobsTable).set({ status: "in_progress", updatedAt: sql`NOW()` }).where(eq(jobsTable.id, jobId));

    // Create a conversation between homeowner and tradie (idempotent)
    const [existingConvo] = await db
      .select({ id: conversationsTable.id })
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.jobId, jobId),
          eq(conversationsTable.tradieId, claim.tradieId)
        )
      );

    if (!existingConvo) {
      await db.insert(conversationsTable).values({
        jobId,
        homeownerId: job.homeownerId,
        tradieId: claim.tradieId,
      }).catch((err) => logger.error({ err }, "Failed to create conversation"));
    }

    await db.insert(notificationsTable).values({
      userId: claim.tradieId,
      type: "claim_accepted",
      title: "Your Claim Was Accepted",
      message: `The homeowner has accepted your claim for "${job.title}". A conversation has been started — get in touch!`,
      jobId,
    }).catch(() => {});
  }

  // If completed: update job + notify
  if (status === "completed" && job) {
    await db.update(jobsTable).set({ status: "completed", updatedAt: sql`NOW()` }).where(eq(jobsTable.id, jobId));
    await db.insert(notificationsTable).values({
      userId: claim.tradieId,
      type: "job_completed",
      title: "Job Marked as Completed",
      message: `The homeowner has marked "${job.title}" as completed. You can now leave a review!`,
      jobId,
    }).catch(() => {});
  }

  const [tradie] = await db.select().from(usersTable).where(eq(usersTable.id, claim.tradieId));
  res.status(200).json(buildClaimResponse({
    ...updated,
    tradieName: tradie?.name ?? null,
    tradieRating: tradie?.rating ?? null,
    tradieReviewCount: tradie?.reviewCount ?? 0,
    tradieSuburb: tradie?.suburb ?? null,
    tradieAvatarUrl: tradie?.avatarUrl ?? null,
  }));
});

// DELETE /api/jobs/:jobId/claims/:claimId
router.delete("/jobs/:jobId/claims/:claimId", requireAuth, async (req, res): Promise<void> => {
  const parsed = WithdrawClaimParams.safeParse({
    jobId: Number(req.params.jobId),
    claimId: Number(req.params.claimId),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid params" });
    return;
  }

  const [claim] = await db
    .select()
    .from(claimsTable)
    .where(and(eq(claimsTable.id, parsed.data.claimId), eq(claimsTable.jobId, parsed.data.jobId)));

  if (!claim) {
    res.status(404).json({ error: "not_found", message: "Claim not found" });
    return;
  }

  if (req.user!.role !== "admin" && claim.tradieId !== req.user!.userId) {
    res.status(403).json({ error: "forbidden", message: "Not your claim" });
    return;
  }

  await db.update(claimsTable).set({ status: "withdrawn", updatedAt: sql`NOW()` }).where(eq(claimsTable.id, parsed.data.claimId));
  res.status(200).json({ success: true, message: "Claim withdrawn" });
});

export default router;
