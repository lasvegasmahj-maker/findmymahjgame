import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyActionToken } from "@/lib/game-token";
import { clampText, isValidEmail, safeHttpUrl, escapeHtml } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

// Claims MVP. The token subject is "<table>|<id>" signed server-side when the
// founder (or a future drip) sends a claim invite. Submitting edits never
// touches the listing: changes land in pending_edits for founder approval.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TABLES = ["venue_listings", "event_listings"] as const;
const EDITABLE: Record<string, string[]> = {
  venue_listings: ["business_name", "venue_type", "city", "state", "description", "website", "instagram", "display_email"],
  event_listings: ["event_name", "city", "state", "venue", "description", "registration_url", "day_time", "frequency"],
};

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "claim", 10, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }
  const b = await req.json().catch(() => ({}));
  const v = typeof b.token === "string" ? verifyActionToken(b.token) : null;
  if (!v || v.action !== "claim") {
    return NextResponse.json({ error: "That link has expired. Reply to our email and we will send a fresh one." }, { status: 401 });
  }
  const [table, id] = String(v.subjectId).split("|");
  if (!TABLES.includes(table as (typeof TABLES)[number]) || !id) {
    return NextResponse.json({ error: "Invalid claim." }, { status: 400 });
  }
  const email = clampText(b.email, 254);
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please add a valid email so we can confirm changes with you." }, { status: 400 });
  }

  const { data: listing } = await supabase.from(table).select("*").eq("id", id).single();
  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  // Record (or refresh) the claim itself.
  const { error: claimErr } = await supabase
    .from("listing_claims")
    .upsert({ listing_table: table, listing_id: id, claimer_email: email.toLowerCase(), status: "claimed" }, { onConflict: "listing_table,listing_id" });
  if (claimErr) {
    if (claimErr.code === "42P01") return NextResponse.json({ error: "Claims open soon. We saved nothing; please try again in a day." }, { status: 503 });
    console.error("claim upsert failed:", claimErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // A claim alone also confirms the listing is alive.
  await supabase.from(table).update({ confirmed_active_at: new Date().toISOString() }).eq("id", id);

  // Collect proposed edits, allowlisted per table, only changed fields.
  const allowed = EDITABLE[table];
  const changes: Record<string, string | null> = {};
  const previous: Record<string, string | null> = {};
  for (const f of allowed) {
    if (b[f] === undefined) continue;
    const urlField = f === "website" || f === "registration_url";
    const next = urlField ? safeHttpUrl(b[f]) || null : clampText(b[f], f === "description" ? 600 : 200) || null;
    if (next !== (listing[f] ?? null)) {
      changes[f] = next;
      previous[f] = listing[f] ?? null;
    }
  }

  if (Object.keys(changes).length) {
    const { error: editErr } = await supabase.from("pending_edits").insert({
      listing_table: table,
      listing_id: id,
      claimer_email: email.toLowerCase(),
      changes,
      previous,
    });
    if (editErr) {
      console.error("pending edit insert failed:", editErr.message);
      return NextResponse.json({ error: "We saved your claim but not the edits. Please try again." }, { status: 500 });
    }
  }

  const name = String(listing.business_name || listing.event_name || "your listing");
  await sendEmail({
    to: "hello@findmymahjgame.com",
    replyTo: email,
    kind: "claim",
    subject: `Claim: ${name}${Object.keys(changes).length ? ` (+${Object.keys(changes).length} edits to review)` : ""}`,
    html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:20px;">
      <h2 style="color:#1a1f5e;">${escapeHtml(name)} was claimed</h2>
      <p style="color:#374151;line-height:1.7;">By: <strong>${escapeHtml(email)}</strong></p>
      ${Object.keys(changes).length ? `<p style="color:#374151;line-height:1.7;">Proposed edits await your review in <a href="https://findmymahjgame.com/admin/edits" style="color:#e91e8c;">the edits queue</a>.</p>` : "<p style='color:#374151;'>No edits proposed; the claim confirmed the listing is active.</p>"}
    </div>`,
  });

  return NextResponse.json({ success: true, edits: Object.keys(changes).length });
}
