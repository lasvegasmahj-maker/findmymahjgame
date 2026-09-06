// The canonical corpus: every rule both sites serve, in one list. Order is the tie-break of
// last resort in retrieval, so entries that originate from the gate-hardened Find My Mahj set
// come first and the entries ported from Las Vegas Mahjong follow.

import type { CanonicalRule } from "./types.ts";
import { FMG_ENTRIES } from "./entries-fmg.ts";
import { LVM_ENTRIES } from "./entries-lvm.ts";

export const RULES_KNOWLEDGE: CanonicalRule[] = [...FMG_ENTRIES, ...LVM_ENTRIES];

export const KNOWLEDGE_BY_ID: ReadonlyMap<string, CanonicalRule> = new Map(RULES_KNOWLEDGE.map((e) => [e.id, e]));

// Former ids from either site. Chips, tests, stored history, and clarification payloads that
// still carry an old id resolve to the canonical entry.
export const ALIASES: ReadonlyMap<string, string> = new Map(
  RULES_KNOWLEDGE.flatMap((e) => (e.aliases ?? []).map((a) => [a, e.id] as [string, string])),
);

export function resolveId(id: string): string {
  return KNOWLEDGE_BY_ID.has(id) ? id : (ALIASES.get(id) ?? id);
}

export function entryById(id: string | undefined | null): CanonicalRule | undefined {
  if (!id) return undefined;
  return KNOWLEDGE_BY_ID.get(resolveId(id));
}

// Entries the owner has not signed off. Both sites show them with the review badge and serve
// them word for word. Derived from approval state, never from a hand-kept list, so promoting an
// entry is one field change in one place.
export function isPending(e: CanonicalRule): boolean {
  return e.approval !== "owner_approved";
}

export const PENDING_IDS: readonly string[] = RULES_KNOWLEDGE.filter(isPending).map((e) => e.id);

// The League publishes a new card every spring. Update this constant when the new card
// releases; a test fails if it falls more than a year behind the calendar.
export const CURRENT_CARD_YEAR = 2026;
