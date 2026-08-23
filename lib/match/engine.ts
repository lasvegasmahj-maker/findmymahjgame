import type { RecordClass } from "@/lib/analytics/events";
import { TABLE_SIZE } from "./states";

// Mahj Match compatibility engine. Pure and deterministic: no database access, no network
// call, no LLM. Every function here takes plain data in and returns plain data out, so the
// whole thing is unit-testable without a server.
//
// Design note on where facts come from: matching_profiles (lib/match/consent.ts territory)
// holds who a player durably IS (skill, social style, host preference, group preference) and
// gates whether they may be matched at all. play_requests holds what they are asking for
// RIGHT NOW (city, state, day, time, variant) and changes every time they open a new request.
// A MatchCandidate below is the join of both: the request's ask plus the profile's soft-scoring
// facts. This keeps the request route independent of whatever the account/consent UI has
// populated on the profile, and keeps a stale profile city from silently overriding a fresh
// request.
//
// VISIBILITY BY STATE (the privacy contract every caller of this engine must honor):
//   - Before a seat is accepted (table 'proposed', seat 'invited'): a player invited to a table
//     sees at most the FIRST NAME of the other invited players (see firstNameOf below) plus the
//     shared compatibility facts that put them at the same table: day, time, city/state area,
//     skill, and variant. Never an email, phone number, exact address, or last name, and this
//     holds even for a co-invitee who has already accepted their own seat.
//   - All four seats 'accepted' (table 'forming', then 'confirmed'): the table becomes visible
//     as a real table. Each member's full display_name (already formatted "First L.") and the
//     host's chosen venue area may be shown. Contact and address exchange happen only through
//     the existing share-code table page (app/t/[code]) mechanics, the same as the public
//     self-serve flow; nothing here ever returns a raw email or phone number.

export type Skill = "beginner" | "intermediate" | "advanced" | "any";
export type SocialStyle = "social" | "competitive" | "either";
export type HostPref = "can_host" | "prefer_travel" | "either";
export type GroupPref = "same_group" | "new_people" | "either";

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
export const TIMES_OF_DAY = ["Morning", "Afternoon", "Evening"] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

export type MatchCandidate = {
  requestId: string;
  userId: string;
  recordClass: RecordClass;
  // Set by the caller from lib/match/consent.ts's readMatchingConsent() before the candidate
  // ever reaches the engine. Kept on the candidate (rather than trusted by omission) so a
  // caller that forgets to filter still cannot produce a table with an unconsented player.
  consentEligible: boolean;
  variant: string;
  city: string | null;
  state: string | null;
  dayPref: string | null;
  timePref: string | null;
  skill: Skill;
  socialStyle: SocialStyle;
  hostPref: HostPref;
  groupPref: GroupPref;
  // Other user_ids this candidate has an accepted seat history with, from the tables.parent_table_id
  // lineage. Computed by the caller (a pure function has no business walking a database).
  priorTableUserIds: string[];
  createdAt: string;
};

export function firstNameOf(displayName: string | null | undefined): string {
  if (!displayName) return "A player";
  const first = displayName.trim().split(/\s+/)[0];
  return first || "A player";
}

export function blockKey(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join("|");
}

function normCity(s: string | null): string {
  return (s || "").trim().toLowerCase();
}
function normState(s: string | null): string {
  return (s || "").trim().toLowerCase();
}

// lib/geo.ts's distance helpers need latitude/longitude, and matching_profiles carries none:
// only city, state and travel_radius_miles. Without coordinates there is no radius to compute,
// so the hard geo rule falls back to exact city+state equality, per the brief. travel_radius_miles
// stays on the schema for when geocoding lands; until then two players in the same named city
// are compatible and two players anywhere else are not, regardless of the number they set.
function sameMetro(a: MatchCandidate, b: MatchCandidate): boolean {
  const ca = normCity(a.city);
  const sa = normState(a.state);
  if (ca === "" || sa === "") return false;
  return ca === normCity(b.city) && sa === normState(b.state);
}

