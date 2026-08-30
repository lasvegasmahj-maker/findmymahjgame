# Launch Activation Readiness, 2026-08-29

Fable 5 (Claude Code) verified this on 2026-08-29 for the owner, Shauna Bruckman.
Authoritative technical readiness record. Supersedes the launch-status claims in
docs/launch-task-graph.md (a 2026-08-23 snapshot) wherever they differ. All four
launch gates are OFF; nothing here is launched.

## Verified on 2026-08-29 (production, test-classified data only)

- Deployment: the pass ran against production build 0538e80 (Vercel READY
  2026-08-26), with no error-level or 5xx runtime logs in the last 3 hours and all
  security headers present. Main advanced to baffb99 at 17:43 PT on 2026-08-29 (PR
  #13, rules wording in lib/rules/knowledge.ts only, merged from the owner's GitHub
  account), and at 18:19 PT someone other than this pass deployed it to production
  from the Vercel CLI using the team account (Vercel deployment source cli, ref HEAD,
  sha baffb99); production /api/ask serves the new wording. That deploy does not
  include the analytics fix below. I rebased this record's branch onto baffb99 and
  ran the suite below on that code; the changelog at the end of this file will log
  the deploy that carries the fix.
- Full Playwright suite on baffb99 plus the analytics fix below (desktop-chromium
  project): 576 passed, 1 pre-existing skip. The suite runs against a local build
  with RATE_LIMIT_TEST_BYPASS set; its many admin logins would trip the strict
  5-per-5-minutes login limit against a deployed URL, so it is proof for local runs
  only. The mobile-safari project (577 tests) did not run locally because WebKit
  cannot launch on the build Mac (Bus error), a local environment limit, not a
  product defect. The full suite ran instead under Chromium Pixel 7 emulation with
  the same result.
- Launch Simulator: 14 of 14 PASS against production.
- Billing and trial lifecycle, end to end on production with a QA provider:
  - Claim and trial: the claim auto-approves; the trial starts at exactly 90.000 days
    with no card and no payment record; Premium inquiry works during the trial; a
    repeated claim does not restart the trial.
  - Checkout guards: anonymous checkout gets 401; a second provider with no owned
    published listing gets 409 (the route ignores any listing id in the request body)
    and the first provider's listing stays untouched; a canceled checkout returns
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
  - Cleanup: the readiness pass removed every QA artifact afterwards; the Data
    quality panel listed no issues.
  - Not exercised: subscription cancellation (customer.subscription.deleted). The
    sandbox QA subscriptions were never canceled in Stripe, and no automated test
    covers that event. Owner step: cancel them in the Stripe Test-mode dashboard;
    each cancel event writes a fresh test-classified row with status canceled, which
    the pass confirms and then removes so the Data quality panel is clean again. Do
    this before the live-mode run so the first cancel is not on a real charge.
- Data quality: 0 issues after the pass removed one orphan QA auth user left by an
  earlier rehearsal. Real players 0, real provider submissions 0, paid members 0.
- Rules retrieval: closed-hand, blind pass, joker, place-name, and copyright paths
  verified live.

## Found and fixed during the pass (authorized defect fix under the build freeze)

- Admin analytics undercounted once a 30-day window held more than 1,000 events. The
  rollup read analytics_events with a single select, which PostgREST caps at 1,000
  rows without an error; at 1,939 rows the newest events fell off and the real bucket
  lost its listing_viewed count while every total still looked plausible. The suite
  caught it (analytics.spec.ts, real/test bucket split) after the day's rehearsals
  pushed the table past the cap. Fix: app/api/admin/analytics/route.ts pages through
  the window in a stable order and reports dataHealth.windowTruncated if a 100-page
  (100,000-row) ceiling is ever hit; a new test inserts 1,250 test-classified events
  and requires all of them counted. Migration
  2026-08-29-analytics-events-created-id-index.sql adds the (created_at, id) index
  the paged read needs; I applied it to production on 2026-08-29 through the Supabase
  management API and confirmed it in pg_indexes (analytics_events_created_id_idx).
  Backlog: lib/data-trust.ts and several app/api/admin routes still read rows without
  paging; every table they touch was under 600 rows on 2026-08-29, so they are
  correct today and must be paged before any of those tables can pass 1,000. Replace
  paging with server-side aggregation once the freeze lifts.

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
   customers counts stay 0 throughout because the QA payer is test-classified, while
   the Revenue and MRR card reads Not live yet with the gate OFF (the expected
   result, not a failure). Afterwards the owner refunds the $89.00 charge and cancels
   the subscription immediately in the Stripe dashboard (Subscriptions: cancel
   immediately; Payments: refund), and the pass confirms the mirrored status becomes
   canceled. The refund itself never reaches the ledger; the webhook is not
   subscribed to refund events. The QA account, listing, and billing rows stay in
   place for 3 days: a redelivered event dedupes while its billing_events row exists,
   and a late event with a new id still classifies test while the QA listing and
   owner exist; deleting them first would make the webhook classify such an event as
   real_external (counted as a real paying provider). After 3 days we remove them,
   confirm the Data quality panel lists no issues and the Paid Premium and Verified
   paying customers counts read 0, and delete from billing_subscriptions by
   stripe_subscription_id any row that reappears later.
3. Owner decision, docs/owner-decisions-pending.md item 8: the legacy quick-table
   routes (/api/tables/*) are live for real traffic with no launch gate.
4. Owner decision, docs/owner-decisions-pending.md item 9: the customer-facing
   product name. The sandbox Stripe price is named Directory Membership (so the
   checkout page, receipt, and card statement say that) while the site sells it as
   Premium; four of the five policy drafts (all but the matching community standards)
   also say Directory Membership. Settle one name before the live price is created.

## Launch-day facts

- Gates flip by SQL only, one at a time, no redeploy: public signup, then provider
  claims, then payments, then player matching. Rollback is the same statement with
  'false'.
- Player matching needs a second key: app_settings.matcher_enabled = 'true' (seeded
  false) or the daily matcher proposes no tables.
- The Launch Simulator proves subsystems on test data; it does not exercise a gate's
  ON branch. Verify each gate live after flipping it.

## Changelog

- 2026-08-29: pass completed on production build 0538e80; twelve reviewer-gate rounds
  corrected this record; analytics paging fix added. 18:19 PT: another operator
  deployed baffb99 to production from the CLI. The deploy of the analytics fix is
  pending the final gate; the next entry records it.
