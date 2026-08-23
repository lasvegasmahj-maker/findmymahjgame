import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { isQaEmail } from "@/lib/launch-gates";

// The canonical transactional notification taxonomy. Every platform-initiated
// email goes through notify() so the ledger is complete; a send that bypasses this
// wrapper is invisible to the admin and to the launch simulator, which makes it a bug.
// These are transactional messages the product cannot operate without; marketing
// stays in Mailchimp with its own consent and unsubscribe machinery.
export const NOTIFICATION_KINDS = [
  // account
  "account_signin_link",
  "account_security",
  "account_deactivated",
  "account_deletion",
  // provider
  "claim_received",
  "claim_approved",
  "claim_needs_info",
  "claim_rejected",
  "listing_status",
  "membership_billing_status",
  // matching
  "match_table_proposed",
  "match_player_accepted",
  "match_table_confirmed",
  "match_seat_reopened",
  "match_cancelled",
  "match_table_changed",
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
const KIND_SET = new Set<string>(NOTIFICATION_KINDS);

export type NotifyArgs = {
  to: string;
  userId?: string | null;
  kind: NotificationKind;
  subject: string;
  html: string;
  related?: { table: string; id: string };
  recordClass: "real_external" | "test" | "internal" | "seed_demo";
};

// Sends one transactional email and records it. QA addresses (@fmg-qa.test) are
// unroutable by design, so QA sends are ledgered as skipped_qa without touching the
// mail provider; the simulator asserts against the ledger, not an inbox.
// Never throws: a notification failure is recorded and surfaced, not propagated
// into the product flow that triggered it.
export async function notify(supabase: SupabaseClient, args: NotifyArgs): Promise<{ ok: boolean; status: string }> {
  let status = "sent";
  let error: string | undefined;
  try {
    if (!KIND_SET.has(args.kind)) {
      console.error(`notify: unknown kind ${args.kind}`);
      return { ok: false, status: "failed" };
    }
    if (isQaEmail(args.to)) {
      status = "skipped_qa";
    } else {
      const sent = await sendEmail({ kind: `notify-${args.kind}`, to: args.to, subject: args.subject, html: args.html });
      if (!sent.ok) {
        status = "failed";
        error = sent.error;
      }
    }
  } catch (e) {
    status = "failed";
    error = e instanceof Error ? e.message : String(e);
  }
  try {
    await supabase.from("notifications_log").insert({
      user_id: args.userId ?? null,
      email: args.to,
      kind: args.kind,
      subject: args.subject,
      status,
      error: error ?? null,
      related_table: args.related?.table ?? null,
      related_id: args.related?.id ?? null,
      record_class: args.recordClass,
    });
  } catch (e) {
    console.error("notify: ledger write failed:", e instanceof Error ? e.message : e);
  }
  if (status === "failed") console.error(`notify[${args.kind}] failed:`, error);
  return { ok: status !== "failed", status };
}
