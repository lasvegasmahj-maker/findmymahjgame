import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { signGameToken } from "@/lib/game-token";
import { escapeHtml } from "@/lib/sanitize";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

// Daily (Vercel Cron). Asks full tables that have had time to play "did your
// game happen?" with one-click Yes/No. Protected by CRON_SECRET (Vercel sends
// it as the Authorization bearer for cron invocations).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows, error: qErr } = await supabase
    .from("tables")
    .select("id, share_code, day_of_week, time_of_day, city")
    .eq("status", "full")
    .is("played", null)
    .is("asked_played_at", null)
    .or(`filled_at.lte.${cutoff},and(filled_at.is.null,created_at.lte.${cutoff})`)
    .limit(50);
  if (qErr) console.error("ask-played query failed:", qErr.message);

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://findmymahjgame.com";
  let asked = 0;

  for (const t of rows || []) {
    const { data: seats } = await supabase.from("table_seats").select("email").eq("table_id", t.id);
    const emails = (seats || []).map((s) => s.email).filter(Boolean) as string[];
    if (emails.length) {
      const yes = `${base}/played/confirm?token=${signGameToken(t.id, "yes")}`;
      const no = `${base}/played/confirm?token=${signGameToken(t.id, "no")}`;
      const when = escapeHtml(`${t.day_of_week || ""} ${t.time_of_day || ""}`.trim());
      const area = t.city ? escapeHtml(t.city) : "your area";
      await resend.emails.send({
        from: "Find My Mahj Game <hello@findmymahjgame.com>",
        to: "hello@findmymahjgame.com",
        bcc: emails,
        subject: "Did your mahjong game happen?",
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;text-align:center;color:#1a1a2e;">
          <h2 style="color:#1a1f5e;">Did your game happen?</h2>
          <p style="font-size:16px;line-height:1.6;">Your ${when} table in ${area}.</p>
          <div style="margin:24px 0;">
            <a href="${yes}" style="display:inline-block;background:#1a6e3a;color:white;padding:14px 28px;border-radius:10px;font-weight:800;font-size:16px;text-decoration:none;margin:6px;">Yes, we played</a>
            <a href="${no}" style="display:inline-block;background:#6b7280;color:white;padding:14px 28px;border-radius:10px;font-weight:800;font-size:16px;text-decoration:none;margin:6px;">No, not this time</a>
          </div>
          <p style="font-size:13px;color:#9ca3af;">One tap helps us know our tables become real games.</p>
        </div>`,
      }).catch(() => {});
    }
    await supabase.from("tables").update({ asked_played_at: new Date().toISOString() }).eq("id", t.id);
    asked++;
  }

  return NextResponse.json({ asked });
}
