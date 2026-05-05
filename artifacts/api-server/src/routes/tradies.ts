import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, tradieSkillsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { eq, and, ilike, or, sql, desc, count } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { requireAuth } from "../middlewares/require-auth.js";

const router = Router();

// GET /api/tradies — browse public verified tradies
router.get("/tradies", async (req, res): Promise<void> => {
  const { search, categoryId, suburb, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  try {
    const conditions = [
      sql`${usersTable.role} = 'tradie'`,
      sql`${usersTable.isActive} = true`,
      sql`${usersTable.isVerified} = true`,
    ];

    if (search) {
      conditions.push(
        or(
          ilike(usersTable.name, `%${search}%`),
          ilike(usersTable.bio, `%${search}%`)
        )!
      );
    }
    if (suburb) {
      conditions.push(ilike(usersTable.suburb, `%${suburb}%`));
    }

    let baseQuery = db
      .selectDistinct({
        id: usersTable.id,
        name: usersTable.name,
        suburb: usersTable.suburb,
        postcode: usersTable.postcode,
        bio: usersTable.bio,
        avatarUrl: usersTable.avatarUrl,
        rating: usersTable.rating,
        reviewCount: usersTable.reviewCount,
        isVerified: usersTable.isVerified,
        primaryTrade: usersTable.primaryTrade,
        secondaryTrades: usersTable.secondaryTrades,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .$dynamic();

    if (categoryId) {
      baseQuery = baseQuery.innerJoin(
        tradieSkillsTable,
        and(
          eq(tradieSkillsTable.tradieId, usersTable.id),
          eq(tradieSkillsTable.categoryId, parseInt(categoryId))
        )
      ) as typeof baseQuery;
    }

    const tradies = await baseQuery
      .where(and(...conditions))
      .orderBy(desc(usersTable.rating), desc(usersTable.reviewCount))
      .limit(limitNum)
      .offset(offset);

    // count
    const [{ total }] = await db
      .select({ total: count() })
      .from(usersTable)
      .where(and(...conditions));

    // fetch categories for each tradie
    const ids = tradies.map((t) => t.id);
    let cats: { tradieId: number; categoryId: number; name: string; icon: string }[] = [];
    if (ids.length > 0) {
      cats = await db
        .select({
          tradieId: tradieSkillsTable.tradieId,
          categoryId: categoriesTable.id,
          name: categoriesTable.name,
          icon: categoriesTable.icon,
        })
        .from(tradieSkillsTable)
        .innerJoin(categoriesTable, eq(categoriesTable.id, tradieSkillsTable.categoryId))
        .where(sql`${tradieSkillsTable.tradieId} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}]::int[])`);
    }

    const catsByTradie = cats.reduce<Record<number, { id: number; name: string; icon: string }[]>>((acc, c) => {
      if (!acc[c.tradieId]) acc[c.tradieId] = [];
      acc[c.tradieId].push({ id: c.categoryId, name: c.name, icon: c.icon });
      return acc;
    }, {});

    const result = tradies.map((t) => ({
      ...t,
      reviews: [] as unknown[],
      categories: catsByTradie[t.id] ?? [],
    }));

    res.json({ tradies: result, total: Number(total), page: pageNum, limit: limitNum });
  } catch (err) {
    logger.error({ err }, "Failed to list tradies");
    res.status(500).json({ error: "server_error" });
  }
});

// GET /api/tradies/:id/full-profile — admin only, returns email + phone + full trade info
router.get("/tradies/:id/full-profile", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "admin") {
    res.status(403).json({ error: "forbidden", message: "Admin access required" });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "bad_request" }); return; }

  try {
    const [tradie] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        suburb: usersTable.suburb,
        postcode: usersTable.postcode,
        bio: usersTable.bio,
        avatarUrl: usersTable.avatarUrl,
        rating: usersTable.rating,
        reviewCount: usersTable.reviewCount,
        isVerified: usersTable.isVerified,
        primaryTrade: usersTable.primaryTrade,
        secondaryTrades: usersTable.secondaryTrades,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(and(eq(usersTable.id, id), sql`${usersTable.role} = 'tradie'`));

    if (!tradie) { res.status(404).json({ error: "not_found", message: "Tradie not found" }); return; }

    const categories = await db
      .select({ id: categoriesTable.id, name: categoriesTable.name, icon: categoriesTable.icon })
      .from(tradieSkillsTable)
      .innerJoin(categoriesTable, eq(categoriesTable.id, tradieSkillsTable.categoryId))
      .where(eq(tradieSkillsTable.tradieId, id));

    const reviews = await db
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
      .where(eq(reviewsTable.revieweeId, id))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(20);

    res.json({ ...tradie, secondaryTrades: tradie.secondaryTrades ?? [], categories, reviews });
  } catch (err) {
    logger.error({ err }, "Failed to fetch tradie full profile");
    res.status(500).json({ error: "server_error" });
  }
});

// GET /api/tradies/:id — single tradie public profile with categories + recent reviews
router.get("/tradies/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "bad_request" }); return; }

  try {
    const [tradie] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        suburb: usersTable.suburb,
        postcode: usersTable.postcode,
        bio: usersTable.bio,
        avatarUrl: usersTable.avatarUrl,
        rating: usersTable.rating,
        reviewCount: usersTable.reviewCount,
        isVerified: usersTable.isVerified,
        primaryTrade: usersTable.primaryTrade,
        secondaryTrades: usersTable.secondaryTrades,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(and(eq(usersTable.id, id), sql`${usersTable.role} = 'tradie'`, sql`${usersTable.isActive} = true`));

    if (!tradie) { res.status(404).json({ error: "not_found", message: "Tradie not found" }); return; }

    const categories = await db
      .select({ id: categoriesTable.id, name: categoriesTable.name, icon: categoriesTable.icon })
      .from(tradieSkillsTable)
      .innerJoin(categoriesTable, eq(categoriesTable.id, tradieSkillsTable.categoryId))
      .where(eq(tradieSkillsTable.tradieId, id));

    const reviews = await db
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
      .where(eq(reviewsTable.revieweeId, id))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(10);

    res.json({ ...tradie, secondaryTrades: tradie.secondaryTrades ?? [], categories, reviews });
  } catch (err) {
    logger.error({ err }, "Failed to fetch tradie profile");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
