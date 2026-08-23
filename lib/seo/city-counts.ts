import type { MetroCounts } from "./indexability";

// One definition of a city's marketplace value, shared by the sitemap and the
// city page so SITEMAP-1 (sitemap lists exactly the indexable URLs) cannot drift.
// Definitions match lib/market-coverage.ts: variant confirmation requires AMERICAN
// with medium or high confidence (the same bar as publication), and current
// evidence means confirmed active within 180 days.

export type CityCountRow = {
  city?: string | null;
  state?: string | null;
  mahjong_variant?: string | null;
  variant_confidence?: string | null;
  confirmed_active_at?: string | null;
};

const MS_PER_DAY = 86400000;
const EVIDENCE_WINDOW_DAYS = 180;

export function cityKeyOf(stateSlug: string, citySlug: string): string {
  return `${stateSlug}/${citySlug}`;
}

export function buildCityCounts(
  rowsByKey: Map<string, CityCountRow[]>,
  now = Date.now()
): Map<string, MetroCounts> {
  const out = new Map<string, MetroCounts>();
  for (const [key, rows] of rowsByKey) {
    let variantConfirmed = 0;
    let currentEvidence = 0;
    for (const r of rows) {
      if (r.mahjong_variant === "AMERICAN" && (r.variant_confidence === "medium" || r.variant_confidence === "high")) {
        variantConfirmed++;
      }
      if (r.confirmed_active_at) {
        const age = (now - new Date(r.confirmed_active_at).getTime()) / MS_PER_DAY;
        if (Number.isFinite(age) && age <= EVIDENCE_WINDOW_DAYS) currentEvidence++;
      }
    }
    out.set(key, { published: rows.length, variantConfirmed, currentEvidence, isLaunchMetro: false });
  }
  return out;
}
