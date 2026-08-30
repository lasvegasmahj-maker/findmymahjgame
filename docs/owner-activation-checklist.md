# Find My Mahj Game: Owner Activation Checklist

The product is engineering-complete and frozen. Only the items below remain, and every one needs you (a credential, an account, or an approval). All four public launch gates stay OFF until you say launch.

## Activation items

### Terms of Use: operating legal entity
Status: DONE 2026-08-29. You confirmed Mahjong Collective, LLC operates Find My Mahj Game and receives its payments; the new Terms are live at /terms.

### Stripe Billing settings (Test mode now; repeat in Live mode before payments open)
Status: DONE IN TEST MODE 2026-08-29; repeat in Live mode before payments open
1. Customer portal: DONE in Test mode 2026-08-29. You enabled the portal with self-service cancellation at the end of the billing period, and Stripe asks the customer for a cancellation reason; I set NEXT_PUBLIC_STRIPE_PORTAL_URL in Vercel Production to the test portal link and redeployed, and a paid provider's dashboard now shows "Manage or cancel your subscription". In Live mode: turn on the Live toggle, open Settings, Billing, Customer portal, turn on the no-code customer portal link, copy the link (it starts with https://billing.stripe.com/p/login/ and has no test_ in it), and send it to me before payments open. It is public, not a secret.
2. Renewal reminders: DONE in Test mode 2026-08-29. Upcoming-renewal emails are on with the timing set to 30 days, matching the published Billing Disclosures.
3. Failed payments: DONE in Test mode 2026-08-29. Failed-payment customer emails and Smart Retries are on (up to 8 retries within 2 weeks; if all fail, Stripe cancels the subscription and leaves the invoice past due), which matches the published Billing Disclosures. I set app_settings.stripe_billing_emails_confirmed to test; the Launch Simulator's billing self-service check passes under test keys.
4. Live mode: repeat 1 to 3 after the live account exists, then tell me and I set app_settings.stripe_billing_emails_confirmed to live. The Launch Simulator refuses to report payments ready under live keys until that value is live and the portal link is the live one.

### Stripe (live mode)
Status: SANDBOX VERIFIED 2026-08-29, LIVE KEYS AWAITING OWNER
What: the sandbox account, $89/year price, webhook, and env vars are in place, and the whole checkout, webhook, entitlement, and trial lifecycle passed on production with test data. Two short lists below; the term test-classified is defined in docs/billing-launch-runbook.md under Terms used here.

Before anything (Stripe Test mode): DONE 2026-08-29. You canceled all four QA subscriptions in the connected sandbox (named FindMyMahj sandbox; the sibling sandbox named Las Vegas Mahjong is not the connected one) and I verified the cancellation path end to end.

Rename the sandbox test product (2 minutes, no money involved): in Stripe, sandbox "FindMyMahj sandbox", open Product catalog (https://dashboard.stripe.com/test/products), click the product named Directory Membership, click Edit product, set Name to Find My Mahj Premium, save. The price id does not change. Tell me and I confirm the checkout page shows the new name.

Live keys:
1. Turn on the Live toggle at the top of https://dashboard.stripe.com
2. Create the $89/year price again in Live mode (runbook Step 2) with the product name exactly: Find My Mahj Premium
3. Create the webhook endpoint again in Live mode (runbook Step 5)
4. Paste the three live values into Vercel Production: STRIPE_SECRET_KEY (from https://dashboard.stripe.com/apikeys), STRIPE_PRICE_MEMBERSHIP_ANNUAL (the live price id), STRIPE_WEBHOOK_SECRET (the live webhook signing secret). STRIPE_PUBLISHABLE_KEY is not read by the app today; leave it or update it for completeness
5. Tell me. I redeploy and run the runbook Step 8 checklist in live mode through a QA account, which charges your real card $89.00 once

During the live check (your actions):
1. Cancel the subscription immediately at https://dashboard.stripe.com/subscriptions
2. Refund the $89.00 charge at https://dashboard.stripe.com/payments
3. Tell me. I confirm our database copy shows canceled

Note: on the admin page, Paid Premium and Verified paying customers stay 0 during this check because the QA account is marked as a QA account and never counts as revenue, and the Revenue and MRR card keeps saying Not live yet while the gate is OFF; that is the expected result. After a 3-day wait for late Stripe deliveries I remove the QA account and its rows. launch_payments stays OFF until you approve launch.

### Search Console
Status: READY, AWAITING OWNER CREDENTIAL
What: supply a Google service-account credential with Search Console access to the property.
When done: I connect the finished adapter and verify clicks, impressions, CTR, and position show in the admin SEO panel. No new SEO project.

### Policies
Status: DONE 2026-08-29. All five policies are published (/terms, /privacy, /provider-terms, /billing-disclosures, /matching-standards) after your 18 decisions; /terms went live after you confirmed Mahjong Collective, LLC as the operating entity. Audit trail: docs/policy/owner-decisions-2026-08-29.md.

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
