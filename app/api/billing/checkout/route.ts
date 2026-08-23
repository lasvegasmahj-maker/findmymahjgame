import { NextRequest, NextResponse } from "next/server";
import { getStripe, isBillingConfigured, PAYMENTS_DISABLED_MESSAGE } from "@/lib/billing/stripe";
import { isLaunched, canUseDarkFeature } from "@/lib/launch-gates";
import { lazyServerClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";

// Starts a Stripe Checkout Session for the $89/year Premium membership.
// Dark until launch: requires a configured Stripe account AND the launch_payments
// gate (test-classified accounts pass while the gate is OFF, per the shared
// dark-launch rule, so activation can be rehearsed in Stripe test mode).
//
// The payer is the SIGNED-IN PROVIDER, never a request body: their email comes
// from their auth account and the listing their payment extends is their own
// claimed, published teacher listing, both resolved server-side. Nothing the
// client sends can point the subscription at someone else's listing. If the
// owned listing cannot be determined unambiguously, checkout REFUSES rather
// than take money that would grant nothing.
//
// No promotion codes: the old free-period coupon is retired, and the
// complimentary period is the app-managed 90-day claim trial, which never
// creates a Stripe subscription. Checkout is the plain $89/year price.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://findmymahjgame.com";

function paymentsDisabled() {
  return NextResponse.json({ error: PAYMENTS_DISABLED_MESSAGE }, { status: 503 });
}

export async function POST(req: NextRequest) {
  // Configuration checks come before anything else so an unconfigured
  // deployment answers with a clean 503 instead of a crash.
  const priceId = process.env.STRIPE_PRICE_MEMBERSHIP_ANNUAL;
  const stripe = getStripe();
  if (!isBillingConfigured() || !stripe || !priceId) return paymentsDisabled();

  // Rate limit before any DB read so unthrottled traffic never reaches it.
  if (!(await rateLimit(req, "billing-checkout", 5, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Sign in to choose Premium." }, { status: 401 });
  }

  const supabase = lazyServerClient();
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("record_class, deactivated_at")
    .eq("id", session.userId)
    .maybeSingle();
  if (profileErr) {
    console.error("billing/checkout: profile read failed:", profileErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!profile) return NextResponse.json({ error: "Sign in to choose Premium." }, { status: 401 });
  if (profile.deactivated_at) return NextResponse.json({ error: "Account deactivated" }, { status: 403 });

  const launched = await isLaunched(supabase, "payments");
  if (!canUseDarkFeature(launched, profile.record_class)) return paymentsDisabled();

  // The payer's email is auth-account truth, never client input.
  let email = "";
  try {
    const { data: owner } = await supabase.auth.admin.getUserById(session.userId);
    email = (owner?.user?.email || "").toLowerCase();
  } catch (e) {
    console.error("billing/checkout: account lookup failed:", e instanceof Error ? e.message : e);
  }
  if (!email) {
    return NextResponse.json({ error: "We could not confirm your account email. Please try again." }, { status: 500 });
  }

  // The listing this payment extends: the payer's own claimed, published teacher
  // listing. Premium surfaces exist only on venue (teacher) listings today.
  const { data: owned, error: ownedErr } = await supabase
    .from("venue_listings")
    .select("id")
    .eq("account_id", session.userId)
    .eq("status", "published");
  if (ownedErr) {
    console.error("billing/checkout: owned listing read failed:", ownedErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!owned || owned.length === 0) {
    return NextResponse.json(
      { error: "Premium extends your claimed teacher listing. Claim your listing first, then choose Premium." },
      { status: 409 }
    );
  }
  if (owned.length > 1) {
    // Refuse rather than guess or take money that binds to nothing; a person
    // resolves which listing the membership is for.
    console.error(`billing/checkout: ambiguous listing binding for account ${session.userId} (${owned.length} published venue listings)`);
    return NextResponse.json(
      { error: "You own more than one listing. Email hello@findmymahjgame.com and we will set up Premium on the right one." },
      { status: 409 }
    );
  }
  const listingId = String(owned[0].id);

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: false,
      // The reference rides on the SUBSCRIPTION metadata so every subscription
      // webhook event carries it and can extend this listing's premium_until.
      subscription_data: { metadata: { listing_table: "venue_listings", listing_id: listingId } },
      success_url: `${SITE}/provider?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/provider?checkout=cancelled`,
    });

    // Record the intent locally so the admin dashboard can see who started checkout.
    // Stripe stays the source of financial truth; this row proves nothing about payment.
    // The partial unique index on lower(email) where stripe_customer_id is null
    // makes concurrent starts collapse to one intent row; a duplicate is expected.
    const { error } = await supabase.from("billing_customers").insert({ email });
    if (error && error.code !== "23505") {
      console.error("billing/checkout: intent record failed", error.message);
    }

    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    console.error("billing/checkout: session create failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not start checkout. Please try again later." }, { status: 502 });
  }
}
