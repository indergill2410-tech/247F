import { createServer } from "http";
import { WebSocketServer } from "ws";
import { runMigrations } from "stripe-replit-sync";
import cron from "node-cron";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { verifyToken, hashPassword } from "./lib/auth.js";
import { joinRoom, leaveRoom, leaveAllRooms, broadcastToRoom, type AuthedClient } from "./lib/ws-manager.js";
import { getStripeSync, getUncachableStripeClient } from "./stripeClient.js";
import { grantWalletFunds, WELCOME_GRANT_CENTS, runMonthlyGrant } from "./stripeStorage.js";
import { seedDemoAccounts } from "./lib/seed-demo.js";
import { EMERGENCY_PRODUCT_LOOKUP } from "./routes/emergency.js";
import { db, pool } from "@workspace/db";
import { usersTable, walletBalancesTable, walletTransactionsTable } from "@workspace/db";
import { eq, inArray, isNull, sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Fail hard on truly required vars; warn on optional feature vars.
if (!process.env["DATABASE_URL"]) {
  throw new Error("DATABASE_URL environment variable is required but was not provided.");
}
if (!process.env["SESSION_SECRET"]) {
  throw new Error("SESSION_SECRET environment variable is required but was not provided.");
}

const OPTIONAL_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "SENDGRID_API_KEY",
  "OPENAI_API_KEY",
] as const;

for (const key of OPTIONAL_ENV_VARS) {
  if (!process.env[key]) {
    logger.warn(`${key} is not set — related features will be unavailable`);
  }
}

