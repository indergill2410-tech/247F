import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient.js";
import {
  getUserById,
  updateUserStripeCustomerId,
  getWalletBalance,
  getWalletTransactions,
  grantWalletFunds,
  LEAD_COST_CENTS_DEFAULT,
  WELCOME_GRANT_CENTS,
} from "../stripeStorage.js";
import { logger } from "../lib/logger.js";

const router = Router();

const PACKS_CACHE_TTL_MS = 5 * 60 * 1000;
let packsCache: { packs: unknown[]; expiresAt: number } | null = null;

// GET /api/stripe/config — returns publishable key for frontend
router.get("/stripe/config", requireAuth, async (_req, res): Promise<void> => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err) {
    logger.error({ err }, "Failed to get Stripe config");
    res.status(500).json({ error: "stripe_unavailable", message: "Stripe not configured" });
  }
});

// GET /api/stripe/credits — get current tradie's wallet balance + transactions
router.get("/stripe/credits", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role !== "tradie") {
    res.status(403).json({ error: "forbidden", message: "Only tradies have a wallet" });
    return;
  }
  try {
    const [balanceCents, transactions] = await Promise.all([
      getWalletBalance(user.userId),
      getWalletTransactions(user.userId, 20),
    ]);
    res.json({
      balanceCents,
      leadCostCentsDefault: LEAD_COST_CENTS_DEFAULT,
      welcomeGrantCents: WELCOME_GRANT_CENTS,
      transactions,
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch wallet");
    res.status(500).json({ error: "server_error", message: "Failed to fetch wallet" });
  }
});

// GET /api/stripe/packs — list all credit pack products from Stripe API directly
router.get("/stripe/packs", requireAuth, async (_req, res): Promise<void> => {
  if (packsCache && Date.now() < packsCache.expiresAt) {
    res.json({ packs: packsCache.packs });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();

    const [productsResult, pricesResult] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, limit: 100 }),
    ]);

    // Only show fixit247 platform products
    const products = productsResult.data.filter(
      (p) => p.metadata?.platform === "fixit247",
    );

    const packs = products.map((product) => {
      const productPrices = pricesResult.data
        .filter((pr) => pr.product === product.id)
        .map((pr) => ({
          id: pr.id,
          unitAmount: pr.unit_amount,
          currency: pr.currency,
          credits: product.metadata?.credits ? parseInt(product.metadata.credits, 10) : null,
        }));

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        metadata: product.metadata,
        prices: productPrices,
      };
    });

    // Sort by price ascending
    packs.sort((a, b) => (a.prices[0]?.unitAmount ?? 0) - (b.prices[0]?.unitAmount ?? 0));

    packsCache = { packs, expiresAt: Date.now() + PACKS_CACHE_TTL_MS };
    res.json({ packs });
  } catch (err) {
    logger.error({ err }, "Failed to fetch packs");
    res.status(500).json({ error: "server_error", message: "Failed to fetch packs" });
  }
});

// POST /api/stripe/checkout — create a Stripe Checkout session for a credit pack
router.post("/stripe/checkout", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role !== "tradie") {
    res.status(403).json({ error: "forbidden", message: "Only tradies can purchase credits" });
    return;
  }

  const { priceId } = req.body as { priceId?: string };
  if (!priceId) {
    res.status(400).json({ error: "validation_error", message: "priceId is required" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const dbUser = await getUserById(user.userId);
    if (!dbUser) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    // Create or reuse Stripe customer
    let customerId = dbUser.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.name,
        metadata: { userId: String(dbUser.id) },
      });
      customerId = customer.id;
      await updateUserStripeCustomerId(dbUser.id, customerId);
    }

    const host = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${host}/credits?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${host}/credits?payment=cancelled`,
      metadata: { userId: String(dbUser.id) },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error({ err }, "Failed to create checkout session");
    res.status(500).json({ error: "server_error", message: "Failed to create checkout session" });
  }
});

// POST /api/stripe/verify-session — called after successful checkout to grant credits
router.post("/stripe/verify-session", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) {
    res.status(400).json({ error: "validation_error", message: "sessionId is required" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });

    if (session.payment_status !== "paid") {
      res.status(402).json({ error: "not_paid", message: "Payment not completed" });
      return;
    }

    // Verify this session belongs to this user
    if (session.metadata?.userId !== String(user.userId)) {
      res.status(403).json({ error: "forbidden", message: "Session does not belong to you" });
      return;
    }

    // Extract credits from the product metadata
    const lineItem = session.line_items?.data?.[0];
    const product = lineItem?.price?.product as any;
    const credits = parseInt(product?.metadata?.credits ?? "0", 10);

    if (!credits) {
      res.status(400).json({ error: "invalid_product", message: "No credits metadata on product" });
      return;
    }

    // Idempotent: check if this session was already processed
    const { getWalletTransactions: getTxs } = await import("../stripeStorage.js");
    const txs = await getTxs(user.userId, 100);
    const alreadyProcessed = txs.some((t) => t.stripeSessionId === sessionId);
    if (alreadyProcessed) {
      const balanceCents = await getWalletBalance(user.userId);
      res.json({ success: true, creditsAdded: 0, balanceCents, alreadyProcessed: true });
      return;
    }

    // credits metadata is in cents for the new wallet system (e.g. 4900 = $49.00)
    const amountCents = credits;
    await grantWalletFunds(
      user.userId,
      amountCents,
      "refund",
      `Purchased $${(amountCents / 100).toFixed(2)} wallet funds (${product.name})`,
      sessionId,
    );

    const balanceCents = await getWalletBalance(user.userId);
    res.json({ success: true, creditsAdded: amountCents, balanceCents });
  } catch (err) {
    logger.error({ err }, "Failed to verify session");
    res.status(500).json({ error: "server_error", message: "Failed to verify payment" });
  }
});

// POST /api/stripe/portal — billing portal for customers to manage payments
router.post("/stripe/portal", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  try {
    const dbUser = await getUserById(user.userId);
    if (!dbUser?.stripeCustomerId) {
      res.status(404).json({ error: "not_found", message: "No billing account found" });
      return;
    }
    const stripe = await getUncachableStripeClient();
    const host = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${host}/dashboard`,
    });
    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Failed to create portal session");
    res.status(500).json({ error: "server_error", message: "Failed to open billing portal" });
  }
});

export default router;
