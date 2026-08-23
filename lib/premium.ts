// Provider Premium entitlement. Premium is a time-bounded state, not a tier string:
// a listing is Premium while premium_until is in the future. The complimentary
// Founding trial sets premium_until to the claim date plus 90 days (no card); a
// real Stripe subscription later extends it. This keeps entitlement separate from
// payment truth (revenue and paying-member counts come only from billing).
//
// Verification is a different thing entirely and lives elsewhere: a listing is
// Verified because an owner claimed it through the evidence-based claim process,
// never because anyone paid. Payment must never award a trust designation.

export const PREMIUM_TRIAL_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

// Deterministic trial expiry from a start instant. ISO timestamps are UTC, so the
// date boundary does not depend on server timezone.
export function trialUntilFrom(startISO: string | number | Date): string {
  const start = new Date(startISO).getTime();
  return new Date(start + PREMIUM_TRIAL_DAYS * DAY_MS).toISOString();
}

export function isPremiumActive(premiumUntil: string | null | undefined, now: number = Date.now()): boolean {
  if (!premiumUntil) return false;
  const t = new Date(premiumUntil).getTime();
  return Number.isFinite(t) && t > now;
}
