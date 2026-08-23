import { NextRequest, NextResponse } from "next/server";
import { trialUntilFrom } from "@/lib/premium";
import { verifyActionToken } from "@/lib/game-token";
import { clampText, isValidEmail, safeHttpUrl, escapeHtml } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { lazyServerClient } from "@/lib/supabase-server";
import { WINNING_CLAIM_STATUSES } from "@/lib/claims/contract";

// Claims MVP. The token subject is "<table>|<id>" signed server-side when the
// founder (or a future drip) sends a claim invite. Submitting edits never
// touches the listing: changes land in pending_edits for founder approval.
const supabase = lazyServerClient();

const TABLES = ["venue_listings", "event_listings"] as const;
const EDITABLE: Record<string, string[]> = {
  venue_listings: ["business_name", "venue_type", "city", "state", "description", "website", "instagram", "display_email"],
  event_listings: ["event_name", "city", "state", "venue", "description", "registration_url", "day_time", "frequency"],
};

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "claim", 10, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }
  const b = (await req.json().catch(() => null)) || {};
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

  // Record (or refresh) the claim itself. Filtered to winning statuses because a
  // listing can now also carry competing 'submitted'/'needs_review' rows from the
  // account-based claim flow; without this filter a second open row breaks maybeSingle.
  const { data: priorClaim } = await supabase
    .from("listing_claims")
    .select("claimer_email")
    .eq("listing_table", table)
    .eq("listing_id", id)
    .in("status", WINNING_CLAIM_STATUSES)
    .maybeSingle();
  if (priorClaim && priorClaim.claimer_email !== email.toLowerCase()) {
    return NextResponse.json({ error: "This listing is already claimed. If that is you under a different email, or something looks wrong, email hello@findmymahjgame.com and a real person will sort it out." }, { status: 409 });
  }
  // Plain insert, not upsert: two simultaneous claims both passed the prior-claim read, and
  // upsert let the second silently overwrite the first claimer. The unique index makes the
  // database the referee; the loser gets the same 409 a serialized request would have seen.
  const { error: claimErr } = await supabase
    .from("listing_claims")
    .insert({ listing_table: table, listing_id: id, claimer_email: email.toLowerCase(), status: "claimed" });
  if (claimErr) {
    if (claimErr.code === "23505") {
      const { data: winner } = await supabase.from("listing_claims").select("claimer_email").eq("listing_table", table).eq("listing_id", id).in("status", WINNING_CLAIM_STATUSES).maybeSingle();
      const mine = winner?.claimer_email === email.toLowerCase();
      if (!mine) return NextResponse.json({ error: "This listing is already claimed. If that is you under a different email, or something looks wrong, email hello@findmymahjgame.com and a real person will sort it out." }, { status: 409 });
    } else if (claimErr.code === "42P01" || claimErr.code === "PGRST205") {
      return NextResponse.json({ error: "Claims open soon. We saved nothing; please try again in a day." }, { status: 503 });
    } else {
      console.error("claim insert failed:", claimErr.message);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  }

  // A claim alone also confirms the listing is alive.
  await supabase.from(table).update({ confirmed_active_at: new Date().toISOString() }).eq("id", id);

  // Account bridge: if this email already has an account, the token claim also grants
  // ownership immediately, so someone who signed in first never has to claim twice.
  // Best-effort only: this SDK's listUsers has no server-side email filter, so this
  // scans one page of accounts, which is more than enough while accounts are
  // pre-launch. account_id may not exist on every deployment yet either, so a write
  // failure here is logged and never blocks the claim itself.
  try {
    const { data: usersPage, error: usersErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersErr) throw usersErr;
    const account = usersPage?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (account) {
      const { data: owned, error: ownErr } = await supabase.from(table).update({ account_id: account.id }).eq("id", id).is("account_id", null).select("id");
      if (ownErr) console.error("claim: account_id backfill failed:", ownErr.message);
      if (!ownErr && owned && owned.length > 0 && table === "venue_listings") {
        const { error: trialErr } = await supabase.from(table).update({ premium_until: trialUntilFrom(new Date()) }).eq("id", id).is("premium_until", null);
        if (trialErr) console.error("claim: trial start failed:", trialErr.message);
      }
    }
  } catch (e) {
    console.error("claim: account lookup failed:", e instanceof Error ? e.message : e);
  }

  // Collect proposed edits, allowlisted per table, only changed fields.
  const allowed = EDITABLE[table];
  const changes: Record<string, string | null> = {};
  const previous: Record<string, string | null> = {};
  for (const f of allowed) {
    if (b[f] === undefined) continue;
    const urlField = f === "website" || f === "registration_url";
    let next: string | null;
    if (urlField) {
      const raw = String(b[f] ?? "").trim();
      const withScheme = raw && !/^https?:\/\//i.test(raw) ? `https://${raw}` : raw;
      next = safeHttpUrl(withScheme) || null;
      // A non-empty input that still fails validation is a typo, not a
      // request to erase her link: skip the field rather than propose null.
      if (raw && !next) continue;
    } else {
      next = clampText(b[f], f === "description" ? 600 : 200) || null;
    }
    if ((f === "business_name" || f === "event_name") && !next) continue;
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
