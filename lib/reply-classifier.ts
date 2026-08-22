// Deterministic inbound-reply classification. Rules classify; lib/reply-policy.ts owns what
// is allowed to happen next. A model may one day propose a classification, but it would pass
// through this module's vocabulary and the policy layer exactly like a rule match, and
// nothing in either layer is capable of sending email.

export const REPLY_CLASSES = [
  "INTERESTED",
  "NEEDS_INFO",
  "NOT_INTERESTED",
  "UNSUBSCRIBE",
  "WRONG_PERSON",
  "OUT_OF_OFFICE",
  "BOUNCE_OR_DELIVERY_FAILURE",
  "AMBIGUOUS",
  "HUMAN_REVIEW_REQUIRED",
] as const;
export type ReplyClass = (typeof REPLY_CLASSES)[number];

export type ReplyClassification = {
  classification: ReplyClass;
  confidence: "high" | "medium" | "low";
  rationale: string;
  strippedReply: string;
  unsubscribeSignal: boolean;
  freshnessSignal: boolean;
};

// Everything below a quote marker is the sender's copy of OUR message, not their words.
// Classifying quoted text is how a reply that merely quotes our unsubscribe line gets
// wrongly suppressed, so stripping runs before any rule.
export function stripQuotedText(raw: string): string {
  const lines = String(raw || "").split(/\r?\n/);
  const kept: string[] = [];
  for (const line of lines) {
    const l = line.trim();
    if (/^>/.test(l)) continue;
    if (/^On .{5,80} wrote:$/i.test(l)) break;
    if (/^-{2,}\s*(Original Message|Forwarded message)/i.test(l)) break;
    if (/^From:\s.+@/i.test(l)) break;
    if (/^Sent from my (iPhone|iPad|Android|Galaxy)/i.test(l)) continue;
    kept.push(line);
  }
  return kept.join("\n").trim();
}

const BOUNCE_RE =
  /\b(delivery (status notification|has failed)|undeliverable|mailbox (full|unavailable)|address not found|user unknown|550[- ]5\.\d|mailer-daemon|postmaster notification)\b/i;
const UNSUB_RE =
  /\b(unsubscribe|remove me|take me off|opt me out|opt out|do not (contact|email)( me)?( again)?|stop (emailing|contacting)|delete my (info|email|address))\b/i;
const STOP_ALONE_RE = /^\s*(stop|no|unsubscribe|remove)[.!]?\s*$/i;
const WRONG_PERSON_RE =
  /\b(wrong (person|contact|email)|handles? (this|that) now|no longer (with|at|runs?|involved|teach|host)|i (left|retired from)|not my (role|department)|reached the wrong|has taken over|please contact .+ instead|forward(ed)? (this|your (message|email)) to)\b/i;
const OOO_RE =
  /\b(out of (the )?office|on vacation|away (from email|until)|automatic reply|auto[- ]?reply|autoreply|currently traveling|limited access to email|will (respond|reply) (when|upon my return)|maternity leave)\b/i;
const NOT_INTERESTED_RE =
  /\b(not interested|no interest|no thank(s| you)|we('| a)re good|not for (us|me)|(don't|do not|no longer) (run|host|teach|offer|play|do)\b.{0,30}(anymore|any longer)?|pass on this|not at this time|not looking)\b/i;
const NEEDS_INFO_RE =
  /\b(what (does|do|is|are|would)|how (much|does|do|long|many)|cost|price|pricing|fee|is (it|this) free|more (info|information|details)|can you (explain|tell me)|before (i|we) (decide|commit)|who (runs|is behind))\b/i;
const INTERESTED_RE =
  /\b(interested|interesting|sounds (good|great|fun|wonderful)|yes,? please|sign (me|us) up|add (us|me|my|our)|would love|love to|happy to( be)? (list|join|includ)|let's do it|count (me|us) in|go ahead|please (list|include|add))\b/i;
const ENDED_RE = /\b((don't|do not|no longer|stopped|quit)\b.{0,40}\b(run|host|teach|offer|meet|play)|(closed|disbanded|ended)( down)?( the (group|club|game))?|group (is )?(no more|done|inactive))\b/i;

export function classifyReply(raw: string): ReplyClassification {
  const stripped = stripQuotedText(raw);
  const t = stripped.trim();
  const base = { strippedReply: stripped, freshnessSignal: false, unsubscribeSignal: false };

  if (!t) {
    return { ...base, classification: "AMBIGUOUS", confidence: "low", rationale: "empty after quoted text was stripped" };
  }
  if (BOUNCE_RE.test(t)) {
    return { ...base, classification: "BOUNCE_OR_DELIVERY_FAILURE", confidence: "high", rationale: "delivery failure language", unsubscribeSignal: true };
  }
  if (UNSUB_RE.test(t) || STOP_ALONE_RE.test(t)) {
    return { ...base, classification: "UNSUBSCRIBE", confidence: "high", rationale: "explicit opt-out language in the sender's own text", unsubscribeSignal: true };
  }
  if (WRONG_PERSON_RE.test(t)) {
    return { ...base, classification: "WRONG_PERSON", confidence: "high", rationale: "sender indicates this address is not the right contact", unsubscribeSignal: true };
  }
  if (OOO_RE.test(t)) {
    return { ...base, classification: "OUT_OF_OFFICE", confidence: "high", rationale: "automated absence responder" };
  }
  const ended = ENDED_RE.test(t);
  if (NOT_INTERESTED_RE.test(t) || ended) {
    return {
      ...base,
      classification: "NOT_INTERESTED",
      confidence: "high",
      rationale: ended ? "sender says the activity no longer happens" : "explicit decline",
      freshnessSignal: ended,
    };
  }
  const asks = NEEDS_INFO_RE.test(t) || (t.includes("?") && t.length > 8);
  const positive = INTERESTED_RE.test(t);
  if (asks && positive) {
    return { ...base, classification: "NEEDS_INFO", confidence: "medium", rationale: "positive but asking questions before committing" };
  }
  if (asks) {
    return { ...base, classification: "NEEDS_INFO", confidence: "high", rationale: "question about the offering" };
  }
  if (positive) {
    const strong = /\b(yes,? please|sign (me|us) up|add (us|me)|count (me|us) in|please (list|include|add)|go ahead)\b/i.test(t);
    return {
      ...base,
      classification: strong ? "INTERESTED" : "INTERESTED",
      confidence: strong ? "high" : "medium",
      rationale: strong ? "explicit acceptance" : "positive sentiment without explicit commitment",
    };
  }
  if (t.length < 25) {
    return { ...base, classification: "AMBIGUOUS", confidence: "low", rationale: "short reply with no actionable signal" };
  }
  return { ...base, classification: "HUMAN_REVIEW_REQUIRED", confidence: "low", rationale: "no rule matched; a person must read this" };
}
