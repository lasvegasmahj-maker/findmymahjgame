import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyActionToken } from "@/lib/game-token";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/sanitize";

// Freshness confirmations. GET never mutates (scanner safety); the confirm
// page POSTs here. "still-running" stamps confirmed_active_at; "ended"
// increments ended_reports and alerts the founder at the first report.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const TABLES = ["venue_listings", "event_listings"];

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://findmymahjgame.com";
  const token = req.nextUrl.searchParams.get("token") || "";
  return NextResponse.redirect(`${siteUrl}/listing/confirm?token=${encodeURIComponent(token)}`);
}

export async function POST(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://findmymahjgame.com";
  if (!(await rateLimit(req, "listing-confirm", 10, 60))) {
    return NextResponse.redirect(`${siteUrl}/listing/confirm?token=invalid`, 303);
  }
  let token = "";
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("form")) {
    const form = await req.formData().catch(() => null);
    token = String(form?.get("token") || "");
  } else {
    const b = await req.json().catch(() => ({}));
    token = String(b?.token || "");
  }
  const v = verifyActionToken(token);
  if (!v || (v.action !== "still-running" && v.action !== "ended")) {
    return NextResponse.redirect(`${siteUrl}/listing/confirm?token=invalid`, 303);
  }
  const [table, id] = String(v.subjectId).split("|");
  if (!TABLES.includes(table) || !id) {
    return NextResponse.redirect(`${siteUrl}/listing/confirm?token=invalid`, 303);
  }

  if (v.action === "still-running") {
    const { error } = await supabase.from(table).update({ confirmed_active_at: new Date().toISOString() }).eq("id", id);
    if (error) console.error("confirm stamp failed:", error.message);
    return NextResponse.redirect(`${siteUrl}/listing/confirm?done=alive`, 303);
  }

  const { data: row } = await supabase.from(table).select("ended_reports, business_name, event_name").eq("id", id).single();
  const prior = row?.ended_reports ?? 0;
  if (prior >= 5) {
    // Bounded: replayed tokens cannot inflate reports or spam the founder.
    return NextResponse.redirect(`${siteUrl}/listing/confirm?done=ended`, 303);
  }
  const reports = prior + 1;
  const { error } = await supabase.from(table).update({ ended_reports: reports }).eq("id", id);
  if (error) console.error("ended report failed:", error.message);
  const name = String(row?.business_name || row?.event_name || id);
  if (prior > 0) {
    // Only the first report emails; later ones just count.
    return NextResponse.redirect(`${siteUrl}/listing/confirm?done=ended`, 303);
  }
  await sendEmail({
    to: "hello@findmymahjgame.com",
    kind: "ended-report",
    subject: `Listing reported ended: ${name} (report ${reports})`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
      <h2 style="color:#1a1f5e;">${escapeHtml(name)} may have ended</h2>
      <p style="color:#374151;line-height:1.7;">Report number ${reports}. Please verify before it disappoints a player; flag it in <a href="https://findmymahjgame.com/admin" style="color:#e91e8c;">admin</a> if it is gone.</p>
    </div>`,
  });
  return NextResponse.redirect(`${siteUrl}/listing/confirm?done=ended`, 303);
}
