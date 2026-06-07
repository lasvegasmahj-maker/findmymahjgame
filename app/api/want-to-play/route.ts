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
  if (!b?.name || (!b?.phone && !b?.email)) {
    return NextResponse.json({ error: "Please add your name and a phone or email." }, { status: 400 });
  }
  if (b.email && !isValidEmail(b.email)) {
    return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
  }

  const row = {
    name: clampText(b.name, 80),
    phone: clampText(b.phone, 40) || null,
    email: clampText(b.email, 254) || null,
    city: clampText(b.city, 80) || null,
    state: clampText(b.state, 60) || null,
    day_pref: clampText(b.dayPref, 40) || null,
    time_pref: clampText(b.timePref, 40) || null,
    status: "new",
  };

  const { error } = await supabase.from("play_requests").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await resend.emails.send({
    from: "Find My Mahj Game <hello@findmymahjgame.com>",
    to: "hello@findmymahjgame.com",
    subject: `Wants to play: ${row.name}${row.city ? ` (${row.city}${row.state ? ", " + row.state : ""})` : ""}`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
      <h2 style="color:#1a1f5e;">New "I want to play" signup</h2>
      <p style="color:#374151;line-height:1.7;">
        <strong>Name:</strong> ${escapeHtml(row.name)}<br/>
        ${row.phone ? `<strong>Phone:</strong> ${escapeHtml(row.phone)}<br/>` : ""}
        ${row.email ? `<strong>Email:</strong> ${escapeHtml(row.email)}<br/>` : ""}
        ${row.city ? `<strong>Where:</strong> ${escapeHtml(row.city)}${row.state ? ", " + escapeHtml(row.state) : ""}<br/>` : ""}
        ${row.day_pref || row.time_pref ? `<strong>Prefers:</strong> ${escapeHtml(row.day_pref || "")} ${escapeHtml(row.time_pref || "")}` : ""}
      </p>
      <p style="color:#6b7280;font-size:0.85rem;">Form a table for them when there are enough nearby.</p>
    </div>`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
