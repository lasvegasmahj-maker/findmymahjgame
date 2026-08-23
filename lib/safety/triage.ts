// Deterministic report triage. No LLM calls: the guarantee this module exists to
// make is that every report gets the same, reproducible status with no model in
// the loop and no network call that could fail silently or drift over time.

export const REPORT_CATEGORIES = ["harassment", "spam_scam", "unsafe", "false_identity", "other"] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_STATUSES = ["new", "triaged_low", "needs_human", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export function isReportCategory(v: unknown): v is ReportCategory {
  return typeof v === "string" && (REPORT_CATEGORIES as readonly string[]).includes(v);
}

// Harassment, unsafe, and false identity name a person's safety directly, so they
// always reach a human; there is no detail short enough or clean enough to auto
// clear one of these.
const ALWAYS_NEEDS_HUMAN: ReadonlySet<ReportCategory> = new Set(["harassment", "unsafe", "false_identity"]);

// spam_scam and other may auto-clear to a low queue only for a short, plain report.
// Anything longer reads as a real account of an incident, not a quick flag.
export const LOW_TRIAGE_MAX_DETAIL_LENGTH = 140;

// Conservative on purpose: a false positive costs a person a few minutes reading a
// report that turns out to be spam; a false negative on a real safety issue costs
// far more. Any hit escalates, no exceptions.
const ESCALATION_KEYWORDS = [
  "kill", "hurt", "hurts", "hurting", "weapon", "gun", "knife", "threat", "threaten", "threatened",
  "threatening", "stalk", "stalking", "stalked", "follow(?:ed|ing)? me", "showed up", "assault",
  "assaulted", "rape", "raped", "abuse", "abused", "abusive", "suicide", "self harm", "self-harm",
  "child", "minor", "underage", "afraid", "scared", "unsafe", "violent", "violence", "attack",
  "attacked", "hit me", "won'?t leave", "wont leave", "address", "police", "emergency", "predator",
  "grooming",
];
const ESCALATION_RE = new RegExp(`(${ESCALATION_KEYWORDS.join("|")})`, "i");

// Pure function, no I/O: unit-testable in isolation and safe to call inline in the
// report route with no await.
export function triageReport(category: ReportCategory, detail: string | null | undefined): ReportStatus {
  if (ALWAYS_NEEDS_HUMAN.has(category)) return "needs_human";
  const text = (detail || "").trim();
  if (text.length > LOW_TRIAGE_MAX_DETAIL_LENGTH) return "needs_human";
  if (ESCALATION_RE.test(text)) return "needs_human";
  return "triaged_low";
}
