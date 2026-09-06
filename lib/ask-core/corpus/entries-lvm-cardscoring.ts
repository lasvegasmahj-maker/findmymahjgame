// Las Vegas Mahjong entries for the card, scoring, and etiquette pages (content/rules at
// 58b6999), ported into the shared corpus. Answers are verbatim page text or owner-approved
// wording and are never edited here; only the routing (patterns, requires, blocks, keywords)
// is authored for the shared matcher dialect. See docs/CORPUS-ADJUDICATION.md for the
// payment-attribution conflict: pay-discard-win and wall-game-payment deliberately carry one
// required concept so payments-basics (an explicit owner decision) wins their shared-corpus
// ties, and Las Vegas Mahjong reaches them through its recorded site override.

import type { CanonicalRule } from "./types.ts";
import {
  BLANK, BLIND_PASS, CARD_WORD, CHARLESTON_WORD, CLAIM_VERB, CONTACT_SENSE, COURTESY, CX_LETTERS, DEAD, DISCARDED,
  ERROR_CUE, EXPOSURE_WORD, HAND_CLOSED, HAND_SIZE, HOLD_FOR_CHECK, JOKER, JOKER_EXCHANGE, LAST_OF_WALL,
  MAHJONG_CUE, MISNAMED, NAMING, ORDER, PAYMENT, QUINT_SEXTET, SPOKEN_CLAIM, STRATEGY, THREE_PLAYER_SEATS,
  TOURNAMENT,
} from "./matchers.ts";
import { lvmPage } from "./entries-fmg.ts";

const VERIFIED_LVM = "2026-08-29" as const;

// A digit printed in a hand, or the word for it. One to three digits only, so a year is
// never a card number and the zero belongs to the notation entry.
const CARD_DIGIT = /\b(numbers?|digits?|numerals?)\b|\b[1-9]{1,3}\b/i;
const LEGEND_ASK = /\b(colou?rs?|letters?|zero|soap)\b/i;
// The placeholder entries are gated on their concept and on a number or tile noun, as
// charleston-blind-pass is gated on BLIND_PASS and PASS_VERB: "what does consecutive mean on
// the card" is narrower than the notation entry's reading of the card, and must outrank it.
const NUMBER_CONTEXT = /\b(numbers?|numbered|digits?|tiles?|hands?|cards?|suits?|bams?|craks?|dots?|[1-9])\b/i;
const SUIT_WORD = "(suits?|across|each|all|every|bams?|craks?|dots?)";
// "any number of players" is a seating question, so the placeholder sense excludes "of".
const LIKE_NUMBER = new RegExp(
  `\\b(any )?like numbers?\\b|\\bany numbers?\\b(?! of\\b)|\\b(same|matching|identical|one|single) numbers?\\b[^.?!,;]{0,40}\\b${SUIT_WORD}\\b|\\b${SUIT_WORD}\\b[^.?!,;]{0,40}\\b(same|matching|identical|one|single) numbers?\\b|\\bnumbers?\\b[^.?!,;]{0,20}\\b(has|have|need|needs) to (match|be the same|agree)\\b|\\b(pick|choose|select) (the|a|my own|which) numbers?\\b`,
  "i",
);
const RUN_WORD =
  "(runs?(?! out)|sequences?|sequential(ly)?|in (numerical |number |numeric )?order|in a row|one after (the other|another)|consecutively|straight)";
// "the 7 shows up 4 times in a row on the card" is a repeated digit (a Kong), not a run.
const REPEAT_IN_A_ROW = /\b(times|printed|shown|shows up|appears?|repeated|listed)\b[^.?!,;]{0,12}\bin a row\b/i;
const CONSECUTIVE = new RegExp(
  `\\bconsecutive\\b|\\b${RUN_WORD}\\b[^.?!,;]{0,40}\\b(numbers?|tiles?|suits?|hands?|card|bams?|craks?|dots?)\\b|\\b(numbers?|tiles?|hands?|bams?|craks?|dots?)\\b[^.?!,;]{0,40}\\b${RUN_WORD}\\b|\\b(1[ -]?2[ -]?3|2[ -]?3[ -]?4|3[ -]?4[ -]?5|4[ -]?5[ -]?6|5[ -]?6[ -]?7|6[ -]?7[ -]?8|7[ -]?8[ -]?9)\\b`,
  "i",
);
const PAST_YEAR = "20(0\\d|1\\d|2[0-5])";
const OLD_CARD = new RegExp(
  `\\b(last|previous|prior|earlier|former|past) (year'?s?|season'?s?|years?)\\b|\\b(old|older|outdated|out of date|expired|previous|prior|earlier|former|${PAST_YEAR}) (nmjl |league |mahjong |mah ?jongg? )?(cards?|edition|version)\\b|\\bcards?\\b[^.?!,;]{0,30}\\b(from|of|for) (last|previous|prior|another|an earlier|a past|past|${PAST_YEAR}) ?(year|season)?\\b|\\bcards? (is|are|was|were) (old|outdated|out of date|expired|from last year)\\b|\\b(still|keep) (use|using|play|playing)\\b[^.?!,;]{0,30}\\bcards?\\b|\\bcards?\\b[^.?!,;]{0,30}\\b${PAST_YEAR}\\b`,
  "i",
);
// Payment vocabulary plus the bonus words the shared matcher lacks.
const PAY_WORD = new RegExp(`${PAYMENT.source}|\\b(bonus(es)?|multipliers?|premiums?)\\b`, "i");
const EXTRA_PAY =
  /\b(extra|bonus(es)?|triple[sd]?|tripling|multipliers?|premiums?|beyond|besides|other than|apart from|except for|in addition to|on top of(?! (my|the|your|her|his|their) racks?)|special hands?|named hands?|certain hands?|quint hands?|singles? and pairs?|pay(s|ing)? (extra|triple|more than double)|worth (extra|triple|more than double)|(more|extra) than (the )?(usual|normal|regular|standard)|(double|twice) or (triple|more))\b/i;
