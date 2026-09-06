// Joker entries ported from Las Vegas Mahjong (the content/rules jokers module at 58b6999 and
// the owner's 2026-08-29 decisions). Answers are verbatim page text or owner-approved wording;
// nothing is edited here. Only the routing (patterns, requires, blocks, keywords) is authored,
// in the shared matcher dialect so both sites route identically. See docs/CORPUS-ADJUDICATION.md
// for the winner where a Find My Mahj entry also fits.

import type { CanonicalRule } from "./types.ts";
import {
  CLAIM_VERB, JOKER, JOKER_EXCHANGE, JOKER_PASS, DEAD, MIXED_GROUP, PAYMENT, MAHJONG_CUE, HAND_CLOSED, ERROR_CUE,
  MISNAMED, OWN_DISCARD, CHARLESTON_WORD, TOURNAMENT, QUINT_SEXTET,
} from "./matchers.ts";
import { lvmPage, LVM_OWNER_2026_08_29 } from "./entries-fmg.ts";

const VERIFIED_LVM = "2026-08-29" as const;

// A joker that left a hand as a discard. Word-listed rather than bounded by distance, so
// "call a discard and use a joker" (a joker still in the hand) never reads as a thrown joker.
const DISCARDED_JOKER = new RegExp(
  "\\bdiscarded jokers?\\b" +
    "|\\bjokers?\\b (that |which |she |he |they |someone |somebody |who |i |you |we |it |was |were |is |are |got |gets |get |being |been |just |also |accidentally |already |mistakenly ){0,4}(discard\\w*|threw|thrown|throw\\w*|toss\\w*|put down)\\b" +
    "|\\b(discard\\w*|threw|thrown|throw\\w*|toss\\w*|put down)\\b( (a|an|the|my|her|his|their|your|our|out|away|down|that|this|one|two|all|both|of|own|someone'?s|another|any|every))* jokers?\\b" +
    "|\\bjokers?\\b[^.?!,;]{0,12}\\b(from|off|out of|in|on) the (discards?|table|middle|pile|pool|floor|discard pile)\\b" +
    "|\\bjoker (discard|throw)s?\\b",
  "i",
);
const SINGLE_OR_PAIR = /\bsingles?\b|\bpairs?\b/i;
// Whether a quint or sextet needs jokers at all is the pung-vs-kong definition's rule.
const SET_NEEDS_JOKER = new RegExp(
  `\\b(need|needs|needed|require|requires|required|without|have to|must|possible|only with|can'?t|cannot|necessary|mandatory)\\b[^.?!,;]{0,30}\\bjokers?\\b[^.?!,;]{0,30}${QUINT_SEXTET.source}|${QUINT_SEXTET.source}[^.?!,;]{0,30}\\b(need|needs|needed|require|requires|required|without|have to|must|possible|only with|can'?t|cannot)\\b[^.?!,;]{0,30}\\bjokers?\\b|\\bjokers?\\b[^.?!,;]{0,20}\\b(need|needs|needed|required|necessary|a must|mandatory)\\b[^.?!,;]{0,30}${QUINT_SEXTET.source}`,
  "i",
);
const SAME_TILE_CALLERS = /\b(both|two (players|people|of us)|more than one|same (tile|discard)|at the same time|simultaneous(ly)?|who gets|who has priority|priority|first dibs)\b/i;

// Asking what a joker may stand for. Using a joker "in" a group is the basics entry's
// question, so only the substitute sense ("as", "for", "stand in", "replace") counts.
const SUBSTITUTE_ASK =
  /\b(substitut\w*|stand(s|ing)? in|stood in|replac\w+|represent\w*|fill(s|ed|ing)? in for|(be|is|are|get|gets|got|been) used (as|for|to)|use[sd]? (it |them |one |a joker |jokers )?(as|for)|count(s|ed|ing)? (as|for)|act(s|ed|ing)? as|serv(e|es|ed|ing) as|pass(es|ed|ing)? (as|for)|work(s|ed|ing)? (as|for)|(take|takes|taking|took) the place of|in place of|instead of (a |the |any |my )?(real |missing |actual )?(tiles?|one)|jokers?\b[^.?!,;]{0,6}\b(as|for) (a|an|the|any|one|my|every|each)|jokers?\b[^.?!,;]{0,10}\bbe (a|an|any|the|every|each)|what (can|could|may) (a |the |my )?jokers? (be|become)|(what|which) tiles?\b[^.?!,;]{0,30}\bjokers?|jokers?\b[^.?!,;]{0,30}\b(what|which) tiles?|wild\b[^.?!,;]{0,12}\bfor)\b/i;

