import { Router } from "express";
import { db } from "@workspace/db";
import {
  jobsTable,
  claimsTable,
  usersTable,
  categoriesTable,
  reviewsTable,
  tradieSkillsTable,
  conversationsTable,
} from "@workspace/db";
import { eq, count, and, desc, sum, sql } from "drizzle-orm";
import { requireRole } from "../middlewares/require-auth.js";

const router = Router();

// GET /api/dashboard/homeowner
router.get("/dashboard/homeowner", requireRole("homeowner", "admin"), async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  // Member since
  const [me] = await db
    .select({ createdAt: usersTable.createdAt, name: usersTable.name, suburb: usersTable.suburb })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  const [totals] = await db
    .select({ totalJobs: count(jobsTable.id) })
    .from(jobsTable)
    .where(eq(jobsTable.homeownerId, userId));

  const statusCounts = await db
    .select({ status: jobsTable.status, cnt: count(jobsTable.id) })
    .from(jobsTable)
    .where(eq(jobsTable.homeownerId, userId))
    .groupBy(jobsTable.status);

  const statusMap = Object.fromEntries(statusCounts.map((r) => [r.status, Number(r.cnt)]));

  // Pending claim count (tradies awaiting response)
  const [pendingClaimsRow] = await db
    .select({ count: count() })
    .from(claimsTable)
    .leftJoin(jobsTable, eq(jobsTable.id, claimsTable.jobId))
    .where(and(eq(jobsTable.homeownerId, userId), eq(claimsTable.status, "pending")));

  // Total spent = sum of proposedPrice on accepted/completed claims on homeowner's jobs
  const [spentRow] = await db
    .select({ total: sum(claimsTable.proposedPrice) })
    .from(claimsTable)
    .leftJoin(jobsTable, eq(jobsTable.id, claimsTable.jobId))
    .where(
      and(
        eq(jobsTable.homeownerId, userId),
        sql`${claimsTable.status} IN ('accepted', 'completed')`
      )
    );

  // Recent jobs (last 8, enriched with category + claim count)
  const recentJobs = await db
    .select({
      id: jobsTable.id,
      title: jobsTable.title,
      description: jobsTable.description,
      status: jobsTable.status,
      urgency: jobsTable.urgency,
      categoryId: jobsTable.categoryId,
      categoryName: categoriesTable.name,
      homeownerId: jobsTable.homeownerId,
      suburb: jobsTable.suburb,
      postcode: jobsTable.postcode,
      address: jobsTable.address,
      imageUrls: jobsTable.imageUrls,
      budget: jobsTable.budget,
      scheduledFor: jobsTable.scheduledFor,
      createdAt: jobsTable.createdAt,
      claimCount: count(claimsTable.id),
    })
    .from(jobsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, jobsTable.categoryId))
    .leftJoin(claimsTable, eq(claimsTable.jobId, jobsTable.id))
    .where(eq(jobsTable.homeownerId, userId))
    .groupBy(jobsTable.id, categoriesTable.name)
    .orderBy(desc(jobsTable.createdAt))
    .limit(8);

  // Recent pending claims on homeowner's jobs — tradies who want the work
  const recentClaims = await db
    .select({
      id: claimsTable.id,
      jobId: claimsTable.jobId,
      tradieId: claimsTable.tradieId,
      status: claimsTable.status,
      message: claimsTable.message,
      proposedPrice: claimsTable.proposedPrice,
      createdAt: claimsTable.createdAt,
      tradieName: usersTable.name,
      tradieRating: usersTable.rating,
      tradieReviewCount: usersTable.reviewCount,
      tradieAvatarUrl: usersTable.avatarUrl,
      jobTitle: jobsTable.title,
      conversationId: conversationsTable.id,
    })
    .from(claimsTable)
    .leftJoin(jobsTable, eq(jobsTable.id, claimsTable.jobId))
    .leftJoin(usersTable, eq(usersTable.id, claimsTable.tradieId))
    .leftJoin(
      conversationsTable,
      and(
        eq(conversationsTable.jobId, claimsTable.jobId),
        eq(conversationsTable.tradieId, claimsTable.tradieId)
      )
    )
    .where(
      and(
        eq(jobsTable.homeownerId, userId),
        eq(claimsTable.status, "pending")
      )
    )
    .orderBy(desc(claimsTable.createdAt))
    .limit(10);

  res.status(200).json({
    totalJobs: Number(totals?.totalJobs ?? 0),
    openJobs: statusMap["open"] ?? 0,
    inProgressJobs: statusMap["in_progress"] ?? 0,
    completedJobs: statusMap["completed"] ?? 0,
    cancelledJobs: statusMap["cancelled"] ?? 0,
    totalSpent: Number(spentRow?.total ?? 0),
    pendingClaims: Number(pendingClaimsRow?.count ?? 0),
    memberSince: me?.createdAt ?? new Date(),
    recentJobs: recentJobs.map((j) => ({
      ...j,
      homeownerName: null,
      claimCount: Number(j.claimCount),
    })),
    recentClaims: recentClaims.map((c) => ({
      id: c.id,
      jobId: c.jobId,
      tradieId: c.tradieId,
      status: c.status,
      message: c.message ?? null,
      proposedPrice: c.proposedPrice ?? null,
      createdAt: c.createdAt,
      tradieName: c.tradieName ?? null,
      tradieRating: c.tradieRating ?? null,
      tradieReviewCount: c.tradieReviewCount ?? 0,
      tradieAvatarUrl: c.tradieAvatarUrl ?? null,
      jobTitle: c.jobTitle ?? null,
      conversationId: c.conversationId ?? null,
    })),
  });
});

