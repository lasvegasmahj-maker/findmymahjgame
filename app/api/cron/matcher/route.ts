import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { cronRequestAuthorized } from "@/lib/cron-auth";
import { lazyServerClient } from "@/lib/supabase-server";
import { isLaunched } from "@/lib/launch-gates";
import { buildGroups, firstNameOf, type MatchCandidate } from "@/lib/match/engine";
import { TABLE_SIZE } from "@/lib/match/states";
import {
  buildCandidates,
  buildBlockedPairs,
  getProfileBasics,
  getAuthEmail,
  fillOpenSeat,
  type PlayRequestRow,
} from "@/lib/match/service";
import { notify } from "@/lib/notifications/notify";
import { track } from "@/lib/analytics/events";
import { escapeHtml } from "@/lib/sanitize";

// Mahj Match's matcher. Ships dark behind app_settings.matcher_enabled, same on/off switch as
// before. What changed: founder one-click approval and the Dallas pilot allowlist are gone.
// Per-player consent (lib/match/consent.ts, checked inside buildCandidates for every request)
// replaces founder approval, and geography is now the engine's own hard constraint instead of a
// hardcoded city list, so any consented pair of players anywhere can be matched.
const supabase = lazyServerClient();

const PLAY_REQUEST_SELECT = "id, user_id, variant, city, state, day_pref, time_pref, status, record_class, created_at";

export async function GET(req: NextRequest) {
  const ok = cronRequestAuthorized(req.headers.get("authorization"));
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: setting, error: settingErr } = await supabase
    .from("app_settings").select("value").eq("key", "matcher_enabled").maybeSingle();
  if (settingErr) {
    if (settingErr.code === "42P01" || settingErr.code === "PGRST205") {
      // Migration not applied yet: stay silent and dark.
      return NextResponse.json({ skipped: true, reason: "matching migration not applied" });
    }
    console.error("matcher: settings query failed:", settingErr.message);
    return NextResponse.json({ error: "settings query failed" }, { status: 500 });
  }
  if (setting?.value !== "true") return NextResponse.json({ skipped: true, reason: "matcher disabled" });

  const result = await runMatcher(supabase);
  return NextResponse.json(result);
}

export type RunMatcherResult = {
  pooled: number;
  tablesProposed: number;
  leftoverInPool: number;
  seatsRefilled: number;
};

// Factored out of the GET handler so tests can run the matcher directly against a live Supabase
// client without needing the cron secret or an HTTP round trip.
export async function runMatcher(db: SupabaseClient): Promise<RunMatcherResult> {
  const launched = await isLaunched(db, "playerMatching");

  const { data: openRows, error: reqErr } = await db
    .from("play_requests")
    .select(PLAY_REQUEST_SELECT)
    .eq("status", "open")
    .order("created_at", { ascending: true })
    .limit(200);
  if (reqErr) {
    console.error("matcher: play_requests query failed:", reqErr.message);
    return { pooled: 0, tablesProposed: 0, leftoverInPool: 0, seatsRefilled: 0 };
  }

  // buildCandidates is where consent (readMatchingConsent) and the dark launch gate both get
  // enforced; a request that fails either simply never becomes a candidate here.
  const candidates = await buildCandidates(db, (openRows || []) as PlayRequestRow[], launched);
  const blocked = await buildBlockedPairs(db, candidates.map((c) => c.userId));
  const { groups, leftover } = buildGroups(candidates, blocked);

  for (const group of groups) {
    await proposeTable(db, group);
  }

  const seatsRefilled = await refillOpenSeats(db, launched);

  return { pooled: candidates.length, tablesProposed: groups.length, leftoverInPool: leftover.length, seatsRefilled };
}

