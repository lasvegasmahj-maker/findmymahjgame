// Which mahjong a listing actually plays.
//
// The public directory is American mahjong only, and it has no player-facing way to say
// otherwise, so a riichi or Guangdong game published here would send someone to a table they
// cannot sit at. This module holds the vocabulary and the one rule that matters: only a
// source-confirmed American entity may be published. UNKNOWN is a real answer, never a
// synonym for American, and non-American research is kept rather than discarded so a
// multi-variant product stays possible later.

export const MAHJONG_VARIANTS = [
  "AMERICAN",
  "AMERICAN_NON_NMJL",
  "RIICHI",
  "SICHUAN",
  "GUANGDONG",
  "CHINESE_OTHER",
  "OTHER",
  "UNKNOWN",
] as const;

export type MahjongVariant = (typeof MAHJONG_VARIANTS)[number];

export const VARIANT_CONFIDENCES = ["high", "medium", "low"] as const;
export type VariantConfidence = (typeof VARIANT_CONFIDENCES)[number];

export function isMahjongVariant(v: unknown): v is MahjongVariant {
  return typeof v === "string" && (MAHJONG_VARIANTS as readonly string[]).includes(v);
}

export function normalizeVariant(v: unknown): MahjongVariant {
  return isMahjongVariant(v) ? v : "UNKNOWN";
}

// The publication gate. A listing may only go in front of players when a source states
// American play; medium confidence is allowed because sources rarely say "NMJL" outright, but
// low confidence is a guess and a guess is not evidence.
export function canPublishToAmericanDirectory(
  variant: unknown,
  confidence?: unknown
): { allowed: boolean; reason: string } {
  const v = normalizeVariant(variant);
  if (v === "UNKNOWN") return { allowed: false, reason: "variant is unknown, and unknown is never assumed to be American" };
  // Same 152 tile American set, jokers and racks; only the card differs. The directory covers
  // NMJL play, so these are real American mahjong it does not cover yet, not a foreign game.
  if (v === "AMERICAN_NON_NMJL") return { allowed: false, reason: "plays an American card this directory does not cover yet" };
  if (v !== "AMERICAN") return { allowed: false, reason: `plays ${variantLabel(v)}, which this directory cannot represent to players` };
  if (confidence === "low") return { allowed: false, reason: "American read rests on low confidence evidence" };
  return { allowed: true, reason: "source confirmed American mahjong" };
}

export function variantLabel(v: unknown): string {
  switch (normalizeVariant(v)) {
    case "AMERICAN": return "American Mahjong";
    case "AMERICAN_NON_NMJL": return "American Mahjong, non-NMJL card";
    case "RIICHI": return "Japanese riichi";
    case "SICHUAN": return "Sichuan style";
    case "GUANGDONG": return "Guangdong style";
    case "CHINESE_OTHER": return "Chinese style";
    case "OTHER": return "another variant";
    default: return "variant not stated";
  }
}

// A game a player cannot join is not player value. Silence about whether outsiders may
// attend is treated as no, because a residents-only or members-only program that never says
// so is exactly the case a player would waste a trip on.
export function canPlayerJoin(
  outsidePlayersWelcome: unknown,
  publicOrPrivate?: unknown
): { allowed: boolean; reason: string } {
  if (publicOrPrivate === "PRIVATE_RESIDENCE") {
    return { allowed: false, reason: "a private home game goes through the private game policy, not the normal path" };
  }
  if (outsidePlayersWelcome === "YES_EXPLICIT" || outsidePlayersWelcome === "YES_IMPLIED") {
    return { allowed: true, reason: "a source shows outside players may attend" };
  }
  return { allowed: false, reason: "no source shows a player from outside may attend" };
}
