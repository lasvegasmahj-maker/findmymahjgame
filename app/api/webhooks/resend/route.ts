import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { lazyServerClient } from "@/lib/supabase-server";

// Resend delivery webhooks (svix-signed). Bounces and complaints suppress the address
// globally and cancel any pending outreach, which is a precondition for ever enabling
// automated sending. Fails closed: without the webhook secret every request is rejected.
const supabase = lazyServerClient();

function verifySvix(req: NextRequest, payload: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return false;
  const id = req.headers.get("svix-id");
  const ts = req.headers.get("svix-timestamp");
  const sigHeader = req.headers.get("svix-signature");
  if (!id || !ts || !sigHeader) return false;
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${ts}.${payload}`).digest("base64");
  return sigHeader.split(" ").some((part) => {
    const sig = part.includes(",") ? part.split(",")[1] : part;
    try {
      const a = Buffer.from(sig, "base64");
      const b = Buffer.from(expected, "base64");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  if (!verifySvix(req, payload)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let event: { type?: string; data?: { to?: string[] | string; email?: string } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }
  const type = String(event.type || "");
  const toRaw = event.data?.to ?? event.data?.email ?? [];
  const recipients = (Array.isArray(toRaw) ? toRaw : [toRaw]).filter(Boolean).map((e) => String(e).toLowerCase());

  if ((type === "email.bounced" || type === "email.complained") && recipients.length) {
    const reason = type === "email.bounced" ? "hard bounce" : "spam complaint";
    for (const email of recipients) {
      await supabase.from("email_suppressions").upsert({ email, reason, source: "resend webhook", manual: false });
      const { data: pros } = await supabase.from("prospects").select("id").ilike("public_email", email);
      for (const p of pros || []) {
        await supabase.from("prospects").update({ status: type === "email.bounced" ? "BOUNCED" : "DO_NOT_CONTACT", do_not_contact: true, suppression_reason: reason }).eq("id", p.id);
        await supabase.from("outreach_messages").update({ send_status: "cancelled" }).eq("prospect_id", p.id).in("send_status", ["draft", "scheduled", "scheduled_dry_run"]);
      }
      await supabase.from("outreach_events").insert({ agent: "resend-webhook", action: type, reason: `${reason}; suppressed and follow-ups cancelled`, deterministic: true });
    }
  }
  // Idempotent by construction: replays re-upsert the same suppression row.
  return NextResponse.json({ ok: true });
}