// The single tile position itself, as the answer names it: a tile word or a slot word beside
// "single", or a tile standing alone. A bare "single" beside "joker" stays with joker-in-pair.
const SINGLE_SLOT =
  /\bsingle tiles?\b|\bsingles? (tile )?(position|positions|slot|slots|spot|spots|space|spaces|place|places|requirement|requirements|part|parts|section|sections|element|elements)\b|\b(a|the|any|one|that|this) single\b (on|in|of|from) (the|my|a|that|this) (card|hand|line)\b|\b(lone|solo|solitary|standalone|stand[- ]alone|lonely|odd|one[- ]off|unpaired)\b[^.?!,;]{0,12}\b(tiles?|flowers?|dragons?|soap|winds?|bams?|craks?|dots?|one|ones|\d)\b|\b(tiles?|flowers?|dragons?|soap|winds?|bams?|craks?|dots?|jokers?|\d ?(bams?|craks?|dots?))\b[^.?!,;]{0,12}\b(by itself|by themselves|on its own|all alone|alone|standalone|stand[- ]alone)\b/i;

const SINGLES_AND_PAIRS = /\bsingles?\b ?(and|&|n|'n'|plus|\+) ?\bpairs?\b|\bsingles?[- /]pairs?\b|\bpairs? (and|&|n|plus) singles?\b|\bs ?& ?p\b|\bsingles? pairs?\b/i;

// The owner's term for the hand. "jokerless" is the League's word and stays with the
// League-attributed payments entry in the shared corpus (see the adjudication conflict).
const JOKER_ANY = /\bjoker/i;
const JOKER_FREE_TERM =
  /\bjoker[- ]?free\b|\bjokerfree\b|\bjokerless\b|\bfree of jokers\b|\b(without|with no|with zero|zero|no) jokers?\b(?=[^.?!]{0,40}\b(pay|pays|paid|worth|double|doubles|bonus|extra|more|value|points?)\b)|\b(pay|pays|paid|worth|double|doubles|bonus|extra|more)\b[^.?!]{0,40}\b(without|with no|with zero|zero|no) jokers?\b/i;
const BEYOND_ASK = /\b(beyond|besides|other than|apart from|in addition to|on top of|any other|what else|anything else|triple[sd]?|tripling)\b/i;

// Jokers making up the rest of a called group.
const JOKER_FILLS = new RegExp(
  "\\b(complete\\w*|finish\\w*|fill\\w*|make up|making up|makes up|made up|round(s|ed|ing)? out|rest of|remaining|remainder|the other (one|two|three|2|3|tiles?|ones)|missing (one|two|tile|tiles|piece|pieces)|(as|for|be) the (third|fourth|fifth|sixth|last|other|rest|remaining|missing)\\b|(third|fourth|fifth|sixth|last|other) (tile|tiles|one|ones))\\b" +
    "|\\b(with|using|use|used|plus|and|include|including|add|adding|count|counting|combine\\w*|along with|together with|mix\\w*|have|having|holding|hold|got|only)\\b[^.?!,;]{0,14}\\bjokers?\\b" +
    "|\\bjokers?\\b[^.?!,;]{0,20}\\b(in|from|out of|already in|behind) (my|your|the|their|her|his) (hand|rack)\\b" +
    "|\\bjokers?\\b[^.?!,;]{0,12}\\b(plus|and|with|along with|together with)\\b[^.?!,;]{0,20}\\b(called|call|discard|tile|real|one)\\b" +
    "|\\bjokers?\\b[^.?!,;]{0,12}\\b(to|for) (the|that|my|a|an) (rest|others?|remaining|missing|third|fourth|last|call|pung|kong|quint|sextet|set|group|exposure)\\b" +
    "|\\b(are|is|be|being|were) (all |both |mostly |two |three |2 |3 )?jokers?\\b" +
    "|\\b(two|three|2|3|1|one|four|4) (of them |of those |of these )?(are |being |as )?jokers?\\b",
  "i",
);

const WALL_GAME =
  /\bwall games?\b|\b(nobody|no one|no body|noone|none of us|no player) (wins|won|has mahjong|got mahjong|gets mahjong|declares? mahjong|declared mahjong|went out|goes out)\b|\bwall (runs?|ran|is|was|gets|got) (out|empty|used up|exhausted|gone)\b|\b(ran|run|runs|running) out of (tiles|wall)\b|\bno (more )?tiles? left\b|\bend of the wall\b|\bout of tiles\b|\bno winner\b|\b(draw|drawn|tied?) game\b|\bends? in a (draw|tie)\b/i;

// The NEWS block by name, or its four winds named as one of each.
const NEWS_BLOCK =
  /\bnews\b|\bn ?e ?w ?s\b|\b(north|east|west|south)\b[^.?!,;]{0,30}\b(north|east|west|south)\b|\b(four|4|all four|all 4|each|one of each|every|different|the four) winds?\b/i;
