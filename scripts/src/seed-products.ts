import Stripe from 'stripe';

function getUncachableStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not set');
  return new Stripe(key, { apiVersion: '2025-08-27.basil' as Stripe.LatestApiVersion });
}

const PACKS = [
  { name: 'Fixit 247 Starter Pack', credits: '300', priceAud: 4900 },
  { name: 'Fixit 247 Pro Pack', credits: '600', priceAud: 9900 },
  { name: 'Fixit 247 Max Pack', credits: '1111', priceAud: 14900 },
];

async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    console.log('Creating Fixit 24/7 wallet top-up products in Stripe...');

    for (const pack of PACKS) {
      const existing = await stripe.products.search({
        query: `name:'${pack.name}' AND active:'true'`,
      });

      if (existing.data.length > 0) {
        console.log(`✓ "${pack.name}" already exists (${existing.data[0].id})`);
        const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
        if (prices.data.length > 0) {
          console.log(`  Price: AUD $${pack.priceAud / 100} (${prices.data[0].id})`);
        }
        continue;
      }

      const product = await stripe.products.create({
        name: pack.name,
        description: `Add $${pack.priceAud / 100} AUD to your Fixit 24/7 wallet. Use wallet funds to claim jobs from homeowners in your area.`,
        metadata: {
          credits: pack.credits,
          platform: 'fixit247',
        },
      });
      console.log(`✓ Created product: ${product.name} (${product.id})`);

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.priceAud,
        currency: 'aud',
        metadata: {
          credits: pack.credits,
        },
      });
      console.log(`  Price: AUD $${pack.priceAud / 100} (${price.id})`);
    }

    console.log('\n✅ All wallet top-up packs created successfully!');
    console.log('Webhooks will sync this data to your database automatically.');
  } catch (error: any) {
    console.error('Error creating products:', error.message);
    process.exit(1);
  }
}

createProducts();
