import { test, expect } from "@playwright/test";
import { classifyReply, stripQuotedText } from "../lib/reply-classifier";
import { replyActions, REPLY_ACTION_VOCABULARY, type ReplyAction } from "../lib/reply-policy";

// The reply harness protects real people. Pure logic, no browser, no network.

const FIXTURES: Array<[string, string, string]> = [
  ["Sure, remove me.", "UNSUBSCRIBE", "polite opt-out"],
  ["Stop.", "UNSUBSCRIBE", "one-word stop"],
  ["Please unsubscribe me from this list", "UNSUBSCRIBE", "explicit"],
  ["Not interested right now, maybe next year.", "NOT_INTERESTED", "soft decline stays a decline"],
  ["No thanks, we're good.", "NOT_INTERESTED", "casual decline"],
  ["I don't run events anymore.", "NOT_INTERESTED", "activity ended"],
  ["Jane handles this now.", "WRONG_PERSON", "handoff"],
  ["I'm no longer with the JCC, please contact programs@ instead", "WRONG_PERSON", "left org"],
  ["What does it cost?", "NEEDS_INFO", "price question"],
  ["Is it free to be listed? How long does it take?", "NEEDS_INFO", "multiple questions"],
  ["Sounds interesting.", "INTERESTED", "positive, no commitment"],
  ["Yes please, add us to the directory!", "INTERESTED", "explicit acceptance"],
  ["I am out of office until Sept 2 with limited access to email.", "OUT_OF_OFFICE", "vacation responder"],
  ["Automatic reply: I will respond upon my return.", "OUT_OF_OFFICE", "autoresponder"],
  ["Delivery Status Notification: address not found", "BOUNCE_OR_DELIVERY_FAILURE", "bounce text"],
  ["ok", "AMBIGUOUS", "vague one-word"],
  ["Thanks", "AMBIGUOUS", "vague one-word"],
];

test.describe("reply classification fixtures", () => {
  for (const [text, expected, label] of FIXTURES) {
    test(`${label}: "${text.slice(0, 40)}"`, () => {
      expect(classifyReply(text).classification).toBe(expected);
    });
  }

  test("quoted unsubscribe language does not suppress a positive reply", () => {
    const reply = [
      "Yes please, we would love to be listed!",
      "",
      "On Tue, Aug 19, 2026 at 9:01 AM Find My Mahj Game wrote:",
      "> If this is not relevant, reply and we will not contact you again.",
      "> A listing is free to create and takes a few minutes.",
    ].join("\n");
    const c = classifyReply(reply);
    expect(c.classification).toBe("INTERESTED");
    expect(c.unsubscribeSignal).toBe(false);
  });

  test("quoted-only content classifies as ambiguous, not unsubscribe", () => {
    const reply = [
      "> If this is not relevant, reply and we will not contact you again.",
      "> Shauna",
    ].join("\n");
    const c = classifyReply(reply);
    expect(c.classification).toBe("AMBIGUOUS");
    expect(c.unsubscribeSignal).toBe(false);
  });

  test("forwarding notice reads as wrong person", () => {
    const c = classifyReply("I've forwarded your email to our program director.");
    expect(c.classification).toBe("WRONG_PERSON");
  });

  test("stripQuotedText keeps the sender's words only", () => {
    const s = stripQuotedText("Real answer here\n> quoted line\nOn Mon, Aug 18, 2026 at 3:00 PM someone wrote:\nold body");
    expect(s).toContain("Real answer");
    expect(s).not.toContain("quoted line");
    expect(s).not.toContain("old body");
  });

  test("idempotent: same input, same output", () => {
    for (const [text] of FIXTURES) {
      const a = classifyReply(text);
      const b = classifyReply(text);
      expect(b).toEqual(a);
    }
  });
});

test.describe("reply policy safety", () => {
  test("the action vocabulary contains no send of any kind", () => {
    for (const a of REPLY_ACTION_VOCABULARY) {
      expect(a).not.toMatch(/send|email|reply|message|draft/);
    }
  });

  test("unsubscribe always suppresses and cancels", () => {
    const acts = replyActions(classifyReply("remove me please"));
    expect(acts).toContain("suppress");
    expect(acts).toContain("cancel_followups");
    expect(acts).toContain("set_state_unsubscribed");
  });

  test("not-interested cancels follow-ups", () => {
    const acts = replyActions(classifyReply("Not interested, thanks."));
    expect(acts).toContain("cancel_followups");
    expect(acts).toContain("set_state_not_interested");
  });

  test("wrong person suppresses the address", () => {
    const acts = replyActions(classifyReply("Jane handles this now."));
    expect(acts).toContain("suppress");
    expect(acts).toContain("cancel_followups");
  });

  test("ambiguous and human-review can only queue human review", () => {
    for (const text of ["ok", "Thanks", "Per my last email, the committee will convene regarding the matter."]) {
      const acts = replyActions(classifyReply(text));
      const allowed: ReplyAction[] = ["queue_human_review"];
      for (const a of acts) expect(allowed).toContain(a);
    }
  });

  test("low confidence never changes prospect state", () => {
    const acts = replyActions(classifyReply("hm"));
    expect(acts.filter((a) => a.startsWith("set_state"))).toHaveLength(0);
  });

  test("activity-ended decline raises a freshness signal", () => {
    const acts = replyActions(classifyReply("I don't run events anymore."));
    expect(acts).toContain("freshness_review_listing");
  });

  test("out of office changes nothing", () => {
    const acts = replyActions(classifyReply("I am out of office until Monday."));
    expect(acts).toHaveLength(0);
  });
});
