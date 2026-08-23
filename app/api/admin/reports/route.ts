import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { lazyServerClient } from "@/lib/supabase-server";
import { clampText } from "@/lib/sanitize";
import { REPORT_STATUSES } from "@/lib/safety/triage";

// Admin review queue for user_reports. Not gated by launch_player_matching: a
// founder needs to see reports that land during dark QA testing too, so this
// route is admin-cookie gated only.
const supabase = lazyServerClient();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NOTE_LENGTH = 2000;

function authed(req: NextRequest) {
  return verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  if (status && !(REPORT_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  let query = supabase.from("user_reports").select("*").order("created_at", { ascending: true }).limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return NextResponse.json({ needsMigration: true, items: [] });
    console.error("admin/reports list failed:", error.message);
    return NextResponse.json({ error: "Could not load reports." }, { status: 500 });
  }
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const id = String(body?.id || "");
  const decision = String(body?.decision || "");
  const triageNote = clampText(body?.triage_note, MAX_NOTE_LENGTH).trim();

  if (!UUID.test(id) || !["resolve", "dismiss"].includes(decision)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!triageNote) {
    return NextResponse.json({ error: "A triage note is required." }, { status: 400 });
  }

  // Atomic claim: only moves a report that is still open, so two admins acting
  // on the same report at once cannot both "win" and overwrite each other's note.
  const { data: report } = await supabase
    .from("user_reports")
    .update({
      status: decision === "resolve" ? "resolved" : "dismissed",
      triage_note: triageNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ["new", "triaged_low", "needs_human"])
    .select("id")
    .single();
  if (!report) return NextResponse.json({ error: "Already decided." }, { status: 409 });

  return NextResponse.json({ ok: true });
}
