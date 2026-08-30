# Policy owner decisions, 2026-08-29

Audit trail for the 18 owner decisions Shauna made on 2026-08-29, and how each was applied.
These are final owner decisions. Nothing here is a claim of attorney review or of compliance
with any specific law; the documents describe what Find My Mahj Game actually does.

## Terms of Use (7)

1. Operating entity: use the exact registered legal entity that operates Find My Mahj Game and
   receives its payments; never describe Shauna as "doing business as" without a registered
   assumed name. APPLIED. The owner confirmed on 2026-08-29: "Find My Mahj Game is operated by
   Mahjong Collective, LLC, and Find My Mahj Game payments will be received by Mahjong
   Collective, LLC." The Terms name Mahjong Collective, LLC as the operating entity and payee.
2. Billing Disclosures live at /billing-disclosures. APPLIED.
3. Provider Terms live at /provider-terms. APPLIED.
4. Matching Community Standards live at /matching-standards. APPLIED.
5. The same /matching-standards route is used everywhere the standards are referenced. APPLIED.
6. Nevada law; disputes handled in Clark County, Nevada; no attorney-review claim. APPLIED.
7. Public contact is hello@findmymahjgame.com, Las Vegas, Nevada; no street or home address.
   APPLIED.

## Privacy Policy (3)

8. No named-law compliance claim; describe truthfully what we collect, use, retain, share, and
   delete. APPLIED.
9. Owner modification: 30-day operational target for deletion and privacy requests; requests by
   email; acknowledged; generally processed within 30 days; completion confirmed by email;
   different timing may apply where required by applicable law; no automated confirmation
   system claimed. APPLIED.
10. Same public contact as decision 7. APPLIED.

## Provider Terms (2)

11. At launch every provider edit goes through review before it appears publicly; instant edits
    are post-launch backlog only. APPLIED (matches the code: every edit enters pending_edits).
12. If a Premium listing is removed for a reason not caused by the provider's violation or
    misconduct, refund the unused portion of the annual term on a reasonable prorated basis and
    preserve the provider's ability to keep or copy their listing information where technically
    available. APPLIED.

## Billing Disclosures (5)

13. Annual subscriptions receive an advance renewal reminder using Stripe's renewal reminder
    functionality. APPLIED in the text; the Stripe setting is an owner configuration step
    (docs/owner-activation-checklist.md) and must be verified before payments open.
14. Reminder target: 30 days before renewal. APPLIED as "targeted 30 days ahead"; not claimed
    operational until Stripe Live settings are configured and verified.
15. Owner modification: self-service cancellation through Stripe's hosted customer portal is the
    primary path at payment launch, with email as a fallback. APPLIED: the text promises the
    portal link on the provider dashboard; the dashboard shows that link once the owner enables
    the portal in Stripe and supplies its no-code login link (env NEXT_PUBLIC_STRIPE_PORTAL_URL);
    until then the dashboard shows the email path. No new billing code path was needed.
16. Failed renewals: Stripe may retry per its recovery settings and emails the customer; Premium
    ends when the paid entitlement ends; the listing stays published as free Basic; nothing is
    deleted; no penalty fee; no exact retry schedule stated. APPLIED; the Stripe failed-payment
    emails are an owner configuration step.
17. Refunds: full refund on request within 30 days of the first $89 charge; no routine refunds
    after; renewals generally non-refundable; decision 12 is the exception; "except where
    otherwise required by applicable law". APPLIED.

## Matching Community Standards (1)

18. Removed or restricted users are told the general category of the violation, never the
    reporter's identity; one written appeal by email, reviewed by a person, target 7 days.
    APPLIED.

## Consistency corrections applied the same day

The approved provider model (payment never buys verification, placement, ranking, Ask ranking,
territory, or exclusivity; Basic stays neutrally discoverable) is now stated consistently in the
Terms of Use draft, the Provider Terms, the Billing Disclosures, and the FAQ page. The old FAQ
line "a verified badge and more visibility" is gone.

## Notes

- The Mahj Match opt-in paragraph on the account page gained a link to the Matching Community
  Standards. What a player agrees to did not change, so CONSENT_VERSION (lib/match/consent.ts)
  was deliberately not bumped and no one is asked to re-consent.
- The published billing disclosures describe self-service cancellation, renewal reminders, and
  failed-payment emails that depend on Stripe Billing settings the owner configures before
  payments open; the Launch Simulator reports payments as not ready until the customer portal
  link is in place and the owner has confirmed the email settings
  (app_settings.stripe_billing_emails_confirmed = test in Test mode, and live once the
  Live-mode settings are confirmed).

