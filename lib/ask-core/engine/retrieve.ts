// Deterministic retrieval. An entry is a candidate only when every concept it requires is
// present and no context it blocks is present. Candidates rank by specificity (how many
// concepts the entry requires), then by approval rank (an explicit owner decision outranks
// approval by publication, which outranks research nobody has signed off), then by keyword
// score and matched length, then by corpus order. One `requires` therefore beats any amount
// of keyword evidence, which is what makes a narrow intent beat a broad one without listing
// phrasings; and where two approved texts both fit, the owner's most explicit decision speaks.
// Approval does not outrank specificity: a generic approved entry that must not answer a
// narrower pending entry's scenario keeps out of it by blocking that scenario, and a pending
// entry that must not displace an owner decision blocks the decided context (self-drawn-win
// blocks PAYMENT so payments-basics keeps every payment question where it is in force).

import { RULES_KNOWLEDGE } from "../corpus/entries.ts";
import type { CanonicalRule } from "../corpus/types.ts";

export type Scored = {
  entry: CanonicalRule;
  specificity: number;
  approvalRank: number;
  score: number;
  matchLength: number;
  order: number;
};

export function approvalRank(e: CanonicalRule): number {
  if (e.approval === "owner_approved") return e.provenance.owner_decided ? 3 : 2;
  if (e.approval === "research_verified") return 1;
  return 0;
}

export type RetrieveOptions = {
  // Canonical ids a site excludes by an owner-recorded decision (see SiteConfig.overrides).
  exclude?: ReadonlySet<string>;
  // Rank against a different corpus (tests and authoring only; production always uses RULES_KNOWLEDGE).
  corpus?: readonly CanonicalRule[];
  // For an elliptical follow-up: the player's own words, so a pattern match that begins
  // inside the appended context term can never count on its own.
  bareLength?: number;
};

function scoreOne(entry: CanonicalRule, question: string, lower: string, order: number, bareLength: number): Scored | null {
  if (entry.blocks?.some((b) => (typeof b === "function" ? b(question) : b.test(question)))) return null;
  if (entry.requires && !entry.requires.every((re) => re.test(question))) return null;
  let score = 0;
  let matchLength = 0;
  for (const re of entry.question_patterns) {
    const m = question.match(re);
    if (m && (m.index ?? 0) < bareLength) {
      score += 2;
      matchLength += m[0].length;
    }
  }
  const bareLower = lower.slice(0, bareLength);
  for (const kw of entry.keywords) {
    if (bareLower.includes(kw)) score += 1;
  }
  if (score === 0) return null;
  return { entry, specificity: entry.requires?.length ?? 0, approvalRank: approvalRank(entry), score, matchLength, order };
}

export function compareScored(a: Scored, b: Scored): number {
  return (
    b.specificity - a.specificity ||
    b.approvalRank - a.approvalRank ||
    b.score - a.score ||
    b.matchLength - a.matchLength ||
    a.order - b.order
  );
}

// Every candidate, best first. The best must have matched text (not keywords alone) to count
// as an answer; callers apply that rule through `retrieve`.
export function rankEntries(question: string, opts: RetrieveOptions = {}): Scored[] {
  const lower = question.toLowerCase();
  const bareLength = opts.bareLength ?? question.length;
  const out: Scored[] = [];
  const corpus = opts.corpus ?? RULES_KNOWLEDGE;
  for (let i = 0; i < corpus.length; i++) {
    const entry = corpus[i];
    if (opts.exclude?.has(entry.id)) continue;
    const s = scoreOne(entry, question, lower, i, bareLength);
    if (s) out.push(s);
  }
  const present = new Set(out.map((s) => s.entry.id));
  const standing = out.filter((s) => !(s.entry.yields_to ?? []).some((id) => present.has(id)));
  return standing.sort(compareScored);
}

export function retrieve(question: string, opts: RetrieveOptions = {}): CanonicalRule | null {
  const best = rankEntries(question, opts)[0];
  if (!best || best.matchLength === 0) return null;
  return best.entry;
}
