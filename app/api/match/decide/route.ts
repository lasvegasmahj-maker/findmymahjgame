import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyActionToken } from "@/lib/game-token";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/sanitize";

// Founder one-click decision on a match draft. Approve creates the forming
// table (host fields stay null: the first claimer becomes coordinator, per
// the never-name-a-host-without-consent ruling) and emails each pooled
// player the claim link. Skip releases the players back to the pool.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function shareCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");
}

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://findmymahjgame.com";
  const token = req.nextUrl.searchParams.get("token") || "";
  const v = verifyActionToken(token);
  if (!v || (v.action !== "match-approve" && v.action !== "match-skip")) {
    return NextResponse.redirect(`${siteUrl}/played?result=invalid`);
  }

  const { data: draft } = await supabase.from("match_drafts").select("*").eq("id", v.subjectId).single();
  if (!draft) return NextResponse.redirect(`${siteUrl}/played?result=invalid`);
  if (draft.status !== "draft") {
    // Already decided: idempotent no-op.
    return NextResponse.redirect(`${siteUrl}/admin?match=${draft.status}`);
  }

  if (v.action === "match-skip") {
    await supabase.from("match_drafts").update({ status: "skipped", decided_at: new Date().toISOString() }).eq("id", draft.id);
    return NextResponse.redirect(`${siteUrl}/admin?match=skipped`);
  }

  const code = shareCode();
  const { data: table, error: tableErr } = await supabase
    .from("tables")
    .insert({
      share_code: code,
      day_of_week: draft.day_pref || null,
      time_of_day: draft.time_pref || null,
      city: draft.city,
      skill: "anyone",
      seats_total: 4,
      status: "forming",
    })
    .select("id, share_code")
    .single();
  if (tableErr || !table) {
    console.error("match approve: table create failed", tableErr?.message);
    return NextResponse.redirect(`${siteUrl}/admin?match=error`);
  }

  await supabase.from("match_drafts").update({ status: "approved", table_id: table.id, decided_at: new Date().toISOString() }).eq("id", draft.id);
  await supabase.from("play_requests").update({ status: "invited" }).in("id", draft.request_ids);

  const { data: players } = await supabase
    .from("play_requests")
    .select("name, email")
    .in("id", draft.request_ids);
  const link = `${siteUrl}/t/${table.share_code}`;
  for (const p of players || []) {
    if (!p.email) continue;
    await sendEmail({
      to: p.email,
      kind: "match-invite",
      subject: `A mahjong table is forming near ${draft.city}, and you have a seat waiting`,
      html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:20px;">
        <h2 style="color:#1a1f5e;">Good news, ${escapeHtml((p.name || "friend").split(" ")[0])}!</h2>
        <p style="color:#374151;line-height:1.7;">A few players near ${escapeHtml(draft.city)} want to play at the same time you do${draft.day_pref ? ` (${escapeHtml(draft.day_pref)}${draft.time_pref ? ", " + escapeHtml(draft.time_pref).toLowerCase() : ""})` : ""}. We put a table together.</p>
        <p style="color:#374151;line-height:1.7;">Tap below to claim your seat. First games meet in a public place, and we never share your phone number or email.</p>
        <p style="margin:22px 0;"><a href="${link}" style="background:#e91e8c;color:#fff;padding:14px 26px;border-radius:10px;text-decoration:none;font-weight:700;">See the table and claim a seat</a></p>
        <p style="font-size:13px;color:#6b7280;">If now is not a good time, just ignore this note. Your spot on the list is safe.</p>
      </div>`,
    });
  }

  return NextResponse.redirect(`${siteUrl}/admin?match=approved`);
}
