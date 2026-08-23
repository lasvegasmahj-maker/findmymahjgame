import { NextRequest, NextResponse } from "next/server";
import { getStripe, isBillingConfigured, PAYMENTS_DISABLED_MESSAGE } from "@/lib/billing/stripe";
import { isLaunched } from "@/lib/launch-gates";
import { lazyServerClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { clampText, isValidEmail } from "@/lib/sanitize";

// Starts a Stripe Checkout Session for the $89/year directory membership.
// Dark until launch: requires BOTH the launch_payments gate (fails closed) and a
// configured Stripe account. Promotion codes are enabled so FINDMYMAHJGAME gives
// teachers their first period free without a separate code path here.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://findmymahjgame.com";

function paymentsDisabled() {
  return NextResponse.json({ error: PAYMENTS_DISABLED_MESSAGE }, { status: 503 });
}

export async function POST(req: NextRequest) {
  // Configuration and gate checks come before anything else so an unconfigured
  // deployment answers with a clean 503 instead of a crash.
  const priceId = process.env.STRIPE_PRICE_MEMBERSHIP_ANNUAL;
  const stripe = getStripe();
  if (!isBillingConfigured() || !stripe || !priceId) return paymentsDisabled();

  // Rate limit before the gate read so unthrottled traffic never reaches the DB.
  if (!(await rateLimit(req, "billing-checkout", 5, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const supabase = lazyServerClient();
  if (!(await isLaunched(supabase, "payments"))) return paymentsDisabled();

  const b = await req.json().catch(() => ({}));
  const email = clampText(b?.email, 254).toLowerCase();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required to start checkout." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: true,
      success_url: `${SITE}/join?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/join?checkout=cancelled`,
    });

    // Record the intent locally so the admin dashboard can see who started checkout.
    // Stripe stays the source of financial truth; this row proves nothing about payment.
    // The partial unique index on lower(email) where stripe_customer_id is null
    // makes concurrent starts collapse to one intent row; a duplicate is expected.
    const { error } = await supabase.from("billing_customers").insert({ email });
    if (error && error.code !== "23505") {
      console.error("billing/checkout: intent record failed", error.message);
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("billing/checkout: session create failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not start checkout. Please try again later." }, { status: 502 });
  }
}
