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

const first = (n: string) => escapeHtml((n || "").trim().split(/\s+/)[0] || "A player");

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "sub", 5, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const b = await req.json().catch(() => ({}));
  if (!b?.city || !b?.name || (!b?.phone && !b?.email)) {
    return NextResponse.json({ error: "Please add your area, your name, and a phone or email." }, { status: 400 });
  }
  if (b.email && !isValidEmail(b.email)) {
    return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
  }

  const city = clampText(b.city, 80);
  const name = clampText(b.name, 80);
  const phone = clampText(b.phone, 40);
  const email = clampText(b.email, 254);
  const when = `${clampText(b.day, 20)} ${clampText(b.time, 20)}`.trim();
  const note = clampText(b.note, 500);

  // Find nearby players who asked to play in this city. We only message people
  // who opted in via "I Want to Play". Reply-To is the requester so a willing
  // sub reaches them directly; we never expose other players' addresses (BCC).
  const { data: prData } = await supabase
    .from("play_requests")
    .select("email")
    .ilike("city", `%${city}%`);
  const interested = ((prData || []) as { email: string | null }[])
    .map((r) => r.email)
    .filter((e): e is string => !!e && isValidEmail(e));
  const unique = Array.from(new Set(interested));

  const replyTo = (email && isValidEmail(email)) ? email : "hello@findmymahjgame.com";
  const reachLine = email ? `email ${escapeHtml(email)}` : `phone ${escapeHtml(phone)}`;

  if (unique.length) {
    await resend.emails.send({
      from: "Find My Mahj Game <hello@findmymahjgame.com>",
      to: "hello@findmymahjgame.com",
      bcc: unique,
      replyTo,
      subject: `A mahjong game near ${escapeHtml(city)} needs a sub`,
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:22px;color:#1a1a2e;">
        <h2 style="color:#1a6e3a;">Can you fill in for a game?</h2>
        <p style="font-size:16px;line-height:1.7;">A group near <strong>${escapeHtml(city)}</strong> is short a player${when ? ` for <strong>${escapeHtml(when)}</strong>` : ""} and is looking for a substitute. ${first(name)} is hosting.</p>
        ${note ? `<p style="font-size:15px;line-height:1.7;color:#374151;">Note from ${first(name)}: ${escapeHtml(note)}</p>` : ""}
        <p style="font-size:16px;line-height:1.7;">If you can play, just reply to this email and we will connect you. You will meet in a public place. We never share home addresses.</p>
      </div>`,
    }).catch(() => {});
  }

  // Always tell the team so they can help, especially if no one was nearby.
  await resend.emails.send({
    from: "Find My Mahj Game <hello@findmymahjgame.com>",
    to: "hello@findmymahjgame.com",
    replyTo,
    subject: `Need a sub: ${escapeHtml(city)}${when ? ` (${escapeHtml(when)})` : ""}, ${unique.length} players notified`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
      <h2 style="color:#1a1f5e;">Substitute request</h2>
      <p style="color:#374151;line-height:1.7;">
        <strong>Host:</strong> ${escapeHtml(name)} (reach by ${reachLine})<br/>
        <strong>Area:</strong> ${escapeHtml(city)}<br/>
        ${when ? `<strong>When:</strong> ${escapeHtml(when)}<br/>` : ""}
        <strong>Nearby players notified:</strong> ${unique.length}
        ${note ? `<br/><strong>Note:</strong> ${escapeHtml(note)}` : ""}
      </p>
      ${unique.length === 0 ? `<p style="color:#6b7280;font-size:0.9rem;">No opted-in players in this area yet. Reach out to the host to help find a sub.</p>` : ""}
    </div>`,
  }).catch(() => {});

  return NextResponse.json({ success: true, notified: unique.length });
}
