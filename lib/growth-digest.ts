// Renders in the admin console rather than being emailed, so the digest adds no sending
// dependency to a system whose whole safety story is that it cannot send.

export type DigestWindow = { since: string; until: string };

export type DigestInput = {
  prospectsCreated: Array<{ status: string }>;
  eventsInWindow: Array<{ action: string }>;
  listingsPublished: unknown[];
  drafts: { total: number; approved: number };
  sends: number;
  suppressions: number;
  flaggedListings: number;
  privateLocationHolds: number;
  researchedProspects: number;
  qualifiedProspects: number;
  publishableAmericanListings: number;
  publishableUnclassifiedListings: number;
  variantHeldProspects: number;
};

export type Digest = {
  window: DigestWindow;
  changed: Array<[string, number, "window" | "total"]>;
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

export function buildDigest(input: DigestInput, window: DigestWindow, weakestMetro?: string | null): Digest {
  const discoveredNowQualified = input.prospectsCreated.filter((p) => p.status === "QUALIFIED").length;
  const newlyRejected = countBy(input.eventsInWindow, /^(deep_verify_rejected|publishability_reject_not_current)$/);
  const freshnessChanges = countBy(input.eventsInWindow, /^reverification_proposed$/);
  const heldFromPublication = countBy(input.eventsInWindow, /^publishability_hold_/);
  const privacyHolds = input.privateLocationHolds;
  const needsReviewNow = input.flaggedListings;

  // Each entry carries its own scope so no tile depends on its position in this list, and the
  // page cannot drift out of sync with which numbers are weekly.
  const changed: Array<[string, number, "window" | "total"]> = [
    ["New prospects discovered", input.prospectsCreated.length, "window"],
    ["Prospects on file", input.researchedProspects, "total"],
    ["Qualified or further along", input.qualifiedProspects, "total"],
    ["Published American Mahjong listings", input.publishableAmericanListings, "total"],
    ["Published listings not yet classified", input.publishableUnclassifiedListings, "total"],
    ["Held on mahjong variant", input.variantHeldProspects, "total"],
    ["Discovered this week, now qualified", discoveredNowQualified, "window"],
    ["Newly published listings", input.listingsPublished.length, "window"],
    ["Newly rejected", newlyRejected, "window"],
    ["Held from publication", heldFromPublication, "window"],
    ["Freshness findings filed", freshnessChanges, "window"],
    ["Listings needing review", needsReviewNow, "total"],
    ["Private location holds", privacyHolds, "total"],
    ["Suppressions on file", input.suppressions, "total"],
    ["Outreach drafts waiting", input.drafts.total, "total"],
    ["Drafts you approved", input.drafts.approved, "total"],
    ["Emails sent", input.sends, "total"],
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
  // The gap between what is researched and what a player can actually use is the number that
  // matters most, and it is the one a CRM row count hides.
  if (input.variantHeldProspects > 0) {
    needsShauna.push(`${input.variantHeldProspects} researched ${input.variantHeldProspects === 1 ? "group or teacher is" : "groups and teachers are"} held because the mahjong variant is unconfirmed or not American. Some need a source check; the rest need a decision on whether the directory ever shows other variants.`);
  }

  // The queue names work that is already inside policy. It reports; it does not authorize.
  const agentQueue: string[] = [
    "Verify and publish the research candidates that passed the publishability review",
    weakestMetro ? `Research ${weakestMetro}, the weakest metro in the coverage table` : "Research the weakest metro once coverage is computed",
    "Deep verify prospects still sitting in review",
    "Confirm the mahjong variant for entities held on that question",
  ];

  return { window, changed, needsShauna, agentQueue, sends: input.sends };
}

// A spread across metro and type rather than the newest N, so a reviewer judging quality
// sees the range the generator produces instead of one metro's worth.
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

// Named reasons rather than a numeric score, because a score invites trust it has not
// earned and hides which factor actually moved an entry.
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
    if (!c.public_email) reasons.push("no email address on file, so a call is the only way to reach them");
    if (c.metro && weakMetros.has(c.metro)) reasons.push(`${c.metro} needs coverage, so a confirmation here counts for more`);
    if ((c.qualification_score ?? 0) >= 90) reasons.push("evidence quality scored 90 or above");
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
