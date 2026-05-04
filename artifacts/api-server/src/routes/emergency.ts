import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import { getUncachableStripeClient } from "../stripeClient.js";
import {
  getUserById,
  updateUserStripeCustomerId,
  getEmergencyMembershipStatus,
  setEmergencyMembership,
} from "../stripeStorage.js";
import { logger } from "../lib/logger.js";

export const EMERGENCY_PRODUCT_LOOKUP = "emergency_membership_monthly";

const router = Router();

// GET /api/emergency/status — get membership status for the authenticated homeowner
router.get("/emergency/status", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role !== "homeowner") {
    res.status(403).json({ error: "forbidden", message: "Only homeowners can have emergency memberships" });
    return;
  }

  try {
    const status = await getEmergencyMembershipStatus(user.userId);
    if (!status) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    // If active, cross-check with Stripe for up-to-date subscription state
    if (status.emergencyMemberActive && status.emergencySubId) {
      try {
        const stripe = await getUncachableStripeClient();
        const sub = await stripe.subscriptions.retrieve(status.emergencySubId);
        const isActive = sub.status === "active" || sub.status === "trialing";
        const subEnd = new Date((sub as any).current_period_end * 1000);
        const cancelAt = (sub as any).cancel_at_period_end ?? false;

        if (!isActive || subEnd.getTime() !== status.emergencySubEnd?.getTime()) {
          await setEmergencyMembership(user.userId, {
            active: isActive,
            subId: isActive ? status.emergencySubId : null,
            subEnd: isActive ? subEnd : null,
            cancelAtPeriodEnd: cancelAt,
          });
          res.json({
            active: isActive,
            subId: isActive ? status.emergencySubId : null,
            subEnd: isActive ? subEnd.toISOString() : null,
            cancelAtPeriodEnd: cancelAt,
          });
          return;
        }
      } catch (err) {
        logger.warn({ err }, "Failed to verify subscription with Stripe, returning cached state");
      }
    }

    res.json({
      active: status.emergencyMemberActive,
      subId: status.emergencySubId,
      subEnd: status.emergencySubEnd ? status.emergencySubEnd.toISOString() : null,
      cancelAtPeriodEnd: status.emergencySubCancelAt,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get emergency membership status");
    res.status(500).json({ error: "server_error", message: "Failed to get membership status" });
  }
});

// POST /api/emergency/checkout — create Stripe Checkout session for emergency membership subscription
router.post("/emergency/checkout", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role !== "homeowner") {
    res.status(403).json({ error: "forbidden", message: "Only homeowners can subscribe to emergency membership" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const dbUser = await getUserById(user.userId);
    if (!dbUser) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }

    // Check if already subscribed
    if (dbUser.emergencyMemberActive && dbUser.emergencySubId) {
      res.status(409).json({ error: "already_subscribed", message: "You already have an active emergency membership" });
      return;
    }

    // Find the emergency membership price via lookup key
    let priceId: string;
    try {
      const price = await stripe.prices.retrieve(`price_${EMERGENCY_PRODUCT_LOOKUP}`, {});
      priceId = price.id;
    } catch {
      // Fall back to searching by lookup key
      const prices = await stripe.prices.list({
        lookup_keys: [EMERGENCY_PRODUCT_LOOKUP],
        active: true,
        limit: 1,
      });
      if (!prices.data.length) {
        res.status(503).json({ error: "product_not_found", message: "Emergency membership product not configured" });
        return;
      }
      priceId = prices.data[0].id;
    }

    // Create or reuse Stripe customer
    let customerId = dbUser.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.name,
        metadata: { userId: String(dbUser.id), platform: "fixit247" },
      });
      customerId = customer.id;
      await updateUserStripeCustomerId(dbUser.id, customerId);
    }

    const host = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${host}/dashboard?emergency=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${host}/dashboard?emergency=cancelled`,
      metadata: { userId: String(dbUser.id), type: "emergency_membership" },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error({ err }, "Failed to create emergency checkout session");
    res.status(500).json({ error: "server_error", message: "Failed to create checkout session" });
  }
});

// POST /api/emergency/verify-session — called after successful checkout to activate membership
router.post("/emergency/verify-session", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) {
    res.status(400).json({ error: "validation_error", message: "sessionId is required" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.payment_status !== "paid" && session.status !== "complete") {
      res.status(402).json({ error: "not_paid", message: "Payment not completed" });
      return;
    }

    if (session.metadata?.userId !== String(user.userId)) {
      res.status(403).json({ error: "forbidden", message: "Session does not belong to you" });
      return;
    }

    const subscription = session.subscription as any;
    if (!subscription) {
      res.status(400).json({ error: "no_subscription", message: "No subscription found on session" });
      return;
    }

    const subId = typeof subscription === "string" ? subscription : subscription.id;
    let subEnd: Date | null = null;
    let cancelAt = false;

    if (typeof subscription === "object") {
      subEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null;
      cancelAt = subscription.cancel_at_period_end ?? false;
    } else {
      // Retrieve it
      const sub = await stripe.subscriptions.retrieve(subId);
      subEnd = new Date((sub as any).current_period_end * 1000);
      cancelAt = (sub as any).cancel_at_period_end ?? false;
    }

    await setEmergencyMembership(user.userId, {
      active: true,
      subId,
      subEnd,
      cancelAtPeriodEnd: cancelAt,
    });

    res.json({
      success: true,
      active: true,
      subId,
      subEnd: subEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: cancelAt,
    });
  } catch (err) {
    logger.error({ err }, "Failed to verify emergency session");
    res.status(500).json({ error: "server_error", message: "Failed to verify payment" });
  }
});

// POST /api/emergency/cancel — cancel the emergency membership at period end
router.post("/emergency/cancel", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role !== "homeowner") {
    res.status(403).json({ error: "forbidden", message: "Only homeowners can cancel emergency memberships" });
    return;
  }

  try {
    const status = await getEmergencyMembershipStatus(user.userId);
    if (!status?.emergencySubId || !status.emergencyMemberActive) {
      res.status(404).json({ error: "not_found", message: "No active emergency membership found" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const sub = await stripe.subscriptions.update(status.emergencySubId, {
      cancel_at_period_end: true,
    });

    const subEnd = new Date((sub as any).current_period_end * 1000);
    await setEmergencyMembership(user.userId, {
      active: true,
      subId: status.emergencySubId,
      subEnd,
      cancelAtPeriodEnd: true,
    });

    res.json({
      success: true,
      message: "Membership will cancel at end of current billing period",
      subEnd: subEnd.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Failed to cancel emergency membership");
    res.status(500).json({ error: "server_error", message: "Failed to cancel membership" });
  }
});

export default router;
