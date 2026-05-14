import { getUncachableStripeClient } from './stripeClient.js';
import {
  getUserByStripeCustomerId,
  setEmergencyMembership,
  getEmergencyMembershipStatus,
} from './stripeStorage.js';
import { logger } from './lib/logger.js';
import type Stripe from 'stripe';
import { EMERGENCY_PRODUCT_LOOKUP } from './routes/emergency.js';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
      return;
    }

    const stripe = getUncachableStripeClient();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      logger.error({ err }, 'Stripe webhook signature verification failed');
      throw err;
    }

    try {
      await WebhookHandlers.handleEmergencyEvent(event);
    } catch (err) {
      logger.warn({ err }, 'Failed to process emergency webhook event (non-fatal)');
    }
  }

  static async handleEmergencyEvent(event: Stripe.Event): Promise<void> {
    if (event.type === 'invoice.paid') {
      await WebhookHandlers.handleInvoicePaid(event.data.object as Stripe.Invoice);
      return;
    }

    const subscriptionEvents = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ];
    if (!subscriptionEvents.includes(event.type)) return;

    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;
    if (!customerId) return;

    const items = subscription.items.data;
    const isEmergency = items.some(
      (item) =>
        item.price?.lookup_key === EMERGENCY_PRODUCT_LOOKUP ||
        item.price?.metadata?.['type'] === 'emergency_membership',
    );
    if (!isEmergency) return;

    const user = await getUserByStripeCustomerId(customerId);
    if (!user) {
      logger.warn({ customerId }, 'Emergency subscription webhook: no user found for Stripe customer');
      return;
    }

    const isDeleted = event.type === 'customer.subscription.deleted';
    const isActive = !isDeleted && (subscription.status === 'active' || subscription.status === 'trialing');
    const periodEnd = subscription.items.data[0]?.current_period_end;
    const renewalDate = periodEnd ? new Date(periodEnd * 1000) : null;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;

    await setEmergencyMembership(user.id, {
      active: isActive,
      subId: isActive ? subscription.id : null,
      renewalDate: isActive ? renewalDate : null,
      cancelAtPeriodEnd: isActive ? cancelAtPeriodEnd : false,
    });

    logger.info(
      { userId: user.id, event: event.type, active: isActive },
      'Emergency membership updated via webhook',
    );
  }

  static async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const customerRef = invoice.customer;
    const customerId = typeof customerRef === 'string'
      ? customerRef
      : customerRef?.id ?? null;
    if (!customerId) return;

    const user = await getUserByStripeCustomerId(customerId);
    if (!user) return;

    const subRef = invoice.parent?.subscription_details?.subscription;
    const subscriptionId = typeof subRef === 'string' ? subRef : (subRef as Stripe.Subscription | null)?.id ?? null;

    const currentStatus = await getEmergencyMembershipStatus(user.id);
    const isEmergency =
      subscriptionId !== null &&
      !!currentStatus?.emergencySubId &&
      subscriptionId === currentStatus.emergencySubId;
    if (!isEmergency) return;

    const isRenewal = invoice.billing_reason === 'subscription_cycle';

    const firstLine = invoice.lines.data[0];
    const renewalDate = firstLine?.period?.end
      ? new Date(firstLine.period.end * 1000)
      : null;

    let shouldResetCalls = false;
    let newYearStart: Date | undefined = undefined;
    if (isRenewal && currentStatus?.emergencyMembershipStartedAt && renewalDate) {
      const yearStart = currentStatus.emergencyMembershipStartedAt;
      const yearBoundary = new Date(yearStart.getTime() + 365.25 * 24 * 60 * 60 * 1000);
      if (renewalDate > yearBoundary) {
        shouldResetCalls = true;
        newYearStart = yearBoundary;
      }
    }

    await setEmergencyMembership(user.id, {
      active: true,
      subId: subscriptionId ?? currentStatus?.emergencySubId ?? null,
      renewalDate,
      cancelAtPeriodEnd: false,
      ...(shouldResetCalls && { callsUsed: 0, startedAt: newYearStart }),
    });

    logger.info(
      { userId: user.id, isRenewal, subscriptionId },
      'Emergency membership renewed via invoice.paid webhook',
    );
  }
}
