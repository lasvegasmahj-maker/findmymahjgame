# Find My Mahj Game: Owner Activation Checklist

The product is engineering-complete and frozen. Only the items below remain, and every one needs you (a credential, an account, or an approval). All four public launch gates stay OFF until you say launch.

## Activation items

### Stripe (live mode)
Status: SANDBOX VERIFIED 2026-08-29, LIVE KEYS AWAITING OWNER
What: the sandbox account, $89/year price, webhook, and env vars are in place, and the whole checkout, webhook, entitlement, and trial lifecycle passed on production with test data. For real payments:
1. Turn on the Live toggle at the top of https://dashboard.stripe.com
2. Create the $89/year price again in Live mode (runbook Step 2)
3. Create the webhook endpoint again in Live mode (runbook Step 5)
4. Paste the three live values into Vercel Production: STRIPE_SECRET_KEY (from https://dashboard.stripe.com/apikeys), STRIPE_PRICE_MEMBERSHIP_ANNUAL (the live price id), STRIPE_WEBHOOK_SECRET (the live webhook signing secret). STRIPE_PUBLISHABLE_KEY is not read by the app today; leave it or update it for completeness
5. Tell me
Also, before any of that: in Stripe Test mode, open Subscriptions and cancel each leftover QA subscription immediately (they are from the sandbox checks; no money involved). That exercises the cancel path once in sandbox before it ever runs on a real charge. Tell me when done and I confirm the rows show canceled.
What happens next: I redeploy and run the runbook Step 8 checklist in live mode through a QA account. That check charges your real card $89.00 once; right after, we refund the charge and cancel that subscription in Stripe so it never renews; after a 3-day wait for late Stripe deliveries, I remove the QA account and its rows. On the admin page, Paid Premium and Verified paying customers stay 0 during this check because the QA account is test-classified, and the Revenue and MRR card keeps saying Not live yet while the gate is OFF; that is the expected result. launch_payments stays OFF until you approve launch.

### Search Console
Status: READY, AWAITING OWNER CREDENTIAL
What: supply a Google service-account credential with Search Console access to the property.
When done: I connect the finished adapter and verify clicks, impressions, CTR, and position show in the admin SEO panel. No new SEO project.

### Policies
Status: DRAFT READY, AWAITING OWNER APPROVAL
What: review the five drafts in docs/policy/drafts (terms, privacy, provider terms, matching community standards, billing disclosures).
When done: I publish exactly what you approve. I will not mark them approved on my own.

### Rules
Status: RESOLVED 2026-08-26
You reviewed both entries as an instructor: the closed hand final tile answer as written, and the Charleston blind pass answer with your wording and joker clarification. Both are published in the rules knowledge base. Nothing further needed.

### Real Safari device QA
Status: AWAITING FINAL MANUAL DEVICE VERIFICATION
What: run the short checklist in docs/owner-safari-qa-checklist.md on a real iPhone in Safari. Automated testing covered everything except a true Safari engine (the local test engine crashes on this machine).

## To open the product later
After the items above are handled, launch is flipping four app_settings flags to true, one at a time, in this order: public signup, provider claims, payments, player matching. I verify each before the next. The Launch Simulator at /admin/control is your one-click proof beforehand. Nothing else needs building.

## Completed (verified, nothing further needed)
- 2026-08-24: billing, classification backfill, and premium entitlement migrations applied to production; billing rows classify test or real at ingestion.
- 2026-08-23: Mailchimp moved to the new Find My Mahj Game account; old key referenced nowhere; Vercel token rotated.
- 2026-08-23: NEXT_PUBLIC_SITE_URL corrected to https://findmymahjgame.com.
- 2026-08-26: both rules entries published; rules retrieval precedence fixed.
- 2026-08-29: full technical readiness pass; see docs/launch-readiness-2026-08-29.md.
