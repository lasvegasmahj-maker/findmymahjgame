import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { lazyServerClient } from "@/lib/supabase-server";
import { gscStatus, gscSearchAnalytics } from "@/lib/seo/gsc";
import { cityIndexability } from "@/lib/seo/indexability";
import { buildCityCounts, groupRowsByCity } from "@/lib/seo/city-counts";
import { STATES } from "@/lib/states-data";

const supabase = lazyServerClient();

const ABBR_TO_SLUG: Record<string, string> = {};
for (const s of Object.values(STATES)) ABBR_TO_SLUG[s.abbr] = s.slug;

// Admin SEO panel data: indexability truth from the same functions the sitemap
// and city pages use, plus Search Console when the owner connects it. Search
// data absent means NOT CONNECTED, never zeros.
export async function GET(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [ev, ve] = await Promise.all([
    supabase.from("event_listings").select("city, state, mahjong_variant, variant_confidence, confirmed_active_at").eq("status", "published"),
    supabase.from("venue_listings").select("city, state, mahjong_variant, variant_confidence, confirmed_active_at").eq("status", "published"),
  ]);
  if (ev.error || ve.error) {
    return NextResponse.json({ error: "Indexability data unavailable" }, { status: 500 });
  }

  const byCity = groupRowsByCity([...(ev.data || []), ...(ve.data || [])], ABBR_TO_SLUG);
  const cities = [...buildCityCounts(byCity)].map(([key, counts]) => {
    const v = cityIndexability(counts);
    return { key, ...counts, indexable: v.indexable, reason: v.reason };
  }).sort((a, b) => Number(b.indexable) - Number(a.indexable) || b.published - a.published);

  const gsc = await gscStatus();
  let topQueries: unknown = null;
  if (gsc.connected) {
    try {
      topQueries = await gscSearchAnalytics({ dimension: "query", days: 28 });
    } catch {
      topQueries = null;
    }
  }

  return NextResponse.json({
    indexability: {
      indexableCities: cities.filter((c) => c.indexable).length,
      noindexCities: cities.filter((c) => !c.indexable).length,
      cities: cities.slice(0, 100),
    },
    searchConsole: gsc.connected
      ? { connected: true, topQueries }
      : { connected: false, reason: gsc.reason },
  });
}
