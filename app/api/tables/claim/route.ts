import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { clampText, isValidEmail, escapeHtml } from "@/lib/sanitize";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (!b?.shareCode || !b?.name || (!b?.phone && !b?.email)) {
    return NextResponse.json({ error: "Please add your name and a phone or email." }, { status: 400 });
  }
  if (b.email && !isValidEmail(b.email)) {
    return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
  }

  const { data: t } = await supabase.from("tables").select("*").eq("share_code", b.shareCode).single();
  if (!t) return NextResponse.json({ error: "Table not found." }, { status: 404 });

  const { count } = await supabase.from("table_seats").select("id", { count: "exact", head: true }).eq("table_id", t.id);
  const filled = count ?? 0;
  if (t.status === "full" || filled >= t.seats_total) {
    return NextResponse.json({ error: "full" }, { status: 409 });
  }

  const name = clampText(b.name, 80);
  await supabase.from("table_seats").insert({
    table_id: t.id,
    name,
    phone: clampText(b.phone, 40) || null,
    email: clampText(b.email, 254) || null,
  });

  const newFilled = filled + 1;
  const remaining = Math.max(0, t.seats_total - newFilled);
  if (remaining === 0) await supabase.from("tables").update({ status: "full" }).eq("id", t.id);

  // Tell the host (and admin) someone joined. Email only; never expose phones publicly.
  const to = [t.host_email, "hello@findmymahjgame.com"].filter(Boolean) as string[];
  if (to.length) {
    await resend.emails.send({
      from: "Find My Mahj Game <hello@findmymahjgame.com>",
      to,
      subject: `${name} joined your mahjong table${remaining === 0 ? " — it's full!" : ` — ${remaining} seat${remaining === 1 ? "" : "s"} to go`}`,
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
        <h2 style="color:#1a1f5e;">${escapeHtml(name)} joined your table</h2>
        <p style="color:#374151;line-height:1.6;">${escapeHtml(t.day_of_week || "")} ${escapeHtml(t.time_of_day || "")} ${t.venue_name ? "at " + escapeHtml(t.venue_name) : ""} ${t.city ? "in " + escapeHtml(t.city) : ""}.</p>
        <p style="color:#374151;line-height:1.6;">${remaining === 0 ? "Your table is full. Time to play!" : `You need ${remaining} more player${remaining === 1 ? "" : "s"}.`}</p>
      </div>`,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, seatsRemaining: remaining });
}
