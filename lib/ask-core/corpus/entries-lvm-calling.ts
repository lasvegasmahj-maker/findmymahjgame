// Calling entries ported from Las Vegas Mahjong (content/rules calling-tiles and etiquette
// pages at 58b6999). Answers are verbatim page text; nothing is edited here. Patterns are
// written in the shared matcher dialect so both sites route identically.

import type { CanonicalRule } from "./types.ts";
import {
  CLAIM_VERB, JOKER, JOKER_EXCHANGE, DEAD, EXPOSURE_WORD, HAND_CLOSED, MISNAMED, OWN_DISCARD, CHARLESTON_WORD,
  ERROR_CUE, QUINT_SEXTET, FINAL_DISCARD_SCENE, DISCARDED, BLIND_PASS, PASS_VERB,
  MAHJONG_ANY_TURN,
  MAKE_EXPOSURE,
} from "./matchers.ts";
import { lvmPage, lvmPending } from "./entries-fmg.ts";

// "Hong Kong" is a style name the ruleset clarification handles, never a set of four.
const SET_WORD = new RegExp(`\\b(pungs?|(?<!hong )kongs?|three of a kind|four of a kind)\\b|${QUINT_SEXTET.source}`, "i");
const SET_DEFINITION = new RegExp(
  `\\b(what|whats|which)('?s| is| are| does| do| exactly is)?\\b[^.?!]{0,40}${SET_WORD.source}|\\b(define|definition|meaning|mean|means|explain|stand for|stands for|term)\\b[^.?!]{0,30}${SET_WORD.source}|${SET_WORD.source}[^.?!]{0,30}\\b(mean|means|meaning|definition|defined|is when|is what)\\b|${SET_WORD.source}[^.?!]{0,25}\\b(vs\\.?|versus|or|and|from|compared|differ\\w*)\\b[^.?!]{0,25}${SET_WORD.source}|\\bdifference\\b[^.?!]{0,40}${SET_WORD.source}|\\bhow (many|big|large)\\b[^.?!]{0,30}${SET_WORD.source}|${SET_WORD.source}[^.?!]{0,30}\\bhow many\\b|\\b(three|3|four|4|five|5|six|6) (identical|matching|of the same|same|like)\\b[^.?!]{0,20}\\btiles?\\b`,
  "i",
);
const JOKER_NEEDED = new RegExp(
  `\\b(need|needs|needed|require|requires|required|without|no|have to (use|have|include)|must (use|have|include)|possible|only with|can'?t (make|have|build|get)|cannot (make|have|build|get))\\b[^.?!]{0,30}\\bjokers?\\b[^.?!]{0,30}${QUINT_SEXTET.source}|${QUINT_SEXTET.source}[^.?!]{0,30}\\b(need|needs|needed|require|requires|required|without|no|have to|must|possible|only with|can'?t|cannot)\\b[^.?!]{0,30}\\bjokers?\\b|\\bjokers?\\b[^.?!]{0,20}\\b(need|needs|needed|required|necessary|a must|mandatory)\\b[^.?!]{0,30}${QUINT_SEXTET.source}|${QUINT_SEXTET.source}[^.?!]{0,40}\\bjokers?\\b[^.?!]{0,20}\\b(needed|required|necessary|mandatory)\\b`,
  "i",
);
// "what is a set of four called" is a definition question, not a claim.
const NAMING_SENSE = /\bwhat (is|are|do you|do we|would you|does one) (it |that |this |they |those )?call(ed)?\b|\bcalled when\b|\bis (it|that|this) called\b/i;
const WIN_WORD = /\b(win|wins|winning|won|go out)\b/i;

const CLAIM_LOOSE = new RegExp(`${CLAIM_VERB.source}|\\b(get|use|take|takes|taking|took|reach(ing)? (for|back)|go(ing)? back (for|to|and))\\b`, "i");
const DISCARD_OR_CLAIM = new RegExp(`${CLAIM_LOOSE.source}|${DISCARDED.source}|\\btiles?\\b`, "i");
const EARLIER_DISCARD =
  /\b(most recent(ly)?|latest|newest|last one|only the last|the last (discard|tile) (thrown|discarded|put down)|earlier|older|previous|prior|before (that|the last|the latest|the most recent)|ago|turns? (back|before)|a while back|from before|earlier in the (game|hand|round|deal)|already (on the table|been discarded|out there)|old discards?|past discards?|any (discard|of the discards|tile (on the table|in the (middle|pile|pool|discard area)))|(discard|tile) (pile|pool|area|row)|(tiles?|discards?) (already )?(in|on|from) the (middle|pile|pool|center)|two (discards|tiles) back|not the (last|most recent|latest|newest)|(someone|somebody|she|he|they) (discarded|threw|put down|tossed) (it |that |the tile )?(earlier|before|a while ago|a few turns ago|last round|last turn))\b/i;
