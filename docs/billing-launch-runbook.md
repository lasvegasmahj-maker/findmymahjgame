# Billing Launch Runbook

This is the exact list of steps to turn on payments for Find My Mahj Game. Everything in
the code is already built and tested, but it is switched off. Nothing charges anyone, and
every payment page politely says "Payments are not yet enabled" until you finish this
list. You can stop at any step and the site keeps working normally.

What the money side looks like when you are done: directory members pay $89 per year.
There is no promo code. The complimentary period is the app-managed 90-day Premium trial that starts automatically when a provider claims a listing; it never creates a Stripe subscription. Stripe only appears when a provider voluntarily chooses $89/year.
Players never pay anything, ever. Stripe (the payment company) holds the real financial
records; our database only keeps a copy for the admin dashboard.

## Status 2026-08-29

Done in sandbox: Steps 1 through 6 and every Step 8 checklist item, in test mode on
production with a QA account.

Cancel event (customer.subscription.deleted): exercised 2026-08-29 in the connected
sandbox (FindMyMahj sandbox); four events, four 200s, four canceled test rows. No
automated test covers it yet.

Owner step before live mode: DONE 2026-08-29 (the four leftover QA subscriptions were
canceled and their mirrored rows removed). When working in Stripe, use the sandbox
named FindMyMahj sandbox; a sibling sandbox named Las Vegas Mahjong is not connected.

Terms used here:
- test-classified: marked as a QA account so it never counts as revenue
- entitlement: the Premium date on a listing
- dedupe: the webhook ignores an event it already processed
- Data quality panel: the /admin section that lists leftover QA rows and other issues
- dark-launch rule: QA accounts may use features still switched off for everyone else
- real_external: counted as a real, paying provider

What remains for real money:

1. Turn Stripe's Live toggle on and repeat Step 2 (price) and Step 5 (webhook) there.
2. Replace STRIPE_SECRET_KEY, STRIPE_PRICE_MEMBERSHIP_ANNUAL, and STRIPE_WEBHOOK_SECRET in Vercel Production with the live values (Step 4).
3. Redeploy.
4. Run Step 8 in live mode, in these sub-steps:
   a. Run the checklist as a QA provider account (an fmg-qa.test address that owns
      one published listing), paying with the owner's real card instead of the
      4242 test card. The gate stays OFF.
   b. Expected: the paid entitlement lands on the QA listing; billing_subscriptions
      shows the row as active and classified test; on /admin, Membership and money, Paid
      Premium stays 0 and Verified paying customers stays 0 throughout because the QA
      payer is test-classified, and the Revenue and MRR card reads Not live yet while
      the gate is OFF. Those zeros are the correct result, not a failure.
   c. Owner: at https://dashboard.stripe.com/subscriptions (Live mode) open the
      subscription, Cancel subscription, cancel immediately (not at period end);
      then Payments, open the $89.00 charge, Refund.
   d. Confirm billing_subscriptions shows status canceled via the
      customer.subscription.deleted event. The refund itself never appears in
      billing_events because the webhook is not subscribed to refund events.
   e. Leave the QA account, its listing, and its billing rows in place for 3 days.
      Stripe retries late deliveries for up to 3 days. A redelivered event dedupes
      (200, duplicate: true) while its billing_events row still exists. A late event
      with a new id, or a redelivery after we deleted the ledger rows, gets
      classified again. If the QA listing and owner are already gone, the webhook
      classifies it real_external and admin shows a phantom paying provider.
   f. After 3 days, remove the QA account, its listing, and its billing rows (delete
      the billing_events rows last, or keep them), the same cleanup as the sandbox
      run, and confirm the Data quality panel on /admin lists no issues, Paid Premium reads 0, and Verified paying customers reads 0. If a row for that subscription ever reappears
      after cleanup, delete it from billing_subscriptions by stripe_subscription_id
      and confirm those counts return to 0.
5. Flip Step 7 once the owner authorizes launch.

## Step 1: Create the Stripe account

1. Go to https://dashboard.stripe.com/register
2. Sign up with hello@findmymahjgame.com
3. Fill in the business details Stripe asks for (business name, bank account for
   payouts, tax details). Stripe walks you through it.
