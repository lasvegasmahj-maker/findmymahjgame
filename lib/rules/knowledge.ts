// American mahjong rules knowledge for Ask Find My Mahj. Every answer here is either
// owner-approved text or text written independently for this site and verified
// against National Mah Jongg League rules, with provenance recorded on the entry.
// Retrieval may pick an entry, and a model may rephrase one, but nothing may add rule
// content that is not written below. The annual NMJL card's hands are copyrighted and
// must never appear here; lib/rules/lookup.ts refuses those questions before retrieval.
// Secondary research (Mahj Life wiki, CC BY-NC-ND) is used only to locate and cross-check
// League rulings; no sentence here is copied or closely paraphrased from it.

export type RulesConfidence = "high" | "medium";

export type RuleClassification =
  | "standard_nmjl_rule"
  | "nmjl_clarification"
  | "tournament_rule"
  | "house_optional_rule"
  | "etiquette"
  | "strategy";

export type Provenance = {
  source_type: "owner_approved" | "nmjl_primary" | "secondary_research" | "arithmetic";
  // Titles and references only, never source text.
  source_title: string;
  source_ref?: string;
  source_year?: number;
  owner_review_required: boolean;
  evidence: "verified" | "owner_review_pending" | "owner_question_pending";
};

export type KnowledgeEntry = {
  id: string;
  topic: string;
  question_patterns: RegExp[];
  // An entry requiring more concepts outranks one requiring fewer, ahead of any
  // keyword score: that is what makes a narrow intent beat a broad one without
  // listing phrasings. `blocks` disqualifies an entry for a context its approved
  // text does not cover.
  requires?: RegExp[];
  blocks?: Array<RegExp | ((question: string) => boolean)>;
  keywords: string[];
  approved_answer: string;
  ruleset: "american_nmjl";
  varies_by_house: boolean;
  house_note?: string;
  source: "owner_approved" | "research_verified" | "owner_question";
  last_verified: `${number}-${number}-${number}`;
  confidence: RulesConfidence;
  classification: RuleClassification;
  provenance: Provenance;
};

const RULESET = "american_nmjl" as const;
const SOURCE = "owner_approved" as const;
const VERIFIED = "2026-08-22" as const;
const VERIFIED_REVIEW = "2026-08-26" as const;
const VERIFIED_WORDING = "2026-08-29" as const;
const VERIFIED_AUDIT = "2026-08-30" as const;

const OWNER: Provenance = {
  source_type: "owner_approved",
  source_title: "Find My Mahj owner approval (certified American mahjong instructor)",
  owner_review_required: false,
  evidence: "verified",
};

// New entries written for the 2026-08-30 truth-layer audit. The League rule was located
// and cross-checked through secondary research; the wording is Find My Mahj's own, and the
// owner reviews each one before its review flag clears.
function researched(ref: string, year?: number): Provenance {
  return {
    source_type: "secondary_research",
    source_title: "NMJL rule located and cross-checked through secondary research (Mahj Life wiki, research use only)",
    source_ref: ref,
    ...(year ? { source_year: year } : {}),
    owner_review_required: true,
    evidence: "owner_review_pending",
  };
}

const ARITHMETIC: Provenance = {
  source_type: "arithmetic",
  source_title: "Follows from the owner-approved tile counts",
  owner_review_required: true,
  evidence: "owner_review_pending",
};

function ownerQuestion(ref: string): Provenance {
  return {
    source_type: "secondary_research",
    source_title: "Ruling not resolved from authoritative material; exact question filed for the owner",
    source_ref: ref,
    owner_review_required: true,
    evidence: "owner_question_pending",
  };
}

// Concept matchers describe ideas, not phrasings, so word order, punctuation, and
// paraphrase all resolve to the same concept.
// "hands on lessons" and "second hand set" are directory phrases, not hands.
// "marked C" is the card's own label for a concealed hand.
export const HAND_CLOSED =
  /(?<!second[- ])\b(closed|concealed)\b[^.?!]{0,40}\bhands?\b(?![- ]on\b)|(?<!second[- ])\bhands?\b(?![- ]on\b)[^.?!]{0,40}\b(closed|concealed)\b|\b(marked|labeled|labelled|says) C\b|\bC hands?\b/i;
export const CLAIM_VERB = /\b(call|calls|called|calling|claim|claims|claiming|pick(ing)? up|takes? from the discard|take it|grab|take (the|that|this|a|her|his|their) (last |final |winning )?(tile|discard))\b/i;
const BLIND = /\bblind(ly)?\b/i;
const PASS_VERB = /\bpass(es|ed|ing)?\b/i;
export const JOKER = /\bjokers?\b/i;
// Proximity concepts: the two words must sit within one clause of each other, so
// "legally blind, can she pass tiles" is not a blind pass and "what is a joker? my
// friend passed one" is still a joker definition.
export const BLIND_PASS = new RegExp(
  `${BLIND.source}[^.?!,;]{0,30}${PASS_VERB.source}|${PASS_VERB.source}[^.?!,;]{0,30}${BLIND.source}`, "i");
const JOKER_PASS = new RegExp(
  `${JOKER.source}[^.?!,;]{0,45}${PASS_VERB.source}(?!\\s+(for|as)\\b)|${PASS_VERB.source}(?!\\s+(for|as)\\b)[^.?!,;]{0,45}${JOKER.source}`, "i");
// Joker exchange from an exposure is allowed for any hand; that question belongs
// on the exchange answer, whatever verb the player uses.
const EXCHANGE_VERB = "(exchange[sd]?|exchanging|redeem(s|ed|ing)?|swap(s|ped|ping)?|trad(e|es|ed|ing))";
export const JOKER_EXCHANGE = new RegExp(
  `\\b${EXCHANGE_VERB}\\b[^.?!,;]{0,30}\\bjokers?\\b|\\bjokers?\\b[^.?!,;]{0,30}\\b${EXCHANGE_VERB}\\b|\\b(take|get|pull|grab|claim|pick(ing)? up)\\b[^.?!,;]{0,20}\\bjokers?\\b[^.?!,;]{0,30}\\b(exposure|exposed|rack)\\b|\\b(grab|take|get|claim|pick up|have)\\b[^.?!,;]{0,12}\\b(the|that|this|a|her|his|their|someone's) jokers?\\b`, "i");

export const MAHJONG_CUE =
  /\b(mah ?jong+|mahj|maj|win|wins|winning|won|go out|(last|final) tile (i|you|she|he|they|we) need|complete[sd]? (my|your|the|her|his) (hand|mahjong)|finish(es|ed)? (my|your|the|her|his) hand)\b/i;
export const EXPOSURE_CUE = /\b(expos(e|ed|es|ure|ures|ing)|pungs?|kongs?|quints?|sextets?|meld|build(ing)?|group)\b/i;
const DISCARDED = /\b(discard|discards|discarded|discarding|thrown|throw|throws|threw|toss|tossed|put down)\b/i;
const ERROR_CUE =
  /\b(error|mistake|mistakenly|wrong|wrongly|false|falsely|incorrect|invalid|not valid|isn'?t valid|didn'?t have|did not have|by accident|accidentally|premature|too early|oops|bad|botched|busted|penalt(y|ies))\b/i;
