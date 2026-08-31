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

type Case = { q: string; expect: Expect };

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
  A("I exchanged a joker for the wrong tile, what now?", "joker-exchange-wrong-tile"),
  A("when can I redeem a joker during my turn", "joker-exchange-timing"),
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
  A("someone said wait, do they get the tile", ["two-players-same-tile", "hold-or-wait"]),
  A("can i take back the tile i just discarded", "own-discard"),
  A("Can I call my own discard for mahjong?", "own-discard"),
  A("do i have to say the tile name when i discard", "naming-discards"),
  A("can I say same", "naming-discards"),
  A("I named the tile wrong, what happens?", "misnamed-discard"),
  A("she called my misnamed discard and exposed a pung, what happens", "misnamed-discard"),
  A("do i have to call a discard if i can", "passing-on-a-discard"),
  A("can I just ignore a discard I could use", "passing-on-a-discard"),
  A("what is an exposure", "exposures-basics"),
  A("can I change my exposure after I discard", "exposures-basics"),
  A("can i call for a sextet", "calling-quints-sextets"),
  A("Can a joker be used in NEWS?", "joker-in-mixed-groups"),
  A("can i put a joker in the year hand", "joker-in-mixed-groups"),
  A("joker in a run of 1 2 3?", "joker-in-mixed-groups"),
  A("what is a quint", "quints-sextets"),
  A("do i need a joker for a quint", "quints-sextets"),
  // Winning, mistakes, payments
  A("how do you win", "winning-mahjong"),
  A("What happens if I call mahjong but my hand is wrong?", "mahjong-in-error"),
  A("false mahjong penalty", ["mahjong-in-error", "mahjong-in-error-settlement"]),
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
  R("what do the hands on this year's card mean"),
  R("explain what the hands on the 2026 card mean"),
  R("what does the first hand on the card mean"),
  R("what does the 2026 card hand mean"),
  // Players, tournaments, house, strategy, sources
  A("can three people play", ["players-count", "three-player-procedure"]),
  A("how many players do you need", "players-count"),
  A("does the dealer get 14 tiles at the deal", "dealing"),
  A("how do you play with 3", ["players-count", "three-player-procedure"]),
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
  A("is a cold wall a real rule", "last-tile-of-wall"),
  A("what is a hot wall", "last-tile-of-wall"),
  A("courtesy pass?", "courtesy-pass"),
  A("dead hand?", "dead-hand"),
  A("so like, my friend says you can't call for a pair, is that true", "calling-for-pair"),
  A("mahjongg rules for discrads", "calling-discard"),
  // Owner-approved answers, 2026-08-30 decisions.
  A("I named the tile wrong and someone called mahjong on it", "misnamed-discard"),
  A("what is the penalty for misnaming a discard", "misnamed-discard"),
  A("can we take jokers out of a dead player's exposures", "dead-hand-jokers"),
  A("her hand went dead, can I still exchange for the joker she exposed", "dead-hand-jokers"),
  A("can I call a discard to finish a sextet", "calling-quints-sextets"),
  A("can I call a flower to complete a sextet block", "calling-quints-sextets"),
  A("who pays after someone declares mahjong by mistake", "mahjong-in-error-settlement"),
  A("we all threw in our hands and the mahjong was wrong, what now", "mahjong-in-error-settlement"),
  A("how do you deal for three players", "three-player-procedure"),
  A("three handed mahjong, is there a charleston", "three-player-procedure"),
  A("we only have 3 players, how many tiles does each person get", "three-player-procedure"),
  A("someone has 12 tiles after the charleston, do we redeal", "wrong-tile-count-before-play"),
  A("wrong number of tiles before east discards", "wrong-tile-count-before-play"),
  A("does saying hold count as a call", "hold-or-wait"),
  A("is hold the same as call", "hold-or-wait"),
  A("I said wait, does that give me the tile", "hold-or-wait"),
  A("what happens if I pick out of turn", "picking-ahead"),
  A("is my hand dead if I drew early", "picking-ahead"),
  A("who pays when I win on a discard", "payments-basics"),
  A("does a jokerless hand pay double", "payments-basics"),

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
      "any tips for finding a game in Naples",
      "which direction is the club from downtown Sarasota",
      "I am out of tiles, where can I buy a set in Phoenix",
      "best way to meet other players in Boca Raton",
      "What suits me best, a class or open play in Tampa",
      "who is the authority on mahjong groups in Austin",
      "I don't want it too far, games in Naples",
      "the mahjong club address is wrong, who fixes listings",
      "We are three players looking for a fourth in Naples",
      "Any games for 2 players in Boca?",
      "Is there a mahjong meetup for 5 people in Austin",
      "Can they hold a spot for me if I call ahead?",
      "Who goes first on the waitlist for the Boca game?",
      "Looking for a game with official rules in Phoenix",
      "Do I need to call it in to reserve a seat?",
      "Which tiles set should I buy for lessons?",
      "Can I show up before the game starts to get a lesson?",
      "Do you offer hands-on lessons and take a credit card?",
      "Three of us want to learn, any teachers near Boca?",
      "Charlestown mahjong groups?",
      "Charlton games on Tuesday?",
      "never mind, where can I play in Boca?",
      "Is there tournament play near Naples?",
      "tournament play near Naples FL",
      "Is there a tournament director near me?",
      "Mahjong Made Easy classes near Naples",
      "does mahjong suit beginners",
      "which club suits my game night in Naples",
      "where can I buy a set with blanks",
      "looking for a 3 player group in Henderson",
      "do you have a 3 person class",
      "how much for a three person lesson",
      "what is the price for an extra tile set",
      "can I get an extra tile set at the store",
      "can you hold my spot until I call the teacher",
      "is there a 3 person game near me",
      "3 handed groups near 89138",
      "we need an extra tile set",
      "I have an extra tile set to donate",
      "do people talk or play silently",
      "do I have to say anything before I play",
      "how long do I wait for a call back about lessons",
      "do I announce myself or just call the venue",
      "do I have to wait long to get a call back",
    ]) {
      expect(detectAskTopic(q), q).toBe("directory");
    }
  });

  test("the League's full name counts as American even after spelling normalization", () => {
    const r = lookupRule({ question: "In National Mah Jongg League rules, not Chinese, can I use a joker in a pair?" });
    expect(r.entry_id).toBe("joker-in-pair");
  });
});

