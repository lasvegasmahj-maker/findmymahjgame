// Is this a rules question at all? Both sites put rules questions in the same box as something
// else (Find My Mahj: the national directory search; Las Vegas Mahjong: questions about the
// studio, lessons, and open play), so the split must be deterministic and shared: a rules
// signal without a discovery signal is "rules", both together is "mixed", and everything else
// is "other", which each site handles its own way. Ported from Find My Mahj lib/ask-intent.ts
// at cb87d4c; the discovery half is supplied by the site so a place name or a lesson question
// is never answered with a confident rule on either site.

import {
  blindReadsAsPlace,
  BLANK,
  BLIND_PASS,
  HAND_CLOSED,
  RULES_TOPIC_SIGNALS,
  DEAD_THING,
  RULES_TOPIC_SIGNALS_CONDITIONAL,
  VARIANT_RE,
  CONTACT_SENSE,
  MAHJ_ONLY_NOUN,
  HOLD_WAIT,
  placeAfterPrep,
  STYLE_WORD,
  OWN_DISCARD,
} from "../corpus/matchers.ts";
import { prepare } from "./normalize.ts";
import { RULES_KNOWLEDGE } from "../corpus/entries.ts";
import { isCardContentRequest } from "./guards.ts";

export type AskTopic = "rules" | "mixed" | "other";

// The only rules signal a telephone phrase can trip by accident: "call back" and "take back"
// mean the discard at the table and the callback in the lobby.
const TAKE_BACK_RE = /\b(my own discard|own discard|call back|take back|take it back)\b/i;