// GET /api/dashboard/tradie
router.get("/dashboard/tradie", requireRole("tradie", "admin"), async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  // Claim status breakdown
  const statusCounts = await db
    .select({ status: claimsTable.status, cnt: count(claimsTable.id) })
    .from(claimsTable)
    .where(eq(claimsTable.tradieId, userId))
    .groupBy(claimsTable.status);

  const statusMap = Object.fromEntries(statusCounts.map((r) => [r.status, Number(r.cnt)]));

  // Tradie profile
  const [me] = await db
    .select({
      rating: usersTable.rating,
      reviewCount: usersTable.reviewCount,
      phone: usersTable.phone,
      bio: usersTable.bio,
      suburb: usersTable.suburb,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  // All accepted (in-progress) claims — no limit, for the dedicated accepted jobs card
  const acceptedClaims = await db
    .select({
      id: claimsTable.id,
      jobId: claimsTable.jobId,
      tradieId: claimsTable.tradieId,
      status: claimsTable.status,
      message: claimsTable.message,
      proposedPrice: claimsTable.proposedPrice,
      createdAt: claimsTable.createdAt,
      jobTitle: jobsTable.title,
      jobSuburb: jobsTable.suburb,
      jobUrgency: jobsTable.urgency,
      conversationId: conversationsTable.id,
    })
    .from(claimsTable)
    .leftJoin(jobsTable, eq(jobsTable.id, claimsTable.jobId))
    .leftJoin(
      conversationsTable,
      and(
        eq(conversationsTable.jobId, claimsTable.jobId),
        eq(conversationsTable.tradieId, claimsTable.tradieId)
      )
    )
    .where(and(eq(claimsTable.tradieId, userId), eq(claimsTable.status, "accepted")))
    .orderBy(desc(claimsTable.createdAt));

  // Recent claims joined with job details + conversation IDs
  const recentClaims = await db
    .select({
      id: claimsTable.id,
      jobId: claimsTable.jobId,
      tradieId: claimsTable.tradieId,
      status: claimsTable.status,
      message: claimsTable.message,
      proposedPrice: claimsTable.proposedPrice,
      createdAt: claimsTable.createdAt,
      jobTitle: jobsTable.title,
      jobSuburb: jobsTable.suburb,
      jobUrgency: jobsTable.urgency,
      conversationId: conversationsTable.id,
    })
    .from(claimsTable)
    .leftJoin(jobsTable, eq(jobsTable.id, claimsTable.jobId))
    .leftJoin(
      conversationsTable,
      and(
        eq(conversationsTable.jobId, claimsTable.jobId),
        eq(conversationsTable.tradieId, claimsTable.tradieId)
      )
    )
    .where(eq(claimsTable.tradieId, userId))
    .orderBy(desc(claimsTable.createdAt))
    .limit(10);

  // Recent reviews received
  const recentReviews = await db
    .select({
      id: reviewsTable.id,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
      reviewerName: usersTable.name,
    })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(usersTable.id, reviewsTable.reviewerId))
    .where(eq(reviewsTable.revieweeId, userId))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(3);

  // My skill categories
  const myCategories = await db
    .select({ id: categoriesTable.id, name: categoriesTable.name })
    .from(tradieSkillsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, tradieSkillsTable.categoryId))
    .where(eq(tradieSkillsTable.tradieId, userId));

  // Available jobs (open, not already claimed by this tradie)
  const myClaimedJobIds = recentClaims.map((c) => c.jobId);
  const availableJobs = await db
    .select({
      id: jobsTable.id,
      title: jobsTable.title,
      description: jobsTable.description,
      status: jobsTable.status,
      urgency: jobsTable.urgency,
      categoryId: jobsTable.categoryId,
      categoryName: categoriesTable.name,
      suburb: jobsTable.suburb,
      postcode: jobsTable.postcode,
      budget: jobsTable.budget,
      scheduledFor: jobsTable.scheduledFor,
      createdAt: jobsTable.createdAt,
      creditCost: jobsTable.creditCost,
      sizeBand: jobsTable.sizeBand,
    })
    .from(jobsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, jobsTable.categoryId))
    .where(
      and(
        eq(jobsTable.status, "open"),
        sql`${jobsTable.id} NOT IN (
          SELECT job_id FROM claims WHERE tradie_id = ${userId}
        )`
      )
    )
    .orderBy(desc(jobsTable.createdAt))
    .limit(10);

  // Profile completion score
  const profileFields = [
    me?.phone,
    me?.bio,
    me?.suburb,
    myCategories.length > 0,
    (me?.reviewCount ?? 0) > 0,
  ];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  const pendingCount = statusMap["pending"] ?? 0;
  const acceptedCount = statusMap["accepted"] ?? 0;

  res.status(200).json({
    pendingCount,
    acceptedCount,
    activeJobs: pendingCount + acceptedCount,
    completedJobs: statusMap["completed"] ?? 0,
    myRating: me?.rating ?? null,
    myReviewCount: me?.reviewCount ?? 0,
    memberSince: me?.createdAt ?? new Date(),
    profileCompletion,
    acceptedClaims: acceptedClaims.map((c) => ({
      id: c.id,
      jobId: c.jobId,
      tradieId: c.tradieId,
      status: c.status,
      message: c.message ?? null,
      proposedPrice: c.proposedPrice ?? null,
      createdAt: c.createdAt,
      jobTitle: c.jobTitle ?? null,
      jobSuburb: c.jobSuburb ?? null,
      jobUrgency: c.jobUrgency ?? null,
      conversationId: c.conversationId ?? null,
    })),
    recentClaims: recentClaims.map((c) => ({
      id: c.id,
      jobId: c.jobId,
      tradieId: c.tradieId,
      status: c.status,
      message: c.message ?? null,
      proposedPrice: c.proposedPrice ?? null,
      createdAt: c.createdAt,
      jobTitle: c.jobTitle ?? null,
      jobSuburb: c.jobSuburb ?? null,
      jobUrgency: c.jobUrgency ?? null,
      conversationId: c.conversationId ?? null,
    })),
    recentReviews: recentReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment ?? null,
      createdAt: r.createdAt,
      reviewerName: r.reviewerName ?? null,
    })),
    myCategories: myCategories
      .filter((c) => c.id != null && c.name != null)
      .map((c) => ({ id: c.id!, name: c.name! })),
    availableJobs: availableJobs.map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      status: j.status,
      urgency: j.urgency,
      categoryId: j.categoryId,
      categoryName: j.categoryName ?? null,
      suburb: j.suburb,
      postcode: j.postcode,
      budget: j.budget,
      scheduledFor: j.scheduledFor,
      createdAt: j.createdAt,
      creditCost: j.creditCost ?? null,
      sizeBand: j.sizeBand ?? null,
    })),
  });
});

