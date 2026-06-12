import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// The single send choke point. Every product email goes through here so
// suppression, the voice charter (no emoji in subjects), and send logging
// hold everywhere at once. Suppression and logging activate when their
// tables exist (one founder SQL paste); until then sends still work.
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;

export type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  kind: string;
};

export async function sendEmail({ to, subject, html, replyTo, kind }: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) return { ok: false, error: "no recipients" };

  let allowed = recipients;
  try {
    const { data: sup } = await supabase
      .from("email_suppressions")
      .select("email")
      .in("email", recipients.map((r) => r.toLowerCase()));
    const blocked = new Set((sup || []).map((s) => String(s.email).toLowerCase()));
    allowed = recipients.filter((r) => !blocked.has(r.toLowerCase()));
  } catch { /* suppression table not created yet; send to all */ }
  if (!allowed.length) return { ok: true };

  const cleanSubject = subject.replace(EMOJI, "").replace(/\s{2,}/g, " ").trim();

  const result = await resend.emails.send({
    from: "Find My Mahj Game <hello@findmymahjgame.com>",
    to: allowed,
    subject: cleanSubject,
    html,
    ...(replyTo ? { replyTo } : {}),
  }).catch((e: unknown) => ({ data: null, error: { message: e instanceof Error ? e.message : "send threw" } }));

  const ok = !!result && !result.error;
  if (!ok) console.error(`email[${kind}] failed:`, result?.error?.message || "unknown");

  const { error: logErr } = await supabase.from("email_sends").insert({
    kind,
    recipients: allowed.length,
    subject: cleanSubject.slice(0, 200),
    ok,
  });
  if (logErr && logErr.code !== "42P01") console.error("email log failed:", logErr.message);

  return ok ? { ok: true } : { ok: false, error: result?.error?.message };
}
