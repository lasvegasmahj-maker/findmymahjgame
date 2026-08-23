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

async function upsertSubscription(supabase: SupabaseClient, sub: Stripe.Subscription, eventCreated: number) {
  const customerId = refId(sub.customer);
  // A subscription event without a customer is malformed; fail loudly so Stripe
  // retries instead of writing a mirror row that joins to nothing.
  if (!customerId) throw new Error(`subscription ${sub.id} arrived without a customer reference`);

  // Stripe does not guarantee delivery order: skip if the mirror already holds
  // state from a newer event, so a delayed update cannot resurrect old status.
  const eventAt = new Date(eventCreated * 1000).toISOString();
  const { data: existing, error: readError } = await supabase
    .from("billing_subscriptions")
    .select("last_event_at")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();
  if (readError) throw new Error(`billing_subscriptions read failed: ${readError.message}`);
  if (existing?.last_event_at && existing.last_event_at >= eventAt) return;

  const { error } = await supabase.from("billing_subscriptions").upsert(
    {
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      status: sub.status,
      price_id: sub.items?.data?.[0]?.price?.id ?? null,
      current_period_end: readPeriodEnd(sub),
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      last_event_at: eventAt,
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

  // Idempotency via processing state, not row existence: the claim row is inserted
  // unprocessed, marked processed only after the handlers succeed, and a redelivery
  // of a still-unprocessed event runs the (idempotent) handlers again instead of
  // being swallowed as a duplicate. A crash between claim and completion therefore
  // cannot permanently drop an event.
  const object = event.data.object as { id?: string };
  const { error: ledgerError } = await supabase.from("billing_events").insert({
    stripe_event_id: event.id,
    type: event.type,
    payload_summary: `${event.type} ${object?.id ?? ""}`.trim(),
  });
  if (ledgerError) {
    if (ledgerError.code === "23505") {
      const { data: claim, error: claimError } = await supabase
        .from("billing_events")
        .select("processed")
        .eq("stripe_event_id", event.id)
        .maybeSingle();
      if (claimError) {
        console.error("billing/webhook: claim re-check failed", claimError.message);
        return NextResponse.json({ error: "Event could not be verified" }, { status: 500 });
      }
      if (claim?.processed) {
        return NextResponse.json({ received: true, duplicate: true });
      }
      // Unprocessed claim: an earlier attempt died mid-flight; fall through and process.
    } else {
      console.error("billing/webhook: event ledger insert failed", ledgerError.message);
      return NextResponse.json({ error: "Event could not be recorded" }, { status: 500 });
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await recordCustomer(supabase, event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertSubscription(supabase, event.data.object as Stripe.Subscription, event.created);
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
    // The claim row stays unprocessed, so Stripe's retry reprocesses instead of
    // being answered as a duplicate. Nothing to clean up, nothing to lose.
    console.error("billing/webhook: processing failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Event processing failed" }, { status: 500 });
  }

  const { error: doneError } = await supabase
    .from("billing_events")
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq("stripe_event_id", event.id);
  if (doneError) {
    // Handlers succeeded but the completion mark failed; the retry will rerun the
    // idempotent handlers and try the mark again. Report failure so Stripe retries.
    console.error("billing/webhook: completion mark failed", doneError.message);
    return NextResponse.json({ error: "Event processing incomplete" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
