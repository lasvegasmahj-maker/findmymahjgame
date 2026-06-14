import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { clampText, isValidEmail, escapeHtml } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";

// A connection request to a listed player or a cruise poster. The target's email
// is looked up server-side and NEVER sent to the browser. We relay the request
// straight to them (reply-to is the requester, so they reply directly), bcc the
// founder inbox for the record, and store the inquiry. If a listing has no email
// on file, it falls back to the founder inbox to be forwarded by hand.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "connect", 8, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const b = await req.json().catch(() => ({}));
  const id = clampText(b.id || b.player_id, 64);
  const name = clampText(b.name, 80);
  const email = clampText(b.email, 254);
  const message = clampText(b.message, 1000);
  const cruise = b.source === "cruise";
  if (!id || !name || !email) {
    return NextResponse.json({ error: "Please add your name and email." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  let targetName = "this player";
  let targetEmail: string | null = null;
  let context = "";

  if (cruise) {
    const { data } = await supabase
      .from("cruise_posts")
      .select("id, name, cruise_line, ship, depart_date, contact_email")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "That cruise post is no longer listed." }, { status: 404 });
    targetName = data.name || "this player";
    targetEmail = data.contact_email;
    const shipLine = [data.cruise_line, data.ship].filter(Boolean).join(" ");
    context = `${shipLine}${data.depart_date ? `, departing ${data.depart_date}` : ""}`;
  } else {
    const { data } = await supabase
      .from("player_listings")
      .select("id, name, city, state, contact_email")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "That player is no longer listed." }, { status: 404 });
    targetName = data.name || "this player";
    targetEmail = data.contact_email;
    context = [data.city, data.state].filter(Boolean).join(", ");
  }

  await supabase.from("inquiries").insert({
    name,
    email,
    inquiry_type: cruise ? "cruise_connect" : "player_connect",
    interest: cruise ? `Cruise connect: ${context}` : `Connect with ${targetName}${context ? ` in ${context}` : ""}`,
    message: message || null,
    status: "new",
  });

  const heading = cruise ? `${name} wants to play mahjong on your cruise` : `${name} wants to play mahjong with you`;
  const intro = cruise
    ? `You have a new request from your Find My Mahj Game cruise post${context ? ` (${escapeHtml(context)})` : ""}.`
    : `You have a new connection request from your Find My Mahj Game listing${context ? ` (${escapeHtml(context)})` : ""}.`;

  const html = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <h2 style="color:#1a1f5e;margin:0 0 12px;">${escapeHtml(heading)}</h2>
    <p style="color:#374151;line-height:1.7;margin:0 0 14px;">${intro}</p>
    <p style="color:#374151;line-height:1.7;margin:0 0 6px;"><strong>From:</strong> ${escapeHtml(name)}<br/><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${message ? `<div style="background:#f8f8f8;border-left:4px solid #e91e8c;padding:14px 16px;border-radius:4px;white-space:pre-wrap;color:#333;line-height:1.6;margin:12px 0;">${escapeHtml(message)}</div>` : ""}
    <p style="color:#374151;line-height:1.7;margin:14px 0 0;">Just reply to this email to reach ${escapeHtml(name)} directly. Your email stays private until you reply.</p>
    <p style="color:#888;font-size:12px;margin-top:24px;">Sent by findmymahjgame.com. We never show your email publicly.</p>
  </div>`;

  if (targetEmail) {
    const { ok } = await sendEmail({
      kind: cruise ? "cruise-connect" : "connect",
      to: targetEmail,
      replyTo: email,
      bcc: "hello@findmymahjgame.com",
      subject: heading,
      html,
    });
    if (!ok) return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  } else {
    await sendEmail({
      kind: cruise ? "cruise-connect" : "connect",
      to: "hello@findmymahjgame.com",
      replyTo: email,
      subject: `${heading} (no email on file, forward manually)`,
      html,
    });
  }

  return NextResponse.json({ success: true });
}