// The player asking whether they may put a joker there. The passive "can a joker be used in
// NEWS" belongs to the general mixed-groups entry, which also answers runs and years.
const PLAYER_USES =
  /\b(i|we|you|one|someone|somebody|anyone|anybody|a player|players|people|she|he|they)\b[^.?!,;]{0,16}\b(use|uses|using|put|puts|putting|play|plays|playing|place|places|placing|stick|sticks|sticking|slip|slips|slipping|drop|drops|dropping|count|counts|counting|include|includes|including|substitute|substitutes|substituting|sub|subs|subbing|throw|throws|throwing|add|adds|adding|make|makes|making|have|has|having|fill|fills|filling|slot|slots|slotting)\b/i;

export const LVM_JOKERS: CanonicalRule[] = [
  {
    id: "joker-substitute",
    category: "jokers",
    level: "core",
    questions: ["What tiles can jokers substitute for?"],
    related: ["joker-in-pair", "joker-exchange", "joker-call-complete"],
    topic: "What a joker can stand in for",
    question_patterns: [
      SUBSTITUTE_ASK,
      JOKER,
      /\bjokers?\b[^.?!,;]{0,30}\b(pungs?|kongs?|quints?|sextets?|groups?|sets?)\b/i,
      /\b(pungs?|kongs?|quints?|sextets?)\b[^.?!,;]{0,20}\bjokers?\b/i,
    ],
    keywords: ["substitute", "stand in", "replace", "which tiles", "kong", "pung", "quint"],
    requires: [JOKER, SUBSTITUTE_ASK],
    // Pairs, singles, and mixed groups have their own entries; a thrown, exchanged, passed,
    // or dead hand's joker is another rule.
    blocks: [SINGLE_OR_PAIR, SINGLE_SLOT, MIXED_GROUP, SET_NEEDS_JOKER, JOKER_EXCHANGE, JOKER_PASS, DISCARDED_JOKER, DEAD],
    answer:
      "Jokers can substitute for any tile in a set of three or more identical tiles: a pung (3), kong (4), quint (5), or sextet (6). They cannot substitute in pairs or single tiles. So jokers work in groups, never alone or in twos.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("jokers.substitute", "card"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "joker-single",
    category: "jokers",
    level: "core",
    questions: ["Can a joker be used as a single tile?"],
    related: ["joker-in-pair", "joker-in-news", "joker-substitute"],
    topic: "Jokers in a single tile position",
    question_patterns: [
      SINGLE_SLOT,
      JOKER,
      /\bjokers?\b[^.?!,;]{0,30}\bsingle tiles?\b|\bsingle tiles?\b[^.?!,;]{0,30}\bjokers?\b/i,
    ],
    keywords: ["single tile", "slot", "position", "by itself", "lone"],
    requires: [JOKER, SINGLE_SLOT],
    blocks: [/\bpairs?\b/i, MIXED_GROUP, JOKER_EXCHANGE, JOKER_PASS, DISCARDED_JOKER, DEAD, CLAIM_VERB],
    answer: "No. A single tile position on the card requires a real tile. Jokers only work in groups of three or more.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("jokers.single", "card"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "joker-singles-pairs-hand",
    category: "jokers",
    level: "core",
    questions: ["Can I use a joker in a Singles and Pairs hand?"],
    related: ["joker-in-pair", "joker-free", "joker-single"],
    topic: "Jokers in Singles and Pairs hands",
    question_patterns: [
      SINGLES_AND_PAIRS,
      JOKER,
      /\bjokers?\b[^.?!,;]{0,40}\bsingles?\b ?(and|&|n|plus|\+) ?\bpairs?\b/i,
    ],
    keywords: ["singles and pairs", "singles & pairs", "joker-free"],
    requires: [JOKER, SINGLES_AND_PAIRS],
    // What those hands pay is the scoring entries' question.
    blocks: [PAYMENT, DEAD, JOKER_EXCHANGE, JOKER_PASS, DISCARDED_JOKER],
    answer:
      "No. Singles and Pairs hands (hands with all single tiles and pairs) are joker-free by definition. No jokers anywhere in those hands.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("jokers.singles-pairs-hand", "card"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "joker-free",
    category: "scoring",
    level: "advanced",
    questions: ["What is a joker-free hand and what does it pay?"],
    related: ["pay-discard-win", "self-drawn-win", "extra-payments"],
    topic: "Joker-free hands",
    question_patterns: [
      JOKER_FREE_TERM,
      JOKER_ANY,
      PAYMENT,
      /\bwhat (is|'s|does|do)\b[^.?!,;]{0,20}\bjoker[- ]?free\b/i,
      /\bjoker[- ]?free\b[^.?!,;]{0,30}\b(mean|means|meaning|pay|pays|worth|double|bonus|extra)\b/i,
    ],
    keywords: ["joker free", "joker-free", "double", "pay", "bonus"],
    requires: [JOKER_ANY, JOKER_FREE_TERM],
    // Multipliers beyond joker-free, dead hands, misnames, wall games, tournaments, and the
    // exchange itself each have their own entry.
    blocks: [BEYOND_ASK, DEAD, MISNAMED, TOURNAMENT, JOKER_EXCHANGE, JOKER_PASS, /\bwall games?\b/i],
    answer:
      "A joker-free hand is any complete mahjong hand that contains zero jokers. These hands pay double from all three players, meaning you collect twice the normal amount. This applies to self-drawn wins too. The one exception is Singles and Pairs hands, which never use jokers and do not get the doubling.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("jokers.joker-free", "card"),
    last_verified: VERIFIED_LVM,
    tags: ["money"],
  },
  {
    id: "joker-call-complete",
    category: "jokers",
    level: "core",
    questions: ["Can I call a discard and use a joker to complete the set?"],
    related: ["calling-discard", "joker-exchange", "expose-immediately"],
    topic: "Calling a discard with jokers filling the group",
    question_patterns: [
      JOKER_FILLS,
      CLAIM_VERB,
      JOKER,
      /\b(call|calls|called|calling|claim|claims|claimed|claiming)\b[^.?!,;]{0,40}\b(with|using|plus|and) (a |one |two |three |my |some )?jokers?\b/i,
    ],
    keywords: ["call", "complete", "finish", "fill", "rest of", "with a joker"],
    requires: [CLAIM_VERB, JOKER, JOKER_FILLS],
    // A joker taken from an exposure, a thrown joker, a pair, a mixed group, a mahjong call, a
    // concealed hand, a mistake, and a contested tile are each another entry's rule.
    blocks: [
      JOKER_EXCHANGE, DISCARDED_JOKER, JOKER_PASS, DEAD, /\bpairs?\b/i, MIXED_GROUP, MAHJONG_CUE, HAND_CLOSED, ERROR_CUE,
      MISNAMED, OWN_DISCARD, SAME_TILE_CALLERS, CHARLESTON_WORD,
    ],
    answer:
      "Yes. When you call a discard to complete a pung, kong, or quint, you can use jokers to fill the remaining tiles in that exposed group. The called tile itself must be a real tile; jokers from your hand may stand in for the rest of the group.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("jokers.call-with-joker", "card"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "wall-game-jokers",
    category: "scoring",
    level: "advanced",
    questions: ["What happens to jokers at the end of a wall game?"],
    related: ["wall-game", "wall-game-payment", "joker-free"],
    topic: "Jokers in a wall game",
    question_patterns: [
      WALL_GAME,
      JOKER,
      /\bjokers?\b[^.?!]{0,40}\bwall games?\b|\bwall games?\b[^.?!]{0,40}\bjokers?\b/i,
    ],
    keywords: ["wall game", "nobody won", "no winner", "joker"],
    requires: [JOKER, WALL_GAME],
    blocks: [DEAD, JOKER_EXCHANGE, JOKER_PASS, MISNAMED],
    answer:
      "In a wall game (nobody wins), there is no payment for jokers specifically. Each player pays the others based on house rules; some groups pay a flat amount per player per wall game.",
    varies_by_house: true,
    house_note: "Wall game payments are a house rule; agree on them before you play.",
    confidence: "high",
    approval: "owner_approved",
    classification: "house_optional_rule",
    provenance: lvmPage("jokers.wall-game", "house"),
    last_verified: VERIFIED_LVM,
    tags: ["money"],
  },
  {
    id: "joker-in-news",
    category: "jokers",
    level: "core",
    questions: ["Can I use a joker in NEWS?"],
    related: ["joker-in-pair", "joker-single", "winds"],
    topic: "Jokers in NEWS",
    question_patterns: [
      NEWS_BLOCK,
      JOKER,
      PLAYER_USES,
      /\bjokers?\b[^.?!,;]{0,40}\bnews\b|\bnews\b[^.?!,;]{0,40}\bjokers?\b/i,
    ],
    keywords: ["news", "north", "east", "west", "south", "winds"],
    requires: [JOKER, NEWS_BLOCK],
    // A question that also asks about runs or year hands is the broader mixed-groups entry's.
    blocks: [/\b(runs?|sequences?|consecutive|year hands?|a year|the year|20\d\d hand|1 ?2 ?3)\b/i, JOKER_EXCHANGE, JOKER_PASS, DISCARDED_JOKER, DEAD],
    answer:
      "No. NEWS is made up of four different tiles (North, East, West, and South), so each one counts as a single tile, and a joker can never be used as a single. Jokers only work inside groups of 3 or more identical tiles: a Pung, Kong, Quint, or Sextet.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: LVM_OWNER_2026_08_29,
    last_verified: VERIFIED_LVM,
  },
];
