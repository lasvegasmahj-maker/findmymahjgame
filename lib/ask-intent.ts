import { blindReadsAsPlace, BLIND_PASS } from "@/lib/rules/knowledge";
import { normalizeQuestion } from "@/lib/rules/lookup";
import { DAY_NAMES, type DayName, type TimeOfDay } from "@/lib/schedule";
import { RADIUS_OPTIONS, type RadiusMiles } from "@/lib/geo";

// Deterministic intent extraction for Ask Find My Mahj. This is the primary parser, not a
// fallback: every factual filter must be derivable from the question text by rules, so the
// assistant works identically with or without a model. When ANTHROPIC_API_KEY is present,
// lib/ask-llm.ts may refine the same shape, but its output passes through validateIntent
// and can never widen beyond what deterministic search supports.

export type AskIntent = {
  kind: "events" | "teachers";
  types: string[] | null;
  location: string | null;
  radiusMiles: RadiusMiles | null;
  days: DayName[];
  timeOfDay: TimeOfDay | null;
  recognized: boolean;
};

const DAY_RES: Array<[DayName, RegExp]> = DAY_NAMES.map((d) => [d, new RegExp(`\\b${d}s?\\b`, "i")]);

const TEACHER_RE = /\b(teacher|instructor|lesson|learn(?:\s+to\s+play)?|class|classes)\b/i;
const TOURNAMENT_RE = /\btournaments?\b/i;
const LEAGUE_RE = /\bleagues?\b/i;
const TRAVEL_RE = /\b(retreats?|cruises?|travel|getaways?)\b/i;
const PLACE_NAME = /^[A-Za-z0-9 .,'-]+$/;

const STOP_TAIL =
  /\b(today|tonight|tomorrow|this week(end)?|next week(end)?|morning|afternoon|evening|night|please|thanks?)\b/gi;

function extractLocation(q: string): string | null {
  const zip = q.match(/\b(\d{5})\b/);
  if (zip) return zip[1];
  const m = q.match(
    /\b(?:near|in|around|close to|by|at|visiting|of)\s+([A-Za-z][A-Za-z .,'-]{1,50})$/i
  );
  let candidate = m ? m[1] : null;
  if (!candidate) {
    const m2 = q.match(
      /\b(?:near|in|around|close to|visiting)\s+([A-Za-z][A-Za-z .'-]{1,40}?)(?=\s+(?:on|this|next|for)\b|[,?.!]|$)/i
    );
    candidate = m2 ? m2[1] : null;
  }
  if (!candidate) return null;
  let loc = candidate.replace(STOP_TAIL, "").replace(/\bme\b.*$/i, "").trim();
  for (const [, re] of DAY_RES) loc = loc.replace(re, "").trim();
  loc = loc.replace(/[,?.!]+$/, "").replace(/\s{2,}/g, " ").trim();
  if (!loc || loc.length < 2 || !PLACE_NAME.test(loc)) return null;
  return loc;
}

export function parseAskIntent(raw: string): AskIntent {
  const q = normalizeQuestion(raw, 200);
  const empty: AskIntent = {
    kind: "events",
    types: null,
    location: null,
    radiusMiles: null,
    days: [],
    timeOfDay: null,
    recognized: false,
  };
  if (!q) return empty;

  const kind: AskIntent["kind"] = TEACHER_RE.test(q) ? "teachers" : "events";
  let types: string[] | null = null;
  if (TOURNAMENT_RE.test(q)) types = ["tournament"];
  else if (LEAGUE_RE.test(q)) types = ["league"];
  else if (TRAVEL_RE.test(q)) types = ["retreat"];

  const days: DayName[] = [];
  for (const [d, re] of DAY_RES) if (re.test(q)) days.push(d);

  let timeOfDay: TimeOfDay | null = null;
  if (/\bmorning\b/i.test(q)) timeOfDay = "morning";
  else if (/\bafternoon\b/i.test(q)) timeOfDay = "afternoon";
  else if (/\b(evening|night|tonight)\b/i.test(q)) timeOfDay = "evening";

  // "tonight" and "today" carry the current weekday; the server clock is a fact, not a guess.
  if (/\b(tonight|today)\b/i.test(q) && days.length === 0) {
    days.push(DAY_NAMES[(new Date().getDay() + 6) % 7]);
  }

  let radiusMiles: RadiusMiles | null = null;
  const rm = q.match(/within\s+(\d{1,3})\s*(?:miles?|mi)\b/i);
  if (rm) {
    const want = Number(rm[1]);
    radiusMiles = RADIUS_OPTIONS.reduce((best, r) =>
      Math.abs(r - want) < Math.abs(best - want) ? r : best
    );
  }

  const location = extractLocation(q);
  if (location && !radiusMiles) radiusMiles = 25;

  const mahjongish = /\b(mah\s?-?jong+|mahj|play|game|tile)\b/i.test(q);
  const recognized = Boolean(location || days.length || timeOfDay || types || kind === "teachers" || mahjongish);

  return { kind, types, location, radiusMiles, days, timeOfDay, recognized };
}

// Rules questions ride the same box as directory questions, so the split must be
// deterministic: a rules signal without a discovery signal is "rules", both together is
// "mixed", and everything else stays "directory" so the existing search path is untouched.
export type AskTopic = "directory" | "rules" | "mixed";

const RULES_SIGNAL_RES: RegExp[] = [
  /\bjokers?\b/i,
  /(?<!(?:near|in|around|at|visiting|by|to|from)\s)\bcharleston\b/i,
  /\bdragons?\b/i,
  /\bsoap\b/i,
  // "Flower Mound" is a Texas city, not a tile question.
  /\bflowers?\b(?!\s+mound)/i,
  /\b(pungs?|kongs?|quints?|sextets?)\b/i,
  /\bjokers?\b.{0,60}\bpairs?\b|\bpairs?\b.{0,60}\bjokers?\b/i,
  /how many (tiles|players|people|suits|flowers|jokers|winds|dragons)/i,
  /\btile count\b/i,
  /\b152\b/,
  /\b(concealed|exposed|exposure)\b/i,
  /\b(open|closed) hands?\b/i,
  /\b(call|calling|claim)\b.{0,20}\bdiscards?\b/i,
  /\bwall game\b/i,
  /\bthe wall\b/i,
  /\bdead hand\b/i,
  /\b(nmjl|national mah ?jongg league)\b/i,
  /\b(etiquette|courtes(y|ies))\b/i,
  /(new|annual|yearly|current|next|this year'?s?)\s+card\b/i,
  /\bcard\b.{0,30}(come(s)? out|release|hands?|lines?|categor)/i,
  /hands? (on|for|from) (this|the) year/i,
  /how (do|does) (i|you|someone|a player) win/i,
  /\bwinning hand\b/i,
  /\bdeclar(e|ing) mahjong\b/i,
  /\bstart with\b.{0,20}\btiles?\b|\btiles?\b.{0,30}\bstart\b/i,
  /\bpenalt(y|ies)\b/i,
  /\bcourtesy pass\b/i,
  BLIND_PASS,
  /\bwild tiles?\b/i,
];

const VARIANT_QUESTION_RE =
  /\b(riichi|japanese|chinese|hong ?kong|cantonese|sichuan|taiwanese|korean|filipino|singapor(e|ean)|mcr|zung ?jung)\b/i;

export function detectAskTopic(raw: string): AskTopic {
  const q = normalizeQuestion(raw);
  if (!q) return "directory";
  // A place called Blind Pass (or Blind River, Blind Bay) is removed before the
  // question is classified, so the place name alone never makes it a rules question.
  if (blindReadsAsPlace(q)) {
    return detectAskTopic(q.replace(/\bblind(\s+[A-Za-z]+)?\b/gi, ""));
  }

  const questionForm = /\b(what|how|why|when|can|could|should|is|are|do|does|work|mean)\b/i.test(q);
  // The weak nouns (rules, rack, discard, deal) only signal a rules question when the
  // sentence actually asks something. "Any good deal on lessons in Naples" is commerce.
  const weakRulesNoun = /\b(rules?|racks?|discard(s|ing)?|deal(t|ing)?|dealer)\b/i.test(q);
  const rulesAsk =
    RULES_SIGNAL_RES.some((re) => re.test(q)) ||
    (weakRulesNoun && questionForm) ||
    (VARIANT_QUESTION_RE.test(q) && questionForm);
  if (!rulesAsk) return "directory";

  // Discovery needs a strong signal here. Bare "in" is not one: extractLocation reads
  // "in a pair" as a place, which would bolt a bogus search onto a pure rules question.
  const intent = parseAskIntent(q);
  const discoveryAsk =
    intent.days.length > 0 ||
    intent.timeOfDay !== null ||
    intent.types !== null ||
    /\bnear\b/i.test(q) ||
    /\b\d{5}\b/.test(q) ||
    /\b(nearby|in my area)\b/i.test(q) ||
    /\bwhere can i (play|find|go)\b/i.test(q) ||
    /\bfind (a|an|me)\b/i.test(q);

  return discoveryAsk ? "mixed" : "rules";
}

// Every model-produced intent must survive this before touching search.
export function validateIntent(x: unknown): AskIntent | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const kind = o.kind === "teachers" ? "teachers" : "events";
  const days = Array.isArray(o.days)
    ? (o.days.filter((d) => (DAY_NAMES as readonly string[]).includes(String(d))) as DayName[])
    : [];
  const tod = ["morning", "afternoon", "evening"].includes(String(o.timeOfDay))
    ? (o.timeOfDay as TimeOfDay)
    : null;
  const radius = (RADIUS_OPTIONS as readonly number[]).includes(Number(o.radiusMiles))
    ? (Number(o.radiusMiles) as RadiusMiles)
    : null;
  const loc = typeof o.location === "string" && PLACE_NAME.test(o.location) && o.location.length <= 60
    ? o.location
    : null;
  const ALLOWED_TYPES = ["open_play", "tournament", "league", "retreat", "class", "social"];
  const types = Array.isArray(o.types)
    ? o.types.map(String).filter((t) => ALLOWED_TYPES.includes(t))
    : null;
  const finalTypes = types && types.length ? types : null;
  return {
    kind,
    types: finalTypes,
    location: loc,
    radiusMiles: radius,
    days,
    timeOfDay: tod,
    recognized: Boolean(loc || days.length || tod || finalTypes || kind === "teachers"),
  };
}
