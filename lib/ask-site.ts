// The Find My Mahj Game overlay on the shared Ask core: brand, the directory vocabulary that
// keeps searches out of the rules engine, and no owner-recorded overrides. Everything about
// the rules themselves lives in lib/ask-core.

import type { SiteConfig } from "@/lib/ask-core/index.ts";
import { parseAskIntent } from "@/lib/ask-intent";

// The directory intent parser decides discovery: days, times, event types, teachers. A
// tournament type with no other discovery signal is discounted when a strong rules signal is
// present, so "Can I blind pass in a tournament?" is a rules question, not a search.
export function directorySignal(q: string, strongRules: boolean): boolean {
  const intent = parseAskIntent(q);
  const tournamentOnly = intent.types?.length === 1 && intent.types[0] === "tournament";
  return intent.days.length > 0 || intent.timeOfDay !== null || (intent.types !== null && !(strongRules && tournamentOnly)) || intent.kind === "teachers";
}

export const FMG_SITE: SiteConfig = {
  site: "fmg",
  helperName: "Ask Find My Mahj",
  siteHost: "findmymahjgame.com",
  discoverySignal: directorySignal,
  overrides: [],
};

export const RULES_SUGGESTIONS = [
  { label: "Find a teacher", href: "/teachers" },
  { label: "Browse events", href: "/events" },
];

export const EVENTS_FALLBACK = "/events";
