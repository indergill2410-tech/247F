import { Router } from "express";
import { db } from "@workspace/db";
import {
  jobsTable,
  usersTable,
  categoriesTable,
  claimsTable,
  tradieSkillsTable,
  reviewsTable,
} from "@workspace/db";
import { eq, and, sql, count, desc, asc } from "drizzle-orm";
import {
  CreateJobBody,
  ListJobsQueryParams,
  UpdateJobBody,
  GetJobParams,
  UpdateJobParams,
  DeleteJobParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/require-auth.js";
import { runMatchingEngine } from "../lib/matching.js";
import { logger } from "../lib/logger.js";
import { estimateCreditCost, BAND_RANGE, type SizeBand } from "../lib/openai.js";

const router = Router();

function buildJobResponse(job: {
  id: number;
  title: string;
  description: string;
  status: "open" | "matched" | "in_progress" | "completed" | "cancelled";
  urgency: "standard" | "urgent" | "emergency";
  categoryId: number;
  homeownerId: number;
  suburb: string | null;
  postcode: string | null;
  address: string | null;
  imageUrls: string[] | null;
  budget: number | null;
  sizeBand?: "small" | "medium" | "large" | "premium" | null;
  creditCost?: number | null;
  scheduledFor: Date | null;
  createdAt: Date;
  categoryName?: string | null;
  homeownerName?: string | null;
  claimCount?: number;
}) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    status: job.status,
    urgency: job.urgency,
    categoryId: job.categoryId,
    categoryName: job.categoryName ?? null,
    homeownerId: job.homeownerId,
    homeownerName: job.homeownerName ?? null,
    suburb: job.suburb,
    postcode: job.postcode,
    address: job.address,
    imageUrls: job.imageUrls,
    budget: job.budget,
    sizeBand: job.sizeBand ?? null,
    creditCost: job.creditCost ?? null,
    claimCount: job.claimCount ?? 0,
    createdAt: job.createdAt,
    scheduledFor: job.scheduledFor,
  };
}

// GET /api/jobs
router.get("/jobs", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const query = req.query;

  // Build base query with joins
  const baseQuery = db
    .select({
      id: jobsTable.id,
      title: jobsTable.title,
      description: jobsTable.description,
      status: jobsTable.status,
      urgency: jobsTable.urgency,
      categoryId: jobsTable.categoryId,
      categoryName: categoriesTable.name,
      homeownerId: jobsTable.homeownerId,
      homeownerName: usersTable.name,
      suburb: jobsTable.suburb,
      postcode: jobsTable.postcode,
      address: jobsTable.address,
      imageUrls: jobsTable.imageUrls,
      budget: jobsTable.budget,
      sizeBand: jobsTable.sizeBand,
      creditCost: jobsTable.creditCost,
      scheduledFor: jobsTable.scheduledFor,
      createdAt: jobsTable.createdAt,
      claimCount: count(claimsTable.id),
    })
    .from(jobsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, jobsTable.categoryId))
    .leftJoin(usersTable, eq(usersTable.id, jobsTable.homeownerId))
    .leftJoin(claimsTable, eq(claimsTable.jobId, jobsTable.id));

  const conditions = [];

  // Role-based filtering
  if (user.role === "homeowner") {
    conditions.push(eq(jobsTable.homeownerId, user.userId));
  }

  // Tradie "My trades" filter — limit to jobs whose category name matches the tradie's primary/secondary trades
  if (user.role === "tradie" && query.filter === "my_trades") {
    const [tradie] = await db
      .select({ primaryTrade: usersTable.primaryTrade, secondaryTrades: usersTable.secondaryTrades })
      .from(usersTable)
      .where(eq(usersTable.id, user.userId));

    // "Handyman / general repairs" sees all jobs — no filter applied
    if (tradie && tradie.primaryTrade !== "Handyman / general repairs") {
      const allTrades = [
        ...(tradie.primaryTrade ? [tradie.primaryTrade.toLowerCase()] : []),
        ...(tradie.secondaryTrades ?? []).map((t) => t.toLowerCase()),
      ];
      if (allTrades.length > 0) {
        conditions.push(
          sql`LOWER(${categoriesTable.name}) = ANY(ARRAY[${sql.join(allTrades.map((t) => sql`${t}`), sql`, `)}]::text[])`
        );
      }
    }
  }
  // Tradies see all open/matched jobs plus their claimed ones
  // Admin sees all

  if (query.status) {
    const validStatuses = ["open", "matched", "in_progress", "completed", "cancelled"];
    if (validStatuses.includes(query.status as string)) {
      conditions.push(eq(jobsTable.status, query.status as typeof jobsTable.$inferSelect["status"]));
    }
  }

  if (query.categoryId) {
    conditions.push(eq(jobsTable.categoryId, Number(query.categoryId)));
  }

  const validUrgencies = ["standard", "urgent", "emergency"];
  if (query.urgency && validUrgencies.includes(query.urgency as string)) {
    conditions.push(eq(jobsTable.urgency, query.urgency as typeof jobsTable.$inferSelect["urgency"]));
  }

  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20)));
  const offset = (page - 1) * limit;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Sort order
  const sortBy = query.sortBy as string | undefined;
  const orderClause =
    sortBy === "oldest"          ? asc(jobsTable.createdAt) :
    sortBy === "budget_high"     ? desc(sql`${jobsTable.budget} NULLS LAST`) :
    sortBy === "budget_low"      ? asc(sql`${jobsTable.budget} NULLS LAST`) :
    sortBy === "urgency"         ? desc(sql`CASE ${jobsTable.urgency} WHEN 'emergency' THEN 3 WHEN 'urgent' THEN 2 ELSE 1 END`) :
    desc(jobsTable.createdAt); // default: newest

  const rows = await baseQuery
    .where(whereClause)
    .groupBy(jobsTable.id, categoriesTable.name, usersTable.name)
    .orderBy(orderClause)
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(jobsTable)
    .where(whereClause);

  res.status(200).json({
    jobs: rows.map(buildJobResponse),
    total: Number(totalRow?.total ?? 0),
    page,
    limit,
  });
});

