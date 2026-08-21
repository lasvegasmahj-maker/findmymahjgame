import { test, expect } from "@playwright/test";
import { canTransition, CANCELS_FOLLOW_UPS, PROSPECT_STATES } from "../lib/prospect-state";

// State-machine rules that protect real people from unwanted email. Pure logic, no browser.

test.describe("prospect state machine", () => {
  test("unsubscribed can never re-enter outreach", () => {
    for (const target of ["READY_FOR_OUTREACH", "OUTREACH_ACTIVE", "FOLLOW_UP_DUE", "QUALIFIED"] as const) {
      expect(canTransition("UNSUBSCRIBED", target)).toBe(false);
      expect(canTransition("DO_NOT_CONTACT", target)).toBe(false);
    }
  });

  test("do not contact is reachable from every other state", () => {
    for (const s of PROSPECT_STATES) {
      if (s === "DO_NOT_CONTACT") continue;
      expect(canTransition(s, "DO_NOT_CONTACT")).toBe(true);
    }
  });

  test("outreach requires passing through qualification", () => {
    expect(canTransition("DISCOVERED", "OUTREACH_ACTIVE")).toBe(false);
    expect(canTransition("DISCOVERED", "READY_FOR_OUTREACH")).toBe(false);
    expect(canTransition("NEEDS_REVIEW", "OUTREACH_ACTIVE")).toBe(false);
    expect(canTransition("REJECTED", "READY_FOR_OUTREACH")).toBe(false);
    expect(canTransition("QUALIFIED", "READY_FOR_OUTREACH")).toBe(true);
  });

  test("admin can pause active outreach", () => {
    expect(canTransition("OUTREACH_ACTIVE", "PAUSED")).toBe(true);
    expect(canTransition("FOLLOW_UP_DUE", "PAUSED")).toBe(true);
  });

  test("reply, bounce, unsubscribe, and signup all cancel follow-ups", () => {
    for (const s of ["REPLIED", "BOUNCED", "UNSUBSCRIBED", "SIGNUP_STARTED", "DO_NOT_CONTACT", "PAUSED"] as const) {
      expect(CANCELS_FOLLOW_UPS).toContain(s);
    }
  });

  test("converted prospects cannot be re-prospected", () => {
    expect(canTransition("CONVERTED", "READY_FOR_OUTREACH")).toBe(false);
    expect(canTransition("CONVERTED", "VERIFYING")).toBe(false);
  });
});
