/**
 * Deterministic indexability rules for programmatic geography pages.
 *
 * SHIPS DARK: nothing imports this yet. It is the agreed contract from
 * docs/seo-measurement-audit.md section 4.3. Once the thresholds are approved,
 * app/states/[state]/[city]/page.tsx (generateMetadata) and app/sitemap.ts
 * both call cityIndexability() so the sitemap and the page can never disagree
 * about whether a URL is indexable.
 *
 * Thresholds come from the real inventory distribution on 2026-08-22
 * (132 published listings, 67 distinct cities, only 16 cities with 3 or more
 * listings; 80 of 132 variant-confirmed AMERICAN; 28 of 132 with evidence
 * newer than 180 days). They align with the metro readiness gates in
 * lib/market-coverage.ts. Pure functions only: counts in, verdict out.
 */

/** Published-listing counts for one metro (hub city plus folded suburbs). */
export interface MetroCounts {
  /** Published listings (events + venues) matching the metro aliases. */
  published: number;
  /** Of published, rows with mahjong_variant = "AMERICAN". */
  variantConfirmed: number;
  /** Of published, rows with confirmed_active_at within the last 180 days. */
  currentEvidence: number;
  /** One of the 8 prebuilt launch metros (see app/states/[state]/[city]/page.tsx generateStaticParams). */
  isLaunchMetro: boolean;
}

/** Category counts for a future city+category page. The route class does not exist yet. */
export interface CategoryCounts {
  /** Published listings in this category within the metro. */
  categoryPublished: number;
  /** Of those, rows with confirmed_active_at within the last 180 days. */
  categoryCurrentEvidence: number;
}

export type IndexabilityDisposition = "index" | "noindex" | "not-found";

export interface IndexabilityVerdict {
  indexable: boolean;
  /** What a non-indexable URL should serve. City pages noindex (they still carry navigation value); empty category pages 404. */
  disposition: IndexabilityDisposition;
  /** Stable machine-readable reason, safe to log and assert on. */
  reason:
    | "meets-city-threshold"
    | "meets-category-threshold"
    | "no-published-listings"
    | "below-published-threshold"
    | "below-variant-confirmed-threshold"
    | "no-current-evidence"
    | "city-not-indexable"
    | "below-category-threshold"
    | "no-current-category-evidence";
}

/** Rule CITY-2 thresholds. Exported so tests and the audit doc stay honest. */
export const CITY_THRESHOLDS = {
  minPublished: 3,
  minVariantConfirmed: 2,
  minCurrentEvidence: 1,
} as const;

/** Rule CITYCAT-1 thresholds. */
export const CATEGORY_THRESHOLDS = {
  minCategoryPublished: 2,
  minCategoryCurrentEvidence: 1,
} as const;

/**
 * Rule CITY-2: is a /states/[state]/[city] page indexable?
 *
 * Every city must earn indexation on marketplace value: at least 3 published
 * listings, 2 variant-confirmed, and 1 with current evidence. Owner ruling
 * The owner removed the old launch-metro bypass: no page is indexed on a
 * business commitment alone. Failing pages are noindex, never 404, because
 * they still render real listings and state navigation.
 */
export function cityIndexability(counts: MetroCounts): IndexabilityVerdict {
  if (counts.published === 0) {
    return { indexable: false, disposition: "noindex", reason: "no-published-listings" };
  }
  if (counts.published < CITY_THRESHOLDS.minPublished) {
    return { indexable: false, disposition: "noindex", reason: "below-published-threshold" };
  }
  if (counts.variantConfirmed < CITY_THRESHOLDS.minVariantConfirmed) {
    return { indexable: false, disposition: "noindex", reason: "below-variant-confirmed-threshold" };
  }
  if (counts.currentEvidence < CITY_THRESHOLDS.minCurrentEvidence) {
    return { indexable: false, disposition: "noindex", reason: "no-current-evidence" };
  }
  return { indexable: true, disposition: "index", reason: "meets-city-threshold" };
}

/**
 * Rule CITYCAT-1: is a future /states/[state]/[city]/[category] page indexable?
 *
 * The city itself must pass cityIndexability first; an empty category shell
 * has no navigation value, so failures 404 instead of noindexing.
 */
export function cityCategoryIndexability(
  city: MetroCounts,
  category: CategoryCounts
): IndexabilityVerdict {
  const cityVerdict = cityIndexability(city);
  if (!cityVerdict.indexable) {
    return { indexable: false, disposition: "not-found", reason: "city-not-indexable" };
  }
  if (category.categoryPublished < CATEGORY_THRESHOLDS.minCategoryPublished) {
    return { indexable: false, disposition: "not-found", reason: "below-category-threshold" };
  }
  if (category.categoryCurrentEvidence < CATEGORY_THRESHOLDS.minCategoryCurrentEvidence) {
    return { indexable: false, disposition: "not-found", reason: "no-current-category-evidence" };
  }
  return { indexable: true, disposition: "index", reason: "meets-category-threshold" };
}

/**
 * Rule SITEMAP-1: the sitemap must list exactly the indexable URLs.
 * A noindex URL in the sitemap is a contract violation.
 */
export function belongsInSitemap(verdict: IndexabilityVerdict): boolean {
  return verdict.indexable;
}
