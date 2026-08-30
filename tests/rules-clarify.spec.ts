import { test, expect } from "@playwright/test";
import { lookupRule } from "../lib/rules/lookup";
import { GAP_ANSWER, CLARIFICATIONS, topicClarification } from "../lib/rules/clarify";
import { RULES_KNOWLEDGE } from "../lib/rules/knowledge";
import { detectAskTopic } from "../lib/ask-intent";

// The clarification engine, unit level. A question missing one fact enters a
// clarification turn; the reply, typed or clicked, resolves to the correct entry; the
// server keeps no state because the original question rides along with the reply.

const CALL = "Can I call that tile?";

test.describe("clarification triggers", () => {
  test("a bare call question asks about purpose, in every phrasing", () => {
    for (const q of [
      CALL,
      "can i call that tile",
      "She just threw the tile I need. Can I take it?",
      "Am I allowed to claim this discard?",
      "CAN I CALL IT?",
      "Can\nI\ncall\nthat\ntile?",
      "Can I call that tile? Thanks!",
    ]) {
      const r = lookupRule({ question: q });
      expect(r.matched, q).toBe(false);
      expect(r.clarify?.id, q).toBe("call-purpose");
      expect(r.needs_clarification, q).toMatch(/exposure, or would it complete mahjong/);
      expect(r.clarify?.options.map((o) => o.key), q).toEqual(["exposure", "mahjong"]);
      expect(detectAskTopic(q), q).not.toBe("directory");
    }
  });

  test("a call question that already states its purpose is answered, not interrogated", () => {
    expect(lookupRule({ question: "Can I call that tile for mahjong?" }).entry_id).toBe("calling-for-mahjong");
    expect(lookupRule({ question: "Can I call that tile to make a pung?" }).entry_id).toBe("calling-for-exposure");
    expect(lookupRule({ question: "Can I call that tile for a pair?" }).entry_id).toBe("calling-for-pair");
    expect(lookupRule({ question: "Can a closed hand call that tile?" }).entry_id).toBe("closed-hand-final-tile");
    expect(lookupRule({ question: "When can I call a discard?" }).entry_id).toBe("calling-discard");
    expect(lookupRule({ question: "Can I call that tile if I just discarded it?" }).entry_id).toBe("own-discard");
  });

  test("hand type is asked only when it decides the answer and is missing", () => {
    const r = lookupRule({ question: "Can I call for a pung with my hand?" });
    expect(r.clarify?.id).toBe("hand-type");
    expect(lookupRule({ question: "Can I call for a pung with my concealed hand?" }).entry_id).toBe("closed-hand-final-tile");
    expect(lookupRule({ question: "My hand is marked X, can I call for a pung?" }).entry_id).toBe("calling-for-exposure");
    expect(lookupRule({ question: "My hand is marked C, can I call for a pung?" }).entry_id).toBe("closed-hand-final-tile");
  });

  test("other variants ask which style, tournaments ask which rules, bare pass asks which pass", () => {
    expect(lookupRule({ question: "In riichi, can I call ron on a discard?" }).clarify?.id).toBe("ruleset");
    expect(lookupRule({ question: "Can I blind pass in a tournament?" }).clarify?.id).toBe("tournament");
    expect(lookupRule({ question: "What are tournament rules?" }).entry_id).toBe("tournament-rules");
    expect(lookupRule({ question: "Can I pass?" }).clarify?.id).toBe("pass-context");
    expect(lookupRule({ question: "Do we have to pass?" }).clarify?.id).toBe("pass-context");
    expect(lookupRule({ question: "Can I pass a joker?" }).clarify).toBeUndefined();
    expect(lookupRule({ question: "Can I pass tiles blind?" }).entry_id).toBe("charleston-blind-pass");
  });

  test("an unmatched rules question gets a topic clarification, never a bare refusal", () => {
    const r = lookupRule({ question: "What happens if my elbow knocks over the rack?" });
    expect(r.matched).toBe(false);
    expect(r.clarify?.id).toBe("topic");
    expect(r.needs_clarification).toMatch(/Which part of the game/);
    expect(r.answer).toBeUndefined();
    expect(r.clarify!.options.length).toBeGreaterThanOrEqual(3);
    expect(r.clarify!.options[r.clarify!.options.length - 1].label).toBe("Something else");
  });
});

