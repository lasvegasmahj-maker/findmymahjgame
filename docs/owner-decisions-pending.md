# Owner decisions pending

Recorded during the overnight autonomous build. Every item here has a safe
closed-gate default already in place; nothing blocks engineering.

1. UPDATED 2026-08-29: I configured the Stripe sandbox and verified it end to end. For
   real payments the three STRIPE_* Vercel values the app reads (STRIPE_SECRET_KEY,
   STRIPE_PRICE_MEMBERSHIP_ANNUAL, STRIPE_WEBHOOK_SECRET) must become their live
   equivalents, then a redeploy and the live-mode runbook Step 8. Until launch_payments flips, only
   test-classified accounts can check out.
2. Google Search Console API credential for the admin SEO panel. Until then the
   panel says NOT CONNECTED.
3. Policy drafts in docs/policy/drafts/ need owner or legal review before any
   launch gate flips. See docs/policy/launch-gate.md for which gate needs which.
4. RESOLVED 2026-08-26: both rules entries passed instructor review and are
   published (closed-hand-final-tile as written; charleston-blind-pass with the
   owner's wording plus her joker clarification). While adding them we found the
   answer engine sometimes returned a general answer instead of the specific
   one. That is fixed under the build-freeze bugfix allowance.
5. RESOLVED 2026-08-23: the free-period conflict (6-month code vs 12-month
   coupon) is closed by the owner-approved business model. Both mechanics are
   retired; the complimentary period is the app-managed 90-day Premium trial
   starting at claim. See docs/provider-business-model-proposed-decision.md.
6. Advertiser terms page (unlinked, noindex, advertising deferred to Year 2)
   still describes generic monthly and annual advertiser plans; the policy drafts
   propose replacements. Owner decision: retire or rescope before Year 2.

7. RESOLVED 2026-08-23 (owner-approved): unsupported paid-tier listings reset to
   free. The owner flagged 16 on the directory (venue_listings); applying the same
   approved data-truth rule surfaced 35 more on event_listings with the identical
   issue, so all 51 were corrected. Prior tiers preserved in
   listing_tier_corrections; the per-table counts above (16 venue, 35 event) are
   read back from that audit table after the migration was applied to production.
   Reconciliation guard now covers both tables and excludes founding-member
   entitlements. Revenue and paying-member counts verified unchanged at 0.

8. The legacy "quick table" share-link feature (app/api/tables/create, claim,
   find, played, run-it-back) predates the account and consent system and has no
   launch gate; it is reachable by real traffic today, unlike gated Mahj Match.
   The public find endpoint already filters to real_external rows. This appears
   intentional (it is the existing "tables forming" feature, not algorithmic
   matching), but confirm whether it should stay live at launch or move behind a
   gate. No change made autonomously.

9. RESOLVED 2026-08-29 (owner decision): the paid provider product is named
   Find My Mahj Premium, priced $89/year, customer-facing everywhere (site, Stripe
   product, receipts, policy documents). "Directory Membership" is retired as a
   customer-facing name; it survives only in dated historical records. Structure
   unchanged: Provider Basic free forever; Find My Mahj Premium $89/year, annual
   only at launch. Rules unchanged: players free forever; Premium buys no organic
   placement, no Ask ranking, no territory or exclusivity; payment is separate from
   verification; the qualifying founding trial is 90 days from claim, no card; after
   it, providers choose Premium or revert to Basic. Remaining step: rename the
   sandbox Stripe test product (owner, Stripe dashboard) and create the future live
   product as Find My Mahj Premium.
