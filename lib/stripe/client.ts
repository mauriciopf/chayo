import Stripe from 'stripe';

// Lazy-initialized so build-time static analysis doesn't throw
// when STRIPE_SECRET_KEY is absent (e.g. during `next build` in CI)
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    });
  }
  return _stripe;
}

// Convenience re-export for code that imports `stripe` directly
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

