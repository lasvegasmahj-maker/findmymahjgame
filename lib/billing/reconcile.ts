import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe, isBillingConfigured } from "./stripe";

// Reconciliation between Stripe (the source of financial truth) and the local
// billing_subscriptions mirror. The webhook keeps the mirror current, but webhooks can
// be missed or delivered out of order, so this diff exists to catch drift before the
// admin revenue section reports a wrong number.
//
// NOT SCHEDULED anywhere on purpose. How to run it, when the time comes:
//   - ad hoc: call reconcileSubscriptions(lazyServerClient()) from a one-off script or
//     an admin-authenticated API route and review the discrepancies array;
//   - later: wire it into the admin dashboard's revenue section, or a cron route
//     following the lib/cron-auth.ts pattern, once payments are live and there is
//     revenue worth reconciling.
// Resolution is always the same direction: Stripe wins. Fix the mirror row (or replay
// the missed webhook event from the Stripe dashboard), never the Stripe record.

export type SubscriptionDiscrepancy = {
  stripeSubscriptionId: string;
  issue: "missing_locally" | "missing_in_stripe" | "status_mismatch";
  stripeStatus?: string;
  localStatus?: string;
};

export type ReconcileResult = {
  configured: boolean;
  checkedAt: string;
  stripeCount: number;
  localCount: number;
  discrepancies: SubscriptionDiscrepancy[];
};

export async function reconcileSubscriptions(supabase: SupabaseClient): Promise<ReconcileResult> {
  const checkedAt = new Date().toISOString();
  const stripe = getStripe();
  if (!isBillingConfigured() || !stripe) {
    return { configured: false, checkedAt, stripeCount: 0, localCount: 0, discrepancies: [] };
  }

  // status: "all" so subscriptions cancelled in Stripe but still active in the mirror
  // surface as mismatches instead of vanishing from the comparison.
  const stripeSubs = new Map<string, string>();
  for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
    stripeSubs.set(sub.id, sub.status);
  }

  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("stripe_subscription_id, status");
  if (error) throw new Error(`reconcile: could not read billing_subscriptions: ${error.message}`);
  const local = new Map((data ?? []).map((r) => [r.stripe_subscription_id as string, r.status as string]));

  const discrepancies: SubscriptionDiscrepancy[] = [];
  for (const [id, stripeStatus] of stripeSubs) {
    const localStatus = local.get(id);
    if (localStatus === undefined) {
      discrepancies.push({ stripeSubscriptionId: id, issue: "missing_locally", stripeStatus });
    } else if (localStatus !== stripeStatus) {
      discrepancies.push({ stripeSubscriptionId: id, issue: "status_mismatch", stripeStatus, localStatus });
    }
  }
  for (const [id, localStatus] of local) {
    if (!stripeSubs.has(id)) {
      discrepancies.push({ stripeSubscriptionId: id, issue: "missing_in_stripe", localStatus });
    }
  }

  return {
    configured: true,
    checkedAt,
    stripeCount: stripeSubs.size,
    localCount: local.size,
    discrepancies,
  };
}
