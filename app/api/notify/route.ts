import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { type, subject, body } = await req.json() as {
      type: "connect" | "inquiry";
      subject: string;
      body: string;
    };

    if (!type || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: "Find My Mahj Game <hello@findmymahjgame.com>",
      to: "hello@findmymahjgame.com",
      subject,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1a1f5e; margin-bottom: 16px;">${subject}</h2>
  <div style="background: #f8f8f8; border-left: 4px solid #e91e8c; padding: 16px; border-radius: 4px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #333;">${body}</div>
  <p style="color: #888; font-size: 12px; margin-top: 24px;">Sent from findmymahjgame.com</p>
</div>`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