const BEYOND_JOKERS = /\b(beyond|besides|other than|apart from|except|in addition|on top of|else|other|also|too|as well)\b/i;
const MULTIPLIER_ASK = /\b(beyond|besides|other than|apart from|in addition to|multipliers?|bonus(es)?)\b/i;
const JOKER_ANY = /\bjoker/i;
const DISCARDER = /\b(discarder|thrower|tosser|(person|player|one|lady|woman|man|guy) who (threw|discarded|tossed|put down)|(her|his|their|someone'?s) (discard|throw)|on (a|the|her|his|their) discard)\b/i;
const MULTIPLIER = /\bdouble[sd]?\b|\btriple[sd]?\b|\bjokerless\b|\bjoker[- ]?free\b|\bself[- ]?pick\w*\b|\bself[- ]?drawn?\b|\bdiscarder\b|\bthrower\b|\bsingles? and pairs?\b|\bwall game\b/i;
const VALUE_WORD =
  /\b(hands?|points?|games?|units?|each|one|a win|that|this|it)\b[^.?!,;]{0,20}\bworth\b|\bworth\b[^.?!,;]{0,20}\b(in money|in cash|in cents|in dollars|in points|per|a quarter|a penny|a nickel|a dime|a dollar|money|cash)\b|\b(hand|point|game|unit|money|cash|dollar|cent) values?\b|\bvalues? (of|per|for) (a |the |each |one |my |your )?(hands?|points?|games?|wins?|units?)\b|\bvalues? (in|per) (money|cash|cents|dollars|points?|quarters?|pennies)\b|\bwhat (is|are|'s|does) (the |a |each )?(hand )?values? (mean|worth|in)\b|\bbets?\b|\bbetting\b|\bwager\w*|\bstakes?\b|\bante\b|\bcents?\b|\bquarters?\b|\bdollars?\b|\bbucks?\b|\bpennies\b|\bpenny\b|\bnickels?\b|\bdimes?\b|\$\d|\bper (point|hand|game)\b|\ba point\b|\beach point\b|\bpoint (values?|system)\b|\bhow much\b(?=[^.?!]{0,40}\b(bet|per|worth|a hand|each hand|a point|money|cents?|quarters?|dollars?|penny|pennies)\b)/i;
const HAND_GAME = /\b(hands?|games?|points?|mahjong|play|playing|table|group|win|wins|winning|won|round|units?|pot|kitty)\b/i;
const COMMERCE = /\b(buy|buying|purchase|store|shop|for sale|price|prices|cost|costs|sell|sells|selling|order|amazon|vintage|antique|used set|tile set|mahjong set)\b/i;
const NO_WINNER =
  "\\b(nobody|no one|no body|noone|none of us) (wins|won|has mahjong|gets mahjong|declares? mahjong|declared mahjong|went out|goes out|got mahjong|made mahjong)\\b|\\bno winner\\b|\\bwithout a winner\\b";
const NO_WINNER_RE = new RegExp(NO_WINNER, "i");
const PAY_LOOSE = new RegExp(
  `${PAYMENT.source}|\\b(bonus(es)?|multipliers?|kicks? in|chips? in|coughs? up|forks? over|on the hook|gives? (me )?(more|extra|double|twice)|penalized|extra|more than (the )?(others?|rest|everyone|everybody)|twice|cents?|bucks?|pennies|penny|nickels?|dimes?)\\b`,
  "i",
);
const DISCARD_SOURCE =
  /\b(discards?|discarded|discarding|discarder|thrower|threw|throws?|throwing|tossed|tosser|called tile|calling|called|call|(her|his|their|someone'?s) (tile|throw))\b/i;
const PAY_ON_DISCARD = new RegExp(
  `(${PAY_LOOSE.source})[^.?!]{0,60}${DISCARD_SOURCE.source}|${DISCARD_SOURCE.source}[^.?!]{0,60}(${PAY_LOOSE.source})|\\bwho pays\\b`,
  "i",
);
const SELF_PICK = /\bself[- ]?(pick|draw)\w*\b|\b(own|my) draw\b|\bfrom the wall\b/i;
const SETTLE_ANY = new RegExp(
  `${PAYMENT.source}|\\b(kicks? in|chips? in|coughs? up|ante|antes|kitty|pot|pennies|penny|cents?|bucks?|flat (amount|fee|rate)|exchange (nothing|money|anything)|anything change hands|settle up|square up|even up|keep (our|my|their|your) (money|pennies|quarters|chips|cash))\\b`,
  "i",
);
const WALL_GAME_PAY = new RegExp(
  `\\bwall game\\b[^.?!]{0,60}(${SETTLE_ANY.source})|(${SETTLE_ANY.source})[^.?!]{0,60}\\bwall game\\b|(${NO_WINNER})[^.?!]{0,40}(${SETTLE_ANY.source})|(${SETTLE_ANY.source})[^.?!]{0,40}(${NO_WINNER})`,
  "i",
);
const TALK_VERB =
  "(talk|talking|talks|say|saying|says|tell|telling|tells|told|announce|announcing|hint|hinting|hints|signal|signals|signal(l)?ing|comment|commenting|comments|mention|mentioning|remark|remarks|chat|chatting|ask|asking|discuss|discussing|reveal|revealing|share|sharing|show|showing|let (them|everyone|people|others|the table) know|give away|giving away)";
const NEED_TALK =
  "(what (i|you|we|she|he|they|someone|people|anyone|everyone)('m| am|'re| are| is|'s|s)? ?(need|needs|want|wants|looking for|collecting|waiting for|going for|playing|working on|holding|have|has)|(i|you|we|she|he|they)('m| am|'re| are|s)? (need|needs|collecting|looking for|waiting for|going for|working on|close|one away)|(my|your|their|her|his|someone'?s|other players?'?s?|each other'?s) (hand|hands|tiles|strategy|discards)|which (tiles?|hand)|what tiles?|what hand|what (she|he|they|i|you|we) (threw|discarded|picked|drew))";
const TABLE_TALK = new RegExp(
  `\\btable[- ]talk(ing)?\\b|\\b${TALK_VERB}\\b[^.?!]{0,40}\\b${NEED_TALK}\\b|\\b(hint|hints|hinting|signal|signals|signal(l)?ing|comment|comments|commenting|remarks?|coaching|coach|coaches|kibitz\\w*)\\b[^.?!]{0,40}\\b(hands?|discards?|tiles?|players?|plays?|need|beginner|newbie|partner|neighbou?rs?)\\b|\\b(talk|talking|chat|chatting|chatter|conversation|banter)\\b[^.?!]{0,25}\\b(during|at|while|in the middle of|between)\\b[^.?!]{0,20}\\b(game|play|table|hand|turn|deal|round)\\b|\\b(talk|talking|chat|chatting)\\b[^.?!]{0,20}\\b(about|over)\\b[^.?!]{0,20}\\b(our|my|your|their|the) (hands?|tiles?|strategy|discards?)\\b|\\b(react|reacting|reaction|groan|groaning|sigh|sighing|gasp|celebrate|celebrating|facial expressions?|body language)\\b[^.?!]{0,30}\\b(tiles?|discards?|hands?|throws?|draw)\\b`,
  "i",
);
const NAMED_DISCARD = new RegExp(`${NAMING.source}[^.?!]{0,30}${DISCARDED.source}|${DISCARDED.source}[^.?!]{0,30}${NAMING.source}`, "i");
// "cannot agree" needs an object ("on a rule", "whether"): a bare "my table cannot agree" is
// scene setting, not the question.
const DISPUTE =
  /\b(disputes?|disputed|disputing|disagree\w*|argu(e|es|ed|ing|ment|ments)|quarrel\w*|squabbl\w*|bicker\w*|(can'?t|cannot|don'?t|do not|never|couldn'?t|could not) agree (on|about|over|whether|if|with|what|who|how|when)|no one agrees|nobody agrees|who (decides|gets to decide|is right|is correct|has the final say|gets the final say|settles (it|this|that)|has the last word|rules on (it|this|that)|arbitrates)|final say|last word|referee|arbiter|umpire|tie ?breaker|resolv(e|es|ed|ing)\b[^.?!,;]{0,30}\b(rules?|rulings?|disputes?|questions?|calls?|disagreements?|arguments?))\b/i;
const AUTHORITY_WORD =
  /\b(official(ly)?|nmjl|the league|national mah ?jongg? league|rule ?books?|made easy|governing body|(real|standard|actual|legit|legitimate|proper|true|formal|written|published) rules?|who (makes|writes|sets|publishes|creates|invented) the rules)\b/i;
const LOOK_VERB = /\b(look|looks|looking|looked|see|sees|seeing|view|viewing|check|checking|peek|peeking|glance|examine|inspect|read|study)\b/i;
const OTHERS = "(another|other|others|someone|somebody|opponents?|her|his|their|she|he|they|everyone|everybody|players?|people|neighbou?rs?|across|partner|else|anyone)";
const OTHERS_EXPOSED = new RegExp(
  `\\b${OTHERS}('s|s')?\\b[^.?!,;]{0,30}\\b(expos\\w+|racks?|melds?|hands?|face[- ]?up|laid down|put down|showing|on the table)\\b|\\b(expos\\w+|melds?|racks?|face[- ]?up tiles?)\\b[^.?!,;]{0,30}\\b${OTHERS}\\b|\\b(expos\\w+|tiles?|melds?)\\b[^.?!,;]{0,20}\\b(visible|public|private|hidden|secret|fair game|open to)\\b|\\b(visible|public|private|hidden|secret)\\b[^.?!,;]{0,20}\\b(expos\\w+|tiles?|melds?)\\b|\\bwhat('s| is| has been| was) (been )?(exposed|laid down|put down|on (the|her|his|their) racks?)\\b`,
  "i",
);
const CHECK_MAHJONG = /\b(verify|verified|verifying|check|checking|checked|confirm|confirming)\b[^.?!]{0,30}\b(mahjong|maj|win|winning hand|call|claim)\b/i;
// The League as an authority, not a bare mention: "when does the league release the card" is
// the annual card entry's question. A house rule reads as this entry's only beside an official,
// League, or real rule; "a rule versus a house rule" is the courtesies entry's own question.
const AUTHORITY = new RegExp(
  `\\bofficial(ly)?\\b|\\bwho (makes|writes|sets|publishes|creates|invented|is in charge of|governs|decides) (the |these |mahjong |american mahjong |the official )?rules\\b|\\bwhere (do|does|did|are|can (i|we|you) (find|read|get)) (the |these |mahjong |american )?(official |actual |real )?rules\\b|\\bwhich rules (are|do|apply|count|govern)\\b|\\brule ?books?\\b|\\bmade easy\\b|\\bsource of (the )?rules\\b|\\bgoverning body\\b|\\bauthority\\b|\\b(nmjl|the league|national mah ?jongg? league)\\b[^.?!]{0,40}\\b(rules?|rulings?|say|says|allow|allows|require|requires|standard)\\b|\\brules?\\b[^.?!]{0,40}\\b(nmjl|the league|national mah ?jongg? league)\\b|\\bwhat (is|does|'s) (the )?(nmjl|national mah ?jongg? league)\\b|\\b(real|standard|actual|legit|legitimate|proper|true|formal|written|published) rules?\\b|\\bleague[- ](approved|sanctioned|rules?|rulings?)\\b|\\bhouse rules?\\b[^.?!,;]{0,40}\\b(official|league|nmjl|standard|actual|real|legit|legitimate)\\b|\\b(official|league|nmjl|standard|actual|real|legit|legitimate)\\b[^.?!,;]{0,40}\\bhouse rules?\\b`,
  "i",
);
const ETIQUETTE_WORD = /\betiquette\b|\bcourtes(y|ies)\b/i;
// Topics with their own entry that also carry rules vocabulary: an official-rule question that
// names one of these is that entry's question.
const NAMED_TOPIC =
  /\b(tiles? count|how many|suits?|flowers?|dragons?|winds?|soap|pairs?|pungs?|kongs?|dealer|dealing|dealt|east|open hands?|closed hands?|concealed|discards?|passing|pass(es|ed)?|wall|walls|mahjong in error|redeem\w*|exchang\w*)\b/i;

export const LVM_CARDSCORING: CanonicalRule[] = [
  {
    id: "card-numbers",
    category: "card",
    level: "foundational",
    questions: ["What do the numbers on the card mean?"],
    related: ["any-like-number", "consecutive-numbers", "pung-vs-kong"],
    topic: "Numbers on the card",
    question_patterns: [
      CARD_DIGIT,
      /\b(numbers?|digits?)\b[^.?!]{0,30}\b(on|in) (the |this |a |my )?(nmjl |league )?card\b/i,
      /\bcard\b[^.?!]{0,30}\b(numbers?|digits?)\b[^.?!]{0,20}\b(mean|means|meaning|stand for|stands for)\b/i,
      /\bwhat (does|do) (the |a )?[1-9]{1,3}\b[^.?!]{0,20}\b(mean|means|stand for)\b/i,
      /\b[1-9]{3}\b[^.?!]{0,20}\b(mean|means|stand for|kong|pung)\b/i,
      /\b(number|digit)\b[^.?!]{0,30}\b(printed|repeated|shown|written|appears?) (three|3|four|4|twice|two|2) times\b/i,
    ],
    keywords: ["numbers on the card", "digit", "card mean", "number printed"],
    requires: [CARD_WORD, CARD_DIGIT],
    // Like-number and consecutive placeholders have their own entries; colors, letters, and
    // the Soap as zero belong to the notation entry; an old card is a different question.
    blocks: [LIKE_NUMBER, (q: string) => CONSECUTIVE.test(q) && !REPEAT_IN_A_ROW.test(q), OLD_CARD, LEGEND_ASK, JOKER],
    answer:
      "A digit printed in a hand on the card is usually the tile's number, not a group size: the card shows a group by repeating that tile, so three of the same digit is a Pung of that number and four is a Kong. The card's key defines a Pair as 2 like tiles, a Pung as 3, a Kong as 4, a Quint as 5, and a Sextet as 6. When you see a placeholder like 'any like number,' you pick the number yourself and use it consistently throughout that hand.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("the-card.numbers", "card"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "any-like-number",
    category: "card",
    level: "core",
    questions: ["What does 'any like number' mean?"],
    related: ["consecutive-numbers", "card-numbers", "open-vs-closed"],
    topic: "Any like number",
    question_patterns: [
      LIKE_NUMBER,
      /\blike numbers?\b[^.?!]{0,30}\b(mean|means|meaning)\b/i,
      /\b(same|one|single) number\b[^.?!]{0,30}\b(all|every|each|three|3) suits?\b/i,
    ],
    keywords: ["like number", "any number", "same number"],
    requires: [LIKE_NUMBER, NUMBER_CONTEXT],
    blocks: [JOKER, CONSECUTIVE],
    answer:
      "'Any like number' means you can choose any number (1 through 9) and use that same number across the required suits. For example, if the hand calls for 3 Bams, 3 Craks, and 3 Dots of 'any like number,' all three sets must use the same number (say, all 4s).",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("the-card.like-number", "owner"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "consecutive-numbers",
    category: "card",
    level: "core",
    questions: ["What does 'consecutive numbers' mean?"],
    related: ["any-like-number", "card-numbers", "winning-mahjong"],
    topic: "Consecutive numbers",
    question_patterns: [
      CONSECUTIVE,
      /\bconsecutive\b[^.?!]{0,30}\b(mean|means|meaning|numbers?|run|hand)\b/i,
      /\b(gaps?|skip|skipping|skips|missing) (a |any |one )?(number|numbers|one)\b/i,
    ],
    keywords: ["consecutive", "run", "sequence", "in order", "no gaps"],
    requires: [CONSECUTIVE, NUMBER_CONTEXT],
    // A joker in a run is the mixed-group joker rule; calling for a run is a calling question;
    // wall rows, turn order, and consecutive wins share the vocabulary but not the topic.
    blocks: [
      REPEAT_IN_A_ROW,
      JOKER, CLAIM_VERB, /\bwalls?\b/i, LAST_OF_WALL, ORDER, /\blike numbers?\b/i,
      /\bconsecutive (hands?|games?|wins?|turns?|deals?|rounds?|wall games?|weeks?|days?|years?|times)\b|\b(win|wins|won|winning) (two|three|2|3|several|multiple|a few) (consecutive|in a row)\b/i,
    ],
    answer:
      "Consecutive numbers are sequential: 1-2-3, or 4-5-6, etc. The hand will specify how many consecutive numbers you need and in which suits. You choose the starting number, but all tiles must follow in order without gaps.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("the-card.consecutive", "owner"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "last-years-card",
    category: "card",
    level: "core",
    questions: ["Can I play with last year's card?"],
    related: ["annual-card", "card-numbers", "house-vs-nmjl"],
    topic: "Last year's card",
    question_patterns: [
      OLD_CARD,
      /\b(last|previous|prior|old|older) year'?s? cards?\b/i,
      /\b(still|keep) (use|using|play|playing)\b[^.?!]{0,30}\bcards?\b/i,
      /\bcards?\b[^.?!]{0,30}\b(still (good|ok|okay|valid|work|works|count|counts)|expired?|out of date|outdated)\b/i,
    ],
    keywords: ["last year", "old card", "previous", "expired", "outdated"],
    requires: [CARD_WORD, OLD_CARD],
    answer:
      "The League releases a new card every spring and the hands change, so play uses the current year's card. In casual home games, groups sometimes agree to use an older card; just make sure everyone is playing from the same card.",
    varies_by_house: true,
    confidence: "high",
    approval: "owner_approved",
    classification: "house_optional_rule",
    provenance: lvmPage("the-card.last-year", "house"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "extra-payments",
    category: "scoring",
    level: "advanced",
    questions: ["Do any hands pay extra beyond joker-free?"],
    related: ["joker-free", "game-value", "pay-discard-win"],
    topic: "Hands that pay extra",
    question_patterns: [
      EXTRA_PAY,
      PAY_WORD,
      /\b(beyond|besides|other than|apart from|in addition to)\b/i,
      /\b(extra|bonus(es)?|triple[sd]?|multipliers?|premiums?)\b/i,
      /\b(quint|singles? and pairs?|special|named|certain) hands?\b[^.?!]{0,30}\b(pay|pays|worth|double|triple|bonus|extra)\b/i,
    ],
    keywords: ["extra", "bonus", "triple", "beyond", "multiplier", "quint hand"],
    requires: [PAY_WORD, EXTRA_PAY],
    // A joker-free question with no "beyond" sense is the joker-free entry's; the discarder's
    // share, self pick, errors, misnames, dead hands, wall games, and tournaments each have
    // their own payment entry.
    blocks: [
      (q: string) => JOKER_ANY.test(q) && !BEYOND_JOKERS.test(q),
      (q: string) => ERROR_CUE.test(q) && !MULTIPLIER_ASK.test(q),
      MISNAMED,
      DEAD,
      TOURNAMENT,
      SELF_PICK,
      DISCARDER,
      /\bwall game\b/i,
    ],
    answer:
      "Some groups play that certain named hands (like Singles and Pairs or Quint hands) pay double or triple by house agreement. Beyond joker-free doubling, the card itself names two more multipliers: a player who declared mahjong in error pays double the value of the incorrect hand when the game cannot continue, and a player who misnamed a tile that was then called for mahjong pays the claimant 4 times the value of the hand. Every hand's value is printed beside it on the card. Other multipliers, such as the discarder paying double, are not printed on the card. Payment conventions can vary by group. Confirm your table's payment rules before play.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "standard_nmjl_rule",
    provenance: lvmPage("scoring.extra", "card"),
    last_verified: VERIFIED_LVM,
    tags: ["money"],
  },
  {
    id: "game-value",
    category: "scoring",
    level: "advanced",
    questions: ["How much is a hand worth?"],
    related: ["pay-discard-win", "joker-free", "extra-payments"],
    topic: "What a hand is worth",
    question_patterns: [
      VALUE_WORD,
      /\bhow much\b[^.?!]{0,30}\b(worth|bet|per hand|per point|a hand|each hand|money)\b/i,
      /\b(game|hand|point) values?\b/i,
      /\b(cents?|quarters?|dollars?|pennies|penny|nickels?|dimes?|bucks?)\b[^.?!]{0,30}\b(hands?|games?|points?)\b/i,
      /\bvalue of (a |the |my |each |one )?(hand|point|game)\b/i,
    ],
    keywords: ["worth", "value", "bet", "point", "cents", "quarter", "dollar"],
    requires: [VALUE_WORD, HAND_GAME],
    // Multipliers, the discarder's share, self pick, wall games, dead hands, and error
    // settlements all have dedicated entries; this one is only what a unit is worth.
    blocks: [
      JOKER_ANY, MULTIPLIER, DISCARDED, SELF_PICK, DEAD, ERROR_CUE, MISNAMED, TOURNAMENT, EXTRA_PAY, QUINT_SEXTET,
      NO_WINNER_RE, LAST_OF_WALL, CX_LETTERS, HAND_CLOSED, STRATEGY, COMMERCE,
    ],
    answer:
      "The card prints a value beside each hand, but groups agree before play what those values are worth in money. Common amounts range from 25 cents to $1 per point or per hand. Whatever your group agrees, that amount is what 'one unit' means for payment purposes.",
    varies_by_house: true,
    house_note: "The amount per hand is always a group agreement.",
    confidence: "high",
    approval: "owner_approved",
    classification: "house_optional_rule",
    provenance: lvmPage("scoring.game-value", "house"),
    last_verified: VERIFIED_LVM,
    tags: ["money"],
  },
  {
    id: "pay-discard-win",
    equivalents: ["payments-basics"],
    category: "scoring",
    level: "advanced",
    questions: ["Who pays when someone wins on a discard?"],
    related: ["self-drawn-win", "joker-free", "game-value"],
    topic: "Paying on a discard win",
    question_patterns: [
      PAY_ON_DISCARD,
      /\bwho pays\b/i,
      /\b(discarder|thrower|person who (threw|discarded)|player who (threw|discarded))\b[^.?!]{0,30}\b(pay|pays|paid|owe|owes|double|more|extra)\b/i,
      /\bpay(s|ing)? double\b/i,
    ],
    keywords: ["who pays", "discarder", "thrower", "double", "discard"],
    requires: [PAY_ON_DISCARD],
    // Wall games, self picks, jokers, dead hands, errors, misnames, and tournaments pay by
    // their own entries.
    blocks: [/\bwall game\b/i, SELF_PICK, JOKER_ANY, DEAD, ERROR_CUE, MISNAMED, TOURNAMENT, LAST_OF_WALL, NO_WINNER_RE],
    answer:
      "Groups settle this in one of two ways: the player who discarded the winning tile pays double while the other two pay the single amount, or all three pay the same. Payment conventions can vary by group. Confirm your table's payment rules before play.",
    varies_by_house: true,
    confidence: "high",
    approval: "owner_approved",
    classification: "house_optional_rule",
    provenance: lvmPage("scoring.discard-pays", "house"),
    last_verified: VERIFIED_LVM,
    tags: ["money"],
  },
  {
    id: "wall-game-payment",
    equivalents: ["payments-basics"],
    category: "scoring",
    level: "advanced",
    questions: ["How does payment work in a wall game?"],
    related: ["wall-game", "game-value", "wall-game-jokers"],
    topic: "Wall game payment",
    question_patterns: [
      WALL_GAME_PAY,
      /\bwall game\b[^.?!]{0,40}\b(pay|pays|paid|payment|money|owe|owes|settle|collect|score|kitty|ante)\b/i,
      /\b(nobody|no one) (wins|won)\b[^.?!]{0,40}\b(pay|pays|owe|owes|money|settle)\b/i,
    ],
    keywords: ["wall game", "pay", "money", "no winner", "kitty"],
    requires: [WALL_GAME_PAY],
    blocks: [JOKER_ANY, DEAD, ERROR_CUE, TOURNAMENT],
    answer:
      "In a wall game (no winner), nobody collects a win payment. Some groups pay every other player a small flat amount as a house rule, and others exchange nothing. Payment conventions can vary by group. Confirm your table's wall game rule before play.",
    varies_by_house: true,
    confidence: "high",
    approval: "owner_approved",
    classification: "house_optional_rule",
    provenance: lvmPage("scoring.wall-game", "house"),
    last_verified: VERIFIED_LVM,
    tags: ["money"],
  },
  {
    id: "table-talk",
    category: "etiquette",
    level: "core",
    questions: ["What counts as table talk?"],
    related: ["courtesies-vs-rules", "see-exposed-tiles", "disputes"],
    topic: "Table talk",
    question_patterns: [
      TABLE_TALK,
      /\btable[- ]talk\b/i,
      /\b(say|tell|announce|mention)\b[^.?!]{0,30}\bwhat (i|you|we|she|he|they) (need|needs|want|wants)\b/i,
      /\b(hint|hinting|signal|signaling|signalling|coaching|kibitz\w*)\b/i,
    ],
    keywords: ["table talk", "talk", "hint", "signal", "announce"],
    requires: [TABLE_TALK],
    // Naming a discard and speaking a claim are their own rules; a dead-hand challenge, a
    // strategy tip, and a phone call share the verbs but not the topic.
    blocks: [MISNAMED, SPOKEN_CLAIM, NAMED_DISCARD, DEAD, STRATEGY, CONTACT_SENSE, JOKER_EXCHANGE],
    answer:
      "Table talk is any verbal communication that gives information about your hand or strategy to other players, or that influences how others play. Examples: announcing what you need, commenting on another player's discard choices, or reacting to tiles in a way that signals your hand. Table talk is generally prohibited in competitive play. In casual home games, groups set their own rules.",
    varies_by_house: true,
    confidence: "high",
    approval: "owner_approved",
    classification: "house_optional_rule",
    provenance: lvmPage("etiquette.table-talk", "house"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "disputes",
    category: "etiquette",
    level: "core",
    questions: ["Who resolves a rules dispute?"],
    related: ["house-vs-nmjl", "courtesies-vs-rules", "wrong-exposure"],
    topic: "Rules disputes",
    question_patterns: [
      DISPUTE,
      /\b(disputes?|disagreements?|arguments?)\b[^.?!]{0,30}\b(rules?|rulings?|calls?|table|game)\b/i,
      /\bwho (decides|is right|has the final say)\b/i,
      /\b(can'?t|cannot|don'?t) agree (on|about|whether|if)\b/i,
    ],
    keywords: ["dispute", "disagree", "argument", "who decides", "who is right"],
    requires: [DISPUTE],
    // A disagreement about a named rule is that rule's question; a League authority question
    // is the house-versus-League entry's.
    blocks: [
      MISNAMED, JOKER, /\bpairs?\b/i, CHARLESTON_WORD, BLIND_PASS, DEAD, EXPOSURE_WORD, QUINT_SEXTET,
      /\b(pungs?|kongs?)\b/i, AUTHORITY_WORD, (q: string) => MAHJONG_CUE.test(q) && ERROR_CUE.test(q),
    ],
    answer:
      "In a home game, all four players agree together (majority rules or unanimity, depending on the group). In a league or club setting, a designated rule referee or club leader makes the call. If no resolution is possible mid-game, the safest option is to replay the hand.",
    varies_by_house: true,
    house_note: "Each group decides how it settles disputes; agree on it before you play.",
    confidence: "high",
    approval: "owner_approved",
    classification: "house_optional_rule",
    provenance: lvmPage("etiquette.disputes", "house"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "see-exposed-tiles",
    category: "etiquette",
    level: "core",
    questions: ["Can I look at another player's exposed tiles?"],
    related: ["joker-exchange", "table-talk", "expose-immediately"],
    topic: "Looking at exposed tiles",
    question_patterns: [
      OTHERS_EXPOSED,
      LOOK_VERB,
      /\b(look|looking|see|check|peek|study)\b[^.?!]{0,30}\b(expos\w+|racks?)\b/i,
      /\b(expos\w+|tiles?)\b[^.?!]{0,20}\b(visible|public|private|hidden|secret)\b/i,
    ],
    keywords: ["look", "see", "exposed", "rack", "visible"],
    requires: [LOOK_VERB, OTHERS_EXPOSED],
    // Looking at a blind pass, claiming a tile, checking a mahjong, and checking an exposure
    // to redeem a joker are other entries' rules.
    // "look at what she exposed to see which joker i can grab" is still a look at exposed tiles.
    blocks: [BLIND_PASS, JOKER_EXCHANGE, (q: string) => CLAIM_VERB.test(q) && !/\bjokers?\b/i.test(q), HOLD_FOR_CHECK, CHECK_MAHJONG],
    answer:
      "Yes. Exposed tiles (those placed face-up on the table after a call) are always visible and any player may look at them at any time. Concealed tiles in another player's rack are private.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "etiquette",
    provenance: lvmPage("etiquette.see-exposed", "owner"),
    last_verified: VERIFIED_LVM,
  },
  {
    id: "house-vs-nmjl",
    category: "etiquette",
    level: "core",
    questions: ["What is the difference between a house rule and an NMJL rule?"],
    related: ["courtesies-vs-rules", "disputes", "annual-card"],
    topic: "House rules versus League rules",
    question_patterns: [
      AUTHORITY,
      /\bhouse rules?\b[^.?!]{0,40}\b(nmjl|official|league|real|standard|actual)\b/i,
      /\b(nmjl|official|league|real|standard|actual)\b[^.?!]{0,40}\bhouse rules?\b/i,
      /\bwhat is (a |an )?(nmjl|official|league) rule\b/i,
      /\bis (this|that|it) (a |an )?(house|official|nmjl|real|standard|actual|league) rule\b/i,
      /\bwho (makes|writes|sets|publishes) the rules\b/i,
      /\brule ?books?\b/i,
    ],
    keywords: ["house rule", "nmjl", "official", "league", "rulebook", "real rule"],
    requires: [AUTHORITY],
    // Whether a specific rule is official is that rule's own entry; etiquette and courtesies
    // are the courtesies entry's question.
    blocks: [
      BLANK, JOKER, DEAD, TOURNAMENT, THREE_PLAYER_SEATS, CHARLESTON_WORD, MISNAMED, CX_LETTERS, QUINT_SEXTET,
      ETIQUETTE_WORD, COURTESY, CLAIM_VERB, ORDER, NAMING, EXPOSURE_WORD, HAND_SIZE, STRATEGY, NAMED_TOPIC,
    ],
    answer:
      "NMJL rules are the official rules published by the National Mah Jongg League and apply to all standard American Mahjong play. House rules are variations or additions agreed upon by a specific group that are not part of the official rules. House rules are fine for casual play; just make sure all players agree before the game starts. When in doubt about what is 'official,' the NMJL card and published guidelines are the authority.",
    varies_by_house: false,
    confidence: "high",
    approval: "owner_approved",
    classification: "etiquette",
    provenance: lvmPage("etiquette.house-vs-nmjl", "owner"),
    last_verified: VERIFIED_LVM,
    aliases: ["rules-source"],
  },
];
