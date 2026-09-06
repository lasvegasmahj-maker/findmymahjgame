// Charleston entries ported from Las Vegas Mahjong (the content/rules charleston module and
// lib/ask/knowledge.ts at 58b6999, plus the owner's 2026-08-29 decisions). Answers are verbatim
// page text or owner-approved wording; nothing is edited here. Patterns are written in the
// shared matcher dialect (natural English, case-insensitive, plural tolerant) so both sites
// route identically. See docs/CORPUS-ADJUDICATION.md.

import type { CanonicalRule } from "./types.ts";
import {
  BLIND_PASS, CHARLESTON_WORD, CLAIM_VERB, COURTESY, DEAD, DECLINE_CALL, DISCARDED, EXPOSURE_WORD, JOKER,
  JOKER_PASS, MAHJONG_CUE, NAMING, OTHER_TOPIC, PASS_VERB, STOP_OR_AGREE, THREE_PLAYER_SEATS, CHARLESTON_STOP_ASK, OTHERS_TILES,
} from "./matchers.ts";
import { lvmPage, LVM_OWNER_2026_08_29, lvmPending } from "./entries-fmg.ts";

const VERIFIED_LVM = "2026-08-29" as const;

// Three-player-procedure refuses anything naming another topic, so this stands down only where that entry answers.
const THREE_HANDED_PLAIN = (q: string) => THREE_PLAYER_SEATS.test(q) && !OTHER_TOPIC.test(q);

const NAMED_PASS = /\b(first|second|third|last|1st|2nd|3rd) (right|across|left)\b/i;
// The pre-play passing itself: the Charleston by name, a pass verb, or one of the named passes.
const PASS_ACT = new RegExp(`${CHARLESTON_WORD.source}|${PASS_VERB.source}|${NAMED_PASS.source}|\\b(right|left|across),? (across|left|right),? (then |and )?(left|right|across)\\b|\\bsecond (go )?round\\b`, "i");
// A pass that was made, never the bare Charleston, so a tile count gone wrong after it stays with the count entry.
const PASS_MADE = new RegExp(`${PASS_VERB.source}|${NAMED_PASS.source}`, "i");
// How the passes run: how many, in what order, which direction. A lone named pass ("first left, what is that") is the Charleston definition's.
const PASS_SEQUENCE_ASK =
  /\bhow many (passes|rounds|times|exchanges)\b|\b(\d+|two|three|four|five|six) (passes|rounds)\b(?! (of|to|for) (the )?(courtesy|blind))|\b(number|order|sequence|direction|steps?|rounds?) (of|for|in|to) (the |a |each )?(passes|passing|pass|charleston)\b|\b(what|which) order\b|\border\b(?! to\b)[^.?!,;]{0,25}\bpass(es|ing)?\b|\bpass(es|ing)?\b[^.?!,;]{0,25}\border\b(?! to\b)|\b(first|second|third|last|1st|2nd|3rd) (right|across|left) pass(es)?\b|\b(first|second|third|last|1st|2nd|3rd) pass(es)?\b|\b(right|left)(,| and| or| then|, then|, and)? across\b|\bacross(,| and| or| then|, then|, and)? (right|left)\b|\b(right|left)( and| or| then|, then|, and) (right|left)\b|\bwhich (way|direction)\b[^.?!]{0,25}\bpass|\bpass(es|ed|ing)? (to the |to your |to my )?(right|left|across)\b|\b(right|left|across) (first|second|next|last)\b|\b(first|second|another|whole|entire|full) charleston\b|\bwho (do|does|should|am) (i|we|you) pass(ing)? to\b|\bpass (to whom|to who)\b/i;
// "look for" is a search and "i see, so" is a preface, not a look at the tiles.
const LOOK_VERB =
  /\b(look|looks|looked|looking)\b(?!\s+for\b)|\bsee\b(?![,.;:]| (so|if|how|why|what happens)\b)|\b(sees|seeing|saw|peek|peeks|peeked|peeking|glance|glanced|glancing|view|viewing|examine|examining|sneak a look|flip (them|it) over|turn (them|it) over)\b/i;
