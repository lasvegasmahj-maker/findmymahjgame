import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { clampText, isValidEmail, escapeHtml } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);

async function addToMailchimp(email: string, city: string | null): Promise<boolean> {
  const key = process.env.MAILCHIMP_API_KEY;
  const list = process.env.MAILCHIMP_AUDIENCE_ID;
  if (!key || !list) return false;
  const dc = key.split("-")[1];
  if (!dc) return false;
  try {
    const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${list}/members`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${key}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        ...(city ? { merge_fields: { CITY: city } } : {}),
      }),
    });
    // "Member Exists" (400) still counts as recorded.
    if (res.ok) return true;
    const body = await res.text();
    if (body.includes("Member Exists")) return true;
    console.error("subscribe: mailchimp rejected", res.status, body.slice(0, 200));
    return false;
  } catch (e) {
    console.error("subscribe: mailchimp unreachable", e instanceof Error ? e.message : e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "subscribe", 10, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const b = await req.json().catch(() => ({}));
  const email = clampText(b?.email, 254);
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
  }
  const city = clampText(b?.city, 80) || null;

  const inMailchimp = await addToMailchimp(email, city);

  const notified = await resend.emails.send({
    from: "Find My Mahj Game <hello@findmymahjgame.com>",
    to: "hello@findmymahjgame.com",
    subject: `Newsletter signup: ${email}`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
      <h2 style="color:#1a1f5e;">New newsletter signup</h2>
      <p style="color:#374151;line-height:1.7;"><strong>Email:</strong> ${escapeHtml(email)}${city ? `<br/><strong>City:</strong> ${escapeHtml(city)}` : ""}</p>
    </div>`,
  }).then(() => true).catch(() => false);

  // A signup must land somewhere durable before we say "you're on the list."
  if (!inMailchimp && !notified) {
    return NextResponse.json({ error: "We could not save your signup just now. Please try again in a minute." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
