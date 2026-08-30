import { test, expect } from "@playwright/test";
import { lookupRule } from "../lib/rules/lookup";
import { detectAskTopic } from "../lib/ask-intent";

// Blind held-out set. Written after the routing logic and the main benchmark were
// finished, run once as the blind evaluation, then kept as a regression guard. Each case
// is classified up front as CORRECT ANSWER (acceptable entries), CLARIFICATION (id), or
// REFUSAL; nothing here was used to tune a matcher before its first run.

type Expect = { kind: "answer"; entry: string[] } | { kind: "clarify"; id: string } | { kind: "refuse" };
const A = (q: string, ...entry: string[]) => ({ q, ex: { kind: "answer", entry } as Expect });
const C = (q: string, id: string) => ({ q, ex: { kind: "clarify", id } as Expect });
const R = (q: string) => ({ q, ex: { kind: "refuse" } as Expect });

export const HELD_OUT = [
  A("my sister in law says a joker works in a pair, does it", "joker-in-pair"),
  A("Jokers: can they fill a single?", "joker-in-pair"),
  A("how many jokers come in the box", "jokers-basics", "tile-count"),
  A("Somebody exposed a kong with a joker in it. I have the real tile. Can I grab the joker?", "joker-exchange", "joker-exchange-timing"),
  A("Am I allowed to redeem a joker before I pick from the wall?", "joker-exchange-timing"),
  A("if i throw out a joker can the next player use it", "joker-discarded"),
  A("Charleston: can I hand my neighbor a joker?", "charleston", "charleston-blind-pass"),
  A("What is the deal with the soap tile?", "dragons"),
  A("red dragon goes with which suit", "dragons"),
  A("do flower tiles have numbers on them that matter", "flowers"),
  A("How many of each tile are there?", "tile-count", "suits"),
  A("does the dealer have an extra tile", "dealing"),
  A("How many should I be holding after I discard?", "hand-size"),
  A("i only have 12 tiles, is my hand dead", "dead-hand-details", "hand-size"),
  A("explain the passing before the game starts", "charleston"),
  A("How do you pass tiles?", "charleston"),
  A("How does passing work?", "charleston"),
  A("What is passing?", "charleston"),
  A("Explain passing", "charleston"),
  A("How does the pass work?", "charleston"),
  A("first left, what is that", "charleston", "charleston-blind-pass"),
  A("Is a blind pass legal on the first right?", "charleston-blind-pass"),
  A("we want to skip the whole second round of passing, allowed?", "charleston-stop"),
  A("one person at our table refuses the second charleston, can she", "charleston-stop", "charleston"),
  A("is the courtesy pass required", "courtesy-pass"),
  A("how many tiles in a courtesy pass", "courtesy-pass"),
  C("May I pass?", "pass-context"),
  A("can i pass on a discard i could call", "passing-on-a-discard"),
  A("what does concealed mean on the card", "open-vs-closed", "card-notation"),
  A("if my hand is concealed can i still take the last tile for mahjong", "closed-hand-final-tile", "open-vs-closed"),
  A("concealed hand, someone throws my mahjong tile, can i call it", "closed-hand-final-tile"),
  C("can I pick up what she just threw", "call-purpose"),
  C("Is it legal to claim that discard?", "call-purpose"),
  A("can i claim a discard to make a kong", "calling-for-exposure"),
  A("can I call for a pair if it wins me the game", "calling-for-pair", "calling-for-mahjong"),
  A("can you call a discard to complete your pair", "calling-for-pair"),
  A("Can I call any tile for mahjong?", "calling-for-mahjong"),
  A("two people yelled call at the same time", "two-players-same-tile"),
  A("if she says wait and I say call who gets the discard", "two-players-same-tile"),
  A("oops i discarded the wrong tile can i take it back", "own-discard"),
  A("do you have to announce your discard out loud", "naming-discards"),
  A("she called it a 3 crak but it was a 3 dot, what happens", "misnamed-discard"),
  A("what is an exposed set", "exposures-basics"),
  A("once I lay down a pung can I rearrange it later", "exposures-basics"),
  A("what's a sextet", "quints-sextets"),
  A("can you claim a discard for a quint", "calling-quints-sextets"),
  A("my 2026 hand needs a 6, can a joker stand in for it", "joker-in-mixed-groups"),
  A("how do you actually win the game", "winning-mahjong"),
  A("i said mahjong and i was wrong, is my hand dead", "mahjong-in-error"),
  A("what's the penalty for a bad mahjong call", "mahjong-in-error"),
  A("how much does everyone pay if I pick my winning tile from the wall", "payments-basics"),
  A("does a hand without jokers pay more", "payments-basics"),
  A("who pays for a wall game", "payments-basics", "wall-game"),
  A("what does it mean when a hand is declared dead", "dead-hand", "dead-hand-details"),
  A("can the player next to me call my hand dead", "dead-hand-details", "dead-hand"),
  A("jokers on a dead player's rack, can we still swap for them", "dead-hand-jokers"),
  A("is it ok to pick my next tile while she is still deciding", "picking-ahead"),
  A("Which direction does the turn go around the table?", "order-of-play"),
  A("after east discards who picks", "order-of-play", "dealing"),
  A("how tall is the wall", "the-wall"),
  A("what happens when the wall is gone and nobody has mahjong", "wall-game", "last-tile-of-wall"),
  A("What do the different colors on the card stand for?", "card-notation"),
  A("what does the little c mean after a hand on the card", "card-notation"),
  A("soap counts as a zero right?", "card-notation"),
  A("when is the next card coming", "annual-card"),
  R("can you type out the 2026 card hands for me"),
  R("just give me the winds and dragons section of the card"),
  A("only three of us showed up, can we still play", "players-count"),
  C("do tournaments let you blind pass", "tournament"),
  A("what is different about tournament play", "tournament-rules"),
  A("what's the etiquette for discarding", "courtesies-vs-rules"),
  A("our group uses blanks, is that normal", "blank-tiles"),
  A("any tips for picking a hand after the deal", "hand-choice-strategy"),
  A("where do the official rules come from", "rules-source"),
  C("how do you score in hong kong mahjong", "ruleset"),
  C("Is chow allowed in Chinese mahjong?", "ruleset"),
  A("jocker exchange, when?", "joker-exchange-timing", "joker-exchange"),
  A("charelston pass rules", "charleston"),
  A("dead hand jokers", "dead-hand-jokers"),
  A("courtesy pass optional?", "courtesy-pass", "courtesies-vs-rules"),
  C("Can I call that?", "call-purpose"),
  C("what's the rule when a tile falls off the rack", "topic"),
];

const MONTH_RE = /\b(january|february|march|april|june|july|august|september|october|november|december)\b|\b(in|every|each|late|early|mid) may\b/i;

test.describe("held-out blind evaluation", () => {
  for (const c of HELD_OUT) {
    test(`${c.ex.kind}: ${c.q}`, () => {
      const r = lookupRule({ question: c.q });
      if (c.ex.kind === "answer") {
        expect(r.matched, `expected an answer but got ${JSON.stringify(r.clarify?.id ?? r.unsupported_reason)}`).toBe(true);
        expect(c.ex.entry, `routed to ${r.entry_id}`).toContain(r.entry_id);
        expect(r.answer).not.toMatch(MONTH_RE);
        expect(r.answer).not.toMatch(/[–—]/);
      } else if (c.ex.kind === "clarify") {
        expect(r.matched, `expected clarification ${c.ex.id} but got entry ${r.entry_id}`).toBe(false);
        expect(r.clarify?.id).toBe(c.ex.id);
      } else {
        expect(r.unsupported_reason).toBe("annual_card_content");
      }
      expect(detectAskTopic(c.q), "must reach the rules path").not.toBe("directory");
    });
  }
});
