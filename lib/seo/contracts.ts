/**
 * SEO data contract for the future admin SEO area. TYPES ONLY, no implementation.
 *
 * Each interface names its source of truth so the admin build (Jason's lane)
 * knows exactly which integration produces which numbers:
 *   - "gsc": Google Search Console API (needs a service account added to the
 *     verified property; the HTML verification file is public/google31790a5f1e6d1354.html).
 *   - "vercel-analytics": Vercel Analytics dashboard or a future API. Page views
 *     and custom event counts only; no user-level data.
 *   - "database": our Supabase tables, always authoritative for inventory.
 *   - "ga4": intentionally absent unless the owner overrides the recommendation
 *     in docs/seo-measurement-audit.md section 3.1; GA4Slot keeps the shape
 *     stable if that decision flips.
 */

import type { IndexabilityVerdict } from "./indexability";

/* ── Search Console (source: gsc) ────────────────────────────────────────── */

/** One row of GSC search analytics, queried by page or query dimension. */
export interface SearchConsoleMetrics {
  source: "gsc";
  /** ISO date the row covers (GSC data lags about 2 days). */
  date: string;
  page?: string;
  query?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  /** Average position, 1-based. */
  position: number;
}

/** GSC URL inspection result, the early-warning siren for thin-page trouble. */
export interface IndexCoverageStatus {
  source: "gsc";
  url: string;
  /** e.g. "Submitted and indexed", "Crawled - currently not indexed", "Excluded by noindex tag". */
  coverageState: string;
  lastCrawled: string | null;
  sitemapListed: boolean;
}

/* ── Behavioral events (source: vercel-analytics counts + database rows) ─── */

/** The approved event taxonomy. Names are the analytics event names verbatim. */
export type FunnelEventName =
  | "search_performed"
  | "zero_result_search"
  | "listing_viewed"
  | "listing_contact_action"
  | "ask_question_submitted"
  | "signup_started"
  | "signup_submitted"
  | "newsletter_subscribed";

/** Aggregate count for one event over one period, read from Vercel Analytics. */
export interface FunnelEventCount {
  source: "vercel-analytics";
  event: FunnelEventName;
  periodStart: string;
  periodEnd: string;
  count: number;
}

/**
 * Durable first-party contact event (proposed table: listing_contact_events).
 * Contact actions justify the $89 membership, so they cannot live only in an
 * analytics vendor. No PII: ids and channels only.
 */
export interface ListingContactEvent {
  source: "database";
  id: string;
  listingKind: "teacher" | "event" | "venue";
  listingId: string;
  channel: "website" | "email" | "instagram" | "registration" | "connect";
  state: string | null;
  createdAt: string;
}

/**
 * Durable zero-result search record (proposed table: search_gap_events).
 * Feeds the coverage roadmap: where players looked and found nothing.
 */
export interface SearchGapEvent {
  source: "database";
  id: string;
  surface: "events" | "teachers" | "ask";
  state: string | null;
  city: string | null;
  radiusMiles: number | null;
  createdAt: string;
}

/* ── Inventory and indexability (source: database) ───────────────────────── */

/** Published inventory rollup for one state, from event/venue/player listings. */
export interface StateInventoryMetrics {
  source: "database";
  stateAbbr: string;
  publishedEvents: number;
  publishedVenues: number;
  publishedPlayers: number;
  variantConfirmed: number;
  currentEvidence: number;
}

/** One metro's indexability verdict alongside the counts that produced it. */
export interface MetroSeoStatus {
  source: "database";
  metro: string;
  stateSlug: string;
  citySlug: string;
  published: number;
  variantConfirmed: number;
  currentEvidence: number;
  /** From lib/market-coverage.ts summarizeMetro. */
  readiness: "USEFUL" | "THIN" | "GAP";
  verdict: IndexabilityVerdict;
  inSitemap: boolean;
}

/* ── GA4 (deliberately empty slot) ───────────────────────────────────────── */

/** Placeholder so the dashboard type does not churn if GA4 is ever adopted. */
export interface GA4Slot {
  source: "ga4";
  adopted: false;
}

/* ── The admin SEO dashboard payload ─────────────────────────────────────── */

export interface AdminSeoDashboard {
  generatedAt: string;
  searchConsole: {
    topPages: SearchConsoleMetrics[];
    topQueries: SearchConsoleMetrics[];
    coverage: IndexCoverageStatus[];
  };
  funnels: FunnelEventCount[];
  contactEvents: ListingContactEvent[];
  searchGaps: SearchGapEvent[];
  states: StateInventoryMetrics[];
  metros: MetroSeoStatus[];
  ga4: GA4Slot;
}