test.describe("adversarial pairs from the owner decisions (2026-08-30)", () => {
  test("the deal's final discard is separated from the most recent discard", () => {
    const final = lookupRule({ question: "the wall is empty, can the last discard be called for an exposure" });
    expect(final.entry_id).toBe("last-tile-of-wall");
    expect(final.answer).toMatch(/no published League ruling either way/);
    // The claim the owner struck must never come back.
    expect(final.answer).not.toMatch(/wins you nothing|futile|pointless/i);
    // "last discard" in ordinary speech is the most recent one, not the deal's final tile.
    for (const q of [
      "the last tile she discarded completes my kong, can I call it",
      "can I call the last tile for an exposure",
      "her last discard finishes my pung, can I take it",
    ]) {
      const r = lookupRule({ question: q });
      expect(r.entry_id, q).toBe("calling-for-exposure");
      expect(String(r.answer), q).not.toMatch(/no published League ruling/);
    }
    const recent = lookupRule({ question: "when can I call a discard?" });
    expect(recent.entry_id).toBe("calling-discard");
    expect(String(recent.answer)).not.toMatch(/no published League ruling/);
  });

  test("picking ahead states the League dead-hand rule and labels the reprieve as house practice", () => {
    const r = lookupRule({ question: "what happens if I pick out of turn" });
    expect(r.entry_id).toBe("picking-ahead");
    expect(r.answer).toMatch(/Under League rules, drawing out of turn makes your hand dead/);
    expect(r.answer).toMatch(/house practice or director practice, not a League rule/);
    // An interrupted pick is a different thing and must not read as picking ahead.
    expect(r.answer).toMatch(/interrupted pick/);
    expect(lookupRule({ question: "someone called while I was picking, is that picking ahead" }).answer).toMatch(/interrupted pick/);
  });

  test("no house note merely repeats the sentence that already closes its answer", () => {
    for (const e of RULES_KNOWLEDGE) {
      if (!e.house_note) continue;
      const tail = e.approved_answer.slice(-160).toLowerCase();
      const words = e.house_note.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/).filter((w) => w.length > 4);
      const overlap = words.filter((w) => tail.includes(w)).length;
      expect(overlap / Math.max(1, words.length), e.id).toBeLessThan(0.7);
    }
  });

  test("no answer presents house or tournament leniency as League law", () => {
    for (const e of RULES_KNOWLEDGE) {
      const a = [e.approved_answer, e.house_note ?? ""].join(" ");
      if (/tournament director|many teachers|house practice|table custom|house rule|tournament rules/i.test(a)) {
        expect(a, e.id).toMatch(/not a League rule|table rule|house rule|table custom|house practice|director practice|table choice|table preference|not League law/i);
      }
    }
  });

  test("the three-player answer publishes counts and never picks a final pickup sequence", () => {
    const r = lookupRule({ question: "how do you deal for three players" });
    expect(r.entry_id).toBe("three-player-procedure");
    expect(r.answer).toMatch(/East holding 14 tiles and the other two holding 13/);
    expect(r.answer).toMatch(/two slightly different orders/);
    expect(r.answer).not.toMatch(/East picks 2|picks two tiles|then East picks a 14th/);
    // End counts only: no dealing mechanics the owner did not authorize.
    expect(r.answer).not.toMatch(/4 tiles at a time|four at a time|holds 12|everyone holds/);
  });

  test("a wrong joker exchange names the rack that goes dead and keeps the giver playing", () => {
    const r = lookupRule({ question: "I exchanged a joker for the wrong tile, whose hand is dead" });
    expect(r.entry_id).toBe("joker-exchange-wrong-tile");
    expect(r.answer).toMatch(/before the next discard there is no penalty|Catch it before the next discard and there is no penalty/);
    expect(r.answer).toMatch(/incorrect exposure has a dead hand/);
    expect(r.answer).toMatch(/handed over the wrong tile keeps playing/);
    // The separate rule about changing a valid exposure must stay separate.
    expect(r.answer).toMatch(/changing an otherwise valid exposure/);
    expect(r.answer).not.toMatch(/cannot verify|instructor is confirming/i);
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
      expect(text, e.id).not.toMatch(/[\u2013\u2014]/);
      expect(text, e.id).not.toMatch(/\b[PKN]\b/);
    }
  });

  test("every owner-approved answer is free of the instructor placeholder", () => {
    for (const e of RULES_KNOWLEDGE) {
      if (e.source !== "owner_approved") continue;
      expect(e.approved_answer, e.id).not.toMatch(/instructor is confirming/);
      expect(e.provenance.owner_review_required, e.id).toBe(false);
      expect(e.provenance.evidence, e.id).toBe("verified");
    }
  });

  // The owner_question mechanism stays available for the next unresolved ruling; this
  // asserts only that nothing is waiting on one today.
  test("no rules question is left waiting on the instructor", () => {
    expect(RULES_KNOWLEDGE.filter((e) => e.provenance.evidence === "owner_question_pending").map((e) => e.id)).toEqual([]);
    expect(RULES_KNOWLEDGE.filter((e) => /instructor is confirming/.test(e.approved_answer)).map((e) => e.id)).toEqual([]);
  });

  test("fixing an exposure closes on either cut-off: a discard or a joker exchange", () => {
    for (const id of ["calling-for-exposure", "exposures-basics"]) {
      const e = RULES_KNOWLEDGE.find((x) => x.id === id)!;
      expect(e.approved_answer, id).toMatch(/until you discard or exchange a joker/);
    }
  });

  test("a dead hand's jokers are not answered by the wrong-exchange rule", () => {
    for (const q of [
      "her hand went dead for the wrong number of tiles, can I take her jokers",
      "his hand is dead by mistake, can I still take the joker",
      "dead hand penalty, can we take her jokers",
    ]) {
      expect(lookupRule({ question: q }).entry_id, q).toBe("dead-hand-jokers");
    }
    expect(lookupRule({ question: "I exchanged a joker for the wrong tile, whose hand is dead" }).entry_id).toBe("joker-exchange-wrong-tile");
    expect(lookupRule({ question: "can i exchange a joker on my own rack" }).entry_id).toBe("joker-exchange-timing");
    expect(lookupRule({ question: "Can I swap a joker out of someone's exposure?" }).entry_id).toBe("joker-exchange");
  });

  test("picking ahead never implies that returning the tile saves the hand", () => {
    const e = RULES_KNOWLEDGE.find((x) => x.id === "picking-ahead")!;
    expect(e.approved_answer).not.toMatch(/kills the hand on its own/);
    expect(e.approved_answer).toMatch(/Your hand is already dead/);
  });

  test("the normal 14 tile deal is not treated as a wrong count", () => {
    for (const q of ["does the dealer get 14 tiles at the deal", "east starts with 14 tiles right"]) {
      expect(lookupRule({ question: q }).entry_id, q).toBe("dealing");
    }
    expect(lookupRule({ question: "I ended up with 14 tiles before east threw, redeal?" }).entry_id).toBe("wrong-tile-count-before-play");
  });

  test("out-of-turn questions reach the entry that answers them, and the dead-hand list stays open", () => {
    for (const q of ["Is my hand dead if I pick out of turn?", "I drew out of turn but put the tile back, is my hand still dead?"]) {
      expect(lookupRule({ question: q }).entry_id, q).toBe("picking-ahead");
    }
    const details = RULES_KNOWLEDGE.find((e) => e.id === "dead-hand-details")!;
    expect(details.approved_answer).toMatch(/for example/);
    expect(details.approved_answer).toMatch(/draws out of turn/);
  });

  test("asking whether a claim must be spoken never lands on the declining answer", () => {
    for (const q of ["Do I have to say call out loud?", "Must I announce my call?", "Do I need to say anything when I take a discard?"]) {
      const r = lookupRule({ question: q });
      expect(r.entry_id, q).not.toBe("passing-on-a-discard");
      expect(String(r.answer), q).toMatch(/out loud|speak your claim|say so out loud/);
    }
    expect(lookupRule({ question: "do i have to call a discard if i can" }).entry_id).toBe("passing-on-a-discard");
  });

  test("a misnamed discard separates a bare call from a laid-down exposure", () => {
    const e = RULES_KNOWLEDGE.find((x) => x.id === "misnamed-discard")!;
    expect(e.approved_answer).toMatch(/only said call, correct the name and play on/);
    expect(e.approved_answer).toMatch(/already laid tiles down on the wrong name[\s\S]*their hand is dead/);
  });

  test("no entry claims how a discarded joker is named", () => {
    for (const id of ["naming-discards", "misnamed-discard"]) {
      const e = RULES_KNOWLEDGE.find((x) => x.id === id)!;
      expect(e.approved_answer, id).not.toMatch(/say joker|named joker|call it joker/i);
    }
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

// Gate 21 regression pin. A guard added to keep "call the studio back" out of the
// rules path also swallowed the table sense of "call first" and "call ahead", so
// four real priority questions were answered with a directory search. CONTACT_SENSE
// must read the contact sense only, and both directions are pinned here together:
// widening either side of this line has repeatedly broken the other.
test.describe("call ahead / call first keeps its table sense", () => {
  test("priority and claim questions reach a rule, never a directory search", () => {
    for (const q of [
      "who gets to call first when two of us want it",
      "do I have to call first or can I just take it",
      "she said hold, can I call ahead",
      "am I allowed to call ahead",
      "can I call ahead of someone else who wants the same tile",
      "if two people call at once who gets it",
    ]) {
      expect(detectAskTopic(q), q).toBe("rules");
      const r = lookupRule({ question: q });
      expect(Boolean(r.entry_id || r.clarify), q).toBe(true);
    }
  });

  test("contacting a teacher or venue still goes to the directory", () => {
    for (const q of [
      "how long do I wait for a call back about lessons",
      "do I have to wait long to get a call back",
      "can you hold my spot until I call the teacher",
      "do I announce myself or just call the venue",
      "should I call ahead to the studio",
      "is it better to email or call the instructor",
      "do they call back the same day",
      "can I call ahead and reserve a seat",
    ]) {
      expect(detectAskTopic(q), q).toBe("directory");
    }
  });

  test("a three player payment question is answered about payment, not dealing", () => {
    expect(lookupRule({ question: "how much do three players pay" }).entry_id).toBe("payments-basics");
    expect(lookupRule({ question: "who pays what with only three of us" }).entry_id).toBe("payments-basics");
    expect(lookupRule({ question: "how do you deal for three players" }).entry_id).toBe("three-player-procedure");
    expect(lookupRule({ question: "can you play with three people" }).entry_id).toBe("three-player-procedure");
  });
});