export const MISNAMED =
  /\bmis-?nam(e|ed|es|ing)\b|\bwrong name\b|\bnamed (it|the tile|a tile|my discard|the discard) wrong(ly)?\b|\bcalled it (the )?wrong\b|\bsaid the wrong tile\b|\bwrong tile name\b|\bnamed the wrong\b|\bmisspoke\b|\bcalled (it|the tile|my discard) (a|an) \w+ by mistake\b|\bannounced (it|the tile) (as )?the wrong\b|\bcalled it (a|an) [^.?!]{1,20} but (it was|it's|its|it is)\b|\bsaid [^.?!]{1,15} but (it was|it's|it is)\b|\bnamed it (a|an) [^.?!]{1,20}\bbut\b/i;
export const TWO_PLAYERS =
  /\b(both|two (players|people|of us)|more than one|same (tile|discard)|at the same time|simultaneous(ly)?|who gets|who has priority|priority|first dibs|hold|wait)\b/i;
const TWO_PLAYERS_ASK = new RegExp(`${CLAIM_VERB.source}|\\b(want|wants|wanted|need|needs|declare|declares|mahjong|maj|tile|discard|mean|means|meaning|say|saying|said|shout|announce)\\b`, "i");
export const OWN_DISCARD =
  /\b(my own discard|own discard|tile i (just )?(discarded|threw|put down)|discard i (just )?(made|threw)|call back|take back|take it back|i (just )?(discarded|threw) (it|a tile|the tile)|my discard|what i (just )?(discarded|threw))\b/i;
