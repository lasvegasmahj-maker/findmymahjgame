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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/events`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/teachers`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/tournaments`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE}/leagues`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE}/travel`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/cruise`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/list-my-game`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/states`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/play`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/start`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/newsletter`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/ambassadors`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/get-listed`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/advertise`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const statePages: MetadataRoute.Sitemap = ALL_STATE_SLUGS.map((slug) => ({
    url: `${BASE}/states/${slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9,
  }));

  // Inventory-gated city pages: every city with a real published listing earns
  // a sitemap entry (suburbs fold into their metro hub). Falls back to the
  // launch metros if the query fails.
  const cityKeys = new Set<string>(LAUNCH_CITY_KEYS);
  try {
    const supabase = createServerClient();
    const [ev, ve, pl] = await Promise.all([
      supabase.from("event_listings").select("city, state").eq("status", "published"),
      supabase.from("venue_listings").select("id, city, state, venue_type, description").eq("status", "published"),
      supabase.from("player_listings").select("city, state").eq("status", "published"),
    ]);
    for (const r of [...(ev.data || []), ...(ve.data || []), ...(pl.data || [])]) {
      if (!r.city || !r.state) continue;
      const stateSlug = ABBR_TO_SLUG[r.state];
      if (!stateSlug) continue;
      const c = String(r.city).trim().toLowerCase();
      cityKeys.add(`${stateSlug}/${SUBURB_TO_HUB[c] || slugify(c)}`);
    }
  } catch { /* keep the launch metros */ }

  const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;
  const teacherPages: MetadataRoute.Sitemap = [];
  try {
    const supabase2 = createServerClient();
    const { data: tv } = await supabase2.from("venue_listings").select("id, state, venue_type, description").eq("status", "published");
    for (const t of tv || []) {
      if (t.state === "NV") continue;
      if (!TEACHER_TYPE.test(`${t.venue_type || ""} ${t.description || ""}`)) continue;
      teacherPages.push({ url: `${BASE}/teachers/${t.id}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 });
    }
  } catch { /* skip teacher profiles if unavailable */ }

  const cityPages: MetadataRoute.Sitemap = [...cityKeys].map((k) => ({
    url: `${BASE}/states/${k}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.85,
  }));

  return [...staticPages, ...statePages, ...cityPages, ...teacherPages];
}