const WIN_CUE = /\b(win|wins|winning|won|go out|(for|declare|declaring|call|calling|called|to) mahjong|mahjong (on|with) (it|that|the tile|the discard))\b/i;

const KEEP_HIDDEN =
  /\b(concealed|conceal|hidden|hide|hiding|unexposed|not exposed|secret(ly)?|face down|out of sight|without (exposing|an exposure|showing|revealing|putting (it|them) down|laying (it|them) down|melding)|(keep|keeping|kept|leave|leaving|hold|holding|stay|stays|staying|put|putting|add|adding|added|bring|bringing|take|taking|slide|sliding)\b[^.?!,;]{0,20}\b(in my hand|into my hand|to my hand|in (my|the) rack|behind (my|the) rack|inside (my|the) rack|to myself|private)|(not|never|don'?t|do not|instead of|rather than|no need to|without having to) (show|expose|reveal|meld|put (it|them|the tiles?|the group|the pung|the kong) down|lay (it|them|the tiles?|the group|the pung|the kong) down|place (it|them) on (top of )?(my|the) rack)|(secret|private|hidden|concealed|closed|unexposed) (pungs?|kongs?|quints?|sextets?|groups?|sets?|section|part|portion|blocks?|melds?))\b/i;

const EXPOSE_SHOW = new RegExp(
  `${EXPOSURE_WORD.source}|\\b(show(s|ed|ing)?(?! up)|reveal(s|ed|ing)?|display(s|ed|ing)?|turn (it|them|the tiles?) (over|up)|flip (it|them|the tiles?)( over)?|(placed?|placing|put|putting|set|setting) (it|them|the (tiles?|group|set|pung|kong))? ?(on|onto|on top of) (my|the|your) rack)\\b`,
  "i",
);
const IMMEDIACY =
  /\b(immediately|right away|right then|at once|straight away|as soon as|instantly|on the spot|before (i|you) discard|until (i|you) discard|after (i|you) discard|when (i|you) call|after (i|you) call|once (i|you) call|change|changed|fix|adjust|rearrange|swap|move|alter|locked|lock(ed)? in|committed|undo|take back|first)\b/i;

const CALL_WINDOW =
  /\b(how (fast|quick|quickly|long|soon|much time|late)|too late|late|window|time limit|timer|timing|deadline|cutoff|cut off|in time|quick enough|fast enough|too slow|slow|hesitat\w+|promptly|speed|(before|until|once|after|when) the next (player|person|one)|next (player|person) (has )?(already )?(picks?|picked|draws?|drew|drawn|racks?|racked|takes?|took|taken|discards?|discarded|goes|went|moves?|moved)|already (picked|drew|drawn|racked|took|taken|discarded|moved on|gone|started)|(picked|drew|drawn|racked|took|taken)\b[^.?!,;]{0,20}\b(from the wall|next tile|their tile|a tile|the wall)|racked (it|the tile|their tile|her tile|his tile)|(still|yet) (call|claim|take|get|grab|allowed|able)|miss(ed|ing)? (it|the tile|the discard|my chance|the chance|the call|out)|(chance|window|opportunity) (is|has) (gone|closed|passed|over)|closes?|(too|so) (fast|quick|slow)|reaction|before (she|he|they|someone|somebody) (picks?|picked|draws?|drew|racks?|racked|discards?)|how long (do|does|can|before|after|until))\b/i;

// TWO_PLAYERS also holds hold and wait; those questions belong to hold-or-wait, so this
// entry takes only the two-caller sense.
const TWO_CALLERS = /\b(both|two (players|people|of us|ladies|folks|gals|guys)|more than one|multiple players|several players|same (tile|discard)|at the same time|simultaneous(ly)?|who gets|who has priority|priority|first dibs|another player (also )?(calls|called|wants|wanted)|(she|he|they|someone) (also )?(called|calls|wants|wanted) (it|the same|that tile|that same))\b/i;
const TWO_CALLS_RULING =
  /\b(what happens|what if|what is the rule|what'?s the rule|rule (for|when|if|on|about)|how (is|do you|do we|does the table|does it) (it |that |this )?(settled|decided|resolved|handled|handle|settle|decide|resolve|work)|seat(s|ed|ing)?|position|counter ?clockwise|clockwise|closest|nearest|next in (turn|line|order)|turn order|natural order|order of play|already (exposed|racked|put|placed|laid|taken)|(exposed|racked) (it )?first|beat(s)? (me|her|him|them) to it|pungs?|kongs?|quints?|sextets?|tie ?break\w*|a tie|ties)\b/i;

const CALL_WORD = /\b(call|calls|called|calling|claim|claims|claimed|claiming)\b/i;
const OUT_OF_TURN_CUE =
  /\b(out of turn|wrong turn|(not|wasn'?t|isn'?t|was not|is not) (my|your|her|his|their|the right) turn|(before|ahead of) (my|your|her|his|their) turn|too (early|soon)|jump(ed|ing|s)? (the gun|ahead|the turn|(my|her|his|their) turn)|before (she|he|they|the discarder|the player) (has |had |have |even |was |is )?(named|names|said|announced|finished|done)|before (the tile|it|the discard) (is|was|has been) (even )?named|(skipp?(ed|ing)?|skips) (a |my |her |his |their |the )?turn)\b/i;
// The call itself is what happened out of turn; a pick out of turn is picking-ahead's rule.
const CALL_OUT_OF_TURN = new RegExp(
  `${CALL_WORD.source}[^.?!,;]{0,30}${OUT_OF_TURN_CUE.source}|${OUT_OF_TURN_CUE.source}[^.?!,;]{0,30}${CALL_WORD.source}`, "i");

export const LVM_CALLING: CanonicalRule[] = [
  {
    id: "pung-vs-kong",
    aliases: ["quints-sextets"],
    category: "basics",
    level: "foundational",
    questions: ["What is the difference between a pung and a kong?"],
    related: ["card-numbers", "jokers-basics", "calling-discard"],
    topic: "Pungs, kongs, quints, and sextets",
    question_patterns: [SET_WORD, SET_DEFINITION, JOKER_NEEDED],
    keywords: ["pung", "kong", "quint", "sextet", "difference"],
    requires: [SET_WORD],
    blocks: [
      (q: string) => JOKER.test(q) && !JOKER_NEEDED.test(q),
      (q: string) => CLAIM_VERB.test(q) && !NAMING_SENSE.test(q),
      EXPOSURE_WORD,
      JOKER_EXCHANGE,
      DEAD,
      HAND_CLOSED,
      WIN_WORD,
    ],
    answer:
      "A pung is a set of three identical tiles. A kong is a set of four. A quint is five, and a sextet is six (both require jokers unless they are made of flowers, since a set has 8 of those). On the card, a group is shown by repeating the tile that many times; the card's key defines a Pair as 2 like tiles, a Pung as 3, a Kong as 4, a Quint as 5, and a Sextet as 6.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("calling-tiles.pung-vs-kong", "card"),
    last_verified: "2026-08-29",
  },
  {
    id: "most-recent-discard",
    category: "calling",
    level: "core",
    questions: ["Can I call any discard or only the most recent one?"],
    related: ["calling-discard", "call-window", "out-of-turn"],
    topic: "Calling only the most recent discard",
    question_patterns: [DISCARD_OR_CLAIM, EARLIER_DISCARD, CLAIM_LOOSE],
    keywords: ["most recent", "earlier discard", "older discard", "turns ago"],
    requires: [DISCARD_OR_CLAIM, EARLIER_DISCARD],
    blocks: [OWN_DISCARD, MISNAMED, JOKER_EXCHANGE, FINAL_DISCARD_SCENE, CHARLESTON_WORD, BLIND_PASS, PASS_VERB, WIN_CUE, DEAD, TWO_CALLERS],
    answer:
      "You can only call the most recently discarded tile, the one that was just discarded by the player whose turn just ended. You cannot call a tile that was discarded earlier in the game.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("calling-tiles.most-recent", "owner"),
    last_verified: "2026-08-29",
  },
  {
    id: "call-concealed",
    category: "calling",
    level: "core",
    questions: ["Can I call a tile for a concealed group?"],
    related: ["closed-hand-final-tile", "expose-immediately", "open-vs-closed"],
    topic: "Calling for a concealed group",
    question_patterns: [CLAIM_VERB, KEEP_HIDDEN],
    keywords: ["concealed", "hidden", "without exposing", "keep it in my hand"],
    requires: [CLAIM_VERB, KEEP_HIDDEN],
    blocks: [HAND_CLOSED, JOKER_EXCHANGE, MISNAMED, TWO_CALLERS, OWN_DISCARD, DEAD, ERROR_CUE, CHARLESTON_WORD],
    answer:
      "No. You can only call a discarded tile to complete a group that will be immediately exposed on the table. You cannot call a tile to add to a concealed section of your hand. The one exception is the tile that completes your mahjong: any tile except a joker may be called for mahjong, even for a concealed hand.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("calling-tiles.concealed", "card"),
    last_verified: "2026-08-29",
  },
  {
    id: "expose-immediately",
    category: "calling",
    level: "core",
    questions: ["Do I have to expose tiles right away when I call?"],
    related: ["wrong-exposure", "call-concealed", "joker-call-complete"],
    topic: "Exposing right away after a call",
    question_patterns: [CLAIM_VERB, EXPOSE_SHOW, IMMEDIACY],
    keywords: ["expose", "right away", "immediately", "change my exposure"],
    requires: [CLAIM_VERB, EXPOSE_SHOW],
    blocks: [KEEP_HIDDEN, MISNAMED, JOKER_EXCHANGE, HAND_CLOSED, ERROR_CUE, DEAD, OWN_DISCARD, CHARLESTON_WORD, FINAL_DISCARD_SCENE, MAKE_EXPOSURE],
    answer:
      "Yes. When you call a tile, you must immediately expose the completed group (pung, kong, quint, sextet, or the tiles for mahjong) on your rack. You may change the number and type of tiles shown in that exposure up until you discard; once you have discarded, the exposure is locked in and must be part of your final mahjong.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("calling-tiles.expose", "card"),
    last_verified: "2026-08-29",
  },
  {
    id: "call-window",
    category: "calling",
    level: "core",
    questions: ["How fast do I have to call a discard?"],
    related: ["most-recent-discard", "calling-discard", "own-discard"],
    topic: "How long the calling window stays open",
    question_patterns: [CLAIM_VERB, CALL_WINDOW],
    keywords: ["how fast", "too late", "window", "next player"],
    requires: [CLAIM_VERB, CALL_WINDOW],
    blocks: [HAND_CLOSED, JOKER_EXCHANGE, MISNAMED, OWN_DISCARD, CHARLESTON_WORD, BLIND_PASS, WIN_CUE, DEAD, FINAL_DISCARD_SCENE],
    answer:
      "You may claim a discard until the next player has picked a tile from the wall and racked it, or has discarded. Once that player has picked and racked, the window to call the previous discard is closed. There is no strict timer, but call promptly and say it out loud; hesitating too long is considered poor etiquette.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("etiquette.call-window", "card"),
    last_verified: "2026-08-29",
  },
  {
    id: "same-tile-two-calls",
    equivalents: ["two-players-same-tile"],
    category: "calling",
    level: "advanced",
    questions: ["What happens when two players call the same tile?"],
    related: ["calling-for-mahjong", "calling-discard", "call-window"],
    topic: "Two players calling the same tile",
    question_patterns: [TWO_CALLERS, CLAIM_VERB, TWO_CALLS_RULING],
    keywords: ["same tile", "both call", "two players", "priority"],
    requires: [TWO_CALLERS, CLAIM_VERB, TWO_CALLS_RULING],
    blocks: [ERROR_CUE, BLIND_PASS, CHARLESTON_WORD, MISNAMED, JOKER_EXCHANGE, DEAD],
    answer:
      "The player calling for mahjong (to win) has priority over all other calls regardless of seating position, even if the other caller has already exposed tiles. Among players calling for a pung, kong, quint, or sextet (not mahjong), the player who would receive the tile in the natural turn order takes priority (specifically, the player closest to the discarder going counterclockwise), unless the other caller has already claimed the tile by placing it on top of their rack or exposing tiles from their hand. The same tiebreak settles two players calling the same tile for mahjong.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("calling-tiles.two-callers", "card"),
    last_verified: "2026-08-29",
  },
  {
    id: "out-of-turn",
    category: "calling",
    level: "advanced",
    questions: ["What is calling out of turn?"],
    related: ["most-recent-discard", "call-window", "dead-hand-triggers"],
    topic: "Calling out of turn",
    question_patterns: [CALL_WORD, OUT_OF_TURN_CUE, CALL_OUT_OF_TURN],
    keywords: ["out of turn", "too early", "too soon", "wrong turn"],
    requires: [CALL_WORD, OUT_OF_TURN_CUE, CALL_OUT_OF_TURN],
    blocks: [MISNAMED, JOKER_EXCHANGE, CHARLESTON_WORD, BLIND_PASS, OWN_DISCARD, MAHJONG_ANY_TURN],
    answer:
      "Calling a tile that is not the most recent discard, or calling after the player next in turn has already picked and racked or discarded, is an out-of-turn call. The card says the tile may not be claimed, so the call does not stand and play goes on. The card names no penalty for the attempt itself; a hand is dead only if it ends up with too few or too many tiles or an incorrect exposure, and any further penalty is not printed on the card. A tile also cannot be claimed until it has been correctly named; what the card prints for a misnamed tile (a dead hand on an exposure, 4 times the value on a mahjong call) is on the dead hands and scoring pages.",
    varies_by_house: false,
    confidence: "high",
    approval: "research_verified",
    classification: "standard_nmjl_rule",
    provenance: lvmPending("calling-tiles.out-of-turn: kept pending by the owner's 2026-08-29 decision"),
    last_verified: "2026-08-29",
  },
];
