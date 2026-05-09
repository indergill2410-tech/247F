import { createServer } from "http";
import { WebSocketServer } from "ws";
import { runMigrations } from "stripe-replit-sync";
import cron from "node-cron";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { verifyToken } from "./lib/auth.js";
import { joinRoom, leaveRoom, leaveAllRooms, broadcastToRoom, type AuthedClient } from "./lib/ws-manager.js";
import { getStripeSync, getUncachableStripeClient } from "./stripeClient.js";
import { grantWalletFunds, WELCOME_GRANT_CENTS, runMonthlyGrant } from "./stripeStorage.js";
import { EMERGENCY_PRODUCT_LOOKUP } from "./routes/emergency.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, isNull, sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function ensureEmergencyProduct() {
  try {
    const stripe = await getUncachableStripeClient();

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

    const stripeSync = await getStripeSync();

    const domains = process.env.REPLIT_DOMAINS?.split(",") ?? [];
    const webhookBaseUrl = domains[0]
      ? `https://${domains[0]}`
      : process.env.API_BASE_URL ?? `http://localhost:${port}`;
    const webhookResult = await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    logger.info({ url: (webhookResult as any)?.webhook?.url ?? "setup complete" }, "Stripe webhook configured");

    // Backfill in background — don't block startup
    stripeSync.syncBackfill().then(() => logger.info("Stripe data synced")).catch((err: any) => logger.error({ err }, "Stripe backfill error"));

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
    const { walletBalancesTable } = await import("@workspace/db");
    const tradiesWithNoWallet = await db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .leftJoin(walletBalancesTable, eq(walletBalancesTable.userId, usersTable.id))
      .where(sql`${usersTable.role} = 'tradie' AND ${walletBalancesTable.userId} IS NULL`);

    for (const tradie of tradiesWithNoWallet) {
      await grantWalletFunds(tradie.id, WELCOME_GRANT_CENTS, "welcome_grant", "Welcome offer — A$111.00 job lead credits for month 1 of 6");
      await db
        .update(usersTable)
        .set({ welcomeGrantMonthsUsed: 1, welcomeGrantStartedAt: sql`NOW()` })
        .where(eq(usersTable.id, tradie.id));
      logger.info({ tradieId: tradie.id, name: tradie.name }, "Granted welcome wallet funds");
    }

    if (tradiesWithNoWallet.length > 0) {
      logger.info({ count: tradiesWithNoWallet.length }, "Granted welcome wallet funds to new tradies");
    }
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

wss.on("connection", (ws, payload: ReturnType<typeof verifyToken>) => {
  if (!payload) {
    ws.close(1008, "Unauthorized");
    return;
  }

  const client: AuthedClient = { ws, userId: payload.userId };

  logger.info({ userId: payload.userId }, "WS client connected");

  ws.on("message", (raw) => {
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

// Init Stripe then start listening
initStripe().then(() => {
  startMonthlyRenewalCron();
  httpServer.listen(port, (err?: Error) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}).catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
