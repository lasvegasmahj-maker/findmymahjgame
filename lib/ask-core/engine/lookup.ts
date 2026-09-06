// The deterministic core of Ask on both sites. Every path here works with no model at all;
// the model layer (../model/compose.ts) may only frame what this file retrieves.
//
// Order of guards matters: card content is refused before any retrieval so no phrasing can
// pull hand listings out of the corpus; a question missing one deciding fact gets a targeted
// clarification; an unmatched rules question gets a topic clarification and, if the player
// confirms nothing fits, the honest gap answer plus an escalation to the owner. Never a
// guessed rule and never a bare "cannot verify".

import { RULES_KNOWLEDGE, entryById, isPending, resolveId } from "../corpus/entries.ts";
import type { CanonicalRule, Category } from "../corpus/types.ts";
import {
  answersOption,
  isExactOption,
  needsClarification,
  optionEntryId,
  resolveReply,
  topicClarification,
  toPayload,
  type ClarifyContext,
  type ClarifyPayload,
} from "./clarify.ts";
import {
  CANCELLED,
  CARD_REFUSAL,
  CARD_REFUSAL_FOLLOWUPS,
  ELLIPTICAL_RE,
  EMPTY_ANSWER,
  SMALL_TALK,
  cancelPhrase,
  isCardContentRequest,
  isSmallTalk,
  isWhyFollowup,
  splitQuestions,
  yearNoteFor,
} from "./guards.ts";
import type { AskLabel } from "./labels.ts";
import { normalizeQuestion, prepare, spellfix, summarizeForEscalation } from "./normalize.ts";
import { compareScored, rankEntries, retrieve, type RetrieveOptions } from "./retrieve.ts";
import { ACCIDENT_SCENE, AMERICAN_RE, VARIANT_RE } from "../corpus/matchers.ts";

export type Turn = {
  role: "user" | "assistant";
  content: string;
  entry_id?: string;
  nudge_key?: string;
};

export type LookupKind =
  | "answer" // a canonical entry (possibly two, for a two-part question)
  | "cancelled" // the player dropped the pending question ("never mind")
  | "clarify" // a targeted clarification with options
  | "card_refusal"
  | "variant_scope" // the player confirmed another mahjong style
  | "gap" // the player confirmed no topic fits: honest gap answer, escalated to the owner
  | "smalltalk"
  | "empty";

export type LookupResult = {
  kind: LookupKind;
  answer: string;
  label: AskLabel;
  entry?: CanonicalRule;
  // A second entry appended whole for a two-part question (same label class, neither verbatim-only).
  secondary?: CanonicalRule;
  // Ranked candidates for the model layer, the engine's pick first.
  candidates: CanonicalRule[];
  followups: string[];
  clarify?: ClarifyPayload;
  clarified_by?: string;
  unsupported_reason?: string;
  year_note?: string;
  elliptical: boolean;
  // The engine's pick is one the player reached through the follow-up context, not their own
  // words; the model layer may then treat "not covered" as a real outcome.
  catch_all_only: boolean;
  // Scrubbed topic summary when a rules question reached no entry; the site records it for
  // the owner's rule escalation queue.
  escalation?: { summary: string; reason: string };
};

export type LookupOptions = RetrieveOptions;

export type LookupInput = {
  question: string;
  history?: Turn[];
  clarify?: ClarifyContext | null;
};

const CATEGORY_CONTEXT: Record<Category, string> = {
  jokers: "joker",
  charleston: "charleston",
  calling: "call discard",
  winning: "win mahjong",
  scoring: "pay",
  "dead-hands": "dead hand",
  card: "card",
  tiles: "tile",
  etiquette: "",
  basics: "",
  tournament: "tournament",
  strategy: "",
};

export function approvedText(e: CanonicalRule): string {
  return e.house_note ? `${e.answer} ${e.house_note}` : e.answer;
}

export function labelFor(e: CanonicalRule): AskLabel {
  if (isPending(e)) return "pending";
  if (e.classification === "tournament_rule") return "tournament";
  if (e.classification === "strategy") return "strategy";
  if (e.classification === "etiquette") return "etiquette";
  if (e.varies_by_house || e.classification === "house_optional_rule") return "house";
  return "standard";
}

// Entries the model may never frame, combine, or swap: anything the owner has not signed off,
// and anything about money, where the deliberate wording is the whole point.
export function mustServeVerbatim(e: CanonicalRule): boolean {
  return isPending(e) || (e.tags?.includes("money") ?? false);
}

