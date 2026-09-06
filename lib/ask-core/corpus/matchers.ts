// Concept matchers shared by every entry and by the topic classifier. Copied from Find My
// Mahj lib/rules/knowledge.ts at cb87d4c (the gate-hardened set), then exported in full so
// entries ported from Las Vegas Mahjong reuse the same concepts instead of restating them.
// Matchers describe ideas, not phrasings, so word order, punctuation, and paraphrase all
// resolve to the same concept. Proximity concepts are bounded to one clause.

// Concept matchers describe ideas, not phrasings, so word order, punctuation, and
// paraphrase all resolve to the same concept.
// "hands on lessons" and "second hand set" are directory phrases, not hands.
// "marked C" is the card's own label for a concealed hand.
export const HAND_CLOSED =
  /(?<!second[- ])\b(closed|concealed)\b[^.?!]{0,40}\bhands?\b(?![- ]on\b)|(?<!second[- ])\bhands?\b(?![- ]on\b)[^.?!]{0,40}\b(closed|concealed)\b|\b(marked|labeled|labelled|says) C\b|\bC hands?\b|\bhands? (has|with|marked|shows|showing) (a |an )?C\b(?! and X)|\bmarked (as )?C\b/i;
export const CLAIM_VERB = /\b(call|calls|called|calling|claim|claims|claiming|pick(ing)? up|takes? from the discard|take it|grab|take (the|that|this|a|her|his|their) (last |final |winning )?(tile|discard))\b/i;
export const BLIND = /\bblind(ly)?\b|\bwithout looking\b|\bshoved (them )?straight (on|through|along)\b|\bstraight (on|through|along) without\b/i;
export const PASS_VERB = /\bpass(es|ed|ing)?\b/i;
export const JOKER = /\bjokers?\b/i;
// Proximity concepts: the two words must sit within one clause of each other, so
// "legally blind, can she pass tiles" is not a blind pass and "what is a joker? my
// friend passed one" is still a joker definition.
export const BLIND_PASS = new RegExp(
  `(?:${BLIND.source})[^.?!,;]{0,30}${PASS_VERB.source}|${PASS_VERB.source}[^.?!,;]{0,30}(?:${BLIND.source})|\\bshoved (them )?straight (on|through|along)\\b|\\bstraight (on|through|along) without\\b`, "i");
export const JOKER_PASS = new RegExp(
  `${JOKER.source}[^.?!,;]{0,45}${PASS_VERB.source}(?!\\s+(for|as)\\b)|${PASS_VERB.source}(?!\\s+(for|as)\\b)[^.?!,;]{0,45}${JOKER.source}`, "i");
// Joker exchange from an exposure is allowed for any hand; that question belongs
// on the exchange answer, whatever verb the player uses.
export const EXCHANGE_VERB = "(exchange[sd]?|exchanging|redeem(s|ed|ing)?|swap(s|ped|ping)?|trad(e|es|ed|ing))";
// A joker somewhere in the message, before or after the phrase, even across a clause break
// (an elliptical follow-up carries its context term after the question mark).
const NEAR_JOKER = "(?:(?<=\\bjokers?\\b[\\s\\S]{0,120})|(?=[\\s\\S]{0,120}\\bjokers?\\b))";
export const JOKER_EXCHANGE = new RegExp(
  `\\b${EXCHANGE_VERB}\\b[^.?!,;]{0,30}\\bjokers?\\b|\\bjokers?\\b[^.?!,;]{0,30}\\b${EXCHANGE_VERB}\\b|\\b(take|took|takes|taking|get|pull|pulled|grab|grabbed|claim|reach(ed)? (over|in)|pick(ing)? up)\\b[^.?!,;]{0,20}\\bjokers?\\b[^.?!,;]{0,30}\\b(exposure|exposed|rack)\\b|\\b(grab|take|get|claim|pick up)\\b(?:(?!\\b(paid|pay|pays|money|points?)\\b)[^.?!,;]){0,12}\\b(the|that|this|a|her|his|their|someone's) jokers?\\b(?!\\s+(in|as|for)\\b)(?![^.?!,;]{0,30}\\b(discard\\w*|threw|thrown|tossed|throw(n|s)? (away|out)))|\\bhave\\b(?:(?!\\b(paid|pay|pays|money|points?)\\b)[^.?!,;]){0,12}\\b(her|his|their|someone's|another player'?s) jokers?\\b|\\bjokers?\\b[^.?!]{0,60}\\b(rack|exposure|exposed|kong|pung|quint|sextet)\\b[^.?!]{0,40}\\b(can|may|could|am i allowed to)\\b[^.?!]{0,12}\\b(grab|take|get|have|claim|swap|trade|exchange)\\b(?![^.?!,;]{0,16}\\b(in|as|for) (a|an|the) (pair|single|kong|pung|quint|sextet|news|year|run)\\b)|\\b(have|take|get|grab|claim)\\b[^.?!,;]{0,12}\\b(a|the|that|this|her|his|their) jokers?\\b[^.?!,;]{0,16}\\b(in|from|on|off|out of)\\b[^.?!,;]{0,12}\\b(her|his|their|someone'?s|another player'?s|that|the) (exposure|exposed|rack|kong|pung|quint|sextet|group)\\b|\\b(have|take|get|grab|claim)\\b[^.?!,;]{0,12}\\b(a|the|that|her|his|their) jokers?\\b[^.?!,;]{0,12}\\boff (her|his|their|someone'?s|the) rack\\b|\\b(have|take|get|grab|claim)\\b[^.?!,;]{0,12}\\b(the|that|her|his|their) jokers?\\b[^.?!,;]{0,8}\\bfor\\b[^.?!,;]{0,24}\\b(tiles?|craks?|bams?|dots?|real|matching|it stands for)\\b|\\b(trade|swap|exchange|redeem) (my|the|a) (real |own |actual |natural )?tile for (it|that|the joker|a joker|her joker|his joker|their joker)\\b|\\bput (the|a|my) (real|natural|actual) tile (in|down)\\b|\\b(take|get|have) (my|the|a) joker back\\b|\\btrade (it|a tile|that) (for|to get) (the|a|my) joker\\b|\\b(can|may) (we|i) (trade|swap|exchange)( it| tiles| for it)?\\b${NEAR_JOKER}|\\b(offered|offer|offering|want|wants|wanted) to (trade|swap|exchange)\\b${NEAR_JOKER}|\\btrade (it|a joker|her joker|the joker) (to|with) me\\b|\\b(gave|handed|give|hand|giving|handing) (her|him|them|someone|my neighbor|the player|[^.?!,;]{0,12}) [^.?!,;]{0,16}\\bfor (the|a|her|his|their|that) jokers?\\b`, "i");

