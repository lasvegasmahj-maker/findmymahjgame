import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { clampText, isValidEmail, escapeHtml } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

const ROLES = ["Teacher", "Host", "Organizer", "Club leader", "Other"];

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "ambassador", 5, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const b = await req.json().catch(() => ({}));
  if (!b?.name || !b?.email) {
    return NextResponse.json({ error: "Please add your name and email." }, { status: 400 });
  }
  if (!isValidEmail(b.email)) {
    return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
  }

  const row = {
    name: clampText(b.name, 120),
    email: clampText(b.email, 254),
    phone: clampText(b.phone, 40) || null,
    city: clampText(b.city, 80) || null,
    state: clampText(b.state, 60) || null,
    role: ROLES.includes(b.role) ? b.role : (b.role ? clampText(b.role, 60) : null),
    reach: clampText(b.reach, 80) || null,
    why: clampText(b.why, 2000) || null,
    status: "new",
  };

  const { error } = await supabase.from("ambassadors").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const firstName = escapeHtml((row.name || "").trim().split(/\s+/)[0] || "there");
  const place = [row.city, row.state].filter(Boolean).join(", ");

  await resend.emails.send({
    from: "Find My Mahj Game <hello@findmymahjgame.com>",
    to: row.email,
    replyTo: "hello@findmymahjgame.com",
    subject: "Thank you for applying to be a Founding Ambassador",
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a2e;">
      <h2 style="color:#1a1f5e;">Thank you, ${firstName}!</h2>
      <p style="font-size:16px;line-height:1.7;">We received your application to become a <strong>Founding Ambassador</strong> for Find My Mahj Game. People like you are how real mahjong tables happen.</p>
      <p style="font-size:16px;line-height:1.7;">Here is what happens next: a real person will read your application and reach out to talk about how we can support you in building the mahjong community in your city.</p>
      <p style="font-size:16px;line-height:1.7;">In the meantime, you can start a table or find a game any time at <a href="https://findmymahjgame.com" style="color:#e91e8c;font-weight:700;">findmymahjgame.com</a>.</p>
      <p style="font-size:14px;color:#6b7280;line-height:1.6;">If you did not apply, you can safely ignore this email.</p>
    </div>`,
  }).catch(() => {});

  await resend.emails.send({
    from: "Find My Mahj Game <hello@findmymahjgame.com>",
    to: "hello@findmymahjgame.com",
    replyTo: row.email,
    subject: `New Ambassador application: ${escapeHtml(row.name)}${place ? ` (${escapeHtml(place)})` : ""}`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a2e;">
      <h2 style="color:#1a1f5e;">New Founding Ambassador application</h2>
      <table style="font-size:15px;line-height:1.7;border-collapse:collapse;">
        <tr><td style="padding:2px 14px 2px 0;color:#6b7280;">Name</td><td><strong>${escapeHtml(row.name)}</strong></td></tr>
        <tr><td style="padding:2px 14px 2px 0;color:#6b7280;">Email</td><td>${escapeHtml(row.email)}</td></tr>
        <tr><td style="padding:2px 14px 2px 0;color:#6b7280;">Phone</td><td>${escapeHtml(row.phone || "not given")}</td></tr>
        <tr><td style="padding:2px 14px 2px 0;color:#6b7280;">Location</td><td>${escapeHtml(place || "not given")}</td></tr>
        <tr><td style="padding:2px 14px 2px 0;color:#6b7280;">Role</td><td>${escapeHtml(row.role || "not given")}</td></tr>
        <tr><td style="padding:2px 14px 2px 0;color:#6b7280;">Can reach</td><td>${escapeHtml(row.reach || "not given")}</td></tr>
      </table>
      <p style="font-size:15px;line-height:1.7;margin-top:14px;"><strong>Why they want to help</strong><br/>${escapeHtml(row.why || "not given")}</p>
      <p style="font-size:14px;color:#6b7280;line-height:1.6;">Reply to this email to reach ${firstName} directly, or review it in the <a href="https://findmymahjgame.com/admin" style="color:#e91e8c;">admin dashboard</a>.</p>
    </div>`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
