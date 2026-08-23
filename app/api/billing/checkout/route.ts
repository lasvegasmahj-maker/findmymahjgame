import { NextRequest, NextResponse } from "next/server";
import { getStripe, isBillingConfigured, PAYMENTS_DISABLED_MESSAGE } from "@/lib/billing/stripe";
import { isLaunched } from "@/lib/launch-gates";
import { lazyServerClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { clampText, isValidEmail } from "@/lib/sanitize";

// Starts a Stripe Checkout Session for the $89/year directory membership.
// Dark until launch: requires BOTH the launch_payments gate (fails closed) and a
// configured Stripe account. No promotion codes: the old free-period coupon is
// retired, and the complimentary period is the app-managed 90-day trial, which
// never creates a Stripe subscription. Checkout is the plain $89/year price.

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

  const b = (await req.json().catch(() => null)) || {};
  const email = clampText(b?.email, 254).toLowerCase();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required to start checkout." }, { status: 400 });
  }

  // Optional listing reference so payment can extend that listing's premium_until.
  // Scoped to teacher (venue) listings, the only place Premium surfaces exist, and
  // BOUND TO THE PAYER: the reference is kept only when the listing is claimed and
  // the checkout email matches the owning account's email, so a stranger can never
  // stamp a paid entitlement onto someone else's listing. An invalid or unowned
  // reference is dropped rather than failing checkout. The reference rides on the
  // SUBSCRIPTION metadata so every subscription webhook event carries it.
  let listingTable: string | null = null;
  let listingId: string | null = null;
  const rawTable = String(b?.listingTable || "");
  const rawId = clampText(b?.listingId, 64);
  if (rawTable === "venue_listings" && /^[0-9a-f-]{36}$/i.test(rawId)) {
    const { data: row } = await supabase.from(rawTable).select("id, account_id").eq("id", rawId).eq("status", "published").maybeSingle();
    if (row?.account_id) {
      try {
        const { data: owner } = await supabase.auth.admin.getUserById(String(row.account_id));
        if (owner?.user?.email?.toLowerCase() === email) {
          listingTable = rawTable;
          listingId = rawId;
        }
      } catch (e) {
        console.error("billing/checkout: owner lookup failed", e instanceof Error ? e.message : e);
      }
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: false,
      subscription_data: listingTable && listingId ? { metadata: { listing_table: listingTable, listing_id: listingId } } : undefined,
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
