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
  - Payment and webhook: the sandbox checkout shows the Stripe product at $89.00
    (named Directory Membership at the time; the owner renamed the product Find My
    Mahj Premium on 2026-08-29, and the sandbox test product still needs that rename
    in the Stripe dashboard); the app classifies the mirrored subscription as test at
    its first write; both webhook events process; the correct listing moves to a
    365-day paid entitlement stamped with the subscription id and the other listing
    stays untouched; the ledger deduplicates a redelivered event id (answers 200 with
    duplicate: true and writes nothing); real revenue and paying providers stay 0
    throughout.
  - Expiry: an expired, unconverted trial keeps the listing published and owned,
    loses only the Premium inquiry (403), shows as Basic on the dashboard and as
    expired on admin, and a re-claim cannot restart it.
  - Cleanup: the readiness pass removed every QA artifact afterwards; the Data
    quality panel listed no issues.
  - Cancellation, exercised 2026-08-29 19:26 PT: the owner canceled the four sandbox
    QA subscriptions immediately in the connected sandbox (display name FindMyMahj
    sandbox; a sibling sandbox named Las Vegas Mahjong is not connected). Stripe
    delivered four customer.subscription.deleted events. The webhook answered 200 to
    each and the ledger recorded all four as processed within half a second. The
    mirror wrote each subscription as canceled and test-classified; the QA listings
    they pointed at were already gone, and livemode false short-circuits
    classification, so no listing was touched. The Data quality panel listed no
    issues before and after. I then removed the four mirror rows, the four ledger
    rows, and one billing_customers row left by the checkout session I had opened
    earlier to confirm which sandbox production uses (a checkout session, never
    paid). No automated test covers the event yet (backlog).
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

1. Policy publication: RESOLVED 2026-08-29. The owner made all 18 decisions
   (docs/policy/owner-decisions-2026-08-29.md) and confirmed the operating entity,
   Mahjong Collective, LLC. All five documents are live from the resolved drafts:
   /terms, /privacy, /provider-terms, /billing-disclosures, /matching-standards,
   linked from the footer, /join, the provider dashboard, the account page, and Mahj
   Match. The published billing disclosures still depend on three Stripe Billing
   settings the owner configures before payments open (customer portal with
   cancellation, renewal reminders, failed-payment emails); the Launch Simulator
   requires them before payments can open.
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
3. RESOLVED 2026-08-29: the legacy quick-table routes (/api/tables/*) now sit behind
   launch_player_matching with the shared dark-launch rule; a real visitor is refused before
   any write while the gate is OFF (docs/owner-decisions-pending.md item 8).
4. RESOLVED 2026-08-29: the customer-facing product name is Find My Mahj Premium
   ($89/year). Policy drafts and current docs now use it. Two Stripe-side steps
   remain for the owner: rename the sandbox test product (Product catalog, the
   product named Directory Membership, Edit, Name) and, when live Stripe is created,
   name the live product Find My Mahj Premium.

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
- 2026-08-29 19:08 PT: I fast-forwarded this branch onto main as 2025269, which
  carries the record, the admin analytics paging fix, and the (created_at, id) index
  migration, and deployed it to production from the Vercel CLI (READY, sha 2025269,
  aliased to findmymahjgame.com). Verified after the deploy: security headers
  present; all four launch gates and matcher_enabled still false; /api/ask serves the
  PR #13 wording; no 5xx in the last 3 hours. The only error-level logs in that
  window were two transient "fetch failed" analytics inserts from /api/ask at 18:10
  and 18:51 PT (before this deploy); the Ask responses returned 200, so no visitor
  was affected. I could not call the live /api/admin/analytics endpoint myself
  because I do not hold production admin credentials. The proof for the fix is the
  suite run on a local build of the same commit, pointed at the production
  analytics_events table: 576 passed, the analytics spec passed 7 of 7, and the
  rollup total equaled the table's head count.
- 2026-08-29 19:26 PT: the owner canceled all four sandbox QA subscriptions in the
  connected FindMyMahj sandbox; the cancellation path worked end to end in production
  (four events, four 200s, four canceled test rows, no listing touched) and I removed
  the resulting QA rows. Residue 0; real revenue $0; real paying providers 0; gates
  OFF.
- 2026-08-29 (later): owner decision recorded: the paid product is Find My Mahj
  Premium, $89/year. Policy drafts, runbook, checklist, and decisions log normalized
  to the name; 18 owner policy decisions untouched. No user-facing code carried the
  old name; one code comment updated; no deploy needed.
- 2026-08-29 (evening): owner made all 18 policy decisions; published /privacy (new
  text), /provider-terms, /billing-disclosures, /matching-standards; corrected the
  FAQ; /terms held pending the operating-entity confirmation; all four gates still
  OFF.
- 2026-08-29 (late evening): owner confirmed Mahjong Collective, LLC as the operating
  entity; the new Terms of Use published at /terms; 18 of 18 policy decisions
  resolved; all four gates still OFF.
- 2026-08-29 (night): owner configured the Stripe Test customer portal (self-service
  cancellation at end of billing period); NEXT_PUBLIC_STRIPE_PORTAL_URL set in Vercel
  Production and redeployed; a paid QA provider's dashboard shows the Stripe-hosted
  manage/cancel link on production; QA artifacts removed. Still owed before payments
  open: renewal-reminder and failed-payment emails (then
  app_settings.stripe_billing_emails_confirmed), and the live portal link. The Launch
  Simulator now lists the test portal link as a blocker for launch_payments once the
  Stripe secret key is a live key, and fails the billing self-service check if
  payments are opened with it still in place.
- 2026-08-29 (late night): owner completed the Stripe Test billing settings:
  renewal-reminder emails at 30 days, failed-payment emails, Smart Retries (up to 8
  within 2 weeks, then cancel). All consistent with the published Billing
  Disclosures. I set app_settings.stripe_billing_emails_confirmed = test (it becomes
  live once the Live-mode settings are confirmed); the Launch Simulator's billing
  self-service check passes with the test portal link. Still owed before payments
  open: the live Stripe values, the live portal link, and the same three settings in
  Live mode.
- 2026-08-29 (quick-table gate): owner approved gating /api/tables/* behind launch_player_matching; implemented in lib/tables-gate.ts and the five routes, closed states on /play, /played, and /played/confirm, regression suite tests/quick-tables-gate.spec.ts; all four gates still OFF.
- 2026-08-30 (rules truth layer): owner requirement applied to Ask Find My Mahj; corpus audited and expanded to 50 provenance-tagged entries (21 owner-approved unchanged, 29 flagged for owner review), clarification engine added (multi-turn through the real route), rules truth benchmark plus blind held-out set added; record in docs/rules-truth-audit-2026-08-30.md, source policy in docs/rules-sources.md; all four gates still OFF.
- 2026-08-30 (rules owner decisions): Shauna resolved all thirteen final rule questions; the Ask corpus is now 55 entries with no instructor placeholders, four new entries (false-mahjong settlement, three-player procedure, wrong tile count before play, hold or wait) plus a dedicated wrong-joker-exchange entry; two narrow points with no published League ruling are published as unsettled and a clarification letter is drafted; all four gates still OFF.
