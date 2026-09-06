// Guards that run before any retrieval, so no phrasing can pull card content out of the
// corpus, plus the small conversational cases that are not rules questions at all.

import { CURRENT_CARD_YEAR } from "../corpus/entries.ts";
import { mentionedYear } from "./normalize.ts";

// A card-content request asks the assistant to reproduce, list, summarize, translate, or verify
// what is printed on the annual card: its hands, lines, sections, categories, or line values.
// A question about what a printed color, letter, symbol, or number MEANS, or a rule that
// happens to mention the card, is answered from the corpus. Union of both sites' matchers,
// rewritten after the held-out set showed the old "hands ... card" proximity rule refusing
// legitimate notation questions and missing reworded content requests.
const CONTENT_VERB =
  /\b(list|lists|listing|show|shows|send|sends|give|gives|read|reads|tell|tells|type|types|copy|copies|print|prints|paste|pastes|summari[sz]e|summary|translate|translates|spell|write (out|down|up)|output|dump|recite|go through|goes through|walk (me|us) through|share|shares|post|text|scan|photo|photograph|screenshot|verbatim|word for word|reproduce|quote|dictate|enumerate|repeat|append|attach|tabulate|jot (them|the hands|the lines) down|write (them|the hands|the lines) down|put [^.?!]{0,10}(in|into) a (table|list|spreadsheet|grid|chart))\b/i;
const CARD_THING = /\b(cards?|hands?|lines?|categor(y|ies)|sections?|hand list|line values?)\b/i;
const SECTION_NAME =
  /\b(13579|2468|369|consecutive run|any like numbers?|winds? (and |& |-)?dragons?|quints?|singles? (and |& |-)?pairs?|year|lucky|addition|multiplication|13\s?579|2\s?468)\b/i;
const SPECIFIC_HAND =
  /\b(top|first|second|third|fourth|fifth|last|bottom|\d+(st|nd|rd|th)) (hand|line)\b|\b(sections?|categor(y|ies))\b|\b(quints?|singles? (and |& )?pairs?|13579|2468|369|consecutive run|any like numbers?|winds? (and |& )?dragons?|news|year|\d{4}) (hands?|lines?|section)\b/i;
