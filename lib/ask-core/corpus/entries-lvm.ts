// Canonical entries that originate from Las Vegas Mahjong (lib/ask/knowledge.ts and the
// content/rules page modules at 58b6999). Answers are verbatim page text or owner-approved
// wording; nothing is edited here. Patterns are written against the shared matcher dialect
// (natural English, case-insensitive, plural-tolerant) so both sites route identically.

import type { CanonicalRule } from "./types.ts";
import { LVM_CALLING } from "./entries-lvm-calling.ts";
import { LVM_CHARLESTON } from "./entries-lvm-charleston.ts";
import { LVM_DEADWIN } from "./entries-lvm-deadwin.ts";
import { LVM_JOKERS } from "./entries-lvm-jokers.ts";
import { LVM_CARDSCORING } from "./entries-lvm-cardscoring.ts";

export const LVM_ENTRIES: CanonicalRule[] = [
  ...LVM_CALLING,
  ...LVM_CHARLESTON,
  ...LVM_DEADWIN,
  ...LVM_JOKERS,
  ...LVM_CARDSCORING,
];
