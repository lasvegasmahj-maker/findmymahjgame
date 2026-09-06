// One normalization for every consumer (route, topic detection, retrieval), so they can
// never disagree about a question. Cap first so no regex runs over an unbounded body;
// bounded patterns cannot cross a newline; curly quotes must read as plain ones or the
// copyright guard misses a phone keyboard.
//
// Spelling repair preserves inflection: every concept matcher in the corpus is written
// against natural English ("passed", "discarding", "jokers"), so a misspelling is mapped to
// the correctly spelled form of the same word, never to a stem. The list joins Find My Mahj's
// spellfix with the typo families Las Vegas Mahjong's normalizer handled.

export const MAX_QUESTION_CHARS = 300;

export function normalizeQuestion(raw: unknown, cap = MAX_QUESTION_CHARS): string {
  return String(raw || "")
    .slice(0, cap)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

type Fix = [RegExp, string | ((m: string) => string)];

const plural = (singular: string, pluralForm: string) => (m: string) => (/s$/i.test(m) ? pluralForm : singular);

const SPELLFIX: Fix[] = [
  // Find My Mahj spellfix, unchanged.
  [/\bcharlston\b|\bcharleton\b|\bcharelston\b|\bcharlseton\b|\bcharlestone\b|\bcharlestn\b/gi, "charleston"],
  [/\bjo(?:c|k)k?ers?\b|\bjokrs?\b/gi, plural("joker", "jokers")],
  [/\bmah[\s-]?jong+g?\b|\bmahjong+\b|\bmah[\s-]?jon\b|\bmajh?ong\b/gi, "mahjong"],
  [/\bdiscrad(s|ed|ing)?\b|\bdicard(s|ed|ing)?\b|\bdisacrd(s|ed|ing)?\b/gi, (m: string) => "discard" + (m.match(/(s|ed|ing)$/i)?.[0].toLowerCase() ?? "")],
  [/\bconce[ae]l+ed\b|\bconceled\b|\bconcieled\b/gi, "concealed"],
  [/\bexposer\b|\bexpsoure\b|\bexposuer\b/gi, "exposure"],
  [/\bcurtesy\b|\bcourtesey\b|\bcourtsey\b|\bcoutesy\b/gi, "courtesy"],
  [/\bdragan(s)?\b|\bdragoon(s)?\b/gi, plural("dragon", "dragons")],
  [/\bflowr(s)?\b|\bflowe(s)?\b|\bflwoer(s)?\b/gi, plural("flower", "flowers")],
  [/\bdeadhand\b/gi, "dead hand"],
  [/\bwallgame\b/gi, "wall game"],
  [/\bblindpass\b/gi, "blind pass"],
  [/\bblind pas\b/gi, "blind pass"],
  [/\bsextett?e?s?\b/gi, plural("sextet", "sextets")],
  [/\bquint(?:s|es)\b|\bquins\b/gi, "quints"],
  // Typo families from Las Vegas Mahjong's normalizer, mapped to correct spellings.
  [/\bjoc?k+e?r+(s)?\b/gi, plural("joker", "jokers")],
  [/\bchar+l?[eai]?s+t[oa]n+e?s?\b(?!town)/gi, "charleston"],
  // Texting shorthand players type on a phone.
  [/\bu\b/gi, "you"],
  [/\br\b/gi, "are"],
  [/\bur\b/gi, "your"],
  [/\bpls\b|\bplz\b/gi, "please"],
  [/\bw\/ ?/g, "with "],
  [/\bma[hj]+ong+g?\b|\bmajong\b|\bmahjhong\b/gi, "mahjong"],
  [/\bmahj\b|\bmaj\b/gi, "mahjong"],
  [/\bkung\b|\bkongg\b/gi, "kong"],
  [/\bpong(s)?\b|\bpoong\b/gi, plural("pung", "pungs")],
  [/\bquintet(s)?\b/gi, plural("quint", "quints")],
  [/\bn\.\s?e\.\s?w\.\s?s\.?/gi, "NEWS"],
  [/\bcharacters?\b/gi, (m: string) => (/s$/i.test(m) ? "craks" : "crak")],
  [/\bbamboos?\b/gi, (m: string) => (/s$/i.test(m) ? "bams" : "bam")],
  [/\bpare\b|\bpear\b|\bpaire\b|\bpayr\b/gi, "pair"],
  [/\bpayrs\b|\bpares\b/gi, "pairs"],
  [/\bexposeure\b|\bexpousre\b/gi, "exposure"],
  [/\btiels?\b|\btilse\b/gi, plural("tile", "tiles")],
  [/\bwhite dragon(s)?\b/gi, (m: string) => (/s$/i.test(m) ? "white dragons soap" : "white dragon soap")],
];

export function spellfix(question: string): string {
  let out = question;
  for (const [re, rep] of SPELLFIX) {
    out = typeof rep === "string" ? out.replace(re, rep) : out.replace(re, rep);
  }
  // Repeated fixes may leave doubled spaces; the matchers assume single spacing.
  return out.replace(/\s{2,}/g, " ").trim();
}

// Both steps, in the order every consumer applies them.
export function prepare(raw: unknown, cap = MAX_QUESTION_CHARS): string {
  return spellfix(normalizeQuestion(raw, cap));
}

export function mentionedYear(raw: string): number | null {
  const m = String(raw || "").match(/\b((?:19|20)\d{2})\b/);
  return m ? Number(m[1]) : null;
}

// Gap telemetry summary: topic only, never a transcript. Emails then digits are stripped
// before anything is stored or logged, so no contact info or ZIP can leak into an operator queue.
export function summarizeForEscalation(question: string): string {
  return String(question || "")
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "")
    .replace(/\d+/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}
