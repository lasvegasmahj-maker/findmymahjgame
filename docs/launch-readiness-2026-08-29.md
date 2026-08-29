# Launch Activation Readiness, 2026-08-29

Verified by Fable 5 (Claude Code) on 2026-08-29 for the owner, Shauna Bruckman.
Authoritative technical readiness record. Supersedes the launch-status claims in
docs/launch-task-graph.md (a 2026-08-23 snapshot) wherever they differ. All four
launch gates are OFF; nothing here is launched.

## Verified on 2026-08-29 (production, test-classified data only)

- Deployment: main 0538e80, Vercel production READY 2026-08-26, no error-level or 5xx
  runtime logs in the last 3 hours, all security headers present.
- Full Playwright suite: 575 passed, 1 pre-existing skip (desktop). Mobile viewport:
  60 passed under Chromium device emulation. WebKit cannot launch on the build Mac
  (Bus error), a local environment limit, not a product defect.
- Launch Simulator: 14 of 14 PASS against production.
- Billing and trial lifecycle, end to end on production with a QA provider:
  - Claim and trial: the claim auto-approves; the trial starts at exactly 90.000 days
    with no card and no payment record; Premium inquiry works during the trial; a
    repeated claim does not restart the trial.
  - Checkout guards: anonymous checkout gets 401; a second provider with no owned
    published listing gets 409 (the route ignores any listing id in the request body)
    and the first provider's listing stays untouched; a cancelled checkout returns
    safely with no entitlement change.
  - Payment and webhook: the sandbox checkout shows Directory Membership at $89.00;
    the app classifies the mirrored subscription as test at its first write; both
    webhook events process; the correct listing moves to a 365-day paid entitlement
    stamped with the subscription id and the other listing stays untouched; the
    ledger deduplicates a redelivered event id (answers 200 with duplicate: true and
    writes nothing); real revenue and paying providers stay 0 throughout.
  - Expiry: an expired, unconverted trial keeps the listing published and owned,
    loses only the Premium inquiry (403), shows as Basic on the dashboard and as
    expired on admin, and a re-claim cannot restart it.
  - Cleanup: the readiness pass removed every QA artifact afterwards; residue count 0.
  - Not exercised: subscription cancellation (customer.subscription.deleted). The
    sandbox QA subscriptions were never cancelled in Stripe, and no automated test
    covers that event. Owner step: cancel them in the Stripe Test-mode dashboard;
    the pass then confirms the mirrored rows show status canceled. Do this before
    the live-mode run so the first cancel is not on a real charge.
- Data quality: 0 issues after the pass removed one orphan QA auth user left by an
  earlier rehearsal. Real players 0, real provider submissions 0, paid members 0.
- Rules retrieval: closed-hand, blind pass, joker, place-name, and copyright paths
  verified live.

## What still prevents owner launch authorization

1. Policy publication (blocks every gate, per docs/policy/launch-gate.md): the five
   drafts in docs/policy/drafts still carry [OWNER TO CONFIRM] brackets (terms-of-use
   7, privacy-policy 3, provider-terms 2, billing-disclosures 5,
   matching-community-standards 1: 18 decisions, not counting the header text that
   explains what the brackets mean). /terms and /privacy exist but hold older text;
   /provider-terms, /billing-disclosures, and /matching-standards do not exist. Once
   the owner approves the text, publishing the routes is a small, authorized
   launch-configuration change.
2. Live Stripe (blocks launch_payments only; public signup, provider claims, and
   player matching do not depend on it): Production holds sandbox keys. The three
   values the app reads (STRIPE_SECRET_KEY, STRIPE_PRICE_MEMBERSHIP_ANNUAL,
   STRIPE_WEBHOOK_SECRET) must become their live equivalents, which means first
   creating the $89/year price and the webhook endpoint again with Stripe's Live
   toggle on (runbook Steps 2 and 5), then a redeploy, then the live-mode run of
   docs/billing-launch-runbook.md Step 8. In live mode that run uses a QA provider
   account paid with the owner's real card while the gate stays OFF: the entitlement
   lands on the QA listing, and on /admin the Paid Premium and Verified paying
   customers tiles stay 0 throughout because the QA payer is test-classified, while
   the Revenue and MRR card reads Not live yet with the gate OFF (the expected
   result, not a failure). Afterwards we refund the $89.00 charge and cancel the
   subscription immediately in Stripe, and confirm the mirrored status becomes
   canceled. The refund itself never reaches the ledger; the webhook is not
   subscribed to refund events. The QA account, listing, and billing rows stay in
   place for 3 days: a redelivered event dedupes while its billing_events row exists,
   and a late event with a new id still classifies test while the QA listing and
   owner exist; deleting them first would make the webhook classify such an event as
   real_external (counted as a real paying provider). After 3 days we remove them,
   confirm residue 0 and the Paid Premium and Verified paying customers tiles at 0,
   and delete from billing_subscriptions by stripe_subscription_id any row that
   reappears later.
3. Owner decision, docs/owner-decisions-pending.md item 8: the legacy quick-table
   routes (/api/tables/*) are live for real traffic with no launch gate.

## Launch-day facts

- Gates flip by SQL only, one at a time, no redeploy: public signup, then provider
  claims, then payments, then player matching. Rollback is the same statement with
  'false'.
- Player matching needs a second key: app_settings.matcher_enabled = 'true' (seeded
  false) or the daily matcher proposes no tables.
- The Launch Simulator proves subsystems on test data; it does not exercise a gate's
  ON branch. Verify each gate live after flipping it.
