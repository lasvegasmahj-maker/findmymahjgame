// Dead hand and winning entries ported from Las Vegas Mahjong (content/rules dead-hands and
// winning modules at 58b6999). Answers are verbatim page text or owner-kept pending wording;
// nothing is edited here. Patterns are written against the shared matcher dialect so both
// sites route identically. See docs/CORPUS-ADJUDICATION.md for the winner where an FMG entry
// also fits.

import type { CanonicalRule } from "./types.ts";
import {
  CLAIM_VERB, JOKER, JOKER_EXCHANGE, MAHJONG_CUE, DISCARDED, ERROR_CUE, MISNAMED, TWO_PLAYERS, OWN_DISCARD, DEAD,
  PASS_VERB, CHARLESTON_WORD, PAYMENT, EXPOSURE_WORD, HAND_CLOSED, DECLINE_CALL, DECLINE_CUE, WRONG_COUNT,
  EXCHANGE_CONTEXT, FINAL_DISCARD_SCENE,
} from "./matchers.ts";
import { lvmPage, lvmPending } from "./entries-fmg.ts";

// Cause of death only. "when" and "how" need the hand as their subject, or "what does it mean
// when a hand is declared dead" would read as a cause question.
const DEAD_CAUSE =
  /\b(what makes|makes?|causes?|caused|causing|why|reasons?|triggers?|counts? as|qualif(y|ies) as|ways? (a|to|that|your|my)|lead(s|ing)? to|results? in|how (does|do|did|can|could|would) (a |my |your |the |someone'?s |anyone'?s )?hands? (go|become|get|end up|be|turn)|when (is|are|does|would|do|did|can|could|will) (a |my |your |the |someone'?s |his |her |their )?hands? (dead|go|become|get|be|considered|declared|called|ruled)|what (is|are|'s) the (rules?|ways?|reasons?|things?)|what (can|could|would) (make|kill|cause)|kills?|illegal|render\w*)\b/i;
const DEAD_PAY =
  /\b(pay|pays|paid|paying|payment|payments|payout|owe|owes|owed|owing|money|settle|settles|settled|settlement|chip in|cough up|fork over|on the hook|off the hook|liable|exempt|excused|get out of paying|penny|pennies|quarters?|dollars?|cost|costs|winner|(someone|somebody|another player|other player|she|he|they|anyone) (else )?(wins|won|gets mahjong|declares mahjong|goes out))\b/i;
const DEAD_PLAY_ON =
  /\b(draw|draws|drawing|drew|pick|picks|picking|picked|discard|discards|discarding|discarded|keep (playing|going|taking|picking|drawing)|keeps playing|kept playing|continue|continues|continued|continuing|still (play|plays|playing|pick|draw|discard)|play on|plays on|sit out|sits out|sitting out|sat out|sit there|stay in|stays in|take (a |my |their |your |his |her |any )?turns?|takes? (a |any )?turns?|(my|their|his|her|your) turn|turns?|skip|skips|skipped|rest of the (hand|game|round|deal)|for the rest|what happens|what now|then what|now what|what (do|does|should|can) (i|they|you|she|he|we|the player|a player|that player|the dead player) do|leave the table|get up|watch|participate|involved|in the game|out of the (game|hand|round)|still (in|part of) (the|it|play)|carry on|from the wall|tak(e|es|ing) tiles?)\b/i;
