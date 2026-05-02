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
import { eq, count, and, inArray, desc } from "drizzle-orm";
import { requireRole } from "../middlewares/require-auth.js";

const router = Router();

// GET /api/dashboard/homeowner
router.get("/dashboard/homeowner", requireRole("homeowner", "admin"), async (req, res): Promise<void> => {
  const userId = req.user!.userId;

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

  const [pendingClaims] = await db
    .select({ count: count() })
    .from(claimsTable)
    .leftJoin(jobsTable, eq(jobsTable.id, claimsTable.jobId))
    .where(and(eq(jobsTable.homeownerId, userId), eq(claimsTable.status, "pending")));

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
    })
    .from(jobsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, jobsTable.categoryId))
    .where(eq(jobsTable.homeownerId, userId))
    .orderBy(desc(jobsTable.createdAt))
    .limit(5);

  res.status(200).json({
    totalJobs: Number(totals?.totalJobs ?? 0),
    openJobs: statusMap["open"] ?? 0,
    inProgressJobs: statusMap["in_progress"] ?? 0,
    completedJobs: statusMap["completed"] ?? 0,
    totalSpent: 0,
    recentJobs: recentJobs.map((j) => ({ ...j, homeownerName: null, claimCount: 0 })),
    pendingClaims: Number(pendingClaims?.count ?? 0),
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

  // Recent reviews received by this tradie (last 3)
  const recentReviews = await db
    .select({
      id: reviewsTable.id,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      reviewerName: usersTable.name,
      createdAt: reviewsTable.createdAt,
    })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(usersTable.id, reviewsTable.reviewerId))
    .where(eq(reviewsTable.revieweeId, userId))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(3);

  // Tradie's registered skill categories
  const myCategories = await db
    .select({ id: categoriesTable.id, name: categoriesTable.name })
    .from(tradieSkillsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, tradieSkillsTable.categoryId))
    .where(eq(tradieSkillsTable.tradieId, userId));

  // Available jobs (open or matched)
  const availableJobs = await db
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
    })
    .from(jobsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, jobsTable.categoryId))
    .where(inArray(jobsTable.status, ["open", "matched"]))
    .orderBy(desc(jobsTable.createdAt))
    .limit(10);

  // Profile completion score (20 pts each: name always set, phone, bio, suburb, skills)
  const hasPhone = !!me?.phone;
  const hasBio = !!me?.bio;
  const hasSuburb = !!me?.suburb;
  const hasSkills = myCategories.length > 0;
  const profileCompletion = [true, hasPhone, hasBio, hasSuburb, hasSkills].filter(Boolean).length * 20;

  const pendingCount = statusMap["pending"] ?? 0;
  const acceptedCount = statusMap["accepted"] ?? 0;

  res.status(200).json({
    activeJobs: pendingCount + acceptedCount,
    pendingCount,
    acceptedCount,
    completedJobs: statusMap["completed"] ?? 0,
    totalEarnings: 0,
    availableLeads: availableJobs.length,
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
      reviewerName: r.reviewerName ?? null,
      createdAt: r.createdAt,
    })),
    myCategories: myCategories
      .filter((c) => c.id != null && c.name != null)
      .map((c) => ({ id: c.id!, name: c.name! })),
    availableJobs: availableJobs.map((j) => ({ ...j, homeownerName: null, claimCount: 0 })),
  });
});

// GET /api/dashboard/admin
router.get("/dashboard/admin", requireRole("admin"), async (req, res): Promise<void> => {
  const [userCounts] = await db.select({ total: count() }).from(usersTable);

  const roleCounts = await db
    .select({ role: usersTable.role, cnt: count() })
    .from(usersTable)
    .groupBy(usersTable.role);

  const roleMap = Object.fromEntries(roleCounts.map((r) => [r.role, Number(r.cnt)]));

  const [jobCounts] = await db.select({ total: count() }).from(jobsTable);

  const jobStatusCounts = await db
    .select({ status: jobsTable.status, cnt: count() })
    .from(jobsTable)
    .groupBy(jobsTable.status);

  const jobStatusMap = Object.fromEntries(jobStatusCounts.map((r) => [r.status, Number(r.cnt)]));

  const [catCount] = await db.select({ total: count() }).from(categoriesTable);

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
    })
    .from(jobsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, jobsTable.categoryId))
    .orderBy(desc(jobsTable.createdAt))
    .limit(5);

  const recentUsers = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      phone: usersTable.phone,
      suburb: usersTable.suburb,
      postcode: usersTable.postcode,
      bio: usersTable.bio,
      avatarUrl: usersTable.avatarUrl,
      rating: usersTable.rating,
      reviewCount: usersTable.reviewCount,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(5);

  res.status(200).json({
    totalUsers: Number(userCounts?.total ?? 0),
    totalHomeowners: roleMap["homeowner"] ?? 0,
    totalTradies: roleMap["tradie"] ?? 0,
    totalJobs: Number(jobCounts?.total ?? 0),
    openJobs: jobStatusMap["open"] ?? 0,
    completedJobs: jobStatusMap["completed"] ?? 0,
    totalCategories: Number(catCount?.total ?? 0),
    recentJobs: recentJobs.map((j) => ({ ...j, homeownerName: null, claimCount: 0 })),
    recentUsers,
  });
});

export default router;