// A pass of the wrong size. Three is the right count, and a hand holding 14 afterward is the tile-count entry's.
const COUNT_OFF =
  /\b(wrong|incorrect|odd|off|different) (number|count|amount)\b|\b(counts?|numbers?) (is|are|was|were) (off|wrong)\b|\b(too many|too few|not enough|fewer|less than (three|3)|more than (three|3)|only (one|two|1|2)|just (one|two|1|2)|(one|two|four|five|1|2|4|5) tiles?|miscount\w*|short(ed)? (a|one|me a) tile|one short|one too many|one too few|forgot (a|one|to pass a) tile|missed a tile|(two|2|four|4) instead of (three|3)|(one|two|four|1|2|4) not (three|3))\b/i;
// A joker on the move in the Charleston: passed, or sent in a pass direction. A bare "right" or "left" is not a direction.
const JOKER_PASSED = new RegExp(
  `${JOKER_PASS.source}|\\bjokers?\\b[^.?!,;]{0,30}\\b((to the|on the|first|second|last) (right|left|across)|across)\\b|\\b((to the|on the|first|second|last) (right|left|across)|across)\\b[^.?!,;]{0,30}\\bjokers?\\b|\\bcharleston\\b[^.?!]{0,60}\\b(hand|hands|give|gives|giving|handing|slide|slip|send|sending)\\b[^.?!,;]{0,30}\\bjokers?\\b|\\b(hand|hands|give|gives|giving|handing|slide|slip|send|sending)\\b[^.?!,;]{0,30}\\bjokers?\\b[^.?!]{0,60}\\bcharleston\\b|\\bjokers?\\b[^.?!]{0,40}\\b(my |the |our )?(3|three|2|two|1|one|first|second|last) (across|left|right)\\b|\\b(my |the |our )?(3|three|2|two|1|one|first|second|last) (across|left|right)\\b[^.?!]{0,40}\\bjokers?\\b`,
  "i",
);
// The Charleston as the scene of a claim: by name, a passed tile, or the time before East opens.
const CHARLESTON_SCENE = new RegExp(
  `${CHARLESTON_WORD.source}|\\bpassed tiles?\\b|\\btiles? (that'?s |that |which |someone |she |he |they |i |you |we )?((was|were|got|is|are|being|just) )?passed\\b|\\b(during|in|before|after|from|while) (the |a |we are |we're |everyone is |still )?(pass(es|ing)?|first (right|across|left))\\b|\\bwhile\\b[^.?!,;]{0,20}\\bpass(ing|es)\\b|\\bbefore (the game|play|east) (starts|begins|opens|discards)\\b`,
  "i",
);
// Calling once the Charleston is over is ordinary calling; "what do you call the passing" is a naming question.
const CHARLESTON_OVER = /\bafter (the |a |our )?charleston\b|\bcharleston (is|was) (over|done|finished|complete)\b|\bcharleston (ends|ended)\b/i;
const NAMING_SENSE = /\bwhat (do|does|would) (you|we|they|one|people) call\b|\bwhat is (it|that|this) called\b|\bis (it|that|this) called\b/i;
const PASSED_AWAY = new RegExp(
  `${PASS_VERB.source}|\\bgave (away|up|it|that|them|her|him|my)\\b|\\bgiving away\\b|\\bgot rid of\\b|\\bhanded (over|off|away|it|them)\\b`,
  "i",
);
// The passed tile mattered: it was the winning tile, or one the player needed.
const TILE_MATTERED = new RegExp(
  `${MAHJONG_CUE.source}|\\b(tile|tiles|one|it|them)\\b[^.?!,;]{0,30}\\b(need|needs|needed|want|wants|wanted|could have used|could use|was (waiting|hoping|going|looking) for|should have kept|was using|was collecting|was saving)\\b|\\b(need|needed|wanted|good|useful|key|important|perfect|missing)\\b[^.?!,;]{0,20}\\btiles?\\b|\\bgave away\\b|\\bwish i (had )?kept\\b|\\bshould have kept\\b|\\bregret\\b|\\bby (mistake|accident)\\b[^.?!,;]{0,30}\\btiles?\\b`,
  "i",
);
const TILE_REF = /\b(tiles?|it|one|them|that one)\b/i;
// A tile passed to you was received, not given away.
const TILE_RECEIVED = /\bpass(ed|es)? (to )?(me|us)\b|\bwas passed to (me|us)\b|\bgot passed\b|\breceived?\b/i;

