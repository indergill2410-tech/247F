import { Router } from "express";
import { db } from "@workspace/db";
import {
  jobsTable,
  claimsTable,
  usersTable,
  categoriesTable,
} from "@workspace/db";
import { eq, count, sum, and, inArray, desc, sql } from "drizzle-orm";
import { requireRole } from "../middlewares/require-auth.js";

const router = Router();

// GET /api/dashboard/homeowner
router.get("/dashboard/homeowner", requireRole("homeowner", "admin"), async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const [totals] = await db
    .select({
      totalJobs: count(jobsTable.id),
    })
    .from(jobsTable)
    .where(eq(jobsTable.homeownerId, userId));

  const statusCounts = await db
    .select({
      status: jobsTable.status,
      cnt: count(jobsTable.id),
    })
    .from(jobsTable)
    .where(eq(jobsTable.homeownerId, userId))
    .groupBy(jobsTable.status);

  const statusMap = Object.fromEntries(statusCounts.map((r) => [r.status, Number(r.cnt)]));

  // Pending claims count
  const [pendingClaims] = await db
    .select({ count: count() })
    .from(claimsTable)
    .leftJoin(jobsTable, eq(jobsTable.id, claimsTable.jobId))
    .where(and(eq(jobsTable.homeownerId, userId), eq(claimsTable.status, "pending")));

  // Recent jobs
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
    recentJobs: recentJobs.map((j) => ({
      ...j,
      homeownerName: null,
      claimCount: 0,
    })),
    pendingClaims: Number(pendingClaims?.count ?? 0),
  });
});

// GET /api/dashboard/tradie
router.get("/dashboard/tradie", requireRole("tradie", "admin"), async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const statusCounts = await db
    .select({
      status: claimsTable.status,
      cnt: count(claimsTable.id),
    })
    .from(claimsTable)
    .where(eq(claimsTable.tradieId, userId))
    .groupBy(claimsTable.status);

  const statusMap = Object.fromEntries(statusCounts.map((r) => [r.status, Number(r.cnt)]));

  const [me] = await db.select({ rating: usersTable.rating }).from(usersTable).where(eq(usersTable.id, userId));

  // Recent claims
  const recentClaims = await db
    .select({
      id: claimsTable.id,
      jobId: claimsTable.jobId,
      tradieId: claimsTable.tradieId,
      status: claimsTable.status,
      message: claimsTable.message,
      proposedPrice: claimsTable.proposedPrice,
      createdAt: claimsTable.createdAt,
    })
    .from(claimsTable)
    .where(eq(claimsTable.tradieId, userId))
    .orderBy(desc(claimsTable.createdAt))
    .limit(5);

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

  res.status(200).json({
    activeJobs: (statusMap["pending"] ?? 0) + (statusMap["accepted"] ?? 0),
    completedJobs: statusMap["completed"] ?? 0,
    totalEarnings: 0,
    availableLeads: availableJobs.length,
    myRating: me?.rating ?? null,
    recentClaims: recentClaims.map((c) => ({
      ...c,
      tradieName: null,
      tradieRating: null,
      tradieReviewCount: 0,
      tradieSuburb: null,
      tradieAvatarUrl: null,
    })),
    availableJobs: availableJobs.map((j) => ({
      ...j,
      homeownerName: null,
      claimCount: 0,
    })),
  });
});

// GET /api/dashboard/admin
router.get("/dashboard/admin", requireRole("admin"), async (req, res): Promise<void> => {
  const [userCounts] = await db
    .select({ total: count() })
    .from(usersTable);

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
