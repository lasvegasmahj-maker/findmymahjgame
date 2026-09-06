// Player-facing status labels. Derived from the canonical entry, never chosen by a model. Kept
// dependency-free so a client bundle can import the text without pulling in the corpus.

export type AskLabel =
  | "standard"
  | "house"
  | "tournament"
  | "etiquette"
  | "strategy"
  | "pending"
  | "card"
  | "unverified"
  | "clarify"
  | "chat";

export const LABEL_TEXT: Record<AskLabel, string> = {
  standard: "Standard rule",
  house: "Can vary by house rule",
  tournament: "Tournament rule",
  etiquette: "Etiquette",
  strategy: "Strategy, not a rule",
  pending: "Pending instructor review",
  card: "Depends on the annual card",
  unverified: "Not verified",
  clarify: "Quick check",
  chat: "",
};

// Shown under a pending answer on both sites.
export const PENDING_NOTE = "Our instructor is reviewing this answer.";
