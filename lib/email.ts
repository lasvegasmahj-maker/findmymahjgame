import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// The send choke point. New product emails go through here (legacy routes
// migrate as they are touched) so
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
  bcc?: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  raw?: boolean;
  kind: string;
};

// Branded HTML shell wrapped around every transactional email (unless raw is
// set), so the logo, brand colors, and a link home are consistent everywhere.
function brandedShell(inner: string): string {
  const navy = "#1a1f5e", pink = "#e91e8c", muted = "#6b7280", border = "#e5e7eb", bg = "#f4f4f7";
  return `<!doctype html><html><body style="margin:0;padding:0;background:${bg};">` +
    `<div style="background:${bg};padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${navy};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid ${border};border-radius:14px;overflow:hidden;">` +
    `<tr><td style="padding:28px 32px 18px;text-align:center;border-bottom:3px solid ${pink};">` +
    `<a href="https://findmymahjgame.com"><img src="https://findmymahjgame.com/find-my-mahj-game-logo.png" alt="Find My Mahj Game" width="220" style="display:inline-block;max-width:220px;height:auto;" /></a>` +
    `</td></tr>` +
    `<tr><td style="padding:28px 32px;font-size:16px;line-height:1.7;color:${navy};">${inner}</td></tr>` +
    `<tr><td style="padding:18px 32px 28px;border-top:1px solid ${border};font-size:13px;color:${muted};text-align:center;">` +
    `<a href="https://findmymahjgame.com" style="color:${pink};text-decoration:none;font-weight:600;">findmymahjgame.com</a>` +
    `<div style="margin-top:6px;">Find local mahjong games, players, teachers, tournaments, and retreats.</div>` +
    `</td></tr></table></div></body></html>`;
}

export async function sendEmail({ to, bcc, subject, html, replyTo, kind, raw }: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const toList = (Array.isArray(to) ? to : [to]).filter(Boolean);
  const bccList = (Array.isArray(bcc) ? bcc : bcc ? [bcc] : []).filter(Boolean);
  if (!toList.length && !bccList.length) return { ok: false, error: "no recipients" };

  let blocked = new Set<string>();
  try {
    const { data: sup } = await supabase
      .from("email_suppressions")
      .select("email")
      .in("email", [...toList, ...bccList].map((r) => r.toLowerCase()));
    blocked = new Set((sup || []).map((s) => String(s.email).toLowerCase()));
  } catch { /* suppression table not created yet; send to all */ }
  const allowedTo = toList.filter((r) => !blocked.has(r.toLowerCase()));
  const allowedBcc = bccList.filter((r) => !blocked.has(r.toLowerCase()));
  if (!allowedTo.length && !allowedBcc.length) return { ok: true };

  const cleanSubject = subject.replace(EMOJI, "").replace(/\s{2,}/g, " ").trim();

  const result = await resend.emails.send({
    from: "Find My Mahj Game <hello@findmymahjgame.com>",
    to: allowedTo.length ? allowedTo : allowedBcc,
    ...(allowedTo.length && allowedBcc.length ? { bcc: allowedBcc } : {}),
    subject: cleanSubject,
    html: raw ? html : brandedShell(html),
    ...(replyTo ? { replyTo } : {}),
  }).catch((e: unknown) => ({ data: null, error: { message: e instanceof Error ? e.message : "send threw" } }));

  const ok = !!result && !result.error;
  if (!ok) console.error(`email[${kind}] failed:`, result?.error?.message || "unknown");

  const { error: logErr } = await supabase.from("email_sends").insert({
    kind,
    recipients: allowedTo.length + allowedBcc.length,
    subject: cleanSubject.slice(0, 200),
    ok,
  });
  if (logErr && logErr.code !== "42P01" && logErr.code !== "PGRST205") console.error("email log failed:", logErr.message);

  return ok ? { ok: true } : { ok: false, error: result?.error?.message };
}
