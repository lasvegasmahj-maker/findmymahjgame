import { blindReadsAsPlace, BLIND_PASS, HAND_CLOSED, RULES_TOPIC_SIGNALS, RULES_TOPIC_SIGNALS_CONDITIONAL, VARIANT_RE, CONTACT_SENSE, MAHJ_ONLY_NOUN, placeAfterPrep } from "@/lib/rules/knowledge";
import { normalizeQuestion, spellfix } from "@/lib/rules/lookup";
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

const PRONOUN_HEAD = /^(us|them|they|you|me|him|her|it|our|their|my|your)\b/i;

function extractLocation(q: string): string | null {
  const zip = q.match(/\b(\d{5})\b/);
  if (zip) return zip[1];
  const m = q.match(
    /\b(?:near|in|around|close to|by|at|visiting|of)\s+([A-Za-z][A-Za-z .,'-]{1,50})$/i
  );
  let candidate = m ? m[1] : null;
  // Rejected here as well as at the end, not instead of: "three of us who want to join a
  // game in Naples" matches on "of", and dropping that candidate is what lets the
  // fallback below find the city the player actually named.
  if (candidate && PRONOUN_HEAD.test(candidate.trim())) candidate = null;
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
  // A pronoun is not a place: "near us" was being title-cased into an invented town
  // ("Nothing reviewed matches near Us yet").
  if (PRONOUN_HEAD.test(loc)) return null;
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
  /\bopen hands?\b/i,
  HAND_CLOSED,
  /\b(call|calling|claim)\b.{0,20}\bdiscards?\b/i,
  /\bwall game\b/i,
  /\bthe wall\b/i,
  /\bdead hand\b/i,
  /\b(nmjl|national (mah ?jongg?|mahjong) league)\b/i,
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

  /\b(same tile|same discard|two players (call|want)|both (call|want)|who gets the tile|who gets it)\b/i,
  /\b(pick|picking|picked|draw|drawing|drew) (ahead|out of turn|early|too soon|before (my|her|his|their) turn)\b/i,
  /\b(my own discard|own discard|call back|take back|take it back)\b/i,
  /\bmis-?nam(e|ed|es|ing)\b|\bwrong name\b/i,
  /\b(false|wrong|mistaken|bad) (mahjong|maj|mah ?jong+)\b|\b(mahjong|maj|mah ?jong+) (in error|by mistake|by accident|wrongly|incorrectly)\b|\bdeclared (mahjong|maj|mah ?jong+)\b/i,
  /\b(name|announce|say) (the |each |every |a |my |your )?(tile|discard)\b|\bsay same\b|\bsaying same\b/i,
  /\b(hold|wait)\b.{0,30}\b(tile|discard)\b/i,
  /\b(too many|too few|wrong number of|right number of|correct number of) tiles\b|\bhow many tiles (should|do|must) (i|you|we)\b/i,
  /\bwhich hand should i\b|\bhow do i (pick|choose|decide on) (a|my) hand\b/i,
  /\b(order of play|turn order|whose turn|which way (do|does) (play|the turns?|it) go)\b/i,
  /\b(colou?rs?|letters?) on the card\b|\bwhat does (c|x|f|d) (mean|stand for)\b|\bsoap\b.{0,20}\bzero\b/i,
  /\b(last|final) (tile|discard)\b/i,
  /\bwho (makes|writes|sets) the rules\b/i,
  /\bmelds?\b|\b(quints?|sextets?)\b/i,
  /\b(can|may|could|should|am i allowed to) (i |we )?(call|claim) (that|this|it)[?!. ]*$/i,
  /\b(call|calling|claim|claiming) (a |the |that |this |any )?(tile|discard)s?\b/i,
  /\b(can|may|do|should|must) (i|we|you) (have to |need to )?pass[?!. ]*$/i,
  /\bthe tile (i|you|she|he|they) (need|want|threw|discarded|put down)\b/i,
  /\bwho (is|goes|deals|starts|plays|becomes) (east|the dealer)\b|\b(which player|who) (should |will )?(be|become)s? east\b|\b(am i|will i be|do i become|when am i) east\b/i,
  /\b(have|holding|got|hold) \d+ tiles\b/i,
  /\b(allowed|able|permitted|ok|okay) to call\b|\b(calling|calls?) work\b|\bhow (does|do) (calling|a call)\b/i,
  /\bwinning tile\b|\bcall(ed|ing)? (mahjong|maj|mah ?jong+)\b|\bhand (is|was) wrong\b/i,
  /\bwhat does (hold|wait|same|maj|mahjong|soap|joker|kong|pung) mean\b/i,
  /\bself[- ]?pick(ed)?\b/i,
  /\b(clockwise|counterclockwise|counter-clockwise)\b|\bwhen (do|can|am) i (get to )?(pick|draw)\b/i,
  /\b(read|list|tell|show|give|send) (me )?(the|this year'?s?|your) card\b/i,
  /\bcall(ing)? for (a |an )?(pair|pung|kong|quint|sextet|single|exposure)\b/i,
  /\brules? (for|of|about|on) (calling|discards?|jokers?|the charleston|passing|exposures?|dead hands?|payments?|winning|the wall|dealing)\b/i,
  /\b(nobody|no one) (wins|won)\b/i,

  /\b(first|second|last) (left|right|across)\b/i,
  /\b(call|claim)\b.{0,25}\bfor (mahjong|maj|mah ?jong+)\b|\bany tile\b/i,
  /\bwhat (she|he|they|someone) (just )?(threw|discarded|put down|tossed)\b|\bpick up\b.{0,20}\b(discard|tile|what)\b/i,
  /\b(skip|stop|decline|refuse|refuses|end)\b.{0,30}\b(passing|charleston|passes)\b|\bround of passing\b/i,
  /\bpass(es|ed|ing)? (the |my |your |a )?tiles?\b|\bhow (does|do) (passing|the pass(es)?|a pass|passes) work\b|\b(what is|what'?s|explain) (the )?passing\b/i,
  ...RULES_TOPIC_SIGNALS,
  /\b(exchange|redeem|swap|trade)\b.{0,30}\bjokers?\b/i,
  /\bjokers?\b.{0,30}\b(exchange|redeem|swap|trade|discard|discarded|thrown|throw)\b/i,
];

// Everyday-word signals need mahjong vocabulary in the sentence and no directory or
// commerce wording before they count.
const CONDITIONAL_RULES_SIGNALS: RegExp[] = [
  ...RULES_TOPIC_SIGNALS_CONDITIONAL,
  /\bhow many of each\b/i,
  /\b(three|3) of us\b[^.?!]{0,40}\b(pass|passing|charleston|deal|dealt|redeal|tiles each|how many tiles)\b/i,
  /\bre-?deal\b|\b(12|14) tiles\b|\bwrong number of tiles\b|\bshort a tile\b|\bextra tile\b(?!\s+sets?\b)/i,
  /\b(hold|wait)\b(?!\s+(a |an |the |my |your |our |her |his |their )?(spot|seat|place|table|room))[^.?!]{0,30}\b(call|claim|tile|discard|priority|count|counts|mean)\b(?![^.?!]{0,12}\b(back|ahead|first)\b)|\b(call|claim|tile|discard|priority)\b[^.?!]{0,30}\b(hold|wait)\b(?!\s+(a |an |the |my |your |our |her |his |their )?(spot|seat|place|table|room))/i,
  /\bcold wall\b|\bhot wall\b|\b(final|last) discard\b[^.?!]{0,40}\b(wall|deal|game|exposure|mahjong)\b|\b(wall|deal)\b[^.?!]{0,40}\b(final|last) discard\b/i,
  /\bblanks?\b(?! (check|page|space|form))/i,
  /\btournament (rules?|play|director)\b/i,
  /\brule ?book\b|\bmade easy\b/i,
  /\b(what|which|how many|name|the) suits?\b|\bsuits? (in|of) (american )?mahjong\b/i,
  /\bthe passing\b|\bpassing (before|round|phase|tiles|rules?)\b|\bbefore the game (starts|begins)\b/i,
  /\bhow (do|does|can) (i|you|we|someone|a player) (actually |even |really )?win\b|\bwin the game\b/i,
  /\b(call|claim|take) (it|that|this)\b/i,
  /\bhands\b.{0,30}\bcards?\b/i,
  /\b(three|3|five|5|two|2) (people|players|of us)\b|\bplay with (three|3|five|5|two|2)\b|\bthree[- ](player|handed|person)\b/i,
  /\bwho goes (next|first|after)\b/i,
  /\b(what|which) tiles\b/i,
  /\bon the card\b|\bwhat does (the )?(little |letter |a |an )?[cx] (mean|stand for)\b|\b[cx] (after|next to|beside|behind) (a|the) hand\b/i,
];
const MAHJ_VOCAB =
  /\b(tiles?|hands?|discards?|discarded|discarding|walls?|card|charleston|jokers?|mahjong|mahj|maj|pungs?|kongs?|quints?|sextets?|expos\w*|melds?|racks?|deal|dealer|dealt|east|turns?|passing|win|wins|winning|won|bams?|craks?|dots?|winds?|dragons?|flowers?|soap|rules?|rule ?book|scoring|pays?|paid|dead|call|calls|called|calling|play|playing|players?|three[- ]handed|on the card|blanks?|pass|passes|redeal)\b/i;
const DIRECTORY_NOUNS =
  /\b(groups|games|clubs|teachers?|instructors?|lessons?|classes|events|tournaments|venues?|studios?|meetups?|leagues|retreats|cruises|directory|listings?|website|near|nearby|zip|miles?|downtown|fourth|seat|spot|waitlist|reserve|reservation|show up|looking for|sign up|register)\b/i;
const COMMERCE_RE =
  /\b(buy|buying|purchase|store|shop|for sale|price|prices|cost|costs|sell|sells|order|amazon|membership|fee|fees|sets? for|credit|debit|checkout)\b/i;


export function detectAskTopic(raw: string): AskTopic {
  const q = spellfix(normalizeQuestion(raw));
  if (!q) return "directory";
  // Blind Pass, Blind River, and Blind Bay are real places; the name alone must
  // not read as a rules question.
  if (blindReadsAsPlace(q)) {
    return detectAskTopic(q.replace(/\bblind(\s+[A-Za-z]+)?\b/gi, ""));
  }

  // "wait for a call back about lessons" is a phone call, not a claim. It has to be
  // caught here, ahead of the signal set, because OWN_DISCARD treats a bare "call back"
  // as an unconditional rules signal. Only a word that can ONLY mean mahjong rescues it:
  // MAHJ_VOCAB is no use, since it contains "call" itself.
  if (CONTACT_SENSE.test(q) && !MAHJ_ONLY_NOUN.test(q)) return "directory";

  const questionForm = /\b(what|how|why|when|can|could|should|is|are|do|does|work|mean)\b/i.test(q);
  // The weak nouns (rules, rack, discard, deal) only signal a rules question when the
  // sentence actually asks something. "Any good deal on lessons in Naples" is commerce.
  const weakRulesNoun = /\b(rules?|racks?|discard(s|ing)?|deal(t|ing)?|dealer)\b/i.test(q);
  const plainContext =
    MAHJ_VOCAB.test(q) && !DIRECTORY_NOUNS.test(q) && !COMMERCE_RE.test(q) && !CONTACT_SENSE.test(q) && !placeAfterPrep(q);
  const conditional = CONDITIONAL_RULES_SIGNALS.some((re) => re.test(q)) && plainContext;
  // "riichi rules for pon" is a rules question even without a question word.
  const variantAsk = VARIANT_RE.test(q) && (questionForm || plainContext);
  const strongRules = RULES_SIGNAL_RES.some((re) => re.test(q)) || conditional;
  const rulesAsk = strongRules || (weakRulesNoun && questionForm) || variantAsk;
  if (!rulesAsk) return "directory";

  // Discovery needs a strong signal here. Bare "in" is not one: extractLocation reads
  // "in a pair" as a place, which would bolt a bogus search onto a pure rules question.
  const intent = parseAskIntent(q);
  // "Can I blind pass in a tournament?" is a rules question about tournament play, not a
  // search for tournaments; only a tournament type with no other discovery signal is
  // discounted when a strong rules signal is present.
  const tournamentOnly = intent.types?.length === 1 && intent.types[0] === "tournament";
  const discoveryAsk =
    intent.days.length > 0 ||
    intent.timeOfDay !== null ||
    (intent.types !== null && !(strongRules && tournamentOnly)) ||
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
