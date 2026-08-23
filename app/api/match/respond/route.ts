import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";
import { readMatchingConsent } from "@/lib/match/consent";
import { isLaunched, canUseDarkFeature } from "@/lib/launch-gates";
import { rateLimit } from "@/lib/rate-limit";
import { canTransitionSeat, canTransitionTable, TABLE_SIZE, type SeatStatus, type TableStatus } from "@/lib/match/states";
import { getProfileBasics, getAuthEmail, fillOpenSeat, asRecordClass } from "@/lib/match/service";
import { notify } from "@/lib/notifications/notify";
import { track } from "@/lib/analytics/events";
import { escapeHtml } from "@/lib/sanitize";

const supabase = lazyServerClient();

type TableRow = {
  id: string;
  status: string;
  share_code: string;
  city: string | null;
  state: string | null;
  day_of_week: string | null;
  time_of_day: string | null;
  venue_name: string | null;
  host_user_id: string | null;
  record_class: string;
};
type SeatRow = { id: string; status: string; table_id: string };

export async function POST(req: NextRequest) {
  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (!(await rateLimit(req, "match-respond", 20, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  // Consent and the launch gate are checked on every matching operation, including responding to
  // an invite: a player who withdrew consent after being invited cannot still accept.
  const consent = await readMatchingConsent(supabase, session.userId);
  const launched = await isLaunched(supabase, "playerMatching");
  if (!canUseDarkFeature(launched, consent.recordClass)) {
    return NextResponse.json({ error: "Mahj Match is not open to the public yet." }, { status: 403 });
  }
  if (!consent.eligible) {
    return NextResponse.json({ error: "Finish setting up Mahj Match in your account first." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "");
  const tableId = String(body?.tableId || "");
  if (!tableId || (action !== "accept" && action !== "decline" && action !== "leave")) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  // The seat lookup is scoped to the session's own user_id, never a client-supplied seat id.
  // A forged tableId belonging to someone else simply matches no row here, which is what makes
  // this endpoint IDOR-proof without a separate ownership check.
  const { data: seat, error: seatErr } = await supabase
    .from("table_seats")
    .select("id, status, table_id")
    .eq("table_id", tableId)
    .eq("user_id", session.userId)
    .maybeSingle<SeatRow>();
  if (seatErr) {
    console.error("match/respond seat read failed:", seatErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!seat) return NextResponse.json({ error: "No matching seat found." }, { status: 404 });

  const { data: table, error: tableErr } = await supabase
    .from("tables")
    .select("id, status, share_code, city, state, day_of_week, time_of_day, venue_name, host_user_id, record_class")
    .eq("id", tableId)
    .maybeSingle<TableRow>();
  if (tableErr || !table) return NextResponse.json({ error: "Table not found." }, { status: 404 });

  if (action === "accept") return handleAccept(req, session.userId, table, seat);
  if (action === "decline") return handleDecline(session.userId, table, seat, launched);
  return handleLeave(session.userId, table, seat, launched);
}

async function handleAccept(req: NextRequest, userId: string, table: TableRow, seat: SeatRow) {
  if (!canTransitionSeat(seat.status as SeatStatus, "accepted")) {
    return NextResponse.json({ error: "This seat can no longer be accepted." }, { status: 409 });
  }
  const { error: updErr } = await supabase.from("table_seats").update({ status: "accepted" }).eq("id", seat.id);
  if (updErr) {
    console.error("match/respond accept failed:", updErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  await supabase.from("play_requests").update({ status: "proposed" }).eq("user_id", userId).eq("status", "proposed");

  const acceptorProfile = await getProfileBasics(supabase, userId);
  await track(supabase, "table_accept", { recordClass: acceptorProfile?.recordClass || asRecordClass(table.record_class) });

  const { data: allSeats } = await supabase
    .from("table_seats")
    .select("id, user_id, status, record_class")
    .eq("table_id", table.id);
  const seats = allSeats || [];
  const acceptedSeats = seats.filter((s) => s.status === "accepted");

  const others = acceptedSeats.filter((s) => s.user_id && s.user_id !== userId);
  for (const o of others) {
    if (!o.user_id) continue;
    const email = await getAuthEmail(supabase, o.user_id);
    if (!email) continue;
    await notify(supabase, {
      to: email,
      userId: o.user_id,
      kind: "match_player_accepted",
      subject: "Another player accepted your Mahj Match table",
      html: `<p>Good news: ${acceptedSeats.length} of ${TABLE_SIZE} players have now accepted your Mahj Match table${table.city ? ` in ${escapeHtml(table.city)}` : ""}.</p>`,
      related: { table: "tables", id: table.id },
      recordClass: asRecordClass(o.record_class),
    });
  }

  if (acceptedSeats.length < TABLE_SIZE || !canTransitionTable(table.status as TableStatus, "forming")) {
    return NextResponse.json({ ok: true, seatStatus: "accepted", tableStatus: table.status });
  }

  // All four accepted: proposed -> forming -> confirmed happen together here. This MVP has no
  // separate venue-lock step, so "every seat accepted" already means the table is full and real;
  // both transitions are legal in lib/match/states.ts and firing them back to back avoids a
  // 'forming' state that would otherwise sit unreachable between two API calls that never come.
  const acceptedUserIds = acceptedSeats.map((s) => s.user_id).filter((v): v is string => !!v);
  const { data: hostFacts } = await supabase
    .from("matching_profiles")
    .select("user_id, host_pref")
    .in("user_id", acceptedUserIds);
  const canHostId = (hostFacts || []).find((f) => f.host_pref === "can_host")?.user_id || acceptedUserIds[0];
  const hostProfile = await getProfileBasics(supabase, canHostId);

  await supabase
    .from("tables")
    .update({ status: "forming", host_user_id: canHostId, host_name: hostProfile?.displayName || "Mahj Match Host" })
    .eq("id", table.id);
  await supabase.from("table_seats").update({ is_host: true }).eq("table_id", table.id).eq("user_id", canHostId);
  await supabase.from("tables").update({ status: "confirmed", filled_at: new Date().toISOString() }).eq("id", table.id);
  await supabase.from("play_requests").update({ status: "matched" }).in("user_id", acceptedUserIds);

  await track(supabase, "table_formed", { recordClass: asRecordClass(table.record_class) });

  const link = `${req.nextUrl.origin}/t/${table.share_code}`;
  for (const uid of acceptedUserIds) {
    const email = await getAuthEmail(supabase, uid);
    if (!email) continue;
    await notify(supabase, {
      to: email,
      userId: uid,
      kind: "match_table_confirmed",
      subject: "Your Mahj Match table is set",
      html: `<p>All four seats are filled${table.city ? ` for your table in ${escapeHtml(table.city)}` : ""}.</p>
        <p style="font-weight:700;color:#1a6e3a;">For safety, meet in a public place for your first game. We never share phone numbers or home addresses.</p>
        <p><a href="${link}" style="color:#e91e8c;font-weight:700;">See your table</a></p>`,
      related: { table: "tables", id: table.id },
      recordClass: asRecordClass(table.record_class),
    });
  }

  return NextResponse.json({ ok: true, seatStatus: "accepted", tableStatus: "confirmed" });
}

async function handleDecline(userId: string, table: TableRow, seat: SeatRow, launched: boolean) {
  if (!canTransitionSeat(seat.status as SeatStatus, "declined")) {
    return NextResponse.json({ error: "This seat can no longer be declined." }, { status: 409 });
  }
  await supabase.from("table_seats").update({ status: "declined" }).eq("id", seat.id);
  // Declining a specific table is not quitting Mahj Match: the player's own request reopens so
  // the next matcher run can still find them a different table.
  await supabase.from("play_requests").update({ status: "open" }).eq("user_id", userId).eq("status", "proposed");

  const profile = await getProfileBasics(supabase, userId);
  await track(supabase, "table_decline", { recordClass: profile?.recordClass || asRecordClass(table.record_class) });

  await notifyRemainingReopened(table, seat.id);
  await tryRefill(table, launched);

  return NextResponse.json({ ok: true, seatStatus: "declined" });
}

async function handleLeave(userId: string, table: TableRow, seat: SeatRow, launched: boolean) {
  if (!canTransitionSeat(seat.status as SeatStatus, "left")) {
    return NextResponse.json({ error: "This seat cannot be left from its current state." }, { status: 409 });
  }
  await supabase.from("table_seats").update({ status: "left" }).eq("id", seat.id);
  await supabase.from("play_requests").update({ status: "cancelled" }).eq("user_id", userId).eq("status", "matched");

  if (table.status === "confirmed" && canTransitionTable("confirmed", "forming")) {
    await supabase.from("tables").update({ status: "forming" }).eq("id", table.id);
  }

  await notifyRemainingReopened(table, seat.id);
  await tryRefill(table, launched);

  return NextResponse.json({ ok: true, seatStatus: "left" });
}

async function tryRefill(table: TableRow, launched: boolean) {
  const filled = await fillOpenSeat(supabase, { id: table.id }, launched);
  if (!filled) return;
  await track(supabase, "seat_replacement", { recordClass: filled.recordClass });
  const email = await getAuthEmail(supabase, filled.userId);
  if (!email) return;
  await notify(supabase, {
    to: email,
    userId: filled.userId,
    kind: "match_table_proposed",
    subject: "A Mahj Match table wants to form",
    html: `<p>A table opened up${table.city ? ` in ${escapeHtml(table.city)}` : ""}${table.day_of_week ? `, ${escapeHtml(table.day_of_week)}` : ""}${table.time_of_day ? ` ${escapeHtml(table.time_of_day).toLowerCase()}` : ""}. Visit Mahj Match to accept your seat.</p>`,
    related: { table: "tables", id: table.id },
    recordClass: filled.recordClass,
  });
}

async function notifyRemainingReopened(table: TableRow, excludeSeatId: string) {
  const { data: seats } = await supabase
    .from("table_seats")
    .select("id, user_id, status, record_class")
    .eq("table_id", table.id)
    .neq("id", excludeSeatId)
    .in("status", ["invited", "accepted"]);
  for (const s of seats || []) {
    if (!s.user_id) continue;
    const email = await getAuthEmail(supabase, s.user_id);
    if (!email) continue;
    await notify(supabase, {
      to: email,
      userId: s.user_id,
      kind: "match_seat_reopened",
      subject: "A seat opened on your Mahj Match table",
      html: `<p>One seat on your table${table.city ? ` in ${escapeHtml(table.city)}` : ""} opened up. We are looking for the next best match to fill it.</p>`,
      related: { table: "tables", id: table.id },
      recordClass: asRecordClass(s.record_class),
    });
  }
}
