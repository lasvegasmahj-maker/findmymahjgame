# Billing Launch Runbook

This is the exact list of steps to turn on payments for Find My Mahj Game. Everything in
the code is already built and tested, but it is switched off. Nothing charges anyone, and
every payment page politely says "Payments are not yet enabled" until you finish this
list. You can stop at any step and the site keeps working normally.

What the money side looks like when you are done: directory members pay $89 per year.
There is no promo code. The complimentary period is the app-managed 90-day Premium trial that starts automatically when a provider claims a listing; it never creates a Stripe subscription. Stripe only appears when a provider voluntarily chooses $89/year.
Players never pay anything, ever. Stripe (the payment company) holds the real financial
records; our database only keeps a copy for the admin dashboard.

## Step 1: Create the Stripe account

1. Go to https://dashboard.stripe.com/register
2. Sign up with hello@findmymahjgame.com
3. Fill in the business details Stripe asks for (business name, bank account for
   payouts, tax details). Stripe walks you through it.
4. Stay in "Test mode" (toggle at the top of the Stripe dashboard) until Step 8 says
   otherwise.

## Step 2: Create the $89 per year membership price

1. In the Stripe dashboard, go to Product catalog, then click "Add product"
2. Name: Directory Membership
3. Price: 89.00 USD, Recurring, Yearly. Create only this one price. Do not create a monthly price; monthly pricing is a post-launch decision that depends on real provider feedback.
4. Save, then click the price you just made and copy its ID. It looks like
   `price_1AbCdEfGh...`. You will paste this into Vercel in Step 4.

## Step 3: No promo code needed

The old FINDMYMAHJGAME coupon is retired (superseded by the app-managed 90-day claim trial on 2026-08-23). Do not create any coupon or promotion code; checkout is the plain $89/year price.

## Step 4: Put the four secret values into Vercel

1. Go to https://vercel.com and open the findmymahjgame project
2. Go to Settings, then Environment Variables
3. Add these four, for the Production environment:

| Name | Where to find the value |
| --- | --- |
| STRIPE_SECRET_KEY | Stripe dashboard, Developers, API keys, "Secret key" (starts with sk_) |
| STRIPE_PUBLISHABLE_KEY | Same page, "Publishable key" (starts with pk_) |
| STRIPE_PRICE_MEMBERSHIP_ANNUAL | The price ID you copied in Step 2 (starts with price_) |
| STRIPE_WEBHOOK_SECRET | You get this in Step 5 below (starts with whsec_) |

## Step 5: Tell Stripe where to send payment events

This is how our database stays in sync with Stripe automatically.

1. In Stripe, go to Developers, then Webhooks, then "Add endpoint"
2. Endpoint URL: `https://findmymahjgame.com/api/billing/webhook`
3. Select exactly these events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_failed
4. Save, then click "Reveal" under Signing secret and copy the whsec_ value
5. Paste it into Vercel as STRIPE_WEBHOOK_SECRET (Step 4 table)
6. Back in Vercel, redeploy the site so it picks up all four new values (Deployments,
   three-dot menu on the latest deployment, Redeploy)

## Step 6: Run the database migration

Ask Jason (or whoever is running migrations) to apply this file to the production
Supabase project: `supabase/migrations/2026-08-23-billing.sql`

It only creates three new tables (billing_customers, billing_subscriptions,
billing_events). It does not touch any existing table.

## Step 7: Flip the launch gate

Payments stay off until the `launch_payments` setting in the database is changed from
'false' to 'true'. Ask Jason to run this in the Supabase SQL editor:

```sql
update app_settings set value = 'true' where key = 'launch_payments';
```

To turn payments off again at any time, set it back to 'false'. The site handles that
gracefully; no deploy needed.

## Step 8: Verify before going live

Do this checklist in Stripe Test mode first (test keys in Vercel, test price, test
webhook secret), then repeat once with Live mode keys.

- [ ] Start a checkout: POST to `/api/billing/checkout` with a JSON body like
      `{"email": "you@example.com"}` and confirm you get back a Stripe checkout URL
- [ ] Open that URL and pay with Stripe's test card 4242 4242 4242 4242, any future
      expiry date, any CVC
- [ ] In Stripe, Developers, Webhooks: the endpoint shows recent deliveries with
      response 200
- [ ] In Supabase: billing_subscriptions has one new row with status `active`
- [ ] Confirm checkout shows the plain $89/year total with no promotion code field
Note (2026-08-23): the checkout entry point is built. It is the signed-in provider dashboard's Membership section; the server derives the payer's email from their auth account and binds the subscription to their own claimed, published teacher listing. Nothing client-sent can point it elsewhere, checkout refuses (with a log line) when the owned listing is missing or ambiguous rather than take money that grants nothing, and the button appears only once the Stripe env vars are set.

- [ ] At activation, confirm in Stripe TEST MODE with a QA test account (test accounts pass the payments gate while it is OFF): claim a listing, choose Premium from the dashboard, complete test checkout, and verify the webhook stamps premium_until = the paid period end on that listing and billing_subscriptions shows the active subscription. The admin Data quality panel flags any active subscription not linked to a listing
- [ ] Cancel the test subscription in Stripe and confirm the row's status updates
- [ ] Set `launch_payments` back to 'false' and confirm `/api/billing/checkout` says
      "Payments are not yet enabled" again

When the live-mode run of this checklist passes, payments are launched.

## If something goes wrong

- Any billing page saying "Payments are not yet enabled" means either the gate is
  'false' or one of the env values is missing. Both are safe states.
- If the dashboard numbers ever look wrong, Stripe is always the correct record. The
  reconcile helper in `lib/billing/reconcile.ts` lists the differences.
- Turning everything off is one database change: set `launch_payments` to 'false'.
