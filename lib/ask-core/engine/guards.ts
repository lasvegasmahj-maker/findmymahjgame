// Guards that run before any retrieval, so no phrasing can pull card content out of the
// corpus, plus the small conversational cases that are not rules questions at all.

import { CURRENT_CARD_YEAR } from "../corpus/entries.ts";
import { mentionedYear } from "./normalize.ts";

// Union of both sites' card-content matchers. Runs on the spell-fixed question, case-insensitive.
const CARD_CONTENT_RES: RegExp[] = [
  /\b(hands?|lines?|categor(y|ies)|sections?|values?|points?)\b.{0,50}\bcards?\b/i,
  /\bcards?\b.{0,50}\b(hands?|lines?|categor(y|ies)|sections?|values?|points?)\b/i,
  /what('s| is| are) on (the|this year'?s?|the current|the new|the \d{4}) card/i,
  /(read|list|tell|show|give|send|text|type|write|scan|photo)( me)?( all)? (the|this year'?s?|the current|the \d{4}) card/i,
  /\bcards?\b.{0,25}(pdf|copy|image|photo|scan|picture|download)/i,
  /(pdf|copy|image|photo|scan|picture|download).{0,25}\bcards?\b/i,
  /hands? (on|for|from|in) (this|the|last|next|the current|the \d{4}) year/i,
  /\b(read|list|tell|show|give|send|text|type|write|scan|photo|print|share|post)( me)?( all)?( the| this| your)?( entire| whole| full| complete| new| current)?( year'?s?| \d{4})? card\b/i,
  /(is|are) (there|a|an|any) .{0,40}\bhands?\b.{0,20}(on|in) (the|this|the \d{4}|this year'?s?) card/i,
  /(how many|what|which).{0,10}(points?|values?)\b.{0,40}\b(hands?|lines?|card)\b/i,
  /\b(\d{4}|this year'?s?|current|new) card\b.{0,30}\b(hands?|lines?|categor(y|ies)|sections?)\b/i,
];

// Asking what the card's colors or letters mean is a legitimate rules question, not a request
// for the card's contents; it bypasses the guard unless the wording also asks for hands,
// values, or a copy.
const NOTATION_ASK =
  /\b(colou?rs?|notation|symbols?|letters?|abbreviations?|legend|mean|means|meaning|stand for|stands for|read (the|a|my) card|parenthes[ei]s)\b|\b[CX]\b/i;
const CONTENT_REQUEST =
  /\b(list|show|send|give|read|tell|type|copy|pdf|image|photo|scan|picture|screenshot|hands|line values?|values?|points?|categor(y|ies)|sections?)\b|\b(first|second|third|last|\d+(st|nd|rd|th)|20\d\d) (card )?hand\b|what('s| is) on/i;

// "what is the value of a joker-free hand" asks about the payment structure, which the corpus
// answers; "how many points is the quints hand worth" asks for a line value from the card,
// which it refuses. The payment vocabulary, absent any card-section word, tells them apart.
const PAYMENT_EXEMPT = /\b(joker[- ]?free|jokerless|self[- ]?(pick|picked|draw|drawn)|discarder|who pays|pays? (double|the winner|more|less)|worth double|double the value|wall game)\b/i;
const CARD_SECTION = /\b(cards?|lines?|sections?|categor(y|ies)|quints? hand|year hand|\d{4} hand)\b/i;

// A credit card, a gift card, or hands-on lessons have nothing to do with the League card.
const NOT_THE_CARD = /\b(credit|debit|gift|business|membership|library|greeting|birthday|id) cards?\b|\bcard (reader|machine|payment|on file)\b|\bhands?-on\b|\bhands? on (lessons?|class|classes|instruction|training|help|experience|approach|learning)\b/i;

export function isCardContentRequest(fixed: string): boolean {
  if (NOT_THE_CARD.test(fixed)) return false;
  const notationAsk = NOTATION_ASK.test(fixed) && !CONTENT_REQUEST.test(fixed);
  if (notationAsk) return false;
  if (PAYMENT_EXEMPT.test(fixed) && !CARD_SECTION.test(fixed)) return false;
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

export function isSmallTalk(question: string): boolean {
  return SMALL_TALK_RE.test(question.trim());
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
