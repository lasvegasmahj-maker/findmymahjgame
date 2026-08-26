import { RULES_KNOWLEDGE, type KnowledgeEntry } from "./knowledge";

// Deterministic rules retrieval. Order matters: the copyright guard runs before any
// retrieval so no phrasing can pull card content out of the knowledge base, then variant
// questions get a clarification instead of an American answer, then pattern matching.
// An unmatched question returns an honest "cannot verify", never a guessed rule.

export type RulesLookupInput = { question: string };

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
  needs_clarification?: string;
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

const VARIANT_RE =
  /\b(riichi|japanese|chinese|hong ?kong|cantonese|sichuan|taiwanese|korean|filipino|singapor(e|ean)|mcr|zung ?jung)\b/i;
const AMERICAN_RE = /\b(american|nmjl|national mah ?jongg league)\b/i;

const CARD_REFUSAL =
  "I cannot share the hands, categories, or line values from the annual card. The card is copyrighted material that the National Mah Jongg League sells, and buying the current card supports the League. Once you have your card, I am happy to explain how the general rules work.";

const CANNOT_VERIFY =
  "I cannot verify that rule from my approved American mahjong knowledge, so I will not guess. Ask your table or check the official National Mah Jongg League rules, and we will work on adding a verified answer.";

export function lookupRule(input: RulesLookupInput): RulesLookupResult {
  // Cap first so no regex runs over an unbounded body, then normalize: bounded
  // patterns cannot cross a newline, and curly quotes must read as plain ones.
  const question = String(input?.question || "")
    .slice(0, 300)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (!question) {
    return { matched: false, ruleset: "american_nmjl", confidence: "low", source: "none", answer: CANNOT_VERIFY };
  }

  for (const re of CARD_CONTENT_RES) {
    if (re.test(question)) {
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

  if (VARIANT_RE.test(question) && !AMERICAN_RE.test(question)) {
    const variant = question.match(VARIANT_RE)?.[0] ?? "another variant";
    return {
      matched: false,
      ruleset: "american_nmjl",
      confidence: "low",
      source: "none",
      needs_clarification: `That sounds like it may be about ${variant} style mahjong. I can only verify American mahjong rules, the National Mah Jongg League style. Did you mean American mahjong?`,
    };
  }

  const lower = question.toLowerCase();
  // Precedence is structural. An entry that requires more concepts is more
  // specific, and specificity ranks ahead of the keyword score, so a narrow
  // answer beats a broad one whenever both match, in any phrasing.
  let best: { entry: KnowledgeEntry; specificity: number; score: number; matchLength: number } | null = null;
  for (const entry of RULES_KNOWLEDGE) {
    if (entry.blocks?.some((re) => re.test(question))) continue;
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

  if (!best || best.matchLength === 0) {
    return { matched: false, ruleset: "american_nmjl", confidence: "low", source: "none", answer: CANNOT_VERIFY };
  }

  const e = best.entry;
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
  };
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
