import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, jobsTable, categoriesTable, claimsTable } from "@workspace/db";
import { eq, count, desc, and, sql } from "drizzle-orm";
import { AdminListUsersQueryParams, AdminUpdateUserBody, AdminUpdateUserParams, AdminDeleteUserParams, AdminListJobsQueryParams } from "@workspace/api-zod";
import { requireRole } from "../middlewares/require-auth.js";

const router = Router();

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
    .where(whereClause)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db.select({ total: count() }).from(usersTable).where(whereClause);

  res.status(200).json({
    users,
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
    .returning({
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
    });

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  res.status(200).json(updated);
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

export default router;
