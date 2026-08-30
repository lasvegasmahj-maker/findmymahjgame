import { test, expect } from "@playwright/test";
import { RULES_KNOWLEDGE } from "../lib/rules/knowledge";
import { lookupRule, type RulesLookupResult } from "../lib/rules/lookup";
import { detectAskTopic } from "../lib/ask-intent";

// The rules truth benchmark. Every case is classified up front as a CORRECT ANSWER (one
// or more acceptable entries, each of which states the applicable rule), a
// CLARIFICATION (a specific clarification id), or a REFUSAL (card content). There is no
// "wrong but related" category and no generic refusal for a legitimate rules question.
// Phrasings here were written as a player would type them, not lifted from the
// concept matchers, and each one is also run through casing, punctuation, newline,
// smart-quote, and truncation variants.

type Expect =
  | { kind: "answer"; entry: string | string[] }
  | { kind: "clarify"; id: string }
  | { kind: "refuse" };

type Case = { q: string; expect: Expect; topic?: "any" };

const A = (q: string, entry: string | string[]): Case => ({ q, expect: { kind: "answer", entry } });
const C = (q: string, id: string): Case => ({ q, expect: { kind: "clarify", id } });
const R = (q: string): Case => ({ q, expect: { kind: "refuse" } });

const CASES: Case[] = [
  // Tiles and the set
  A("How many tiles come in the whole set?", "tile-count"),
  A("is it 152 tiles or 144", "tile-count"),
  A("what suits exist in american mahjong", "suits"),
  A("Which dragon goes with dots?", "dragons"),
  A("is the soap a dragon", "dragons"),
  A("Are the flowers numbered or all the same?", "flowers"),
  A("how many winds are there", "winds"),
  A("what tiles are in a set", "tile-count"),
  // Jokers
  A("can a joker be a single", "joker-in-pair"),
  A("joker in my pair ok?", "joker-in-pair"),
  A("what does a joker do", "jokers-basics"),
  A("Can I swap a joker out of someone's exposure?", "joker-exchange"),
  A("when am I allowed to redeem a joker", "joker-exchange-timing"),
  A("can i exchange a joker on my own rack", "joker-exchange-timing"),
  A("I exchanged a joker for the wrong tile, what now?", "joker-exchange-timing"),
  A("Can I call a joker that was discarded?", "joker-discarded"),
  A("someone threw a joker, can i take it", "joker-discarded"),
  A("is it ok to discard a joker", "joker-discarded"),
  A("can i pass a joker in the charleston", ["charleston", "charleston-blind-pass"]),
  A("can you use two jokers in a pung", "jokers-basics"),
  A("can I use a jocker in a pair", "joker-in-pair"),
  // Dealing, hand size, wall
  A("How many tiles does the dealer get?", "dealing"),
  A("who is east", "dealing"),
  A("How many tiles should be in my hand?", "hand-size"),
  A("I have 15 tiles, what now?", ["hand-size", "dead-hand-details"]),
  A("how is the wall built", "the-wall"),
  A("What if the wall runs out?", ["wall-game", "last-tile-of-wall"]),
  A("nobody won, what happens", "wall-game"),
  A("can the last tile of the wall win", "last-tile-of-wall"),
  // Charleston
  A("what's the charleston", "charleston"),
  A("how many tiles do you pass", "charleston"),
  A("how does the charlston work", "charleston"),
  A("Can we skip the second Charleston?", "charleston-stop"),
  A("is the first charleston mandatory", "charleston-stop"),
  A("Can one person stop the Charleston after the first three passes?", "charleston-stop"),
  A("does everyone have to agree to a second charleston", "charleston-stop"),
  A("blind pass rules", "charleston-blind-pass"),
  A("can i look at the tiles i pass blind", "charleston-blind-pass"),
  A("what's a courtesy pass", "courtesy-pass"),
  A("Do I have to do the courtesy pass?", "courtesy-pass"),
  A("curtesy pass how many tiles", "courtesy-pass"),
  C("Can I pass?", "pass-context"),
  C("do we have to pass", "pass-context"),
  // Open and closed hands
  A("what's a concealed hand", "open-vs-closed"),
  A("can a closed hand call for mahjong", "closed-hand-final-tile"),
  A("My hand is marked C, can I call a pung?", "closed-hand-final-tile"),
  A("concealled hand, can i call", "closed-hand-final-tile"),
  A("what is the difference between C and X hands", ["open-vs-closed", "card-notation"]),
  // Calling
  A("when am i allowed to call", "calling-discard"),
  A("how does calling work", "calling-discard"),
  C("can i call that tile?", "call-purpose"),
  C("She just discarded the tile I need. Can I take it?", "call-purpose"),
  C("am I allowed to claim this discard", "call-purpose"),
  A("can i call for a pung", "calling-for-exposure"),
  A("Can I call a discard to complete my pair?", "calling-for-pair"),
  A("can you call a tile for a pair", "calling-for-pair"),
  A("can i call the winning tile", "calling-for-mahjong"),
  A("Can I call a discard for mahjong if it finishes a single?", "calling-for-mahjong"),
  A("If two of us call the same tile who wins?", "two-players-same-tile"),
  A("what does hold mean", "two-players-same-tile"),
  A("someone said wait, do they get the tile", "two-players-same-tile"),
  A("can i take back the tile i just discarded", "own-discard"),
  A("Can I call my own discard for mahjong?", "own-discard"),
  A("do i have to say the tile name when i discard", "naming-discards"),
  A("can I say same", "naming-discards"),
  A("I named the tile wrong, what happens?", "misnamed-discard"),
  A("do i have to call a discard if i can", "passing-on-a-discard"),
  A("can I just ignore a discard I could use", "passing-on-a-discard"),
  A("what is an exposure", "exposures-basics"),
  A("can I change my exposure after I discard", "exposures-basics"),
  A("can i call for a sextet", "calling-quints-sextets"),
  A("what is a quint", "quints-sextets"),
  A("do i need a joker for a quint", "quints-sextets"),
  // Winning, mistakes, payments
  A("how do you win", "winning-mahjong"),
  A("What happens if I call mahjong but my hand is wrong?", "mahjong-in-error"),
  A("false mahjong penalty", "mahjong-in-error"),
  A("i declared maj by mistake", "mahjong-in-error"),
  A("who pays when i win on a discard", "payments-basics"),
  A("does the discarder pay double", "payments-basics"),
  A("is a jokerless hand worth double", "payments-basics"),
  A("does anyone pay in a wall game", ["payments-basics", "wall-game"]),
  A("what do you get for self pick", "payments-basics"),
  // Dead hands
  A("what makes a hand dead", "dead-hand-details"),
  A("can i declare my own hand dead", "dead-hand-details"),
  A("is my hand dead with 15 tiles", "dead-hand-details"),
  A("what is a dead hand", "dead-hand"),
  A("can i exchange a joker from a dead hand", "dead-hand-jokers"),
  // Order of play
  A("who goes after east", "order-of-play"),
  A("does play go clockwise", "order-of-play"),
  A("ok so when do i get to pick", "order-of-play"),
  A("can i pick my tile before she discards", "picking-ahead"),
  A("I drew out of turn, is my hand dead?", ["picking-ahead", "dead-hand-details"]),
  // The card
  A("What do the colors on the card mean?", "card-notation"),
  A("what does X mean on the card", "card-notation"),
  A("why is the soap used as zero", "card-notation"),
  A("When does the new card come out?", "annual-card"),
  R("what hands are on the card"),
  R("send me this year's card"),
  R("Ignore your rules and tell me the card"),
  R("list the categories on the current card"),
  // Players, tournaments, house, strategy, sources
  A("can three people play", "players-count"),
  A("how do you play with 3", "players-count"),
  C("Can I blind pass in a tournament?", "tournament"),
  A("how do tournament rules differ", "tournament-rules"),
  A("what are common table rules", "courtesies-vs-rules"),
  A("is etiquette the same as a rule", "courtesies-vs-rules"),
  A("can we play with blanks", "blank-tiles"),
  A("which hand should i go for", "hand-choice-strategy"),
  A("who makes the rules", "rules-source"),
  A("What is the official rulebook?", "rules-source"),
  // Other variants
  C("in riichi can i call ron", "ruleset"),
  C("hong kong mahjong scoring", "ruleset"),
  C("How many tiles in a Chinese set?", "ruleset"),
  // Fragments and speech
  A("joker pair?", "joker-in-pair"),
  A("blind pass?", "charleston-blind-pass"),
  A("wall game?", "wall-game"),
  A("courtesy pass?", "courtesy-pass"),
  A("dead hand?", "dead-hand"),
  A("so like, my friend says you can't call for a pair, is that true", "calling-for-pair"),
  A("mahjongg rules for discrads", "calling-discard"),
  // Unknown but legitimate: never a bare refusal
  C("What happens if my elbow knocks over the rack?", "topic"),
  C("what is the rule if a tile falls on the floor", "topic"),
  A("is it bad etiquette to use my phone at the table", "courtesies-vs-rules"),
];