const RULES_SIGNAL_RES: RegExp[] = [
  /\bjokers?\b/i,
  /(?<!(?:near|in|around|at|visiting|by|to|from)\s)\bcharleston\b/i,
  // "dragon boat" is a festival, not a tile.
  /\bdragons?\b(?!\s+boat)/i,
  /\bsoap\b(?!\s+opera)/i,
  // "Flower Mound" is a Texas city and "flower arranging" a pastime, not a tile question.
  /\bflowers?\b(?!\s+(mound|arrang\w*|shop|shops|show|girls?|power|garden|market|festival|delivery))/i,
  /\b(pungs?|kongs?|quints?|sextets?)\b/i,
  /\bjokers?\b.{0,60}\bpairs?\b|\bpairs?\b.{0,60}\bjokers?\b/i,
  /how many (tiles|suits|flowers|jokers|winds|dragons)/i,
  /how many (players|people)/i,
  /\btile count\b/i,
  /\b152\b/,
  /\b(concealed|exposed|exposure)\b/i,
  /\bopen hands?\b/i,
  HAND_CLOSED,
  /\b(call|calling|claim)\b.{0,20}\bdiscards?\b/i,
  /\bwall game\b/i,
  /\bthe wall\b(?!\s+street)/i,
  /\bdead hand\b/i,
  /\b(nmjl|national (mah ?jongg?|mahjong) league)\b/i,
  /\b(etiquette|courtes(y|ies))\b/i,
  /\b(a |an )?(real|actual|official|legit|legitimate|standard|proper|league|nmjl) rule\b|\bis that (even )?(allowed|legal|a rule)\b|\bin the (official )?rules\b|\bagainst the rules\b/i,
  /(new|annual|yearly|current|next|this year'?s?)\s+cards?\b/i,
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
  TAKE_BACK_RE,
  /\b(hold|keep)\b[^.?!]{0,24}\bhands?\b[^.?!]{0,30}\b(mahjong|maj|call|called|check|checked|verified)\b/i,
  /\bout of turn\b/i,
  /\bmis-?nam(e|ed|es|ing)\b|\bwrong name\b/i,
  /\b(false|wrong|mistaken|bad) (mahjong|maj|mah ?jong+)\b|\b(mahjong|maj|mah ?jong+) (in error|by mistake|by accident|wrongly|incorrectly)\b|\bdeclared (mahjong|maj|mah ?jong+)\b/i,
  /\b(name|announce|say) (the |each |every |a |my |your )?(tile|discard)\b|\bsay same\b|\bsaying same\b/i,
  new RegExp(`${HOLD_WAIT.source}.{0,30}\\b(tile|discard)\\b`, "i"),
  /\b(too many|too few|wrong number of|right number of|correct number of) tiles\b|\bhow many tiles (should|do|must) (i|you|we)\b/i,
  /\bwhich hand should i\b|\bhow do i (pick|choose|decide on) (a|my) hand\b/i,
  /\b(order of play|turn order|whose turn|which way (do|does) (play|the turns?|it) go)\b/i,
  /\b(colou?rs?|letters?) on the card\b|\bwhat does (c|x|f|d) (mean|stand for)\b|\bsoap\b.{0,20}\bzero\b/i,
  /\b(last|final) (tile|discard)\b/i,
  /\bwho (makes|writes|sets) the rules\b/i,
  /\bmelds?\b|\b(quints?|sextets?)\b/i,
  /\b(can|may|could|should|am i allowed to) (i |we )?(call|claim) (that|this|it)[?!. ]*$/i,
  /\b(call|calling|claim|claiming) (a |the |that |this |any )?(tile|discard)s?\b/i,
  // "I asked can I pass and nobody knew": the bare question mid-sentence is still the question.
  /\b(can|may|do|should|must) (i|we|you) (have to |need to )?pass\b(?=[?!. ]*$|[?!.,;]| (and|but|so|or|if)\b)/i,
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
  // Signals from Las Vegas Mahjong's engine that Find My Mahj lacked: card reading terms,
  // table talk, disputes, and the payment vocabulary of the house-rule entries.
  /\bjoker[- ]?free\b|\bjokerless\b|\btable talk\b|\blike numbers?\b/i,
  /\b(take|call|claim|grab|have) (that|this|the) (tile|discard)\b/i,
  /\b(say|said|saying|yell|yelled|shout|shouted) (wait|hold)\b/i,
  /\b(dealer|east) (took|takes|gets|got|has|had|get|take) (13|14|fourteen|thirteen)\b|\b(13|14) or (13|14)( tiles)?\b|\b(took|got) (13|14) (tiles )?and\b/i,
  /\bpass(ed|ing)? \d+ tiles\b|\b(3|three|4|four|2|two) tiles (instead|not|rather)\b/i,
  /\b(throw|throwing|discard|discarding|put down) (tiles?|it|them)\b[^.?!]{0,20}\b(quiet|quietly|silent|silently|without (saying|naming|announcing))\b|\bwithout (saying|naming|announcing) (them|it|the tile)\b/i,
  /\b(win|wins|won|winning) (off|on|from) (a|the|her|his|their|someone'?s?|somebody'?s?) (tile|discard|throw)\b|\bown pick\b/i,
  /\b(i'?m|im|am i|is my hand|my hand is|they said i'?m|they said im|called me|call me|calling me) dead\b/i,
  // "both got called dead", "was declared dead": the passive challenge.
  /\b(got|was|were|been|being|am|are|is) (wrongly |just )?(called|declared|ruled|deemed|pronounced) dead\b|\bboth (got |were |are )?(called |declared )?dead\b|\b(two|three|both) dead\b/i,
  /\bhow long (do|does|can|before|until)\b[^.?!]{0,20}\b(call|claim)\b(?! ?back)/i,
  /\bjoker swap\b/i,
  /\bwinds? (part of|in) a suit\b|\bis (north|south|east|west) a (bam|crak|dot)\b/i,
  // "tournament play near Naples" is a search; "tournament play" alone is a conditional signal.
  /\btournaments? (follow|use|have|make|run|score)\b|\b(do|does|are|how do) tournaments?\b/i,
  /\b(right|left|across),? (across|left|right),? (then |and )?(left|right|across)\b|\bsecond (go )?round\b/i,
  /\b(threw|discarded|tossed|put down) (a|an|the) (north|south|east|west|soap|bam|crak|dot|joker|flower|dragon|\d)\b/i,
  /\b(can|may|could) i (grab|take|call|claim|have) (it|that|this)\b/i,
  /\bok(ay)? (if|to) (i|we) pass\b|\bif i pass\b|\bpass this time\b|\bpass on this one\b|\bcan i just pass\b|\bjust got thrown\b|\bgot thrown\b/i,
  /\b(last|previous|old|older|prior) year'?s? card\b/i,
  /\b(look|looking|peek|peeking|see|check|checking)\b[^.?!]{0,30}\bbefore (i|you|we|they|the|a) pass\w*\b|\b(look|looking|peek|peeking)\b[^.?!]{0,30}\bbefore passing\b/i,
  /\bdead player\b|\bconsecutive numbers?\b/i,
  /\b(valid|legal|legit|real|proper|legitimate|genuine) (mahjong|mahj|maj)\b/i,
  /\b(went|go|going|goes|got|get|getting) (mahjong|mahj|maj)\b|\b(mahjong|mahj|maj) to count\b|\b(nobody|no one|noone) (goes|went) out\b/i,
  /\bcards?\b[^.?!]{0,12}\b(19|20)\d\d\b|\b(19|20)\d\d\b[^.?!]{0,12}\bcards?\b/i,
  // "what happens if someone calls me dead": a dead-hand challenge, not a phone call.
  /\b(call|calls|called|calling|declare|declared|declares|say|says|said)\b[^.?!]{0,15}\b(me|my hand|him|her|them|someone|a hand|your hand|his hand|her hand|their hand)\b[^.?!]{0,10}\bdead\b/i,
];

// Everyday-word signals need mahjong vocabulary in the sentence and no directory or commerce
// wording before they count.
const CONDITIONAL_RULES_SIGNALS: RegExp[] = [
  // The shared BLANK matcher is replaced by the stricter one below (a blank form field, a
  // blank stare, a blank screen are support and everyday senses, not blank tiles).
  ...RULES_TOPIC_SIGNALS_CONDITIONAL.filter((re) => re !== BLANK),
  /\bhow many of each\b/i,
  /\b(three|3) of us\b[^.?!]{0,40}\b(pass|passing|charleston|deal|dealt|redeal|tiles each|how many tiles)\b/i,
  /\bre-?deal\b|\b(12|14) tiles\b|\bwrong number of tiles\b|\bshort a tile\b|\bextra tile\b(?!\s+sets?\b)/i,
  new RegExp(`${HOLD_WAIT.source}[^.?!]{0,30}\\b(call|claim|tile|discard|priority|count|counts|mean)\\b(?![^.?!]{0,12}\\b(back|ahead|first)\\b)|\\b(call|claim|tile|discard|priority)\\b[^.?!]{0,30}${HOLD_WAIT.source}`, "i"),
  /\bcold wall\b|\bhot wall\b|\b(final|last) discard\b[^.?!]{0,40}\b(wall|deal|game|exposure|mahjong)\b|\b(wall|deal)\b[^.?!]{0,40}\b(final|last) discard\b/i,
  /\bblanks?\b(?! (check|page|space|form|field|fields|line|lines|box|boxes|cell|cells|row|rows|screen|entry|slate|stare|expression|look))/i,
  /\btournament (rules?|play|director)\b/i,
  /\brule ?book\b|\bmade easy\b/i,
  /\b(what|which|how many|name|the|three|3) suits?\b|\bsuits? (in|of) (american )?mahjong\b/i,
  /\bthe passing\b|\bpassing (before|round|phase|tiles|rules?)\b|\bbefore the game (starts|begins)\b/i,
  /\bhow (do|does|can) (i|you|we|someone|a player) (actually |even |really )?win\b|\bwin the game\b/i,
  /\b(call|claim|take) (it|that|this)\b/i,
  /\bhands\b.{0,30}\bcards?\b/i,
  /\b(three|3|five|5|two|2) (people|players|of us)\b|\bplay with (three|3|five|5|two|2)\b|\bthree[- ](player|handed|person)\b/i,
  /\bwho goes (next|first|after)\b/i,
  /\b(what|which) tiles\b/i,
  /\bon the card\b|\bwhat does (the )?(little |letter |a |an )?[cx] (mean|stand for)\b|\b[cx] (after|next to|beside|behind) (a|the) hand\b/i,
  /\bself[- ]?drawn?\b|\bown draw\b/i,
  /\b(who|how much) (pays?|do (i|we|you) pay)\b/i,
  /\b(any|like) number\b|\bsingles? and pairs?\b|\bold card\b/i,
  /\bpoint (is|=|equals) (a |one )?(penny|nickel|dime|quarter|cent|dollar)\b|\b(penny|nickel|dime|quarter|cent|dollar) (a|per|each) (point|hand)\b|\bplay for money\b|\bwhat they owe\b|\bwho owes\b|\bowe (me|each other|them|anybody|anyone|anything|everyone)\b|\bloss cap\b|\bcaps? (on )?(our |the |my )?losses\b|\bput (a dollar|a quarter|money|\$\s?\d+) in\b/i,
  /\b(18|19) tiles\b|\bhow long is (each|the|a) wall\b|\bcard (shows|says|lists|prints|has) \d/i,
  /\b(min|minimum|max|maximum|fewest|least|most) (number of )?(people|players)\b|\bnumber of (people|players)\b/i,
  /\b(pick|choose|decide on|go for) (which|what|a|my) hand\b|\bwhich hand to\b/i,
  /\b(stare|peek|look|glance) at\b[^.?!]{0,20}\b(tiles?|rack|exposures?)\b/i,
  /\b(call|calling|claim) (stuff|things|anything)\b/i,
  /\bdice\b|\broll(ing)? (the )?dice\b|\bwho('s| is) east (first|for the first)\b/i,
  /\b(cannot|can'?t|couldn'?t) agree\b|\bsettle (it|this|that|the (dispute|argument))\b/i,
  /\b(only |just )?(have|has|got|holding) (only |just )?12\b|\b12 tiles\b/i,
  /\b(one|a|each) point\b[^.?!]{0,20}\b(money|worth|cents?|penny|dollar|set)\b|\bmoney wise\b/i,
  /\bsit out\b|\bthrow (it|my hand) in\b|\b(middle|end) of (a|the) (hand|game|deal)\b/i,
  /\bforgot to (pick|draw)\b|\bwithout (picking|drawing)\b/i,
  /\bput up\b[^.?!]{0,10}\b(bams?|craks?|dots?|tiles?|a pung|a kong|three|3|4|four)\b/i,
  /\bplays? (the |as )?(0|zero)\b|\bcan i pass\b/i,
  /\bwall (ran|runs) out\b|\bnobody (won|wins)\b/i,
  /\b(north|south|east|west) winds?\b|\b(four|4|the) winds\b|\bwinds? tiles?\b/i,
  /\b(penny|pennies|quarter|quarters|nickel|dime|cent|cents) (a|per|each) (point|hand|game)\b|\ba point\b[^.?!]{0,20}\b(worth|pay|penny|cent)\b|\bkitty\b|\bante\b/i,
  /\bdead\b[^.?!]{0,30}\b(pay|pays|paid|collect|collects|winner)\b|\b(pay|pays|paid|collect|collects|winner)\b[^.?!]{0,30}\bdead\b/i,
  /\brules? dispute\b|\bwho (decides|is right|has the final say)\b[^.?!]{0,30}\b(rule|rules|dispute|argument|call|table)\b/i,
];

const MAHJ_VOCAB =
  /\b(tiles?|hands?|discards?|discarded|discarding|walls?|card|charleston|jokers?|mahjong|mahj|maj|pungs?|kongs?|quints?|sextets?|expos\w*|melds?|racks?|deal|dealer|dealt|east|turns?|passing|win|wins|winning|won|bams?|craks?|dots?|winds?|dragons?|flowers?|soap|rules?|rule ?book|scoring|pays?|paid|payments?|dead|call|calls|called|calling|play|playing|players?|three[- ]handed|on the card|blanks?|pass|passes|redeal|suits?|points?|money)\b/i;
// Other games and pastimes that share vocabulary with mahjong.
const OTHER_GAMES =
  /\b(blackjack|poker|gin rummy|rummy|rummikub|hearts|spades|bridge|canasta|dominoes|dragon boat|scrabble|uno|pinochle|euchre|cribbage|solitaire|chess|checkers|backgammon|texas hold ?em|hold ?em|go fish|crazy eights|yahtzee|monopoly|bunco|bingo|okey|pai gow)\b/i;
const MAHJ_CORE = /\b(mahjong|mahj|maj|mah ?jongg?|charleston|pungs?|kongs?|quints?|sextets?|jokers?|bams?|craks?|dots?|soap|nmjl)\b/i;
// Charleston, South Carolina, and Charleston, West Virginia.
// "Which class covers exposures?", "Does MAHJ101 teach the charleston?", "do I need to know
// how to call tiles before joining open play": what a course covers, or what a player needs
// before booking one. A rules word here names the syllabus, not the question.
const COURSE_CONTENT =
  /\b(class|classes|course|courses|lessons?|workshop|mahj ?\d{3})\b[^.?!]{0,40}\b(cover|covers|teach|teaches|taught|deals? with|includes?|go(es)? over)\b|\b(is|are) (the |a |this |that |your )?(class|course|lessons?|workshop|mahj ?\d{3})\b[^.?!]{0,20}\babout\b|\b(cover|covers|teach|teaches|taught|includes?)\b[^.?!]{0,24}\b(class|classes|course|lessons?|workshop)\b|\bwhich (class|course|lesson|workshop)\b|\bdo i need to know\b[^.?!]{0,40}\b(before|to) (join|joining|book|booking|start|starting|attend|attending|sign|come|coming|take)\b/i;
const CHARLESTON_PLACE = /\bcharleston,? (sc|s\.c\.|south carolina|wv|west virginia)\b|\b(trip|vacation|visit|visiting|flights?|hotels?) [^.?!]{0,20}\bcharleston\b|\bcharleston\b[^.?!]{0,20}\b(trip|vacation|hotels?|flights?|weather)\b/i;
// Shopping and pricing: "where can I buy a set", "how much is the card at your shop".
const COMMERCE_VERB = /\b(buy|buying|purchase|purchasing|order(ed|ing)? (a|an|the|one|new|online|from|more)|shop for|for sale|in stock|carry|stock|sell|sells|selling|cost|costs|charging|charge for|price|prices|priced|discount|coupon|large print)\b|\$\s?\d/i;
const COMMERCE_OBJECT = /\b(set|sets|tiles|card|cards|rack|racks|mat|mats|case|bag|book|books|lessons?|class|classes|shop|store|amazon|large print|copy)\b/i;
const RULE_ASK_FORM = /\b(can|may|should|allowed|supposed|able) (i|we|you|she|he|they)\b[^.?!]{0,30}\b(call|pass|exchange|swap|declare|discard|expose|redeem|use|play|pick|draw|claim|win)\b/i;
// Strong signals that are only a tile or phase noun; beside a discovery cue they describe the
// search ("kids class near me, jokers and all"), not a rules question.
const NOUN_ONLY_SIGNALS = new Set<string>([
  String(/how many (players|people)/i),
  String(/\b(concealed|exposed|exposure)\b/i),
  String(/\b(expos(ed|ure|ures)|melds?)\b/i),
  String(/\b(etiquette|courtes(y|ies))\b/i),
  String(/\bdead hand\b/i), String(DEAD_THING),
  String(/\bpenalt(y|ies)\b/i),
  String(/\bhow long (do|does|can|before|until)\b[^.?!]{0,20}\b(call|claim)\b(?! ?back)/i),
  String(/\bjokers?\b/i), String(/(?<!(?:near|in|around|at|visiting|by|to|from)\s)\bcharleston\b/i), String(/\bdragons?\b(?!\s+boat)/i), String(/\bsoap\b(?!\s+opera)/i),
  String(/\bflowers?\b(?!\s+(mound|arrang\w*|shop|shops|show|girls?|power|garden|market|festival|delivery))/i), String(/\b(pungs?|kongs?|quints?|sextets?)\b/i), String(/\btile count\b/i), String(/\b152\b/),
  String(/\bthe wall\b(?!\s+street)/i), String(/\bwild tiles?\b/i), String(/\bmelds?\b|\b(quints?|sextets?)\b/i), String(/\bjoker swap\b/i), String(/(new|annual|yearly|current|next|this year'?s?)\s+cards?\b/i),
]);
const DIRECTORY_NOUNS =
  /\b(groups|games|clubs?|teachers?|instructors?|lessons?|classes|events|tournaments|venues?|studios?|meetups?|leagues|retreats|cruises|directory|listings?|website|near|nearby|zip|miles?|downtown|fourth|seat|spot|waitlist|reserve|reservation|show up|looking for|sign up|register|guests?|bring(ing)? (a )?(friend|guest)s?)\b/i;
const COMMERCE_RE =
  /\b(buy|buying|purchase|store|shop|for sale|price|prices|cost|costs|sell|sells|order|amazon|membership|fee|fees|sets? for|credit|debit|checkout)\b/i;

// "call ahead", "call the studio first": a phone call on either site, never a claim.
const CONTACT_EXTRA = /\bcall (ahead|first)\b|\bcall (them|the place|the studio|the venue|the shop|the store|the club|the teacher|the instructor)\b|\b(phone|ring|text) (them|the studio|the venue|the shop|the store|the club|ahead)\b/i;

// A one- or two-word fragment whose only mahjong word is a tile noun beside an unrelated word
// ("dragon boat", "flower arrangement") is not a rules question; "the wall", "dead hand", and
// "jokers?" still are.
const TILE_NOUN = /^(dragons?|flowers?|walls?|soap|winds?|bams?|craks?|dots?|jokers?|tiles?|cards?|pass|call|deal)$/i;
const STOPWORD = /^(the|a|an|my|your|our|their|his|her|its|this|that|these|those|of|in|on|at|to|for|and|or|about|with)$/i;
const QUESTION_FORM_RE = /\b(what|how|why|when|can|could|should|is|are|do|does|work|mean|which|who|may|must)\b/i;
function loneTileNounFragment(q: string): boolean {
  if (QUESTION_FORM_RE.test(q)) return false;
  const bare = q.toLowerCase().replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ").trim();
  const words = bare.split(" ").filter(Boolean);
  if (words.length < 2 || words.length > 3) return false;
  const vocab = words.filter((w) => MAHJ_VOCAB.test(w));
  const content = words.filter((w) => !STOPWORD.test(w) && !MAHJ_VOCAB.test(w));
  if (!(vocab.length === 1 && TILE_NOUN.test(vocab[0]) && content.length >= 1)) return false;
  // "joker swap", "wall game", "card colors" match a corpus pattern beyond the noun itself and
  // stay rules questions; "dragon boat" and "soap opera" match nothing but the tile word.
  const noun = vocab[0];
  for (const e of RULES_KNOWLEDGE) {
    for (const re of e.question_patterns) {
      const m = bare.match(new RegExp(re.source, re.flags.replace("g", "")));
      if (m && m[0].trim() !== noun) return false;
    }
  }
  return true;
}

// Discovery signals every site shares: a place, a ZIP, "near me", "find a", "any teachers". Case
// does not matter here ("Where can I play"); only the Title-Case city-and-state form below is
// case-sensitive, because "in la" is not a place.
export const SHARED_DISCOVERY_RE = /\bnear\b(?!\s+(the\s+)?(end|start|beginning|middle|close|finish|wall|last|final)\b)|\b\d{5}\b|\b(nearby|in my area)\b|\bwhere can i (play|find|go|buy|get)\b|\bfind (a|an|me)\b|\blooking for (a|an|some|any) (game|games|group|groups|teacher|teachers|lesson|lessons|class|classes|club|clubs|place|players?|partner|fourth|table|studio|instructor)\b|\bwant to (join|play with)\b|\bjust moved\b|\bwhere (do|can) (i|we) (sign up|register)\b|\bsign(ing)? up\b|\bregister\b|\blessons? (for|in|near|at)\b|\bclasses (for|in|near)\b|\b(?:any|find|know of) (?:a |an |some |any |good |beginner |kids )?(?:teachers?|instructors?|lessons?|classes|class|groups?|games?|clubs?|studios?|venues?)\b|\b(?:is|are) there (?:a |an |any |some )?(?:teachers?|instructors?|lessons?|classes|class|clubs?|studios?|venues?|groups?)\b|\b(?:is|are) there (?:a |an |any )?games? (?:going|tonight|today|this|near|in|at|on|tomorrow)\b/i;
export const PLACE_STATE_RE = /\b(in|near|around) [A-Z][a-z]+,? [A-Z]{2}\b|\b[Ww]ho teaches\b/;
const DIRECTORY_NOUN_PLACE_RAW =
  /\b([Gg]roups?|[Gg]ames?|[Cc]lubs?|[Tt]eachers?|[Ii]nstructors?|[Cc]lass(es)?|[Ll]essons?|[Ss]tudios?|[Vv]enues?|[Mm]eetups?|[Ll]eagues?|[Tt]ournaments?) (in|near|around|at) ([A-Z][a-z]+)/;
export function directoryNounPlace(q: string): boolean {
  const m = DIRECTORY_NOUN_PLACE_RAW.exec(q);
  return !!m && !STYLE_WORD.test(m[4]);
}

export type TopicHooks = {
  // Site-specific discovery: Find My Mahj passes its directory intent parser (days, times,
  // event types, teachers); Las Vegas Mahjong passes its studio and lessons vocabulary. The
  // hook receives whether a strong rules signal is present, so a site can discount a signal
  // that a rules question also carries ("Can I blind pass in a tournament?" is a rules
  // question, not a search for tournaments).
  discoverySignal?: (q: string, strongRules: boolean) => boolean;
};

export function hasStrongRulesSignal(q: string): boolean {
  return RULES_SIGNAL_RES.some((re) => re.test(q));
}

export function classifyTopic(raw: string, hooks: TopicHooks = {}): AskTopic {
  const q = prepare(raw);
  if (!q) return "other";
  // A request for card content is refused on every branch; it must never fall through to a
  // directory search or a local reply that could echo it.
  if (isCardContentRequest(q)) return "rules";
  // Blind Pass, Blind River, and Blind Bay are real places; the name alone must not read as
  // a rules question.
  if (blindReadsAsPlace(q)) {
    return classifyTopic(q.replace(/\bblind(\s+[A-Za-z]+)?\b/gi, ""), hooks);
  }

  // "wait for a call back about lessons" is a phone call, not a claim, and TAKE_BACK_RE is the
  // one signal that reads it as one. Any OTHER rules signal still wins.
  if ((CONTACT_SENSE.test(q) || CONTACT_EXTRA.test(q) || (TAKE_BACK_RE.test(q) && DIRECTORY_NOUNS.test(q))) && !MAHJ_ONLY_NOUN.test(q) && !RULES_SIGNAL_RES.some((re) => re !== TAKE_BACK_RE && re !== OWN_DISCARD && re.test(q))) {
    return "other";
  }
  if (loneTileNounFragment(q)) return "other";
  if (OTHER_GAMES.test(q) && (!MAHJ_CORE.test(q) || /\b(after|before|besides|instead of|other than|following) (mahjong|mahj|maj)\b/i.test(q))) return "other";
  if (CHARLESTON_PLACE.test(q)) return "other";
  if (COURSE_CONTENT.test(q)) return "other";
  if (COMMERCE_VERB.test(q) && COMMERCE_OBJECT.test(q) && !RULE_ASK_FORM.test(q) && !VARIANT_RE.test(q)) return "other";

  const questionForm = /\b(what|how|why|when|can|could|should|is|are|do|does|work|mean)\b/i.test(q);
  // The weak nouns (rules, rack, discard, deal) only signal a rules question when the sentence
  // actually asks something. "Any good deal on lessons in Naples" is commerce.
  const weakNouns = q.match(/\b(rules?|racks?|discard(s|ing)?|deal(t|ing)?|dealer)\b/gi) ?? [];
  const weakRulesNoun =
    weakNouns.length > 0 && !(/\b(the )?deal with\b/i.test(q) && weakNouns.every((w) => /^deal/i.test(w)));
  const plainContext =
    MAHJ_VOCAB.test(q) && !DIRECTORY_NOUNS.test(q) && !COMMERCE_RE.test(q) && !(CONTACT_SENSE.test(q) && !MAHJ_ONLY_NOUN.test(q)) && !placeAfterPrep(q);
  const conditional = CONDITIONAL_RULES_SIGNALS.some((re) => re.test(q)) && plainContext;
  // "riichi rules for pon" is a rules question even without a question word.
  const variantAsk = VARIANT_RE.test(q) && (questionForm || plainContext);
  const strongRules = RULES_SIGNAL_RES.some((re) => re.test(q)) || conditional;
  // "does the club have a house rule about bringing guests" is about the club.
  const rulesAsk = strongRules || (weakRulesNoun && questionForm && !DIRECTORY_NOUNS.test(q)) || variantAsk;
  if (!rulesAsk) return "other";

  const discoveryAsk = SHARED_DISCOVERY_RE.test(q) || PLACE_STATE_RE.test(q) || directoryNounPlace(q) || (hooks.discoverySignal?.(q, strongRules) ?? false);
  if (!discoveryAsk) return "rules";
  // A discovery question whose only rules signals are tile or phase nouns is a search.
  const matchedStrong = RULES_SIGNAL_RES.filter((re) => re.test(q));
  if (matchedStrong.length && matchedStrong.every((re) => NOUN_ONLY_SIGNALS.has(String(re))) && !conditional && !variantAsk) return "other";
  // A discovery question with only an everyday-word rules signal is a discovery question;
  // "do I need to call ahead for open play" is about the studio, not about declining a call.
  // A named mahjong style counts as strong: "where can I play riichi in Austin" stays mixed so
  // the style clarification is never silently dropped by a site that has no search.
  return RULES_SIGNAL_RES.some((re) => re.test(q)) || variantAsk ? "mixed" : "other";
}
