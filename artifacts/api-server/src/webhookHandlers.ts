import { getStripeSync } from './stripeClient.js';
import { getUserByStripeCustomerId, setEmergencyMembership } from './stripeStorage.js';
import { logger } from './lib/logger.js';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Also handle emergency membership subscription lifecycle events
    try {
      const event = JSON.parse(payload.toString()) as { type: string; data: { object: any } };
      await WebhookHandlers.handleEmergencySubscriptionEvent(event);
    } catch (err) {
      logger.warn({ err }, 'Failed to process emergency subscription webhook event (non-fatal)');
    }
  }

  static async handleEmergencySubscriptionEvent(event: { type: string; data: { object: any } }): Promise<void> {
    const subscriptionEvents = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ];

    if (!subscriptionEvents.includes(event.type)) return;

    const subscription = event.data.object;
    const customerId = subscription.customer as string | undefined;
    if (!customerId) return;

    // Check if any of the subscription's items are emergency membership products
    const items: any[] = subscription.items?.data ?? [];
    const isEmergency = items.some(
      (item: any) =>
        item.price?.lookup_key === 'emergency_membership_monthly' ||
        item.price?.metadata?.type === 'emergency_membership' ||
        item.price?.product?.metadata?.type === 'emergency_membership',
    );
    if (!isEmergency) return;

    const user = await getUserByStripeCustomerId(customerId);
    if (!user) {
      logger.warn({ customerId }, 'Emergency subscription webhook: no user found for Stripe customer');
      return;
    }

    const isDeleted = event.type === 'customer.subscription.deleted';
    const isActive = !isDeleted && (subscription.status === 'active' || subscription.status === 'trialing');
    const subEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end ?? false;

    await setEmergencyMembership(user.id, {
      active: isActive,
      subId: isActive ? (subscription.id as string) : null,
      subEnd: isActive ? subEnd : null,
      cancelAtPeriodEnd: isActive ? cancelAtPeriodEnd : false,
    });

    logger.info(
      { userId: user.id, event: event.type, active: isActive },
      'Emergency membership updated via webhook',
    );
  }
}
