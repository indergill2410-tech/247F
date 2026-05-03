import { getUncachableStripeClient } from './stripeClient';
import { StripeSync } from 'stripe-replit-sync';

async function getSecretKey(): Promise<string> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;
  if (!hostname || !xReplitToken) throw new Error('Missing Replit env vars');
  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', 'stripe');
  url.searchParams.set('environment', 'development');
  const resp = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'X-Replit-Token': xReplitToken },
  });
  const data = await resp.json() as { items?: Array<{ settings?: { secret?: string } }> };
  const key = data.items?.[0]?.settings?.secret;
  if (!key) throw new Error('No Stripe secret key found');
  return key;
}

async function syncStripeData() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL not set');

  const secretKey = await getSecretKey();
  const stripe = await getUncachableStripeClient();

  const sync = new StripeSync({
    poolConfig: { connectionString: databaseUrl, max: 2 },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: '',
  });

  console.log('Syncing Stripe products to database...');
  const products = await stripe.products.list({ limit: 100 });
  for (const product of products.data) {
    await (sync as any).handleProductEvent(product);
    console.log(`  ✓ Product: ${product.name} (${product.id})`);
  }

  console.log('Syncing Stripe prices to database...');
  const prices = await stripe.prices.list({ limit: 100 });
  for (const price of prices.data) {
    await (sync as any).handlePriceEvent(price);
    console.log(`  ✓ Price: ${price.id} — ${price.unit_amount} ${price.currency}`);
  }

  console.log('\n✅ Stripe sync complete!');
  process.exit(0);
}

syncStripeData().catch((e) => {
  console.error('Sync failed:', e.message);
  process.exit(1);
});