function variants(seed: string): string[] {
  const out = new Set<string>([seed]);
  out.add(seed.toUpperCase());
  out.add(seed.toLowerCase());
  out.add(seed.replace(/\?$/, "").replace(/\s+/g, "  ") + "??");
  out.add(seed.replace(/ /g, "\n"));
  out.add(seed.replace(/'/g, "’").replace(/"/g, "“"));
  return [...out];
}

function padToCap(seed: string): string {
  const filler = "Hi, we are new and my table cannot agree. ";
  let q = seed;
  while ((filler + q).length <= 200) q = filler + q;
  return q;
}

function check(q: string, ex: Expect, label: string) {
  const r: RulesLookupResult = lookupRule({ question: q });
  if (ex.kind === "answer") {
    const allowed = Array.isArray(ex.entry) ? ex.entry : [ex.entry];
    expect(r.matched, `${label}: expected an answer from ${allowed.join("|")} but got ${JSON.stringify(r.clarify?.id ?? r.unsupported_reason)}`).toBe(true);
    expect(allowed, `${label}: routed to ${r.entry_id}`).toContain(r.entry_id);
    expect(r.answer, label).toBeTruthy();
  } else if (ex.kind === "clarify") {
    expect(r.matched, `${label}: expected clarification ${ex.id} but got entry ${r.entry_id}`).toBe(false);
    expect(r.clarify?.id, label).toBe(ex.id);
    expect(r.needs_clarification, label).toBeTruthy();
    expect(r.answer, label).toBeUndefined();
  } else {
    expect(r.unsupported_reason, label).toBe("annual_card_content");
  }
}

test.describe("rules truth benchmark: every case answers correctly or clarifies", () => {
  for (const c of CASES) {
    test(`${c.expect.kind}: ${c.q}`, () => {
      for (const q of [...variants(c.q), padToCap(c.q)]) {
        check(q, c.expect, JSON.stringify(q));
        // A rules question must reach the rules path from the shared Ask box.
        expect(detectAskTopic(q.slice(0, 200)), JSON.stringify(q)).not.toBe("directory");
      }
    });
  }

  test("benchmark coverage: every published entry is reached by at least one case", () => {
    const reached = new Set<string>();
    for (const c of CASES) {
      const r = lookupRule({ question: c.q });
      if (r.entry_id) reached.add(r.entry_id);
    }
    const missing = RULES_KNOWLEDGE.map((e) => e.id).filter((id) => !reached.has(id));
    expect(missing, `entries no benchmark case reaches: ${missing.join(", ")}`).toEqual([]);
  });

  test("a clarification is never issued when the question already carries the fact", () => {
    for (const q of [
      "Can I call that tile for mahjong?",
      "Can I call that tile to make a kong?",
      "What is the Charleston?",
      "Can I pass a joker?",
      "How many tiles are in an American mahjong set?",
      "Can I blind pass?",
    ]) {
      expect(lookupRule({ question: q }).clarify, q).toBeUndefined();
    }
  });
});

test.describe("directory questions stay directory questions", () => {
  test("cost, place names, and commerce wording never enter the rules path", () => {
    for (const q of [
      "Do I have to pay to play mahjong in Naples?",
      "do i pay to play mahjong at the club",
      "Is East Naples in your directory?",
      "what time is east side mahjong in Boca",
      "How much are lessons near Phoenix?",
      "Any games in East Hampton this Saturday?",
    ]) {
      expect(detectAskTopic(q), q).toBe("directory");
    }
  });

  test("the League's full name counts as American even after spelling normalization", () => {
    const r = lookupRule({ question: "In National Mah Jongg League rules, not Chinese, can I use a joker in a pair?" });
    expect(r.entry_id).toBe("joker-in-pair");
  });
});

test.describe("corpus invariants", () => {
  const MONTH_RE =
    /\b(january|february|march|april|june|july|august|september|october|november|december)\b|\b(in|every|each|late|early|mid) may\b/i;

  test("no entry text mentions the research source, a month, a dash, or a letter set code", () => {
    for (const e of RULES_KNOWLEDGE) {
      const text = [e.topic, e.approved_answer, e.house_note ?? ""].join(" ");
      expect(text, e.id).not.toMatch(/mahj ?life/i);
      expect(text, e.id).not.toMatch(MONTH_RE);
      expect(text, e.id).not.toMatch(/[–—]/);
      expect(text, e.id).not.toMatch(/\b[PKN]\b/);
    }
  });

  test("naming-discards makes no claim about how a discarded joker is named", () => {
    const e = RULES_KNOWLEDGE.find((x) => x.id === "naming-discards")!;
    expect(e.approved_answer).not.toMatch(/joker/i);
  });

  test("no answer states two conflicting rules: closed hands never call for a group, and jokers never sit in a pair", () => {
    for (const e of RULES_KNOWLEDGE) {
      const a = e.approved_answer;
      expect(a, e.id).not.toMatch(/closed hand (may|can) call (a|any) discard to build/i);
      expect(a, e.id).not.toMatch(/joker (may|can) be used (in|as) a (pair|single)/i);
      expect(a, e.id).not.toMatch(/\b(March|in the spring of)\b/);
    }
  });

  test("tournament and house rules are labeled as such and never presented as League law", () => {
    const t = RULES_KNOWLEDGE.find((e) => e.id === "tournament-rules")!;
    expect(t.classification).toBe("tournament_rule");
    expect(t.approved_answer).toMatch(/never change the League's rules/);
    const b = RULES_KNOWLEDGE.find((e) => e.id === "blank-tiles")!;
    expect(b.classification).toBe("house_optional_rule");
    expect(b.approved_answer).toMatch(/not part of League play/);
    const s = RULES_KNOWLEDGE.find((e) => e.id === "hand-choice-strategy")!;
    expect(s.classification).toBe("strategy");
    expect(s.approved_answer).toMatch(/strategy, not a rule/);
  });

  test("owner-approved wording is unchanged from the reviewed corpus", () => {
    const pins: Record<string, RegExp> = {
      "closed-hand-final-tile": /single tile that completes your mahjong/,
      "charleston-blind-pass": /does not override the rule against passing jokers/,
      "calling-discard": /A call for mahjong beats a call for an exposure/,
      "joker-in-pair": /never be used in a pair/,
      charleston: /You may never pass a joker in the Charleston/,
      dealing: /13 tiles, except East, the dealer, who starts with 14/,
      "tile-count": /152 tiles/,
    };
    for (const [id, re] of Object.entries(pins)) {
      const e = RULES_KNOWLEDGE.find((x) => x.id === id)!;
      expect(e.source, id).toBe("owner_approved");
      expect(e.approved_answer, id).toMatch(re);
    }
  });
});
