import {
  RULES_KNOWLEDGE,
  CLAIM_VERB,
  EXPOSURE_CUE,
  HAND_CLOSED,
  JOKER,
  JOKER_EXCHANGE,
  MAHJONG_CUE,
  MISNAMED,
  OWN_DISCARD,
  TWO_PLAYERS,
} from "./knowledge";

// The clarification engine. A rules question that cannot be answered correctly without
// one more fact enters a clarification turn instead of a guess or a refusal. The server
// keeps no state: the response carries the original question and a clarification id,
// the client sends both back with the player's reply, and the reply resolves to an entry.

export type ClarifyOption = {
  key: string;
  label: string;
  match: RegExp;
  entry?: string;
  rewrite?: (original: string) => string;
  answer?: string;
};

export type Clarification = {
  id: string;
  prompt: string;
  options: ClarifyOption[];
};

export type ClarifyContext = { id: string; question: string };

export type ClarifyPayload = {
  id: string;
  prompt: string;
  question: string;
  options: Array<{ key: string; label: string }>;
};

const VARIANT_RE =
  /\b(riichi|japanese|chinese|hong ?kong|cantonese|sichuan|taiwanese|korean|filipino|singapor(e|ean)|mcr|zung ?jung)\b/i;
const AMERICAN_RE = /\b(american|nmjl|national (mah ?jongg?|mahjong) league)\b/i;
const TOURNAMENT_RE = /\btournaments?\b/i;
const TOURNAMENT_PHRASE = /\b(in|at|during|for|under|with) (a |the |our |my )?tournaments?( rules| play)?\b|\btournaments?( rules| play)?\b/gi;
const PASS_VERB = /\bpass(es|ed|ing)?\b/i;
const PASS_CONTEXT = /\b(charleston|blind|courtesy|jokers?|tiles?|right|left|across|discards?|first|second|last|round|before|start|starts|begins?|the game|explain|how|rules?)\b/i;
const DEMONSTRATIVE_TILE =
  /\b(that|this) (tile|discard|one)\b|\b(call|claim|take|grab|have) (it|that|this)\b|\bwhat (she|he|they|someone) (just )?(threw|discarded|put down|tossed)\b|\b(her|his|their|the) (last |latest |most recent )?discard\b|\bwhat (she|he|they|someone) (just )?(threw|discarded|put down|tossed)\b|\bthe tile (she|he|they|someone) (just )?(threw|discarded|put down|tossed)\b|\bthe tile (i|you) (need|want)\b/i;
const OWN_HAND = /\b(my|this|our|the) hand\b/i;
const HAND_TYPE_WORD = /\b(open|closed|concealed|exposed)\b/i;
const HAND_TYPE_LETTER = /\b[CX]\b/i;
const PURPOSE_CUE = new RegExp(`${MAHJONG_CUE.source}|${EXPOSURE_CUE.source}|\\bpairs?\\b|\\bsingles?\\b`, "i");
const OTHER_SPECIFIC = /\b(own discard|call back|take back|both|two (players|people|of us)|same (tile|discard)|hold|wait|blind|charleston|courtesy|wall|dead|error|mistake|wrong|misnam)\b/i;

export function stripTournament(q: string): string {
  return q.replace(TOURNAMENT_PHRASE, " ").replace(/\s+/g, " ").replace(/\s([,.?!])/g, "$1").trim();
}

function stripVariant(q: string): string {
  const cleaned = q.replace(VARIANT_RE, " ").replace(/\s+/g, " ").replace(/\s([,.?!])/g, "$1").trim();
  return AMERICAN_RE.test(cleaned) ? cleaned : `In American mahjong, ${cleaned}`;
}

