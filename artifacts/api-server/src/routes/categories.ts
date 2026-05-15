import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, jobsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { CreateCategoryBody, DeleteCategoryParams } from "@workspace/api-zod";
import { requireRole } from "../middlewares/require-auth.js";

const router = Router();

// GET /api/categories
router.get("/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      icon: categoriesTable.icon,
      description: categoriesTable.description,
      requiresLicence: categoriesTable.requiresLicence,
      jobCount: count(jobsTable.id),
    })
    .from(categoriesTable)
    .leftJoin(jobsTable, eq(jobsTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.name);

  res.status(200).json(rows);
});

// POST /api/categories
router.post("/categories", requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();
  res.status(201).json({ ...cat, jobCount: 0 });
});

// DELETE /api/categories/:id
router.delete("/categories/:id", requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = DeleteCategoryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid id" });
    return;
  }

  await db.delete(categoriesTable).where(eq(categoriesTable.id, parsed.data.id));
  res.status(200).json({ success: true, message: "Category deleted" });
});

export default router;