async function applySchemaUpdates() {
  const statements = [
    `DO $$ BEGIN CREATE TYPE "public"."subscription_tier" AS ENUM ('free','starter','pro'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "public"."wallet_tx_type" AS ENUM ('welcome_grant','subscription_grant','lead_deduct','refund','adjustment'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "public"."size_band" AS ENUM ('small','medium','large','premium'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `ALTER TABLE "users"
       ADD COLUMN IF NOT EXISTS "subscription_tier" "subscription_tier" NOT NULL DEFAULT 'free',
       ADD COLUMN IF NOT EXISTS "subscription_started_at" timestamp with time zone,
       ADD COLUMN IF NOT EXISTS "subscription_stripe_sub_id" text,
       ADD COLUMN IF NOT EXISTS "welcome_grant_months_used" integer NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS "welcome_grant_started_at" timestamp with time zone,
       ADD COLUMN IF NOT EXISTS "free_leads_used_this_month" integer NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS "free_leads_month_reset_at" timestamp with time zone`,
    `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "lead_cost_cents" integer`,
    `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "size_band" "size_band"`,
    `CREATE TABLE IF NOT EXISTS "wallet_balances" (
       "id" serial PRIMARY KEY,
       "user_id" integer NOT NULL REFERENCES "users"("id") UNIQUE,
       "balance_cents" integer NOT NULL DEFAULT 0,
       "updated_at" timestamp with time zone NOT NULL DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS "wallet_transactions" (
       "id" serial PRIMARY KEY,
       "user_id" integer NOT NULL REFERENCES "users"("id"),
       "type" "wallet_tx_type" NOT NULL,
       "amount_cents" integer NOT NULL,
       "description" text,
       "stripe_session_id" text,
       "job_id" integer REFERENCES "jobs"("id"),
       "created_at" timestamp with time zone NOT NULL DEFAULT now()
     )`,
    `CREATE INDEX IF NOT EXISTS "wallet_transactions_user_id_idx" ON "wallet_transactions" ("user_id")`,
    `CREATE INDEX IF NOT EXISTS "conversations_job_id_idx" ON "conversations" ("job_id")`,
    `CREATE INDEX IF NOT EXISTS "jobs_status_created_at_idx" ON "jobs" ("status", "created_at")`,
    `CREATE INDEX IF NOT EXISTS "jobs_category_status_idx" ON "jobs" ("category_id", "status")`,
    `CREATE INDEX IF NOT EXISTS "conversations_job_tradie_idx" ON "conversations" ("job_id", "tradie_id")`,
  ];
  for (const stmt of statements) {
    await pool.query(stmt).catch((err: unknown) => {
      logger.warn({ err, stmt: stmt.slice(0, 80) }, "Schema update statement warning (non-fatal)");
    });
  }
  logger.info("Schema updates applied");
}


async function ensureEmergencyProduct() {
  try {
    const stripe = getUncachableStripeClient();

    // Check if the price already exists via lookup key
    const existing = await stripe.prices.list({
      lookup_keys: [EMERGENCY_PRODUCT_LOOKUP],
      active: true,
      limit: 1,
    });

    if (existing.data.length > 0) {
      logger.info({ priceId: existing.data[0].id }, "Emergency membership product already exists");
      return;
    }

    // Create the product
    const product = await stripe.products.create({
      name: "Fixit Emergency 24/7 Membership",
      description: "Priority homeowner membership — guaranteed 30-min response, 24/7 emergency dispatch, and queue priority for all emergency jobs.",
      metadata: {
        platform: "fixit247",
        type: "emergency_membership",
      },
    });

    // Create the recurring price — $49 AUD/month
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 4900,
      currency: "aud",
      recurring: { interval: "month" },
      lookup_key: EMERGENCY_PRODUCT_LOOKUP,
      metadata: {
        type: "emergency_membership",
        platform: "fixit247",
      },
    });

    logger.info({ productId: product.id, priceId: price.id }, "Emergency membership product created in Stripe");
  } catch (err) {
    logger.error({ err }, "Failed to ensure emergency membership product (non-fatal)");
  }
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("DATABASE_URL not set — skipping Stripe init");
    return;
  }

  try {
    logger.info("Initializing Stripe schema...");
    await runMigrations({ databaseUrl });
    logger.info("Stripe schema ready");

    const stripeSync = getStripeSync();

    const webhookBaseUrl = process.env.API_BASE_URL ?? `http://localhost:${port}`;
    const webhookResult = await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    const syncResult = webhookResult as { webhook?: { url?: string } } | null;
    logger.info({ url: syncResult?.webhook?.url ?? "setup complete" }, "Stripe webhook configured");

    // Backfill in background — don't block startup
    stripeSync.syncBackfill().then(() => logger.info("Stripe data synced")).catch((err: unknown) => logger.error({ err }, "Stripe backfill error"));

    // Grant the first month of the welcome lead-credit offer to tradies who do not have a wallet row yet
    await grantWelcomeGrantToNewTradies();

    // Ensure the emergency membership product exists in Stripe
    await ensureEmergencyProduct();
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize Stripe — payments will be unavailable");
    // Don't throw — let the server start without Stripe
  }
}

async function grantWelcomeGrantToNewTradies() {
  try {
    const tradiesWithNoWallet = await db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .leftJoin(walletBalancesTable, eq(walletBalancesTable.userId, usersTable.id))
      .where(sql`${usersTable.role} = 'tradie' AND ${walletBalancesTable.userId} IS NULL`);

    if (tradiesWithNoWallet.length === 0) return;

    const ids = tradiesWithNoWallet.map((t) => t.id);

    await db.transaction(async (tx) => {
      // Create wallet rows for all new tradies in one statement
      await tx
        .insert(walletBalancesTable)
        .values(ids.map((id) => ({ userId: id, balanceCents: WELCOME_GRANT_CENTS })))
        .onConflictDoNothing();

      // Record all transactions in one statement
      await tx.insert(walletTransactionsTable).values(
        ids.map((id) => ({
          userId: id,
          type: "welcome_grant" as const,
          amountCents: WELCOME_GRANT_CENTS,
          description: "Welcome offer — A$111.00 job lead credits for month 1 of 6",
          stripeSessionId: null,
        })),
      );

      // Batch-update all users in one statement
      await tx
        .update(usersTable)
        .set({ welcomeGrantMonthsUsed: 1, welcomeGrantStartedAt: sql`NOW()` })
        .where(inArray(usersTable.id, ids));
    });

    logger.info({ count: tradiesWithNoWallet.length }, "Granted welcome wallet funds to new tradies");
  } catch (err) {
    logger.error({ err }, "Failed to grant welcome wallet funds to existing tradies");
  }
}

const httpServer = createServer(app);
const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "", `http://${req.headers.host}`);

  if (url.pathname !== "/api/ws") {
    socket.destroy();
    return;
  }

  const token = url.searchParams.get("token");
  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    (ws as unknown as { _authPayload: typeof payload })._authPayload = payload;
    wss.emit("connection", ws, payload);
  });
});

