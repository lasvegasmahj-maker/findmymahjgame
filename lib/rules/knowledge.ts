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
const OWNER_DECIDED = "2026-08-30" as const;

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

// The owner approved these answers on 2026-08-30 after reading the research; the research
// trail stays on the entry so the basis is never lost.
function ownerApproved(ref: string, year?: number): Provenance {
  return {
    source_type: "owner_approved",
    source_title: "Owner approved 2026-08-30 on the researched basis below (certified American mahjong instructor)",
    source_ref: ref,
    ...(year ? { source_year: year } : {}),
    owner_review_required: false,
    evidence: "verified",
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
  /\bmis-?nam(e|ed|es|ing)\b|\bwrong name\b|\bnamed (it|the tile|a tile|my discard|the discard) wrong(ly)?\b|\bcalled it (the )?wrong\b|\bsaid the wrong tile\b|\bwrong tile name\b|\bnamed the wrong\b|\bmisspoke\b|\bcalled (it|the tile|my discard) (a|an) \w+ by mistake\b|\bannounced (it|the tile) (as )?the wrong\b|\bcalled it (a|an) [^.?!]{1,20} but (it was|it's|its|it is)\b|\bsaid [^.?!]{1,15} but (it was|it's|it is)\b|\bnamed it (a|an) [^.?!]{1,20}\bbut\b|\b(called|named|said) it (a|an|the) ?[\w ]{1,14}\bbut (it was|it'?s|its|it is|she|he|they|threw|discarded|actually)\b/i;
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

const THREE_PLAYER =
  /\b(three|3)[- ](player|handed|person|handed)\b|\b(three|3) (people|players|of us)\b|\bplay(ing)? with (just )?(three|3)\b|\bonly (three|3)\b|\bmissing a (fourth|4th)\b|\bwithout a (fourth|4th)\b/i;
const THREE_PLAYER_HOW =
  /\b(procedure|how|deal|deals|dealt|dealing|set ?up|start|starts|walls?|charleston|tiles?|rules?|official|work|works|count|counts|pass|passes|passing|play|still)\b/i;
const WRONG_COUNT =
  /\b(wrong number|wrong count|miscount|too many tiles|too few tiles|12 tiles|14 tiles|short a tile|missing a tile|extra tile|one too many|one too few|short one)\b/i;
const BEFORE_PLAY =
  /\b(before (east|the first discard|play|we start)|charleston|courtesy pass|deal|dealt|dealing|re-?deal|redeal|start|starts|started|begins?|beginning|first discard)\b/i;
const HOLD_WAIT = /\b(hold|wait)\b(?!\s+(a |the )?(spot|seat|place|table|room))/i;
const HOLD_WAIT_ASK =
  /\b(call|calls|called|claim|claims|count|counts|mean|means|legal|legally|stop|stops|priority|say|says|saying|said|shout|shouted|allowed|same as|instead of)\b/i;
const SETTLEMENT =
  /\b(pay|pays|paid|paying|payment|payments|settle|settles|settled|settlement|owe|owes|collect|collects|value|double|penalty|penalties|throw(n)? in|threw in|toss(ed)? in)\b/i;
// Only the deal's final discard, never the most recent one: "her last discard finishes my
// pung" is an ordinary calling question and must not reach the end-of-wall answer.
const FINAL_DISCARD_SCENE =
  /\b(last|final) (discard|tile)\b(?=[^.?!]{0,40}\b(wall|deal|game|end|empty|left)\b)|\b(wall|deal|game|end|empty)\b[^.?!]{0,40}\b(last|final) (discard|tile)\b|\bwall is (empty|gone|out|used up)\b|\bwall runs out\b|\bno tiles left\b|\bout of tiles\b|\bend of the wall\b|\bnothing left to draw\b/i;

// Shared by the route, the Ask box, and the clarification engine so they cannot drift.
export const VARIANT_RE =
  /\b(riichi|japanese|chinese|hong ?kong|cantonese|sichuan|taiwanese|korean|filipino|singapor(e|ean)|mcr|zung ?jung)\b/i;
export const AMERICAN_RE = /\b(american|nmjl|national (mah ?jongg?|mahjong) league)\b/i;
// A capitalized style word after a preposition ("in American mahjong", "in Chinese") is not a place.
const STYLE_WORD =
  /\b(american|nmjl|riichi|japanese|chinese|hong ?kong|cantonese|sichuan|taiwanese|korean|filipino|singapor(e|ean)|mcr|zung ?jung|mahjong|mah ?jongg?|charleston|league)\b/i;
const PLACE_AFTER_PREP_RAW = /\b(in|near|around|at|to) [A-Z][a-z]+/;
export function placeAfterPrep(q: string): boolean {
  const m = PLACE_AFTER_PREP_RAW.exec(q);
  return !!m && !STYLE_WORD.test(m[0]);
}

// Concept matchers the shared Ask box may treat as rules signals on their own: each one
// names a mahjong-only idea, so a directory question cannot trip it.
export const RULES_TOPIC_SIGNALS: RegExp[] = [
  OWN_DISCARD,
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
  BLANK,
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
      /\b(what|which|name|the) suits?\b/i,
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
    blocks: [HAND_CLOSED, ERROR_CUE, TWO_PLAYERS, OWN_DISCARD, JOKER, MISNAMED],
    approved_answer:
      "Yes. Any discard that completes your mahjong may be called, including a tile that finishes a pair or fills a single, and a concealed hand may call it too. The one tile no one may ever call is a discarded joker. Say mahjong, take the tile, and show your hand. A call for mahjong beats a call for an exposure, and the chance to call ends once the next player has drawn and racked a tile, or discarded.",
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
    blocks: [HAND_CLOSED, TWO_PLAYERS, OWN_DISCARD, JOKER_EXCHANGE, /\bpairs?\b/i, QUINT_SEXTET, MISNAMED, FINAL_DISCARD_SCENE],
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
      "A joker never stands in for one of the single tiles that make up a mixed group: a run like 1 2 3, a year, NEWS with one of each wind, or any line of singles, even though those groups have 3 or more tiles. In a hand that includes such a group, jokers can still fill that hand's Pungs, Kongs, Quints, or Sextets. The mixed group itself must be built from the real tiles.",
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
      "You may exchange a joker only during your own turn, after you have drawn from the wall or called a discard and before you discard. Hand over the tile the joker stands for and take the joker; you may redeem a joker from any exposure on the table, including your own. Once you discard, the chance passes until your next turn. If an exchange puts the wrong tile into an exposure, fix it before the next discard and there is no penalty.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "nmjl_clarification",
    provenance: ownerApproved("League rulings on exchange timing and own-rack redemption; the wrong-tile consequence has its own entry per bulletin 2024 FAQ #10 and rulebook 2024 p.24 #14; via Mahj Life 172, 221, 224 and Sloperama FAQ", 2024),
  },
  {
    id: "joker-exchange-wrong-tile",
    topic: "A joker exchanged for the wrong tile",
    question_patterns: [JOKER_EXCHANGE, ERROR_CUE],
    keywords: ["joker", "exchange", "wrong tile"],
    requires: [JOKER, JOKER_EXCHANGE, ERROR_CUE],
    approved_answer:
      "Catch it before the next discard and there is no penalty: take the wrong tile back, put the right one in, and play continues. Once that discard has been made and the exposure is still wrong, the player whose rack holds the incorrect exposure has a dead hand for that deal. The player who handed over the wrong tile keeps playing and owes nothing, because the League makes each player responsible for the exposures on their own rack. A dead player stops drawing and discarding and still pays the winner. Keep this separate from a different rule: changing an otherwise valid exposure after you have completed a joker exchange is not allowed, and that has nothing to do with fixing an exchange that went wrong. You can avoid the whole problem by announcing the exchange before anyone touches a tile and passing the tile from hand to hand, so you both see it.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("NMJL Bulletin 2024 FAQ #10 with rulebook 2024 p.24 #14: correctable before the next discard, then the holder of the incorrect exposure is disqualified while the giver plays on; via Mahj Life 224, 37, 172, 221 and Sloperama FAQ", 2024),
  },
  {
    id: "two-players-same-tile",
    topic: "Two players want the same discard",
    question_patterns: [TWO_PLAYERS],
    keywords: ["same tile", "both", "hold", "wait", "priority"],
    requires: [TWO_PLAYERS, TWO_PLAYERS_ASK],
    blocks: [ERROR_CUE, BLIND_PASS, CHARLESTON_WORD],
    approved_answer:
      "When more than one player wants the same discard, a call for mahjong wins over a call for an exposure. If both want it for the same reason, the player whose turn comes next gets it. Which word you use does not change that order, so hold, wait, and call all carry the same weight for priority. A player who hesitates can lose the tile once another player has claimed it and then racked it or exposed tiles.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rule on concurrent claims (mahjong first, then next in turn) and on word choice not setting priority; located and cross-checked via Mahj Life wiki articles 57, 264, 281 and the owner-approved calling entry", 2025),
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
      "Name every discard aloud as you place it face up, because the correct name is what makes the tile claimable. When your tile repeats the discard just before it, the League accepts saying same. If you say the wrong name, fix it with words only: state the correct name of the tile you actually threw. Never swap tiles, even if the tile you named by mistake sits in your hand. Once you correct the name and nobody has acted on the error, play continues with no penalty and any player may claim the tile normally. A call made on the wrong name does not stand, so if a player wanted the tile only for an exposure, correct the name and play on. If a player declares mahjong based on the wrong name, the deal ends there: you alone pay that player 4 times the value of the hand, and the other two players pay nothing. That penalty applies even when the tile you threw was really a joker, because the claim rests on what you said. If two players declare mahjong at once, one on the wrong name and one needing the tile you actually threw, the player who needs the actual tile wins. If nobody catches the misname before the next player picks and racks, the chance to claim that tile is gone and nobody pays a penalty. Watch each discard with your eyes, not just your ears.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook misnamed discard rule (2023 p.16 r.3, 2020 p.19 r.6, 2024 pp.16, 17, 19) and the card back Miscalled Tile section; repeat-discard naming per the 2024 bulletin Q12; located and cross-checked via Mahj Life wiki articles 67, 80, 189, 242 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "mahjong-in-error",
    topic: "Mahjong declared in error",
    question_patterns: [MAHJONG_CUE, ERROR_CUE],
    keywords: ["mahjong", "error", "mistake", "false"],
    requires: [MAHJONG_CUE, ERROR_CUE],
    blocks: [JOKER_EXCHANGE, MISNAMED, TWO_PLAYERS],
    approved_answer:
      "It depends on how far the declaration went. If you only said mahjong and nothing went face up, take it back right away, before anyone else exposes tiles or disturbs a hand; there is no penalty and play continues. If you called a discard for mahjong and racked the tile, or laid down only the one group that tile completes, you may drop the mahjong declaration and keep it as a call for that exposure, then discard to finish your turn. The exposure stays on your rack, and if it fits no hand on the card the other players can declare your hand dead the normal way. That path needs a hand that can make an exposure, so it does not help a hand marked concealed, and a tile you picked yourself gives no such escape. If you put down tiles from your concealed hand, your hand is dead and you cannot take the declaration back. Your turn ends without a discard, put the tiles you just showed back behind the sloped part of your rack, and any exposures you made properly earlier stay up, so other players may still redeem jokers from them. If your hand was a concealed hand, every tile returns to your rack and no one can redeem a joker from it. You stop drawing and discarding, and play continues with the player on your right. Anyone who threw in a hand because of your false mahjong is dead too.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.21 #2 and #3, p.22 #4(b), p.23 #6, and the 1993 bulletin Q&A p.12; the next-player rule is a League clarification (2023 letter and a 2024 call), not rulebook text; located and cross-checked via Mahj Life wiki articles 197, 216, 55, 52, 207, 189, 38", 2024),
  },
  {
    id: "mahjong-in-error-settlement",
    topic: "Settlement after a false mahjong",
    question_patterns: [MAHJONG_CUE, ERROR_CUE, SETTLEMENT],
    keywords: ["mahjong", "error", "pay", "settle"],
    requires: [MAHJONG_CUE, ERROR_CUE, SETTLEMENT],
    approved_answer:
      "Settlement follows from how many hands are left standing. Everyone should hold their hands until someone checks the call, and you cannot take back a hand you threw in, because that hand is dead too. If at least two hands stay intact, play continues and no one pays yet; when someone later wins, the dead players pay along with everyone else, and a wall game means no one pays. If the false call leaves only one intact hand, the deal ends there and the player who declared in error pays that one player double the value of the hand the declarer was attempting, while players who threw in neither pay nor collect. If more than one player declared in error, the last one to do so carries that payment. A player who throws in a hand and wrecks the wall before anyone checks the call pays each player with an intact hand the lowest value printed on the card. One more thing worth knowing: another player who wanted that same claimed tile for mahjong may still take it and win, but a player who wanted it only for an exposure may not.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.21 #2 and #3, p.22 #4 and #5(a) through #5(e), p.23 #6, the card back Mah Jongg in Error section, and the 1993 and 2006 bulletins; located and cross-checked via Mahj Life wiki articles 197, 216, 52, 55, 159, 138, 56, 141, 54, 51, 142 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "three-player-procedure",
    topic: "Playing with three players",
    question_patterns: [THREE_PLAYER, THREE_PLAYER_HOW],
    keywords: ["three player", "three handed", "3 players"],
    requires: [THREE_PLAYER, THREE_PLAYER_HOW],
    approved_answer:
      "American mahjong seats 4 players, and the League's rulebook covers playing with 3. Build all 4 walls as usual with the full 152 tiles and leave one seat empty. Deal only to the 3 players: each takes 4 tiles at a time until everyone holds 12, and the empty seat gets nothing. The players then finish the deal so East holds 14 tiles and the other two hold 13. League publications describe that last pick in two slightly different orders, and both end with the same counts. There is no Charleston with 3 players. That is the League's official rule, not a table preference. East opens with a discard, and play runs like the 4-player game. Anything beyond this is a table choice, such as an invented Charleston for 3, a ghost hand dealt to the empty seat, or a betting arrangement, so agree on those before you start.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note:
      "Anything past the official baseline, including a three-player Charleston or a ghost hand, is a table choice.",
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.26 three-handed section; the rulebook and the 2024 bulletin describe the final pick in different orders that reach the same counts, so this entry publishes the counts only by owner decision; located and cross-checked via Mahj Life wiki articles 102, 188, 226 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "wrong-tile-count-before-play",
    topic: "Wrong tile count before East's first discard",
    question_patterns: [WRONG_COUNT, BEFORE_PLAY],
    keywords: ["wrong number", "12 tiles", "redeal"],
    requires: [WRONG_COUNT, BEFORE_PLAY],
    approved_answer:
      "Count your tiles before East's first discard. The League treats that discard as the start of the deal, so it is your cutoff for fixing anything. Count again when the Charleston ends, because that is the last easy moment to catch a mistake. If any player holds the wrong number of tiles at that point, the table throws all the hands in, rebuilds the walls, and deals again. No one pays a penalty, because a fresh deal is a reset and not a punishment. One correction escapes that. If the player seated to East's left holds 12 tiles because that player never took a 13th tile during the deal, that player takes the next tile from the wall and play continues, because that tile was rightfully theirs. League answers put this correction on the table from before the Charleston right up to East's first discard. It covers that seat only, and it covers a player who is short, not a player holding too many. After East's first discard, none of this works. A player holding the wrong number of tiles has a dead hand, and no one can fix the count. Another player has to call it, because you never declare your own hand dead, and the dead player still pays the winner of that deal. The habit that prevents almost all of it: everyone counts to 13, East counts to 14, before East discards.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.14 first bullet with the 2002 bulletin Q&A; p.17 carries the one seat exception, independently established by a 1987 bulletin Q&A; earlier editions agree; located and cross-checked via Mahj Life wiki articles 36, 63, 83, 226, 205 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "hold-or-wait",
    topic: "Saying hold or wait",
    question_patterns: [HOLD_WAIT, HOLD_WAIT_ASK],
    keywords: ["hold", "wait", "call"],
    requires: [HOLD_WAIT, HOLD_WAIT_ASK, /\b(tile|discard|call|calls|claim|play|game|turn)\b/i],
    blocks: [CHARLESTON_WORD, BLIND_PASS],
    approved_answer:
      "Priority does not turn on which word you pick. The League does ask you to say call, take, or I want that when you actually claim the tile, and it lets you say hold or wait first while you decide. So after you say hold and make up your mind, say call before you take the tile. The one thing you may never do is reach in silently, because you have to speak your claim out loud. Two separate things settle it. Priority decides who is entitled to the tile: a claim for mahjong beats a claim for an exposure, and when two players want it for the same reason the player whose turn comes next gets preference. Commitment decides when the tile becomes yours: you own the call once you place the tile on top of your rack or expose tiles from your hand. Until you do one of those, you may change your mind, return the tile, and draw from the wall instead. Put those together and the common table argument disappears. If you are next in turn and you say hold, the table should give you a reasonable moment, and another player should not expose ahead of you. You lose that tile by going quiet, because a player later in turn order who calls it and then racks it or exposes tiles has finished a claim you never finished. You also lose it if someone claims it for mahjong, because mahjong outranks an exposure. The whole window closes for everybody once the next player racks the tile they picked, names that tile, discards it, starts a joker exchange, or declares mahjong.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note:
      "How long a reasonable moment lasts is your table's call and not a League rule, and tournament directors read the moment of placement more strictly than a social game does.",
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 pp.15 and 31 (commitment at placement), p.17 (the acts that close the window), 2023 p.18 r.13, and a 2023 League letter; the verbalization requirement runs back through the 2013 and 2018 editions; located and cross-checked via Mahj Life wiki articles 57, 264, 281, 21, 107, 177 and the Sloperama American mahjong FAQ read as raw text", 2024),
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
    blocks: [ERROR_CUE],
    approved_answer:
      "Yes, with limits that depend on which exposure the joker sits in. When a hand goes dead, the other players may still redeem jokers from any correct exposure that player made before the hand went dead. Redeem one the normal way, on your own turn, by handing over the real tile that joker stands for. This works even when the hand died for a separate reason, such as holding the wrong number of tiles. The exposure that caused the dead hand works differently: those tiles, jokers included, go back onto the player's rack, so no one can redeem them. A hand marked concealed that exposed tiles in error gives up nothing, because the whole exposed portion returns to the rack. One timing point: if a hand is already dead but nobody has declared it dead yet, even the jokers in the exposure that made it dead are still up for grabs, and they go out of reach only once the table declares the hand dead. The dead player stops drawing, discarding, and exchanging for the rest of that deal, and still pays the winner.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.22 #4(b), 2020 p.16 #3(b) and pp.24 #19 to #21, bulletins 1970 to 2019; the undeclared-hand timing point rests on the 2023 bulletin; located and cross-checked via Mahj Life wiki articles 38, 205, 189, 197, 180 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "picking-ahead",
    topic: "Picking ahead",
    question_patterns: [PICK_VERB, AHEAD],
    keywords: ["pick ahead", "out of turn", "draw early"],
    requires: [PICK_VERB, AHEAD],
    blocks: [CHARLESTON_WORD, BLIND_PASS],
    approved_answer:
      "Wait for the player before you to discard, and wait a beat in case someone calls it, before you touch the wall. The first rule on the back of the card bars picking or looking ahead, printed in capitals. Under League rules, drawing out of turn makes your hand dead. That is the standard rule and it sets no condition about how quickly the table catches you. You stop picking and discarding for the rest of the deal and still pay the winner. Return the tile to the exact spot in the wall it came from and never anywhere else, because moving it elsewhere kills the hand on its own. Discarding before you pick from the wall kills your hand the same way. If someone claims your out-of-turn discard for mahjong, the deal stops, you pay the winner 4 times the value of the hand, and the other two players pay nothing. Play then picks up to the right of the last action and keeps moving right, so a player your slip skipped does not get that turn back. One thing this is not: picking correctly on your own turn and having a valid call interrupt you. That is an interrupted pick, the tile goes back in its spot, and nobody's hand is dead. Two points to settle with your group. Many teachers, social tables, and tournament directors let a player off when someone stops them before they rack or look at the tile; that is house practice or director practice, not a League rule, so ask how your table plays it. And on whether an out-of-turn discard can still be claimed for an exposure, League answers have been reported both ways, so that one is unsettled and your table should agree on it.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note:
      "A quick-catch reprieve is house or tournament practice, never a League rule.",
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.19 #15(g) and #15(h) and the card back rule 1; payment on a mahjong claim after an out-of-turn discard per 2023 p.19 r.15(e) and p.20 r.16(b); whether such a discard may be claimed for an exposure is reported both ways and stays on the authoritative-resolution queue; located and cross-checked via Mahj Life wiki articles 70, 122, 209, 59, 147, 189, 9 and the Sloperama American mahjong FAQ", 2024),
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
      "The first Charleston, three passes, is required and cannot be stopped once it begins. The second Charleston happens only if all four players agree, which is the same rule as saying any one player may stop it before it starts, without giving a reason. Once the second Charleston is under way, it continues to the end. A courtesy pass can still be offered after a stop.",
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
      "You never have to call a discard. If you do not want it, say nothing and let play continue. Once the next player has drawn and racked a tile, or discarded, that discard is out of reach for everyone.",
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
      "The League sets who pays and how much. Your table sets what a point is worth. Who pays: the winner announces the hand and its value, then tells each player what to pay. Win on another player's discard and that discarder pays double the hand's value while the other 2 players each pay the single value. Pick your own winning tile from the wall and all 3 players pay double. Redeeming a joker from your own rack as your last move before declaring counts as a self pick. Jokerless: if your hand could have used jokers and has none when you declare, the value doubles again, and that stacks, so a jokerless win on a discard costs the discarder 4 times the value while the other 2 pay double. Say the hand is jokerless when you declare, because you lose the bonus if you forget. Hands in the Singles and Pairs group get no jokerless bonus, since their printed value already accounts for it, but the self pick double still applies. A player whose hand went dead still pays the winner. If the wall runs out and nobody declares mahjong, no one wins and no one pays. Amounts: the card prints a value beside each hand, and those values are points. The League does not require you to play for money. Many tables treat a point as a penny, but chips, paper scoring, and playing for nothing are all fine. A wall game kitty, an ante, and any cap on losses are table customs, not League rules, so agree on all of it before the first hand. Sanctioned tournaments score differently, so follow the director's rules there.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note:
      "What a point is worth, kitties, antes, and loss caps are table customs.",
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.26 (payment structure, jokerless double with the Singles and Pairs exclusion) and p.17; the card prints each hand's value; amounts in money are table custom, not League rule; located and cross-checked via Mahj Life wiki articles 208, 151, 99, 98, 97, 72, 137, 155, 238, 45 and the Sloperama American mahjong FAQ", 2024),
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
      "Yes. You may call a discard to complete any exposed group of 3 or more identical tiles, and that includes a 5 tile Quint and a 6 tile Sextet. The rest of the group must already be in your hand, with jokers allowed to fill in, and the entire group goes face up on your rack in one move. One limit applies: a call must complete a whole block as printed on the card, never part of one. If your hand shows 6 flowers as a single block, you cannot call a flower to expose just 3 of them; you need the other 5 in hand so that one call finishes all 6. A hand marked concealed cannot call for any exposure.",
    ruleset: RULESET,
    varies_by_house: false,
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2020 p.23 #10 and 2024 p.15, bulletins 1993 p.5, 2001, 2015, 2019; the whole-block limit comes from the same rule; located and cross-checked via Mahj Life wiki articles 146 and 254", 2024),
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
    requires: [TOURNAMENT, /\b(rules?|differ|different|differs|standard|league play|director'?s?|penalt(y|ies)|scoring|time limit|timed)\b/i],
    blocks: [/\b(near|nearby|in my area|\d{5}|looking for|find|register|sign up)\b/i, placeAfterPrep],
    approved_answer:
      "Tournaments play by National Mah Jongg League rules as the foundation, but each tournament director adds procedures of their own: timed rounds, a point system, and penalties for things like misnamed discards. Those are tournament rules, not League law: they apply only at that event and never change the League's rules for regular play. At a tournament, the director's rule governs; away from it, the League rule does.",
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
    blocks: [/\b(buy|buying|purchase|store|shop|for sale|price|prices|cost|costs|sell|sells|order|amazon)\b/i],
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
    question_patterns: [LAST_OF_WALL, FINAL_DISCARD_SCENE],
    keywords: ["last tile", "wall runs out"],
    requires: [LAST_OF_WALL],
    blocks: [HAND_CLOSED],
    approved_answer:
      "League rules do not change as the wall gets short. While any tiles remain in the wall, you may call a discard for an exposure or for mahjong, right down to the last tile. A table that bans calls near the end plays a house rule, often called a cold wall. Groups define it differently, since some bar only exposure calls and others bar every claim, and the League has never sanctioned any version of it. Anyone may still claim the very last discard of the deal for mahjong. On whether you may instead call that final discard only to make an exposure, we found no published League ruling either way, so agree at your table how you will handle it until the League settles it. If the last tile of the wall is drawn and discarded and no one declares mahjong, the hand ends with no winner and no one pays.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note:
      "Cold wall and hot wall restrictions and any last-tile bonus are table rules, so agree on them before the first hand.",
    source: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 pp.15 and 16 (wall game) and p.17 #8 (calling window), bulletins 1976 to 2014, none of which carves out a depleted wall; the exposure call on the deal's final discard is unresolved in published League material and is on the authoritative-resolution queue; located and cross-checked via Mahj Life wiki articles 107, 131, 137, 235 and the Sloperama American mahjong FAQ", 2024),
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
