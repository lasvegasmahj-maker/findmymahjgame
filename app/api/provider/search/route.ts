import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";
import { isLaunched, canUseDarkFeature } from "@/lib/launch-gates";
import { clampText } from "@/lib/sanitize";

// Listing lookup for the "claim a listing" flow. Published listings only, and only
// the fields a claimant needs to recognize her own listing; contact details stay
// private until a claim is actually reviewed.
const supabase = lazyServerClient();

export async function GET(req: NextRequest) {
  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("record_class, deactivated_at")
    .eq("id", session.userId)
    .maybeSingle();
  if (profileErr) {
    console.error("provider search: profile read failed:", profileErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (profile.deactivated_at) return NextResponse.json({ error: "Account deactivated" }, { status: 403 });

  const launched = await isLaunched(supabase, "providerClaims");
  if (!canUseDarkFeature(launched, profile.record_class)) {
    return NextResponse.json({ error: "Provider claims are not open yet." }, { status: 403 });
  }

  const q = clampText(req.nextUrl.searchParams.get("q") || "", 80).trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const pattern = `%${q.replace(/[%_]/g, "")}%`;

  const [venues, events] = await Promise.all([
    supabase
      .from("venue_listings")
      .select("id, business_name, city, state")
      .eq("status", "published")
      .or(`business_name.ilike.${pattern},city.ilike.${pattern}`)
      .limit(15),
    supabase
      .from("event_listings")
      .select("id, event_name, city, state")
      .eq("status", "published")
      .or(`event_name.ilike.${pattern},city.ilike.${pattern}`)
      .limit(15),
  ]);

  if (venues.error) console.error("provider search: venue search failed:", venues.error.message);
  if (events.error) console.error("provider search: event search failed:", events.error.message);

  const results = [
    ...(venues.data || []).map((v) => ({ id: v.id, name: v.business_name, city: v.city, state: v.state, listing_table: "venue_listings" as const })),
    ...(events.data || []).map((e) => ({ id: e.id, name: e.event_name, city: e.city, state: e.state, listing_table: "event_listings" as const })),
  ].slice(0, 20);

  return NextResponse.json({ results });
}
