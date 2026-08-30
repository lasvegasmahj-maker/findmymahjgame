import { RULES_KNOWLEDGE, type KnowledgeEntry, type RuleClassification } from "./knowledge";
import {
  needsClarification,
  resolveReply,
  topicClarification,
  toPayload,
  type ClarifyContext,
  type ClarifyPayload,
} from "./clarify";

// Deterministic rules retrieval. Order matters: the copyright guard runs before any
// retrieval so no phrasing can pull card content out of the knowledge base, then a
// question missing one fact gets a targeted clarification, then pattern matching. A
// question that matches nothing gets a topic clarification, never a guessed rule and
// never a bare refusal.

export type RulesLookupInput = { question: string; clarify?: ClarifyContext | null };

export type RulesLookupResult = {
  matched: boolean;
  entry_id?: string;
  answer?: string;
  ruleset: "american_nmjl";
  varies_by_house?: boolean;
  house_note?: string;
  confidence: "high" | "medium" | "low" | "unsupported";
  source: string;
  last_verified?: string;
  classification?: RuleClassification;
  evidence?: string;
  needs_clarification?: string;
  clarify?: ClarifyPayload;
  clarified_by?: string;
  unsupported_reason?: string;
};

const CARD_CONTENT_RES: RegExp[] = [
  /\b(hands?|lines?|categor(y|ies)|sections?|values?|points?)\b.{0,50}\bcards?\b/i,
  /\bcards?\b.{0,50}\b(hands?|lines?|categor(y|ies)|sections?|values?|points?)\b/i,
  /what('s| is) on (the|this year'?s?) card/i,
  /(read|list|tell|show|give|send) (me )?(the|this year'?s?) card/i,
  /\bcards?\b.{0,25}(pdf|copy|image|photo|scan|picture)/i,
  /(pdf|copy|image|photo|scan|picture).{0,25}\bcards?\b/i,
  /hands? (on|for|from) (this|the) year/i,
];

// Asking what the card's colors or letters mean is a legitimate rules question, not a
// request for the card's contents; it bypasses the guard unless the wording also asks
// for hands, values, or a copy.
const NOTATION_ASK =
  /\b(colou?rs?|notation|symbols?|letters?|abbreviations?|legend|mean|means|meaning|stand for|stands for|read (the|a|my) card|parenthes[ei]s)\b|\b[CX]\b/i;
const CONTENT_REQUEST =
  /\b(list|show|send|give|read|tell|type|copy|pdf|image|photo|scan|picture|screenshot|hands|line values?|values?|points?|categor(y|ies)|sections?)\b|\b(first|second|third|last|\d+(st|nd|rd|th)|20\d\d) (card )?hand\b|what('s| is) on/i;

const CARD_REFUSAL =
  "I cannot share the hands, categories, or line values from the annual card. The card is copyrighted material that the National Mah Jongg League sells, and buying the current card supports the League. Once you have your card, I am happy to explain how the general rules work.";

const EMPTY_ANSWER =
  "Ask me an American mahjong rules question, for example whether a joker can be used in a pair, and I will answer from our verified rules or ask you for the one detail I need.";

const SPELLFIX: Array<[RegExp, string | ((m: string) => string)]> = [
  [/\bcharlston\b|\bcharleton\b|\bcharelston\b|\bcharlseton\b|\bcharlestone\b|\bcharlestn\b/gi, "charleston"],
  [/\bjo(?:c|k)k?ers?\b|\bjokrs?\b/gi, (m: string) => (m.toLowerCase().endsWith("s") ? "jokers" : "joker")],
  [/\bmah[\s-]?jong+g?\b|\bmahjong+\b|\bmah[\s-]?jon\b|\bmajh?ong\b/gi, "mahjong"],
  [/\bdiscrad(s|ed|ing)?\b|\bdicard(s|ed|ing)?\b|\bdisacrd(s|ed|ing)?\b/gi, (m: string) => "discard" + (m.match(/(s|ed|ing)$/i)?.[0].toLowerCase() ?? "")],
  [/\bconce[ae]l+ed\b|\bconceled\b|\bconcieled\b/gi, "concealed"],
  [/\bexposer\b|\bexpsoure\b|\bexposuer\b/gi, "exposure"],
  [/\bcurtesy\b|\bcourtesey\b|\bcourtsey\b|\bcoutesy\b/gi, "courtesy"],
  [/\bdragan(s)?\b|\bdragoon(s)?\b/gi, (m: string) => (m.toLowerCase().endsWith("s") ? "dragons" : "dragon")],
  [/\bflowr(s)?\b|\bflowe(s)?\b|\bflwoer(s)?\b/gi, (m: string) => (m.toLowerCase().endsWith("s") ? "flowers" : "flower")],
  [/\bdeadhand\b/gi, "dead hand"],
  [/\bwallgame\b/gi, "wall game"],
  [/\bblindpass\b/gi, "blind pass"],
  [/\bblind pas\b/gi, "blind pass"],
  [/\bsextett?e?s?\b/gi, (m: string) => (m.toLowerCase().endsWith("s") ? "sextets" : "sextet")],
  [/\bquint(?:s|es)\b|\bquins\b/gi, "quints"],
];

export function spellfix(question: string): string {
  let out = question;
  for (const [re, rep] of SPELLFIX) {
    out = typeof rep === "string" ? out.replace(re, rep) : out.replace(re, rep);
  }
  return out;
}

// One normalization for every consumer (route, topic detection, retrieval), so
// they can never disagree about a question. Cap first so no regex runs over an
// unbounded body; bounded patterns cannot cross a newline; curly quotes must read
// as plain ones or the copyright guard misses a phone keyboard.
export function normalizeQuestion(raw: unknown, cap = 300): string {
  return String(raw || "")
    .slice(0, cap)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

type Best = { entry: KnowledgeEntry; specificity: number; score: number; matchLength: number };

function retrieve(question: string): KnowledgeEntry | null {
  const lower = question.toLowerCase();
  let best: Best | null = null;
  for (const entry of RULES_KNOWLEDGE) {
    if (entry.blocks?.some((b) => (typeof b === "function" ? b(question) : b.test(question)))) continue;
    if (entry.requires && !entry.requires.every((re) => re.test(question))) continue;
    const specificity = entry.requires?.length ?? 0;
    let score = 0;
    let matchLength = 0;
    for (const re of entry.question_patterns) {
      const m = question.match(re);
      if (m) {
        score += 2;
        matchLength += m[0].length;
      }
    }
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score === 0) continue;
    // Longer matched text breaks the last tie ("wall game" beats "wall").
    const better =
      !best ||
      specificity > best.specificity ||
      (specificity === best.specificity &&
        (score > best.score || (score === best.score && matchLength > best.matchLength)));
    if (better) best = { entry, specificity, score, matchLength };
  }
  if (!best || best.matchLength === 0) return null;
  return best.entry;
}

function entryResult(e: KnowledgeEntry, clarifiedBy?: string): RulesLookupResult {
  return {
    matched: true,
    entry_id: e.id,
    answer: e.approved_answer,
    ruleset: e.ruleset,
    varies_by_house: e.varies_by_house,
    ...(e.house_note ? { house_note: e.house_note } : {}),
    confidence: e.confidence,
    source: e.source,
    last_verified: e.last_verified,
    classification: e.classification,
    evidence: e.provenance.evidence,
    ...(clarifiedBy ? { clarified_by: clarifiedBy } : {}),
  };
}

function clarificationResult(payload: ClarifyPayload, reason?: string): RulesLookupResult {
  return {
    matched: false,
    ruleset: "american_nmjl",
    confidence: "low",
    source: "none",
    needs_clarification: payload.prompt,
    clarify: payload,
    ...(reason ? { unsupported_reason: reason } : {}),
  };
}

function handleReply(ctx: ClarifyContext, reply: string): RulesLookupResult {
  const original = normalizeQuestion(ctx.question);
  const resolved = resolveReply({ id: ctx.id, question: spellfix(original) }, reply);
  if (!resolved) return lookupRule({ question: reply });
  if ("option" in resolved) {
    const { option } = resolved;
    if (option.entry) {
      const e = RULES_KNOWLEDGE.find((k) => k.id === option.entry);
      if (e) return entryResult(e, ctx.id);
    }
    if (option.rewrite) {
      const rewritten = option.rewrite(spellfix(original));
      const r = lookupRule({ question: rewritten });
      return r.matched ? { ...r, clarified_by: ctx.id } : r;
    }
    if (option.answer) {
      return {
        matched: false,
        ruleset: "american_nmjl",
        confidence: "low",
        source: "policy",
        answer: option.answer,
        unsupported_reason: ctx.id === "topic" ? "rules_gap" : "variant_scope",
        clarified_by: ctx.id,
      };
    }
  }
  const fixed = spellfix(normalizeQuestion(reply));
  if (retrieve(fixed) && (fixed.length >= 20 || /\?$|^(what|how|when|can|could|may|is|are|do|does|why|which)\b/i.test(fixed))) {
    return lookupRule({ question: reply });
  }
  const c = resolved.clarification;
  const again = needsClarification(spellfix(original), () => true);
  const prompt = c.prompt || (again?.id === c.id ? again.prompt : "") || "Did you mean American mahjong?";
  const choices =
    c.options.length <= 2 ? `You can answer with ${c.options.map((o) => `"${o.label}"`).join(" or ")}.` : "Pick one of the choices below, or type it.";
  const payload = toPayload(c, original);
  return clarificationResult({ ...payload, prompt: `${prompt} ${choices}` });
}

export function lookupRule(input: RulesLookupInput): RulesLookupResult {
  const question = normalizeQuestion(input?.question);
  if (input?.clarify && typeof input.clarify.id === "string" && typeof input.clarify.question === "string" && question) {
    return handleReply(input.clarify, question);
  }
  if (!question) {
    return { matched: false, ruleset: "american_nmjl", confidence: "low", source: "none", answer: EMPTY_ANSWER, unsupported_reason: "empty" };
  }

  const fixed = spellfix(question);
  const notationAsk = NOTATION_ASK.test(fixed) && !CONTENT_REQUEST.test(fixed);
  if (!notationAsk) {
    for (const re of CARD_CONTENT_RES) {
      if (re.test(fixed)) {
        return {
          matched: false,
          ruleset: "american_nmjl",
          confidence: "unsupported",
          unsupported_reason: "annual_card_content",
          source: "policy",
          answer: CARD_REFUSAL,
        };
      }
    }
  }

  const clarification = needsClarification(fixed, (q) => retrieve(q) !== null);
  if (clarification) return clarificationResult(toPayload(clarification, question));

  const entry = retrieve(fixed);
  if (entry) return entryResult(entry);

  return clarificationResult(toPayload(topicClarification(fixed), question), "no_entry");
}

// Synthesis guard: a model may only rephrase approved text, so any digit in its output
// must already exist in the approved input. A new digit means new rule content, and the
// caller ships the approved text verbatim instead.
export function synthesisDigitGuard(input: string, output: string): boolean {
  // Whole number tokens, not digit characters: "152" and "16" in the input must not license
  // an invented "12" or "56" in the output.
  const allowed = new Set(input.match(/\d+/g) ?? []);
  for (const n of output.match(/\d+/g) ?? []) {
    if (!allowed.has(n)) return false;
  }
  return true;
}

// Gap telemetry summary: topic only, never a transcript. Emails then digits are stripped
// before anything is stored, so no contact info or ZIP can leak into the operator queue.
export function summarizeRulesGap(question: string): string {
  return String(question || "")
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "")
    .replace(/\d+/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}
