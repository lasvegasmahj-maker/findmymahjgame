import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe, PAYMENTS_DISABLED_MESSAGE } from "@/lib/billing/stripe";
import { lazyServerClient } from "@/lib/supabase-server";

// Stripe webhook receiver. This is the ONLY writer of billing_subscriptions, and it
// trusts nothing from the request except what survives signature verification: every
// field written below comes from the verified event object, never from client input.
// No launch-gate check here on purpose: signature verification is the auth, and Stripe
// must be able to deliver events (e.g. a test-mode ping) before the public gate opens.

// The subscription period end moved from the subscription to its items in newer Stripe
// API versions, so read both shapes instead of pinning to one SDK's types.
function readPeriodEnd(sub: Stripe.Subscription): string | null {
  const raw =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)
      ?.current_period_end;
  return typeof raw === "number" ? new Date(raw * 1000).toISOString() : null;
}

function refId(ref: string | { id?: string } | null | undefined): string | null {
  if (typeof ref === "string") return ref;
  return ref?.id ?? null;
}

async function upsertSubscription(supabase: SupabaseClient, sub: Stripe.Subscription) {
  const { error } = await supabase.from("billing_subscriptions").upsert(
    {
      stripe_subscription_id: sub.id,
      stripe_customer_id: refId(sub.customer) ?? "",
      status: sub.status,
      price_id: sub.items?.data?.[0]?.price?.id ?? null,
      current_period_end: readPeriodEnd(sub),
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
  if (error) throw new Error(`billing_subscriptions upsert failed: ${error.message}`);
}

async function recordCustomer(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
  const stripeCustomerId = refId(session.customer);
  const email = (session.customer_details?.email || session.customer_email || "").toLowerCase();
  if (!stripeCustomerId || !email) return;
  // Prefer completing the pre-checkout intent row (email only) over adding a second row.
  const { data: intent } = await supabase
    .from("billing_customers").select("id")
    .eq("email", email).is("stripe_customer_id", null).limit(1).maybeSingle();
  const { error } = intent
    ? await supabase.from("billing_customers")
        .update({ stripe_customer_id: stripeCustomerId }).eq("id", intent.id)
    : await supabase.from("billing_customers").upsert(
        { email, stripe_customer_id: stripeCustomerId },
        { onConflict: "stripe_customer_id" }
      );
  if (error) throw new Error(`billing_customers write failed: ${error.message}`);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();
  // Fail closed: without the verification secret no event can be authenticated,
  // so nothing may be processed or acknowledged.
  if (!secret || !stripe) {
    return NextResponse.json({ error: PAYMENTS_DISABLED_MESSAGE }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  // Signature verification needs the exact raw bytes Stripe signed, so the body is
  // read as text and never JSON-parsed before verification.
  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  const supabase = lazyServerClient();

  // Idempotency: the unique stripe_event_id makes Stripe redeliveries no-ops.
  const object = event.data.object as { id?: string };
  const { error: ledgerError } = await supabase.from("billing_events").insert({
    stripe_event_id: event.id,
    type: event.type,
    payload_summary: `${event.type} ${object?.id ?? ""}`.trim(),
  });
  if (ledgerError) {
    if (ledgerError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("billing/webhook: event ledger insert failed", ledgerError.message);
    return NextResponse.json({ error: "Event could not be recorded" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await recordCustomer(supabase, event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertSubscription(supabase, event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed": {
        // Mark the failure immediately; the authoritative status still arrives via
        // the customer.subscription.updated event that follows.
        const inv = event.data.object as unknown as {
          subscription?: string | { id?: string };
          parent?: { subscription_details?: { subscription?: string | { id?: string } } };
        };
        const subId = refId(inv.subscription) ?? refId(inv.parent?.subscription_details?.subscription);
        if (subId) {
          const { error } = await supabase
            .from("billing_subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subId);
          if (error) throw new Error(`payment_failed update failed: ${error.message}`);
        }
        break;
      }
      default:
        // Unsubscribed event types are ledgered above and otherwise ignored.
        break;
    }
  } catch (e) {
    // Release the idempotency claim so Stripe's retry is not swallowed as a duplicate.
    await supabase.from("billing_events").delete().eq("stripe_event_id", event.id);
    console.error("billing/webhook: processing failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Event processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
