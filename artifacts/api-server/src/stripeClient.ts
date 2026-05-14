import Stripe from 'stripe';
import { StripeSync } from 'stripe-replit-sync';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} environment variable is required but was not set.`);
  return value;
}

export function getStripeSecretKey(): string {
  return requireEnv('STRIPE_SECRET_KEY');
}

export function getStripePublishableKey(): string {
  return requireEnv('STRIPE_PUBLISHABLE_KEY');
}

export function getUncachableStripeClient(): Stripe {
  // Preview API version not yet in Stripe SDK types — cast is intentional
  return new Stripe(getStripeSecretKey(), { apiVersion: '2025-08-27.basil' as Stripe.LatestApiVersion });
}

export function getStripeSync(): StripeSync {
  const databaseUrl = requireEnv('DATABASE_URL');
  // STRIPE_WEBHOOK_SECRET is set by copying the signing secret from the Stripe dashboard
  // after the webhook endpoint is auto-created on first boot (see initStripe in index.ts).
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl, max: 2 },
    stripeSecretKey: getStripeSecretKey(),
    stripeWebhookSecret,
  });
}
