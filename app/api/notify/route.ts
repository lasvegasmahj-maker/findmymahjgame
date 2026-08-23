import { sendEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { escapeHtml, clampText } from "@/lib/sanitize";


const ALLOWED_TYPES = ["connect", "inquiry"];

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "notify", 10, 60))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const raw = (await req.json().catch(() => null)) || {};
  try {
    if (!raw?.type || !raw?.subject || !raw?.body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(raw.type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const subject = clampText(raw.subject, 200);
    const body = clampText(raw.body, 5000);

    const { error } = await sendEmail({
      kind: "notify",
      to: "hello@findmymahjgame.com",
      subject,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1a1f5e; margin-bottom: 16px;">${escapeHtml(subject)}</h2>
  <div style="background: #f8f8f8; border-left: 4px solid #e91e8c; padding: 16px; border-radius: 4px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #333;">${escapeHtml(body)}</div>
  <p style="color: #888; font-size: 12px; margin-top: 24px;">Sent from findmymahjgame.com</p>
</div>`,
    });

    if (error) {
      { console.error("notify failed:", error); return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }); }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
