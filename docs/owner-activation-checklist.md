# Find My Mahj: Owner Activation Checklist

The product is engineering-complete and frozen. Only the items below remain, and every one needs you (a credential, an account, or an approval). All four public launch gates stay OFF until you say launch.

## Activation items

### Stripe
Status: READY, AWAITING OWNER CREDENTIAL/ACCOUNT
What: create the Stripe account, the $89/year price, and set four env vars in Vercel. No promo code: the 90-day Premium trial is app-managed and starts on claim. Full steps in docs/billing-launch-runbook.md.
When done: I verify checkout, webhook, idempotency, cancellation, reconciliation, and admin revenue in Stripe test mode. launch_payments stays OFF until you approve launch.

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