// Null day or time on a request means "flexible," mirroring the legacy matcher's wildcard
// semantics; a flexible player is compatible with any specific slot.
function timeSlotsOverlap(a: MatchCandidate, b: MatchCandidate): boolean {
  const dayOk = a.dayPref == null || b.dayPref == null || a.dayPref === b.dayPref;
  const timeOk = a.timePref == null || b.timePref == null || a.timePref === b.timePref;
  return dayOk && timeOk;
}

// The hard rules: violate any one and two players may never share a table, no matter how the
// soft score comes out. Order matters only for short-circuit cost, not for correctness.
export function hardCompatible(a: MatchCandidate, b: MatchCandidate, blockedPairs: ReadonlySet<string>): boolean {
  if (a.userId === b.userId) return false;
  if (!a.consentEligible || !b.consentEligible) return false;
  if (a.recordClass !== b.recordClass) return false;
  if (a.variant !== b.variant) return false;
  if (!sameMetro(a, b)) return false;
  if (!timeSlotsOverlap(a, b)) return false;
  if (blockedPairs.has(blockKey(a.userId, b.userId))) return false;
  return true;
}

function allPairsCompatible(members: MatchCandidate[], blockedPairs: ReadonlySet<string>): boolean {
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      if (!hardCompatible(members[i], members[j], blockedPairs)) return false;
    }
  }
  return true;
}

export function groupHardCompatible(group: MatchCandidate[], blockedPairs: ReadonlySet<string>): boolean {
  return group.length === TABLE_SIZE && allPairsCompatible(group, blockedPairs);
}

const SKILL_RANK: Record<Exclude<Skill, "any">, number> = { beginner: 0, intermediate: 1, advanced: 2 };

// Exact skill match scores highest, one step apart (beginner/intermediate) scores next, and
// 'any' on either side is a real but weaker match since it says less about fit.
function skillScore(a: Skill, b: Skill): number {
  if (a === "any" || b === "any") return 1;
  const diff = Math.abs(SKILL_RANK[a] - SKILL_RANK[b]);
  if (diff === 0) return 3;
  if (diff === 1) return 2;
  return 0;
}

function socialScore(a: SocialStyle, b: SocialStyle): number {
  if (a === "either" || b === "either") return 1;
  return a === b ? 2 : 0;
}

// Run-it-back preference. same_group players score a bonus when paired with someone they have
// an accepted-seat history with; new_people players score a bonus when paired with a stranger.
// 'either' contributes nothing either way.
function groupPrefScore(a: MatchCandidate, b: MatchCandidate): number {
  const playedTogether = a.priorTableUserIds.includes(b.userId) || b.priorTableUserIds.includes(a.userId);
  let score = 0;
  if (a.groupPref === "same_group" && playedTogether) score += 2;
  if (b.groupPref === "same_group" && playedTogether) score += 2;
  if (a.groupPref === "new_people" && !playedTogether) score += 1;
  if (b.groupPref === "new_people" && !playedTogether) score += 1;
  return score;
}

export function pairScore(a: MatchCandidate, b: MatchCandidate): number {
  return skillScore(a.skill, b.skill) + socialScore(a.socialStyle, b.socialStyle) + groupPrefScore(a, b);
}

const CAN_HOST_BONUS = 2;

// host_pref complementarity is a group property, not a pairwise one: the table needs at least
// one willing host, not every pair to agree on hosting.
export function groupScore(group: MatchCandidate[]): number {
  let total = 0;
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) total += pairScore(group[i], group[j]);
  }
  if (group.some((g) => g.hostPref === "can_host")) total += CAN_HOST_BONUS;
  return total;
}

function bucketKey(c: MatchCandidate): string {
  return `${c.recordClass}|${c.variant}|${normCity(c.city)}|${normState(c.state)}`;
}

function byCreatedAtThenId(a: MatchCandidate, b: MatchCandidate): number {
  const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  return diff !== 0 ? diff : a.requestId.localeCompare(b.requestId);
}

