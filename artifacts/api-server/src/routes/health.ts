import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { seedDemoAccounts } from "../lib/seed-demo.js";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// POST /api/seed-demo?secret=<SESSION_SECRET>
// One-shot endpoint to seed/refresh demo accounts. Protected by the server's
// SESSION_SECRET so it's only callable by operators who have the env var.
router.post("/seed-demo", async (req, res): Promise<void> => {
  const secret = req.query["secret"] as string | undefined;
  const sessionSecret = process.env["SESSION_SECRET"];
  if (!secret || secret !== sessionSecret) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  try {
    const result = await seedDemoAccounts();
    res.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "seed_failed", message: msg });
  }
});

export default router;
