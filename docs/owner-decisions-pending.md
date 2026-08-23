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

7. Sixteen directory listings carry a paid tier (starter or featured) with no
   payment record (they predate the Stripe billing system; the tier was set
   during research import). The admin data-quality panel surfaces this as
   "Paid-looking tier with no payment record." Since no one has paid, the honest
   state is tier = free until a real Stripe payment exists. Recommend resetting
   these 16 rows to free; not done autonomously because it changes real listing
   placement. Owner to confirm. Rows include Jessica Gitlin, Honey Salt, several
   Texas teachers; full list in the admin dashboard.
