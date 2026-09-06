// The site overlay contract. Everything a site may vary is declared here; everything else is
// shared and identical. A site passes its SiteConfig into the engine and the model layer.

import type { CanonicalRule } from "./corpus/types.ts";

export type SiteId = "fmg" | "lvm";

// An owner-recorded divergence between the sites. The only allowed action excludes a canonical
// entry from one site's retrieval so that site's own approved entries answer instead. Every
// override names the owner decision it rests on; the parity check reports overrides as known
// divergences rather than drift, and the owner checklist lists them for reconciliation.
export type SiteOverride = {
  canonical_id: string;
  action: "exclude";
  owner_decision: string;
  reason: string;
};

export type SiteConfig = {
  site: SiteId;
  // "Ask Find My Mahj" / "Ask Las Vegas Mahjong": persona line and UI heading only.
  helperName: string;
  siteHost: string;
  // Read more link for an entry, or undefined. Only Las Vegas Mahjong has rules pages today.
  readMoreUrl?: (entry: CanonicalRule) => string | undefined;
  // Site-specific discovery vocabulary for the topic classifier (see engine/topic.ts).
  discoverySignal?: (question: string, strongRules: boolean) => boolean;
  overrides: SiteOverride[];
};

export function excludedIds(site: SiteConfig): ReadonlySet<string> {
  return new Set(site.overrides.filter((o) => o.action === "exclude").map((o) => o.canonical_id));
}

// Reported by GET /api/ask/version on each site and compared by the parity check.
export function overrideSummary(site: SiteConfig): Array<{ canonical_id: string; action: string; owner_decision: string }> {
  return site.overrides.map((o) => ({ canonical_id: o.canonical_id, action: o.action, owner_decision: o.owner_decision }));
}
