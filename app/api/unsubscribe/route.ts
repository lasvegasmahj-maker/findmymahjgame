import { NextRequest, NextResponse } from "next/server";
import { verifyActionToken } from "@/lib/game-token";
import { rateLimit } from "@/lib/rate-limit";
import { lazyServerClient } from "@/lib/supabase-server";

// One-click unsubscribe landing for any FMG email. GET never mutates (mail scanners prefetch
// links); the page posts here with the same signed token. Suppression is global: lib/email.ts
// checks email_suppressions on every send, so this stops outreach and product mail alike.
const supabase = lazyServerClient();

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "unsubscribe", 10, 60))) {
    return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) || {};
  const token = typeof body?.token === "string" ? body.token : "";
  const verified = verifyActionToken(token);
  if (!verified || verified.action !== "unsub") {
    return NextResponse.json({ error: "This unsubscribe link is invalid or expired. Email hello@findmymahjgame.com and a real person will remove you." }, { status: 400 });
  }
  const email = verified.subjectId.toLowerCase();
  const { error } = await supabase.from("email_suppressions").upsert({
    email,
    reason: "unsubscribe",
    source: "one-click link",
    unsubscribed_at: new Date().toISOString(),
    manual: false,
  });
  if (error && error.code !== "23505") {
    console.error("unsubscribe failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Email hello@findmymahjgame.com and a real person will remove you." }, { status: 500 });
  }
  await supabase.from("outreach_events").insert({
    agent: "unsubscribe-endpoint",
    action: "unsubscribed",
    reason: "one-click unsubscribe honored; follow-ups cancelled",
    deterministic: true,
  });
  // Any pending outreach for this address stops immediately.
  const { data: pros } = await supabase.from("prospects").select("id,status").ilike("public_email", email);
  for (const p of pros || []) {
    await supabase.from("prospects").update({ status: "UNSUBSCRIBED", do_not_contact: true, suppression_reason: "unsubscribe" }).eq("id", p.id);
    await supabase.from("outreach_messages").update({ send_status: "cancelled" }).eq("prospect_id", p.id).in("send_status", ["draft", "scheduled", "scheduled_dry_run"]);
  }
  return NextResponse.json({ ok: true });
}