export function lastAnsweredEntry(history: Turn[], exclude?: ReadonlySet<string>): CanonicalRule | undefined {
  for (let i = history.length - 1; i >= 0; i--) {
    const t = history[i];
    if (t.role === "assistant" && t.entry_id) {
      const e = entryById(t.entry_id);
      if (e && !exclude?.has(e.id)) return e;
    }
  }
  return undefined;
}

export function askedEntryIds(history: Turn[]): Set<string> {
  const ids = new Set<string>();
  for (const t of history) if (t.role === "assistant" && t.entry_id) ids.add(resolveId(t.entry_id));
  return ids;
}

// A question that is one of an entry's own canonical questions (a starter or follow-up chip)
// is answered verbatim from that entry with no model call.
export function canonicalEntryFor(raw: string): CanonicalRule | undefined {
  const key = normalizeQuestion(raw).toLowerCase();
  if (!key) return undefined;
  return RULES_KNOWLEDGE.find((e) => e.questions.some((q) => q.toLowerCase() === key));
}

export function buildFollowups(entry: CanonicalRule, asked: Set<string>, max = 3, opts: LookupOptions = {}): string[] {
  const picked: string[] = [];
  const seen = new Set<string>([entry.id, ...asked]);
  const push = (e: CanonicalRule | undefined) => {
    if (!e || seen.has(e.id) || picked.length >= max || opts.exclude?.has(e.id)) return;
    seen.add(e.id);
    picked.push(e.questions[0]);
  };
  for (const id of entry.related) push(entryById(id));
  if (picked.length < max) {
    for (const e of RULES_KNOWLEDGE) {
      if (picked.length >= max) break;
      if (e.category === entry.category) push(e);
    }
  }
  return picked;
}

function base(kind: LookupKind, answer: string, label: AskLabel, extra: Partial<LookupResult> = {}): LookupResult {
  return { kind, answer, label, candidates: [], followups: [], elliptical: false, catch_all_only: false, ...extra };
}

function entryResult(e: CanonicalRule, ctx: { history: Turn[]; opts: LookupOptions; raw: string; elliptical?: boolean; catchAllOnly?: boolean; candidates?: CanonicalRule[]; clarifiedBy?: string }): LookupResult {
  return {
    kind: "answer",
    answer: approvedText(e),
    label: labelFor(e),
    entry: e,
    candidates: ctx.candidates?.length ? ctx.candidates : [e],
    followups: buildFollowups(e, askedEntryIds(ctx.history), 3, ctx.opts),
    year_note: yearNoteFor(ctx.raw),
    elliptical: ctx.elliptical ?? false,
    catch_all_only: ctx.catchAllOnly ?? false,
    ...(ctx.clarifiedBy ? { clarified_by: ctx.clarifiedBy } : {}),
  };
}

function clarificationResult(payload: ClarifyPayload, reason?: string, escalation?: LookupResult["escalation"]): LookupResult {
  return base("clarify", payload.prompt, "clarify", {
    clarify: payload,
    ...(reason ? { unsupported_reason: reason } : {}),
    ...(escalation ? { escalation } : {}),
  });
}

// Deterministic retrieval with the follow-up context Las Vegas Mahjong's engine had: a short
// or elliptical follow-up ("what about a kong?") is retried with the previous topic's context
// term appended, and a strong direct hit on a new topic always wins over context carry-over.
function retrieveWithContext(fixed: string, history: Turn[], opts: LookupOptions): { entry: CanonicalRule | null; candidates: CanonicalRule[]; elliptical: boolean; catchAllOnly: boolean } {
  const plainRanked = rankEntries(fixed, opts);
  const plain = plainRanked[0] && plainRanked[0].matchLength > 0 ? plainRanked[0].entry : null;
  const candidates = plainRanked.slice(0, 4).map((s) => s.entry);
  const last = lastAnsweredEntry(history, opts.exclude);
  const wordCount = fixed.split(" ").filter(Boolean).length;
  const elliptical = Boolean(last) && (ELLIPTICAL_RE.test(fixed) || wordCount <= 5);
  if (!elliptical || !last) return { entry: plain, candidates, elliptical: false, catchAllOnly: false };

  const strongSwitch = plain && plain.id !== last.id && !ELLIPTICAL_RE.test(fixed);
  if (strongSwitch) return { entry: plain, candidates, elliptical: false, catchAllOnly: false };

  const term = CATEGORY_CONTEXT[last.category];
  if (!term) return { entry: plain, candidates, elliptical: true, catchAllOnly: false };
  const effective = `${fixed} ${term}`;
  // "What about a kong?" after a joker rule is the same topic: kong is a word that rule's own
  // answer uses, so the context term completes the concept the player left out. "What about the
  // charleston?" names a word the previous answer never uses, and is a real topic switch. Only
  // in the first case may an entry win on the context term alone, and only from that category.
  if (continuesTopic(fixed, last)) {
    const sameTopic = rankEntries(effective, opts).filter((s) => s.entry.category === last.category);
    if (sameTopic.length) {
      const top = sameTopic[0].entry;
      const merged = [top, ...sameTopic.slice(1, 3).map((s) => s.entry), ...candidates].filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i).slice(0, 4);
      return { entry: top, candidates: merged, elliptical: true, catchAllOnly: !plain };
    }
  }
  const contextual = rankEntries(effective, { ...opts, bareLength: fixed.length })
    .filter((s) => s.entry.id !== last.id || plainRanked.length === 0)
    .sort(
      (a, b) =>
        b.specificity - a.specificity ||
        Number(b.entry.category === last.category) - Number(a.entry.category === last.category) ||
        compareScored(a, b),
    );
  const top = contextual[0]?.entry ?? null;
  if (top) {
    const merged = [top, ...contextual.slice(1, 4).map((s) => s.entry), ...candidates].filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i).slice(0, 4);
    // Reached through the context term rather than the player's own words.
    const catchAllOnly = !plain;
    return { entry: top, candidates: merged, elliptical: true, catchAllOnly };
  }
  return { entry: plain, candidates, elliptical: true, catchAllOnly: false };
}

