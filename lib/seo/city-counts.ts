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

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Suburbs fold into their metro hub so a Plano listing strengthens the Dallas
// page, never a thin duplicate. One definition, used by the sitemap, the city
// page, and the admin SEO panel, so a city can never be indexable in one and
// noindex in another.
const METROS: Record<string, string[]> = {
  dallas: ["plano", "frisco", "richardson", "irving", "arlington", "mckinney", "allen", "garland", "fort worth", "addison"],
  houston: ["katy", "sugar land", "the woodlands", "cypress", "pearland"],
  "san-antonio": ["new braunfels", "boerne"],
  austin: ["round rock", "cedar park", "georgetown"],
  "las-vegas": ["summerlin", "henderson", "north las vegas", "boulder city"],
  scottsdale: ["phoenix", "tempe", "mesa", "chandler", "paradise valley"],
  "boca-raton": ["delray beach", "boynton beach", "deerfield beach"],
  naples: ["bonita springs", "marco island", "estero"],
};
const SUBURB_TO_HUB: Record<string, string> = {};
for (const [hub, subs] of Object.entries(METROS)) for (const s of subs) SUBURB_TO_HUB[s] = hub;

// The slug a raw city value maps to, or null when the name is not slug-safe
// (punctuated values like "Chicago (Clearing)" can never populate the page their
// slug points to, so they are folded into no city page and stay on the state page).
export function citySlugOf(rawCity: string): string | null {
  const c = rawCity.trim().toLowerCase();
  if (SUBURB_TO_HUB[c]) return SUBURB_TO_HUB[c];
  return slugify(c).replace(/-/g, " ") === c ? slugify(c) : null;
}

export function groupRowsByCity(
  rows: Array<CityCountRow & { state?: string | null }>,
  abbrToSlug: Record<string, string>
): Map<string, CityCountRow[]> {
  const out = new Map<string, CityCountRow[]>();
  for (const r of rows) {
    if (!r.city || !r.state) continue;
    const stateSlug = abbrToSlug[String(r.state).toUpperCase()];
    if (!stateSlug) continue;
    const citySlug = citySlugOf(String(r.city));
    if (!citySlug) continue;
    const key = `${stateSlug}/${citySlug}`;
    (out.get(key) ?? out.set(key, []).get(key)!).push(r);
  }
  return out;
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
