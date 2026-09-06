// One normalization for every consumer (route, topic detection, retrieval), so they can
// never disagree about a question. Cap first so no regex runs over an unbounded body;
// bounded patterns cannot cross a newline; curly quotes must read as plain ones or the
// copyright guard misses a phone keyboard.
//
// Spelling repair preserves inflection: every concept matcher in the corpus is written
// against natural English ("passed", "discarding", "jokers"), so a misspelling is mapped to
// the correctly spelled form of the same word, never to a stem. The list joins Find My Mahj's
// spellfix with the typo families Las Vegas Mahjong's normalizer handled.

import { RULES_KNOWLEDGE } from "../corpus/entries.ts";

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
  // "c a r d h a n d s" and "2 0 2 6": letters or a year typed with spaces between them.
  [/\b(?:[a-z] ){2,}[a-z]\b/gi, (m: string) => m.replace(/ /g, "")],
  [/\b(\d) (\d) (\d) (\d)\b/g, "$1$2$3$4"],
  // The collapse above glues "c a r d h a n d s" into one word; the card guard reads two.
  [/\bcardhands?\b/gi, "card hands"],
  [/\bwats\b/gi, "what's"],
  [/\bwhats\b/gi, "what's"],
  [/\bwat\b/gi, "what"],
  [/\bwen\b/gi, "when"],
  [/\bhav\b/gi, "have"],
  [/\bppl\b/gi, "people"],
  [/\brite\b/gi, "right"],
  [/\bdiff\b/gi, "different"],
  [/\bthru\b/gi, "through"],
  [/\bwanna\b/gi, "want to"],
  [/\bgonna\b/gi, "going to"],
  [/\bcuz\b/gi, "because"],
  [/\bw\/o\b/gi, "without"],
  [/\bb4\b/gi, "before"],
  [/\btourneys\b/gi, "tournaments"],
  [/\btourney\b/gi, "tournament"],
  [/\bconsec\b/gi, "consecutive"],
  [/\bjoker(swap|exchange|trade)s?\b/gi, "joker $1"],
  [/\b2 (late|early|many|few|soon|slow|fast)\b/gi, "too $1"],
  [/\b2 (?=(yell|call|pass|win|do|go|get|make|be|play|say|see|take|use|break|expose|pick|draw|declare|redeem|swap|exchange|discard|keep|hold|wait|look|know|tell|read|learn|find|join|start|finish)\b)/gi, "to "],
  [/\bnext 2\b/gi, "next to"],
  [/\b4 (?=(the|a|an|my|your|her|his|their|it|mahjong|mahj|maj|jokers?|grabs|that|this|those|these|me|us|them|free|real|money|points?|pay|paying|winning|now|sure)\b)/gi, "for "],
  [/\$\$+/g, " money "],
  [/\b([a-z]+) n ([a-z]+)\b/g, "$1 and $2"],
  [/\bdont\b/gi, "don't"],
  [/\bcant\b/gi, "can't"],
  [/\bwont\b/gi, "won't"],
  [/\bdoesnt\b/gi, "doesn't"],
  [/\bisnt\b/gi, "isn't"],
  [/\bdidnt\b/gi, "didn't"],
  [/\bwasnt\b/gi, "wasn't"],
  [/\bim\b/g, "I'm"],
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

// Gap telemetry summary: topic only, never a transcript. Only words the corpus itself uses (its
// questions, topics, keywords, answers and house notes) survive, so a personal name, a street, a
// URL, a social handle, a spelled-out phone number or an obfuscated email can never reach an
// operator queue or a log line; emails and digits are stripped first as well. What remains is
// the mahjong vocabulary of the question, enough to tell the owner which rule is missing.
let corpusVocabulary: Set<string> | null = null;
function vocabulary(): Set<string> {
  if (corpusVocabulary) return corpusVocabulary;
  const words = new Set<string>();
  for (const e of RULES_KNOWLEDGE) {
    for (const text of [e.topic, e.answer, e.house_note ?? "", ...e.questions, ...e.keywords]) {
      for (const w of text.toLowerCase().split(/[^a-z']+/)) if (w) words.add(w.replace(/^'+|'+$/g, ""));
    }
  }
  corpusVocabulary = words;
  return words;
}

// Number words the corpus uses ("three of a kind", "pass 3 tiles"). Three or more in a row is
// a spelled-out phone number or address, never a rule question, so such a run is dropped.
const NUMBER_WORD = /^(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|hundred|thousand)$/;

// A word capitalized in the middle of a sentence is a name, a venue, or a place. The corpus
// vocabulary alone cannot tell "May Fine" or "Green Table" from ordinary words, so casing is
// used as a second filter. A message typed in all caps carries no such signal and keeps none.
function midSentenceCapitals(raw: string): Set<string> {
  const out = new Set<string>();
  const sentences = raw.split(/(?<=[.?!])\s+|\n+/);
  let upper = 0;
  let alpha = 0;
  for (const w of raw.split(/\s+/)) {
    if (!/[a-z]/i.test(w)) continue;
    alpha++;
    if (w === w.toUpperCase()) upper++;
  }
  if (alpha > 0 && upper / alpha > 0.6) return out;
  for (const s of sentences) {
    const tokens = s.trim().split(/\s+/).filter(Boolean);
    for (let i = 1; i < tokens.length; i++) {
      const bare = tokens[i].replace(/[^A-Za-z']/g, "");
      if (bare.length > 1 && /^[A-Z][a-z]/.test(bare)) out.add(bare.toLowerCase());
    }
  }
  return out;
}

export function summarizeForEscalation(question: string): string {
  const vocab = vocabulary();
  const named = midSentenceCapitals(String(question || ""));
  const words = String(question || "")
    // An introduction is never part of the rule question.
    .replace(/\b(my name is|this is|i am|i'm|im|i asked|asked|per|according to)\b(\s+\w+){0,3}/gi, " ")
    // "the Green Table club", "our Sun City Anthem group": the words in front of a venue noun.
    .replace(/\b(\w+\s+){1,3}(club|group|league|studio|centre|center|hall|lounge|room)\b/gi, " ")
    // Emails, obfuscated emails ("jane at gmail dot com"), links, handles, and digits go first.
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, " ")
    .replace(/\b[\w.+-]+\s+at\s+[\w-]+\s+dot\s+[a-z]{2,}\b/gi, " ")
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+|\b[\w-]+\.(com|net|org|io|co|gov|edu)\b\S*/gi, " ")
    .replace(/@[\w.]+/g, " ")
    .replace(/\d+/g, " ")
    .toLowerCase()
    .split(/[^a-z']+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter((w) => w && vocab.has(w) && !named.has(w));
  const kept: string[] = [];
  for (let i = 0; i < words.length; i++) {
    let run = 0;
    while (i + run < words.length && NUMBER_WORD.test(words[i + run])) run++;
    if (run >= 3) {
      i += run - 1;
      continue;
    }
    kept.push(words[i]);
  }
  return kept.join(" ").slice(0, 120).trim();
}