// A named accuser or a passive with got/was/were. "is declared dead" stays out so "what does it
// mean when a hand is declared dead" keeps its definition answer.
const CALLED_DEAD_ACT =
  /\b(call|calls|called|calling|declare|declares|declared|declaring|say|says|said|saying|rule|rules|ruled|deem\w*|pronounce\w*|accus\w+|challeng\w+)\b[^.?!]{0,20}\b(me|my hand|my hands|i am|i'm|im|us|our hands?|you|your hand|him|her|them|his hand|her hand|their hands?|someone|somebody|someone'?s hand|another player|a hand|a player|player'?s hand|the hand)\b[^.?!]{0,12}\bdead\b|\bdead\b[^.?!]{0,24}\b(challenge\w*|accus\w+)\b|\b(challenge\w*|accus\w+)\b[^.?!]{0,24}\bdead\b|\b(got|was|were|been|being|get|gets|getting|am|are|i'm|im|you're|we're|they're) (wrongly |wrongfully |unfairly |just )?(called|declared|ruled|deemed|pronounced|announced|accused of being|challenged as|made) dead\b|\b(someone|somebody|another player|other player|they|she|he|opponent|the table|everyone|my (friend|partner|neighbor))\b[^.?!]{0,20}\b(call|calls|called|calling|declare|declares|declared|say|says|said|accus\w+|challeng\w+|insist\w*|claim\w*|think\w*)\b[^.?!]{0,20}\b(i|i'm|im|my hand|me|you|your hand)\b[^.?!]{0,10}\bdead\b/i;
const CALLED_DEAD_SCENE =
  /\b(what happens|what now|then what|now what|what (do|should|can) (i|we) do|what does (that|it) mean|is that (right|legal|allowed|fair)|if|when|after|once|got|was|were|been|just|someone|somebody|another player|other player|they|she|he|opponent|the table|everyone|my (friend|partner|neighbor)|can|could|may|allowed|able|permitted|the player (next to|beside|across from|to my|on my))\b|\baccus\w+|\bchalleng\w+/i;