export const LVM_CHARLESTON: CanonicalRule[] = [
  {
    id: "charleston-passes",
    category: "charleston",
    level: "foundational",
    questions: ["How many passes are in the Charleston?"],
    related: ["charleston","courtesy-pass","charleston-blind-pass"],
    topic: "The Charleston passes",
    question_patterns: [
      PASS_SEQUENCE_ASK,
      CHARLESTON_WORD,
      /\bhow many (passes|rounds|times)\b/i,
      /\b(first|second) charleston\b/i,
    ],
    keywords: ["passes", "first charleston", "second charleston", "across"],
    requires: [PASS_ACT, PASS_SEQUENCE_ASK],
    blocks: [BLIND_PASS, COURTESY, CHARLESTON_STOP_ASK, JOKER, THREE_HANDED_PLAIN],
    answer:
      "The first charleston has three mandatory passes: first right (3 tiles), first across (3 tiles), and first left (3 tiles). After the first charleston, players may continue into a second charleston with the same three passes in reverse order: second left, second across, last right. The second charleston is optional: once the first left pass is done, any single player may call to stop.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("charleston.passes", "card"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "look-before-pass",
    category: "charleston",
    level: "core",
    questions: ["Can I look at tiles before passing them?"],
    related: ["charleston-blind-pass","charleston-passes","courtesy-pass"],
    topic: "Looking at tiles before passing",
    question_patterns: [
      LOOK_VERB,
      new RegExp(`(?:${LOOK_VERB.source})[^.?!]{0,40}${PASS_VERB.source}|${PASS_VERB.source}[^.?!]{0,40}(?:${LOOK_VERB.source})`, "i"),
      /\b(allowed|can|may|ok|okay) (to )?(i |you |we )?(look|peek|see)\b/i,
    ],
    keywords: ["look", "peek", "see", "pass"],
    requires: [LOOK_VERB, PASS_ACT],
    // A question naming the blind pass belongs on charleston-blind-pass, which carries the rule that blind tiles stay unseen.
    blocks: [OTHERS_TILES, BLIND_PASS, JOKER, DISCARDED, EXPOSURE_WORD, THREE_HANDED_PLAIN],
    answer:
      "Yes, always. You choose which 3 tiles to pass and you may look at anything in your hand. The blind pass on the first left or last right pass is simply an option to pass 1, 2, or 3 of the tiles you just received without looking at them; you may still look if you prefer.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("charleston.look", "card"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "wrong-pass-count",
    category: "charleston",
    level: "advanced",
    questions: ["What happens if someone passes the wrong number of tiles?"],
    related: ["charleston-passes","dead-hand-triggers","disputes"],
    topic: "Wrong number of tiles passed",
    question_patterns: [
      COUNT_OFF,
      new RegExp(`(?:${COUNT_OFF.source})[^.?!]{0,40}${PASS_VERB.source}|${PASS_VERB.source}[^.?!]{0,40}(?:${COUNT_OFF.source})`, "i"),
      /\b(wrong|bad|botched|messed up|short) pass\b|\bmessed up (a |the |my |our )?pass\b/i,
    ],
    keywords: ["wrong number", "too many", "too few", "only two", "pass"],
    requires: [PASS_MADE, COUNT_OFF],
    // "pass on one tile" is declining a discard during play, not a short pass.
    blocks: [BLIND_PASS, COURTESY, JOKER, (q: string) => DISCARDED.test(q) && !/\bpassed (me )?\d tiles\b|\bkept one\b|\bonly passed\b/i.test(q), /\bpass(es|ed|ing)? on (a |the |that |this |my |her |his |their |one |every )?(discard|tile)/i, THREE_HANDED_PLAIN],
    answer:
      "If a player passes the wrong number of tiles and it is caught before play begins, the pass should be corrected. If it is caught after the first tile is drawn, house rules typically apply. A common remedy is to correct the count if possible, or replay the charleston if necessary.",
    varies_by_house: true,
    house_note: "Once play has started, tables handle a bad pass differently; agree on it before you begin.",
    confidence: "medium",
    approval: "owner_approved",
    classification: "house_optional_rule",
    provenance: lvmPage("charleston.wrong-count", "house"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "charleston-jokers",
    category: "charleston",
    level: "core",
    questions: ["Can I pass a joker in the Charleston?"],
    related: ["charleston","charleston-blind-pass","charleston-stop"],
    topic: "Jokers in the Charleston",
    question_patterns: [
      JOKER_PASSED,
      JOKER,
      new RegExp(`\\bjokers?\\b[^.?!]{0,40}${CHARLESTON_WORD.source}|${CHARLESTON_WORD.source}[^.?!]{0,40}\\bjokers?\\b`, "i"),
      /\b(have|need|required|forced|allowed|ok|okay|supposed|want) to pass\b[^.?!]{0,20}\bjokers?\b/i,
    ],
    keywords: ["joker", "pass", "charleston"],
    requires: [JOKER, JOKER_PASSED],
    blocks: [DISCARDED, DEAD],
    answer:
      "No, and you may not: jokers cannot be passed in the charleston at all. Any other 3 tiles may be passed, so hold your jokers and pass something else.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("charleston.pass-jokers", "card"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "call-during-charleston",
    category: "charleston",
    level: "core",
    questions: ["Can I call a tile during the Charleston?"],
    related: ["charleston","calling-discard","dealing"],
    topic: "Calling during the Charleston",
    question_patterns: [
      CLAIM_VERB,
      CHARLESTON_SCENE,
      new RegExp(`${CLAIM_VERB.source}[^.?!]{0,50}${CHARLESTON_WORD.source}|${CHARLESTON_WORD.source}[^.?!]{0,40}${CLAIM_VERB.source}`, "i"),
    ],
    keywords: ["call", "charleston", "pass"],
    requires: [CLAIM_VERB, CHARLESTON_SCENE],
    // "call to stop" and "call out the tile" are the stop rule and the naming rule.
    blocks: [STOP_OR_AGREE, NAMING, NAMING_SENSE, CHARLESTON_OVER, THREE_HANDED_PLAIN],
    answer:
      "No. The Charleston is the tile passing that happens before play begins, and the first discard only happens after the Charleston, when East opens play. There are no discards during the Charleston, so there is nothing to call.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: LVM_OWNER_2026_08_29,
    last_verified: VERIFIED_LVM,
  },
  {
    id: "passed-winning-tile",
    category: "winning",
    level: "core",
    questions: ["What if I passed my winning tile in the Charleston?"],
    related: ["charleston","look-before-pass","charleston-passes"],
    topic: "A winning tile passed away",
    question_patterns: [
      TILE_MATTERED,
      new RegExp(`(?:${PASSED_AWAY.source})[^.?!]{0,40}(?:${TILE_MATTERED.source})|(?:${TILE_MATTERED.source})[^.?!]{0,40}(?:${PASSED_AWAY.source})`, "i"),
      /\bgave away\b/i,
    ],
    keywords: ["passed", "winning tile", "needed", "gave away", "charleston"],
    // Three concepts, so a pass made by mistake outranks the false-mahjong entry, whose error concept it shares.
    requires: [PASSED_AWAY, TILE_MATTERED, TILE_REF],
    // "can I pass on the winning tile" during play is declining a discard; with the Charleston named it is the owner's own phrasing.
    blocks: [DISCARDED, JOKER, (q: string) => CLAIM_VERB.test(q) && !/\b(claim|take|get|call) it back\b/i.test(q), TILE_RECEIVED, (q: string) => DECLINE_CALL.test(q) && !CHARLESTON_WORD.test(q), THREE_HANDED_PLAIN],
    answer:
      "This happens! If you accidentally pass a tile you could have used to win, you simply continue play. Nothing on the card penalizes it; you just do not have that tile anymore.",
    varies_by_house: false,
    confidence: "high",
    approval: "research_verified",
    classification: "standard_nmjl_rule",
    provenance: lvmPending("winning.passed-winning-tile: kept pending by the owner's 2026-08-29 decision"),
    last_verified: VERIFIED_LVM,
  },
];
