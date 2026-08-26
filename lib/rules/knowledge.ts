// Owner-approved American mahjong rules knowledge. Every answer here is approved text:
// retrieval may pick an entry, and a model may rephrase one, but nothing may add rule
// content that is not written below. The annual NMJL card's hands are copyrighted and
// must never appear here; lib/rules/lookup.ts refuses those questions before retrieval.

export type RulesConfidence = "high" | "medium";

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
  source: "owner_approved";
  last_verified: `${number}-${number}-${number}`;
  confidence: RulesConfidence;
};

const RULESET = "american_nmjl" as const;
const SOURCE = "owner_approved" as const;
const VERIFIED = "2026-08-22" as const;
const VERIFIED_REVIEW = "2026-08-26" as const;

// Concept matchers describe ideas, not phrasings, so word order, punctuation, and
// paraphrase all resolve to the same concept.
export const HAND_CLOSED =
  /\b(closed|concealed)\b[^.?!]{0,40}\bhands?\b|\bhands?\b[^.?!]{0,40}\b(closed|concealed)\b/i;
const CLAIM_VERB = /\b(call|calls|calling|claim|claims|claiming|pick(ing)? up|takes? from the discard)\b/i;
const BLIND = /\bblind(ly)?\b/i;
const PASS_VERB = /\bpass(es|ed|ing)?\b/i;
const JOKER = /\bjokers?\b/i;
// Proximity concepts: the two words must sit within one clause of each other, so
// "legally blind, can she pass tiles" is not a blind pass and "what is a joker? my
// friend passed one" is still a joker definition.
export const BLIND_PASS = new RegExp(
  `${BLIND.source}[^.?!,;]{0,30}${PASS_VERB.source}|${PASS_VERB.source}[^.?!,;]{0,30}${BLIND.source}`, "i");
const JOKER_PASS = new RegExp(
  `${JOKER.source}[^.?!,;]{0,45}${PASS_VERB.source}(?!\\s+(for|as)\\b)|${PASS_VERB.source}(?!\\s+(for|as)\\b)[^.?!,;]{0,45}${JOKER.source}`, "i");
// Joker exchange from an exposure is allowed for any hand; that question belongs
// on the exchange answer, whatever verb the player uses.
const JOKER_EXCHANGE =
  /\b(exchange|redeem|swap|trade)\b|\b(take|get|pull|grab|claim|pick(ing)? up)\b[^.?!,;]{0,20}\bjokers?\b[^.?!,;]{0,30}\b(exposure|exposed|rack)\b/i;

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
    ],
    keywords: ["152", "tile count", "how many tiles", "full set"],
    approved_answer:
      "An American mahjong set has 152 tiles: the three suits (Bams, Craks, and Dots) numbered 1 through 9 with 4 copies of each tile, 16 winds, 12 dragons, 8 flowers, and 8 jokers.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
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
    ],
    keywords: ["suits", "bams", "craks", "dots"],
    approved_answer:
      "American mahjong uses three suits: Bams, Craks, and Dots. Each suit runs from 1 to 9, and the set holds 4 copies of every suit tile.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
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
    approved_answer:
      "American mahjong has three dragons, and each one belongs to a suit: the Red dragon goes with Craks, the Green dragon goes with Bams, and the White dragon, called the Soap, goes with Dots. The set holds 4 of each dragon, 12 dragon tiles in all.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
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
  },
  {
    id: "joker-in-pair",
    topic: "Jokers in pairs and singles",
    question_patterns: [
      /jokers?.{0,60}\b(pairs?|singles?)\b/i,
      /\b(pairs?|singles?)\b.{0,60}jokers?/i,
    ],
    keywords: ["joker", "pair", "single"],
    approved_answer:
      "No. A joker can never be used in a pair or as a single tile. Jokers only work inside groups of 3 or more: a Pung, Kong, Quint, or Sextet. Hands built entirely from singles and pairs take no jokers at all.",
    ruleset: RULESET,
    varies_by_house: false,
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
  },
  {
    id: "joker-exchange",
    topic: "Joker exchange",
    question_patterns: [
      JOKER_EXCHANGE,
      /(exchange|redeem|swap|trade).{0,30}jokers?/i,
      /jokers?.{0,30}(exchange|redeem|swap|trade)/i,
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
  },
  {
    id: "charleston",
    topic: "The Charleston",
    question_patterns: [
      /(?<!(?:near|in|around|at|visiting|by|to|from)\s)\bcharleston\b/i,
      /pass(ing|es)? tiles/i,
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
  },
  {
    id: "calling-discard",
    topic: "Calling a discard",
    question_patterns: [
      /call(ing)? (a |the )?(discard|tile)/i,
      /when can (i|you) call/i,
      /(pick up|claim|take).{0,20}(discard|thrown tile)/i,
      /\bdiscards?\b/i,
    ],
    keywords: ["call", "discard", "claim"],
    approved_answer:
      "You may call the most recent discard when you can use it right away in an exposed group of 3 or more identical tiles, with jokers allowed to fill in, or when it completes your mahjong. When you call for a group, you must place that group face up on your rack. A call for mahjong beats a call for an exposure.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note:
      "Tables differ on exactly when the calling window closes after the next player draws, so agree on it before you start.",
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
  },
  {
    id: "winning-mahjong",
    topic: "Winning (declaring mahjong)",
    question_patterns: [
      /how (do|does) (i|you|someone|a player) win/i,
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
  },
  {
    id: "wall-game",
    topic: "Wall game (no winner)",
    question_patterns: [
      /wall game/i,
      /(nobody|no one) (wins|declared)/i,
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
  },
  {
    id: "players-count",
    topic: "Number of players",
    question_patterns: [
      /how many (players|people)/i,
      /play with (three|3|five|5)/i,
      /number of players/i,
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
    // The courtesy pass itself is described on the Charleston answer.
    blocks: [/\bcourtesy pass\b/i],
    approved_answer:
      "It helps to separate official rules from table courtesies. Official rules come from the National Mah Jongg League and apply everywhere, such as the tile count and how calling works. Courtesies are local customs a table agrees on, such as whether to make the courtesy pass in the Charleston or how strictly discards are announced. Agree on courtesies before the first hand so no one is surprised.",
    ruleset: RULESET,
    varies_by_house: true,
    house_note: "Courtesies differ from table to table by design.",
    source: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
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
  },
];
