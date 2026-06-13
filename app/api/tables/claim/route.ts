import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { clampText, isValidEmail, escapeHtml } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const first = (n: string) => escapeHtml((n || "").trim().split(/\s+/)[0] || "A player");

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "claim", 10, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const b = await req.json().catch(() => ({}));
  if (!b?.shareCode || !b?.name || (!b?.phone && !b?.email)) {
    return NextResponse.json({ error: "Please add your name and a phone or email." }, { status: 400 });
  }
  if (b.email && !isValidEmail(b.email)) {
    return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
  }

  const { data: t } = await supabase.from("tables").select("*").eq("share_code", b.shareCode).single();
  if (!t) return NextResponse.json({ error: "Table not found." }, { status: 404 });

  const { count } = await supabase.from("table_seats").select("id", { count: "exact", head: true }).eq("table_id", t.id);
  const filled = count ?? 0;
  if (t.status === "full" || filled >= t.seats_total) {
    return NextResponse.json({ error: "full" }, { status: 409 });
  }

  const name = clampText(b.name, 80);
  const { data: seatRow, error: seatErr } = await supabase.from("table_seats").insert({
    table_id: t.id,
    name,
    phone: clampText(b.phone, 40) || null,
    email: clampText(b.email, 254) || null,
  }).select("id").single();
  if (seatErr || !seatRow) {
    console.error("claim: seat insert failed", seatErr?.message);
    return NextResponse.json({ error: "Could not save your seat. Please try again." }, { status: 500 });
  }

  // Recount after insert: two simultaneous claimers can both pass the
  // pre-insert check, so the post-insert count is the truth for overfill.
  const { count: afterCount } = await supabase.from("table_seats").select("id", { count: "exact", head: true }).eq("table_id", t.id);
  const newFilled = afterCount ?? filled + 1;
  if (newFilled > t.seats_total) {
    const { error: rollbackErr } = await supabase.from("table_seats").delete().eq("id", seatRow.id);
    if (rollbackErr) {
      console.error("claim: overfill rollback failed, table overfull", rollbackErr.message);
      return NextResponse.json({ error: "Something went wrong saving your seat. Please refresh and try again." }, { status: 500 });
    }
    return NextResponse.json({ error: "full" }, { status: 409 });
  }
  const remaining = Math.max(0, t.seats_total - newFilled);
  if (remaining === 0) {
    const { error: fullErr } = await supabase.from("tables").update({ status: "full", filled_at: new Date().toISOString() }).eq("id", t.id);
    if (fullErr) console.error("claim: failed to mark table full", fullErr.message);
  }

  const when = `${escapeHtml(t.day_of_week || "")} ${escapeHtml(t.time_of_day || "")}`.trim();
  const area = t.city ? escapeHtml(t.city) : "your area";
  const link = `${req.nextUrl.origin}/t/${t.share_code}`;

  if (remaining > 0) {
    // Per-join nudge to the host only.
    const to = [t.host_email, "hello@findmymahjgame.com"].filter(Boolean) as string[];
    if (to.length) {
      await sendEmail({
        kind: "table-claim",
        to,
        subject: remaining === 1
          ? `1 seat left, share to find your 4th!`
          : `${(name || "A player").trim().split(/\s+/)[0]} joined your mahjong table, ${remaining} to go`,
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
          <h2 style="color:#1a1f5e;">${remaining === 1 ? "Just 1 seat left!" : `${first(name)} joined your table`}</h2>
          <p style="color:#374151;line-height:1.6;">${when} in ${area}. ${remaining === 1 ? "You need just <strong>one more player</strong>, your last seat." : `You need ${remaining} more players.`}</p>
          <p style="color:#374151;line-height:1.6;">${remaining === 1 ? "Share your link right now to find a 4th" : "Keep sharing your link to fill it"}: <a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>
        </div>`,
      }).catch(() => {});
    }
  } else {
    // Table is full: coordination email to ALL players (BCC, reply-to host).
    const { data: seatRows } = await supabase
      .from("table_seats")
      .select("name, email, is_host")
      .eq("table_id", t.id)
      .order("created_at", { ascending: true });
    const seatsAll = seatRows || [];
    const memberEmails = seatsAll.map((s) => s.email).filter(Boolean) as string[];
    const names = seatsAll.map((s) => first(s.name)).join(", ");
    const hostFirst = first(t.host_name);
    const replyTo = (t.host_email as string) || "hello@findmymahjgame.com";

    if (memberEmails.length) {
      await sendEmail({
        kind: "table-claim",
        to: "hello@findmymahjgame.com",
        bcc: memberEmails,
        replyTo,
        subject: `Your mahjong table is full! Time to pick a spot`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a2e;">
          <h2 style="color:#1a6e3a;">Your table is full, time to play!</h2>
          <p style="font-size:16px;line-height:1.7;">Your group: <strong>${names}</strong>.<br/>
          When: <strong>${when || "the day and time you chose"}</strong><br/>
          Area: <strong>${area}</strong></p>
          <div style="background:#f0fff4;border:2px solid #2ec95c;border-radius:10px;padding:14px 18px;margin:18px 0;">
            <p style="margin:0;color:#1a6e3a;font-weight:700;line-height:1.6;">For safety, we recommend new groups meet in a public place for the first game, a library, community center, café, or senior center. Please do not share home addresses.</p>
          </div>
          <p style="font-size:16px;line-height:1.7;"><strong>Next steps</strong><br/>
          1) Reply to this email to reach <strong>${hostFirst}</strong>, who started the table and is your coordinator.<br/>
          2) Agree on a public place to meet.<br/>
          3) Pick a date for your first game. Have fun!</p>
          <p style="font-size:14px;color:#6b7280;line-height:1.6;">Replies go to ${hostFirst} so the group can choose a safe spot. We never share anyone's phone number or email.</p>
          <p style="font-size:15px;"><a href="${escapeHtml(link)}" style="color:#e91e8c;font-weight:700;">See your table</a></p>
        </div>`,
      }).catch(() => {});
    }

    // Phone-only groups would otherwise get no coordination at all: the
    // founder gets a manual-coordination alert with the host's phone.
    if (!memberEmails.length || !t.host_email) {
      await sendEmail({
        kind: "table-claim",
        to: "hello@findmymahjgame.com",
        subject: `PHONE-ONLY TABLE FULL: coordinate ${t.city || "this table"} by text`,
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
          <h2 style="color:#1a1f5e;">A table filled but cannot self-coordinate by email</h2>
          <p style="color:#374151;line-height:1.7;">
            Host: <strong>${escapeHtml(t.host_name || "?")}</strong> ${t.host_phone ? `(text: ${escapeHtml(t.host_phone)})` : "(no phone on file)"}<br/>
            When: <strong>${when || "?"}</strong> in <strong>${area}</strong><br/>
            Players: ${names || "?"}<br/>
            Members with email: ${memberEmails.length}
          </p>
          <p style="color:#374151;line-height:1.7;">Please text the host the coordination note (public place, group intro).</p>
          <p><a href="${escapeHtml(link)}" style="color:#e91e8c;font-weight:700;">Table page</a></p>
        </div>`,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, seatsRemaining: remaining });
}
