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
