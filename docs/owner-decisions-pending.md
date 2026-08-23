# Owner decisions pending

Recorded during the overnight autonomous build. Every item here has a safe
closed-gate default already in place; nothing blocks engineering.

1. Stripe account creation plus the four env vars (STRIPE_SECRET_KEY,
   STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_MEMBERSHIP_ANNUAL, STRIPE_PUBLISHABLE_KEY).
   Runbook: docs/billing-launch-runbook.md. Until then billing answers 503.
2. Google Search Console API credential for the admin SEO panel. Until then the
   panel says NOT CONNECTED.
3. Policy drafts in docs/policy/drafts/ need owner or legal review before any
   launch gate flips. See docs/policy/launch-gate.md for which gate needs which.
4. Two rules entries stay unpublished pending instructor review: closed-hand
   final tile exception, Charleston blind pass.
5. Free-period conflict found by the policy audit: the live teacher path gives
   6 months free with no card (FINDMYMAHJGAME manual onboarding) while the dark
   Stripe path waives a full year via a 100 percent once coupon and collects a
   card. Decide which model is real before the payments gate flips, and what
   happens to already-onboarded Charter Members. Details: docs/policy/audit-2026-08.md.
6. Advertiser terms page still describes the old $19-$79 pricing; the policy
   drafts propose replacements. Needs owner approval before publishing.

7. RESOLVED 2026-08-23 (owner-approved): the 16 paid-tier-without-payment
   listings were reset to free. Prior tiers preserved in listing_tier_corrections;
   reconciliation guard tightened to exclude founding-member entitlements. Revenue
   and paying-member counts unchanged at 0.

8. The legacy "quick table" share-link feature (app/api/tables/create, claim,
   find, played, run-it-back) predates the account and consent system and has no
   launch gate; it is reachable by real traffic today, unlike gated Mahj Match.
   The public find endpoint already filters to real_external rows. This appears
   intentional (it is the existing "tables forming" feature, not algorithmic
   matching), but confirm whether it should stay live at launch or move behind a
   gate. No change made autonomously.
