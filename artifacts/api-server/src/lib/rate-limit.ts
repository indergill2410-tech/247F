import { type Request, type Response, type NextFunction } from "express";

function makeRateLimit(maxRequests: number, windowMs: number) {
  const store = new Map<string, { count: number; resetAt: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, windowMs);

  return function rateLimit(req: Request, res: Response, next: NextFunction): void {
    const ip = ((req.headers["x-forwarded-for"] as string) ?? req.ip ?? "unknown")
      .split(",")[0]
      .trim();
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || entry.resetAt < now) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      res.status(429).json({ error: "too_many_requests", message: "Too many requests, please try again later" });
      return;
    }

    entry.count++;
    next();
  };
}

// 10 req/min for auth endpoints
export const authRateLimit = makeRateLimit(10, 60_000);
// 30 req/min for write endpoints (job posting, claims)
export const writeRateLimit = makeRateLimit(30, 60_000);