// GET /api/dashboard/admin
router.get("/dashboard/admin", requireRole("admin"), async (req, res): Promise<void> => {
  const [[totalUsersRow], [totalHomeownersRow], [totalTradiesRow], [verifiedTradiesRow], [pendingVerificationRow], [totalJobsRow], [openJobsRow], [completedJobsRow], [totalCategoriesRow]] = await Promise.all([
    db.select({ total: count() }).from(usersTable),
    db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "homeowner")),
    db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "tradie")),
    db.select({ total: count() }).from(usersTable).where(and(eq(usersTable.role, "tradie"), eq(usersTable.isVerified, true))),
    db.select({ total: count() }).from(usersTable).where(and(eq(usersTable.role, "tradie"), eq(usersTable.isVerified, false))),
    db.select({ total: count() }).from(jobsTable),
    db.select({ total: count() }).from(jobsTable).where(eq(jobsTable.status, "open")),
    db.select({ total: count() }).from(jobsTable).where(eq(jobsTable.status, "completed")),
    db.select({ total: count() }).from(categoriesTable),
  ]);

  const recentJobs = await db
    .select({
      id: jobsTable.id,
      title: jobsTable.title,
      status: jobsTable.status,
      urgency: jobsTable.urgency,
      categoryId: jobsTable.categoryId,
      categoryName: categoriesTable.name,
      suburb: jobsTable.suburb,
      postcode: jobsTable.postcode,
      budget: jobsTable.budget,
      scheduledFor: jobsTable.scheduledFor,
      createdAt: jobsTable.createdAt,
    })
    .from(jobsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, jobsTable.categoryId))
    .orderBy(desc(jobsTable.createdAt))
    .limit(5);

  const recentUsers = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(5);

  const pendingTradies = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.role, "tradie"), eq(usersTable.isVerified, false), eq(usersTable.isActive, true)))
    .orderBy(desc(usersTable.createdAt))
    .limit(50);

  const mapUser = (u: typeof usersTable.$inferSelect) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone ?? null,
    suburb: u.suburb ?? null,
    postcode: u.postcode ?? null,
    bio: u.bio ?? null,
    avatarUrl: u.avatarUrl ?? null,
    rating: u.rating ?? null,
    reviewCount: u.reviewCount,
    isActive: u.isActive,
    isVerified: u.isVerified,
    createdAt: u.createdAt,
  });

  res.status(200).json({
    totalUsers: Number(totalUsersRow?.total ?? 0),
    totalHomeowners: Number(totalHomeownersRow?.total ?? 0),
    totalTradies: Number(totalTradiesRow?.total ?? 0),
    verifiedTradies: Number(verifiedTradiesRow?.total ?? 0),
    pendingVerification: Number(pendingVerificationRow?.total ?? 0),
    totalJobs: Number(totalJobsRow?.total ?? 0),
    openJobs: Number(openJobsRow?.total ?? 0),
    completedJobs: Number(completedJobsRow?.total ?? 0),
    totalCategories: Number(totalCategoriesRow?.total ?? 0),
    recentJobs: recentJobs.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      urgency: j.urgency,
      categoryId: j.categoryId,
      categoryName: j.categoryName ?? null,
      suburb: j.suburb,
      postcode: j.postcode,
      budget: j.budget,
      scheduledFor: j.scheduledFor,
      createdAt: j.createdAt,
    })),
    recentUsers: recentUsers.map(mapUser),
    pendingTradies: pendingTradies.map(mapUser),
  });
});

export default router;

