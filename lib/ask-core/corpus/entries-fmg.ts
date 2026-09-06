// Canonical entries that originate from Find My Mahj Game (lib/rules/knowledge.ts at cb87d4c).
// Answers are verbatim: owner-approved wording is never edited here. Ported entries that
// originate from Las Vegas Mahjong live in entries-lvm.ts. See docs/CORPUS-ADJUDICATION.md.
//
// Every answer here is either owner-approved text or text written for the site and verified
// against National Mah Jongg League rules, with provenance recorded on the entry. The annual
// NMJL card's hands are copyrighted and must never appear here; the guards refuse those
// questions before retrieval. Secondary research (Mahj Life wiki, CC BY-NC-ND) is used only
// to locate and cross-check League rulings; no sentence here is copied from it.

import type { CanonicalRule, Provenance } from "./types.ts";
import {
  HAND_CLOSED, CLAIM_VERB, PASS_VERB, JOKER, BLIND_PASS, JOKER_PASS, JOKER_EXCHANGE, MAHJONG_CUE, EXPOSURE_CUE,
  DISCARDED, ERROR_CUE, MISNAMED, HOLD_WAIT, TWO_PLAYERS, TWO_PLAYERS_ASK, OWN_DISCARD, NAMING, TIMING, DEAD,
  DEAD_DETAIL, HAND_SIZE, PICK_VERB, AHEAD, ORDER, COURTESY, CHARLESTON_WORD, STOP_OR_AGREE, PAYMENT, QUINT_SEXTET,
  MIXED_GROUP, SCORING_ASK, EXPOSURE_WORD, CARD_WORD, CX_LETTERS, NOTATION, TOURNAMENT, BLANK, SPOKEN_CLAIM,
  DECLINE_CALL, OFFICIAL, STRATEGY, LAST_OF_WALL, blindReadsAsPlace, THREE_PLAYER_SEATS, WRONG_COUNT, DECLINE_CUE,
  HOLD_FOR_CHECK, DIRECTORY_ASK, OTHER_TOPIC, DEALER_EXTRA, WRONG_TILE_GIVEN, EXCHANGE_CONTEXT, CONTACT_SENSE,
  HOLD_WAIT_ASK, SETTLEMENT, SETTLEMENT_OR_HOLD, FINAL_DISCARD_SCENE, placeAfterPrep,
  MAKE_EXPOSURE,
  BLIND_RULE_SENSE,
  DEALER_COUNT,
  SKIPPED_DRAW,
  DRAGON_SUIT_ASK,
  CHARLESTON_STOP_ASK,
  DISCARDED_JOKER_SCENE,
  DEALT_HAND_SCENE,
  OTHER_CLAIMER,
  NO_WINNER_SCENE,
} from "./matchers.ts";

const SOURCE = "owner_approved" as const;
const VERIFIED = "2026-08-22" as const;
const VERIFIED_REVIEW = "2026-08-26" as const;
const VERIFIED_WORDING = "2026-08-29" as const;
const VERIFIED_AUDIT = "2026-08-30" as const;
// Same date as the audit, kept separate so a later audit pass does not silently restamp
// the entries the owner personally decided.
const OWNER_DECIDED = "2026-08-30" as const;

const OWNER: Provenance = {
  source_type: "owner_approved",
  source_title: "Find My Mahj owner approval (certified American mahjong instructor)",
  owner_review_required: false,
  evidence: "verified",
  approved_via: "fmg",
};

// Entries written for the 2026-08-30 truth-layer audit. The League rule was located and
// cross-checked through secondary research; the wording is the site's own, and the owner
// reviews each one before its review flag clears. Both sites show the review badge until then.
function researched(ref: string, year?: number): Provenance {
  return {
    source_type: "secondary_research",
    source_title: "NMJL rule located and cross-checked through secondary research (Mahj Life wiki, research use only)",
    source_ref: ref,
    ...(year ? { source_year: year } : {}),
    owner_review_required: true,
    evidence: "owner_review_pending",
    approved_via: "fmg",
  };
}

// The owner approved these answers on 2026-08-30 after reading the research; the research
// trail stays on the entry so the basis is never lost. An explicit decision date outranks
// approval by publication when two entries fit a question equally.
function ownerApproved(ref: string, year?: number): Provenance {
  return {
    source_type: "owner_approved",
    source_title: `Owner approved ${OWNER_DECIDED} on the researched basis below (certified American mahjong instructor)`,
    source_ref: ref,
    ...(year ? { source_year: year } : {}),
    owner_review_required: false,
    evidence: "verified",
    owner_decided: OWNER_DECIDED,
    approved_via: "fmg",
  };
}

const ARITHMETIC: Provenance = {
  source_type: "arithmetic",
  source_title: "Follows from the owner-approved tile counts",
  owner_review_required: true,
  evidence: "owner_review_pending",
  approved_via: "fmg",
};
void ARITHMETIC;

// Owner-published Las Vegas Mahjong rules page text, reconciled with the card and ruled on by
// the owner on 2026-08-29. Approval by publication: outranks research, yields to an explicit
// dated decision when both fit a question equally.
export function lvmPage(ref: string, evidence: "card" | "owner" | "house"): Provenance {
  return {
    source_type: "owner_site_page",
    source_title:
      evidence === "house"
        ? "Las Vegas Mahjong rules page (lasvegasmahj.com/rules): a house matter published with neutral wording by the owner's 2026-08-29 decision; no League claim"
        : `Las Vegas Mahjong rules page (lasvegasmahj.com/rules), reconciled with the League card and the owner's handouts, owner review 2026-08-29; evidence tier: ${evidence}`,
    source_ref: ref,
    owner_review_required: false,
    evidence: "verified",
    approved_via: "lvm",
  };
}

// Owner-approved wording on Las Vegas Mahjong with no rules page yet (2026-08-29 decisions).
export const LVM_OWNER_2026_08_29: Provenance = {
  source_type: "owner_approved",
  source_title: "Las Vegas Mahjong owner approval, 2026-08-29 (certified American mahjong instructor)",
  owner_review_required: false,
  evidence: "verified",
  owner_decided: "2026-08-29",
  approved_via: "lvm",
};

// Wording the Las Vegas Mahjong owner composed from approved statements but deliberately keeps
// pending until she rules on it (her 2026-08-29 decision). Served verbatim with the review badge.
export function lvmPending(ref: string): Provenance {
  return {
    source_type: "owner_site_page",
    source_title: "Las Vegas Mahjong pending entry, composed from approved statements; the owner keeps it pending by her 2026-08-29 decision",
    source_ref: ref,
    owner_review_required: true,
    evidence: "owner_review_pending",
    approved_via: "lvm",
  };
}

// "put up a kong, did a joker swap, now i think it should have been a pung. can i still change it":
// a question about changing the exposure, which the joker exchange has locked.
const CHANGE_EXPOSURE = /\b(change|fix|alter|swap them|should have been)\b[^.?!]{0,20}\b(it|exposure|pung|kong)\b|\bstill change\b|\bshould have been\b/i;
// The courtesy pass by name or by description (the across swap with the opposite player).
const COURTESY_ASK = new RegExp(`${COURTESY.source}|\\bacross swap\\b|\\bswap (with|across)\\b[^.?!]{0,20}\\bopposite\\b|\\bopposite (player|swap|exchange)\\b|\\bacross (exchange|trade)\\b`, "i");
// "nobody threw in": the settlement entry only applies once hands were thrown in.
const NOBODY_THREW_IN = /\b(nobody|no one|noone|none of (us|them)|no hands? (were|was)|nothing was) (threw|tossed|throw|toss|thrown)\w*( (their |her |his )?(hands?|tiles?))?( in)?\b/i;