export const MAHJONG_CUE =
  /\b(mah ?jong+|mahj|maj|win|wins|winning|won|go out|(last|final) tile (i|you|she|he|they|we) need|complete[sd]? (my|your|the|her|his) (hand|mahjong)|finish(es|ed)? (my|your|the|her|his) hand)\b/i;
export const EXPOSURE_CUE = /\b(expos(e|ed|es|ure|ures|ing)|pungs?|kongs?|quints?|sextets?|meld|build(ing)?|group)\b/i;
export const DISCARDED = /\b(discard|discards|discarded|discarding|thrown|throw|throws|threw|toss|tossed|put down)\b/i;
export const ERROR_CUE =
  /\b(error|mistake|mistakenly|wrong|wrongly|false|falsely|incorrect|invalid|not valid|isn'?t valid|didn'?t have|did not have|by accident|accidentally|premature|too early|oops|bad|botched|busted|penalt(y|ies)|one tile off|blurted|wasn'?t (actually |really )?(a )?mahjong|didn'?t (actually |really )?have (it|mahjong)|not (actually|really) (a )?mahjong|where i needed|pick it back up|one tile short|a tile short|don'?t (actually |really )?have (it|mahjong|a hand)|(doesn'?t|does not|didn'?t) match (the card|a hand|any hand))\b/i;
// A tile named by its name. Used where a narration names two different tiles: "said 3 crak
// and threw a 3 dot", "threw a 6 dot but called it 6 bam". The named groups must differ.
const TILE_NAME = "(?:(?:\\d|one|two|three|four|five|six|seven|eight|nine) ?(?:bams?|craks?|dots?)?|north|south|east|west|soap|(?:red|green|white)(?: dragon)?|dragons?|flowers?|jokers?|bams?|craks?|dots?)";
export const MISNAMED = new RegExp(
  String.raw`\bmis-?nam(e|ed|es|ing)\b|\bwrong name\b|\bnamed (it|the tile|a tile|my discard|the discard) wrong(ly)?\b|\bcalled it (the )?wrong\b|\bsaid the wrong tile\b|\bwrong tile name\b|\bnamed the wrong\b|\bmisspoke\b|\bcalled (it|the tile|my discard) (a|an) \w+ by mistake\b|\bannounced (it|the tile) (as )?the wrong\b|\bcalled it (a|an) [^.?!]{1,20} but (it was|it's|its|it is)\b|\bsaid (a |an |the )?${TILE_NAME}\b[^.?!]{0,8} but (it was|it's|it is)\b|\bnamed it (a|an) [^.?!]{1,20}\bbut\b|\b(called|named|said) it (a|an|the) ?[\w ]{1,14}\bbut (it was|it'?s|its|it is|threw|discarded|actually|(she|he|they) (threw|discarded|named|actually|really|had))\b|\bsaid [^.?!]{1,15} but (threw|discarded|put down|tossed|played)\b|\bcalled (a|an|the|my|it|that) [^.?!]{1,12} (a|an) [^.?!]{1,12} by (accident|mistake)\b|\bsaid (a|an)? ?[^.?!]{1,12} (when|but) (it|the tile) (was|is) (really |actually )?(a|an)\b` +
    `|\\b(?:said|announced|named) (?<said>${TILE_NAME})\\b[^.?!]{0,6}\\b(?:but|and) (?:then )?(?:threw|discarded|put down|tossed|played) (?:a |an |the )?(?!\\k<said>\\b)${TILE_NAME}\\b|\\b(?:threw|discarded|put down|tossed|played) (?:a |an |the )?(?<threw>${TILE_NAME})\\b[^.?!]{0,6}\\b(?:but|and) (?:called|named|said|announced) (?:it |the tile |the discard )?(?:a |an |the )?(?!\\k<threw>\\b)${TILE_NAME}\\b`,
  "i",
);
// "wait for a table" is the queue and "hold my tiles" is the rack, but "hold the tile"
// is exactly the claim this matcher is for, so the rack sense needs a possessive.
export const HOLD_WAIT =
  /\b(hold|wait)\b(?!\s+(for\s+)?((a |an |the |my |your |our |her |his |their )?(spot|seat|place|table|room|turn|bit|moment|while|second|minute)|(my |your |our |her |his |their )(tiles?|racks?|cards?|hand))|\s+(until|till|onto|on to)\b|\s+\d+\b(?!\s*(craks?|bams?|dots?|flowers?|dragons?|winds?|soap|jokers?)))/i;
export const TWO_PLAYERS = new RegExp(
  `\\b(both|two (players|people|of us)(?! ago| back| before)|more than one|same (tile|discard|one|\\d ?(bams?|craks?|dots?)|north|south|east|west|soap|flower|dragon)|at the same time|simultaneous(ly)?|who gets|who has priority|priority|first dibs)\\b|${HOLD_WAIT.source}`,
  "i",
);
export const TWO_PLAYERS_ASK = new RegExp(`${CLAIM_VERB.source}|\\b(want|wants|wanted|need|needs|declare|declares|mahjong|maj|tile|discard|mean|means|meaning|say|saying|said|shout|announce)\\b`, "i");
export const OWN_DISCARD =
  /\b(my own discard|own discard|my own throw|tile i (just )?(discarded|threw|put down)|discard i (just )?(made|threw)|call (it |that |the tile |my discard )?back\b(?=[^.?!]{0,24}\b(tile|discard)\b)|take back|take it back|i (just )?(discarded|threw) (it|a tile|the tile)|my discard\b(?=[^.?!]{0,30}\b(back|again|myself|my own|mahjong|maj)\b)|(call|claim|take|use|pick up)\b[^.?!,;]{0,12}\bmy own discard\b|what i (just )?(discarded|threw)|(discarded|threw|tossed|put down) my own|call (it|that|my tile|my discard) back(?=[^.?!]{0,30}\b(mahjong|mahj|maj|win|tile|discard)\b)|(threw|thrown|discard\w*|tossed|played|put down)\b[^.?!]{0,50}\b(get|take|have) (it|that|them) back|(get|take|have) (it|that|them) back\b[^.?!]{0,50}\b(threw|thrown|discard\w*|tossed))\b/i;
export const NAMING = /\b(name|names|naming|named|announce|announcing|call out|say (the|its|the tile'?s?) name|tile name|say same|saying same|say aloud|out loud|aloud|quiet|quietly|silent|silently|without (saying|naming|announcing|calling) (them|it|the tile|anything|the name)|say (them|it|anything|nothing)\b)\b/i;
export const TIMING =
  /\b(when|before|after|during|timing|turn|my turn|own turn|right away|immediately|as soon as|first|then|order)\b/i;
export const DEAD = /\bdead\b|\bkilled (her|his|their|my|the|your) hand\b/i;
export const DEAD_DETAIL =
  /\b(too many|too few|wrong number|how many|count|thirteen|fifteen|twelve|1[0-9]|expos(e|ed|ure|ures)|pay|pays|payment|who (can|may|gets to) (declare|call|say)|declare (my|your|his|her|their) own|self|myself|what makes|why|when|causes?|reasons?|say (i'?m|im|i am) dead|call myself dead|declare myself dead|does someone else (have|need) to)\b/i;
export const HAND_SIZE =
  /\b((should|do|must|can|am|are) (i|you|we) (supposed to )?(have|hold|be holding|keep) [^.?!]{0,20}\btiles?\b|how many tiles (should|do|must|can) (i|you|we) (have|hold|keep|be holding)|how many tiles (should|must) (be )?in (my|your|our) hand|tiles? in (my|your|our) hand|tiles? (should|must) (be )?in (my|your) hand|between turns|after (i|you) discard|during (my|your) turn|correct number of tiles|right number of tiles|count (my|your) tiles|i have (\d+|too many|too few|an extra|one too many|one less) tiles?(?!\s+sets?\b)|one short|short a tile|missing a tile|extra tile(?!\s+sets?\b))\b/i;
export const PICK_VERB = /\b(pick|picks|picked|picking|draw|draws|drew|drawing|take|takes|took|taking|grab)\b/i;
export const AHEAD = /\b(ahead|early|before (my|your|their|her|his) turn|out of turn|not (my|your|their) turn|too soon|in advance|before (she|he|they|someone) (has )?(discards?|discarded|throws?|thrown)|before (the )?(person|player|one) (before|ahead of|in front of|to my right|on my right) (me )?(has |had )?(discarded|threw|discards|throws)|(then|and) (someone|somebody|she|he|they) called|before (i|you) (even )?(looked|look) at (my|the) tile|while (she|he|they|someone) (is|are) (still )?(deciding|thinking|looking|discarding|choosing))\b/i;
export const ORDER = /\b(order of play|turn order|direction|which way|clockwise|counterclockwise|counter-clockwise|whose turn|who goes (next|first|after)|next player|after east|goes next|turns? (go|pass|move|rotate)|to the (right|left)|when (do|can|am) i (get to )?(pick|draw)|how (does|do) (a|my|the) turns? (work|go)|(pick|picking|draw|drawing|take)\b[^.?!]{0,24}\bbefore (i|you) discard|skip (my|your|a|the) turn|(discard|draw|pick)\\w*\\b[^.?!]{0,20}\\bevery turn|every turn\\b[^.?!]{0,20}\\b(discard|draw|pick))\b/i;
export const COURTESY = /\bcourtesy\b/i;
export const CHARLESTON_WORD = /(?<!(?:near|in|around|at|visiting|by|to|from)\s)\bcharleston\b/i;
export const STOP = /\b(stop|stops|stopped|stopping|end it(?! (was|is|turned|became))|ending|skip|skipped|skipping|decline|declined|refuse|refused|opt out|refuses|declines|skips|halt|halts|cancel|cancels|call off|say no|don'?t want to( do| play| pass)?|do not want to( do| play| pass)?|if (i|we) don'?t want|required|mandatory|optional|must (i|we) do|have to (do|play|pass)|must (we|i|you|everyone) (do|play|pass)|forced)\b/i;
export const AGREE_SECOND =
  /\b(agree|agrees|agreement|unanimous|everyone|all four|all 4)\b[^.?!]{0,30}\b(second|another|charleston)\b|\b(second|another) charleston\b[^.?!]{0,30}\b(agree|agrees|unanimous|everyone|all four|all 4)\b/i;
export const STOP_OR_AGREE = new RegExp(`${STOP.source}|${AGREE_SECOND.source}`, "i");
// Stopping the Charleston, including the vote framing ("one person wants a second round, does
// majority rule"). The stop entry requires it; the pass-sequence entry blocks it.
export const CHARLESTON_STOP_ASK = new RegExp(`${STOP_OR_AGREE.source}|\\bmajority\\b|\\b(want|wants|wanted) (a |another |the )?second (round|charleston)\\b`, "i");
export const PAYMENT =
  /\b(pay|pays|paid|paying|payment|payments|payout|score|scores|scoring|scored|points|value|worth|double|doubled|doubles|owe|owes|money|bet|bets|stakes|quarters|dollars|coins|chips|settle|settles|settlement|settlements|collect|collects|collected|jokerless|self[- ]?pick(ed)?|picked it (myself|yourself|herself|himself)|payouts|losses|winnings|ante|antes|kitty|dollar|a dollar|cents?|pennies|penny|nickels?|dimes?)\b|\$\s?\d+/i;
export const QUINT_SEXTET = /\b(quints?|sextets?|five of a kind|six of a kind|block of (5|6|five|six)|(5|6|five|six) (identical|of the same|of a kind))\b/i;
export const MIXED_GROUP =
  /\b(news|n ?e ?w ?s|runs?|sequences?|consecutive|straight|year|years|20[0-9]{2} hand|1 ?2 ?3|2 ?4 ?6|3 ?6 ?9|369|246|different tiles|mixed group|line of singles)\b/i;
// Scoring vocabulary only: "do I have to pay to play mahjong in Naples" is a directory question.
export const SCORING_ASK =
  /\b(who|how much) (pays|do (i|we|you) pay|does (everyone|each player|the discarder|the winner) pay)\b|\bpay(s|ing)? (the )?(winner|double|value|more|less|twice)\b|\bjokerless\b|\bpayout\b|\bself[- ]?pick(ed)?\b|\bdiscarder pays?\b|\b(pay|pays|paid|payment|payments|score|scoring|worth|value|double) (for|on|in|after|with|of) (a |the |my )?(wall game|self[- ]?pick|jokerless|win|winning|mahjong|maj|discard|hand)\b|\bhand (value|worth|is worth|pays)\b|\bvalue of (a |the |my )?hand\b|\b(win|wins|won) on a discard\b|\bworth double\b|\bdouble the value\b|\bscoring\b/i;
// A permission question about calling for mahjong on someone else's turn is calling-for-mahjong's
// rule (any player may call for mahjong), not a call made out of turn.
export const MAHJONG_ANY_TURN =
  /\b(mahjong|mahj|maj|win|winning)\b[^.?!]{0,50}\b(not|isn'?t|wasn'?t|is not|was not) (my|your|her|his|their|our) turn\b|\b(not|isn'?t|wasn'?t|is not|was not) (my|your|her|his|their|our) turn\b[^.?!]{0,50}\b(mahjong|mahj|maj|win|winning)\b/i;
// "call a discard to make an exposure": the permission to build one, not the timing of showing it.
export const MAKE_EXPOSURE = /\b(make|makes|making|build|builds|building|form|forms|forming|create|creating|start|starting|complete|completing) (an? |my |the |that )?(exposure|exposures|pung|kong|quint|sextet|group|meld)s?\b/i;
export const EXPOSURE_WORD = /\b(expos(e|ed|es|ure|ures|ing)|melds?|lay (it |them )?down|put (it |them )?down|put (it |them |a |the |my )?up|on top of (my|the|your) rack|face up)\b/i;
export const CARD_WORD = /\bcards?\b/i;
export const CX_LETTERS = /\bC and X\b|\bX and C\b|\bC or X\b|\bX or C\b|\b[CX] hands?\b|\bmarked [CX]\b/i;
export const NOTATION =
  /\b(colou?rs?|red|green|blue|black|notation|symbols?|letters?|abbreviations?|legend|key|mean|means|meaning|stand for|stands for|read (the|a|my) card|parenthes[ei]s|concealed|exposed|soap|zero|shown|misprint|never shown|printed)\b|\b[CX]\b|\b[FD] (is|=|means|stands for)\b|\bhow are (the )?(winds|dragons|flowers|jokers|soaps?) (shown|written|printed|marked|drawn)\b|\bplays? (the |as )?(0|zero)\b/i;
export const TOURNAMENT = /\btournaments?\b/i;
export const BLANK = /\bblanks?\b(?! (check|page|space|form))/i;
// Asking whether a CLAIM must be spoken, not asking how to name a discard.
export const SPOKEN_CLAIM =
  /\b(say|saying|announce|announcing|speak)\b[^.?!]{0,24}\b(call|calls|claim|claims|mahjong|maj|take it|it out loud)\b|\b(call|claim)\b[^.?!]{0,24}\b(out loud|aloud|verbally)\b|\breach in silently\b|\bwithout saying\b|\bsay anything\b[^.?!]{0,24}\b(call|claim|mahjong)\b/i;
export const DECLINE_CALL =
  /\b(have to|must|required|forced|need to|do i need to|obligated|supposed to)\b(?![^.?!]{0,25}\b(say|announce|speak)\b)(?![^.?!]{0,30}\b(from|off) the wall\b)(?![^.?!]{0,30}\bonce (i|you) (have )?(said|called)\b)[^.?!]{0,25}\b(call|take|claim|pick up)\b|\b(pass on|skip(?!\s+(my|your|a|the)\s+turn)|ignore|let it go|decline|don'?t want|do not want|not take|leave)\b[^.?!]{0,25}\b(discard|tile|it)\b/i;
export const OFFICIAL =
  /\b(official|who (makes|writes|sets|decides|publishes|runs)|where (do|does|are) the rules|which rules|rulebook|rule book|made easy|source of (the )?rules|governing body|authority|the league)\b/i;
export const STRATEGY =
  /\b(strategy|strategies|tips?|advice|best way|should i (pick|choose|play|keep|go for|aim for)|which hand should|what hand should|how do i (pick|choose|decide on) (a|my|which|what) hand|(pick|choose|decide) (which|what) hand|good hand to|what to (go for|play)|which hand to (go for|play|pick|choose))\b/i;
export const LAST_OF_WALL =
  /\b((?<!(?:my|your|her|his|their|own) )(last|final) (tile|discard|few tiles)|(cold|hot) wall|wall (runs|is|gets) (out|empty|gone|done|low|short|thin|down)|wall is (almost|nearly|about) (gone|empty|done|out)|wall gets (down )?to\b|last \d+ tiles|last (few|couple|handful of) tiles|run(s|ning)? out of tiles|no (more )?tiles? left|(only |just )?(two|three|four|five|a few|\d+) tiles? (left|remaining)|end of the (wall|game)|out of tiles|last (one|tile|few) (in|of|on) the wall|last discard of the (game|hand|round)|low wall|wall gets low)\b/i;

// "Blind Pass", "Blind River", and "Blind Bay" are real places. "Blind" reads as a
// place name when a location word introduces it, when a geographic suffix follows
// it in any casing, or when it is Title Cased inside something that is not a
// question. "to" and "at" are deliberately absent: "allowed to blind pass" is the
// natural verb form of the rule question.
export const BLIND_PLACE_PREP = /\b(near|nearby|around|from|where)\s+blind\b/i;
// "at", "by", and "visiting" are place prepositions only when the place is Title
// Cased: "at blind pass" in lowercase is the rules question ("look at blind pass tiles").
export const BLIND_PLACE_PREP_PROPER = /\b([Aa]t|[Bb]y|[Ii]n|[Vv]isiting)\s+Blind\s+(Pass|River|Bay)\b/;
export const BLIND_PLACE_SUFFIX =
  /\bblind\s+(pass|river|bay)\s+(road|rd|beach|key|keys|fl|florida|estero|sanibel|captiva|island|drive|dr|lane|blvd|park|game|games|group|groups|club|clubs|meetup|meetups|gang|crowd|ladies|girls|table)\b/i;
// Only "Blind Pass" is ambiguous between the rules term and a place; any other
// Title Cased "Blind <Name>" (Blind River, Blind Bay) is always a place.
export const BLIND_PROPER_OTHER = /\bBlind\s+(?!Pass(es|ed|ing)?\b)[A-Z][a-z]+/;
export const BLIND_PROPER_PASS = /\bBlind\s+Pass\b/;
export const QUESTION_FORM = /\b(can|could|may|do|does|is|are|should|when|how|what|why|allowed)\b/i;
export const BLIND_PLACE_CONTEXT = /\b(game|games|group|groups|club|clubs|meeting|meets|meetup|join|snowbird|tuesdays?|mondays?|wednesdays?|thursdays?|fridays?|saturdays?|sundays?|mornings?|evenings?|weekly|near|nearby|fl|florida)\b/i;
// The rule sense in the same message: "on the last right pass can I pass all 3 tiles blind".
export const BLIND_RULE_SENSE = /\bpass(es|ed|ing)?\b[^.?!]{0,20}\b(tiles?|3|three|all|one|two|2) blind\b|\b(tiles?|3|three|all|one|two|2) blind\b|\bblind pass(es|ed|ing)?\b[^.?!]{0,30}\b(allowed|ok|okay|legal|rule|rules|can|may|tiles?|look|peek)\b|\b(can|may|allowed to|do (i|we)|is it)\b[^.?!]{0,20}\bblind pass\b/i;
export function blindReadsAsPlace(question: string): boolean {
  return (
    (BLIND_PROPER_PASS.test(question) && BLIND_PLACE_CONTEXT.test(question) && !BLIND_RULE_SENSE.test(question)) ||
    BLIND_PLACE_PREP.test(question) ||
    BLIND_PLACE_PREP_PROPER.test(question) ||
    BLIND_PLACE_SUFFIX.test(question) ||
    BLIND_PROPER_OTHER.test(question) ||
    (BLIND_PROPER_PASS.test(question) && !QUESTION_FORM.test(question))
  );
}

// Seats only. A bare "only 3" means three tiles in a Charleston question, so a seat
// noun is required rather than a bare number.
export const THREE_PLAYER_SEATS =
  /\b(three|3)[- ](player|handed|person)\b|\b(three|3) (people|players|of us)\b|\bplay(s|ed|ing)? with (just )?(three|3)\b|\bonly (three|3) (of us|people|players)\b|\b(missing|without) a (fourth|4th)\b/i;
export const WRONG_COUNT =
  /\b(wrong number|wrong count|miscount\w*|too many tiles|too few tiles|(have|has|holding|had|counted|only got|left with|short|stuck with|ended up with) [^.?!]{0,10}12 tiles|(too many|an extra|one too many|ended up with|stuck with) [^.?!]{0,10}14 tiles|short a tile|missing a tile|extra tile(?!\s+sets?\b)|one too many|one too few|short one tile|(has|have|holding|had|got) (only |just )?12(?! tiles)(?!\s+(players?|people|tables?|of us|guests?|beginners?))\b|(11|12|15|16|17|18|19|20) tiles?\b[^.?!]{0,24}\bafter the (charleston|deal)\b|\bafter the (charleston|deal)\b[^.?!]{0,24}\b(11|12|15|16|17|18|19|20) tiles?\b|counted (12|14)\b|(?<!(?:dealer|east) (?:took|has|had|got|gets|takes|get|take) )(12|14) and (i|we|she|he|they)\b|(?<!east )(?<!dealer )(?<!(?:should|must|can|could|do|does|am) (?:i|we|you) )(has|have|holding|had|got|realized (she|he) has) [^.?!]{0,10}14 tiles|(12|14) (tiles )?between turns)\b/i;
// Turning a tile down. "do I have to say anything if I do not want it" is a question
// about declining, not about how a claim is spoken.
export const DECLINE_CUE =
  /\b(do ?n[o']?t want|do not want|dont want|not want|pass on|passing on|passed on|skip|skipping|ignore|decline|declining|let it go|leave it|not take|do ?n[o']?t need|do not need)\b/i;
// Holding your hand while someone checks a mahjong. HOLD_WAIT deliberately excludes the
// rack sense, so this needs naming outright or it reaches nothing.
export const HOLD_FOR_CHECK =
  /\b(hold|keep)\b[^.?!]{0,24}\b(hand|hands|tiles)\b[^.?!]{0,30}\b(mahjong|maj|call|called|check|checked|verified)\b/i;
// Asking where to play is not asking how to deal.
export const DIRECTORY_ASK =
  /\b(where|near|nearby|find|looking for|join|club|clubs|group|groups|venue|venues|teacher|teachers|lesson|lessons|class|classes|learn)\b/i;
// Nouns that name a different rule. If one is present, the question is about that, not
// about three-handed play, however many people are in the room.
export const OTHER_TOPIC =
  /\b(jokers?|pairs?|soap|dragons?|flowers?|bams?|craks?|dots?|winds?(?! gap)|quints?|sextets?|kongs?|pungs?|blanks?|exposures?|in a set|in the box|wall game|wall ran out|ran out|dead hand|mahjong in error|misnam\w+|redeem\w*|card)\b/i;
// East is DEALT the extra tile; that is the deal, not a count that has gone wrong.
export const DEALER_EXTRA =
  /\b(dealer|east)\b[^.?!]{0,24}\bextra tile\b|\bextra tile\b[^.?!]{0,24}\b(dealer|east)\b/i;
export const WRONG_TILE_GIVEN = new RegExp(
  String.raw`\b(wrong|incorrect) tile\b|\b(gave|handed|put|swapped|traded|exchanged|returned)\b[^.?!]{0,80}\bwrong\b` +
    // "handed her a 4 dot for the joker in her 4 bam pung": the same number in another suit.
    String.raw`|\b(gave|handed|put|swapped|traded|exchanged|offered) [^.?!]{0,16}\b(?<num>\d) (?<suit>bam|crak|dot)s?\b[^.?!]{0,40}\bjokers?\b[^.?!]{0,60}\b\k<num> (?!\k<suit>s?\b)(?:bam|crak|dot)s?\b`,
  "i",
);
export const EXCHANGE_CONTEXT =
  /\b(exchang\w+|redeem\w*|swap\w*|trad(e|ed|ing)|for (my|the|a|his|her) joker|took (my|the|her|his) joker|gave me)\b/i;
// Words that can only mean mahjong. Everyday words the game also uses (call, hand,
// deal, play, pass, wait) are deliberately absent: those are exactly what makes a
// contact question look like a claim, so they cannot be what rescues one.
export const MAHJ_ONLY_NOUN =
  /\b(tiles?|discards?|discarded|discarding|jokers?|mahjong|mahj|maj|charleston|pungs?|kongs?|quints?|sextets?|exposures?|expos(e|es|ed|ing)|melds?|racks?|walls?|threw|thrown|throw(s|ing)?|bams?|craks?|dots?|dragons?|flowers?|soap|blanks?|card|redeal)\b/i;
export const CONTACT_SENSE =
  /\bcall\s+(back|the\s+(teacher|instructor|studio|venue|club|shop|store|number|office))\b|\bcall\s+ahead\s+(to|and)\b|\b(phone call|voicemail|call\s+(me|you|us|them)\s+back)\b|\bemail\s+(me|us|you|them|the\s+(teacher|instructor|studio|venue|club|shop|store|office))\b/i;
export const HOLD_WAIT_ASK =
  /\b(call|calls|called|claim|claims|count|counts|mean|means|legal|legally|stop|stops|priority|say|says|saying|said|shout|shouted|allowed|same as|instead of)\b/i;
export const SETTLEMENT =
  /\b(pay|pays|paid|paying|payment|payments|settle|settles|settled|settlement|owe|owes|collect|collects|value|double|throw(n)? in|threw in|toss(ed)? in)\b/i;
export const SETTLEMENT_OR_HOLD = new RegExp(`${SETTLEMENT.source}|${HOLD_FOR_CHECK.source}`, "i");
// Only the deal's final discard, never the most recent one: "her last discard finishes my
// pung" is an ordinary calling question and must not reach the end-of-wall answer.
export const FINAL_DISCARD_SCENE =
  /\b(cold|hot) wall\b|(?<!(?:my|your|her|his|their|own) )\b(last|final) (discard|tile)\b(?=[^.?!]{0,40}\b(wall|deal|game|end|empty|left)\b)|\b(wall|deal|game|end|empty)\b[^.?!]{0,40}(?<!(?:my|your|her|his|their|own) )\b(last|final) (discard|tile)\b|\bwall gets (down )?to\b|\blast \d+ tiles\b|\blast (few|couple|handful of) tiles\b|\bwall is (almost|nearly|about) (gone|empty|done|out)\b|\bwall is (empty|gone|out|used up)\b|\bwall runs out\b|\bno tiles left\b|\b(only |just )?(two|three|four|five|a few|\d+) tiles? (left|remaining)\b|\bout of tiles\b|\bend of the wall\b|\bnothing left to draw\b|\blast discard of the (game|hand|round)\b|\b(very )?last (one|tile) in the wall\b|\bwall (gets|is|runs) low\b/i;

// East is dealt 14; "the dealer took 14 and we took 13" is the deal, not a count gone wrong.
export const DEALER_COUNT = /\b(dealer|east) (took|takes|gets|got|has|had|get|take|starts? with|holds?) (13|14|fourteen|thirteen)\b/i;
// A discard made without drawing first. No entry states the settlement for it; the turn-order
// and payment entries stand down so the player is asked for the topic instead.
export const SKIPPED_DRAW = /\bforgot to (pick|draw)\b|\bwithout (picking|drawing)\b|\bdidn'?t (pick|draw)\b[^.?!]{0,24}\b(threw|discarded|tossed|put down)\b/i;
// Which dragon belongs to which suit: the dragons entry's question wherever it appears.
export const DRAGON_SUIT_ASK =
  /\bwhich dragon\b|\bdragon (matches|goes with|belongs)\b|\bred goes with\b|\b(red|green|white) dragons?\b[^.?!]{0,30}\b(goes|go|belongs?|matches|match) with\b|\bwhich (dragon|suit) (matches|goes)\b|\bwhich suit\b[^.?!]{0,20}\bdragons?\b/i;
// An accident at the table: a tile knocked off or turned up, a wall spilled, a reshuffle.
// No entry covers it, so an entry reached on a noun alone must not answer it.
// A joker that left a hand as a discard. The exposure and calling entries stand down here:
// a thrown joker is joker-discarded's rule, not a mistake in your own exposure.
export const DISCARDED_JOKER_SCENE =
  /\b(threw|thrown|throw|throws|discard|discards|discarded|discarding|toss|tossed|put down)\s+(a |an |the |her |his |their |my |someone'?s |out |away |down )*jokers?\b|\bdiscarded jokers?\b|\bjokers?\b[^.?!,;]{0,16}\b(was|were|got|is|are) (thrown|discarded|tossed)\b/i;
// A hand dealt complete, before anyone discards: no entry states whether East may declare on it.
export const DEALT_HAND_SCENE =
  /\b(on|with|from|off) the deal\b|\bdealt (a |the )?(complete|winning|mahjong)\b|\bbefore (east|the dealer)'?s? (first )?(discards?|discarding|throws?)\b|\bbefore the first discard\b|\bbefore anyone (has )?discard(s|ed)?\b|\bdeclare mahjong (on|with) (the deal|14 tiles|her 14|his 14)\b/i;
// A third party claiming the tile, not the discarder taking it back.
export const OTHER_CLAIMER =
  /\bwho (can|may|could|is allowed to|gets to)\b[^.?!,;]{0,20}\b(call|calls|claim|claims|take|takes|get|gets|have)\b|\b(the )?(person|player|lady|guy|one|players)\b[^.?!,;]{0,24}\b(across|next|beside|opposite|to my (right|left)|three other|other)\b|\ball three other\b|\b(another|other|next|someone else|anyone else|the other|any other|somebody else|anyone|anybody)\s+(player|person|one|lady|guy)?\b[^.?!,;]{0,16}\b(call|calls|called|calling|claim|claims|claimed|take|takes|took|get|gets)\b|\b(she|he|they)\s+(called|claimed|took|takes|calls|claims)\b[^.?!,;]{0,16}\b(it|the tile|my discard|that tile)\b/i;
// Peeking at tiles that are not yours: the etiquette rule, never the pass rule.
export const OTHERS_TILES =
  /\b(another|other|someone|somebody|neighbou?r|opponent|partner|everyone else|anyone else)(?:'s|s')?\s+(?:(?:player|person|lady|guy)(?:'s|s')?\s+)?(tiles?|hand|hands|rack)\b|\b(her|his|their)\s+(tiles?|hand|rack)\b/i;
// The wall ran out with nobody winning: a payment question there is the wall-game entries'.
export const NO_WINNER_SCENE =
  /\bwall games?\b|\bwall (ran|runs|is|was|has run) (out|empty|dry)\b|\b(nobody|no one|noone|none of us) (won|wins|went out|goes out|has mahjong|got mahjong|declared mahjong)\b|\bno winner\b/i;

export const ACCIDENT_SCENE =
  /\b(knocked|fell|dropped|landed|slipped|spilled|tipped)\b[^.?!]{0,24}\b(off|over|out|on the floor|face[- ]up)\b|\breshuffle\b|\bre-?wall\b|\brebuild (the )?walls?\b/i;

// Shared by the route, the Ask box, and the clarification engine so they cannot drift.
export const VARIANT_RE =
  /\b(riichi|japanese|chinese|hong ?kong|cantonese|sichuan|taiwanese|korean|filipino|singapor(e|ean)|mcr|zung ?jung|wright[- ]?patterson|siamese)\b/i;
export const AMERICAN_RE = /\b(american|nmjl|national (mah ?jongg?|mahjong) league)\b/i;
// A capitalized style word after a preposition ("in American mahjong", "in Chinese") is not a place.
export const STYLE_WORD =
  /\b(american|nmjl|riichi|japanese|chinese|hong ?kong|cantonese|sichuan|taiwanese|korean|filipino|singapor(e|ean)|mcr|zung ?jung|wright[- ]?patterson|siamese|mahjong|mah ?jongg?|charleston|league)\b/i;
export const PLACE_AFTER_PREP_RAW = /\b(in|near|around|at|to) [A-Z][a-z]+/;
export function placeAfterPrep(q: string): boolean {
  const m = PLACE_AFTER_PREP_RAW.exec(q);
  return !!m && !STYLE_WORD.test(m[0]);
}

// Concept matchers the shared Ask box may treat as rules signals on their own: each one
// names a mahjong-only idea, so a directory question cannot trip it.
// A dead hand, tile or joker. Exported so the topic classifier can recognise it as a tile or
// phase noun beside a discovery cue ("a teacher who explains dead hands" is a search).
export const DEAD_THING = new RegExp(`(?:${DEAD.source})[^.?!]{0,20}\\b(hand|hands|tiles?|jokers?)\\b|\\b(hand|hands)\\b[^.?!]{0,20}(?:${DEAD.source})`, "i");

export const RULES_TOPIC_SIGNALS: RegExp[] = [
  OWN_DISCARD,
  QUINT_SEXTET,
  // The bare verb forms (expose, exposes, exposing) are conditional: "expose my kids to
  // mahjong lessons in Boca" is a directory question.
  /\b(expos(ed|ure|ures)|melds?)\b/i,
  JOKER_EXCHANGE,
  AGREE_SECOND,
  CX_LETTERS,
  DEAD_THING,
  SCORING_ASK,
  new RegExp(`${NAMING.source}[^.?!]{0,30}${DISCARDED.source}|${DISCARDED.source}[^.?!]{0,30}${NAMING.source}|\\bsay same\\b`, "i"),
];

// Matchers built from everyday words (tips, direction, authority, out of, don't want). They
// count as rules signals only when the sentence also carries mahjong vocabulary and no
// directory or commerce wording; otherwise "any tips for finding a game in Naples" would be
// answered with hand strategy instead of a search.
export const RULES_TOPIC_SIGNALS_CONDITIONAL: RegExp[] = [
  /\b(expose|exposes|exposing)\b/i,
  MISNAMED,
  SPOKEN_CLAIM,
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
  new RegExp(`(?:${TWO_PLAYERS.source})[^.?!]{0,30}\\b(tile|discard|call|calls|mahjong|maj)\\b|\\b(tile|discard)\\b[^.?!]{0,30}(?:${TWO_PLAYERS.source})`, "i"),
];