const NAMING = /\b(name|names|naming|named|announce|announcing|call out|say (the|its|the tile'?s?) name|tile name|say same|saying same|say aloud|out loud|aloud)\b/i;
const TIMING =
  /\b(when|before|after|during|timing|turn|my turn|own turn|right away|immediately|as soon as|first|then|order)\b/i;
const DEAD = /\bdead\b/i;
const DEAD_DETAIL =
  /\b(too many|too few|wrong number|how many|count|thirteen|fifteen|twelve|1[0-9]|out of turn|expos(e|ed|ure|ures)|pay|pays|payment|who (can|may|gets to) (declare|call|say)|declare (my|your|his|her|their) own|self|myself|what makes|why|when|causes?|reasons?)\b/i;
const HAND_SIZE =
  /\b((should|do|must|can|am|are) (i|you|we) (supposed to )?(have|hold|be holding|keep) [^.?!]{0,20}\btiles?\b|how many tiles (should|do|must|can) (i|you|we) (have|hold|keep|be holding)|how many tiles (should|must) (be )?in (my|your|our) hand|tiles? in (my|your|our) hand|tiles? (should|must) (be )?in (my|your) hand|between turns|after (i|you) discard|during (my|your) turn|correct number of tiles|right number of tiles|count (my|your) tiles|i have (\d+|too many|too few|an extra|one too many|one less) tiles?|one short|short a tile|missing a tile|extra tile)\b/i;
const PICK_VERB = /\b(pick|picks|picked|picking|draw|draws|drew|drawing|take|takes|took|taking|grab)\b/i;
const AHEAD = /\b(ahead|early|before (my|your|their|her|his) turn|out of turn|not (my|your|their) turn|too soon|in advance|before (she|he|they|someone) (has )?(discards?|discarded|throws?|thrown)|while (she|he|they|someone) (is|are) (still )?(deciding|thinking|looking|discarding|choosing))\b/i;
const ORDER = /\b(order of play|turn order|direction|which way|clockwise|counterclockwise|counter-clockwise|whose turn|who goes (next|first|after)|next player|after east|goes next|turns? (go|pass|move|rotate)|to the (right|left)|when (do|can|am) i (get to )?(pick|draw)|how (does|do) (a|my|the) turns? (work|go))\b/i;
const COURTESY = /\bcourtesy\b/i;
const CHARLESTON_WORD = /(?<!(?:near|in|around|at|visiting|by|to|from)\s)\bcharleston\b/i;
const STOP = /\b(stop|stops|stopped|stopping|end it|ending|skip|skipped|skipping|decline|declined|refuse|refused|opt out|refuses|declines|skips|halt|halts|cancel|cancels|call off|say no|don'?t want to (do|play|pass)|do not want to (do|play|pass)|required|mandatory|optional|have to (do|play|pass)|must (we|i|you|everyone) (do|play|pass)|forced)\b/i;
const AGREE_SECOND =
  /\b(agree|agrees|agreement|unanimous|everyone|all four|all 4)\b[^.?!]{0,30}\b(second|another|charleston)\b|\b(second|another) charleston\b[^.?!]{0,30}\b(agree|agrees|unanimous|everyone|all four|all 4)\b/i;
const STOP_OR_AGREE = new RegExp(`${STOP.source}|${AGREE_SECOND.source}`, "i");
const PAYMENT =
  /\b(pay|pays|paid|paying|payment|payments|payout|score|scores|scoring|scored|points|value|worth|double|doubled|doubles|owe|owes|money|bet|bets|stakes|quarters|dollars|coins|chips|settle|settles|jokerless|self[- ]?pick(ed)?|picked it (myself|yourself|herself|himself))\b/i;
const QUINT_SEXTET = /\b(quints?|sextets?|five of a kind|six of a kind)\b/i;
const MIXED_GROUP =
  /\b(news|n ?e ?w ?s|runs?|sequences?|consecutive|straight|year|years|20[0-9]{2} hand|1 ?2 ?3|2 ?4 ?6|3 ?6 ?9|369|246|different tiles|mixed group|line of singles)\b/i;
// Scoring vocabulary only: "do I have to pay to play mahjong in Naples" is a directory question.
const SCORING_ASK =
  /\b(who|how much) (pays|do (i|we|you) pay|does (everyone|each player|the discarder|the winner) pay)\b|\bpay(s|ing)? (the )?(winner|double|value|more|less|twice)\b|\bjokerless\b|\bpayout\b|\bself[- ]?pick(ed)?\b|\bdiscarder pays?\b|\b(pay|pays|paid|payment|payments|score|scoring|worth|value|double) (for|on|in|after|with|of) (a |the |my )?(wall game|self[- ]?pick|jokerless|win|winning|mahjong|maj|discard|hand)\b|\bhand (value|worth|is worth|pays)\b|\bvalue of (a |the |my )?hand\b|\b(win|wins|won) on a discard\b|\bworth double\b|\bdouble the value\b|\bscoring\b/i;
const EXPOSURE_WORD = /\b(expos(e|ed|es|ure|ures|ing)|melds?|lay (it |them )?down|put (it |them )?down|on top of (my|the|your) rack|face up)\b/i;
const CARD_WORD = /\bcards?\b/i;
const CX_LETTERS = /\bC and X\b|\bX and C\b|\bC or X\b|\bX or C\b|\b[CX] hands?\b|\bmarked [CX]\b/i;
const NOTATION =
  /\b(colou?rs?|red|green|blue|black|notation|symbols?|letters?|abbreviations?|legend|key|mean|means|meaning|stand for|stands for|read (the|a|my) card|parenthes[ei]s|concealed|exposed|soap|zero)\b|\b[CX]\b/i;
const TOURNAMENT = /\btournaments?\b/i;
const BLANK = /\bblanks?\b(?! (check|page|space|form))/i;
const DECLINE_CALL =
  /\b(have to|must|required|forced|need to|do i need to|obligated|supposed to)\b[^.?!]{0,25}\b(call|take|claim|pick up)\b|\b(pass on|skip|ignore|let it go|decline|don'?t want|do not want|not take|leave)\b[^.?!]{0,25}\b(discard|tile|it)\b/i;
const OFFICIAL =
  /\b(official|who (makes|writes|sets|decides|publishes|runs)|where (do|does|are) the rules|which rules|rulebook|rule book|made easy|source of (the )?rules|governing body|authority|the league)\b/i;
const STRATEGY =
  /\b(strategy|strategies|tips?|advice|best way|should i (pick|choose|play|keep|go for|aim for)|which hand should|what hand should|how do i (pick|choose|decide on) (a|my) hand|good hand to)\b/i;
const LAST_OF_WALL =
  /\b((last|final) (tile|discard|few tiles)|wall (runs|is|gets) (out|empty|gone|done)|run(s|ning)? out of tiles|no (more )?tiles? left|end of the wall|out of tiles)\b/i;

// "Blind Pass", "Blind River", and "Blind Bay" are real places. "Blind" reads as a
// place name when a location word introduces it, when a geographic suffix follows
// it in any casing, or when it is Title Cased inside something that is not a
// question. "to" and "at" are deliberately absent: "allowed to blind pass" is the
// natural verb form of the rule question.
const BLIND_PLACE_PREP = /\b(near|nearby|around|from|where)\s+blind\b/i;
// "at", "by", and "visiting" are place prepositions only when the place is Title
// Cased: "at blind pass" in lowercase is the rules question ("look at blind pass tiles").
const BLIND_PLACE_PREP_PROPER = /\b([Aa]t|[Bb]y|[Ii]n|[Vv]isiting)\s+Blind\s+(Pass|River|Bay)\b/;
const BLIND_PLACE_SUFFIX =
  /\bblind\s+(pass|river|bay)\s+(road|rd|beach|key|keys|fl|florida|estero|sanibel|captiva|island|drive|dr|lane|blvd|park)\b/i;
// Only "Blind Pass" is ambiguous between the rules term and a place; any other
// Title Cased "Blind <Name>" (Blind River, Blind Bay) is always a place.
const BLIND_PROPER_OTHER = /\bBlind\s+(?!Pass(es|ed|ing)?\b)[A-Z][a-z]+/;
const BLIND_PROPER_PASS = /\bBlind\s+Pass\b/;
const QUESTION_FORM = /\b(can|could|may|do|does|is|are|should|when|how|what|why|allowed)\b/i;
export function blindReadsAsPlace(question: string): boolean {
  return (
    BLIND_PLACE_PREP.test(question) ||
    BLIND_PLACE_PREP_PROPER.test(question) ||
    BLIND_PLACE_SUFFIX.test(question) ||
    BLIND_PROPER_OTHER.test(question) ||
    (BLIND_PROPER_PASS.test(question) && !QUESTION_FORM.test(question))
  );
}

// Concept matchers the shared Ask box may treat as rules signals on their own: each one
// names a mahjong-only idea, so a directory question cannot trip it.
export const RULES_TOPIC_SIGNALS: RegExp[] = [
  OWN_DISCARD,
  BLANK,
  QUINT_SEXTET,
  /\b(expos(e|ed|es|ure|ures|ing)|melds?)\b/i,
  JOKER_EXCHANGE,
  AGREE_SECOND,
  CX_LETTERS,
  new RegExp(`${DEAD.source}[^.?!]{0,20}\\b(hand|hands|tiles?|jokers?)\\b|\\b(hand|hands)\\b[^.?!]{0,20}${DEAD.source}`, "i"),
  SCORING_ASK,
  new RegExp(`${NAMING.source}[^.?!]{0,30}${DISCARDED.source}|${DISCARDED.source}[^.?!]{0,30}${NAMING.source}|\\bsay same\\b`, "i"),
];

// Matchers built from everyday words (tips, direction, authority, out of, don't want). They
// count as rules signals only when the sentence also carries mahjong vocabulary and no
// directory or commerce wording; otherwise "any tips for finding a game in Naples" would be
// answered with hand strategy instead of a search.
export const RULES_TOPIC_SIGNALS_CONDITIONAL: RegExp[] = [
  MISNAMED,
  ORDER,
  LAST_OF_WALL,
  OFFICIAL,
  STRATEGY,
  HAND_SIZE,
  DECLINE_CALL,
  EXPOSURE_WORD,
  new RegExp(`${PICK_VERB.source}[^.?!]{0,20}${AHEAD.source}`, "i"),
  new RegExp(`${MAHJONG_CUE.source}[^.?!]{0,40}${ERROR_CUE.source}|${ERROR_CUE.source}[^.?!]{0,40}${MAHJONG_CUE.source}`, "i"),
  new RegExp(`${TWO_PLAYERS.source}[^.?!]{0,30}\\b(tile|discard|call|calls|mahjong|maj)\\b|\\b(tile|discard)\\b[^.?!]{0,30}${TWO_PLAYERS.source}`, "i"),
];

export const RULES_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "tile-count",
    topic: "Tile count",
    question_patterns: [
      /how many tiles (are|come|do you get|in)/i,
      /tiles? (are|come)? ?in (a|an|the) (american )?(mahjong )?set/i,
      /\b152\b/,
      /tile count/i,
      /what('s| is) in (a|an|the) (american )?(mahjong )?set/i,
      /how many of each/i,
    ],
    keywords: ["152", "tile count", "how many tiles", "full set"],
    approved_answer:
      "An American mahjong set has 152 tiles: the three suits (Bams, Craks, and Dots) numbered 1 through 9 with 4 copies of each tile, 16 winds, 12 dragons, 8 flowers, and 8 jokers.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "suits",
    topic: "Suits",
    question_patterns: [
      /what (are|'re) the suits/i,
      /suits? (in|of) (american )?mahjong/i,
      /\b(bams?|craks?|dots?)\b.{0,30}\bsuits?\b/i,
      /\bsuits?\b.{0,30}\b(bams?|craks?|dots?)\b/i,
      /how many suits/i,
      /\bsuits?\b/i,
    ],
    keywords: ["suits", "bams", "craks", "dots"],
    approved_answer:
      "American mahjong uses three suits: Bams, Craks, and Dots. Each suit runs from 1 to 9, and the set holds 4 copies of every suit tile.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "dragons",
    topic: "Dragons",
    question_patterns: [
      /dragons?/i,
      /\bsoap\b/i,
      /which dragon (goes|matches|belongs)/i,
    ],
    keywords: ["dragon", "soap", "red dragon", "green dragon", "white dragon"],
    // "Soap as zero" is a card-reading question, answered on the notation entry.
    blocks: [/\bzero\b|\b0\b|\byear\b/i],
    approved_answer:
      "American mahjong has three dragons, and each one belongs to a suit: the Red dragon goes with Craks, the Green dragon goes with Bams, and the White dragon, called the Soap, goes with Dots. The set holds 4 of each dragon, 12 dragon tiles in all.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "flowers",
    topic: "Flowers",
    question_patterns: [
      /flowers?(?!\s+mound)/i,
      /are flowers (numbered|interchangeable|the same)/i,
    ],
    keywords: ["flower", "flowers"],
    approved_answer:
      "Flowers are all interchangeable, and they are not numbered. Any flower can stand in for any other flower; a flower is a flower is a flower. An American set has 8 of them.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "winds",
    topic: "Winds",
    question_patterns: [
      /\bwinds?\b/i,
      /north.{0,10}east.{0,10}west.{0,10}south/i,
    ],
    keywords: ["wind", "winds", "north", "south"],
    approved_answer:
      "An American set includes 4 winds: North, East, West, and South, with 4 copies of each for 16 wind tiles in total. Winds do not belong to any suit.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "jokers-basics",
    topic: "Jokers",
    question_patterns: [
      /what (is|are) (a )?jokers?/i,
      /how (do|does) (a )?jokers? work/i,
      /jokers? (wild|rules)/i,
      /\bjokers?\b/i,
    ],
    keywords: ["joker", "jokers", "wild"],
    // This definition never mentions passing. A joker-passing question belongs on
    // the Charleston answer, which carries "You may never pass a joker in the Charleston."
    blocks: [JOKER_PASS],
    approved_answer:
      "Jokers are wild tiles, and they are unique to American mahjong. A joker can stand in for any tile inside a group of 3 or more, meaning a Pung, Kong, Quint, or Sextet. An American set has 8 jokers.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "joker-in-pair",
    topic: "Jokers in pairs and singles",
    question_patterns: [
      /jokers?.{0,60}\b(pairs?|singles?)\b/i,
      /\b(pairs?|singles?)\b.{0,60}jokers?/i,
    ],
    keywords: ["joker", "pair", "single"],
    blocks: [MIXED_GROUP],
    approved_answer:
      "No. A joker can never be used in a pair or as a single tile. Jokers only work inside groups of 3 or more: a Pung, Kong, Quint, or Sextet. Hands built entirely from singles and pairs take no jokers at all.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "joker-exchange",
    topic: "Joker exchange",
    question_patterns: [
      JOKER_EXCHANGE,
      /(exchange[sd]?|exchanging|redeem(s|ed|ing)?|swap(s|ped|ping)?|trad(e|es|ed|ing)).{0,30}jokers?/i,
      /jokers?.{0,30}(exchange[sd]?|exchanging|redeem(s|ed|ing)?|swap(s|ped|ping)?|trad(e|es|ed|ing))/i,
      /take.{0,20}jokers?.{0,30}(exposure|exposed|rack)/i,
    ],
    keywords: ["joker", "exchange", "redeem", "swap"],
    requires: [JOKER, JOKER_EXCHANGE],
    approved_answer:
      "Yes, joker exchange is allowed. When any player has an exposed group on the table that contains a joker, you may, on your own turn, hand over the real tile that joker stands for and take the joker into your hand. You can only redeem a joker from an exposure, never from tiles hidden in another player's hand.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "dealing",
    topic: "Dealing",
    question_patterns: [
      /how many tiles.{0,40}(start|deal|dealt|hand)/i,
      /\bstart with\b/i,
      /who (starts|deals|goes first|is east)/i,
      /\b(13|14) tiles\b/i,
      /\bdealer\b/i,
    ],
    keywords: ["deal", "dealer", "start with", "east", "first"],
    approved_answer:
      "Each player starts with 13 tiles, except East, the dealer, who starts with 14. After the Charleston, East opens play by discarding a tile.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "charleston",
    topic: "The Charleston",
    question_patterns: [
      CHARLESTON_WORD,
      /pass(ing|es)? tiles/i,
      /\btiles?\b[^.?!,;]{0,30}\bpass(es|ed|ing)?\b|\bpass(es|ed|ing)?\b[^.?!,;]{0,30}\btiles?\b/i,
      /\b(first|second|last) (left|right|across)\b/i,
      /\bpassing\b|\bpass (right|left|across)\b|\bthe pass(es)?\b/i,
      /\bcourtesy pass\b/i,
      JOKER_PASS,
    ],
    keywords: ["charleston", "passing"],
    approved_answer:
      "The Charleston is the tile passing that happens before play begins. In the first Charleston, every player passes 3 tiles right, then 3 across, then 3 left; this first round is required. If all four players agree, a second Charleston follows: 3 left, 3 across, 3 right. On the last pass of each Charleston you may pass blind, taking tiles from the pass coming to you without looking at them. Afterward, you and the player across from you may make an optional courtesy pass of up to 3 tiles. You may never pass a joker in the Charleston.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "open-vs-closed",
    topic: "Open and closed hands",
    question_patterns: [
      /\b(open|closed|concealed)\b.{0,20}\bhands?\b/i,
      /\bhands?\b.{0,20}\b(open|closed|concealed)\b/i,
      /what does concealed mean/i,
      /difference between open and closed/i,
    ],
    keywords: ["open hand", "closed hand", "concealed"],
    approved_answer:
      "Open hands can call discards to build exposed groups. Closed hands, also called concealed hands, must be built from your own draws, with no calling to build groups; the only discard a closed hand may claim is the single tile that completes your mahjong.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "closed-hand-final-tile",
    topic: "Closed hand final tile",
    question_patterns: [HAND_CLOSED],
    keywords: ["closed hand", "concealed"],
    requires: [HAND_CLOSED, CLAIM_VERB],
    // "call" also has a naming sense ("what do you call a closed hand?"); that is
    // a definition question, not a claim.
    blocks: [(q: string) => JOKER.test(q) && JOKER_EXCHANGE.test(q), /\bwhat (do|would) (you|we|they) call\b/i],
    approved_answer:
      "A closed (concealed) hand may not call any discard to build a group. The one exception: you may claim a discard when it is the single tile that completes your mahjong.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED_REVIEW,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "charleston-blind-pass",
    topic: "Charleston blind pass",
    question_patterns: [BLIND_PASS],
    keywords: ["blind pass"],
    requires: [BLIND_PASS, PASS_VERB],
    blocks: [blindReadsAsPlace],
    approved_answer:
      "A blind pass is allowed only on the last pass of each Charleston: First Left and, if a second Charleston is played, Last Right. If you do not want to pass three tiles from your own hand, you may take one, two, or all three tiles being passed to you and pass them onward without looking at them. You still pass three tiles total. A blind pass does not override the rule against passing jokers. Do not knowingly include a joker from your own hand. Tiles you pass on blindly must remain unseen.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED_REVIEW,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "calling-discard",
    topic: "Calling a discard",
    question_patterns: [
      /call(ing)? (a |the )?(discard|tile)/i,
      /when can (i|you) call/i,
      /\b(allowed|able|permitted|ok|okay) to call\b|\bhow (does|do) (calling|calls|a call) work\b|\bcalling (rules?|work)\b|\brules? (for|of|about|on) calling\b/i,
      /(pick up|claim|take).{0,20}(discard|thrown tile)/i,
      /\bdiscards?\b/i,
    ],
    keywords: ["call", "discard", "claim"],
    approved_answer:
      "You may call the most recent discard when you can use it right away in an exposed group of 3 or more identical tiles, with jokers allowed to fill in, or when it completes your mahjong. When you call for a group, you must place that group face up on your rack. A call for mahjong beats a call for an exposure.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note:
      "The card closes the calling window once the player next in turn has picked and racked, or discarded; some tables police that moment loosely, so confirm your table follows the card.",
    source: SOURCE,
    last_verified: VERIFIED_WORDING,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "winning-mahjong",
    topic: "Winning (declaring mahjong)",
    question_patterns: [
      /how (do|does|can) (i|you|we|someone|a player) (actually |even |really )?win/i,
      /\bwin the game\b/i,
      /what (is|does) mahjong( mean)?/i,
      /declar(e|ing) mahjong/i,
      /winning hand/i,
      /what counts as (a win|mahjong)/i,
    ],
    keywords: ["win", "winning", "declare", "mahjong means"],
    approved_answer:
      "You win by completing a 14 tile hand that exactly matches one of the hands printed on the current National Mah Jongg League card, then declaring mahjong. The 14th tile can come from your own draw or from a called discard.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "annual-card",
    topic: "The annual NMJL card",
    question_patterns: [
      /(new|annual|yearly|current|next).{0,15}\bcard\b/i,
      /\bcard\b.{0,25}(come(s)? out|release|publish)/i,
      /when.{0,30}\bcard\b/i,
      /what is the (nmjl |league )?card/i,
    ],
    keywords: ["card", "nmjl", "league"],
    approved_answer:
      "The National Mah Jongg League publishes a new official card every spring. The card lists the hands you can win with, and those hands change every year, so players buy the new card each season directly from the League.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "the-wall",
    topic: "The wall",
    question_patterns: [
      /\bwalls?\b/i,
      /build(ing)? the wall/i,
      /how (is|are) the (tiles|wall) (set|built|arranged)/i,
    ],
    keywords: ["wall", "walls"],
    approved_answer:
      "After all 152 tiles are shuffled face down, each player builds a wall 19 tiles long and 2 tiles high. The four walls together hold the whole set, and every deal and draw comes from the wall.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "wall-game",
    topic: "Wall game (no winner)",
    question_patterns: [
      /wall game/i,
      /(nobody|no one|no body) (wins|won|declared|declares|got|gets) ?(mahjong|maj)?/i,
      /run(s|ning)? out of tiles/i,
      /end(s)? in a (draw|tie)/i,
    ],
    keywords: ["wall game", "draw", "no winner"],
    approved_answer:
      "If the wall runs out of tiles before anyone declares mahjong, the hand ends with no winner. This is called a wall game, and no one scores it.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note:
      "Tables differ on whether the same dealer deals again after a wall game.",
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "players-count",
    topic: "Number of players",
    question_patterns: [
      /how many (players|people)/i,
      /play with (three|3|five|5|two|2)/i,
      /\b(three|3|five|5|two|2) (people|players|of us)\b/i,
      /number of players/i,
      /\b(three|3)[- ](player|person|handed)\b/i,
    ],
    keywords: ["players", "people", "how many players"],
    approved_answer:
      "American mahjong is built for 4 players. Many groups adapt it when only 3 can play, but the standard game seats 4.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note:
      "Adaptations for 3 players vary from table to table; agree on the format before you start.",
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "courtesies-vs-rules",
    topic: "Rules versus table courtesies",
    question_patterns: [
      /(table|house) rules/i,
      /courtes(y|ies)/i,
      /etiquette/i,
      /rules? (vs|versus|or) (courtes|custom)/i,
    ],
    keywords: ["etiquette", "courtesy", "house rules", "table rules"],
    // The courtesy pass itself is described on its own entry.
    blocks: [/\bcourtesy pass\b/i, BLANK],
    approved_answer:
      "It helps to separate official rules from table courtesies. Official rules come from the National Mah Jongg League and apply everywhere, such as the tile count, how calling works, and the courtesy pass, which is an optional League rule any player may decline. Courtesies are local customs a table agrees on, such as how a wall game is paid or whether the same dealer deals again. Agree on courtesies before the first hand so no one is surprised.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note: "Courtesies differ from table to table by design.",
    source: SOURCE,
    last_verified: VERIFIED_WORDING,
    confidence: "high",
    classification: "etiquette",
    provenance: OWNER,
  },
  {
    id: "dead-hand",
    topic: "Dead hands",
    question_patterns: [
      /dead hand/i,
      /declar(e|ed|ing) (a hand |someone )?dead/i,
      /hand (is |goes )?dead/i,
    ],
    keywords: ["dead hand", "dead"],
    approved_answer:
      "A hand is dead when it can no longer win, for example when a player holds the wrong number of tiles or has exposures that cannot fit any hand on the card. A dead player stops drawing and discarding for the rest of that hand. Calling another player's hand dead is a formal challenge, so be sure you are right before you make it.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note:
      "Tables enforce dead hand challenges with different levels of strictness.",
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "medium",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },

  // Entries added by the 2026-08-30 truth-layer audit. Each answer is written for this
  // site and states only what the located League rule supports.
  {
    id: "calling-for-mahjong",
    topic: "Calling a discard for mahjong",
    question_patterns: [MAHJONG_CUE, CLAIM_VERB],
    keywords: ["mahjong", "win", "call", "discard"],
    requires: [CLAIM_VERB, MAHJONG_CUE],
    // Closed-hand and false-mahjong questions have their own answers.
    blocks: [HAND_CLOSED, ERROR_CUE, TWO_PLAYERS, OWN_DISCARD, JOKER],
    approved_answer:
      "Yes. Any discard that completes your mahjong may be called, including a tile that finishes a pair or fills a single, and a concealed hand may call it too. The one tile no one may ever call is a discarded joker. Say mahjong, take the tile, and show your hand. A call for mahjong beats a call for an exposure, and the chance to call ends once the next player has drawn and racked a tile.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rule on calling any tile for mahjong; cross-checked via Mahj Life wiki article 178 and the owner-approved calling and closed-hand entries", 2024),
  },
  {
    id: "calling-for-exposure",
    topic: "Calling a discard for an exposure",
    question_patterns: [EXPOSURE_CUE, CLAIM_VERB],
    keywords: ["exposure", "call", "pung", "kong"],
    requires: [CLAIM_VERB, EXPOSURE_CUE],
    blocks: [HAND_CLOSED, TWO_PLAYERS, OWN_DISCARD, JOKER_EXCHANGE, /\bpairs?\b/i, QUINT_SEXTET, MISNAMED],
    approved_answer:
      "You may call a discard to build an exposure when the tiles already in your hand, with jokers allowed, make it a group of 3 or more identical tiles: a Pung, a Kong, or a larger group. Say call, take the tile, and place the whole group face up on top of your rack, then discard. You cannot call a discard to make a pair unless that tile completes your mahjong, and a hand marked concealed cannot call for an exposure at all. The call is committed as soon as the called tile goes on your rack or you expose tiles from your hand. You may fix a mistake in that exposure only until you discard or exchange a joker; after either, it is locked.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rules on exposures and commitment to a called discard; cross-checked via Mahj Life wiki articles 177, 178, and 289", 2024),
  },
  {
    id: "calling-for-pair",
    topic: "Calling a discard for a pair",
    question_patterns: [/\bpairs?\b/i, CLAIM_VERB],
    keywords: ["pair", "call", "discard"],
    requires: [CLAIM_VERB, /\bpairs?\b/i],
    blocks: [JOKER, HAND_CLOSED, TWO_PLAYERS, OWN_DISCARD],
    approved_answer:
      "Not to build a pair. Pairs are never exposed, so a discard may only be called for a group of 3 or more. The one exception is mahjong: if that tile completes your hand, you may call it even though it finishes a pair or a single.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rule that a call is never made for a single or pair except for mahjong; cross-checked via Mahj Life wiki article 178", 2024),
  },
  {
    id: "joker-in-mixed-groups",
    topic: "Jokers in runs, years, and NEWS",
    question_patterns: [JOKER, MIXED_GROUP],
    keywords: ["joker", "news", "year", "run"],
    requires: [JOKER, MIXED_GROUP],
    blocks: [JOKER_EXCHANGE, JOKER_PASS, DISCARDED],
    approved_answer:
      "A joker never stands in for one of the single tiles that make up a mixed group: a run like 1 2 3, a year, the four winds together, or any line of singles, even though those groups have 3 or more tiles. In a hand that includes such a group, jokers can still fill that hand's Pungs, Kongs, Quints, or Sextets. The mixed group itself must be built from the real tiles.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rulebook rule that jokers are never used in a block of single tiles; follows from the owner-approved joker entries; cross-checked via Mahj Life wiki article 221", 2024),
  },
  {
    id: "joker-discarded",
    topic: "Discarded jokers",
    question_patterns: [JOKER, DISCARDED],
    keywords: ["joker", "discard"],
    requires: [JOKER, DISCARDED],
    blocks: [JOKER_EXCHANGE, JOKER_PASS, /\bpairs?\b/i, MISNAMED],
    approved_answer:
      "You may discard a joker on your turn, but once a joker is discarded it is out of the game. No one may call a discarded joker for any reason, not for an exposure and not for mahjong, and it cannot be picked up later through a joker exchange.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rule that a discarded joker may not be taken for any purpose; cross-checked via Mahj Life wiki articles 178 and 221", 2024),
  },
  {
    id: "joker-exchange-timing",
    topic: "When a joker exchange is allowed",
    question_patterns: [JOKER_EXCHANGE, TIMING, ERROR_CUE],
    keywords: ["joker", "exchange", "turn"],
    requires: [JOKER, JOKER_EXCHANGE, new RegExp(`${TIMING.source}|${ERROR_CUE.source}|\\b(own|my|your) (rack|exposure)\\b`, "i")],
    blocks: [DEAD],
    approved_answer:
      "You may exchange a joker only during your own turn, after you have drawn from the wall or called a discard and before you discard. Hand over the tile the joker stands for and take the joker; you may redeem a joker from any exposure on the table, including your own. Once you discard, the chance passes until your next turn. If an exchange puts the wrong tile into an exposure, fix it before the next discard; after that discard, only the hand holding the incorrect exposure is dead. If you put the wrong tile into your own exposure, that dead hand is yours.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "medium",
    classification: "nmjl_clarification",
    provenance: researched("League rules on joker exchange timing and a wrong exchange (fixable before the next discard; then the hand holding the incorrect exposure is dead); Mahj Life wiki articles 172, 221, 224 citing the rulebook and 2024 bulletin; Sloperama FAQ corroborates", 2024),
  },
  {
    id: "two-players-same-tile",
    topic: "Two players want the same discard",
    question_patterns: [TWO_PLAYERS],
    keywords: ["same tile", "both", "hold", "wait", "priority"],
    requires: [TWO_PLAYERS, TWO_PLAYERS_ASK],
    blocks: [ERROR_CUE, BLIND_PASS, CHARLESTON_WORD],
    approved_answer:
      "When more than one player wants the same discard, a call for mahjong wins over a call for an exposure. If both want it for the same reason, the player whose turn comes next gets it. Saying hold or wait counts the same as saying call; the word you use does not change who has priority. A player who hesitates can lose the tile once another player has claimed it and racked it.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rule on concurrent claims (mahjong first, then next in turn); cross-checked via Mahj Life wiki articles 264 and 281 and the owner-approved calling entry", 2025),
  },
  {
    id: "own-discard",
    topic: "Calling your own discard",
    question_patterns: [OWN_DISCARD],
    keywords: ["own discard", "take back"],
    requires: [OWN_DISCARD],
    approved_answer:
      "No. You may never call back a tile you just discarded, for any purpose, including mahjong or a joker exchange. Once you have named it or placed it in the discard area, it is available only to the other players.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League ruling that a player cannot claim their own discard; cross-checked via Mahj Life wiki article 245", 2020),
  },
  {
    id: "naming-discards",
    topic: "Naming a discard",
    question_patterns: [NAMING, DISCARDED],
    keywords: ["name", "announce", "discard", "same"],
    requires: [NAMING, new RegExp(`${DISCARDED.source}|\\bsame\\b`, "i")],
    blocks: [MISNAMED, HAND_CLOSED],
    approved_answer:
      "Name each tile aloud as you place it face up in the discard area, since naming it is what lets the other players call it. When your discard matches the tile discarded just before it, the League accepts saying same as well as naming the tile.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "nmjl_clarification",
    provenance: researched("League rule that discards are named; 2024 bulletin ruling accepting 'same' for a repeat discard, cross-checked via Mahj Life wiki article 242", 2024),
  },
  {
    id: "misnamed-discard",
    topic: "Misnamed discards",
    question_patterns: [MISNAMED],
    keywords: ["misnamed", "wrong name"],
    requires: [MISNAMED],
    approved_answer:
      "Misnaming a discard carries its own League rules. Our instructor is confirming the exact ruling before we publish it here. Until then, ask your table to apply the League's rulebook to that situation rather than a table custom.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "owner_question",
    last_verified: VERIFIED_AUDIT,
    confidence: "medium",
    classification: "nmjl_clarification",
    provenance: ownerQuestion("Exact League penalty for a misnamed discard (corrected before or after another player acts on it)"),
  },
  {
    id: "mahjong-in-error",
    topic: "Mahjong declared in error",
    question_patterns: [MAHJONG_CUE, ERROR_CUE],
    keywords: ["mahjong", "error", "mistake", "false"],
    requires: [MAHJONG_CUE, ERROR_CUE],
    blocks: [JOKER_EXCHANGE, MISNAMED, TWO_PLAYERS],
    approved_answer:
      "A mahjong declared in error is covered by specific League rules. Our instructor is confirming the exact current wording before we publish it here. Until then, ask your table to apply the League's rulebook to that deal rather than a table custom.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "owner_question",
    last_verified: VERIFIED_AUDIT,
    confidence: "medium",
    classification: "standard_nmjl_rule",
    provenance: ownerQuestion("Mahjong declared in error with tiles exposed: is the hand dead outright, or may the declaration be retracted with the exposed tiles staying committed (League rulebook 2024); secondary summaries disagree (Mahj Life wiki articles 189, 197, 216)"),
  },
  {
    id: "dead-hand-details",
    topic: "What makes a hand dead",
    question_patterns: [DEAD, DEAD_DETAIL],
    keywords: ["dead", "too many tiles", "wrong number"],
    requires: [DEAD, DEAD_DETAIL],
    blocks: [JOKER_EXCHANGE, ERROR_CUE],
    approved_answer:
      "A hand goes dead when it can no longer win: holding the wrong number of tiles after East's first discard, making an exposure that fits no hand on the card, or exposing tiles for a hand marked concealed. A dead player stops drawing and discarding but still pays the winner of that deal. You do not declare your own hand dead; the other players do. After East's first discard, a wrong tile count cannot be fixed.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note:
      "Tables enforce dead hand challenges with different levels of strictness.",
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rules on dead hands and the wrong number of tiles; cross-checked via Mahj Life wiki articles 189 and 205 and the owner-approved dead hand entry", 2024),
  },
  {
    id: "dead-hand-jokers",
    topic: "Jokers in a dead hand's exposures",
    question_patterns: [DEAD, JOKER],
    keywords: ["dead", "joker", "exchange"],
    requires: [DEAD, JOKER],
    approved_answer:
      "Whether a joker sitting in a dead player's exposure can still be redeemed is a point our instructor is confirming against the League's rulebook before we publish it here. Until then, ask your table to follow the League's rulebook for that deal.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "owner_question",
    last_verified: VERIFIED_AUDIT,
    confidence: "medium",
    classification: "nmjl_clarification",
    provenance: ownerQuestion("May a joker in a dead player's exposure be exchanged, and does it matter whether that exposure is the one that made the hand dead"),
  },
  {
    id: "picking-ahead",
    topic: "Picking ahead",
    question_patterns: [PICK_VERB, AHEAD],
    keywords: ["pick ahead", "out of turn", "draw early"],
    requires: [PICK_VERB, AHEAD],
    blocks: [CHARLESTON_WORD, BLIND_PASS],
    approved_answer:
      "Wait your turn. You may not draw your tile from the wall until the player before you has discarded; picking ahead is against League rules. If a tile was picked too early, stop and let the table sort it out before anyone else plays.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rule against picking ahead; cross-checked via Mahj Life wiki articles 59, 189, and 209", 2024),
  },
  {
    id: "order-of-play",
    topic: "Order of play",
    question_patterns: [ORDER],
    keywords: ["order", "turn", "direction", "next"],
    requires: [ORDER],
    blocks: [CHARLESTON_WORD, ERROR_CUE, TWO_PLAYERS],
    approved_answer:
      "East starts the deal by discarding. Turns then move to the right, counterclockwise around the table: East, then South, then West, then North. On your turn you either draw the next tile from the wall or call the most recent discard, then you discard one tile face up and name it. You hold 13 tiles between turns and 14 during your turn.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League turn order (East, South, West, North, play to the right); cross-checked via Mahj Life wiki articles 170 and 239 and the owner-approved dealing entry", 2024),
  },
  {
    id: "hand-size",
    topic: "How many tiles you hold",
    question_patterns: [HAND_SIZE, /how many tiles/i],
    keywords: ["how many tiles", "hand", "rack"],
    requires: [HAND_SIZE],
    blocks: [DEAD, JOKER, /\bpairs?\b|\bsingles?\b|\bexpos|\bdealer\b|\beast\b/i],
    approved_answer:
      "You hold 13 tiles between turns. When you draw or call, you have 14; after you discard, you are back to 13. A finished mahjong is 14 tiles. Count quietly whenever you are unsure, because the wrong number of tiles once play has begun makes a hand dead.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("Follows from the owner-approved dealing and winning entries; cross-checked via Mahj Life wiki article 205", 2024),
  },
  {
    id: "courtesy-pass",
    topic: "The courtesy pass",
    question_patterns: [COURTESY],
    keywords: ["courtesy pass", "across"],
    requires: [COURTESY, PASS_VERB],
    approved_answer:
      "The courtesy pass is optional and comes after the Charleston, before East's first discard. You and the player across from you may exchange 1, 2, or 3 tiles. You both must agree on the number, so the smaller number wins, and either of you may decline. No jokers may be passed.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League courtesy pass rule as already stated in the owner-approved Charleston and courtesies entries; cross-checked via Mahj Life wiki article 179", 2024),
  },
  {
    id: "charleston-stop",
    topic: "Stopping the Charleston",
    question_patterns: [CHARLESTON_WORD, STOP_OR_AGREE],
    keywords: ["stop", "charleston", "second charleston", "optional"],
    requires: [new RegExp(`${CHARLESTON_WORD.source}|\\bpass(es|ed|ing)?\\b`, "i"), STOP_OR_AGREE],
    blocks: [BLIND_PASS, COURTESY, JOKER, DISCARDED],
    approved_answer:
      "The first Charleston, three passes, is required and cannot be stopped once it begins. The second Charleston happens only if all four players agree, which is the same rule as saying any one player may stop it before it starts, without giving a reason. It can still be stopped after tiles for its first pass are put down, as long as nobody has looked at them; once a pass has been seen, that Charleston continues to the end. A courtesy pass can still be offered after a stop.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rule on stopping the Charleston (bulletins and the League rulebook); cross-checked via Mahj Life wiki articles 179 and 193", 2024),
  },
  {
    id: "passing-on-a-discard",
    topic: "Passing on a discard",
    question_patterns: [DECLINE_CALL],
    keywords: ["have to call", "skip", "ignore"],
    requires: [DECLINE_CALL],
    blocks: [CHARLESTON_WORD, BLIND_PASS, COURTESY, JOKER],
    approved_answer:
      "You never have to call a discard. If you do not want it, say nothing and let play continue. Once the next player has drawn and racked a tile, that discard is out of reach for everyone.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("Follows from the owner-approved calling entry (calling is a choice; the window closes when the next player racks)", 2024),
  },
  {
    id: "payments-basics",
    topic: "Payments after a win",
    question_patterns: [PAYMENT],
    keywords: ["pay", "double", "score", "jokerless"],
    requires: [PAYMENT],
    blocks: [ERROR_CUE, MISNAMED, DEAD, TOURNAMENT],
    approved_answer:
      "Every hand on the card shows its value, and the League's rulebook sets who pays and how much, depending on whether the winning tile came from a discard or from the wall and whether the hand used jokers. Agree at your table before the first hand whether you play for money or for points. By League rule a wall game pays nothing.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note:
      "Some tables add their own bonuses or play for points instead of money.",
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League payment rules exist in the rulebook (amounts held back pending the owner's wording decision, question 10); wall game pays nothing per the owner-approved wall-game entry; cross-checked via Mahj Life wiki articles 98 and 208", 2024),
  },
  {
    id: "quints-sextets",
    topic: "Quints and sextets",
    question_patterns: [QUINT_SEXTET],
    keywords: ["quint", "sextet"],
    requires: [QUINT_SEXTET],
    blocks: [CLAIM_VERB, /\bpairs?\b/i],
    approved_answer:
      "A quint is 5 identical tiles and a sextet is 6. A set holds only 4 of any suit tile, wind, or dragon, so a quint of those always needs at least 1 joker and a sextet at least 2. Flowers are the exception: all 8 are interchangeable, so a flower quint or sextet can be made without jokers.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ARITHMETIC,
  },
  {
    id: "calling-quints-sextets",
    topic: "Calling a discard for a quint or sextet",
    question_patterns: [QUINT_SEXTET, CLAIM_VERB],
    keywords: ["quint", "sextet", "call"],
    requires: [QUINT_SEXTET, CLAIM_VERB],
    approved_answer:
      "Yes. A discard may be called to complete any group of 3 or more identical tiles, and that includes a Quint or a Sextet, as long as the tiles already in your hand, with jokers allowed, make up the rest of the group. The whole group then goes face up on your rack. A hand marked concealed cannot call for any exposure.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rulebook and bulletin rule that a discard may be claimed to expose a pung, kong, quint, or sextet; consistent with the owner-approved calling entry (3 or more identical tiles); cross-checked via Mahj Life wiki articles 146 and 221", 2020),
  },
  {
    id: "exposures-basics",
    topic: "Exposures",
    question_patterns: [EXPOSURE_WORD],
    keywords: ["exposure", "expose", "rack"],
    requires: [EXPOSURE_WORD],
    blocks: [CLAIM_VERB, JOKER_EXCHANGE, HAND_CLOSED, DEAD, TWO_PLAYERS],
    approved_answer:
      "An exposure is a group you called: the discard plus the matching tiles from your hand, placed face up on top of your rack. Only a Pung, Kong, Quint, or Sextet can be exposed, never a pair. You may fix a mistake in an exposure only until you discard or exchange a joker; after either, it is locked, and the only later change is a player redeeming a joker in it. Every exposure must fit one hand on the card, and if your exposures cannot all fit the same hand, your hand is dead. A hand marked concealed makes no exposures.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rules on exposures, modifying an exposure before discarding, and dead hands; cross-checked via Mahj Life wiki articles 177, 189, and 254", 2024),
  },
  {
    id: "card-notation",
    topic: "Reading the card (colors and letters)",
    question_patterns: [CARD_WORD, NOTATION],
    keywords: ["card", "color", "concealed", "exposed", "soap"],
    requires: [new RegExp(`${CARD_WORD.source}|\\bzero\\b|${CX_LETTERS.source}`, "i"), NOTATION],
    blocks: [/\b(come(s)? out|release|publish|new card|next card|when)\b/i],
    approved_answer:
      "On the card, each color stands for a different suit, not a fixed one: a hand shown in a single color uses one suit, and a hand shown in three colors uses three different suits. C after a hand means it must be played concealed; X means exposures are allowed. F stands for a flower, D for a dragon, and the winds appear by their first letters. Jokers are never printed in a hand; they stand in for tiles inside any group of 3 or more identical tiles. In hands that show a year or another number with a zero, the Soap plays the zero.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "nmjl_clarification",
    provenance: researched("Card legend conventions (colors as suits, C and X, F and D, Soap as zero); cross-checked via Mahj Life wiki articles 162, 254, and 269", 2026),
  },
  {
    id: "tournament-rules",
    topic: "Tournament rules versus standard play",
    question_patterns: [TOURNAMENT],
    keywords: ["tournament", "director"],
    requires: [TOURNAMENT],
    approved_answer:
      "Tournaments play by National Mah Jongg League rules as the foundation, but each tournament director adds procedures of their own: timed rounds, a point system, and penalties for things like misnamed discards. Those rules apply only at that event and never change the League's rules for regular play. At a tournament, the director's rule governs; away from it, the League rule does.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "tournament_rule",
    provenance: researched("Tournament conventions layered on League rules; cross-checked via Mahj Life wiki article 186", 2024),
  },
  {
    id: "blank-tiles",
    topic: "Blank tiles",
    question_patterns: [BLANK],
    keywords: ["blank", "blanks"],
    requires: [BLANK],
    approved_answer:
      "Blank tiles are not part of League play. They come with many sets as spares to replace a lost tile. Some tables use them as a house rule, usually letting a player trade a blank for a tile in the discard area. If your table plays with blanks, agree on the details before the first hand, and remember that a table using them is not playing standard League rules.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note: "Blank rules differ from table to table by design.",
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "house_optional_rule",
    provenance: researched("Blanks as a house variation outside League rules; cross-checked via Mahj Life wiki article 279", 2025),
  },
  {
    id: "last-tile-of-wall",
    topic: "The last tiles of the wall",
    question_patterns: [LAST_OF_WALL],
    keywords: ["last tile", "wall runs out"],
    requires: [LAST_OF_WALL],
    blocks: [HAND_CLOSED, CLAIM_VERB],
    approved_answer:
      "Play continues until the wall is used up. If the last tile is drawn and discarded and no one has declared mahjong, the deal ends as a wall game and no one pays. The final tile drawn from the wall can still win for the player who draws it, and the last discard of the deal can still be called for mahjong.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("Follows from the owner-approved wall game and winning entries; the mahjong call on the last discard is the League's any-tile-for-mahjong rule, cross-checked via Mahj Life wiki articles 178 and 189", 2024),
  },
  {
    id: "rules-source",
    topic: "Where the official rules come from",
    question_patterns: [OFFICIAL],
    keywords: ["official", "league", "rulebook"],
    requires: [OFFICIAL],
    blocks: [CARD_WORD, TOURNAMENT],
    approved_answer:
      "American mahjong's official rules come from the National Mah Jongg League: the card it publishes every spring and its rulebook, Mah Jongg Made Easy, along with the rulings in its bulletins. Find My Mahj answers only from those rules; our instructor is reviewing every answer we add, and when a ruling is still being confirmed the answer says so. We also say so whenever something is a table courtesy or a house rule instead of a League rule.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "nmjl_clarification",
    provenance: researched("The League's own description of its role and publications (nationalmahjonggleague.org)", 2026),
  },
  {
    id: "hand-choice-strategy",
    topic: "Choosing a hand (strategy)",
    question_patterns: [STRATEGY],
    keywords: ["strategy", "which hand", "tips"],
    requires: [STRATEGY],
    approved_answer:
      "Choosing a hand is strategy, not a rule, so there is no single right answer. A common approach: after the deal, sort your tiles by suit and by number, look for the card section your tiles already lean toward, keep two or three candidate hands open through the Charleston, and commit once an exposure would lock you in. Play the tiles you have, not the hand you wish you had.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "medium",
    classification: "strategy",
    provenance: researched("General instructional strategy, not a League rule; cross-checked via Mahj Life wiki article 183", 2024),
  },
];
