import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, jobsTable, categoriesTable, claimsTable, creditBalancesTable, creditTransactionsTable } from "@workspace/db";
import { eq, count, desc, and, sql } from "drizzle-orm";
import {
  AdminListUsersQueryParams,
  AdminUpdateUserBody,
  AdminUpdateUserParams,
  AdminDeleteUserParams,
  AdminListJobsQueryParams,
} from "@workspace/api-zod";
import { requireRole } from "../middlewares/require-auth.js";
import { runMonthlyRenewal } from "../stripeStorage.js";
import { logger } from "../lib/logger.js";

const router = Router();

function buildUserResponse(u: typeof usersTable.$inferSelect) {
  return {
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
  };
}

// GET /api/admin/users
router.get("/admin/users", requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = AdminListUsersQueryParams.safeParse(req.query);
  const page = Math.max(1, Number(parsed.data?.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(parsed.data?.limit ?? 20)));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (parsed.data?.role) {
    conditions.push(eq(usersTable.role, parsed.data.role as typeof usersTable.$inferSelect["role"]));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const users = await db
    .select()
    .from(usersTable)
    .where(whereClause)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db.select({ total: count() }).from(usersTable).where(whereClause);

  res.status(200).json({
    users: users.map(buildUserResponse),
    total: Number(totalRow?.total ?? 0),
    page,
    limit,
  });
});

// PUT /api/admin/users/:id
router.put("/admin/users/:id", requireRole("admin"), async (req, res): Promise<void> => {
  const paramParsed = AdminUpdateUserParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid id" });
    return;
  }

  const bodyParsed = AdminUpdateUserBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "validation_error", message: bodyParsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = { ...bodyParsed.data, updatedAt: sql`NOW()` };

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, paramParsed.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  res.status(200).json(buildUserResponse(updated));
});

// DELETE /api/admin/users/:id
router.delete("/admin/users/:id", requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = AdminDeleteUserParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid id" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, parsed.data.id));
  res.status(200).json({ success: true, message: "User deleted" });
});

// GET /api/admin/jobs
router.get("/admin/jobs", requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = AdminListJobsQueryParams.safeParse(req.query);
  const page = Math.max(1, Number(parsed.data?.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(parsed.data?.limit ?? 20)));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (parsed.data?.status) {
    const validStatuses = ["open", "matched", "in_progress", "completed", "cancelled"];
    if (validStatuses.includes(parsed.data.status as string)) {
      conditions.push(eq(jobsTable.status, parsed.data.status as typeof jobsTable.$inferSelect["status"]));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const jobs = await db
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
      scheduledFor: jobsTable.scheduledFor,
      createdAt: jobsTable.createdAt,
      claimCount: count(claimsTable.id),
    })
    .from(jobsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, jobsTable.categoryId))
    .leftJoin(usersTable, eq(usersTable.id, jobsTable.homeownerId))
    .leftJoin(claimsTable, eq(claimsTable.jobId, jobsTable.id))
    .where(whereClause)
    .groupBy(jobsTable.id, categoriesTable.name, usersTable.name)
    .orderBy(desc(jobsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db.select({ total: count() }).from(jobsTable).where(whereClause);

  res.status(200).json({
    jobs: jobs.map((j) => ({ ...j, claimCount: Number(j.claimCount) })),
    total: Number(totalRow?.total ?? 0),
    page,
    limit,
  });
});

// GET /api/admin/credits — list all tradie credit balances
router.get("/admin/credits", requireRole("admin"), async (_req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        balance: creditBalancesTable.balance,
        updatedAt: creditBalancesTable.updatedAt,
      })
      .from(usersTable)
      .leftJoin(creditBalancesTable, eq(creditBalancesTable.userId, usersTable.id))
      .where(sql`${usersTable.role} = 'tradie'`)
      .orderBy(desc(creditBalancesTable.balance));

    res.json({ tradies: rows });
  } catch (err) {
    logger.error({ err }, "Failed to fetch admin credits");
    res.status(500).json({ error: "server_error" });
  }
});

// POST /api/admin/credits/renew — manually trigger monthly renewal
router.post("/admin/credits/renew", requireRole("admin"), async (_req, res): Promise<void> => {
  try {
    logger.info("Admin triggered monthly credit renewal");
    const result = await runMonthlyRenewal();
    logger.info(result, "Admin monthly renewal complete");
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error({ err }, "Admin monthly renewal failed");
    res.status(500).json({ error: "server_error", message: "Renewal failed" });
  }
});

// POST /api/admin/credits/grant — manually grant credits to a tradie
router.post("/admin/credits/grant", requireRole("admin"), async (req, res): Promise<void> => {
  const { userId, amount, reason } = req.body as { userId?: number; amount?: number; reason?: string };
  if (!userId || !amount || amount <= 0) {
    res.status(400).json({ error: "validation_error", message: "userId and positive amount are required" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user || user.role !== "tradie") {
      res.status(404).json({ error: "not_found", message: "Tradie not found" });
      return;
    }
    await db.insert(creditBalancesTable).values({ userId, balance: 0 }).onConflictDoNothing();
    await db.update(creditBalancesTable)
      .set({ balance: sql`${creditBalancesTable.balance} + ${amount}`, updatedAt: sql`NOW()` })
      .where(eq(creditBalancesTable.userId, userId));
    await db.insert(creditTransactionsTable).values({
      userId,
      type: "refund",
      amount,
      description: reason ?? `Admin credit grant: ${amount} credits`,
    });
    const [bal] = await db.select({ balance: creditBalancesTable.balance }).from(creditBalancesTable).where(eq(creditBalancesTable.userId, userId));
    res.json({ success: true, newBalance: bal?.balance ?? 0 });
  } catch (err) {
    logger.error({ err }, "Admin credit grant failed");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
