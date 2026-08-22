import type { ReplyClassification } from "@/lib/reply-classifier";

// The policy layer owns what a classification is ALLOWED to cause. Its action vocabulary
// contains no send of any kind, so no classifier output, human or model, can emit email
// through this path; an eventual auto-reply capability would be a separate, gated system.

export type ReplyAction =
  | "suppress"
  | "cancel_followups"
  | "set_state_replied"
  | "set_state_interested"
  | "set_state_question"
  | "set_state_not_interested"
  | "set_state_wrong_contact"
  | "set_state_bounced"
  | "set_state_unsubscribed"
  | "freshness_review_listing"
  | "queue_human_review";

export const REPLY_ACTION_VOCABULARY: readonly ReplyAction[] = [
  "suppress",
  "cancel_followups",
  "set_state_replied",
  "set_state_interested",
  "set_state_question",
  "set_state_not_interested",
  "set_state_wrong_contact",
  "set_state_bounced",
  "set_state_unsubscribed",
  "freshness_review_listing",
  "queue_human_review",
] as const;

// Suppression dominance: any unsubscribe signal suppresses regardless of the classification
// that carried it, and low confidence routes to a person. Erring toward suppression can only
// ever cause us to email someone less.
export function replyActions(c: ReplyClassification): ReplyAction[] {
  const actions = new Set<ReplyAction>();
  if (c.unsubscribeSignal) {
    actions.add("suppress");
    actions.add("cancel_followups");
  }
  if (c.freshnessSignal) actions.add("freshness_review_listing");

  switch (c.classification) {
    case "UNSUBSCRIBE":
      actions.add("suppress").add("cancel_followups").add("set_state_unsubscribed");
      break;
    case "BOUNCE_OR_DELIVERY_FAILURE":
      actions.add("suppress").add("cancel_followups").add("set_state_bounced");
      break;
    case "WRONG_PERSON":
      actions.add("suppress").add("cancel_followups").add("set_state_wrong_contact").add("queue_human_review");
      break;
    case "NOT_INTERESTED":
      actions.add("cancel_followups").add("set_state_not_interested");
      break;
    case "INTERESTED":
      actions.add("cancel_followups").add("set_state_replied");
      if (c.confidence === "high") actions.add("set_state_interested");
      actions.add("queue_human_review");
      break;
    case "NEEDS_INFO":
      actions.add("cancel_followups").add("set_state_replied").add("set_state_question").add("queue_human_review");
      break;
    case "OUT_OF_OFFICE":
      break;
    case "AMBIGUOUS":
    case "HUMAN_REVIEW_REQUIRED":
      actions.add("cancel_followups");
      actions.add("queue_human_review");
      break;
  }

  if (c.confidence === "low" && c.classification !== "UNSUBSCRIBE" && c.classification !== "BOUNCE_OR_DELIVERY_FAILURE") {
    // A low-confidence read must not change prospect state; the person decides.
    for (const a of [...actions]) {
      if (a.startsWith("set_state") && a !== "set_state_unsubscribed" && a !== "set_state_bounced") actions.delete(a);
    }
    actions.add("queue_human_review");
  }
  return [...actions];
}
