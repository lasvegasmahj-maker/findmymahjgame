import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { lazyServerClient } from "@/lib/supabase-server";
import { notify } from "@/lib/notifications/notify";
import { track } from "@/lib/analytics/events";
import type { RecordClass } from "@/lib/analytics/events";
import { escapeHtml, clampText } from "@/lib/sanitize";

// Founder review of needs_review claims. Approving is the one place outside the
// deterministic scorer that ownership is granted; the human decision is logged on
// the claim row (decided_by 'admin') exactly like the system path (decided_by
// 'system'), and never depends on session.role.
const supabase = lazyServerClient();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABLES = ["venue_listings", "event_listings"];
const LIST_STATUSES = ["needs_review", "submitted", "auto_approved", "approved", "rejected", "withdrawn", "claimed", "all"];

function authed(req: NextRequest) {
  return verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "needs_review";
  if (!LIST_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  let query = supabase.from("listing_claims").select("*").order("created_at", { ascending: false }).limit(200);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) {
    console.error("admin claims list failed:", error.message);
    return NextResponse.json({ error: "Could not load claims." }, { status: 500 });
  }
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = (await req.json().catch(() => null)) || {};
  const id = String(b.id || "");
  const decision = String(b.decision || "");
  const reason = typeof b.reason === "string" ? clampText(b.reason, 300) : "";
  if (!UUID.test(id) || !["approve", "reject"].includes(decision)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Atomic claim of the pending row so a double click cannot double-decide it.
  const { data: claimRow, error: claimErr } = await supabase
    .from("listing_claims")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      decided_by: "admin",
      decided_at: new Date().toISOString(),
      decision_reason: reason || (decision === "approve" ? "admin approved" : "admin rejected"),
    })
    .eq("id", id)
    .eq("status", "needs_review")
    .select("*")
    .maybeSingle();
  if (claimErr) {
    console.error("admin claims decide failed:", claimErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!claimRow) return NextResponse.json({ error: "Already decided or not found." }, { status: 409 });

  if (decision === "approve") {
    if (!TABLES.includes(claimRow.listing_table)) {
      await supabase.from("listing_claims").update({ status: "needs_review", decided_by: null, decided_at: null }).eq("id", id);
      return NextResponse.json({ error: "Invalid listing table on this claim." }, { status: 400 });
    }
    const { data: updated, error: ownErr } = await supabase
      .from(claimRow.listing_table)
      .update({ account_id: claimRow.profile_id })
      .eq("id", claimRow.listing_id)
      .select("id");
    if (ownErr || !updated || updated.length === 0) {
      console.error("admin claims approve: ownership write failed:", ownErr?.message);
      await supabase.from("listing_claims").update({ status: "needs_review", decided_by: null, decided_at: null }).eq("id", id);
      return NextResponse.json({ error: "Could not grant ownership. Please try again." }, { status: 500 });
    }
  }

  const { data: listing } = await supabase
    .from(claimRow.listing_table)
    .select("business_name, event_name")
    .eq("id", claimRow.listing_id)
    .maybeSingle();
  const listingName = String(listing?.business_name || listing?.event_name || "your listing");
  const recordClass = (claimRow.record_class || "real_external") as RecordClass;

  await notify(supabase, {
    to: claimRow.claimer_email,
    userId: claimRow.profile_id,
    kind: decision === "approve" ? "claim_approved" : "claim_rejected",
    subject: decision === "approve" ? `You're verified: ${listingName}` : `About your claim for ${listingName}`,
    html:
      decision === "approve"
        ? `<p>Your claim for <strong>${escapeHtml(listingName)}</strong> was approved. You can now edit it from your provider dashboard.</p>`
        : `<p>Your claim for <strong>${escapeHtml(listingName)}</strong> was not approved.</p>${reason ? `<p>${escapeHtml(reason)}</p>` : ""}<p>If this is a mistake, reply to this email and a real person will help.</p>`,
    related: { table: "listing_claims", id: claimRow.id },
    recordClass,
  });

  await track(supabase, decision === "approve" ? "provider_claim_approved" : "provider_claim_rejected", {
    props: { listing_table: claimRow.listing_table },
    recordClass,
  });

  return NextResponse.json({ success: true });
}