export const FMG_ENTRIES: CanonicalRule[] = [
  {
    id: "tile-count",
    category: "tiles",
    level: "foundational",
    questions: ["How many tiles are in an American Mahjong set?"],
    related: ["suits","jokers-basics","the-wall"],
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
    answer:
      "An American mahjong set has 152 tiles: the three suits (Bams, Craks, and Dots) numbered 1 through 9 with 4 copies of each tile, 16 winds, 12 dragons, 8 flowers, and 8 jokers.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "suits",
    category: "tiles",
    level: "foundational",
    questions: ["What are the three suits?"],
    related: ["dragons","tile-count","winds"],
    topic: "Suits",
    question_patterns: [
      /what (are|'re) the suits/i,
      /suits? (in|of) (american )?mahjong/i,
      /\b(bams?|craks?|dots?)\b.{0,30}\bsuits?\b/i,
      /\bsuits?\b.{0,30}\b(bams?|craks?|dots?)\b/i,
      /how many suits/i,
      /\b(three|3) suits\b/i,
      /\b(what|which|name|the) suits?\b/i,
    ],
    keywords: ["suits", "bams", "craks", "dots"],
    answer:
      "American mahjong uses three suits: Bams, Craks, and Dots. Each suit runs from 1 to 9, and the set holds 4 copies of every suit tile.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "dragons",
    category: "tiles",
    level: "foundational",
    questions: ["Which dragon goes with which suit?"],
    related: ["suits","flowers","winds"],
    topic: "Dragons",
    question_patterns: [
      /dragons?/i,
      /\bsoap\b/i,
      /which dragon (goes|matches|belongs)/i,
    ],
    keywords: ["dragon", "soap", "red dragon", "green dragon", "white dragon"],
    // "Soap as zero" is a card-reading question, answered on the notation entry.
    blocks: [/\bzero\b|\b0\b|\byear\b/i],
    answer:
      "American mahjong has three dragons, and each one belongs to a suit: the Red dragon goes with Craks, the Green dragon goes with Bams, and the White dragon, called the Soap, goes with Dots. The set holds 4 of each dragon, 12 dragon tiles in all.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "flowers",
    category: "tiles",
    level: "foundational",
    questions: ["Are flowers interchangeable?"],
    related: ["dragons","jokers-basics","tile-count"],
    topic: "Flowers",
    question_patterns: [
      /flowers?(?!\s+mound)/i,
      /are flowers (numbered|interchangeable|the same)/i,
    ],
    keywords: ["flower", "flowers"],
    answer:
      "Flowers are all interchangeable, and they are not numbered. Any flower can stand in for any other flower; a flower is a flower is a flower. An American set has 8 of them.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "winds",
    category: "tiles",
    level: "foundational",
    questions: ["How do the winds work?"],
    related: ["joker-in-news","dragons","dealing"],
    topic: "Winds",
    question_patterns: [
      /\bwinds?\b/i,
      /north.{0,10}east.{0,10}west.{0,10}south/i,
    ],
    keywords: ["wind", "winds", "north", "south"],
    answer:
      "An American set includes 4 winds: North, East, West, and South, with 4 copies of each for 16 wind tiles in total. Winds do not belong to any suit.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "jokers-basics",
    category: "jokers",
    level: "foundational",
    questions: ["How do jokers work?"],
    related: ["joker-in-pair","joker-exchange","joker-substitute"],
    topic: "Jokers",
    question_patterns: [
      /\bjokers?\b[^.?!,;]{0,20}\b(in|for|as part of|inside) (a|an|my|the|your) (pung|kong|quint|sextet|group|set)\b/i,
      /what (is|are) (a )?jokers?/i,
      /how (do|does) (a )?jokers? work/i,
      /jokers? (wild|rules)/i,
      /\bjokers?\b/i,
    ],
    keywords: ["joker", "jokers", "wild"],
    // This definition never mentions passing. A joker-passing question belongs on
    // the Charleston answer, which carries "You may never pass a joker in the Charleston."
    blocks: [JOKER_PASS],
    answer:
      "Jokers are wild tiles, and they are unique to American mahjong. A joker can stand in for any tile inside a group of 3 or more, meaning a Pung, Kong, Quint, or Sextet. An American set has 8 jokers.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "joker-in-pair",
    category: "jokers",
    level: "core",
    questions: ["Can I use a joker in a pair?"],
    related: ["joker-substitute","joker-exchange","joker-in-news"],
    topic: "Jokers in pairs and singles",
    question_patterns: [
      /jokers?.{0,60}\b(pairs?|singles?)\b/i,
      /\b(pairs?|singles?)\b.{0,60}jokers?/i,
    ],
    keywords: ["joker", "pair", "single"],
    blocks: [MIXED_GROUP],
    answer:
      "No. A joker can never be used in a pair or as a single tile. Jokers only work inside groups of 3 or more: a Pung, Kong, Quint, or Sextet. Hands built entirely from singles and pairs take no jokers at all.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "joker-exchange",
    category: "jokers",
    level: "core",
    questions: ["Can I take a joker from another player's exposure?"],
    related: ["joker-exchange-timing","joker-discarded","joker-free"],
    topic: "Joker exchange",
    question_patterns: [
      JOKER_EXCHANGE,
      /(exchange[sd]?|exchanging|redeem(s|ed|ing)?|swap(s|ped|ping)?|trad(e|es|ed|ing)).{0,30}jokers?/i,
      /jokers?.{0,30}(exchange[sd]?|exchanging|redeem(s|ed|ing)?|swap(s|ped|ping)?|trad(e|es|ed|ing))/i,
      /take.{0,20}jokers?.{0,30}(exposure|exposed|rack)/i,
    ],
    keywords: ["joker", "exchange", "redeem", "swap"],
    requires: [JOKER, JOKER_EXCHANGE],
    // A dead hand's jokers are dead-hand-jokers' rule, which says the opposite.
    // Changing an exposure after a joker swap is the exposure entries' rule.
    blocks: [/\bself[- ]?pick\w*\b|\bfor the money\b|\bfor payment\b|\bcount(s)? as\b[^.?!]{0,20}\b(self|win|mahjong)\b/i,
      // Once mahjong is declared the exchange window is closed; the timing entry says so.
      /\b(once|after) (mahjong|maj|the mahjong) (is|has been|was|been)? ?(declared|called)\b|\bafter (someone|anyone|she|he|they) (declared|called) (mahjong|maj)\b/i,
      CHANGE_EXPOSURE, DEAD],
    answer:
      "Yes, joker exchange is allowed. When any player has an exposed group on the table that contains a joker, you may, on your own turn, hand over the real tile that joker stands for and take the joker into your hand. You can only redeem a joker from an exposure, never from tiles hidden in another player's hand.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "dealing",
    category: "basics",
    level: "foundational",
    questions: ["How many tiles does each player start with?"],
    related: ["the-wall","charleston","players-count"],
    topic: "Dealing",
    question_patterns: [/\b(east|dealer)\b[^.?!]{0,20}\b(13|14|fourteen|thirteen)\b|\b(13|14) or (13|14)\b/i, 
      /how many tiles.{0,40}(start|deal|dealt|hand)/i,
      /\bstart with\b/i,
      /who (starts|deals|goes first|is east)/i,
      /\b(13|14) tiles\b/i,
      /\bdealer\b/i,
    ],
    keywords: ["deal", "dealer", "start with", "east", "first"],
    blocks: [/\bdice\b|\broll(s|ing|ed)?\b|\bwho('s| is) east (first|for the first)\b|\bdecide who is east\b/i,
      // Whether East may declare mahjong on the dealt hand is not stated anywhere in the corpus.
      (q: string) => DEALT_HAND_SCENE.test(q) && MAHJONG_CUE.test(q)],
    answer:
      "Each player starts with 13 tiles, except East, the dealer, who starts with 14. After the Charleston, East opens play by discarding a tile.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "charleston",
    category: "charleston",
    level: "foundational",
    questions: ["How does the Charleston work?"],
    related: ["charleston-passes","charleston-blind-pass","call-during-charleston"],
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
    // Three-handed play has its own Charleston rule, but three-player-procedure itself
    // refuses anything naming another topic, so this block stands down there. Otherwise
    // "can I pass a joker if there are only three of us" loses both entries and gets no
    // answer at all, where this one says a joker may never be passed.
    blocks: [(q: string) => THREE_PLAYER_SEATS.test(q) && !OTHER_TOPIC.test(q)],
    keywords: ["charleston", "passing"],
    answer:
      "The Charleston is the tile passing that happens before play begins. In the first Charleston, every player passes 3 tiles right, then 3 across, then 3 left; this first round is required. If all four players agree, a second Charleston follows: 3 left, 3 across, 3 right. On the last pass of each Charleston you may pass blind, taking tiles from the pass coming to you without looking at them. Afterward, you and the player across from you may make an optional courtesy pass of up to 3 tiles. You may never pass a joker in the Charleston.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "open-vs-closed",
    category: "card",
    level: "core",
    questions: ["What is the difference between an open and a closed hand?"],
    related: ["closed-hand-final-tile","calling-discard","call-concealed"],
    topic: "Open and closed hands",
    question_patterns: [
      /\b(open|closed|concealed)\b.{0,20}\bhands?\b/i,
      /\bhands?\b.{0,20}\b(open|closed|concealed)\b/i,
      /what does concealed mean/i,
      /difference between open and closed/i,
    ],
    keywords: ["open hand", "closed hand", "concealed"],
    answer:
      "Open hands can call discards to build exposed groups. Closed hands, also called concealed hands, must be built from your own draws, with no calling to build groups; the only discard a closed hand may claim is the single tile that completes your mahjong.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "closed-hand-final-tile",
    category: "card",
    level: "advanced",
    questions: ["Can a closed hand call its final tile?"],
    related: ["open-vs-closed","calling-for-mahjong","calling-discard"],
    topic: "Closed hand final tile",
    question_patterns: [HAND_CLOSED],
    keywords: ["closed hand", "concealed"],
    requires: [HAND_CLOSED, new RegExp(`${CLAIM_VERB.source}|\\bdraw it myself\\b|\\bjust got thrown\\b|\\bfinishes (it|my hand)\\b|\\bwant (the|that|this) (discard|tile)\\b`, "i")],
    // "call" also has a naming sense ("what do you call a closed hand?"); that is
    // a definition question, not a claim.
    blocks: [(q: string) => JOKER.test(q) && JOKER_EXCHANGE.test(q), /\bwhat (do|would) (you|we|they) call\b/i],
    answer:
      "A closed (concealed) hand may not call any discard to build a group. The one exception: you may claim a discard when it is the single tile that completes your mahjong.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED_REVIEW,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "charleston-blind-pass",
    category: "charleston",
    level: "core",
    questions: ["What is a blind pass?"],
    related: ["charleston-passes","look-before-pass","courtesy-pass"],
    topic: "Charleston blind pass",
    question_patterns: [BLIND_PASS],
    keywords: ["blind pass"],
    requires: [BLIND_PASS, new RegExp(`${PASS_VERB.source}|\\bshove\\w*\\b|\\bstraight (on|through|along)\\b`, "i")],
    // "Blind Pass FL snowbird group here. on the last right pass can I pass all 3 tiles blind?"
    blocks: [(q: string) => blindReadsAsPlace(q) && !BLIND_RULE_SENSE.test(q)],
    answer:
      "A blind pass is allowed only on the last pass of each Charleston: First Left and, if a second Charleston is played, Last Right. If you do not want to pass three tiles from your own hand, you may take one, two, or all three tiles being passed to you and pass them onward without looking at them. You still pass three tiles total. A blind pass does not override the rule against passing jokers. Do not knowingly include a joker from your own hand. Tiles you pass on blindly must remain unseen.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED_REVIEW,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "calling-discard",
    category: "calling",
    level: "core",
    questions: ["When can I call a discard?"],
    related: ["two-players-same-tile","calling-for-pair","call-window"],
    topic: "Calling a discard",
    question_patterns: [
      /call(ing)? (a |the )?(discard|tile)/i,
      /when can (i|you) call/i,
      /\b(allowed|able|permitted|ok|okay) to call\b|\bhow (does|do) (calling|calls|a call) work\b|\bcalling (rules?|work)\b|\brules? (for|of|about|on) calling\b/i,
      /(pick up|claim|take).{0,20}(discard|thrown tile)/i,
      /\bdiscards?\b/i,
    ],
    keywords: ["call", "discard", "claim"],
    answer:
      "You may call the most recent discard when you can use it right away in an exposed group of 3 or more identical tiles, with jokers allowed to fill in, or when it completes your mahjong. When you call for a group, you must place that group face up on your rack. A call for mahjong beats a call for an exposure.",
    varies_by_house: true,
    house_note:
      "The card closes the calling window once the player next in turn has picked and racked, or discarded; some tables police that moment loosely, so confirm your table follows the card.",
    approval: SOURCE,
    last_verified: VERIFIED_WORDING,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "winning-mahjong",
    category: "winning",
    level: "foundational",
    questions: ["How do you win a hand?"],
    related: ["valid-mahjong","mahjong-in-error","discard-win"],
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
    // Whether East may declare on the dealt hand is not stated anywhere in the corpus.
    blocks: [(q: string) => DEALT_HAND_SCENE.test(q) && MAHJONG_CUE.test(q)],
    answer:
      "You win by completing a 14 tile hand that exactly matches one of the hands printed on the current National Mah Jongg League card, then declaring mahjong. The 14th tile can come from your own draw or from a called discard.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "annual-card",
    category: "card",
    level: "foundational",
    questions: ["When does the new card come out?"],
    related: ["last-years-card","card-numbers","winning-mahjong"],
    topic: "The annual NMJL card",
    question_patterns: [/\b(new|next) cards? (ship|arrive|release|come out|are out|drop)\b|\btime of year\b[^.?!]{0,20}\bcards?\b/i, 
      /(new|annual|yearly|current|next).{0,15}\bcard\b/i,
      /\bcard\b.{0,25}(come(s)? out|release|publish)/i,
      /when.{0,30}\bcard\b/i,
      /what is the (nmjl |league )?card/i,
    ],
    keywords: ["card", "nmjl", "league"],
    answer:
      "The National Mah Jongg League publishes a new official card every spring. The card lists the hands you can win with, and those hands change every year, so players buy the new card each season directly from the League.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "the-wall",
    category: "basics",
    level: "foundational",
    questions: ["How is the wall built?"],
    related: ["dealing","wall-game","tile-count"],
    topic: "The wall",
    question_patterns: [
      /\bwalls?\b/i,
      /build(ing)? the wall/i,
      /how (is|are) the (tiles|wall) (set|built|arranged)/i,
    ],
    keywords: ["wall", "walls"],
    blocks: [/\bknocked\b|\bfell\b|\bdropped\b|\boff the table\b|\breshuffle\b/i, /\b(nobody|no one|noone) (won|wins|has mahjong)\b|\bwall game\b|\b(ran|runs|running) out\b|\bpay|\bpaid\b|\bowe\b|\bdice\b|\broll(s|ing|ed)?\b|\bwent out on\b/i,
      // A turn narration ("I picked and she had not discarded") is picking-ahead's rule.
      /\bhadn'?t (discarded|thrown|gone)\b|\bhas ?n'?t (discarded|thrown)\b|\b(had|has|have) not (discarded|thrown|gone)\b|\b(before|ahead of) (my|it was my|her|his|their) turn\b|\bout of turn\b|\b(peek|peeked|peeking|sneak\w*)\b|\b(discard\w*|threw|thrown)\b[^.?!]{0,24}\bbefore (i|you|she|he|they) (pick|picked|draw|drew)\b|\blook(ing)? ahead\b|\bnext tile in the wall\b|\b(only |just )?(two|three|four|five|a few|\d+) tiles? (left|remaining)\b/i],
    answer:
      "After all 152 tiles are shuffled face down, each player builds a wall 19 tiles long and 2 tiles high. The four walls together hold the whole set, and every deal and draw comes from the wall.",
    varies_by_house: false,
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "wall-game",
    category: "winning",
    level: "core",
    questions: ["What is a wall game?"],
    related: ["wall-game-payment","last-tile-of-wall","the-wall"],
    topic: "Wall game (no winner)",
    question_patterns: [/\b(nobody|no one|noone) (won|wins|has mahjong|got mahjong|went out)\b|\bwall (ran|runs) out\b/i, 
      // "who deals after a wall game" belongs here: the dealing entry only covers the
      // opening deal and never says who becomes East next.
      // Anchored on the wall game. Unqualified rotation between hands is the dealing
      // entry's question, and this answer is framed entirely around the wall running out.
      /\b(who|which player)\b[^.?!]{0,30}\b(deals?|is east|becomes east|deal again)\b(?=[^.?!]{0,40}\b(wall game|wall|no winner|nobody won|draw)\b)|\b(wall game|no winner)\b[^.?!]{0,40}\b(who|which player)\b[^.?!]{0,30}\b(deals?|is east|becomes east|deal again)\b/i,
      /wall game/i,
      /(nobody|no one|no body) (wins|won|declared|declares|got|gets) ?(mahjong|maj)?/i,
      /run(s|ning)? out of tiles/i,
      /end(s)? in a (draw|tie)/i,
    ],
    keywords: ["wall game", "draw", "no winner"],
    answer:
      "If the wall runs out of tiles before anyone declares mahjong, the hand ends with no winner. This is called a wall game, and no one scores it.",
    varies_by_house: true,
    house_note:
      "Tables differ on whether the same dealer deals again after a wall game.",
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "players-count",
    category: "basics",
    level: "foundational",
    questions: ["How many players do you need?"],
    related: ["three-player-procedure","dealing","the-wall"],
    topic: "Number of players",
    question_patterns: [/\b(min|minimum|max|maximum|fewest|least|most) (number of )?(people|players)\b|\bnumber of (people|players)\b/i, 
      /how many (players|people)/i,
      /play with (three|3|five|5|two|2)/i,
      /\b(three|3|five|5|two|2) (people|players|of us)\b/i,
      /number of players/i,
      /\b(three|3)[- ](player|person|handed)\b/i,
    ],
    keywords: ["players", "people", "how many players"],
    // A seats-of-three question is three-player-procedure's; this entry answers the
    // plain count. It stands down wherever that entry also refuses, so a question can
    // never fall between the two of them.
    // A question naming another topic has that topic's entry, so this one stays blocked
    // there. It only steps back in where three-player-procedure refuses and nothing else
    // would answer: payment, settlement, and where-to-play.
    blocks: [
      (q: string) =>
        THREE_PLAYER_SEATS.test(q) &&
        !SETTLEMENT.test(q) &&
        !SCORING_ASK.test(q) &&
        !PAYMENT.test(q) &&
        !DIRECTORY_ASK.test(q),
    ],
    answer:
      "American mahjong is built for 4 players. The League's rulebook also covers playing with 3, covering the deal and the fact that there is no Charleston, so you are not inventing a format when a fourth cannot make it.",
    varies_by_house: true,
    house_note:
      "Anything the League's three-handed procedure does not cover is your table's choice.",
    // Owner-approved apart from the three-player sentence and house note, which
    // Claude corrected on 2026-08-30: they invited a table to agree its own
    // three-handed format, which owner decision #6 (three-player-procedure) says
    // the League already settles. Pending Shauna's sign-off this is not her
    // wording, so it does not carry her stamp and it shows the review badge.
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched(
      "Owner-approved entry with the three-player sentence corrected to match owner decision #6: League rulebook 2024 p.26 publishes a three-handed procedure; located and cross-checked via Mahj Life wiki articles 102, 188, 226",
      2024,
    ),
  },
  {
    id: "courtesies-vs-rules",
    category: "etiquette",
    level: "core",
    questions: ["What is the difference between a rule and a house rule?"],
    related: ["house-vs-nmjl","table-talk","disputes"],
    topic: "Rules versus table courtesies",
    question_patterns: [
      /\b(table|house) rules?\b/i,
      /courtes(y|ies)/i,
      /etiquette/i,
      /rules? (vs|versus|or) (courtes|custom)/i,
    ],
    keywords: ["etiquette", "courtesy", "house rules", "table rules"],
    // The courtesy pass itself is described on its own entry.
    blocks: [/\bcourtesy pass\b/i, BLANK],
    answer:
      "It helps to separate official rules from table courtesies. Official rules come from the National Mah Jongg League and apply everywhere, such as the tile count, how calling works, and the courtesy pass, which is an optional League rule any player may decline. Courtesies are local customs a table agrees on, such as how a wall game is paid or whether the same dealer deals again. Agree on courtesies before the first hand so no one is surprised.",
    varies_by_house: true,
    house_note: "Courtesies differ from table to table by design.",
    approval: SOURCE,
    last_verified: VERIFIED_WORDING,
    confidence: "high",
    classification: "etiquette",
    provenance: OWNER,
  },
  {
    id: "dead-hand",
    category: "dead-hands",
    level: "advanced",
    questions: ["What is a dead hand?"],
    related: ["dead-hand-details","dead-hand-triggers","dead-hand-pays"],
    // Owner wording, left verbatim. A wrong tile count is answered by the entries that
    // carry the before/after East's first discard timing; this one states it flat.
    blocks: [WRONG_COUNT],
    topic: "Dead hands",
    question_patterns: [/\b(i'?m|im|am i|is my hand|my hand is|they said i'?m|called me) dead\b|\bwhat does dead mean\b|\bwhat does (that|it) (even )?mean\b/i, 
      /dead hand/i,
      /declar(e|ed|ing) (a hand |someone )?dead/i,
      /hand (is |goes )?dead/i,
    ],
    keywords: ["dead hand", "dead"],
    answer:
      "A hand is dead when it can no longer win, for example when a player holds the wrong number of tiles or has exposures that cannot fit any hand on the card. A dead player stops drawing and discarding for the rest of that hand. Calling another player's hand dead is a formal challenge, so be sure you are right before you make it.",
    varies_by_house: true,
    house_note:
      "Tables enforce dead hand challenges with different levels of strictness.",
    approval: SOURCE,
    last_verified: VERIFIED,
    confidence: "medium",
    classification: "standard_nmjl_rule",
    provenance: OWNER,
  },
  {
    id: "calling-for-mahjong",
    aliases: ["call-for-mahjong"],
    category: "calling",
    level: "core",
    questions: ["Can I call a discard for mahjong?","Can I call a tile for mahjong when it is not my turn?"],
    related: ["calling-for-exposure","two-players-same-tile","closed-hand-final-tile"],
    topic: "Calling a discard for mahjong",
    question_patterns: [MAHJONG_CUE, CLAIM_VERB],
    keywords: ["mahjong", "win", "call", "discard"],
    requires: [new RegExp(`${CLAIM_VERB.source}|\\b(yell|yells|yelled|shout|shouts|shouted|say|declare|declares|declared|announce|announces) (mahjong|mahj|maj)\\b`, "i"), MAHJONG_CUE],
    // Closed-hand and false-mahjong questions have their own answers.
    blocks: [DEALT_HAND_SCENE, /\bforgot to (pick|draw)\b|\bwithout (picking|drawing)\b|\b(threw|discarded|tossed) (a|the) joker\b|\bdiscarded joker\b/i, FINAL_DISCARD_SCENE, /\bself[- ]?(pick|draw)\w*\b|\bown (draw|pick)\b|\boff the wall\b|\bfrom the wall\b/i, HAND_CLOSED, ERROR_CUE, TWO_PLAYERS, OWN_DISCARD, JOKER, MISNAMED],
    answer: "Yes. Any player may call a discard to complete a winning hand (mahjong), except a discarded joker, as long as the next player has not yet picked and racked or discarded. A call for mahjong beats any call for an exposure, even one already placed on a rack. If two players call the same tile for mahjong, the player next in turn after the discarder gets it unless the other caller has already racked the tile or exposed.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: "2026-08-29",
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("calling-tiles.call-for-mahjong", "card"),
  },
  {
    id: "calling-for-exposure",
    category: "calling",
    level: "core",
    questions: ["Can I call a discard to make an exposure?"],
    related: ["calling-for-mahjong","exposures-basics","expose-immediately"],
    topic: "Calling a discard for an exposure",
    question_patterns: [EXPOSURE_CUE, CLAIM_VERB, MAKE_EXPOSURE],
    keywords: ["exposure", "call", "pung", "kong"],
    requires: [CLAIM_VERB, EXPOSURE_CUE],
    blocks: [DISCARDED_JOKER_SCENE, HAND_CLOSED, TWO_PLAYERS, OWN_DISCARD, (q: string) => JOKER_EXCHANGE.test(q) && !CHANGE_EXPOSURE.test(q), /\bpairs?\b/i, QUINT_SEXTET, MISNAMED, FINAL_DISCARD_SCENE],
    answer:
      "You may call a discard to build an exposure when the tiles already in your hand, with jokers allowed, make it a group of 3 or more identical tiles: a Pung, a Kong, or a larger group. Say call, take the tile, and place the whole group face up on top of your rack, then discard. You cannot call a discard to make a pair unless that tile completes your mahjong, and a hand marked concealed cannot call for an exposure at all. The call is committed as soon as the called tile goes on your rack or you expose tiles from your hand. You may fix a mistake in that exposure only until you discard or exchange a joker; after either, it is locked.",
    varies_by_house: false,
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rules on exposures and commitment to a called discard; cross-checked via Mahj Life wiki articles 177, 178, and 289", 2024),
  },
  {
    id: "calling-for-pair",
    aliases: ["call-for-pair"],
    category: "calling",
    level: "core",
    questions: ["Can I call a discard to make a pair?","Can I call a tile to make a pair?"],
    related: ["calling-discard","calling-for-mahjong","joker-in-pair"],
    topic: "Calling a discard for a pair",
    question_patterns: [/\bpairs?\b/i, CLAIM_VERB],
    keywords: ["pair", "call", "discard"],
    requires: [CLAIM_VERB, /\bpairs?\b/i],
    blocks: [JOKER, HAND_CLOSED, TWO_PLAYERS, OWN_DISCARD],
    answer: "No. You may only call a discard for an exposed group of 3 or more identical tiles (a Pung, Kong, Quint, or Sextet), or when that tile completes your mahjong. A pair by itself cannot be called; the exception is when the pair is the last thing your hand needs, because then the call is for mahjong.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: "2026-08-29",
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: LVM_OWNER_2026_08_29,
  },
  {
    id: "joker-in-mixed-groups",
    category: "jokers",
    level: "core",
    questions: ["Can a joker stand in for a tile in NEWS, a run, or a year?"],
    related: ["joker-in-news","joker-in-pair","jokers-basics"],
    topic: "Jokers in runs, years, and NEWS",
    question_patterns: [JOKER, MIXED_GROUP],
    keywords: ["joker", "news", "year", "run"],
    requires: [JOKER, MIXED_GROUP],
    blocks: [/\bfirst (left|right)\b|\bcharleston\b|\bwithout looking\b/i, JOKER_EXCHANGE, JOKER_PASS, DISCARDED],
    answer:
      "A joker never stands in for one of the single tiles that make up a mixed group: a run like 1 2 3, a year, NEWS with one of each wind, or any line of singles, even though those groups have 3 or more tiles. In a hand that includes such a group, jokers can still fill that hand's Pungs, Kongs, Quints, or Sextets. The mixed group itself must be built from the real tiles.",
    varies_by_house: false,
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rulebook rule that jokers are never used in a block of single tiles; follows from the owner-approved joker entries; cross-checked via Mahj Life wiki article 221", 2024),
  },
  {
    id: "joker-discarded",
    aliases: ["discarded-joker"],
    category: "jokers",
    level: "core",
    questions: ["Can I pick up a discarded joker?"],
    related: ["joker-exchange","calling-discard","own-discard"],
    topic: "Discarded jokers",
    question_patterns: [JOKER, DISCARDED],
    keywords: ["joker", "discard"],
    // The joker itself was discarded: the two words sit in one clause. "handed her a 4 dot for
    // the joker in her pung, and I already discarded" is a joker exchange gone wrong.
    requires: [JOKER, new RegExp(`\\bjokers?\\b[^.?!,;]{0,30}${DISCARDED.source}|${DISCARDED.source}[^.?!,;]{0,30}\\bjokers?\\b`, "i")],
    blocks: [/\b(zero|no|without) jokers?\b|\bjokerless\b|\bjoker[- ]?free\b/i, JOKER_EXCHANGE, JOKER_PASS, /\bpairs?\b/i, MISNAMED],
    answer: "The card's joker rule says a discarded joker can never be called for mahjong. Whether a discarded joker can be claimed for an exposure is not printed on the card; common table practice treats a discarded joker as out of the hand entirely, so check with your table. Under that practice, the only way to take a joker from the table is a joker exchange from an exposed group on your own turn.",
    varies_by_house: true,
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: lvmPending("discarded-joker: card rule stated first; exposure claim labelled common table practice"),
  },
  {
    id: "joker-exchange-timing",
    category: "jokers",
    level: "core",
    questions: ["When during my turn can I exchange a joker?","When can I exchange a joker?"],
    related: ["joker-exchange","joker-exchange-wrong-tile","dead-hand-jokers"],
    topic: "When a joker exchange is allowed",
    question_patterns: [JOKER_EXCHANGE, TIMING, ERROR_CUE],
    keywords: ["joker", "exchange", "turn"],
    requires: [JOKER, JOKER_EXCHANGE, new RegExp(`${TIMING.source}|${ERROR_CUE.source}|\\b(own|my|your) (rack|exposure)\\b`, "i")],
    blocks: [/\bshould have been\b|\bchange (it|the exposure)\b|\bstill change\b/i, DEAD],
    answer:
      "You may exchange a joker only during your own turn, after you have drawn from the wall or called a discard and before you discard. Hand over the tile the joker stands for and take the joker; you may redeem a joker from any exposure on the table, including your own. Once you discard, the chance passes until your next turn. If an exchange puts the wrong tile into an exposure, fix it before the next discard and there is no penalty.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "nmjl_clarification",
    provenance: ownerApproved("League rulings on exchange timing and own-rack redemption; the wrong-tile consequence has its own entry per bulletin 2024 FAQ #10 and rulebook 2024 p.24 #14; via Mahj Life 172, 221, 224 and Sloperama FAQ", 2024),
  },
  {
    id: "joker-exchange-wrong-tile",
    category: "jokers",
    level: "advanced",
    questions: ["What happens if a joker is exchanged for the wrong tile?"],
    related: ["joker-exchange-timing","dead-hand-details","exposures-basics"],
    topic: "A joker exchanged for the wrong tile",
    question_patterns: [JOKER_EXCHANGE, WRONG_TILE_GIVEN, EXCHANGE_CONTEXT],
    keywords: ["joker", "exchange", "wrong tile"],
    requires: [JOKER, WRONG_TILE_GIVEN, EXCHANGE_CONTEXT],
    answer:
      "Catch it before the next discard and there is no penalty: take the wrong tile back, put the right one in, and play continues. Once that discard has been made and the exposure is still wrong, the player whose rack holds the incorrect exposure has a dead hand for that deal. The player who handed over the wrong tile keeps playing and owes nothing, because the League makes each player responsible for the exposures on their own rack. A dead player stops drawing and discarding and still pays the winner. Keep this separate from a different rule: changing an otherwise valid exposure after you have completed a joker exchange is not allowed, and that has nothing to do with fixing an exchange that went wrong. You can avoid the whole problem by announcing the exchange before anyone touches a tile and passing the tile from hand to hand, so you both see it.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("NMJL Bulletin 2024 FAQ #10 with rulebook 2024 p.24 #14: correctable before the next discard, then the holder of the incorrect exposure is disqualified while the giver plays on; via Mahj Life 224, 37, 172, 221 and Sloperama FAQ", 2024),
  },
  {
    id: "two-players-same-tile",
    category: "calling",
    level: "advanced",
    questions: ["What happens when two players want the same discard?"],
    equivalents: ["same-tile-two-calls"],
    related: ["hold-or-wait","calling-for-mahjong","call-window"],
    topic: "Two players want the same discard",
    question_patterns: [TWO_PLAYERS],
    keywords: ["same tile", "both", "hold", "wait", "priority"],
    requires: [TWO_PLAYERS, TWO_PLAYERS_ASK],
    blocks: [/\bhow long\b[^.?!]{0,40}\b(wait|before)\b|\blose the (discard|tile)\b/i, /\bfell\b|\bdropped\b|\bknocked\b|\bface up\b|\bput (the tiles|them|it) up\b|\bright away\b|\bimmediately\b/i, MISNAMED, /\ball the same\b|\bflowers?\b|\b(open|closed|concealed|exposed) hands?\b|\bheard both\b|\bnumbers? on\b/i, ERROR_CUE, BLIND_PASS, CHARLESTON_WORD, DEAD],
    answer:
      "When more than one player wants the same discard, a call for mahjong wins over a call for an exposure. If both want it for the same reason, the player whose turn comes next gets it. Which word you use does not change that order, so hold, wait, and call all carry the same weight for priority, but you still have to say call before you take the tile. A player who hesitates can lose the tile once another player has claimed it and then racked it or exposed tiles.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rule on concurrent claims (mahjong first, then next in turn) and on word choice not setting priority; located and cross-checked via Mahj Life wiki articles 57, 264, 281 and the owner-approved calling entry", 2025),
  },
  {
    id: "own-discard",
    aliases: ["take-back-discard"],
    category: "calling",
    level: "core",
    questions: ["Can I call my own discard?","Can I take back a discard?"],
    related: ["most-recent-discard","misnamed-discard","call-window"],
    topic: "Calling your own discard",
    question_patterns: [OWN_DISCARD],
    keywords: ["own discard", "take back"],
    requires: [OWN_DISCARD],
    // Misnaming your own discard is misnamed-discard's rule, which says the
    // opposite: correct it with words and play continues. A third party claiming the tile
    // is ordinary calling, and this entry's "No" would read as the wrong answer there.
    blocks: [/\bhold \d+ tiles?\b|\bhow many tiles\b/i,
      // Taking back a call or an exposure is not taking back a discard.
      (q: string) => /\btake (it |that |my )?back\b|\bget it back\b/i.test(q) && /\b(call|called|calling|claim|exposure|pung|kong|quint|sextet)\b/i.test(q) && !/\bdiscard/i.test(q),
      MISNAMED, (q: string) => OTHER_CLAIMER.test(q) && !/\b(take|get|have|call) (it|that|the tile|my tile|my discard) back\b|\btake back\b/i.test(q)],
    answer:
      "No. You may never call back a tile you just discarded, for any purpose, including mahjong or a joker exchange. Once you have named it or placed it in the discard area, it is available only to the other players.",
    varies_by_house: false,
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League ruling that a player cannot claim their own discard; cross-checked via Mahj Life wiki article 245", 2020),
  },
  {
    id: "naming-discards",
    category: "calling",
    level: "core",
    questions: ["Do I have to name my discard out loud?"],
    related: ["misnamed-discard","own-discard","hold-or-wait"],
    topic: "Naming a discard",
    question_patterns: [NAMING, DISCARDED],
    keywords: ["name", "announce", "discard", "same"],
    requires: [NAMING, new RegExp(`${DISCARDED.source}|\\bsame\\b`, "i")],
    // "name my discard" is this entry's own question; only the take-back sense is own-discard's.
    blocks: [(q: string) => OWN_DISCARD.test(q) && /\b(take|call|get|have) (it |that |the tile |my discard )?back\b|\bown (discard|throw)\b/i.test(q), MISNAMED, HAND_CLOSED],
    answer:
      "Name each tile aloud as you place it face up in the discard area, since naming it is what lets the other players call it. When your discard matches the tile discarded just before it, the League accepts saying same as well as naming the tile.",
    varies_by_house: false,
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "nmjl_clarification",
    provenance: researched("League rule that discards are named; 2024 bulletin ruling accepting 'same' for a repeat discard, cross-checked via Mahj Life wiki article 242", 2024),
  },
  {
    id: "misnamed-discard",
    category: "calling",
    level: "advanced",
    questions: ["What happens if I misname a discard?"],
    related: ["naming-discards","dead-hand-details","mahjong-in-error-settlement"],
    topic: "Misnamed discards",
    question_patterns: [MISNAMED],
    keywords: ["misnamed", "wrong name"],
    requires: [MISNAMED],
    answer:
      "Name every discard aloud as you place it face up, because the correct name is what makes the tile claimable. When your tile repeats the discard just before it, the League accepts saying same. If you say the wrong name, fix it with words only: state the correct name of the tile you actually threw. Never swap tiles, even if the tile you named by mistake sits in your hand. Once you correct the name and nobody has acted on the error, play continues with no penalty and any player may claim the tile normally. A call made on the wrong name does not stand. If that player only said call, correct the name and play on, with no penalty to anyone. If that player already laid tiles down on the wrong name, the exposure is invalid and their hand is dead for that deal, and you owe nothing. If a player declares mahjong based on the wrong name, the deal ends there: you alone pay that player 4 times the value of the hand, and the other two players pay nothing. If two players declare mahjong at once, one on the wrong name and one needing the tile you actually threw, the player who needs the actual tile wins. If nobody catches the misname before the next player picks and racks, the chance to claim that tile is gone and nobody pays a penalty. Watch each discard with your eyes, not just your ears.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook misnamed discard rule (2023 p.16 r.3, 2020 p.19 r.6, 2024 pp.16, 17, 19) and the card back Miscalled Tile section; repeat-discard naming per the 2024 bulletin Q12; located and cross-checked via Mahj Life wiki articles 67, 80, 189, 242 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "mahjong-in-error",
    category: "winning",
    level: "advanced",
    questions: ["What happens if I declare mahjong by mistake?"],
    related: ["mahjong-in-error-settlement","dead-hand-details","valid-mahjong"],
    topic: "Mahjong declared in error",
    question_patterns: [MAHJONG_CUE, ERROR_CUE],
    keywords: ["mahjong", "error", "mistake", "false"],
    requires: [MAHJONG_CUE, ERROR_CUE],
    blocks: [(q: string) => /\b(can|may) (i|we) (still )?(call|claim|take)\b/i.test(q) && !/\b(declared|said mahjong|called mahjong|blurted|yelled mahjong)\b/i.test(q), OWN_DISCARD, JOKER_EXCHANGE, MISNAMED, TWO_PLAYERS],
    answer:
      "It depends on how far the declaration went. If you only said mahjong and nothing went face up, take it back right away, before anyone else exposes tiles or disturbs a hand; there is no penalty and play continues. If you called a discard for mahjong and racked the tile, or laid down only the one group that tile completes, you may drop the mahjong declaration and keep it as a call for that exposure, then discard to finish your turn. The exposure stays on your rack, and if it fits no hand on the card the other players can declare your hand dead the normal way. That path needs a hand that can make an exposure, so it does not help a hand marked concealed, and a tile you picked yourself gives no such escape. If you put tiles down from behind your rack, your hand is dead and you cannot take the declaration back. Your turn ends without a discard, put the tiles you just showed back behind the sloped part of your rack, and any exposures you made properly earlier stay up, so other players may still redeem jokers from them. If your hand was a concealed hand, every tile returns to your rack and no one can redeem a joker from it. You stop drawing and discarding, and play continues with the player on your right. Anyone who threw in a hand because of your false mahjong is dead too.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.21 #2 and #3, p.22 #4(b), p.23 #6, and the 1993 bulletin Q&A p.12; the next-player rule is a League clarification (2023 letter and a 2024 call), not rulebook text; located and cross-checked via Mahj Life wiki articles 197, 216, 55, 52, 207, 189, 38", 2024),
  },
  {
    id: "mahjong-in-error-settlement",
    category: "scoring",
    level: "advanced",
    questions: ["Who pays after a false mahjong?"],
    related: ["mahjong-in-error","dead-hand-pays","payments-basics"],
    tags: ["money"],
    topic: "Settlement after a false mahjong",
    question_patterns: [
      SETTLEMENT_OR_HOLD, MAHJONG_CUE, ERROR_CUE],
    keywords: ["mahjong", "error", "pay", "settle"],
    requires: [
      MAHJONG_CUE,
      new RegExp(`${ERROR_CUE.source}|${HOLD_FOR_CHECK.source}`, "i"),
      SETTLEMENT_OR_HOLD,
    ],
    // A misname settlement is misnamed-discard's rule, not this one; the two
    // state opposite payers, so this must not win a misname question.
    blocks: [/\b(got|was|were|been) (called|declared) dead\b|\bsince (she|he|they) (is|are) dead\b/i, (q: string) => NOBODY_THREW_IN.test(q) && !/\b(pay|pays|paid|owe|owes|settle|collect|double)\w*\b/i.test(q), MISNAMED],
    answer:
      "Settlement follows from how many hands are left standing. Everyone should hold their hands until someone checks the call, and you cannot take back a hand you threw in, because that hand is dead too. If at least two hands stay intact, play continues and no one pays yet; when someone later wins, the dead players pay along with everyone else, and a wall game means no one pays. If the false call leaves only one intact hand, the deal ends there and the player who declared in error pays that one player double the value of the hand the declarer was attempting, while players who threw in neither pay nor collect. If more than one player declared in error, the last one to do so carries that payment. A player who throws in a hand and wrecks the wall before anyone checks the call pays each player with an intact hand the lowest value printed on the card. One more thing worth knowing: another player who wanted that same claimed tile for mahjong may still take it and win, but a player who wanted it only for an exposure may not.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.21 #2 and #3, p.22 #4 and #5(a) through #5(e), p.23 #6, the card back Mah Jongg in Error section, and the 1993 and 2006 bulletins; located and cross-checked via Mahj Life wiki articles 197, 216, 52, 55, 159, 138, 56, 141, 54, 51, 142 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "three-player-procedure",
    category: "basics",
    level: "core",
    questions: ["How do you play with three players?"],
    related: ["players-count","dealing","charleston"],
    topic: "Playing with three players",
    // Seats only, and seats alone. THREE_PLAYER's bare "only 3" made "only 3 jokers
    // left" a three-handed table, and requiring THREE_PLAYER_HOW as well lost
    // "we have three players is that ok", which carries no procedure word.
    question_patterns: [THREE_PLAYER_SEATS],
    keywords: ["three player", "three handed", "3 players"],
    requires: [THREE_PLAYER_SEATS],
    // retrieve() ranks specificity above score, so one `requires` here outranked all 18
    // entries that have none, and a question that merely mentions three of us is about
    // whatever noun it names. Requiring a procedure word instead was tried and lost
    // "we have three players is that ok", which carries none.
    blocks: [/\b(second round|first left|majority|second charleston)\b/i, SETTLEMENT, SCORING_ASK, PAYMENT, OTHER_TOPIC, /\b(where|near|nearby|find|looking for|join|sign up)\b|\b(club|group|venue|teacher|lesson|class)s?\b(?=[^.?!]{0,20}\b(near|in|around|at)\b)/i],
    answer:
      "American mahjong seats 4 players, and the League's rulebook covers playing with 3. Build all 4 walls as usual with the full 152 tiles and leave one seat empty. Deal only to the three players, and the empty seat gets nothing. The deal ends with East holding 14 tiles and the other two holding 13. League publications describe the final pickup in two slightly different orders, and both reach those counts. Under League rules there is no Charleston with three players, so this is not a table preference. East opens with a discard, and play runs like the 4-player game. Anything beyond this is a table choice, such as an invented Charleston for three or a ghost hand dealt to the empty seat.",
    varies_by_house: true,
    house_note:
      "Agree on any table variation before you start.",
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.26 three-handed section; the rulebook and the 2024 bulletin describe the final pick in different orders that reach the same counts, so this entry publishes the counts only by owner decision; located and cross-checked via Mahj Life wiki articles 102, 188, 226 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "wrong-tile-count-before-play",
    category: "dead-hands",
    level: "advanced",
    questions: ["What happens if someone has the wrong number of tiles?"],
    related: ["hand-size","dead-hand-details","dealing"],
    topic: "Wrong tile count",
    // Reached by the count alone. The answer covers both sides of East's first discard,
    // so a player who does not mention timing still gets the whole rule instead of one
    // half of it from a neighboring entry.
    question_patterns: [WRONG_COUNT],
    keywords: ["wrong number", "12 tiles", "redeal"],
    requires: [WRONG_COUNT],
    // How many tiles a SET contains is tile-count's question, not a count gone wrong.
    blocks: [DEALER_EXTRA, DEALER_COUNT, /\bin (a|the|my|one) set\b|\bin the box\b/i],
    answer:
      "Count your tiles before East's first discard. The League treats that discard as the start of the deal, so it is your cutoff for fixing anything. Count again when the Charleston ends, because that is the last easy moment to catch a mistake. If any player holds the wrong number of tiles at that point, the table throws all the hands in, rebuilds the walls, and deals again. No one pays a penalty, because a fresh deal is a reset and not a punishment. One correction escapes that. If the player seated to East's left holds 12 tiles because that player never took a 13th tile during the deal, that player takes the next tile from the wall and play continues, because that tile was rightfully theirs. League answers put this correction on the table from before the Charleston right up to East's first discard. It covers that seat only, and it covers a player who is short, not a player holding too many. After East's first discard, none of this works. A player holding the wrong number of tiles has a dead hand, and no one can fix the count. Another player has to call it, because you never declare your own hand dead, and the dead player still pays the winner of that deal. The habit that prevents almost all of it: everyone counts to 13, East counts to 14, before East discards.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.14 first bullet with the 2002 bulletin Q&A; p.17 carries the one seat exception, independently established by a 1987 bulletin Q&A; earlier editions agree; located and cross-checked via Mahj Life wiki articles 36, 63, 83, 226, 205 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "hold-or-wait",
    category: "calling",
    level: "advanced",
    questions: ["Does saying hold or wait count as a call?"],
    related: ["two-players-same-tile","call-window","passing-on-a-discard"],
    topic: "Saying hold or wait",
    question_patterns: [HOLD_WAIT, HOLD_WAIT_ASK],
    keywords: ["hold", "wait", "call"],
    requires: [
      new RegExp(`${HOLD_WAIT.source}|${SPOKEN_CLAIM.source}`, "i"),
      HOLD_WAIT_ASK,
      /\b(tile|discard|call|calls|claim|play|game|turn)\b/i,
    ],
    blocks: [/\b(put|lay|place|set)\b[^.?!]{0,12}\b(tiles?|them|it) (up|down|out)\b|\bright away\b|\bimmediately\b|\bstraight away\b/i, 
      CHARLESTON_WORD,
      BLIND_PASS,
      MISNAMED,
      // "before I call ahead to the studio: if I say wait, can someone expose before me" is still this rule.
      (q: string) => CONTACT_SENSE.test(q) && !/\b(say|said|saying|yell|yelled|shout|shouted|call|called|calling) (wait|hold)\b/i.test(q),
      DECLINE_CUE,
      // Naming your own discard is naming-discards' rule, but NAMING also holds "out
      // loud", which is exactly what a spoken-claim question asks about, so it stands
      // down there rather than leaving the question with no entry at all.
      (q: string) =>
        new RegExp(`${NAMING.source}[^.?!]{0,20}\\b(tile|discard)s?\\b`, "i").test(q) && !SPOKEN_CLAIM.test(q),
    ],
    answer:
      "Priority does not turn on which word you pick. The League does ask you to say call, take, or I want that when you actually claim the tile, and it lets you say hold or wait first while you decide. So after you say hold and make up your mind, say call before you take the tile. The one thing you may never do is reach in silently, because you have to speak your claim out loud. Two separate things settle it. Priority decides who is entitled to the tile: a claim for mahjong beats a claim for an exposure, and when two players want it for the same reason the player whose turn comes next gets preference. Commitment decides when the tile becomes yours: you own the call once you place the tile on top of your rack or expose tiles from your hand. Until you do one of those, you may change your mind, return the tile, and draw from the wall instead. Put those together and the common table argument disappears. If you are next in turn and you say hold, the table should give you a reasonable moment, and another player should not expose ahead of you. You lose that tile by going quiet, because a player later in turn order who calls it and then racks it or exposes tiles has finished a claim you never finished. You also lose it if someone claims it for mahjong, because mahjong outranks an exposure. The whole window closes for everybody once the next player racks the tile they picked, discards and names a tile, starts a joker exchange, or declares mahjong.",
    varies_by_house: true,
    house_note:
      "How long a reasonable moment lasts is your table's call and not a League rule, and tournament directors read the moment of placement more strictly than a social game does.",
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 pp.15 and 31 (commitment at placement), p.17 (the acts that close the window), 2023 p.18 r.13, and a 2023 League letter; the verbalization requirement runs back through the 2013 and 2018 editions; located and cross-checked via Mahj Life wiki articles 57, 264, 281, 21, 107, 177 and the Sloperama American mahjong FAQ read as raw text", 2024),
  },
  {
    id: "dead-hand-details",
    category: "dead-hands",
    level: "advanced",
    questions: ["Can I declare my own hand dead?"],
    related: ["dead-hand","dead-hand-jokers","wrong-tile-count-before-play"],
    topic: "What makes a hand dead",
    question_patterns: [DEAD, DEAD_DETAIL],
    keywords: ["dead", "too many tiles", "wrong number"],
    requires: [DEAD, DEAD_DETAIL],
    // A wrong tile count goes to the entry that answers both timings in one place; this
    // one keeps the other ways a hand dies.
    blocks: [NO_WINNER_SCENE, JOKER_EXCHANGE, ERROR_CUE, WRONG_COUNT],
    answer:
      "A hand goes dead when it can no longer win, for example when a player holds the wrong number of tiles after East's first discard, draws out of turn, makes an exposure that fits no hand on the card, or exposes tiles for a hand marked concealed. A dead player stops drawing and discarding but still pays the winner of that deal. You do not declare your own hand dead; the other players do. After East's first discard, a wrong tile count cannot be fixed.",
    varies_by_house: true,
    house_note:
      "Tables enforce dead hand challenges with different levels of strictness.",
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rules on dead hands and the wrong number of tiles; drawing out of turn as a cause per rulebook 2024 p.19 #15(g)-(h) as carried on the picking-ahead entry; cross-checked via Mahj Life wiki articles 189 and 205 and the owner-approved dead hand entry", 2024),
  },
  {
    id: "dead-hand-jokers",
    category: "dead-hands",
    level: "advanced",
    questions: ["Can I exchange a joker from a dead hand's exposure?"],
    related: ["joker-exchange","dead-hand-details","joker-exchange-timing"],
    topic: "Jokers in a dead hand's exposures",
    question_patterns: [DEAD, JOKER],
    keywords: ["dead", "joker", "exchange"],
    requires: [DEAD, JOKER],
    blocks: [/\bwho'?s dead\b|\bwhos dead\b|\bnobody noticed\b|\bwrong tile\b/i, MISNAMED],
    answer:
      "Yes, with limits that depend on which exposure the joker sits in. When a hand goes dead, the other players may still redeem jokers from any correct exposure that player made before the hand went dead. Redeem one the normal way, on your own turn, by handing over the real tile that joker stands for. This works even when the hand died for a separate reason, such as holding the wrong number of tiles. The exposure that caused the dead hand works differently: those tiles, jokers included, go back onto the player's rack, so no one can redeem them. A hand marked concealed that exposed tiles in error gives up nothing, because the whole exposed portion returns to the rack. One timing point: if a hand is already dead but nobody has declared it dead yet, even the jokers in the exposure that made it dead are still up for grabs, and they go out of reach only once the table declares the hand dead. The dead player stops drawing, discarding, and exchanging for the rest of that deal, and still pays the winner.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.22 #4(b), 2020 p.16 #3(b) and pp.24 #19 to #21, bulletins 1970 to 2019; the undeclared-hand timing point rests on the 2023 bulletin; located and cross-checked via Mahj Life wiki articles 38, 205, 189, 197, 180 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "picking-ahead",
    category: "basics",
    level: "advanced",
    questions: ["What happens if I pick a tile before my turn?"],
    related: ["order-of-play","dead-hand-details","out-of-turn"],
    topic: "Picking ahead",
    question_patterns: [PICK_VERB, AHEAD],
    keywords: ["pick ahead", "out of turn", "draw early"],
    // The discard branch takes only the out-of-turn senses. AHEAD also holds a bare
    // "early" and "too soon", so pairing it with a plain discard verb answered "when
    // should I discard my flowers, early or late" with the dead-hand penalty.
    requires: [
      new RegExp(
        `${PICK_VERB.source}|\\bdiscard(s|ed|ing)?\\b(?=[^.?!]{0,30}\\b(out of turn|before (my|your|their|her|his) turn|not (my|your|their) turn)\\b)`,
        "i",
      ),
      AHEAD,
    ],
    blocks: [CHARLESTON_WORD, BLIND_PASS],
    answer:
      "Wait for the player before you to discard, and wait a beat in case someone calls it, before you touch the wall. The back of the card bars picking or looking ahead. Under League rules, drawing out of turn makes your hand dead. That is the standard rule and it sets no condition about how quickly the table catches you. You stop picking and discarding for the rest of the deal and still pay the winner. Your hand is already dead, but still put the tile back in the exact spot it came from, because the wall has to stay intact for everyone else and hiding it somewhere else in the wall causes its own trouble. Discarding before you pick from the wall kills your hand the same way. If someone claims your out-of-turn discard for mahjong, the deal stops, you pay the winner 4 times the value of the hand, and the other two players pay nothing. Play then picks up to the right of the last action and keeps moving right, so a player your slip skipped does not get that turn back. One thing this is not: picking correctly on your own turn and having a valid call interrupt you. That is an interrupted pick, the tile goes back in its spot, and nobody's hand is dead. Two points to settle with your group. Many teachers, social tables, and tournament directors let a player off when someone stops them before they rack or look at the tile; that is house practice or director practice, not a League rule. And on whether an out-of-turn discard can still be claimed for an exposure, League answers have been reported both ways, so that one is unsettled and your table should agree on it.",
    varies_by_house: true,
    house_note:
      "A quick-catch reprieve is house or tournament practice, never a League rule.",
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.19 #15(g) and #15(h) and the card back rule 1; payment on a mahjong claim after an out-of-turn discard per 2023 p.19 r.15(e) and p.20 r.16(b); whether such a discard may be claimed for an exposure is reported both ways and stays on the authoritative-resolution queue; located and cross-checked via Mahj Life wiki articles 70, 122, 209, 59, 147, 189, 9 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "order-of-play",
    category: "basics",
    level: "foundational",
    questions: ["What is the order of play?"],
    related: ["dealing","picking-ahead","hand-size"],
    topic: "Order of play",
    question_patterns: [ORDER],
    keywords: ["order", "turn", "direction", "next"],
    requires: [ORDER],
    blocks: [CHARLESTON_WORD, ERROR_CUE, TWO_PLAYERS, SKIPPED_DRAW, PAYMENT],
    answer:
      "East starts the deal by discarding. Turns then move to the right, counterclockwise around the table: East, then South, then West, then North. On your turn you either draw the next tile from the wall or call the most recent discard, then you discard one tile face up and name it. You hold 13 tiles between turns and 14 during your turn.",
    varies_by_house: false,
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League turn order (East, South, West, North, play to the right); cross-checked via Mahj Life wiki articles 170 and 239 and the owner-approved dealing entry", 2024),
  },
  {
    id: "hand-size",
    category: "basics",
    level: "foundational",
    questions: ["How many tiles should I hold?"],
    related: ["dealing","wrong-tile-count-before-play","winning-mahjong"],
    topic: "How many tiles you hold",
    question_patterns: [HAND_SIZE, /how many tiles/i],
    keywords: ["how many tiles", "hand", "rack"],
    requires: [HAND_SIZE],
    // "How many do I hold" is this entry's. A count that has already gone wrong is the
    // count entry's, and holding your hand while a call is checked is a third question.
    blocks: [DEAD, JOKER, WRONG_COUNT, HOLD_FOR_CHECK, /\bpairs?\b|\bsingles?\b|\bexpos|\bdealer\b|\beast\b/i],
    answer:
      "You hold 13 tiles between turns. When you draw or call, you have 14; after you discard, you are back to 13. A finished mahjong is 14 tiles. Count quietly whenever you are unsure, because the wrong number of tiles once play has begun makes a hand dead.",
    varies_by_house: false,
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("Follows from the owner-approved dealing and winning entries; cross-checked via Mahj Life wiki article 205", 2024),
  },
  {
    id: "courtesy-pass",
    category: "charleston",
    level: "core",
    questions: ["What is a courtesy pass?"],
    related: ["charleston-passes","charleston","look-before-pass"],
    topic: "The courtesy pass",
    question_patterns: [COURTESY_ASK],
    keywords: ["courtesy pass", "across"],
    requires: [COURTESY_ASK, new RegExp(`${PASS_VERB.source}|\\b(thing|swap|trade|exchange|round|across|optional)\\b`, "i")],
    answer: "After the charleston ends, whether it stopped after the first left pass or ran through a second charleston, you and the player across from you may make an optional courtesy pass of 0, 1, 2, or 3 tiles. Both players must agree on how many tiles to exchange, and both pass at the same time. Either player can decline.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: "2026-08-29",
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("charleston.courtesy-pass", "card"),
  },
  {
    id: "charleston-stop",
    aliases: ["stop-charleston"],
    category: "charleston",
    level: "core",
    questions: ["Can I stop the Charleston?"],
    related: ["charleston-passes","courtesy-pass","charleston"],
    topic: "Stopping the Charleston",
    question_patterns: [CHARLESTON_WORD, CHARLESTON_STOP_ASK],
    keywords: ["stop", "charleston", "second charleston", "optional"],
    requires: [new RegExp(`${CHARLESTON_WORD.source}|\\bpass(es|ed|ing)?\\b|\\bfirst left\\b|\\bsecond round\\b`, "i"), CHARLESTON_STOP_ASK],
    // "three of us" beside the stop question is the vote, not three-handed play; the across swap at the end is the courtesy pass.
    blocks: [BLIND_PASS, COURTESY, JOKER, DISCARDED, (q: string) => THREE_PLAYER_SEATS.test(q) && !OTHER_TOPIC.test(q) && !/\b(second round|first left|majority|stop)\b/i.test(q), /\bacross swap\b|\bopposite\b|\bat the end\b/i],
    answer: "Not during the first charleston. The first charleston (right, across, left) is compulsory. Once the first left pass is done, any player may call to stop; the second charleston (left, across, right) only happens if no one stops it. The courtesy pass still applies either way.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: "2026-08-29",
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("charleston.stop", "card"),
  },
  {
    id: "passing-on-a-discard",
    category: "calling",
    level: "core",
    questions: ["Do I have to call a discard I could use?"],
    related: ["calling-discard","hold-or-wait","call-window"],
    topic: "Passing on a discard",
    question_patterns: [DECLINE_CALL],
    keywords: ["have to call", "skip", "ignore"],
    requires: [DECLINE_CALL],
    // SPOKEN_CLAIM keeps "do I have to say my call out loud" with hold-or-wait, but it
    // also fires on "do I have to say anything if I do not want it", which is this
    // entry's own question, so a decline cue takes it back.
    blocks: [
      CHARLESTON_WORD,
      BLIND_PASS,
      COURTESY,
      JOKER,
      (q: string) => SPOKEN_CLAIM.test(q) && !DECLINE_CUE.test(q),
    ],
    answer:
      "You never have to call a discard. If you do not want it, say nothing and let play continue. If you do want it, say so out loud, because you may never reach in silently. Once the next player has drawn and racked a tile, or discarded, that discard is out of reach for everyone.",
    varies_by_house: false,
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("Follows from the owner-approved calling entry (calling is a choice; the window closes when the next player racks); the spoken claim requirement is the League verbalization rule carried on the hold-or-wait entry (rulebook 2024 p.17)", 2024),
  },
  {
    id: "payments-basics",
    category: "scoring",
    level: "advanced",
    questions: ["Who pays after a win, and how much?"],
    related: ["mahjong-in-error-settlement","wall-game","dead-hand-pays"],
    tags: ["money"],
    topic: "Payments after a win",
    question_patterns: [PAYMENT],
    keywords: ["pay", "double", "score", "jokerless"],
    requires: [PAYMENT],
    blocks: [/\b(cannot|can'?t|couldn'?t|don'?t|never) agree (on|about|over|whether|if|with|what|who|how|when)\b|\bdisputes?\b|\bargu(e|es|ed|ing|ment)\b|\bstalled\b|\b(table|group|everyone|we all|whole table) (agrees?|decides?|wants?) to (skip|ignore|waive|drop|change)\b|\bcan we (skip|ignore|waive|drop|change)\b|\bforgot to (pick|draw)\b|\bwithout (picking|drawing)\b/i, ERROR_CUE, MISNAMED, DEAD, TOURNAMENT],
    equivalents: ["pay-discard-win", "wall-game-payment"],
    answer:
      "The League sets who pays and how much. Your table sets what a point is worth. Who pays: the winner announces the hand and its value, then tells each player what to pay. Win on another player's discard and that discarder pays double the hand's value while the other two players each pay the single value. Pick your own winning tile from the wall and all three players pay double. Completing your hand by redeeming a joker as your last move before declaring counts as a self pick. Jokerless: if your hand could have used jokers and has none when you declare, the value doubles again, and that stacks, so a jokerless win on a discard costs the discarder 4 times the value while the other two pay double. Say the hand is jokerless when you declare, because you lose the bonus if you forget. Hands in the Singles and Pairs group get no jokerless bonus, since their printed value already accounts for it, but the self pick double still applies. A player whose hand went dead still pays the winner. If the wall runs out and nobody declares mahjong, no one wins and no one pays. Amounts: the card prints a value beside each hand, and those values are points. The League does not require you to play for money. Many tables treat a point as a penny, but chips, paper scoring, and playing for nothing are all fine. A wall game kitty, an ante, and any cap on losses are table customs, not League rules. Sanctioned tournaments score differently, so follow the director's rules there.",
    varies_by_house: true,
    house_note:
      "What a point is worth, kitties, antes, and loss caps are table customs.",
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 p.26 (payment structure, jokerless double with the Singles and Pairs exclusion) and p.17; the card prints each hand's value; amounts in money are table custom, not League rule; located and cross-checked via Mahj Life wiki articles 208, 151, 99, 98, 97, 72, 137, 155, 238, 45 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "calling-quints-sextets",
    category: "calling",
    level: "advanced",
    questions: ["Can I call a discard for a quint or sextet?"],
    related: ["pung-vs-kong","calling-for-exposure","joker-call-complete"],
    topic: "Calling a discard for a quint or sextet",
    question_patterns: [QUINT_SEXTET, CLAIM_VERB],
    keywords: ["quint", "sextet", "call"],
    requires: [QUINT_SEXTET, CLAIM_VERB],
    answer:
      "Yes. You may call a discard to complete any group of 3 or more identical tiles, and that includes a 5 tile Quint and a 6 tile Sextet. The rest of the group must already be in your hand, with jokers allowed to fill in, and the entire group goes face up on your rack in one move. One limit applies: a call must complete a whole block as printed on the card, never part of one. If your hand shows 6 flowers as a single block, you cannot call a flower to expose just 3 of them; you need the other 5 in hand so that one call finishes all 6. A hand marked concealed cannot call for any exposure.",
    varies_by_house: false,
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2020 p.23 #10 and 2024 p.15, bulletins 1993 p.5, 2001, 2015, 2019; the whole-block limit comes from the same rule; located and cross-checked via Mahj Life wiki articles 146 and 254", 2024),
  },
  {
    id: "exposures-basics",
    category: "calling",
    level: "core",
    questions: ["What is an exposure?"],
    related: ["expose-immediately","calling-for-exposure","wrong-exposure"],
    topic: "Exposures",
    question_patterns: [EXPOSURE_WORD],
    keywords: ["exposure", "expose", "rack"],
    requires: [EXPOSURE_WORD],
    blocks: [/\bknocked\b|\bfell\b|\bdropped\b|\boff the table\b/i, DRAGON_SUIT_ASK, CLAIM_VERB, (q: string) => JOKER_EXCHANGE.test(q) && !CHANGE_EXPOSURE.test(q), HAND_CLOSED, DEAD, TWO_PLAYERS],
    answer:
      "An exposure is a group you called: the discard plus the matching tiles from your hand, placed face up on top of your rack. Only a Pung, Kong, Quint, or Sextet can be exposed, never a pair. You may fix a mistake in an exposure only until you discard or exchange a joker; after either, it is locked, and the only later change is a player redeeming a joker in it. Every exposure must fit one hand on the card, and if your exposures cannot all fit the same hand, your hand is dead. A hand marked concealed makes no exposures.",
    varies_by_house: false,
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: researched("League rules on exposures, modifying an exposure before discarding, and dead hands; cross-checked via Mahj Life wiki articles 177, 189, and 254", 2024),
  },
  {
    id: "card-notation",
    category: "card",
    level: "core",
    questions: ["What do the colors and letters on the card mean?"],
    related: ["card-numbers","open-vs-closed","annual-card"],
    topic: "Reading the card (colors and letters)",
    question_patterns: [CARD_WORD, NOTATION],
    keywords: ["card", "color", "concealed", "exposed", "soap"],
    requires: [new RegExp(`${CARD_WORD.source}|\\bzero\\b(?![^.?!]{0,12}\\bjokers?\\b)|${CX_LETTERS.source}|\\b[CX] (after|next to|beside|behind) (a|the|each|every) hand\\b|\\b20\\d\\d in it\\b|\\bhas 20\\d\\d\\b`, "i"), NOTATION],
    blocks: [/\bhow many tiles\b|\bzero jokers\b/i, /\b(come(s)? out|release|publish|new card|next card|when)\b/i],
    answer:
      "On the card, each color stands for a different suit, not a fixed one: a hand shown in a single color uses one suit, and a hand shown in three colors uses three different suits. C after a hand means it must be played concealed; X means exposures are allowed. F stands for a flower, D for a dragon, and the winds appear by their first letters. Jokers are never printed in a hand; they stand in for tiles inside any group of 3 or more identical tiles. In hands that show a year or another number with a zero, the Soap plays the zero.",
    varies_by_house: false,
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "nmjl_clarification",
    provenance: researched("Card legend conventions (colors as suits, C and X, F and D, Soap as zero); cross-checked via Mahj Life wiki articles 162, 254, and 269", 2026),
  },
  {
    id: "tournament-rules",
    category: "tournament",
    level: "core",
    questions: ["How do tournament rules differ from standard play?"],
    related: ["courtesies-vs-rules","house-vs-nmjl","hold-or-wait"],
    topic: "Tournament rules versus standard play",
    question_patterns: [TOURNAMENT],
    keywords: ["tournament", "director"],
    requires: [TOURNAMENT, /\b(rules?|differ|different|differs|standard|league play|director'?s?|penalt(y|ies)|scoring|time limit|timed)\b/i],
    blocks: [/\b(near|nearby|in my area|\d{5}|looking for|find|register|sign up)\b/i, placeAfterPrep],
    answer:
      "Tournaments play by National Mah Jongg League rules as the foundation, but each tournament director adds procedures of their own: timed rounds, a point system, and penalties for things like misnamed discards. Those are tournament rules, not League law: they apply only at that event and never change the League's rules for regular play. At a tournament, the director's rule governs; away from it, the League rule does.",
    varies_by_house: false,
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "tournament_rule",
    provenance: researched("Tournament conventions layered on League rules; cross-checked via Mahj Life wiki article 186", 2024),
  },
  {
    id: "blank-tiles",
    category: "basics",
    level: "core",
    questions: ["Can we play with blank tiles?"],
    related: ["courtesies-vs-rules","house-vs-nmjl","tile-count"],
    topic: "Blank tiles",
    question_patterns: [BLANK],
    keywords: ["blank", "blanks"],
    requires: [BLANK],
    blocks: [
      /\b(buy|buying|purchase|store|shop|for sale|price|prices|cost|costs|sell|sells|order|amazon)\b/i,
      // A blank field on a form, a blank page, a blank stare: support and everyday senses.
      /\bblanks? (check|page|space|form|field|fields|line|lines|box|boxes|cell|cells|row|rows|screen|entry|slate|stare|expression|look)\b/i,
    ],
    answer:
      "Blank tiles are not part of League play. They come with many sets as spares to replace a lost tile. Some tables use them as a house rule, usually letting a player trade a blank for a tile in the discard area. If your table plays with blanks, agree on the details before the first hand, and remember that a table using them is not playing standard League rules.",
    varies_by_house: true,
    house_note: "Blank rules differ from table to table by design.",
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "high",
    classification: "house_optional_rule",
    provenance: researched("Blanks as a house variation outside League rules; cross-checked via Mahj Life wiki article 279", 2025),
  },
  {
    id: "last-tile-of-wall",
    category: "winning",
    level: "advanced",
    questions: ["Can the last tile of the wall be called?"],
    related: ["wall-game","calling-discard","wall-game-payment"],
    topic: "The last tiles of the wall",
    question_patterns: [LAST_OF_WALL, FINAL_DISCARD_SCENE],
    keywords: ["last tile", "wall runs out"],
    // Gated on the wall-context matcher, not the bare one. LAST_OF_WALL's first
    // alternative matches any "last tile", so "can I call the last tile she threw" is an
    // ordinary calling question that must not reach the end-of-wall answer.
    requires: [FINAL_DISCARD_SCENE],
    // A payment-framed wall question is payments-basics' (FMG) or wall-game-payment's (LVM),
    // so each site serves the payment wording its own owner decided.
    blocks: [HAND_CLOSED, (q: string) => NO_WINNER_SCENE.test(q) && /\b(pay|pays|paid|paying|payment|payout|owe|owes|settle|collect)\b/i.test(q) && !CLAIM_VERB.test(q)],
    answer:
      "League rules do not change as the wall gets short. While any tiles remain in the wall, you may call a discard for an exposure or for mahjong, right down to the last tile. A table that bans calls near the end plays a house rule, often called a cold wall. Groups define it differently, since some bar only exposure calls and others bar every claim. A hot wall is the matching house rule at the other end, penalizing a player who throws the winning tile late in the deal. No League rulebook or bulletin we found carves out an exception for a short wall, so neither one is a League rule. Anyone may still claim the very last discard of the deal for mahjong. On whether you may instead call that final discard only to make an exposure, we found no published League ruling either way, so agree at your table how you will handle it until the League settles it. If the last tile of the wall is drawn and discarded and no one declares mahjong, the hand ends with no winner and no one pays.",
    varies_by_house: true,
    house_note:
      "Cold wall and hot wall restrictions and any last-tile bonus are table rules, so agree on them before the first hand.",
    approval: "owner_approved",
    last_verified: OWNER_DECIDED,
    confidence: "high",
    classification: "standard_nmjl_rule",
    provenance: ownerApproved("League rulebook 2024 pp.15 and 16 (wall game) and p.17 #8 (calling window), bulletins 1976 to 2014, none of which carves out a depleted wall; the exposure call on the deal's final discard is unresolved in published League material and is on the authoritative-resolution queue; located and cross-checked via Mahj Life wiki articles 107, 131, 137, 235 and the Sloperama American mahjong FAQ", 2024),
  },
  {
    id: "hand-choice-strategy",
    category: "strategy",
    level: "core",
    questions: ["Which hand should I go for?"],
    related: ["card-numbers","charleston","open-vs-closed"],
    topic: "Choosing a hand (strategy)",
    question_patterns: [STRATEGY],
    keywords: ["strategy", "which hand", "tips"],
    requires: [STRATEGY],
    answer:
      "Choosing a hand is strategy, not a rule, so there is no single right answer. A common approach: after the deal, sort your tiles by suit and by number, look for the card section your tiles already lean toward, keep two or three candidate hands open through the Charleston, and commit once an exposure would lock you in. Play the tiles you have, not the hand you wish you had.",
    varies_by_house: false,
    approval: "research_verified",
    last_verified: VERIFIED_AUDIT,
    confidence: "medium",
    classification: "strategy",
    provenance: researched("General instructional strategy, not a League rule; cross-checked via Mahj Life wiki article 183", 2024),
  },
];
