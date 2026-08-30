import type { SupabaseClient } from "@supabase/supabase-js";
import { isBillingConfigured } from "./stripe";

// Revenue metrics for the future admin revenue section, computed from the local
// billing_subscriptions mirror. Stripe remains the source of financial truth: these
// numbers are a convenience read of the webhook-maintained mirror, and any dispute is
// settled by Stripe (see lib/billing/reconcile.ts), never by this function.

// Stripe's subscription status vocabulary for "currently entitled": active covers paying
// members, trialing covers a free first period. Everything else earns no revenue.
const REVENUE_STATUSES = ["active", "trialing"];

export type RevenueMetrics = {
  configured: boolean;
  payingCustomers: number;
  mrrCents: number;
  arrCents: number;
  failedPayments: number;
  cancellations: number;
};

const ZERO: Omit<RevenueMetrics, "configured"> = {
  payingCustomers: 0,
  mrrCents: 0,
  arrCents: 0,
  failedPayments: 0,
  cancellations: 0,
};

// Amounts in cents keyed by Stripe price id. The only approved price is the $89/year
// Find My Mahj Premium (8900 cents); its Stripe price id arrives via env so the map can
// be built without hardcoding an account-specific id in the repo. Unknown price ids
// count as zero rather than guessing.
function priceAmounts(): Record<string, number> {
  const map: Record<string, number> = {};
  const annual = process.env.STRIPE_PRICE_MEMBERSHIP_ANNUAL;
  if (annual) map[annual] = 8900;
  return map;
}

export async function readRevenueMetrics(supabase: SupabaseClient): Promise<RevenueMetrics> {
  if (!isBillingConfigured()) return { configured: false, ...ZERO };

  // Only real_external rows count: QA, internal, and seed subscriptions must never
  // appear as revenue (the data-trust rule from 2026-08-22-data-trust.sql).
  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("status, price_id, cancel_at_period_end, stripe_customer_id")
    .eq("record_class", "real_external");
  // Same rule as lib/data-trust.ts: a failed read means the numbers are missing,
  // not zero. Zero revenue during an outage would be a fake number.
  if (error || !data) throw new Error(`billing_subscriptions read failed: ${error?.message ?? "no data"}`);

  const amounts = priceAmounts();
  const revenueRows = data.filter((r) => REVENUE_STATUSES.includes(r.status));
  const payingCustomers = new Set(revenueRows.map((r) => r.stripe_customer_id)).size;
  const arrCents = revenueRows.reduce((sum, r) => sum + (amounts[r.price_id ?? ""] ?? 0), 0);
  // Every live price is annual, so MRR is the annual run rate spread over 12 months.
  const mrrCents = Math.round(arrCents / 12);
  const failedPayments = data.filter((r) => r.status === "past_due" || r.status === "unpaid").length;
  // Cancelled outright, plus members who have turned off renewal but are still inside
  // their paid year (churn the owner should see coming).
  const cancellations = data.filter(
    (r) => r.status === "canceled" || (REVENUE_STATUSES.includes(r.status) && r.cancel_at_period_end)
  ).length;

  return { configured: true, payingCustomers, mrrCents, arrCents, failedPayments, cancellations };
}