export const CLARIFICATIONS: Clarification[] = [
  {
    id: "call-purpose",
    prompt: "Are you calling it to make an exposure, or would it complete mahjong?",
    options: [
      {
        key: "exposure",
        label: "To make an exposure",
        match: /\b(expos(e|ure|ures|ed)|pungs?|kongs?|quints?|sextets?|group|meld|build|first one|exposure one)\b/i,
        entry: "calling-for-exposure",
      },
      {
        key: "mahjong",
        label: "It would complete mahjong",
        match: /\b(mah ?jong+|mahj|maj|win|winning|complete|finish|go out|last tile|final tile|second one)\b/i,
        entry: "calling-for-mahjong",
      },
    ],
  },
  {
    id: "hand-type",
    prompt: "Is that hand marked C for concealed or X for exposed on the card?",
    options: [
      {
        key: "concealed",
        label: "C, concealed",
        match: /\b(c|concealed|closed|conceal)\b/i,
        entry: "closed-hand-final-tile",
      },
      {
        key: "exposed",
        label: "X, exposed",
        match: /\b(x|exposed|open|expose)\b/i,
        entry: "calling-for-exposure",
      },
    ],
  },
  {
    id: "ruleset",
    prompt: "",
    options: [
      {
        key: "american",
        label: "Yes, American mahjong",
        match: /\b(yes|yeah|yep|yup|correct|right|american|nmjl|league|sure)\b/i,
        rewrite: stripVariant,
      },
      {
        key: "other",
        label: "No, another style",
        match: /\b(no|nope|not|other|another|different|riichi|japanese|chinese|hong ?kong|cantonese|sichuan|taiwanese|korean|filipino|singapor(e|ean)|mcr|zung ?jung)\b/i,
        answer:
          "I can only verify American mahjong rules, the National Mah Jongg League style, so I will not guess at another style's rules. If you also play American mahjong, ask me the same question about it and I will answer.",
      },
    ],
  },
  {
    id: "tournament",
    prompt: "Are you asking about standard League play or a tournament's rules?",
    options: [
      {
        key: "standard",
        label: "Standard League play",
        match: /\b(standard|nmjl|league|regular|normal|home|everyday|usual|ordinary|not (a )?tournament)\b/i,
        rewrite: stripTournament,
      },
      {
        key: "tournament",
        label: "A tournament's rules",
        match: /\b(tournaments?|event|director|competition)\b/i,
        entry: "tournament-rules",
      },
    ],
  },
  {
    id: "pass-context",
    prompt: "Do you mean passing tiles in the Charleston, or passing on a discard during play?",
    options: [
      {
        key: "charleston",
        label: "Passing tiles in the Charleston",
        match: /\b(charleston|tiles?|before|start|first|second)\b/i,
        entry: "charleston",
      },
      {
        key: "play",
        label: "Passing on a discard during play",
        match: /\b(discards?|during|play|call|after|skip|decline)\b/i,
        entry: "passing-on-a-discard",
      },
    ],
  },
];

export const TOPIC_GROUPS: Array<{ key: string; label: string; match: RegExp; entry: string }> = [
  { key: "charleston", label: "The Charleston and passing", match: /\b(charleston|pass|passing)\b/i, entry: "charleston" },
  { key: "calling", label: "Calling discards and exposures", match: /\b(call|calling|discards?|expos|exposure)\b/i, entry: "calling-discard" },
  { key: "jokers", label: "Jokers", match: /\bjokers?\b/i, entry: "jokers-basics" },
  { key: "winning", label: "Winning and payments", match: /\b(win|winning|mahjong|maj|pay|payments?|score)\b/i, entry: "winning-mahjong" },
  { key: "dealing", label: "The wall, dealing, and turn order", match: /\b(wall|deal|dealing|turn|order|draw)\b/i, entry: "order-of-play" },
  { key: "dead", label: "Dead hands and mistakes", match: /\b(dead|mistake|error|wrong)\b/i, entry: "dead-hand" },
];

export const SOMETHING_ELSE_KEY = "other";
export const SOMETHING_ELSE_LABEL = "Something else";
export const GAP_ANSWER =
  "Thanks, that one is not in our verified American mahjong rules yet, so I will not guess at it. We have logged the topic for our instructor to research and add. Until then, the National Mah Jongg League's rulebook and card settle it, and your table should follow the League rule rather than a table custom.";

function specificEntryLikely(q: string): boolean {
  return (
    HAND_CLOSED.test(q) || JOKER.test(q) || JOKER_EXCHANGE.test(q) || OTHER_SPECIFIC.test(q) ||
    OWN_DISCARD.test(q) || MISNAMED.test(q) || TWO_PLAYERS.test(q)
  );
}

