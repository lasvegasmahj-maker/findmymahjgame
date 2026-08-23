import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";
import { isLaunched, canUseDarkFeature } from "@/lib/launch-gates";
import { rateLimit } from "@/lib/rate-limit";
import { clampText, isValidEmail, safeHttpUrl } from "@/lib/sanitize";
import { track } from "@/lib/analytics/events";
import type { RecordClass } from "@/lib/analytics/events";

// A verified owner may propose changes to a narrow set of low-risk fields on her own
// listing. Nothing here ever writes the listing directly: every change lands in the
// existing pending_edits review queue, same as the legacy claim flow, so a real
// person confirms every change before it goes live.
const supabase = lazyServerClient();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EDITABLE: Record<string, string[]> = {
  venue_listings: ["display_email", "website", "instagram", "description"],
  event_listings: ["description"],
};

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "provider-edit", 20, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("record_class, deactivated_at")
    .eq("id", session.userId)
    .maybeSingle();
  if (profileErr) {
    console.error("provider edit: profile read failed:", profileErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (profile.deactivated_at) return NextResponse.json({ error: "Account deactivated" }, { status: 403 });

  const launched = await isLaunched(supabase, "providerClaims");
  if (!canUseDarkFeature(launched, profile.record_class)) {
    return NextResponse.json({ error: "Provider claims are not open yet." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const table = String(body?.listing_table || "");
  const id = String(body?.listing_id || "");
  const allowed = EDITABLE[table];
  if (!allowed || !UUID.test(id)) {
    return NextResponse.json({ error: "Invalid listing." }, { status: 400 });
  }

  // select("*") on purpose: account_id may not exist on every deployment yet, and a
  // named column that does not exist errors the whole query instead of reading null.
  const { data: listing, error: listingErr } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (listingErr) {
    console.error("provider edit: listing read failed:", listingErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!listing || listing.account_id !== session.userId) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const changes: Record<string, string | null> = {};
  const previous: Record<string, string | null> = {};
  for (const f of allowed) {
    if (body[f] === undefined) continue;
    let next: string | null;
    if (f === "website") {
      const raw = String(body[f] ?? "").trim();
      const withScheme = raw && !/^https?:\/\//i.test(raw) ? `https://${raw}` : raw;
      next = safeHttpUrl(withScheme) || null;
      if (raw && !next) continue;
    } else if (f === "display_email") {
      const raw = clampText(body[f], 254);
      if (raw && !isValidEmail(raw)) continue;
      next = raw || null;
    } else {
      next = clampText(body[f], f === "description" ? 600 : 200) || null;
    }
    if (next !== (listing[f] ?? null)) {
      changes[f] = next;
      previous[f] = listing[f] ?? null;
    }
  }

  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "No changes to submit." }, { status: 400 });
  }

  const { data: userRes, error: userErr } = await supabase.auth.admin.getUserById(session.userId);
  const accountEmail = userRes?.user?.email;
  if (userErr || !accountEmail) {
    console.error("provider edit: account email lookup failed:", userErr?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const { error: insertErr } = await supabase.from("pending_edits").insert({
    listing_table: table,
    listing_id: id,
    claimer_email: accountEmail.toLowerCase(),
    changes,
    previous,
  });
  if (insertErr) {
    console.error("provider edit: pending_edits insert failed:", insertErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  await track(supabase, "listing_updated", {
    props: { listing_table: table, field_count: Object.keys(changes).length },
    recordClass: profile.record_class as RecordClass,
  });

  return NextResponse.json({ success: true, pending: Object.keys(changes) });
}
