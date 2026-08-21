// Canonical tier and role vocabulary for Find My Mahj Game.
// Single source of truth so UI strings never drift. Full design and the
// database migration that formalizes these live in docs/membership-system-spec.md.

export type MembershipTier = "free" | "pro" | "ambassador" | "enterprise";
export type EventTier = "free" | "boosted" | "featured" | "spotlight" | "enterprise";
export type AdTier = "basic" | "featured" | "national";
export type Role = "player" | "teacher" | "organizer" | "ambassador" | "admin";

// Legacy strings still living in the database map onto the canonical membership
// tiers until the data migration runs. Render and sort code should normalize first.
const MEMBERSHIP_ALIASES: Record<string, MembershipTier> = {
  starter: "free",
  local: "free",
  basic: "free",
  free: "free",
  pro: "pro",
  featured: "pro",
  official: "pro",
  ambassador: "ambassador",
  enterprise: "enterprise",
};

export function normalizeMembershipTier(value: string | null | undefined): MembershipTier {
  return MEMBERSHIP_ALIASES[(value || "").toLowerCase().trim()] || "free";
}

export const MEMBERSHIP_TIER_LABEL: Record<MembershipTier, string> = {
  free: "Free",
  pro: "Verified Community Leader",
  ambassador: "Ambassador",
  enterprise: "Enterprise",
};

// Prices in USD. Free is always 0; Ambassador is comped (earned, not bought).
// The paid tier (labeled "Verified Community Leader") buys visibility,
// credibility, and promotion, never the listing itself.
export const MEMBERSHIP_PRICE_MONTHLY: Record<MembershipTier, number> = {
  free: 0,
  pro: 12,
  ambassador: 0,
  enterprise: 199,
};

export const MEMBERSHIP_PRICE_ANNUAL: Record<MembershipTier, number> = {
  free: 0,
  pro: 99,
  ambassador: 0,
  enterprise: 1990,
};
