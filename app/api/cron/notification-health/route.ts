import { NextRequest, NextResponse } from "next/server";
import { cronRequestAuthorized } from "@/lib/cron-auth";
import { lazyServerClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/sanitize";

// Scheduled health check for the notify() ledger. If anything failed to send
// in the last 24 hours, the founder gets one summary email instead of having
// to know to go look. No schedule is wired here; the lead adds the cron entry.
const supabase = lazyServerClient();

export async function GET(req: NextRequest) {
  if (!cronRequestAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("notifications_log")
    .select("kind, email, subject, error, created_at")
    .eq("status", "failed")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("notification-health cron: query failed", error.message);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const failures = data || [];
  if (!failures.length) {
    return NextResponse.json({ ok: true, failed: 0 });
  }

  const rows = failures.map((f) =>
    `<tr>` +
    `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(f.kind)}</td>` +
    `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(f.email)}</td>` +
    `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(f.subject || "")}</td>` +
    `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(f.error || "")}</td>` +
    `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(f.created_at)}</td>` +
    `</tr>`
  ).join("");

  const subject = `${failures.length} notification${failures.length === 1 ? "" : "s"} failed in the last 24 hours`;
  const html = `<div style="font-family:sans-serif;">` +
    `<h2 style="color:#1a1f5e;">${escapeHtml(subject)}</h2>` +
    `<table style="border-collapse:collapse;width:100%;font-size:13px;">` +
    `<thead><tr>` +
    `<th style="text-align:left;padding:6px 10px;">Kind</th>` +
    `<th style="text-align:left;padding:6px 10px;">Recipient</th>` +
    `<th style="text-align:left;padding:6px 10px;">Subject</th>` +
    `<th style="text-align:left;padding:6px 10px;">Error</th>` +
    `<th style="text-align:left;padding:6px 10px;">When</th>` +
    `</tr></thead>` +
    `<tbody>${rows}</tbody>` +
    `</table></div>`;

  const sent = await sendEmail({
    kind: "notify-health",
    to: "hello@findmymahjgame.com",
    subject,
    html,
  });

  return NextResponse.json({ ok: sent.ok, failed: failures.length });
}