// POST /api/jobs
router.post("/jobs", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "homeowner" && req.user!.role !== "admin") {
    res.status(403).json({ error: "forbidden", message: "Only homeowners can post jobs" });
    return;
  }

  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { title, description, categoryId, urgency, sizeBand, suburb, postcode, address, imageUrls, budget, scheduledFor } = parsed.data;

  // Fetch category name for AI sizing
  const [category] = await db
    .select({ name: categoriesTable.name })
    .from(categoriesTable)
    .where(eq(categoriesTable.id, categoryId));

  const chosenBand = (sizeBand as SizeBand | undefined) ?? "medium";

  // AI credit cost estimation — synchronous so creditCost is final before insert and never changes
  const creditCost = await estimateCreditCost({
    title,
    description,
    categoryName: category?.name ?? null,
    sizeBand: chosenBand,
    budget: budget ?? null,
    urgency,
  }).catch((err) => {
    logger.error({ err }, "Credit cost estimation failed — using band midpoint as final fallback");
    return BAND_RANGE[chosenBand].midpoint;
  });

  // Insert with final creditCost — will not change after this point
  const [job] = await db.insert(jobsTable).values({
    title,
    description,
    categoryId,
    urgency: urgency as "standard" | "urgent" | "emergency",
    sizeBand: chosenBand,
    creditCost,
    homeownerId: req.user!.userId,
    suburb: suburb ?? null,
    postcode: postcode ?? null,
    address: address ?? null,
    imageUrls: imageUrls ?? [],
    budget: budget ?? null,
    scheduledFor: scheduledFor ? new Date(scheduledFor as unknown as string) : null,
    status: "open",
  }).returning();

  if (!job) {
    res.status(500).json({ error: "server_error", message: "Failed to create job" });
    return;
  }

  // Trigger matching engine asynchronously (does not affect creditCost)
  setImmediate(() => {
    runMatchingEngine(job.id, categoryId, postcode ?? null).catch(() => {});
  });

  res.status(201).json(buildJobResponse({ ...job, claimCount: 0 }));
});

// GET /api/jobs/:id
router.get("/jobs/:id", requireAuth, async (req, res): Promise<void> => {
  const parsed = GetJobParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid id" });
    return;
  }

  const [row] = await db
    .select({
      id: jobsTable.id,
      title: jobsTable.title,
      description: jobsTable.description,
      status: jobsTable.status,
      urgency: jobsTable.urgency,
      categoryId: jobsTable.categoryId,
      categoryName: categoriesTable.name,
      homeownerId: jobsTable.homeownerId,
      homeownerName: usersTable.name,
      suburb: jobsTable.suburb,
      postcode: jobsTable.postcode,
      address: jobsTable.address,
      imageUrls: jobsTable.imageUrls,
      budget: jobsTable.budget,
      sizeBand: jobsTable.sizeBand,
      creditCost: jobsTable.creditCost,
      scheduledFor: jobsTable.scheduledFor,
      createdAt: jobsTable.createdAt,
    })
    .from(jobsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, jobsTable.categoryId))
    .leftJoin(usersTable, eq(usersTable.id, jobsTable.homeownerId))
    .where(eq(jobsTable.id, parsed.data.id));

  if (!row) {
    res.status(404).json({ error: "not_found", message: "Job not found" });
    return;
  }

  // Get claims for this job
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
    .where(eq(claimsTable.jobId, parsed.data.id))
    .orderBy(desc(claimsTable.createdAt));

  res.status(200).json({
    ...buildJobResponse({ ...row, claimCount: claims.length }),
    claims,
  });
});