// Words the previous answer itself uses, minus the ones every answer uses. A follow-up built
// from them continues that topic rather than starting a new one.
const TOPIC_STOPWORD =
  /^(the|a|an|and|or|of|to|in|on|at|is|are|was|were|be|it|its|that|this|those|these|for|with|from|by|as|you|your|i|my|we|our|they|their|she|he|her|his|not|no|yes|can|may|do|does|did|so|if|when|what|which|who|how|why|any|all|one|two|only|but|than|then|there|here|about|after|before|up|down|out|off|over|under|more|most|less|other|same|own|just|also|still|even|never|always|every|each|both|until|while|because|what's|whats|hand|hands|tile|tiles|card|cards|player|players|play|game|games|turn|turns|discard|discards|rule|rules|table|tables|mahjong|maj)$/i;

export function continuesTopic(question: string, last: CanonicalRule): boolean {
  const vocab = new Set(
    [last.topic, last.answer, last.house_note ?? "", ...last.questions, ...last.keywords]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z']+/)
      .filter(Boolean),
  );
  return question
    .toLowerCase()
    .split(/[^a-z']+/)
    .some((w) => w.length > 2 && !TOPIC_STOPWORD.test(w) && vocab.has(w));
}

function handleReply(ctx: ClarifyContext, reply: string, history: Turn[], opts: LookupOptions): LookupResult {
  const original = normalizeQuestion(ctx.question);
  const resolved = resolveReply({ id: ctx.id, question: spellfix(original) }, reply, opts.exclude);
  if (!resolved) return lookup({ question: reply, history }, opts);
  if ("option" in resolved) {
    const { option } = resolved;
    const entryId = optionEntryId(option);
    if (entryId && !opts.exclude?.has(entryId)) {
      const e = entryById(entryId);
      if (e) return entryResult(e, { history, opts, raw: original, clarifiedBy: ctx.id });
    }
    if (option.rewrite) {
      const rewritten = option.rewrite(spellfix(original));
      const r = lookup({ question: rewritten, history }, opts);
      return r.kind === "answer" ? { ...r, clarified_by: ctx.id } : r;
    }
    if (option.answer) {
      if (ctx.id === "topic") {
        return base("gap", option.answer, "unverified", {
          unsupported_reason: "rules_gap",
          clarified_by: ctx.id,
          escalation: { summary: summarizeForEscalation(original), reason: "no_entry_confirmed" },
        });
      }
      return base("variant_scope", option.answer, "unverified", { unsupported_reason: "variant_scope", clarified_by: ctx.id });
    }
  }
  const fixed = prepare(reply);
  if (retrieve(fixed, opts) && (fixed.length >= 20 || /\?$|^(what|how|when|can|could|may|is|are|do|does|why|which)\b/i.test(fixed))) {
    return lookup({ question: reply, history }, opts);
  }
  const c = resolved.clarification;
  const again = needsClarification(spellfix(original), () => true);
  const prompt = c.prompt || (again?.id === c.id ? again.prompt : "") || "Did you mean American mahjong?";
  const choices =
    c.options.length <= 2 ? `You can answer with ${c.options.map((o) => `"${o.label}"`).join(" or ")}.` : "Pick one of the choices below, or type it.";
  const payload = toPayload(c, original);
  return clarificationResult({ ...payload, prompt: `${prompt} ${choices}` });
}

// Two questions in one message: when both parts resolve to distinct entries that share a label
// class and neither must be served verbatim, both approved texts are served, the second
// introduced by its own canonical question. Otherwise the first part's answer stands alone.
function twoPart(question: string, first: LookupResult, history: Turn[], opts: LookupOptions): LookupResult {
  if (first.kind !== "answer" || !first.entry || mustServeVerbatim(first.entry)) return first;
  const parts = splitQuestions(question);
  if (parts.length < 2) return first;
  for (const part of parts.slice(1)) {
    const fixed = prepare(part);
    const e = retrieve(fixed, opts);
    if (!e || e.id === first.entry.id || mustServeVerbatim(e) || labelFor(e) !== labelFor(first.entry)) continue;
    return {
      ...first,
      answer: `${approvedText(first.entry)} ${e.questions[0]} ${approvedText(e)}`,
      secondary: e,
      candidates: [first.entry, e, ...first.candidates.filter((c) => c.id !== first.entry!.id && c.id !== e.id)].slice(0, 6),
    };
  }
  return first;
}

export function lookup(input: LookupInput, opts: LookupOptions = {}): LookupResult {
  const history = input.history ?? [];
  let question = normalizeQuestion(input.question);
  const cancel = cancelPhrase(question);
  if (cancel.cancelled) {
    if (!cancel.remainder) return base("cancelled", CANCELLED, "chat");
    // "never mind, can I pass a joker?": the pending clarification is dropped and the rest is
    // a fresh question.
    question = cancel.remainder;
    return lookup({ question, history }, opts);
  }
  if (input.clarify && typeof input.clarify.id === "string" && typeof input.clarify.question === "string" && question) {
    return handleReply(input.clarify, question, history, opts);
  }
  if (!question) return base("empty", EMPTY_ANSWER, "unverified", { unsupported_reason: "empty" });
  if (isSmallTalk(question)) return base("smalltalk", SMALL_TALK, "chat");

  const fixed = spellfix(question);
  // "does hong kong style use a card like ours": the style question comes first, so a player
  // asking about another game is never met with the card refusal.
  if (VARIANT_RE.test(fixed) && !AMERICAN_RE.test(fixed)) {
    const styleAsk = needsClarification(fixed, (q) => retrieve(q, opts) !== null);
    if (styleAsk?.id === "ruleset") return clarificationResult(toPayload(styleAsk, question));
  }
  if (isCardContentRequest(fixed)) {
    return base("card_refusal", CARD_REFUSAL, "card", { unsupported_reason: "annual_card_content", followups: CARD_REFUSAL_FOLLOWUPS });
  }

  const last = lastAnsweredEntry(history, opts.exclude);
  if (last && isWhyFollowup(fixed)) {
    return entryResult(last, { history, opts, raw: question, elliptical: true });
  }

  const clarification = needsClarification(fixed, (q) => retrieve(q, opts) !== null);
  if (clarification) return clarificationResult(toPayload(clarification, question));

  const found = retrieveWithContext(fixed, history, opts);
  // An accident at the table (a tile knocked off during the deal, a spilled wall) has no entry.
  // An entry reached on a noun alone must not answer it; the player picks the topic instead.
  if (found.entry && !found.entry.requires?.length && ACCIDENT_SCENE.test(fixed)) {
    return clarificationResult(toPayload(topicClarification(fixed, opts.exclude), question), "no_entry", { summary: summarizeForEscalation(question), reason: "no_entry" });
  }
  if (found.entry) {
    const r = entryResult(found.entry, { history, opts, raw: question, elliptical: found.elliptical, catchAllOnly: found.catchAllOnly, candidates: found.candidates });
    return twoPart(question, r, history, opts);
  }

  // No entry fits. Offer the closest topics and record the scrubbed topic for the owner now,
  // so the operator queue is a demand signal even when the player then picks a topic.
  return clarificationResult(toPayload(topicClarification(fixed, opts.exclude), question), "no_entry", {
    summary: summarizeForEscalation(question),
    reason: "no_entry",
  });
}

// Whether a typed reply mid-clarification should stay a reply (a clicked label or a short
// answer to an option) rather than be treated as a new question. Sites use this together with
// their own "looks like a search" test so a player who changes their mind is not trapped.
export function replyStaysReply(ctx: ClarifyContext, reply: string, strongSwitch: (q: string) => boolean, exclude?: ReadonlySet<string>): boolean {
  const spelled = { id: ctx.id, question: spellfix(normalizeQuestion(ctx.question)) };
  const q = normalizeQuestion(reply);
  return isExactOption(spelled, q, exclude) || (answersOption(spelled, q, exclude) && !strongSwitch(q));
}

export { isExactOption, answersOption } from "./clarify.ts";
