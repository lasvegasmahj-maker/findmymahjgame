import type { SupabaseClient } from "@supabase/supabase-js";

// The canonical first-party event taxonomy. One list, shared by every lane; a name
// not on this list is a bug, not a new event. Extend the list in a PR, never inline.
export const EVENT_NAMES = [
  // account
  "signup_started",
  "account_created",
  "profile_completed",
  // provider
  "provider_claim_started",
  "provider_claim_submitted",
  "provider_claim_approved",
  "provider_claim_escalated",
  "provider_claim_rejected",
  "listing_created",
  "listing_updated",
  "listing_published",
  // discovery
  "search_performed",
  "zero_result_search",
  "listing_viewed",
  "directory_action",
  // ask
  "ask_submitted",
  "ask_intent_directory",
  "ask_intent_rules",
  "ask_intent_mixed",
  "ask_unverified",
  // matching
  "matching_opt_in",
  "match_request_created",
  "table_proposed",
  "table_accept",
  "table_decline",
  "table_formed",
  "seat_replacement",
  "table_cancelled",
  // billing
  "checkout_started",
  "test_payment_completed",
  "subscription_status_changed",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];
const NAME_SET = new Set<string>(EVENT_NAMES);

// Privacy boundary: props hold enumerated context only. Free text (an Ask question,
// a bio, a name) and direct identifiers never belong in analytics; aggregate counts
// answer every product question these events exist for.
const FORBIDDEN_PROP_KEYS = /^(q|question|text|query|email|name|address|phone|bio|detail|message)$/i;
const MAX_PROP_STRING = 64;

export type RecordClass = "real_external" | "test" | "internal" | "seed_demo";

// Only traffic to the real production host counts as real. Playwright, CI, local
// dev, and Vercel preview deploys all hit some other host, so their events land as
// test and can never contaminate a real analytics funnel. A signed-in test account
// still wins (it is already test). This is deterministic and needs no header the
// client could spoof into the real bucket.
const PRODUCTION_HOST = "findmymahjgame.com";

export function hostRecordClass(host: string | null | undefined): RecordClass {
  const h = (host || "").toLowerCase().split(":")[0];
  return h === PRODUCTION_HOST || h === `www.${PRODUCTION_HOST}` ? "real_external" : "test";
}

export function scrubProps(props: Record<string, unknown> | undefined): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!props) return out;
  for (const [k, v] of Object.entries(props)) {
    if (FORBIDDEN_PROP_KEYS.test(k)) continue;
    if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (typeof v === "string") out[k] = v.slice(0, MAX_PROP_STRING);
  }
  return out;
}

// Fire-and-forget: analytics must never break or slow a product path. Callers do
// not await unless they need ordering; failures are logged and swallowed.
export async function track(
  supabase: SupabaseClient,
  name: EventName,
  opts: { props?: Record<string, unknown>; sessionKey?: string | null; recordClass: RecordClass }
): Promise<void> {
  try {
    if (!NAME_SET.has(name)) {
      console.error(`analytics: unknown event name ${name}`);
      return;
    }
    const { error } = await supabase.from("analytics_events").insert({
      name,
      props: scrubProps(opts.props),
      session_key: opts.sessionKey ?? null,
      record_class: opts.recordClass,
    });
    if (error) console.error(`analytics: insert failed for ${name}:`, error.message);
  } catch (e) {
    console.error(`analytics: track failed for ${name}:`, e instanceof Error ? e.message : e);
  }
}
