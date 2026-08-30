import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyGameToken } from "@/lib/game-token";
import { rateLimit } from "@/lib/rate-limit";
import { lazyServerClient } from "@/lib/supabase-server";
import { quickTablesAccess } from "@/lib/tables-gate";

const supabase = lazyServerClient();

// "Run it back": a host who confirmed "yes, we played" turns this week's game
// into next week's table. The original becomes a recurring series, and we clone
// its day/time/city/host context into a fresh forming table linked by
// parent_table_id. We re-seat ONLY the host, never the other players, so no one
// is re-added or emailed without choosing to rejoin (no auto-spam, no roster
// exposure). GET never mutates; only the human form POST clones.
const CLONE_FIELDS =
  "host_name, host_phone, host_email, city, state, day_of_week, time_of_day, venue_type, venue_name, skill, seats_total, referred_by, record_class";

export async function GET(req: NextRequest) {
  return NextResponse.redirect(`${req.nextUrl.origin}/played?result=yes`);
}

export async function POST(req: NextRequest) {
  const siteUrl = req.nextUrl.origin;
  if (!(await rateLimit(req, "run-it-back", 5, 60))) {
    return NextResponse.redirect(`${siteUrl}/played?result=yes`, 303);
  }
  if (!(await quickTablesAccess(req, supabase)).allowed) return NextResponse.redirect(`${siteUrl}/played?result=closed`, 303);
  const form = await req.formData().catch(() => null);
  const token = String(form?.get("token") || "");
  const v = token ? verifyGameToken(token) : null;
  if (!v || v.answer !== "yes") {
    return NextResponse.redirect(`${siteUrl}/played?result=yes`, 303);
  }

  const { data: orig, error: readErr } = await supabase
    .from("tables")
    .select(CLONE_FIELDS)
    .eq("id", v.tableId)
    .single();
  if (readErr || !orig) {
    console.error("run-it-back: original not found", readErr?.message);
    return NextResponse.redirect(`${siteUrl}/played?result=yes`, 303);
  }

  // Mark the original as a recurring series so the North Star can count it.
  await supabase.from("tables").update({ is_recurring: true }).eq("id", v.tableId);

  // Idempotent against a double tap: if a clone already exists, go to it.
  const { data: existing } = await supabase
    .from("tables")
    .select("share_code")
    .eq("parent_table_id", v.tableId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.share_code) {
    return NextResponse.redirect(`${siteUrl}/t/${existing.share_code}`, 303);
  }

  const shareCode = crypto.randomBytes(4).toString("hex");
  const { data: child, error: cloneErr } = await supabase
    .from("tables")
    .insert({
      share_code: shareCode,
      host_name: orig.host_name,
      host_phone: orig.host_phone,
      host_email: orig.host_email,
      city: orig.city,
      state: orig.state,
      day_of_week: orig.day_of_week,
      time_of_day: orig.time_of_day,
      venue_type: orig.venue_type,
      venue_name: orig.venue_name,
      skill: orig.skill,
      seats_total: orig.seats_total || 4,
      status: "forming",
      is_recurring: true,
      parent_table_id: v.tableId,
      referred_by: orig.referred_by,
      record_class: orig.record_class,
    })
    .select("id, share_code")
    .single();
  if (cloneErr || !child) {
    console.error("run-it-back: clone failed", cloneErr?.message);
    return NextResponse.redirect(`${siteUrl}/played?result=recurring`, 303);
  }

  // Re-seat only the host in the new table; never copy the other players.
  const { error: seatErr } = await supabase.from("table_seats").insert({
    table_id: child.id,
    name: orig.host_name,
    phone: orig.host_phone,
    email: orig.host_email,
    is_host: true,
    record_class: orig.record_class,
  });
  if (seatErr) console.error("run-it-back: host seat insert failed", seatErr.message);

  return NextResponse.redirect(`${siteUrl}/t/${child.share_code}`, 303);
}
