import Stripe from 'stripe';

export function getStripeSecretKey(): string {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value) throw new Error('STRIPE_SECRET_KEY environment variable is required but was not set.');
  return value;
}

export function getStripePublishableKey(): string {
  const value = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!value) throw new Error('STRIPE_PUBLISHABLE_KEY environment variable is required but was not set.');
  return value;
}

export function getUncachableStripeClient(): Stripe {
  return new Stripe(getStripeSecretKey(), { apiVersion: '2025-08-27.basil' as Stripe.LatestApiVersion });
}