test.describe("multi-turn resolution", () => {
  test("Can I call that tile? -> Complete mahjong. -> the mahjong-call answer", () => {
    const first = lookupRule({ question: CALL });
    const ctx = { id: first.clarify!.id, question: first.clarify!.question };
    const second = lookupRule({ question: "Complete mahjong.", clarify: ctx });
    expect(second.matched).toBe(true);
    expect(second.entry_id).toBe("calling-for-mahjong");
    expect(second.clarified_by).toBe("call-purpose");
    expect(second.answer).toMatch(/Any discard that completes your mahjong may be called/);
  });

  test("the clicked label and free text both resolve", () => {
    const ctx = { id: "call-purpose", question: CALL };
    expect(lookupRule({ question: "It would complete mahjong", clarify: ctx }).entry_id).toBe("calling-for-mahjong");
    expect(lookupRule({ question: "To make an exposure", clarify: ctx }).entry_id).toBe("calling-for-exposure");
    expect(lookupRule({ question: "for a pung", clarify: ctx }).entry_id).toBe("calling-for-exposure");
    expect(lookupRule({ question: "mahjong", clarify: ctx }).entry_id).toBe("calling-for-mahjong");
    expect(lookupRule({ question: "to win", clarify: ctx }).entry_id).toBe("calling-for-mahjong");
  });

  test("a reply that matches nothing re-asks once with the choices spelled out", () => {
    const r = lookupRule({ question: "hmm", clarify: { id: "call-purpose", question: CALL } });
    expect(r.matched).toBe(false);
    expect(r.clarify?.id).toBe("call-purpose");
    expect(r.needs_clarification).toMatch(/^Are you calling it to make an exposure, or would it complete mahjong\? You can answer with "To make an exposure" or "It would complete mahjong"\./);
  });

  test("the ruleset clarification re-asks with its real question, never an empty prompt", () => {
    const r = lookupRule({ question: "hmm", clarify: { id: "ruleset", question: "How many tiles are in a riichi set?" } });
    expect(r.clarify?.id).toBe("ruleset");
    expect(r.needs_clarification).toMatch(/^That sounds like it may be about riichi style mahjong/);
    expect(r.needs_clarification).toMatch(/You can answer with "Yes, American mahjong" or "No, another style"\.$/);
  });

  test("a brand new question typed during a clarification is answered as a new question", () => {
    const r = lookupRule({ question: "Actually, can I use a joker in a pair?", clarify: { id: "call-purpose", question: CALL } });
    expect(r.entry_id).toBe("joker-in-pair");
  });

  test("ruleset: yes answers the original question as American mahjong; no ends honestly", () => {
    const q = "How many tiles are in a riichi set?";
    const first = lookupRule({ question: q });
    expect(first.clarify?.id).toBe("ruleset");
    const yes = lookupRule({ question: "Yes, American mahjong", clarify: { id: "ruleset", question: q } });
    expect(yes.entry_id).toBe("tile-count");
    expect(yes.clarified_by).toBe("ruleset");
    const no = lookupRule({ question: "No, I play Japanese", clarify: { id: "ruleset", question: q } });
    expect(no.matched).toBe(false);
    expect(no.answer).toMatch(/only verify American mahjong rules/);
    expect(no.unsupported_reason).toBe("variant_scope");
  });

  test("tournament: standard strips the tournament context; tournament explains director rules", () => {
    const q = "Can I blind pass in a tournament?";
    const std = lookupRule({ question: "Standard League play", clarify: { id: "tournament", question: q } });
    expect(std.entry_id).toBe("charleston-blind-pass");
    const t = lookupRule({ question: "the tournament", clarify: { id: "tournament", question: q } });
    expect(t.entry_id).toBe("tournament-rules");
  });

  test("pass context resolves to the Charleston or to passing on a discard", () => {
    const q = "Do I have to pass?";
    expect(lookupRule({ question: "in the charleston", clarify: { id: "pass-context", question: q } }).entry_id).toBe("charleston");
    expect(lookupRule({ question: "Passing on a discard during play", clarify: { id: "pass-context", question: q } }).entry_id).toBe("passing-on-a-discard");
  });

  test("topic: an option answers from that entry; something else ends with the logged gap answer", () => {
    const q = "What happens if my elbow knocks over the rack?";
    const first = lookupRule({ question: q });
    const opts = first.clarify!.options;
    const pick = opts[0];
    const r = lookupRule({ question: pick.label, clarify: { id: "topic", question: q } });
    expect(r.matched).toBe(true);
    expect(r.clarified_by).toBe("topic");
    const other = lookupRule({ question: "Something else", clarify: { id: "topic", question: q } });
    expect(other.matched).toBe(false);
    expect(other.answer).toBe(GAP_ANSWER);
    expect(other.unsupported_reason).toBe("rules_gap");
  });

  test("an unknown clarification id falls back to answering the reply as a question", () => {
    const r = lookupRule({ question: "Can I use a joker in a pair?", clarify: { id: "nope", question: "x" } });
    expect(r.entry_id).toBe("joker-in-pair");
  });

  test("every clarification option resolves to a real entry, a rewrite, or an answer", () => {
    for (const c of CLARIFICATIONS) {
      for (const o of c.options) {
        const targets = [o.entry, o.rewrite, o.answer].filter(Boolean);
        expect(targets.length, `${c.id}/${o.key}`).toBe(1);
        if (o.entry) expect(RULES_KNOWLEDGE.some((e) => e.id === o.entry), `${c.id}/${o.key}`).toBe(true);
      }
    }
    for (const o of topicClarification("some question about tiles").options) {
      if (o.entry) expect(RULES_KNOWLEDGE.some((e) => e.id === o.entry), o.key).toBe(true);
    }
  });
});
