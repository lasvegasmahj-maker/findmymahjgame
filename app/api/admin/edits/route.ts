import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { lazyServerClient } from "@/lib/supabase-server";

// Founder review of claimer-proposed edits. Approving applies the allowlisted
// changes to the listing; the pending_edits row keeps both versions as the
// audit trail, never deleted.
const supabase = lazyServerClient();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABLES = ["venue_listings", "event_listings"];
// Mirror of the claim route's allowlist: approval re-filters so a jsonb row
// can never smuggle status, tier, or any non-editable column to the listing.
const EDITABLE: Record<string, string[]> = {
  venue_listings: ["business_name", "venue_type", "city", "state", "description", "website", "instagram", "display_email"],
  event_listings: ["event_name", "city", "state", "venue", "description", "registration_url", "day_time", "frequency"],
};

function authed(req: NextRequest) {
  return verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("pending_edits")
    .select("*")
    .order("status", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return NextResponse.json({ needsMigration: true, items: [] });
    console.error("edits list failed:", error.message);
    return NextResponse.json({ error: "Could not load edits." }, { status: 500 });
  }
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  const decision = String(b.decision || "");
  if (!UUID.test(id) || !["approve", "reject"].includes(decision)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Atomic claim of the pending row so a double click cannot double-apply.
  const { data: edit } = await supabase
    .from("pending_edits")
    .update({ status: decision === "approve" ? "approved" : "rejected", decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .single();
  if (!edit) return NextResponse.json({ error: "Already decided." }, { status: 409 });

  if (decision === "approve") {
    if (!TABLES.includes(edit.listing_table)) {
      return NextResponse.json({ error: "Invalid table." }, { status: 400 });
    }
    const allowed = EDITABLE[edit.listing_table] || [];
    const filtered: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(edit.changes as Record<string, unknown>)) {
      if (allowed.includes(k)) filtered[k] = val;
    }
    const { error: applyErr } = await supabase
      .from(edit.listing_table)
      .update({ ...filtered, confirmed_active_at: new Date().toISOString() })
      .eq("id", edit.listing_id);
    if (applyErr) {
      console.error("edit apply failed:", applyErr.message);
      await supabase.from("pending_edits").update({ status: "pending", decided_at: null }).eq("id", id);
      return NextResponse.json({ error: "Could not apply the changes. Try again." }, { status: 500 });
    }
  }
  return NextResponse.json({ success: true });
}
