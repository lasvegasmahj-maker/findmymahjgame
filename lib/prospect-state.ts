// The prospect state machine. The database column carries the state; this module is the
// single authority on which transitions are legal. Agents and admin routes must go through
// transitionProspect, which enforces the map and appends an immutable audit event, so an
// LLM can propose a transition but can never perform one the map forbids.

export const PROSPECT_STATES = [
  "DISCOVERED",
  "VERIFYING",
  "QUALIFIED",
  "NEEDS_REVIEW",
  "REJECTED",
  "READY_FOR_OUTREACH",
  "OUTREACH_ACTIVE",
  "FOLLOW_UP_DUE",
  "REPLIED",
  "INTERESTED",
  "QUESTION",
  "ONBOARDING",
  "SIGNUP_STARTED",
  "LISTING_SUBMITTED",
  "CONVERTED",
  "NOT_INTERESTED",
  "WRONG_CONTACT",
  "BOUNCED",
  "INVALID_CONTACT",
  "UNSUBSCRIBED",
  "DO_NOT_CONTACT",
  "PAUSED",
] as const;

export type ProspectState = (typeof PROSPECT_STATES)[number];

const OUTREACH_STATES: ProspectState[] = [
  "READY_FOR_OUTREACH",
  "OUTREACH_ACTIVE",
  "FOLLOW_UP_DUE",
];

// UNSUBSCRIBED and DO_NOT_CONTACT are terminal for outreach: no transition out of them
// exists except the explicit manual DO_NOT_CONTACT confirmation, and never back toward
// any outreach state.
const TRANSITIONS: Record<ProspectState, ProspectState[]> = {
  DISCOVERED: ["VERIFYING", "REJECTED", "DO_NOT_CONTACT"],
  VERIFYING: ["QUALIFIED", "NEEDS_REVIEW", "REJECTED", "DO_NOT_CONTACT"],
  QUALIFIED: ["READY_FOR_OUTREACH", "NEEDS_REVIEW", "REJECTED", "DO_NOT_CONTACT", "PAUSED"],
  NEEDS_REVIEW: ["QUALIFIED", "REJECTED", "VERIFYING", "DO_NOT_CONTACT"],
  REJECTED: ["VERIFYING", "DO_NOT_CONTACT"],
  READY_FOR_OUTREACH: ["OUTREACH_ACTIVE", "PAUSED", "NEEDS_REVIEW", "DO_NOT_CONTACT"],
  OUTREACH_ACTIVE: [
    "FOLLOW_UP_DUE",
    "REPLIED",
    "BOUNCED",
    "UNSUBSCRIBED",
    "SIGNUP_STARTED",
    "PAUSED",
    "DO_NOT_CONTACT",
  ],
  FOLLOW_UP_DUE: [
    "OUTREACH_ACTIVE",
    "REPLIED",
    "BOUNCED",
    "UNSUBSCRIBED",
    "SIGNUP_STARTED",
    "PAUSED",
    "DO_NOT_CONTACT",
  ],
  REPLIED: ["INTERESTED", "QUESTION", "NOT_INTERESTED", "WRONG_CONTACT", "NEEDS_REVIEW", "UNSUBSCRIBED", "DO_NOT_CONTACT"],
  INTERESTED: ["ONBOARDING", "NEEDS_REVIEW", "DO_NOT_CONTACT"],
  QUESTION: ["INTERESTED", "NOT_INTERESTED", "NEEDS_REVIEW", "DO_NOT_CONTACT"],
  ONBOARDING: ["SIGNUP_STARTED", "NOT_INTERESTED", "PAUSED", "DO_NOT_CONTACT"],
  SIGNUP_STARTED: ["LISTING_SUBMITTED", "PAUSED", "DO_NOT_CONTACT"],
  LISTING_SUBMITTED: ["CONVERTED", "NEEDS_REVIEW", "DO_NOT_CONTACT"],
  CONVERTED: ["DO_NOT_CONTACT"],
  NOT_INTERESTED: ["DO_NOT_CONTACT"],
  WRONG_CONTACT: ["VERIFYING", "REJECTED", "DO_NOT_CONTACT"],
  BOUNCED: ["INVALID_CONTACT", "NEEDS_REVIEW", "DO_NOT_CONTACT"],
  INVALID_CONTACT: ["VERIFYING", "DO_NOT_CONTACT"],
  UNSUBSCRIBED: ["DO_NOT_CONTACT"],
  DO_NOT_CONTACT: [],
  PAUSED: ["READY_FOR_OUTREACH", "QUALIFIED", "NEEDS_REVIEW", "REJECTED", "DO_NOT_CONTACT"],
};

export function canTransition(from: ProspectState, to: ProspectState): boolean {
  // Admin can pause any active pipeline state, and anything can be barred from contact.
  if (to === "DO_NOT_CONTACT") return from !== "DO_NOT_CONTACT";
  if (to === "PAUSED") return OUTREACH_STATES.includes(from) || TRANSITIONS[from]?.includes("PAUSED") || false;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function isOutreachState(s: ProspectState): boolean {
  return OUTREACH_STATES.includes(s);
}

// States from which any pending follow-up must be cancelled immediately on entry.
export const CANCELS_FOLLOW_UPS: ProspectState[] = [
  "REPLIED",
  "INTERESTED",
  "QUESTION",
  "NOT_INTERESTED",
  "WRONG_CONTACT",
  "ONBOARDING",
  "SIGNUP_STARTED",
  "LISTING_SUBMITTED",
  "CONVERTED",
  "BOUNCED",
  "INVALID_CONTACT",
  "UNSUBSCRIBED",
  "DO_NOT_CONTACT",
  "PAUSED",
];