// The 3-plus-1 sweep: any table still short a seat (someone declined and no immediate
// replacement was available, or someone left after the table confirmed) gets another attempt
// with whatever new open requests have shown up since.
async function refillOpenSeats(db: SupabaseClient, launched: boolean): Promise<number> {
  const { data: openTables } = await db.from("tables").select("id").in("status", ["proposed", "forming"]);
  if (!openTables?.length) return 0;

  const tableIds = openTables.map((t) => t.id as string);
  const { data: seatRows } = await db
    .from("table_seats")
    .select("table_id, status")
    .in("table_id", tableIds)
    .in("status", ["invited", "accepted"]);
  const activeCounts = new Map<string, number>();
  for (const s of seatRows || []) activeCounts.set(s.table_id, (activeCounts.get(s.table_id) || 0) + 1);

  let refilled = 0;
  for (const tableId of tableIds) {
    if ((activeCounts.get(tableId) || 0) >= TABLE_SIZE) continue;
    const filled = await fillOpenSeat(db, { id: tableId }, launched);
    if (!filled) continue;
    refilled++;
    await track(db, "seat_replacement", { recordClass: filled.recordClass });

    const { data: tableRow } = await db
      .from("tables")
      .select("city, day_of_week, time_of_day")
      .eq("id", tableId)
      .maybeSingle();
    const email = await getAuthEmail(db, filled.userId);
    if (!email || !tableRow) continue;
    await notify(db, {
      to: email,
      userId: filled.userId,
      kind: "match_table_proposed",
      subject: "A Mahj Match table wants to form",
      html: `<p>A table opened up${tableRow.city ? ` in ${escapeHtml(tableRow.city)}` : ""}${tableRow.day_of_week ? `, ${escapeHtml(tableRow.day_of_week)}` : ""}${tableRow.time_of_day ? ` ${escapeHtml(tableRow.time_of_day).toLowerCase()}` : ""}. Visit Mahj Match to accept your seat.</p>`,
      related: { table: "tables", id: tableId },
      recordClass: filled.recordClass,
    });
  }
  return refilled;
}

// Creates the tables row (status 'proposed', host_user_id null until formation), the four
// invited seats, the match_drafts audit row, and sends each invitee their proposal email.
async function proposeTable(db: SupabaseClient, group: MatchCandidate[]): Promise<void> {
  const shareCode = crypto.randomBytes(4).toString("hex");
  const recordClass = group[0].recordClass;

  const { data: tableRow, error: tableErr } = await db
    .from("tables")
    .insert({
      share_code: shareCode,
      // NOT NULL with no default; there is no human host until formation, so this is a
      // placeholder never rendered anywhere (app/t/[code] does not display host_name).
      host_name: "Mahj Match",
      city: group[0].city,
      state: group[0].state,
      day_of_week: group[0].dayPref,
      time_of_day: group[0].timePref,
      skill: "anyone",
      seats_total: TABLE_SIZE,
      status: "proposed",
      host_user_id: null,
      record_class: recordClass,
    })
    .select("id")
    .single();
  if (tableErr || !tableRow) {
    console.error("matcher: table insert failed", tableErr?.message);
    return;
  }

  const displayNames = new Map<string, string | null>();
  for (const member of group) {
    const profile = await getProfileBasics(db, member.userId);
    displayNames.set(member.userId, profile?.displayName ?? null);
    await db.from("table_seats").insert({
      table_id: tableRow.id,
      user_id: member.userId,
      name: profile?.displayName || "Mahj Match Player",
      status: "invited",
      record_class: member.recordClass,
    });
    await db.from("play_requests").update({ status: "proposed" }).eq("id", member.requestId);
  }

  await db.from("match_drafts").insert({
    city: group[0].city || "",
    day_pref: group[0].dayPref,
    time_pref: group[0].timePref,
    request_ids: group.map((m) => m.requestId),
    status: "proposed",
    table_id: tableRow.id,
  });

  for (const member of group) {
    const email = await getAuthEmail(db, member.userId);
    if (!email) continue;
    // Privacy rule (see lib/match/engine.ts): an invitee sees first names only, plus the facts
    // that seated the group together, never full names or contact info before they accept.
    const othersLine = group
      .filter((m) => m.userId !== member.userId)
      .map((m) => firstNameOf(displayNames.get(m.userId) ?? null))
      .join(", ");
    await notify(db, {
      to: email,
      userId: member.userId,
      kind: "match_table_proposed",
      subject: "A Mahj Match table wants to form",
      html: `<p>A table wants to form${group[0].city ? ` in ${escapeHtml(group[0].city)}` : ""}${group[0].dayPref ? `, ${escapeHtml(group[0].dayPref)}` : ""}${group[0].timePref ? ` ${escapeHtml(group[0].timePref).toLowerCase()}` : ""}.</p>
        <p>With you: ${escapeHtml(othersLine)}.</p>
        <p>Visit Mahj Match to accept your seat.</p>`,
      related: { table: "tables", id: tableRow.id },
      recordClass: member.recordClass,
    });
  }

  await track(db, "table_proposed", { recordClass, props: { variant: group[0].variant } });
}
