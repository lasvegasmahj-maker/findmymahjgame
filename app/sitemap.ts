import type { MetadataRoute } from "next";
import { ALL_STATE_SLUGS, STATES } from "@/lib/states-data";
import { createServerClient } from "@/lib/supabase-server";

const BASE = "https://findmymahjgame.com";
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ABBR_TO_SLUG: Record<string, string> = Object.fromEntries(Object.values(STATES).map((s) => [s.abbr, s.slug]));

// Suburbs fold into their metro hub so we never publish thin duplicate city
// pages (a Plano listing strengthens /states/texas/dallas, not a separate page).
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

// The 8 launch metros are always listed even before inventory lands.
const LAUNCH_CITY_KEYS = [
  "texas/dallas", "texas/houston", "texas/austin", "texas/san-antonio",
  "nevada/las-vegas", "arizona/scottsdale", "florida/boca-raton", "florida/naples",
];

type ListingRow = { city: string | null; state: string | null; updated_at?: string | null; created_at?: string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Real listing timestamps drive lastmod. A sitemap that stamps every URL
  // with the request time teaches crawlers to distrust our lastmod entirely,
  // so entries without a known data timestamp simply omit it.
  const cityKeys = new Set<string>(LAUNCH_CITY_KEYS);
  const cityLastmod = new Map<string, string>();
  const stateLastmod = new Map<string, string>();
  const teacherPages: MetadataRoute.Sitemap = [];

  try {
    const supabase = createServerClient();
    const [ev, ve, pl] = await Promise.all([
      supabase.from("event_listings").select("city, state, updated_at, created_at").eq("status", "published"),
      supabase.from("venue_listings").select("id, city, state, venue_type, description, updated_at, created_at").eq("status", "published"),
      supabase.from("player_listings").select("city, state, updated_at, created_at").eq("status", "published"),
    ]);
    const bump = (map: Map<string, string>, key: string, ts: string | null | undefined) => {
      if (!ts) return;
      const cur = map.get(key);
      if (!cur || ts > cur) map.set(key, ts);
    };

    const rows: ListingRow[] = [...(ev.data || []), ...(ve.data || []), ...(pl.data || [])];
    for (const r of rows) {
      if (!r.city || !r.state) continue;
      const stateSlug = ABBR_TO_SLUG[r.state];
      if (!stateSlug) continue;
      const ts = r.updated_at || r.created_at;
      bump(stateLastmod, stateSlug, ts);
      const c = String(r.city).trim().toLowerCase();
      // A city page only matches listings whose raw city value equals the slug
      // with hyphens read as spaces (see app/states/[state]/[city]/page.tsx),
      // so punctuated values like "Chicago (Clearing)" or "Los Angeles /
      // Nashville" can never populate the page their slug points to. Skip them
      // here instead of publishing an empty page; those listings still appear
      // on their state page.
      const citySlug = SUBURB_TO_HUB[c] || (slugify(c).replace(/-/g, " ") === c ? slugify(c) : null);
      if (!citySlug) continue;
      const key = `${stateSlug}/${citySlug}`;
      cityKeys.add(key);
      bump(cityLastmod, key, ts);
    }

    // Teacher profiles mirror the gating in app/teachers/[id]/page.tsx:
    // published venue rows that read as instruction, outside Nevada (Nevada
    // lessons route to Las Vegas Mahjong).
    const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;
    for (const t of ve.data || []) {
      if (t.state === "NV") continue;
      if (!TEACHER_TYPE.test(`${t.venue_type || ""} ${t.description || ""}`)) continue;
      const ts = t.updated_at || t.created_at;
      teacherPages.push({
        url: `${BASE}/teachers/${t.id}`,
        ...(ts ? { lastModified: new Date(ts) } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      });
    }
  } catch { /* keep the launch metros; skip teacher profiles */ }

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
