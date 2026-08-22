// Weekly operator digest. This is a report for Shauna, not an email to anyone: it renders
// inside the admin console and introduces no sending dependency. Every number here is a
// count over rows in a fixed window, so the same window always produces the same digest.

export type DigestWindow = { since: string; until: string };

export type DigestInput = {
  prospectsCreated: Array<{ status: string; metro?: string | null }>;
  eventsInWindow: Array<{ agent: string; action: string }>;
  listingsPublished: Array<{ city?: string | null; state?: string | null }>;
  drafts: { total: number; approved: number };
  sends: number;
  suppressions: number;
  reviewFlags: Array<{ review_flag: string | null }>;
};

export type Digest = {
  window: DigestWindow;
  changed: Array<[string, number]>;
  needsShauna: string[];
  agentQueue: string[];
  sends: number;
};

export function isoWeekAgo(now = Date.now(), days = 7): DigestWindow {
  return { since: new Date(now - days * 86400000).toISOString(), until: new Date(now).toISOString() };
}

function countBy(rows: Array<{ action: string }>, re: RegExp): number {
  return rows.filter((r) => re.test(r.action)).length;
}

export function buildDigest(input: DigestInput, window: DigestWindow): Digest {
  const newlyQualified = input.prospectsCreated.filter((p) => p.status === "QUALIFIED").length;
  const newlyRejected = countBy(input.eventsInWindow, /deep_verify_rejected|rejected/);
  const duplicatesPrevented = countBy(input.eventsInWindow, /duplicate|already_(a_listing|known)/);
  const freshnessChanges = countBy(input.eventsInWindow, /reverification_proposed/);
  const privacyHolds = input.reviewFlags.filter((r) => r.review_flag === "private_location_hold").length;
  const needsReviewNow = input.reviewFlags.filter((r) => Boolean(r.review_flag)).length;

  const changed: Array<[string, number]> = [
    ["New prospects discovered", input.prospectsCreated.length],
    ["Newly qualified", newlyQualified],
    ["Newly published listings", input.listingsPublished.length],
    ["Newly rejected", newlyRejected],
    ["Duplicates prevented", duplicatesPrevented],
    ["Freshness findings filed", freshnessChanges],
    ["Listings needing review", needsReviewNow],
    ["Private location holds", privacyHolds],
    ["Suppressions on file", input.suppressions],
    ["Outreach drafts waiting", input.drafts.total],
    ["Drafts you approved", input.drafts.approved],
    ["Emails sent", input.sends],
  ];

  // Only genuine human calls belong here. Anything an agent may do at the current autonomy
  // level goes in the agent queue instead, so this list stays short enough to act on.
  const needsShauna: string[] = [];
  if (input.drafts.total > 0 && input.drafts.approved === 0) {
    needsShauna.push(`${input.drafts.total} outreach drafts have never been reviewed. Approving one does not send it.`);
  }
  if (privacyHolds > 0) {
    needsShauna.push(`${privacyHolds} listings are held because their location may be a private home.`);
  }
  if (needsReviewNow > 0) {
    needsShauna.push(`${needsReviewNow} listings carry a review flag awaiting a decision.`);
  }

  // The queue names work that is already inside policy. It reports; it does not authorize.
  const agentQueue: string[] = [
    "Verify and publish the remaining approved research candidates",
    "Run the freshness scan and file findings for stale listings",
    "Research the weakest metro identified by market coverage",
    "Deep verify prospects still sitting in review",
  ];

  return { window, changed, needsShauna, agentQueue, sends: input.sends };
}

// Draft sampling for review. Picks a spread across metro and prospect type rather than the
// newest N, so a reviewer sees the range of what the generator produces. Read only: the
// caller receives ids to display, and nothing about approval state is touched here.
export type SampleDraft = { id: string; metro?: string | null; prospect_type?: string | null; confidence?: string | null };

export function representativeSample<T extends SampleDraft>(drafts: T[], target = 9): T[] {
  // Metro rotates on the outer loop and category on the inner one, so a small sample covers
  // several cities before it covers several categories within one city. Taking buckets in
  // sorted order instead would fill the quota from whichever metro sorts first.
  const byMetro = new Map<string, Map<string, T[]>>();
  for (const d of drafts) {
    const metro = d.metro || "unknown";
    const type = d.prospect_type || "unknown";
    if (!byMetro.has(metro)) byMetro.set(metro, new Map());
    const types = byMetro.get(metro)!;
    if (!types.has(type)) types.set(type, []);
    types.get(type)!.push(d);
  }
  const metros = [...byMetro.keys()].sort();
  const cursors = new Map(metros.map((m) => [m, { type: 0, index: 0 }]));
  const out: T[] = [];
  let progressed = true;
  while (out.length < target && progressed) {
    progressed = false;
    for (const m of metros) {
      if (out.length >= target) break;
      const types = [...byMetro.get(m)!.keys()].sort();
      const cursor = cursors.get(m)!;
      for (let attempt = 0; attempt < types.length; attempt++) {
        const type = types[(cursor.type + attempt) % types.length];
        const bucket = byMetro.get(m)!.get(type)!;
        const taken = out.filter((d) => (d.metro || "unknown") === m && (d.prospect_type || "unknown") === type).length;
        if (taken < bucket.length) {
          out.push(bucket[taken]);
          cursor.type = (cursor.type + attempt + 1) % types.length;
          progressed = true;
          break;
        }
      }
    }
  }
  return out;
}

// Phone queue priority. No invented numeric score: each entry carries the named reasons it
// rose, and entries with no reason never appear.
export type PhoneCandidate = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  metro?: string | null;
  prospect_type?: string | null;
  public_phone?: string | null;
  public_email?: string | null;
  status?: string | null;
  qualification_score?: number | null;
};

export type PhonePriority = PhoneCandidate & { reasons: string[] };

export function prioritizePhoneQueue(
  candidates: PhoneCandidate[],
  weakMetros: Set<string>,
  limit = 12
): PhonePriority[] {
  const scored: PhonePriority[] = [];
  for (const c of candidates) {
    if (!c.public_phone) continue;
    const reasons: string[] = [];
    if (!c.public_email) reasons.push("phone is the only way to reach them, so a call is the whole blocker");
    if (c.metro && weakMetros.has(c.metro)) reasons.push(`${c.metro} coverage is thin, so one confirmation moves the metro`);
    if ((c.qualification_score ?? 0) >= 90) reasons.push("evidence quality is high, so the call is likely to convert");
    if (c.prospect_type && /tournament|club|library|senior|jcc|rec_center|community/.test(c.prospect_type)) {
      reasons.push("community or tournament host, which serves many players per listing");
    }
    if (c.status === "NEEDS_REVIEW") reasons.push("a call resolves the specific question holding this record");
    if (reasons.length === 0) continue;
    scored.push({ ...c, reasons });
  }
  scored.sort((a, b) => b.reasons.length - a.reasons.length || (b.qualification_score ?? 0) - (a.qualification_score ?? 0) || a.name.localeCompare(b.name));
  return scored.slice(0, limit);
}
