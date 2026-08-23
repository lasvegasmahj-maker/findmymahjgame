import type { MetadataRoute } from "next";
import { ALL_STATE_SLUGS, STATES } from "@/lib/states-data";
import { createServerClient } from "@/lib/supabase-server";
import { cityIndexability } from "@/lib/seo/indexability";
import { buildCityCounts, groupRowsByCity, citySlugOf, type CityCountRow } from "@/lib/seo/city-counts";
import { isFounderListing } from "@/lib/featured-listings";

const BASE = "https://findmymahjgame.com";
const ABBR_TO_SLUG: Record<string, string> = Object.fromEntries(Object.values(STATES).map((s) => [s.abbr, s.slug]));

// Suburb folding and slug-safety now live in lib/seo/city-counts.ts (citySlugOf /
// groupRowsByCity) so the sitemap, the city page, and the admin panel group cities
// identically. LAUNCH_CITY_KEYS remains only as the outage fallback below.
const LAUNCH_CITY_KEYS = [
  "texas/dallas", "texas/houston", "texas/austin", "texas/san-antonio",
  "nevada/las-vegas", "arizona/scottsdale", "florida/boca-raton", "florida/naples",
];

type ListingRow = { city: string | null; state: string | null; updated_at?: string | null; created_at?: string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Real listing timestamps drive lastmod. A sitemap that stamps every URL
  // with the request time teaches crawlers to distrust our lastmod entirely,
  // so entries without a known data timestamp simply omit it.
  // SITEMAP-1: cities enter only when cityIndexability passes; no launch-metro
  // bypass. LAUNCH_CITY_KEYS is the outage fallback only, so a transient DB
  // failure lists the known hubs rather than emptying the sitemap.
  const cityKeys = new Set<string>();
  const cityLastmod = new Map<string, string>();
  const stateLastmod = new Map<string, string>();
  const teacherPages: MetadataRoute.Sitemap = [];

  try {
    const supabase = createServerClient();
    const [ev, ve, pl] = await Promise.all([
      supabase.from("event_listings").select("city, state, mahjong_variant, variant_confidence, confirmed_active_at, updated_at, created_at").eq("status", "published"),
      supabase.from("venue_listings").select("id, city, state, venue_type, description, website, instagram, mahjong_variant, variant_confidence, confirmed_active_at, updated_at, created_at").eq("status", "published"),
      supabase.from("player_listings").select("city, state, updated_at, created_at").eq("status", "published"),
    ]);
    const bump = (map: Map<string, string>, key: string, ts: string | null | undefined) => {
      if (!ts) return;
      const cur = map.get(key);
      if (!cur || ts > cur) map.set(key, ts);
    };

    // supabase-js reports query failures in .error without throwing; surface them
    // so a DB failure reaches the catch and the outage fallback runs, instead of
    // silently emptying every city and teacher URL from the sitemap.
    if (ev.error || ve.error || pl.error) {
      throw new Error(ev.error?.message || ve.error?.message || pl.error?.message || "sitemap query failed");
    }
    const rows: ListingRow[] = [...(ev.data || []), ...(ve.data || []), ...(pl.data || [])];
    for (const r of rows) {
      if (!r.city || !r.state) continue;
      const stateSlug = ABBR_TO_SLUG[r.state];
      if (!stateSlug) continue;
      const ts = r.updated_at || r.created_at;
      bump(stateLastmod, stateSlug, ts);
      const citySlug = citySlugOf(String(r.city));
      if (citySlug) bump(cityLastmod, `${stateSlug}/${citySlug}`, ts);
    }
    // SITEMAP-1: a city is listed only when its verdict is indexable, computed by
    // the same functions the city page and admin panel use so nothing drifts.
    const cityRows = groupRowsByCity(rows as Array<CityCountRow & { state?: string | null }>, ABBR_TO_SLUG);
    for (const [key, counts] of buildCityCounts(cityRows)) {
      if (cityIndexability(counts).indexable) cityKeys.add(key);
    }

    // Teacher profiles mirror the gating in app/teachers/[id]/page.tsx:
    // published venue rows that read as instruction, every state ranked alike.
    const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;
    for (const t of ve.data || []) {
      if (!TEACHER_TYPE.test(`${t.venue_type || ""} ${t.description || ""}`)) continue;
      if (isFounderListing(t)) continue;
      const ts = t.updated_at || t.created_at;
      teacherPages.push({
        url: `${BASE}/teachers/${t.id}`,
        ...(ts ? { lastModified: new Date(ts) } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      });
    }
  } catch {
    for (const k of LAUNCH_CITY_KEYS) cityKeys.add(k);
  }

  // Listing-driven hub pages share the newest listing timestamp; brochure
  // pages omit lastmod rather than fake one.
  const latestListing = [...stateLastmod.values()].sort().pop();
  const listingHub = latestListing ? { lastModified: new Date(latestListing) } : {};

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, ...listingHub, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/events`, ...listingHub, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/teachers`, ...listingHub, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/tournaments`, ...listingHub, changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE}/leagues`, ...listingHub, changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE}/travel`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/cruise`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/list-my-game`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/join`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/founding-advisors`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/states`, ...listingHub, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/play`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/ask`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/help`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/start`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/newsletter`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/how-it-works`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/get-listed`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.4 },
  ];

  // States with published inventory update as listings land; empty states are
  // stable navigation shells, so they carry a lower priority and no lastmod.
  const statePages: MetadataRoute.Sitemap = ALL_STATE_SLUGS.map((slug) => {
    const ts = stateLastmod.get(slug);
    return ts
      ? { url: `${BASE}/states/${slug}`, lastModified: new Date(ts), changeFrequency: "weekly" as const, priority: 0.9 }
      : { url: `${BASE}/states/${slug}`, changeFrequency: "monthly" as const, priority: 0.5 };
  });

  const cityPages: MetadataRoute.Sitemap = [...cityKeys].map((k) => {
    const ts = cityLastmod.get(k);
    return {
      url: `${BASE}/states/${k}`,
      ...(ts ? { lastModified: new Date(ts) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    };
  });

  return [...staticPages, ...statePages, ...cityPages, ...teacherPages];
}
