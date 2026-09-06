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
  RULES_TOPIC_SIGNALS_CONDITIONAL,
  VARIANT_RE,
  CONTACT_SENSE,
  MAHJ_ONLY_NOUN,
  HOLD_WAIT,
  placeAfterPrep,
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
  /\bdragons?\b/i,
  /\bsoap\b/i,
  // "Flower Mound" is a Texas city, not a tile question.
  /\bflowers?\b(?!\s+mound)/i,
  /\b(pungs?|kongs?|quints?|sextets?)\b/i,
  /\bjokers?\b.{0,60}\bpairs?\b|\bpairs?\b.{0,60}\bjokers?\b/i,
  /how many (tiles|players|people|suits|flowers|jokers|winds|dragons)/i,
  /\btile count\b/i,
  /\b152\b/,
  /\b(concealed|exposed|exposure)\b/i,
  /\bopen hands?\b/i,
  HAND_CLOSED,
  /\b(call|calling|claim)\b.{0,20}\bdiscards?\b/i,
  /\bwall game\b/i,
  /\bthe wall\b/i,
  /\bdead hand\b/i,
  /\b(nmjl|national (mah ?jongg?|mahjong) league)\b/i,
  /\b(etiquette|courtes(y|ies))\b/i,
  /(new|annual|yearly|current|next|this year'?s?)\s+card\b/i,
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
  /\b(can|may|do|should|must) (i|we|you) (have to |need to )?pass[?!. ]*$/i,
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
  /\bjoker[- ]?free\b|\bjokerless\b|\btable talk\b|\blike number\b/i,
  /\b(last|previous|old|older|prior) year'?s? card\b/i,
  /\b(look|looking|peek|peeking|see|check|checking)\b[^.?!]{0,30}\bbefore (i|you|we|they|the|a) pass\w*\b|\b(look|looking|peek|peeking)\b[^.?!]{0,30}\bbefore passing\b/i,
  /\bdead player\b|\bconsecutive numbers?\b/i,
  /\b(valid|legal|legit|real|proper|legitimate|genuine) (mahjong|mahj|maj)\b/i,
  /\b(went|go|going|goes|got|get|getting) (mahjong|mahj|maj)\b|\b(mahjong|mahj|maj) to count\b|\b(nobody|no one|noone) (goes|went) out\b/i,
  /\bcard\b[^.?!]{0,12}\b(19|20)\d\d\b|\b(19|20)\d\d\b[^.?!]{0,12}\bcard\b/i,
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
  /\b(north|south|east|west) winds?\b|\b(four|4|the) winds\b|\bwinds? tiles?\b/i,
  /\b(penny|pennies|quarter|quarters|nickel|dime|cent|cents) (a|per|each) (point|hand|game)\b|\ba point\b[^.?!]{0,20}\b(worth|pay|penny|cent)\b|\bkitty\b|\bante\b/i,
  /\bdead\b[^.?!]{0,30}\b(pay|pays|paid|collect|collects|winner)\b|\b(pay|pays|paid|collect|collects|winner)\b[^.?!]{0,30}\bdead\b/i,
  /\brules? dispute\b|\bwho (decides|is right|has the final say)\b[^.?!]{0,30}\b(rule|rules|dispute|argument|call|table)\b/i,
];

const MAHJ_VOCAB =
  /\b(tiles?|hands?|discards?|discarded|discarding|walls?|card|charleston|jokers?|mahjong|mahj|maj|pungs?|kongs?|quints?|sextets?|expos\w*|melds?|racks?|deal|dealer|dealt|east|turns?|passing|win|wins|winning|won|bams?|craks?|dots?|winds?|dragons?|flowers?|soap|rules?|rule ?book|scoring|pays?|paid|payments?|dead|call|calls|called|calling|play|playing|players?|three[- ]handed|on the card|blanks?|pass|passes|redeal|suits?)\b/i;
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

// Discovery signals every site shares: a place, a ZIP, "near me", "find a".
export const SHARED_DISCOVERY_RE = /\bnear\b|\b\d{5}\b|\b(nearby|in my area)\b|\bwhere can i (play|find|go)\b|\bfind (a|an|me)\b/i;

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
  if ((CONTACT_SENSE.test(q) || CONTACT_EXTRA.test(q)) && !MAHJ_ONLY_NOUN.test(q) && !RULES_SIGNAL_RES.some((re) => re !== TAKE_BACK_RE && re.test(q))) {
    return "other";
  }
  if (loneTileNounFragment(q)) return "other";

  const questionForm = /\b(what|how|why|when|can|could|should|is|are|do|does|work|mean)\b/i.test(q);
  // The weak nouns (rules, rack, discard, deal) only signal a rules question when the sentence
  // actually asks something. "Any good deal on lessons in Naples" is commerce.
  const weakRulesNoun = /\b(rules?|racks?|discard(s|ing)?|deal(t|ing)?|dealer)\b/i.test(q);
  const plainContext =
    MAHJ_VOCAB.test(q) && !DIRECTORY_NOUNS.test(q) && !COMMERCE_RE.test(q) && !(CONTACT_SENSE.test(q) && !MAHJ_ONLY_NOUN.test(q)) && !placeAfterPrep(q);
  const conditional = CONDITIONAL_RULES_SIGNALS.some((re) => re.test(q)) && plainContext;
  // "riichi rules for pon" is a rules question even without a question word.
  const variantAsk = VARIANT_RE.test(q) && (questionForm || plainContext);
  const strongRules = RULES_SIGNAL_RES.some((re) => re.test(q)) || conditional;
  // "does the club have a house rule about bringing guests" is about the club.
  const rulesAsk = strongRules || (weakRulesNoun && questionForm && !DIRECTORY_NOUNS.test(q)) || variantAsk;
  if (!rulesAsk) return "other";

  const discoveryAsk = SHARED_DISCOVERY_RE.test(q) || (hooks.discoverySignal?.(q, strongRules) ?? false);
  if (!discoveryAsk) return "rules";
  // A discovery question with only an everyday-word rules signal is a discovery question;
  // "do I need to call ahead for open play" is about the studio, not about declining a call.
  // A named mahjong style counts as strong: "where can I play riichi in Austin" stays mixed so
  // the style clarification is never silently dropped by a site that has no search.
  return RULES_SIGNAL_RES.some((re) => re.test(q)) || variantAsk ? "mixed" : "other";
}