// PUT /api/jobs/:id
router.put("/jobs/:id", requireAuth, async (req, res): Promise<void> => {
  const idParsed = UpdateJobParams.safeParse({ id: Number(req.params.id) });
  if (!idParsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid id" });
    return;
  }

  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  // Verify ownership or admin
  const [existing] = await db.select().from(jobsTable).where(eq(jobsTable.id, idParsed.data.id));
  if (!existing) {
    res.status(404).json({ error: "not_found", message: "Job not found" });
    return;
  }
  if (req.user!.role !== "admin" && existing.homeownerId !== req.user!.userId) {
    res.status(403).json({ error: "forbidden", message: "Not your job" });
    return;
  }

  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: sql`NOW()` };
  if (parsed.data.scheduledFor) {
    updates.scheduledFor = new Date(parsed.data.scheduledFor as unknown as string);
  }

  const [updated] = await db
    .update(jobsTable)
    .set(updates)
    .where(eq(jobsTable.id, idParsed.data.id))
    .returning();

  res.status(200).json(buildJobResponse({ ...updated, claimCount: 0 }));
});

// DELETE /api/jobs/:id
router.delete("/jobs/:id", requireAuth, async (req, res): Promise<void> => {
  const parsed = DeleteJobParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid id" });
    return;
  }

  const [existing] = await db.select().from(jobsTable).where(eq(jobsTable.id, parsed.data.id));
  if (!existing) {
    res.status(404).json({ error: "not_found", message: "Job not found" });
    return;
  }
  if (req.user!.role !== "admin" && existing.homeownerId !== req.user!.userId) {
    res.status(403).json({ error: "forbidden", message: "Not your job" });
    return;
  }

  await db.update(jobsTable).set({ status: "cancelled" }).where(eq(jobsTable.id, parsed.data.id));
  res.status(200).json({ success: true, message: "Job cancelled" });
});

// GET /api/jobs/:jobId/tradie-trust-card  — homeowner / admin only
router.get("/jobs/:jobId/tradie-trust-card", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role === "tradie") {
    res.status(403).json({ error: "forbidden", message: "Tradies cannot view trust cards" });
    return;
  }

  const jobId = Number(req.params.jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) { res.status(400).json({ error: "bad_request" }); return; }

  const [job] = await db
    .select({ id: jobsTable.id, homeownerId: jobsTable.homeownerId })
    .from(jobsTable)
    .where(eq(jobsTable.id, jobId));
  if (!job) { res.status(404).json({ error: "not_found", message: "Job not found" }); return; }
  if (user.role !== "admin" && job.homeownerId !== user.userId) {
    res.status(403).json({ error: "forbidden" }); return;
  }

  // Try accepted claim first, then fall back to most recent claim
  let activeClaim = (await db
    .select()
    .from(claimsTable)
    .where(and(eq(claimsTable.jobId, jobId), eq(claimsTable.status, "accepted")))
    .limit(1))[0];

  if (!activeClaim) {
    activeClaim = (await db
      .select()
      .from(claimsTable)
      .where(eq(claimsTable.jobId, jobId))
      .orderBy(desc(claimsTable.createdAt))
      .limit(1))[0];
  }

  if (!activeClaim) {
    res.status(404).json({ error: "not_found", message: "No tradie has responded yet" }); return;
  }

  const [tradie] = await db.select().from(usersTable).where(eq(usersTable.id, activeClaim.tradieId));
  if (!tradie) { res.status(404).json({ error: "not_found" }); return; }

  const recentReviews = await db
    .select({
      id: reviewsTable.id,
      jobId: reviewsTable.jobId,
      reviewerId: reviewsTable.reviewerId,
      reviewerName: usersTable.name,
      reviewerAvatarUrl: usersTable.avatarUrl,
      revieweeId: reviewsTable.revieweeId,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
    })
    .from(reviewsTable)
    .innerJoin(usersTable, eq(usersTable.id, reviewsTable.reviewerId))
    .where(eq(reviewsTable.revieweeId, tradie.id))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(3);

  res.json({
    tradieId: tradie.id,
    displayName: tradie.name,
    avatarUrl: tradie.avatarUrl,
    primaryTrade: tradie.primaryTrade,
    secondaryTrades: tradie.secondaryTrades ?? [],
    rating: tradie.rating,
    reviewCount: tradie.reviewCount,
    isVerified: tradie.isVerified,
    suburb: tradie.suburb,
    proposedPrice: activeClaim.proposedPrice,
    message: activeClaim.message,
    recentReviews,
    claimId: activeClaim.id,
  });
});

export default router;