// Which clarification a fresh question needs, if any. Ordered so the narrowest context
// question wins; a question that already carries the missing fact never enters here.
export function needsClarification(question: string, matchesAfterTournamentStrip: (q: string) => boolean): Clarification | null {
  const q = question;
  if (VARIANT_RE.test(q) && !AMERICAN_RE.test(q)) {
    const variant = q.match(VARIANT_RE)?.[0] ?? "another style of";
    const base = CLARIFICATIONS.find((c) => c.id === "ruleset")!;
    return {
      ...base,
      prompt: `That sounds like it may be about ${variant} style mahjong. I can only verify American mahjong rules, the National Mah Jongg League style. Did you mean American mahjong?`,
    };
  }
  if (TOURNAMENT_RE.test(q)) {
    const stripped = stripTournament(q);
    if (stripped !== q && matchesAfterTournamentStrip(stripped)) return CLARIFICATIONS.find((c) => c.id === "tournament")!;
  }
  if (CLAIM_VERB.test(q) && DEMONSTRATIVE_TILE.test(q) && !PURPOSE_CUE.test(q) && !specificEntryLikely(q)) {
    return CLARIFICATIONS.find((c) => c.id === "call-purpose")!;
  }
  if (CLAIM_VERB.test(q) && EXPOSURE_CUE.test(q) && OWN_HAND.test(q) && !HAND_TYPE_WORD.test(q) && !HAND_TYPE_LETTER.test(q) && !MAHJONG_CUE.test(q) && !specificEntryLikely(q)) {
    return CLARIFICATIONS.find((c) => c.id === "hand-type")!;
  }
  if (PASS_VERB.test(q) && !PASS_CONTEXT.test(q) && !specificEntryLikely(q)) {
    return CLARIFICATIONS.find((c) => c.id === "pass-context")!;
  }
  return null;
}

// The fallback for a rules question that matched nothing: offer the closest topics,
// never a bare refusal. Keyword hits rank first; the broad topic groups fill in.
export function topicClarification(question: string): Clarification {
  const lower = question.toLowerCase();
  const hits = RULES_KNOWLEDGE.filter((e) => e.source !== "owner_question" && e.keywords.some((k) => lower.includes(k)))
    .slice(0, 3)
    .map((e) => ({ key: e.id, label: e.topic, match: new RegExp(`^${escapeRe(e.topic)}$|^${escapeRe(e.id)}$`, "i"), entry: e.id }));
  const groups = TOPIC_GROUPS.filter((g) => !hits.some((h) => h.entry === g.entry))
    .slice(0, Math.max(0, 5 - hits.length))
    .map((g) => ({ key: g.key, label: g.label, match: new RegExp(`^${escapeRe(g.label)}$|${g.match.source}`, "i"), entry: g.entry }));
  return {
    id: "topic",
    prompt: "I want to get this right. Which part of the game is your question about?",
    options: [
      ...hits,
      ...groups,
      { key: SOMETHING_ELSE_KEY, label: SOMETHING_ELSE_LABEL, match: /^something else$|\b(else|other|none|neither)\b/i, answer: GAP_ANSWER },
    ],
  };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A clicked option arrives as its label; it is never a new question.
export function isExactOption(ctx: ClarifyContext, reply: string): boolean {
  const c = ctx.id === "topic" ? topicClarification(ctx.question) : CLARIFICATIONS.find((x) => x.id === ctx.id);
  const t = reply.trim().toLowerCase();
  return !!c && c.options.some((o) => o.label.toLowerCase() === t || o.key.toLowerCase() === t);
}

export function toPayload(c: Clarification, question: string): ClarifyPayload {
  return { id: c.id, prompt: c.prompt, question, options: c.options.map((o) => ({ key: o.key, label: o.label })) };
}

// Resolve a reply against a pending clarification. The topic clarification is rebuilt
// from the original question so its options are identical to the ones the player saw.
export function resolveReply(ctx: ClarifyContext, reply: string): { option: ClarifyOption; clarification: Clarification } | { clarification: Clarification } | null {
  const clarification = ctx.id === "topic" ? topicClarification(ctx.question) : CLARIFICATIONS.find((c) => c.id === ctx.id);
  if (!clarification) return null;
  const trimmed = reply.trim();
  const exact = clarification.options.find((o) => o.label.toLowerCase() === trimmed.toLowerCase() || o.key.toLowerCase() === trimmed.toLowerCase());
  if (exact) return { option: exact, clarification };
  // Option words are loose on purpose ("mahjong", "play"), so only a short reply may match
  // them; a whole new question typed mid-clarification is handled as a question.
  if (trimmed.split(/\s+/).length > 6) return { clarification };
  const matches = clarification.options.filter((o) => o.match.test(trimmed));
  // Both options matching means the reply restated the whole question; ask again.
  if (matches.length === 1) return { option: matches[0], clarification };
  return { clarification };
}