// 60 messages per 10 s per connection
const WS_RATE_WINDOW_MS = 10_000;
const WS_RATE_MAX = 60;

wss.on("connection", (ws, payload: ReturnType<typeof verifyToken>) => {
  if (!payload) {
    ws.close(1008, "Unauthorized");
    return;
  }

  const client: AuthedClient = { ws, userId: payload.userId };
  let msgCount = 0;
  let windowStart = Date.now();

  logger.info({ userId: payload.userId }, "WS client connected");

  ws.on("message", (raw) => {
    const now = Date.now();
    if (now - windowStart > WS_RATE_WINDOW_MS) {
      msgCount = 0;
      windowStart = now;
    }
    msgCount++;
    if (msgCount > WS_RATE_MAX) {
      ws.close(1008, "Rate limit exceeded");
      return;
    }

    if (Buffer.byteLength(raw as Buffer) > 4096) return;
    try {
      const msg = JSON.parse(raw.toString()) as Record<string, unknown>;

      if (msg["type"] === "join" && typeof msg["conversationId"] === "number") {
        joinRoom(msg["conversationId"] as number, client);
        ws.send(JSON.stringify({ type: "joined", conversationId: msg["conversationId"] }));
      } else if (msg["type"] === "leave" && typeof msg["conversationId"] === "number") {
        leaveRoom(msg["conversationId"] as number, client);
      } else if (msg["type"] === "typing" && typeof msg["conversationId"] === "number") {
        broadcastToRoom(
          msg["conversationId"] as number,
          { type: "typing", conversationId: msg["conversationId"], userId: payload.userId },
          payload.userId,
        );
      } else if (msg["type"] === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
      }
    } catch {
      // ignore parse errors
    }
  });

  ws.on("close", () => {
    leaveAllRooms(client);
    logger.info({ userId: payload.userId }, "WS client disconnected");
  });

  ws.on("error", (err) => {
    logger.warn({ err, userId: payload.userId }, "WS client error");
    leaveAllRooms(client);
  });

  ws.send(JSON.stringify({ type: "connected", userId: payload.userId }));
});

function startMonthlyRenewalCron() {
  // Run at midnight AEST on the 1st of each month (UTC 14:00 = midnight AEST+10)
  cron.schedule("0 14 1 * *", async () => {
    logger.info("Running monthly wallet grant...");
    try {
      const result = await runMonthlyGrant();
      logger.info(result, "Monthly wallet grant complete");
    } catch (err) {
      logger.error({ err }, "Monthly wallet grant failed");
    }
  });
  logger.info("Monthly wallet grant cron scheduled (1st of each month, midnight AEST)");
}

function startAnnualEmergencyResetCron() {
  // Reset emergency callout counters at midnight Jan 1st AEST (Dec 31 14:00 UTC)
  cron.schedule("0 14 31 12 *", async () => {
    logger.info("Resetting annual emergency callout counts...");
    try {
      await db.update(usersTable).set({ emergencyCallsUsedThisYear: 0 });
      logger.info("Annual emergency callout reset complete");
    } catch (err) {
      logger.error({ err }, "Annual emergency callout reset failed");
    }
  });
  logger.info("Annual emergency callout reset cron scheduled (Jan 1st AEST)");
}

// Apply schema updates + seed demo accounts, then init Stripe, then start listening
applySchemaUpdates()
  .then(() => seedDemoAccounts())
  .then(() => initStripe())
  .then(() => {
    startMonthlyRenewalCron();
    startAnnualEmergencyResetCron();
    httpServer.listen(port, (err?: Error) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Fatal startup error");
    process.exit(1);
  });