const EXPOSURE_GROUP = new RegExp(
  `${EXPOSURE_WORD.source}|\\b(pungs?|kongs?|quints?|sextets?)\\b|\\b(lay|lays|laid|laying|put|puts|putting|place|places|placed|placing) (it |them |tiles |the tiles |those |a set |the set |my set |a group |the group |my group )?(down|out)\\b|\\bon (my|the|your) rack\\b|\\b(wrong|incorrect|bad) (set|sets|group|groups)\\b`,
  "i",
);
const EXPOSURE_MISTAKE = new RegExp(
  `${ERROR_CUE.source}|\\b(fix|fixed|fixing|correct|corrected|correcting|undo|undid|save|saved|saving|catch|caught|meant to|didn'?t mean|did not mean|supposed to be|shouldn'?t have|should not have|not (a |the )?(right|correct|valid|legal)|isn'?t (a |the )?(right|correct|valid|legal)|doesn'?t (fit|match|go with|work)|does not (fit|match|go with|work)|don'?t (fit|match)|do not (fit|match)|can'?t (fit|match)|cannot (fit|match)|fits? (no|any) hand|fits? nothing|doesn'?t fit anything|does not fit anything|matches nothing|goes with nothing|no hand|misread|misplaced|mixed up|mis-?expos\\w*)\\b`,
  "i",
);
const TWO_DEAD =
  /\b(two|2|both|multiple|more than one|several|a couple of|three|3) (players|people|of us|of them|hands|dead)\b[^.?!,;]{0,30}\bdead\b|\b(two|2|both|multiple|more than one|several|three|3) (players|people|of us|of them|hands) (are|were|go|went|got|get|become|became|have|had|end up|ended up|with) (a )?dead\b|\bdead\b[^.?!,;]{0,30}\b(two|2|both|multiple|more than one|several|three|3) (players|people|of us|of them|hands)\b|\b(two|2|both|multiple|three|3) dead\b|\bdead (too|as well|also)\b|\b(another|second|other|other'?s) (player'?s?|person'?s?|hand) (is|goes|went|gets|got|becomes?|became|has gone|also) (also |too )?dead\b|\b(another|second|third) dead hand\b|\bmore than one dead\b|\bmultiple dead\b|\bonly (two|2|one|1) (players?|people|of us) (left|remain\w*|still (in|playing|alive))\b/i;
const WIN_OR_VALID_HAND = new RegExp(
  `${MAHJONG_CUE.source}|\\b(valid|legal|legit|legitimate|acceptable|genuine|complete|completed|winning|real) hands?\\b|\\bhands? (is|be|was|isn'?t|is not|be considered|counts?|counted|qualif\\w+) (as )?(a |an )?(valid|legal|legit|legitimate|acceptable|genuine|complete|real|good|mahjong|win)\\b`,
  "i",
);
const VALIDITY =
  /\b(valid|validity|invalid|legal|legit|legitimate|count|counts|counted|qualif\w+|acceptable|correct|genuine|exact|exactly|requirements?|criteria|what makes|what is required|what (do|does) (i|you|it) need|match|matches|matched|matching|checks? out|considered|complete|allowed|has to (be|have|match)|have to (be|have|match)|must (be|have|match)|needs? to (be|have|match)|suppos\w+ to)\b/i;
const HOW_TO_WIN = /\bhow (do|does|can|did|would) (i|you|we|someone|a player|anyone) (actually |even |really )?win\b|\bwin the game\b/i;
// The game's own name is not a win: "mahjong rules for discards" is a calling question.
const WIN_CUE =
  /\b(win|wins|winning|won|go out|goes out|going out|went out|gone out|(declare|declares|declared|declaring|call|calls|called|calling|claim|claims|claimed|claiming|make|makes|made|making|get|gets|got|getting|have|has|had|having|hit|reach|reaching|complete|completes|completed|completing|for|to) (my |a |the |your )?mahjong|mahjong (on|off|with|from|using) (it|that|this|a|an|the|her|his|their|my|your|someone|somebody|another|what)|(last|final) tile (i|you|she|he|they|we) need|complete[sd]? (my|your|the|her|his) (hand|mahjong)|finish(es|ed)? (my|your|the|her|his) hand|mahjong tile)\b/i;
const DISCARD_SOURCE = new RegExp(
  `${DISCARDED.source}|\\b(someone|somebody|another player|other player|opponent|she|he|they)'?s'? (tile|throw)\\b|\\bsomeone else'?s?\\b|\\bfrom (another|other|the other) players?\\b|\\boff (of )?(a|the|another|someone'?s?) (discard|throw)\\b`,
  "i",
);
const SELF_DRAW =
  /\bself[- ]?drawn?\b|\b(my|your|their|her|his) own (draw|pick|tile)\b|\bown draw\b|\bdraw(s|n|ing)? (it|the tile|the last tile|the final tile|the winning tile|(my|your) (last|final|winning) tile|the tile (i|you|she|he|they) need) (myself|yourself|herself|himself|themselves|from the wall|off the wall)\b|\b(win|wins|won|winning|mahjong|go out|going out) (off|from|on|by drawing from) the wall\b|\bfrom the wall\b[^.?!,;]{0,30}\b(win|wins|won|winning|mahjong|complete\w*|finish\w*|go out)\b|\b(pick|picks|picked|picking|draw|draws|drew|drawn|drawing)\b[^.?!,;]{0,20}\b(winning|final|mahjong|14th|fourteenth) tile\b|\b(winning|final|mahjong|14th|fourteenth) tile\b[^.?!,;]{0,20}\b(from the wall|off the wall|myself|yourself|on (my|your) (own )?(turn|draw|pick))\b|\b(pick|picks|picked|picking|draw|draws|drew|drawn|drawing|take|takes|took|taking)\b[^.?!,;]{0,24}\b(myself|yourself|herself|himself|themselves)\b|\b(pick|picks|picked|picking|draw|draws|drew|drawn|drawing)\b[^.?!,;]{0,12}\b(my|your|her|his|their|the) (own |last |final |winning |mahjong |14th |fourteenth )?tile\b[^.?!,;]{0,30}\b(win|wins|won|winning|mahjong|go out|complete\w*|finish\w*)\b|\b(pick|picks|picked|picking|draw|draws|drew|drawn|drawing)\b[^.?!,;]{0,12}\b(my|your|her|his|their|the) (last|final|winning|mahjong|14th|fourteenth) tile\b|\bpicked? it (myself|yourself)\b|\bdraw (my|your) own\b|\bwithout (calling|a call|a discard)\b/i;
const SELF_PICK_WORD = /\bself[- ]?pick\w*\b/i;
const SELF_DRAW_ANY = new RegExp(`${SELF_DRAW.source}|${SELF_PICK_WORD.source}`, "i");
const WIN_OR_SELF_PICK = new RegExp(`${MAHJONG_CUE.source}|${SELF_PICK_WORD.source}`, "i");
// "when nobody goes out, do we each toss a quarter in the kitty" is the wall game's payment rule.
const NO_WIN_SCENE = /\b(nobody|no one|noone|no body|none of us) (wins|won|goes out|went out|has mahjong|gets mahjong|declares? mahjong)\b|\bwall games?\b|\bkitty\b|\bante\b|\bquarters?\b|\bpenn(y|ies)\b/i;
// "is my call dead" is a lost call (call-window), not a dead hand.
const CALL_IS_DEAD = /\b(call|calls|claim|claims)\b[^.?!,;]{0,10}\b(is|was|are|were)? ?dead\b/i;
const FALSE_CUE = new RegExp(`${ERROR_CUE.source}|\\b(fake|phony|bogus|erroneous|mis-?call\\w*)\\b`, "i");
const FALSE_MAHJONG_DEF =
  /\bwhat (is|'s|are|does|do you mean by|do they mean by) (a |an |the |it |called )?(false|wrong|bad|mistaken|incorrect|invalid|fake|phony|bogus|premature|erroneous|mis-?called) (mahjong|maj|mahj|win|call|declaration|declare)\b|\b(false|bad|wrong|incorrect|invalid|fake|bogus|erroneous|premature|mistaken) (mahjong|maj|mahj|win|call|declaration)\b[^.?!]{0,12}\b(mean|means|meaning|defin\w+|explain\w*|is what|what is|what'?s that)\b|\b(mean|means|meaning|defin\w+|definition of|explain\w*|term for|word for|what do you call|what is it called|what'?s it called)\b[^.?!]{0,30}\b(false|bad|wrong|incorrect|invalid|fake|bogus|premature|mistaken|by mistake|in error) (mahjong|maj|mahj|win|call|declaration)\b|\bwhat (do you|does one|do they|do people|would you) call it when\b|\bwhat is it called when\b|\bwhat'?s it called when\b|\bis there a (name|term|word) for\b/i;
const RETRACT =
  /\b(take (it |that |my |the |a )?(call |declaration |mahjong |win )?back|took (it |that |my |the )?(call |declaration |mahjong )?back|taking (it |that )?back|undo|undid|un-?declare|un-?say|retract\w*|rescind\w*|reverse|withdraw\w*|cancel\w*|call (it |that |the mahjong |the call )?off|chang(e|es|ed|ing) (my|your|her|his|their) mind|second thoughts?|back out|backtrack|never ?mind|didn'?t mean (to|it)|did not mean (to|it)|don'?t (actually |really )?(have|want) (it|mahjong)|do not (actually |really )?(have|want) (it|mahjong)|not (actually |really )?have (mahjong|it) after all|too (soon|early|fast|quick)|jumped the gun|spoke too soon|revok\w+|change (the|my) call|switch (it |my call )?to (a|an) (exposure|call|pung|kong))\b/i;
// The declaration being retracted; scored, not required, so a retraction phrased with "call"
// outranks the calling entry that fits the same words.
const DECLARED = /\b(declar\w+|call|calls|called|calling|claim|claims|claimed|claiming|said|say|says|saying|announc\w+|yell\w*|shout\w*)\b/i;
// Retracting a tile, not a declaration: that is own-discard's rule.
const TAKE_BACK_TILE =
  /\b(take|took|taking|call|called|calling|get|got|have) (it |that |this |the |my |a )?back\b[^.?!]{0,6}\b(a |the |my |that |this )?(discard|tile|throw)s?\b|\b(discard|tile|throw)s? back\b|\btile i (just )?(discarded|threw|put down)\b|\bdiscard i (just )?(made|threw)\b|\bi (just )?(discarded|threw|put down|tossed)\b|\b(my|own) (own )?(discard|throw)\b|\bwhat i (just )?(discarded|threw)\b/i;
const OWN_HAND_SELF = /\b(my|your|his|her|their) own\b|\bmyself\b|\byourself\b/i;
const WHO_MAY = /\bwho (can|may|gets to|is allowed to|should|has the right to)\b/i;
// A cause question that names the exposure mistake belongs to the triggers list.
const DEAD_CAUSE_ASK = (q: string) => DEAD.test(q) && DEAD_CAUSE.test(q);

export const LVM_DEADWIN: CanonicalRule[] = [
  {
    id: "dead-hand-triggers",
    category: "dead-hands",
    level: "advanced",
    questions: ["What makes a hand dead?"],
    related: ["wrong-exposure","called-dead","dead-hand-pays"],
    topic: "Dead hand triggers",
    question_patterns: [DEAD, DEAD_CAUSE],
    keywords: ["dead", "makes", "cause", "why", "illegal"],
    requires: [DEAD, DEAD_CAUSE],
    blocks: [WRONG_COUNT, JOKER, MISNAMED, OWN_HAND_SELF, WHO_MAY],
    answer:
      "The card's rules say a hand is dead when it has too few or too many tiles, or contains an incorrect exposure: an exposed group that cannot fit any hand on the card, or an exposure made with a wrongly named tile. Declaring mahjong in error makes your hand dead only if you exposed all or part of it; if you exposed nothing and every other hand is intact, play continues with no penalty.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("dead-hands.triggers", "card"),
    last_verified: "2026-08-29",
  },
  {
    id: "dead-hand-pays",
    category: "dead-hands",
    level: "advanced",
    questions: ["Does a dead hand still pay the winner?"],
    related: ["dead-hand-draws","called-dead","pay-discard-win"],
    topic: "Dead hands still pay",
    question_patterns: [DEAD, DEAD_PAY],
    keywords: ["dead", "pay", "winner", "owe"],
    requires: [DEAD, DEAD_PAY],
    blocks: [TWO_DEAD, JOKER, MISNAMED, CALL_IS_DEAD],
    answer:
      "Yes. A player whose hand is declared dead must still pay the winner if someone else wins. Their hand being dead does not excuse them from payment obligations for the rest of that game.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("dead-hands.pays", "card"),
    last_verified: "2026-08-29",
  },
  {
    id: "dead-hand-draws",
    category: "dead-hands",
    level: "advanced",
    questions: ["Does a dead player keep drawing tiles?"],
    related: ["dead-hand-pays","two-dead-hands","called-dead"],
    topic: "Dead hands stop drawing",
    question_patterns: [DEAD, DEAD_PLAY_ON],
    keywords: ["dead", "draw", "continue", "sit out"],
    requires: [DEAD, DEAD_PLAY_ON],
    blocks: [TWO_DEAD, JOKER, WRONG_COUNT, ERROR_CUE, EXPOSURE_WORD, MISNAMED, DEAD_PAY, CALL_IS_DEAD],
    answer:
      "No. Once a hand is declared dead, that player does not draw or discard for the rest of the hand. They sit out until the next hand begins.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("dead-hands.draws", "card"),
    last_verified: "2026-08-29",
  },
  {
    id: "called-dead",
    category: "dead-hands",
    level: "advanced",
    questions: ["What happens if someone calls me dead?"],
    related: ["dead-hand-triggers","wrong-exposure","disputes"],
    topic: "Being called dead",
    question_patterns: [CALLED_DEAD_ACT, DEAD],
    keywords: ["dead", "called", "challenge"],
    requires: [DEAD, CALLED_DEAD_ACT, CALLED_DEAD_SCENE],
    blocks: [JOKER, WRONG_COUNT, OWN_HAND_SELF, WHO_MAY],
    answer:
      "Calling another player's hand dead is a formal challenge, so be sure you are right before you make it. Once a hand is declared dead, that player does not draw or discard for the rest of the hand. They sit out until the next hand begins. A player whose hand is declared dead must still pay the winner if someone else wins.",
    varies_by_house: true,
    house_note: "Tables enforce dead hand challenges with different levels of strictness.",
    confidence: "medium",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("dead-hands.draws + dead-hands.pays", "card"),
    last_verified: "2026-08-29",
  },
  {
    id: "wrong-exposure",
    category: "dead-hands",
    level: "advanced",
    questions: ["What happens if I expose the wrong tiles?"],
    related: ["expose-immediately","dead-hand-triggers","called-dead"],
    topic: "Exposing the wrong tiles",
    question_patterns: [EXPOSURE_GROUP, EXPOSURE_MISTAKE],
    keywords: ["expos", "wrong", "mistake", "incorrect", "fix", "correct"],
    requires: [EXPOSURE_GROUP, EXPOSURE_MISTAKE],
    blocks: [MISNAMED, JOKER_EXCHANGE, EXCHANGE_CONTEXT, HAND_CLOSED, TWO_PLAYERS, DEAD_CAUSE_ASK],
    answer:
      "Sometimes. You may change the number and type of tiles in an exposure right up until you discard, so an exposure mistake caught before your discard can simply be fixed. Once you have discarded, an incorrect exposure makes the hand dead, and a hand with the wrong number of tiles is dead as soon as it is noticed. The key is catching it immediately.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("dead-hands.saved", "card"),
    last_verified: "2026-08-29",
  },
  {
    id: "two-dead-hands",
    category: "dead-hands",
    level: "advanced",
    questions: ["What happens if two players have dead hands?"],
    related: ["dead-hand-draws","dead-hand-pays","wall-game"],
    topic: "Two dead hands",
    question_patterns: [TWO_DEAD, DEAD],
    keywords: ["two", "both", "dead"],
    requires: [DEAD, TWO_DEAD],
    blocks: [JOKER, MISNAMED],
    answer:
      "Both sit out and still pay if one of the two active players wins. The card does not stop play at two dead hands (it stops play for dead hands only when three are dead), so the remaining two players continue.",
    varies_by_house: false,
    confidence: "high",
    approval: "research_verified",
    classification: "standard_nmjl_rule",
    provenance: lvmPending("dead-hands.two-dead: kept pending by the owner's 2026-08-29 decision"),
    last_verified: "2026-08-29",
  },
  {
    id: "valid-mahjong",
    category: "winning",
    level: "core",
    questions: ["What makes a valid mahjong?"],
    related: ["false-mahjong","winning-mahjong","change-mind-mahjong"],
    topic: "A valid mahjong",
    question_patterns: [WIN_OR_VALID_HAND, VALIDITY],
    keywords: ["valid", "mahjong", "match", "legal"],
    requires: [WIN_OR_VALID_HAND, VALIDITY],
    blocks: [CLAIM_VERB, HAND_CLOSED, TWO_PLAYERS, PAYMENT, JOKER, MISNAMED, DEAD, SELF_DRAW, DISCARD_SOURCE, HOW_TO_WIN],
    answer:
      "A valid mahjong is a complete hand of 14 tiles that exactly matches one of the hands on the current year's NMJL card. Every tile and every suit must fit that one hand, and anything you exposed must be part of it. If any element is off, it is not a valid mahjong.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("winning.valid", "owner"),
    last_verified: "2026-08-29",
  },
  {
    id: "discard-win",
    category: "winning",
    level: "core",
    questions: ["Can I win on a tile someone else discards?"],
    related: ["self-drawn-win","pay-discard-win","calling-for-mahjong"],
    topic: "Winning on a discard",
    question_patterns: [WIN_CUE, DISCARD_SOURCE],
    keywords: ["win", "discard", "someone else"],
    requires: [WIN_CUE, DISCARD_SOURCE],
    blocks: [CLAIM_VERB, OWN_DISCARD, JOKER, HAND_CLOSED, ERROR_CUE, MISNAMED, PAYMENT, FINAL_DISCARD_SCENE, TWO_PLAYERS, DECLINE_CALL, DECLINE_CUE, DEAD, CHARLESTON_WORD, NO_WIN_SCENE],
    answer:
      "Yes. You can win by calling a discarded tile (other than a joker) from any other player to complete your hand. This is called a 'discard win.' You declare mahjong, expose your full winning hand, and collect payment.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("winning.discard-win", "card"),
    last_verified: "2026-08-29",
  },
  {
    id: "self-drawn-win",
    category: "winning",
    level: "core",
    questions: ["Can I win on my own draw?"],
    related: ["discard-win","pay-discard-win","joker-free"],
    topic: "Winning on your own draw",
    question_patterns: [SELF_DRAW_ANY, WIN_OR_SELF_PICK],
    keywords: ["self", "draw", "own", "win", "wall"],
    requires: [WIN_OR_SELF_PICK, SELF_DRAW_ANY],
    // The 2026-08-30 payment decision answers self-pick payment questions where it is in force.
    yields_to: ["payments-basics"],
    blocks: [FINAL_DISCARD_SCENE, ERROR_CUE, MISNAMED, JOKER, DEAD, CHARLESTON_WORD],
    answer:
      "A self-drawn win is drawing the tile you need from the wall to complete your hand; you declare mahjong the same way as on a called tile. Whether a self-drawn win pays more than a win on a discard is settled by your group; confirm your table's payment rules before play.",
    varies_by_house: true,
    confidence: "medium",
    approval: "research_verified",
    classification: "house_optional_rule",
    provenance: lvmPending("winning.self-drawn: kept pending by the owner's 2026-08-29 decision"),
    last_verified: "2026-08-29",
    tags: ["money"],
  },
  {
    id: "false-mahjong",
    category: "winning",
    level: "advanced",
    questions: ["What is a false mahjong?"],
    related: ["change-mind-mahjong","valid-mahjong","dead-hand-triggers"],
    topic: "False mahjong",
    question_patterns: [FALSE_MAHJONG_DEF, MAHJONG_CUE, FALSE_CUE],
    keywords: ["false", "mahjong", "wrong", "mean"],
    requires: [MAHJONG_CUE, FALSE_CUE, FALSE_MAHJONG_DEF],
    blocks: [MISNAMED, JOKER_EXCHANGE, TWO_PLAYERS],
    answer:
      "A false mahjong is calling mahjong when your hand does not actually complete a valid hand on the card. If you have not exposed your hand and every other hand is intact, play continues with no penalty. If you exposed all or part of your hand, your hand is dead. If your call led one other player to expose their hand, the game continues between the two players whose hands are intact; if more than one other player exposed, the game cannot continue and you pay double the value of the incorrect hand to the one player whose hand is still intact. That is why players should not throw in their hands until a mahjong is verified.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("winning.false-mahjong", "card"),
    last_verified: "2026-08-29",
    equivalents: ["mahjong-in-error","mahjong-in-error-settlement"],
  },
  {
    id: "change-mind-mahjong",
    category: "winning",
    level: "advanced",
    questions: ["Can I take back a mahjong call?"],
    related: ["false-mahjong","valid-mahjong","own-discard"],
    topic: "Taking back a mahjong call",
    question_patterns: [RETRACT, MAHJONG_CUE, DECLARED],
    keywords: ["take back", "mahjong", "change", "mind", "back", "undo"],
    requires: [MAHJONG_CUE, RETRACT],
    blocks: [TAKE_BACK_TILE, MISNAMED, JOKER_EXCHANGE, PASS_VERB, CHARLESTON_WORD],
    answer:
      "It depends on whether you exposed. If you declared mahjong but exposed nothing and every other hand is still intact, play continues with no penalty. Once you expose all or part of your hand, the declaration stands; if the hand is not valid, your hand is dead. Do not call mahjong until you are certain.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("winning.change-mind", "card"),
    last_verified: "2026-08-29",
    equivalents: ["mahjong-in-error"],
  },
];
