import { Router } from "express";
import type Stripe from "stripe";
import { requireAuth } from "../middlewares/require-auth.js";
import { getUncachableStripeClient } from "../stripeClient.js";
import {
  getUserById,
  updateUserStripeCustomerId,
  getEmergencyMembershipStatus,
  setEmergencyMembership,
  EMERGENCY_MAX_CALLOUTS,
} from "../stripeStorage.js";
import { logger } from "../lib/logger.js";

export const EMERGENCY_PRODUCT_LOOKUP = "emergency_membership_monthly";
export const EMERGENCY_PLAN_NAME = "fixit_emergency_247";
// Explicit server-side constant for the emergency membership price ID.
// Set EMERGENCY_PRICE_ID env var to override (e.g. in different Stripe environments).
export const EMERGENCY_PRICE_ID = process.env.EMERGENCY_PRICE_ID ?? "price_1TTBgsPfZkklT0IdXgscEFfH";
const WAITING_PERIOD_HOURS = 72;

const router = Router();

// GET /api/emergency/status
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

    const callsUsed = status.emergencyCallsUsedThisYear;
    const callsRemaining = Math.max(0, EMERGENCY_MAX_CALLOUTS - callsUsed);

    res.json({
      active: status.emergencyMembershipActive,
      plan: status.emergencyMembershipPlan ?? null,
      startedAt: status.emergencyMembershipStartedAt?.toISOString() ?? null,
      renewalDate: status.emergencyMembershipRenewalDate?.toISOString() ?? null,
      waitingPeriodEndsAt: status.emergencyWaitingPeriodEndsAt?.toISOString() ?? null,
      callsUsed,
      callsRemaining,
      cancelAtPeriodEnd: status.emergencySubCancelAt,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get emergency membership status");
    res.status(500).json({ error: "server_error", message: "Failed to get membership status" });
  }
});

// POST /api/emergency/checkout
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

    if (dbUser.emergencyMembershipActive && dbUser.emergencySubId) {
      res.status(409).json({ error: "already_subscribed", message: "You already have an active emergency membership" });
      return;
    }

    const priceId = EMERGENCY_PRICE_ID;

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

// POST /api/emergency/verify-session
router.post("/emergency/verify-session", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role !== "homeowner") {
    res.status(403).json({ error: "forbidden", message: "Only homeowners can activate emergency memberships" });
    return;
  }

  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) {
    res.status(400).json({ error: "validation_error", message: "sessionId is required" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      res.status(402).json({ error: "not_paid", message: "Payment not completed" });
      return;
    }

    if (session.metadata?.userId !== String(user.userId)) {
      res.status(403).json({ error: "forbidden", message: "Session does not belong to you" });
      return;
    }

    if (!session.subscription) {
      res.status(400).json({ error: "no_subscription", message: "No subscription found on session" });
      return;
    }

    const subId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

    // Idempotency guard: if this subscription is already active for this user, return
    // current state without modifying any data. This prevents replay of old session IDs
    // from resetting callsUsed or startedAt.
    const existingStatus = await getEmergencyMembershipStatus(user.userId);
    if (existingStatus?.emergencySubId === subId && existingStatus.emergencyMembershipActive) {
      const callsUsed = existingStatus.emergencyCallsUsedThisYear;
      res.json({
        success: true,
        active: true,
        plan: existingStatus.emergencyMembershipPlan ?? EMERGENCY_PLAN_NAME,
        renewalDate: existingStatus.emergencyMembershipRenewalDate?.toISOString() ?? null,
        waitingPeriodEndsAt: existingStatus.emergencyWaitingPeriodEndsAt?.toISOString() ?? null,
        callsUsed,
        callsRemaining: Math.max(0, EMERGENCY_MAX_CALLOUTS - callsUsed),
      });
      return;
    }

    const sub: Stripe.Subscription = await stripe.subscriptions.retrieve(subId);

    const now = new Date();
    const periodEnd = sub.items.data[0]?.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
    const renewalDate = new Date(periodEnd * 1000);
    const waitingPeriodEndsAt = new Date(now.getTime() + WAITING_PERIOD_HOURS * 60 * 60 * 1000);

    await setEmergencyMembership(user.userId, {
      active: true,
      subId: sub.id,
      renewalDate,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      startedAt: now,
      waitingPeriodEndsAt,
      callsUsed: 0,
      plan: EMERGENCY_PLAN_NAME,
    });

    res.json({
      success: true,
      active: true,
      plan: EMERGENCY_PLAN_NAME,
      renewalDate: renewalDate.toISOString(),
      waitingPeriodEndsAt: waitingPeriodEndsAt.toISOString(),
      callsUsed: 0,
      callsRemaining: EMERGENCY_MAX_CALLOUTS,
    });
  } catch (err) {
    logger.error({ err }, "Failed to verify emergency session");
    res.status(500).json({ error: "server_error", message: "Failed to verify payment" });
  }
});

// POST /api/emergency/cancel
router.post("/emergency/cancel", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  if (user.role !== "homeowner") {
    res.status(403).json({ error: "forbidden", message: "Only homeowners can cancel emergency memberships" });
    return;
  }

  try {
    const status = await getEmergencyMembershipStatus(user.userId);
    if (!status?.emergencySubId || !status.emergencyMembershipActive) {
      res.status(404).json({ error: "not_found", message: "No active emergency membership found" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const sub: Stripe.Subscription = await stripe.subscriptions.update(status.emergencySubId, {
      cancel_at_period_end: true,
    });

    const cancelPeriodEnd = sub.items.data[0]?.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
    const renewalDate = new Date(cancelPeriodEnd * 1000);
    await setEmergencyMembership(user.userId, {
      active: true,
      subId: status.emergencySubId,
      renewalDate,
      cancelAtPeriodEnd: true,
    });

    res.json({
      success: true,
      message: "Membership will cancel at end of current billing period",
      subEnd: renewalDate.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Failed to cancel emergency membership");
    res.status(500).json({ error: "server_error", message: "Failed to cancel membership" });
  }
});

export default router;
