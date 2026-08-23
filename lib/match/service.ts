import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecordClass } from "@/lib/analytics/events";
import { readMatchingConsent } from "./consent";
import { canUseDarkFeature } from "@/lib/launch-gates";
import { TABLE_SIZE } from "./states";
import {
  type MatchCandidate,
  type Skill,
  type SocialStyle,
  type HostPref,
  type GroupPref,
  blockKey,
  pickReplacement,
} from "./engine";

// Database orchestration for Mahj Match. lib/match/engine.ts stays pure and DB-free; every
// function here is the glue that reads Supabase rows into MatchCandidate shape and writes the
// engine's decisions back. Shared by app/api/match/respond (immediate refill on decline/leave)
// and app/api/cron/matcher (the periodic sweep), which both need "read the pool, ask the
// engine, write the result" and would otherwise duplicate that logic.

export type PlayRequestRow = {
  id: string;
  user_id: string | null;
  variant: string | null;
  city: string | null;
  state: string | null;
  day_pref: string | null;
  time_pref: string | null;
  status: string;
  record_class: string;
  created_at: string;
};

type ProfileFacts = { skill: Skill; socialStyle: SocialStyle; hostPref: HostPref; groupPref: GroupPref };
const DEFAULT_FACTS: ProfileFacts = { skill: "any", socialStyle: "either", hostPref: "either", groupPref: "either" };

const RECORD_CLASSES = new Set(["real_external", "test", "internal", "seed_demo"]);

// Defensive narrowing for record_class values read back off a row (typed text in the
// database, not a generated union) so callers never need an `as` cast at the call site.
export function asRecordClass(v: string | null | undefined): RecordClass {
  return v && RECORD_CLASSES.has(v) ? (v as RecordClass) : "real_external";
}

export type ProfileBasics = { displayName: string | null; recordClass: RecordClass; deactivatedAt: string | null };

export async function getProfileBasics(supabase: SupabaseClient, userId: string): Promise<ProfileBasics | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, record_class, deactivated_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return { displayName: data.display_name, recordClass: data.record_class as RecordClass, deactivatedAt: data.deactivated_at };
}