4. Stay in "Test mode" (toggle at the top of the Stripe dashboard) until Step 8 says
   otherwise.

## Step 2: Create the $89 per year membership price

1. In the Stripe dashboard, go to Product catalog, then click "Add product"
2. Name: Find My Mahj Premium (owner decision 2026-08-29). The sandbox product created
   earlier is still named Directory Membership; rename it in Product catalog before the
   live-mode run. The live product must be created as Find My Mahj Premium.
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
| STRIPE_PUBLISHABLE_KEY | Same page, "Publishable key" (starts with pk_). Not read by the app today; set for completeness only |
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
6. Back in Vercel, redeploy the site so it picks up the values from Step 4 (Deployments,
   three-dot menu on the latest deployment, Redeploy)

## Step 6: Run the database migration

DONE 2026-08-24: I applied all three billing migrations to production:
`supabase/migrations/2026-08-23-billing.sql`,
`supabase/migrations/2026-08-24-billing-classification-backfill.sql`, and
`supabase/migrations/2026-08-24-premium-entitlement.sql`.

The billing migration creates three new tables (billing_customers,
billing_subscriptions, billing_events) and touches no existing table. The backfill
is a one-time UPDATE that reclassifies any billing rows written before
classification-at-ingestion existed. The entitlement migration adds premium_until to venue_listings and event_listings and
creates the provider_leads table that Premium lesson inquiries write to; the webhook
writes premium_until, so a rebuild without this migration has no paid entitlement and
inquiries fail as well.

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

- [ ] Start a checkout as a signed-in provider who owns one published teacher listing
      (the "Choose Premium: $89/year" button in the Membership section of the
      /provider dashboard does this; the route reads the session, never a request
      body) and confirm you get back a Stripe checkout URL
- [ ] Open that URL and pay with Stripe's test card 4242 4242 4242 4242, any future
      expiry date, any CVC
- [ ] In Stripe, Developers, Webhooks: the endpoint shows recent deliveries with
      response 200
- [ ] In Supabase: billing_subscriptions has one new row with status `active`
- [ ] Confirm checkout shows the product name Find My Mahj Premium and the plain
      $89/year total with no promotion code field
Note (2026-08-23): the checkout entry point is built. It is the signed-in provider dashboard's Membership section; the server derives the payer's email from their auth account and binds the subscription to their own claimed, published teacher listing. Nothing client-sent can point it elsewhere, checkout refuses (with a log line) when the owned listing is missing or ambiguous rather than take money that grants nothing, and the button appears only once the Stripe env vars are set.

- [ ] At activation, confirm in Stripe TEST MODE with a QA test account (test accounts pass the payments gate while it is OFF): claim a listing, choose Premium from the dashboard, complete test checkout, and verify the webhook stamps premium_until = the paid period end on that listing and billing_subscriptions shows the active subscription. The admin Data quality panel flags any active subscription not linked to a listing
- [ ] Cancel the test subscription in Stripe and confirm the row's status updates
- [ ] Confirm `launch_payments` is still 'false' in app_settings. Do not create a real
      account to probe the 503. tests/billing.spec.ts pins the unconfigured 503 path
      only; the gate branch for non-test accounts is the canUseDarkFeature check in
      app/api/billing/checkout/route.ts, reviewed in code and not yet covered by an
      automated test. A QA account still gets a checkout URL, which is the
      dark-launch rule, not a failure
- [ ] Remove the QA account, its listing, and its billing rows (in live mode only
      after the 3-day wait in Status item 4e; the webhook never rolls premium_until
      back on cancel, so the QA listing would otherwise keep a paid date) and confirm
      the Data quality panel on /admin lists no issues

When the live-mode run of this checklist passes, payments are ready. They launch only
at Step 7, when the owner authorizes.

## If something goes wrong

- Any billing page saying "Payments are not yet enabled" means either the gate is
  'false' or one of the env values is missing. Both are safe states.
- If the dashboard numbers ever look wrong, Stripe is always the correct record. The
  reconcile helper in `lib/billing/reconcile.ts` lists the differences.
- Turning everything off is one database change: set `launch_payments` to 'false'.