// Grows a table of TABLE_SIZE around an anchor by ranking every hard-compatible candidate
// against the anchor's pair score, then greedily accepting the next best-ranked candidate that
// stays hard-compatible with everyone already picked. This is a deterministic heuristic, not an
// exhaustive maximum-weight-clique search: exhaustive search over every 4-subset of a pool is
// combinatorial and unnecessary at Mahj Match's scale, and a stable, explainable ranking matters
// more than a theoretical global optimum for a feature this size.
function growGroupFrom(
  anchor: MatchCandidate,
  pool: MatchCandidate[],
  blockedPairs: ReadonlySet<string>
): MatchCandidate[] | null {
  const compatible = pool.filter((c) => c.requestId !== anchor.requestId && hardCompatible(anchor, c, blockedPairs));
  if (compatible.length < TABLE_SIZE - 1) return null;

  const ranked = [...compatible].sort(
    (x, y) => pairScore(anchor, y) - pairScore(anchor, x) || x.requestId.localeCompare(y.requestId)
  );
  const group = [anchor];
  for (const cand of ranked) {
    if (group.length === TABLE_SIZE) break;
    if (group.every((g) => hardCompatible(g, cand, blockedPairs))) group.push(cand);
  }
  return group.length === TABLE_SIZE ? group : null;
}

export type BuildGroupsResult = {
  groups: MatchCandidate[][];
  leftover: MatchCandidate[];
};

// Buckets first by the fields that are transitively equal within a hard-compatible group
// (record_class, variant, city, state), which are cheap and exact, then grows tables within
// each bucket oldest-request-first for fairness. When a bucket has exactly one more compatible
// player than a table needs (the 5-for-4 case), the anchor's ranking naturally leaves the
// weakest-scoring one behind in the pool for the next run rather than picking arbitrarily.
export function buildGroups(pool: MatchCandidate[], blockedPairs: ReadonlySet<string>): BuildGroupsResult {
  const buckets = new Map<string, MatchCandidate[]>();
  for (const c of pool) {
    if (!c.consentEligible) continue;
    const key = bucketKey(c);
    const list = buckets.get(key);
    if (list) list.push(c);
    else buckets.set(key, [c]);
  }

  const groups: MatchCandidate[][] = [];
  const leftover: MatchCandidate[] = [];

  for (const bucket of buckets.values()) {
    let remaining = [...bucket].sort(byCreatedAtThenId);
    while (remaining.length >= TABLE_SIZE) {
      const anchor = remaining[0];
      const group = growGroupFrom(anchor, remaining, blockedPairs);
      if (!group) {
        leftover.push(anchor);
        remaining = remaining.slice(1);
        continue;
      }
      groups.push(group);
      const chosen = new Set(group.map((g) => g.requestId));
      remaining = remaining.filter((c) => !chosen.has(c.requestId));
    }
    leftover.push(...remaining);
  }
  return { groups, leftover };
}

// For the 3-plus-1 case: a table with an open seat (someone declined or left) needs the single
// best compatible open request to fill it. Ranked by total pair score against every remaining
// member (never just one of them, so a replacement cannot be a good fit for one seat holder and
// a bad one for another), tied broken by whoever has waited longest.
export function pickReplacement(
  existingMembers: MatchCandidate[],
  pool: MatchCandidate[],
  blockedPairs: ReadonlySet<string>
): MatchCandidate | null {
  const existingIds = new Set(existingMembers.map((m) => m.userId));
  const eligible = pool.filter(
    (c) =>
      c.consentEligible &&
      !existingIds.has(c.userId) &&
      existingMembers.every((m) => hardCompatible(m, c, blockedPairs))
  );
  if (eligible.length === 0) return null;

  eligible.sort((x, y) => {
    const sx = existingMembers.reduce((s, m) => s + pairScore(m, x), 0);
    const sy = existingMembers.reduce((s, m) => s + pairScore(m, y), 0);
    if (sy !== sx) return sy - sx;
    return new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime();
  });
  return eligible[0];
}
