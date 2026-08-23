import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";
import { isLaunched, canUseDarkFeature } from "@/lib/launch-gates";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications/notify";
import { track } from "@/lib/analytics/events";
import type { RecordClass } from "@/lib/analytics/events";
import { escapeHtml } from "@/lib/sanitize";
import { scoreClaimEvidence, WINNING_CLAIM_STATUSES, OPEN_CLAIM_STATUSES, type ClaimEvidence } from "@/lib/claims/contract";

// Account-based claim flow. A claim row is only ever an audit entry; ownership is
// granted by writing account_id on the listing itself, done here only when the
// deterministic scorer says autoApprove, and only by an admin otherwise.
const supabase = lazyServerClient();

const TABLES = ["venue_listings", "event_listings"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadCaller(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("record_class, deactivated_at")
    .eq("id", userId)
    .maybeSingle();
  return { data, error };
}

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "claims-submit", 10, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile, error: profileErr } = await loadCaller(session.userId);
  if (profileErr) {
    console.error("claims submit: profile read failed:", profileErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (profile.deactivated_at) return NextResponse.json({ error: "Account deactivated" }, { status: 403 });

  const launched = await isLaunched(supabase, "providerClaims");
  if (!canUseDarkFeature(launched, profile.record_class)) {
    return NextResponse.json({ error: "Provider claims are not open yet." }, { status: 403 });
  }
  const recordClass = profile.record_class as RecordClass;

  await track(supabase, "provider_claim_started", { recordClass });

  const body = (await req.json().catch(() => null)) || {};
  const table = String(body?.listing_table || "");
  const id = String(body?.listing_id || "");
  if (!TABLES.includes(table as (typeof TABLES)[number]) || !UUID.test(id)) {
    return NextResponse.json({ error: "Invalid listing." }, { status: 400 });
  }

  const { data: listing, error: listingErr } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (listingErr) {
    console.error("claims submit: listing read failed:", listingErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!listing || listing.status !== "published") {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const { data: userRes, error: userErr } = await supabase.auth.admin.getUserById(session.userId);
  const accountEmail = userRes?.user?.email;
  if (userErr || !accountEmail) {
    console.error("claims submit: account email lookup failed:", userErr?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const { data: winningClaim } = await supabase
    .from("listing_claims")
    .select("id, profile_id, status, confidence, decision_reason, created_at")
    .eq("listing_table", table)
    .eq("listing_id", id)
    .in("status", WINNING_CLAIM_STATUSES)
    .maybeSingle();

  // The owner (or the holder of the winning claim) resubmitting is idempotent, not
  // a fresh takeover attempt: return the existing win rather than a new row.
  if (listing.account_id === session.userId || winningClaim?.profile_id === session.userId) {
    return NextResponse.json({ claim: winningClaim, alreadySubmitted: true });
  }

  const { data: openClaims } = await supabase
    .from("listing_claims")
    .select("id, profile_id")
    .eq("listing_table", table)
    .eq("listing_id", id)
    .in("status", OPEN_CLAIM_STATUSES);

  const mineOpen = (openClaims || []).find((c) => c.profile_id === session.userId);
  if (mineOpen) {
    const { data: existing } = await supabase
      .from("listing_claims")
      .select("id, status, confidence, decision_reason, created_at")
      .eq("id", mineOpen.id)
      .maybeSingle();
    return NextResponse.json({ claim: existing, alreadySubmitted: true });
  }
  const hasOpenCompetingClaim = (openClaims || []).some((c) => c.profile_id !== session.userId);

  const evidence: ClaimEvidence = {
    accountEmail,
    listingEmail: listing.contact_email || listing.display_email || null,
    listingWebsite: listing.website || null,
    listingName: listing.business_name || listing.event_name || null,
    listingAlreadyOwned: Boolean(listing.account_id) || Boolean(winningClaim),
    hasOpenCompetingClaim,
  };
  const score = scoreClaimEvidence(evidence);

  let status: string;
  let decisionReason: string;
  let decidedBy: string | null = null;
  let decidedAt: string | null = null;

  if (score.autoApprove) {
    // Optimistic guard: only the first request to reach a still-unowned listing wins,
    // so two concurrent auto-approvals can never both succeed. A failed or errored
    // write (including a schema not yet caught up to this contract) never gets
    // reported as a win; it falls back to a human decision instead.
    const { data: updated, error: updateErr } = await supabase
      .from(table)
      .update({ account_id: session.userId })
      .eq("id", id)
      .is("account_id", null)
      .select("id");
    if (!updateErr && updated && updated.length > 0) {
      status = "auto_approved";
      decisionReason = score.reasons.join("; ");
      decidedBy = "system";
      decidedAt = new Date().toISOString();
    } else {
      if (updateErr) console.error("claims submit: auto-approve ownership write failed:", updateErr.message);
      status = "needs_review";
      decisionReason = "automatic approval could not be completed; needs manual review";
    }
  } else {
    status = "needs_review";
    decisionReason = score.confidence === "medium" ? "agent research required" : score.reasons.join("; ");
  }

  const { data: claim, error: insertErr } = await supabase
    .from("listing_claims")
    .insert({
      listing_table: table,
      listing_id: id,
      claimer_email: accountEmail.toLowerCase(),
      profile_id: session.userId,
      evidence,
      confidence: score.confidence,
      status,
      decision_reason: decisionReason,
      decided_by: decidedBy,
      decided_at: decidedAt,
      record_class: recordClass,
    })
    .select("id, status, confidence, decision_reason, created_at")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json({ error: "You already have a claim in progress for this listing." }, { status: 409 });
    }
    console.error("claims submit: insert failed:", insertErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  await track(supabase, "provider_claim_submitted", { props: { listing_table: table, confidence: score.confidence }, recordClass });
  await track(supabase, status === "auto_approved" ? "provider_claim_approved" : "provider_claim_escalated", { props: { listing_table: table }, recordClass });

  const listingName = String(listing.business_name || listing.event_name || "your listing");
  await notify(supabase, {
    to: accountEmail,
    userId: session.userId,
    kind: "claim_received",
    subject: `We received your claim for ${listingName}`,
    html: `<p>Thanks! We received your claim for <strong>${escapeHtml(listingName)}</strong>.</p>${
      status === "auto_approved"
        ? "<p>Good news, it matched automatically and you now own this listing. Visit your provider dashboard to manage it.</p>"
        : "<p>We are reviewing it and will follow up by email.</p>"
    }`,
    related: { table: "listing_claims", id: claim.id },
    recordClass,
  });
  if (status === "auto_approved") {
    await notify(supabase, {
      to: accountEmail,
      userId: session.userId,
      kind: "claim_approved",
      subject: `You're verified: ${listingName}`,
      html: `<p>Your claim for <strong>${escapeHtml(listingName)}</strong> was approved automatically. You can now edit it from your provider dashboard.</p>`,
      related: { table: "listing_claims", id: claim.id },
      recordClass,
    });
  } else {
    await notify(supabase, {
      to: accountEmail,
      userId: session.userId,
      kind: "claim_needs_info",
      subject: `Your claim for ${listingName} is under review`,
      html: `<p>Your claim for <strong>${escapeHtml(listingName)}</strong> needs a closer look. We will email you once it is decided.</p>`,
      related: { table: "listing_claims", id: claim.id },
      recordClass,
    });
  }

  return NextResponse.json({ claim });
}

export async function GET(req: NextRequest) {
  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile, error: profileErr } = await loadCaller(session.userId);
  if (profileErr) {
    console.error("claims list: profile read failed:", profileErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (profile.deactivated_at) return NextResponse.json({ error: "Account deactivated" }, { status: 403 });

  const launched = await isLaunched(supabase, "providerClaims");
  if (!canUseDarkFeature(launched, profile.record_class)) {
    return NextResponse.json({ error: "Provider claims are not open yet." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("listing_claims")
    .select("id, listing_table, listing_id, status, confidence, decision_reason, created_at, decided_at")
    .eq("profile_id", session.userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("claims list failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ claims: data || [] });
}