// auth.users is the only place a player's email lives; matching intentionally never copies it
// onto table_seats or play_requests, so every notification looks it up fresh through the admin
// API right before sending.
export async function getAuthEmail(supabase: SupabaseClient, userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user?.email) return null;
    return data.user.email;
  } catch (e) {
    console.error("match/service: getAuthEmail failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

async function loadProfileFacts(supabase: SupabaseClient, userIds: string[]): Promise<Map<string, ProfileFacts>> {
  const map = new Map<string, ProfileFacts>();
  if (userIds.length === 0) return map;
  const { data, error } = await supabase
    .from("matching_profiles")
    .select("user_id, skill, social_style, host_pref, group_pref")
    .in("user_id", userIds);
  if (error) {
    console.error("match/service: matching_profiles read failed:", error.message);
    return map;
  }
  for (const row of data || []) {
    map.set(row.user_id, {
      skill: (row.skill as Skill) || "any",
      socialStyle: (row.social_style as SocialStyle) || "either",
      hostPref: (row.host_pref as HostPref) || "either",
      groupPref: (row.group_pref as GroupPref) || "either",
    });
  }
  return map;
}

async function loadConsentMap(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, { eligible: boolean; recordClass: RecordClass | null }>> {
  const map = new Map<string, { eligible: boolean; recordClass: RecordClass | null }>();
  await Promise.all(
    userIds.map(async (id) => {
      const c = await readMatchingConsent(supabase, id);
      map.set(id, { eligible: c.eligible, recordClass: c.recordClass });
    })
  );
  return map;
}

// Run-it-back lineage, one hop: for each user, every other user they have an accepted seat
// history with, either on the same table or a table directly linked by parent_table_id (the
// "same standing series" relationship run-it-back creates). A full transitive walk of an
// arbitrarily long recurring series is possible but not worth the query fan-out for a soft
// scoring signal; one hop covers the common case of "we played last week, run it back."
export async function loadPriorTableUserIds(supabase: SupabaseClient, userIds: string[]): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (userIds.length === 0) return result;

  const { data: mySeats } = await supabase
    .from("table_seats")
    .select("table_id, user_id")
    .in("user_id", userIds)
    .eq("status", "accepted");
  if (!mySeats || mySeats.length === 0) return result;

  const tableIds = [...new Set(mySeats.map((s) => s.table_id as string))];
  const { data: tableRows } = await supabase.from("tables").select("id, parent_table_id").in("id", tableIds);
  const lineageIds = new Set<string>(tableIds);
  const parentIds = [...new Set((tableRows || []).map((t) => t.parent_table_id).filter((v): v is string => !!v))];
  parentIds.forEach((id) => lineageIds.add(id));
  if (parentIds.length) {
    const { data: siblings } = await supabase.from("tables").select("id").in("parent_table_id", parentIds);
    (siblings || []).forEach((s) => lineageIds.add(s.id));
  }

  const { data: allSeats } = await supabase
    .from("table_seats")
    .select("table_id, user_id")
    .in("table_id", [...lineageIds])
    .eq("status", "accepted");
  const byTable = new Map<string, string[]>();
  for (const s of allSeats || []) {
    const list = byTable.get(s.table_id);
    if (list) list.push(s.user_id);
    else byTable.set(s.table_id, [s.user_id]);
  }

  for (const uid of userIds) {
    const theirTableIds = mySeats.filter((s) => s.user_id === uid).map((s) => s.table_id);
    const co = new Set<string>();
    for (const tid of theirTableIds) {
      for (const other of byTable.get(tid) || []) if (other !== uid) co.add(other);
    }
    result.set(uid, [...co]);
  }
  return result;
}

export async function buildBlockedPairs(supabase: SupabaseClient, userIds: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return set;
  const list = ids.join(",");
  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocker_user_id, blocked_user_id")
    .or(`blocker_user_id.in.(${list}),blocked_user_id.in.(${list})`);
  if (error) {
    console.error("match/service: user_blocks read failed:", error.message);
    return set;
  }
  for (const row of data || []) set.add(blockKey(row.blocker_user_id, row.blocked_user_id));
  return set;
}

// Turns raw play_requests rows into engine-ready candidates: joins matching_profiles for the
// soft-scoring facts, checks consent per user (the one place besides the routes themselves that
// touches readMatchingConsent, so "considered by the matcher" never skips it), and drops anyone
// the dark launch gate does not admit yet. Ineligible or gate-blocked requests are left out of
// the returned array entirely rather than carried through with a false flag: the engine's own
// consentEligible check is defense in depth, exercised directly with hand-built fixtures in
// unit tests, not something production code should rely on by deliberately feeding it bad rows.
export async function buildCandidates(
  supabase: SupabaseClient,
  requests: PlayRequestRow[],
  launched: boolean
): Promise<MatchCandidate[]> {
  const userIds = [...new Set(requests.map((r) => r.user_id).filter((v): v is string => !!v))];
  if (userIds.length === 0) return [];

  const [facts, consent, prior] = await Promise.all([
    loadProfileFacts(supabase, userIds),
    loadConsentMap(supabase, userIds),
    loadPriorTableUserIds(supabase, userIds),
  ]);

  const candidates: MatchCandidate[] = [];
  for (const r of requests) {
    if (!r.user_id) continue;
    const c = consent.get(r.user_id);
    if (!c?.eligible || !c.recordClass) continue;
    if (!canUseDarkFeature(launched, c.recordClass)) continue;
    const f = facts.get(r.user_id) ?? DEFAULT_FACTS;
    candidates.push({
      requestId: r.id,
      userId: r.user_id,
      recordClass: c.recordClass,
      consentEligible: true,
      variant: r.variant || "AMERICAN",
      city: r.city,
      state: r.state,
      dayPref: r.day_pref,
      timePref: r.time_pref,
      skill: f.skill,
      socialStyle: f.socialStyle,
      hostPref: f.hostPref,
      groupPref: f.groupPref,
      priorTableUserIds: prior.get(r.user_id) ?? [],
      createdAt: r.created_at,
    });
  }
  return candidates;
}

const PLAY_REQUEST_SELECT = "id, user_id, variant, city, state, day_pref, time_pref, status, record_class, created_at";

export type FillOpenSeatResult = { userId: string; requestId: string; recordClass: RecordClass } | null;

// Shared by app/api/match/respond (an immediate best-effort refill right when a seat opens) and
// the cron sweep (a periodic retry for whatever the immediate attempt could not fill). Finds the
// single best compatible open request for every currently active (invited or accepted) seat
// holder on the table, inserts them as a new invited seat, and hands their play_request back to
// 'proposed' so it stops showing as available in the open pool.
export async function fillOpenSeat(
  supabase: SupabaseClient,
  table: { id: string },
  launched: boolean
): Promise<FillOpenSeatResult> {
  const { data: activeSeats, error: seatErr } = await supabase
    .from("table_seats")
    .select("id, user_id, status")
    .eq("table_id", table.id)
    .in("status", ["invited", "accepted"]);
  if (seatErr) {
    console.error("match/service: seat read failed:", seatErr.message);
    return null;
  }
  const active = activeSeats || [];
  if (active.length >= TABLE_SIZE || active.length === 0) return null;
  const memberUserIds = active.map((s) => s.user_id).filter((v): v is string => !!v);
  if (memberUserIds.length === 0) return null;

  const { data: memberRequestRows } = await supabase
    .from("play_requests")
    .select(PLAY_REQUEST_SELECT)
    .in("user_id", memberUserIds)
    .in("status", ["proposed", "matched"]);
  const existingMembers = await buildCandidates(supabase, (memberRequestRows || []) as PlayRequestRow[], true);
  if (existingMembers.length === 0) return null;

  const anchor = existingMembers[0];
  const { data: poolRows } = await supabase
    .from("play_requests")
    .select(PLAY_REQUEST_SELECT)
    .eq("status", "open")
    .eq("variant", anchor.variant)
    .ilike("city", anchor.city || "")
    .order("created_at", { ascending: true })
    .limit(100);
  const pool = await buildCandidates(supabase, (poolRows || []) as PlayRequestRow[], launched);
  if (pool.length === 0) return null;

  const blocked = await buildBlockedPairs(supabase, [...memberUserIds, ...pool.map((p) => p.userId)]);
  const picked = pickReplacement(existingMembers, pool, blocked);
  if (!picked) return null;

  const profile = await getProfileBasics(supabase, picked.userId);
  const { error: insertErr } = await supabase.from("table_seats").insert({
    table_id: table.id,
    user_id: picked.userId,
    name: profile?.displayName || "Mahj Match Player",
    status: "invited",
    record_class: picked.recordClass,
  });
  if (insertErr) {
    console.error("match/service: replacement seat insert failed:", insertErr.message);
    return null;
  }
  await supabase.from("play_requests").update({ status: "proposed" }).eq("id", picked.requestId);
  return { userId: picked.userId, requestId: picked.requestId, recordClass: picked.recordClass };
}
