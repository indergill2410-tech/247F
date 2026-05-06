import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, tradieSkillsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { RegisterUserBody, LoginUserBody, UpdateMeBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword, signToken } from "../lib/auth.js";
import { requireAuth } from "../middlewares/require-auth.js";
import { sendCustomerWelcome, sendTradieWelcome } from "../lib/email.js";
import { estimateLatLng } from "../lib/geo.js";

const router = Router();

// POST /api/auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { name, email, password, role, phone, suburb, postcode, bio, skills, primaryTrade, secondaryTrades } = parsed.data;

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "conflict", message: "Email already in use" });
    return;
  }

  const passwordHash = hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
    role: role as "homeowner" | "tradie",
    phone: phone ?? null,
    suburb: suburb ?? null,
    postcode: postcode ?? null,
    bio: bio ?? null,
    primaryTrade: primaryTrade ?? null,
    secondaryTrades: secondaryTrades ?? null,
  }).returning();

  if (!user) {
    res.status(500).json({ error: "server_error", message: "Failed to create user" });
    return;
  }

  // Insert tradie skills if provided
  if (role === "tradie" && skills && skills.length > 0) {
    await db.insert(tradieSkillsTable).values(
      skills.map((categoryId) => ({ tradieId: user.id, categoryId }))
    ).onConflictDoNothing();
  }

  // Send welcome email (fire-and-forget, never blocks registration)
  if (role === "tradie") {
    sendTradieWelcome({ name, email }).catch(() => {});
  } else {
    sendCustomerWelcome({ name, email }).catch(() => {});
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json({ user: { ...safeUser, reviewCount: user.reviewCount }, token });
});

// POST /api/auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "unauthorized", message: "Invalid credentials" });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: "forbidden", message: "Account is deactivated" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const { passwordHash: _, ...safeUser } = user;
  res.status(200).json({ user: safeUser, token });
});

// POST /api/auth/logout
router.post("/auth/logout", requireAuth, async (_req, res): Promise<void> => {
  res.status(200).json({ success: true, message: "Logged out" });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;
  res.status(200).json(safeUser);
});

// PUT /api/auth/me
router.put("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { skills, ...rest } = parsed.data;

  // Auto-populate lat/lng from postcode whenever a postcode is present
  const latLng = estimateLatLng(rest.postcode);
  const updates: Record<string, unknown> = {
    ...rest,
    ...(latLng ? { latitude: latLng.lat, longitude: latLng.lng } : {}),
    updatedAt: sql`NOW()`,
  };

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.user!.userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  // Update skills if tradie
  if (skills !== undefined && req.user!.role === "tradie") {
    await db.delete(tradieSkillsTable).where(eq(tradieSkillsTable.tradieId, req.user!.userId));
    if (skills.length > 0) {
      await db.insert(tradieSkillsTable).values(
        skills.map((categoryId) => ({ tradieId: req.user!.userId, categoryId }))
      ).onConflictDoNothing();
    }
  }

  const { passwordHash: _, ...safeUser } = updated;
  res.status(200).json(safeUser);
});

export default router;
