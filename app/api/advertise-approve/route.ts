import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";
import { escapeHtml } from "@/lib/sanitize";
import { getHmacSecret } from "@/lib/hmac";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyToken(token: string): { submissionId: string; action: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;
    const [submissionId, action, expiresStr, sig] = parts;
    const payload = `${submissionId}:${action}:${expiresStr}`;
    const expected = crypto.createHmac("sha256", getHmacSecret()).update(payload).digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    if (Date.now() > parseInt(expiresStr)) return null;
    return { submissionId, action };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://findmymahjgame.com";
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/advertise/approved?result=invalid`);
  }

  const verified = verifyToken(token);
  if (!verified) {
    return NextResponse.redirect(`${siteUrl}/advertise/approved?result=invalid`);
  }

  const { submissionId, action } = verified;

  // Fetch the submission
  const { data: submission, error: fetchErr } = await supabase
    .from("listing_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (fetchErr || !submission) {
    return NextResponse.redirect(`${siteUrl}/advertise/approved?result=notfound`);
  }

  if (submission.status !== "pending") {
    return NextResponse.redirect(`${siteUrl}/advertise/approved?result=already&action=${submission.status}`);
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  // Atomic guard: only transition a row that is still pending. If a concurrent
  // request or a replayed token already moved it, updated is empty and we stop.
  const { data: updated } = await supabase
    .from("listing_submissions")
    .update({ status: newStatus })
    .eq("id", submissionId)
    .eq("status", "pending")
    .select("id");

  if (!updated || updated.length === 0) {
    return NextResponse.redirect(`${siteUrl}/advertise/approved?result=already&action=${newStatus}`);
  }

  // Notify the advertiser
  if (action === "approve") {
    await resend.emails.send({
      from: "Find My Mahj Game <hello@findmymahjgame.com>",
      to: submission.contact_email,
      subject: "Your listing is approved!",
      html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
  <div style="background:#1a1f5e;padding:28px 32px 20px;border-radius:12px 12px 0 0;">
    <div style="font-family:Georgia,serif;font-size:1.2rem;color:white;">Find My Mahj Game</div>
  </div>
  <div style="background:#f4f6ff;padding:28px 32px;border:1px solid #e8eaf0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-family:Georgia,serif;color:#1a6e3a;font-size:1.3rem;margin-bottom:12px;">✅ You're approved!</h2>
    <p style="color:#6b7280;font-size:0.92rem;line-height:1.7;margin-bottom:16px;">
      <strong>${escapeHtml(submission.display_name ?? "Your listing")}</strong> has been approved and will be live on Find My Mahj Game within 24 hours.
    </p>
    <p style="color:#6b7280;font-size:0.88rem;line-height:1.7;">
      Questions? Reply to this email or reach us at <a href="mailto:hello@findmymahjgame.com" style="color:#e91e8c;">hello@findmymahjgame.com</a>.
    </p>
  </div>
</div>
      `,
    });
  }

  return NextResponse.redirect(
    `${siteUrl}/advertise/approved?result=${action === "approve" ? "approved" : "rejected"}&name=${encodeURIComponent(submission.display_name ?? submission.contact_name)}`
  );
}
