import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";
import { isLaunched, canUseDarkFeature } from "@/lib/launch-gates";
import { isBillingConfigured } from "@/lib/billing/stripe";

const supabase = lazyServerClient();

export async function GET(req: NextRequest) {
  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("record_class, deactivated_at, display_name")
    .eq("id", session.userId)
    .maybeSingle();
  if (profileErr) {
    console.error("provider dashboard: profile read failed:", profileErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (profile.deactivated_at) return NextResponse.json({ error: "Account deactivated" }, { status: 403 });

  const launched = await isLaunched(supabase, "providerClaims");
  if (!canUseDarkFeature(launched, profile.record_class)) {
    return NextResponse.json({ error: "Provider claims are not open yet." }, { status: 403 });
  }

  const [venuesRes, eventsRes, claimsRes] = await Promise.all([
    supabase
      .from("venue_listings")
      .select("id, business_name, city, state, status, tier, premium_until, stripe_payment_id, website, instagram, display_email, description")
      .eq("account_id", session.userId),
    supabase
      .from("event_listings")
      .select("id, event_name, city, state, status, tier, description")
      .eq("account_id", session.userId),
    supabase
      .from("listing_claims")
      .select("id, listing_table, listing_id, status, confidence, decision_reason, created_at, decided_at")
      .eq("profile_id", session.userId)
      .order("created_at", { ascending: false }),
  ]);

  // account_id is not present on every deployment of venue_listings/event_listings yet
  // (it ships in a separate migration); a structural read error here must never crash
  // the dashboard, it just means there is nothing owned to show until that lands.
  if (venuesRes.error) console.error("provider dashboard: venue listings read failed:", venuesRes.error.message);
  if (eventsRes.error) console.error("provider dashboard: event listings read failed:", eventsRes.error.message);
  if (claimsRes.error) console.error("provider dashboard: claims read failed:", claimsRes.error.message);

  // The raw payment id stays server-side; the dashboard only needs to know
  // whether the entitlement is paid or the complimentary trial.
  const venues = (venuesRes.error ? [] : venuesRes.data || []).map(({ stripe_payment_id, ...v }) => ({ ...v, premium_paid: Boolean(stripe_payment_id), listing_table: "venue_listings" as const }));
  const events = (eventsRes.error ? [] : eventsRes.data || []).map((e) => ({ ...e, listing_table: "event_listings" as const }));

  return NextResponse.json({
    displayName: profile.display_name,
    ownedListings: [...venues, ...events],
    claims: claimsRes.error ? [] : claimsRes.data || [],
    billing: { configured: isBillingConfigured() },
  });
}