const HAND_PATTERN = /\b(FF+|F+ ?\d{3,}|\d{3,} ?\d{2,}|NEWS|\d{4} ?\d{4}|DDDD|\d+ [1-9]{3}|(dragons?|flowers?) [^.?!]{0,8}(dragons?|flowers?))\b|\b(13579|2468|369|\d{4})\b(?=[^.?!]{0,25}\b(still )?(on|in) (the|this year'?s?|the \d{4}|the new|the current) card\b)/;
// Teaching verbs. "Explain dead hands" is a lesson; "explain the 2468 section" is the card.
// They only make a content request beside the card itself, a named section, or a year.
const TEACHING_VERB = /\b(explain|explains|explaining|explained|describe|describes|describing|described)\b/i;
// A quantifier over the hands, or a question about which hands exist, is a request for the
// list however it is framed. "explain every hand" is not teaching; "explain dead hands" is.
const ALL_HANDS =
  /\b(all|every|each|the whole|the entire|the full|the complete)\s+(of\s+)?(the\s+)?(hands?|lines?|categor(y|ies)|sections?)\b|\bhands? (list|on it)\b|\bwhat hands (are|were|do|does)\b|\bwhich hands (are|were)\b/i;
const CARD_ANCHOR = /\bcards?\b|\b(19|20)\d{2}\b/i;

export const CARD_CONTENT_RES: RegExp[] = [
  new RegExp(`(?:${TEACHING_VERB.source})[^.?!]{0,40}(?:${SECTION_NAME.source})|(?:${SECTION_NAME.source})[^.?!]{0,40}(?:${TEACHING_VERB.source})`, "i"),
  new RegExp(`(?:${TEACHING_VERB.source})[^.?!]{0,40}(?:${ALL_HANDS.source})|(?:${ALL_HANDS.source})[^.?!]{0,40}(?:${TEACHING_VERB.source})`, "i"),
  // Reproduce or summarize: a content verb near the card, its hands, lines, or a section.
  new RegExp(`${CONTENT_VERB.source}[^.?!]{0,60}${CARD_THING.source}|${CARD_THING.source}[^.?!]{0,60}${CONTENT_VERB.source}`, "i"),
  new RegExp(`${CONTENT_VERB.source}[^.?!]{0,40}${SECTION_NAME.source}[^.?!]{0,20}\\b(section|hands?|lines?|part)\\b|${SECTION_NAME.source}[^.?!]{0,20}\\b(section|hands?|lines?|part)\\b[^.?!]{0,40}${CONTENT_VERB.source}`, "i"),
  // Which hands are on the card, what is on the card.
  /\b(what|which|how many)('s| is| are| were| was| do| does)? (the |all the |all |this year'?s? )?(hands?|lines?|categor(y|ies)|sections?)\b[^.?!]{0,40}\b(on|in|for|from) (the|this|the current|the new|the \d{4}|this year'?s?|last year'?s?|next year'?s?|your|a) (\w+ )?card\b/i,
  /\bwhat (are|were) the (hands|lines)\b[^?!]{0,60}\bcard\b|\bcard\b[^?!]{0,60}\bwhat (are|were) the (hands|lines)\b/i,
  /\bhands (off|from) the card\b|\b(add|attach|append|include) the (card|hands)\b|\bput [^.?!]{0,10}(in|into) a (table|list|spreadsheet)\b/i,
  /\b(what|which)('s| is| are| were| do)? (the |all the )?(hands?|lines?)\b[^.?!]{0,30}\b(in|on|under|from|of) (the )?(\w+ )?section\b/i,
  /what('s| is| are) (on|in) (the|this year'?s?|the current|the new|the \d{4}|your) card/i,
  /\bhands? (on|for|from|in) (this|the|last|next|the current|the \d{4}) year\b/i,
  /\b(card hands?|hand list|hands? list|list of hands)\b/i,
  /\b(\d{4}|this year'?s?|current|new) card\b[^.?!]{0,30}\b(hands?|lines?|categor(y|ies)|sections?)\b/i,
  // Verify a specific hand or line against the card.
  new RegExp(`(?:${HAND_PATTERN.source})[^.?!]{0,40}\\b(on|in) (the|this|this year'?s?|the \\d{4}|the new|the current) card\\b|\\b(is|are) (that|this|it|the|my) (hand|line)s? (still |even )?(on|in) (the|this|this year'?s?|the \\d{4}|the new|the current) card\\b`, "i"),
  // The value of a specific hand or section.
  new RegExp(`\\b(how (much|many)|what)\\b[^.?!]{0,10}\\b(points?|values?)\\b[^.?!]{0,40}(?:${SPECIFIC_HAND.source})|\\b(how (much|many)|what)\\b[^.?!]{0,40}(?:${SPECIFIC_HAND.source})[^.?!]{0,30}\\b(worth|points?|values?|pay|pays)\\b`, "i"),
  // "just the first line under 2468", "one hand at a time".
  /\b(first|second|third|last|\d+(st|nd|rd|th)) (line|hand)s?\b[^.?!]{0,30}\b(under|in|of|from|on) (the |this |this year'?s )?(\d{4}|13579|2468|369|quints?|singles|winds|consecutive|any like|year|section|card)\b|\b(just|only) (the )?(first|one|a few|top|last|next) (line|hand)s?\b|\bone hand at a time\b/i,
  // Is a given hand on the card.
  /\b(is|are) there (a|an|any|still a) [^.?!]{0,30}\b(hands?|lines?)\b[^.?!]{0,20}\b(on|in) (the|this|the \d{4}|this year'?s?|the new|the current) card\b/i,
  // A copy of the card.
  /\bcards?\b[^.?!]{0,25}\b(pdf|copy|image|photo|scan|picture|download|screenshot)\b/i,
  /\b(pdf|copy|image|photo|scan|picture|download|screenshot)\b[^.?!]{0,25}\bcards?\b/i,
];

// Learning to read the card, asking what a notation means, or asking a rule about the card
// in general is not a content request.
const READ_SKILL = /\b(how to|learn(ing)? to|teach(es|ing)? (me|us|you|how)|class(es)? on|lessons? on|help (me |us )?(understand|read|with)|understand(ing)? how to)\b[^.?!]{0,20}\bread(ing)? (the|a|my|this|your|the new|the \d{4}) card\b/i;
const NOTATION_ASK =
  /\b(colou?rs?|notation|symbols?|letters?|abbreviations?|legend|mean|means|meaning|stand for|stands for|represent|parenthes[ei]s)\b|\b[CX]\b|\bprinted in (green|red|blue|black)\b|\b(green|red|blue|black) (always )?(mean|means)\b|\b(four|five|three|two) \ds\b|\bis that (four|five|three|two|\d+)\b|\b(dollars|cents|pennies) or (points|dollars|cents)\b|\bpoints or (dollars|cents|pennies)\b|\bsoap\b[^.?!]{0,20}\bzero\b|\bzero\b[^.?!]{0,20}\bsoap\b/i;

// "what is the value of a joker-free hand" asks about the payment structure, which the corpus
// answers; "how many points is the quints hand worth" asks for a line value from the card,
// which it refuses. The payment vocabulary, absent any card-section word, tells them apart.
const PAYMENT_EXEMPT = /\b(joker[- ]?free|jokerless|self[- ]?(pick|picked|draw|drawn)|discarder|who pays|pays? (double|the winner|more|less)|worth double|double the value|wall game)\b/i;

// A credit card, a gift card, or hands-on lessons have nothing to do with the League card.
const NOT_THE_CARD = /\b(credit|debit|gift|business|membership|library|greeting|birthday|id) cards?\b|\bcard (reader|machine|payment|on file)\b|\bhands?-on\b|\bhands? on (lessons?|class|classes|instruction|training|help|experience|approach|learning)\b/i;

// "the card shows 25 next to the hand", "the card key lists pair pung kong": a statement about
// the card that leads into a rules question.
const CARD_DESCRIBES = /\b(the |my |our |this |this year'?s )?card( key| legend| itself)? (lists|shows|says|prints|print|has|gives|reads|show|list)\b/i;
// Buying the card is a shop question, not a request for its contents.
const RULE_CONCEPT_HAND =
  /\b(dead|concealed|closed|open|exposed|winning|losing|jokerless|joker[- ]?free|singles and pairs|three[- ]handed) hands?\b/i;
const MEANING_ASK = /\b(mean|means|meaning|stand for|stands for)\b/i;
const VALUE_ASK = /\b(worth|points?|values?|pay|pays|score|scores)\b/i;
const CARD_COMMERCE = /\bat (your|the|a) (shop|store)\b|\bdo you (carry|sell|stock)\b|\bhow much (is|does|are) [^.?!]{0,30}\b(cost|at your|charging|charge)\b|\b(buy|purchase|order) (a |the |this year'?s |a new )?card\b|\bcard (costs?|price)\b|\blarge print\b|\bcharging for the card\b/i;

// "Explain the hands on the 2026 card" is the card; "a teacher who explains hands" is a
// lesson. Tested only when the card, a section, a printed hand or a year is also present.
const TEACHING_CARD_THING = new RegExp(
  `(?:${TEACHING_VERB.source})[^.?!]{0,40}${CARD_THING.source}|${CARD_THING.source}[^.?!]{0,40}(?:${TEACHING_VERB.source})`,
  "i",
);

export function isCardContentRequest(fixed: string): boolean {
  if (NOT_THE_CARD.test(fixed) || READ_SKILL.test(fixed) || CARD_COMMERCE.test(fixed)) return false;
  if (CARD_DESCRIBES.test(fixed) && !CONTENT_VERB.test(fixed.replace(CARD_DESCRIBES, " "))) return false;
  const contentVerb = CONTENT_VERB.test(fixed);
  // The card itself, a named section, a printed hand, or a year: with any of these present the
  // question is about what is printed, and no exemption below applies.
  const anchored = CARD_ANCHOR.test(fixed) || SECTION_NAME.test(fixed) || SPECIFIC_HAND.test(fixed) || HAND_PATTERN.test(fixed);
  // A hand named by a rule concept ("dead hands", "concealed hands") is not the card's hand
  // list. "list all the concealed hands" still is, which is why the reproduction verb wins.
  if (RULE_CONCEPT_HAND.test(fixed) && !contentVerb && !anchored && !ALL_HANDS.test(fixed)) return false;
  // "what does the C mean" is a notation question unless the message also asks for a listing.
  // "what do the hands on this year's card mean" asks for the hands, not for a notation.
  const handsSubject = /\b(the |all the |all |this year'?s? |the \d{4} )?(hands|card hands?)\b[^.?!]{0,30}\b(mean|means|stand for)\b|\bcard hands?\b/i.test(fixed);
  if (NOTATION_ASK.test(fixed) && !contentVerb && !HAND_PATTERN.test(fixed) && !SPECIFIC_HAND.test(fixed) && !handsSubject) return false;
  // "does 369 on the card mean three of each or a run" asks what a printed number means; a
  // value ask ("is 2468 still on the card and how much does it pay") is still refused.
  if (MEANING_ASK.test(fixed) && !contentVerb && !VALUE_ASK.test(fixed) && !SPECIFIC_HAND.test(fixed) && !handsSubject) return false;
  if (PAYMENT_EXEMPT.test(fixed) && !SPECIFIC_HAND.test(fixed) && !contentVerb) return false;
  if (anchored && TEACHING_CARD_THING.test(fixed)) return true;
  return CARD_CONTENT_RES.some((re) => re.test(fixed));
}

export const CARD_REFUSAL = `I cannot share the hands, categories, or line values from the annual card. The card is copyrighted material that the National Mah Jongg League sells, and buying the current card supports the League. With your ${CURRENT_CARD_YEAR} card in hand, I am happy to explain how the general rules work.`;

export const CARD_REFUSAL_FOLLOWUPS = ["When does the new card come out?", "What do the colors and letters on the card mean?", "Can I play with last year's card?"];

export const EMPTY_ANSWER =
  "Ask me an American mahjong rules question, for example whether a joker can be used in a pair, and I will answer from our verified rules or ask you for the one detail I need.";

const SMALL_TALK_RE =
  /^(thanks?|thank you|thx|ty|ok(ay)?|got it|cool|great|perfect|awesome|nice|good|yes|nope?|hi|hello|hey|bye)\b[!. ]*$/i;

export const SMALL_TALK = "Happy to help. Ask another rule any time, or start a new question below.";

// "never mind", "forget it", "start over": the player drops the pending question. Anything
// after the phrase is a new question ("never mind, can I pass a joker?").
const CANCEL_RE = /^(never ?mind|forget (it|that)|skip (it|that)|cancel( that)?|start over|new question|scratch that)\b[,.!: ]*/i;

export function cancelPhrase(question: string): { cancelled: boolean; remainder: string } {
  const m = question.trim().match(CANCEL_RE);
  if (!m) return { cancelled: false, remainder: question };
  return { cancelled: true, remainder: question.trim().slice(m[0].length).trim() };
}

export const CANCELLED = "No problem. Ask another rule any time.";

const GRATITUDE_STATEMENT = /^(thanks?|thank you|thx|ty|got it|perfect|awesome)\b/i;
const QUESTION_WORD = /\b(can|could|how|what|why|when|where|which|who|do|does|did|is|are|should|would|will|may)\b/i;

// A question mark alone makes a thank-you a question only when the message is short enough to
// be an elliptical follow-up ("thanks! joker in a pair?"); "thx that clears up the joker swap
// thing??" is still gratitude.
export function isSmallTalk(question: string): boolean {
  const q = question.trim();
  if (SMALL_TALK_RE.test(q)) return true;
  if (!GRATITUDE_STATEMENT.test(q)) return false;
  const words = q.split(/\s+/).filter(Boolean).length;
  return !QUESTION_WORD.test(q) && !(/\?/.test(q) && words <= 6);
}

// Bare "why?" style follow-ups carry no topic words at all; the honest deterministic reply is
// the last rule again, and the model layer (when enabled) explains the reason from it.
const WHY_RE = /^(why|why not|really|are you sure|explain|explain that|how come|what does that mean|say more|tell me more|huh|what)\??$/i;

export function isWhyFollowup(question: string): boolean {
  return WHY_RE.test(question.trim());
}

// Elliptical starters a follow-up uses ("in the charleston?", "what about a kong?").
export const ELLIPTICAL_RE =
  /^(what about|how about|and\b|also\b|same (for|with|thing)|does (that|this|it) (also )?(apply|work|count|go)|is (that|it) (the )?same|what if\b|can i do that|even (in|for|with|during)|what (about )?(in|for|with|during) (a|an|the)|during (a|an|the)|in (a|an|the)|for (a|an|the)|with (a|an|the)|or (a|an|the)|why\b|how come|really\??$|are you sure|what does that mean|explain|and if|but if|but what)/i;

export function yearNoteFor(raw: string): string | undefined {
  const year = mentionedYear(raw);
  if (!year || year === CURRENT_CARD_YEAR) return undefined;
  return `General rules rarely change from year to year; the hands printed on the card are what changes. The current card is the ${CURRENT_CARD_YEAR} card.`;
}

// A message that asks two things ("Can I use a joker in a pair? And in a kong?") is split so
// each part is retrieved on its own.
export function splitQuestions(raw: string): string[] {
  const parts = String(raw || "")
    .split(/\?|;|\band (?:also|what about|how about)\b|\balso\b/i)
    .map((p) => (p || "").trim())
    .filter((p) => p.length >= 8 && !/^(also|and)$/i.test(p));
  return parts.slice(0, 3);
}
