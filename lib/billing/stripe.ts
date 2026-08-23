import Stripe from "stripe";

// Lazy Stripe client, same pattern as lazyServerClient in lib/supabase-server.ts: Next
// evaluates route modules at build time where env vars may be absent, and this repo must
// build and run with no Stripe account at all (payments ship dark). So the client is
// constructed only on first use and only when the secret exists.
let cached: Stripe | null = null;

export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Returns null when unconfigured so every caller is forced to handle the
// payments-disabled path explicitly instead of crashing.
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) cached = new Stripe(key);
  return cached;
}

// The one message every billing route returns while payments are dark, so tests,
// monitoring, and any future UI can match on it exactly.
export const PAYMENTS_DISABLED_MESSAGE = "Payments are not yet enabled";
