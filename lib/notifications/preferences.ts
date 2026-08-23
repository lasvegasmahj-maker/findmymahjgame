import type { SupabaseClient } from "@supabase/supabase-js";
import { NOTIFICATION_KINDS, type NotificationKind } from "@/lib/notifications/notify";

// v1 preference model, deliberately minimal. Every kind in NOTIFICATION_KINDS is a
// transactional service message tied to something the recipient did or something the
// product needs to tell them to keep working (a sign-in link, a claim decision, a
// match invite, a billing problem). None of them are marketing. CAN-SPAM and CASL both
// carve transactional and relationship messages out of the unsubscribe/consent rules
// that apply to advertising, so nothing here legally needs an opt-out. The one
// marketing channel this product has, the newsletter, lives entirely in Mailchimp
// with its own consent and unsubscribe flow and never touches this taxonomy.
//
// Read docs/notifications-audit.md section 3 and 4 for the full reasoning.

const TRANSACTIONAL_KINDS = new Set<string>(NOTIFICATION_KINDS);

export function isTransactional(kind: NotificationKind): boolean {
  return TRANSACTIONAL_KINDS.has(kind);
}

export type PreferenceResult = "send" | "skip";

// A documented seam for a future preference store, not a stub hiding a real one:
// no notification_preferences or user_notification_preferences table exists in the
// live database today (checked directly, see the audit). notifications_log.status
// already allows a skipped_pref value, but notify.ts does not call this function and
// never writes that status; wiring it in is a one-line change in notify.ts, left to
// whoever owns that file since it is frozen for this lane.
//
// Because every current kind is transactional (isTransactional() above always
// returns true for a valid kind), this always returns "send". It only becomes
// meaningful once a kind exists that a user may legitimately opt out of, and no
// such kind exists yet.
export async function checkPreference(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  kind: NotificationKind
): Promise<PreferenceResult> {
  void supabase;
  void userId;
  void kind;
  return "send";
}
