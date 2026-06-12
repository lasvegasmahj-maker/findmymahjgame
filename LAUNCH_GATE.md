# FMG Launch Gate: verified 2026-06-11, re-verified 2026-06-11

Status: **PASS.** Both founder SQL pastes were applied and live-verified on
2026-06-11 (anon SELECT revoked table-level on the four listing tables;
self-publish closed; pending rows invisible). Every code-level blocker is fixed
on `product-readiness-previews`. One small SQL delta remains non-blocking:
the ambassadors.referral_code block at the bottom of the migration file,
added after the founder's pastes. The deploy waits only on the founder's go.

## What was found and fixed (all verified hands-on against live Supabase)

| Finding | Severity | Status |
|---|---|---|
| State pages serialized contact_email / phone / stripe_payment_id / reviewer_notes into client HTML (live on production) | Critical | Fixed `f09bec6`: explicit public-safe column selects |
| Anon REST key could SELECT contact columns off published rows | Critical | SQL staged (column REVOKEs) |
| Anon could INSERT player_listings as `status=published` (default was `published`): fake/predatory listings publish unreviewed | Critical | SQL staged (default → pending_review + restrictive anon policy) |
| Played yes/no rendered as live HMAC links on the public table page: anyone could forge or poison freshness data | Critical | Fixed `ca5c1c5`: confirmation only via private email; idempotency guard added `2ce742c` |
| Public table page listed attendee first names; `/api/tables/find` unthrottled and enumerable | High | Fixed `ca5c1c5`: seat count only, rate limit + input clamp |
| Admin login had no brute-force protection | High | Fixed `ca5c1c5`: 5 attempts / 5 min |
| `/events` card read columns that don't exist on event_listings | High (breaks Events at publish) | Fixed `2ce742c` |
| Table pages indexable (guessable share codes expose host names) | Med | Fixed `2ce742c`: noindex metadata |
| Organization JSON-LD logo pointed at missing /logo.png | Med | Fixed `2ce742c` |
| /play capture posted null day/state: every request unmatchable | High (Fourth Chair) | Fixed `2ce742c` |
| No filled_at/played_at: North Star uncomputable | High | Fixed `2ce742c` (+ migration) |

Verified SAFE (no change needed): anon SELECT blocked on inquiries, ambassadors,
play_requests, tables, table_seats, listing_submissions; anon INSERT blocked on
venue/event/ambassador; anon UPDATE blocked; admin endpoints 401 without cookie.

## Founder action 1 of 2: paste this in the Supabase SQL editor

Run `supabase/migrations/2026-06-10-recurring-open-play.sql` in full. It is
additive and non-breaking. It: adds recurring-open-play columns; adds
filled_at/played_at; REVOKEs private columns from anon; and closes the
player_listings self-publish hole. The management token was unauthorized on
2026-06-10, which is why this is a manual paste.

## Founder action 2 of 2: the coordinated deploy

Only after the paste:
1. Bulk-approve staged inventory in /admin (hold list: no NV teachers, no
   schedule-less open plays, no rows missing provenance).
2. Mailchimp API key + Audience ID into Vercel env (never into chat); import 195.
3. Merge `product-readiness-previews` → main (one PR); single deploy.
4. Smoke test: the key routes 200; grep public HTML for contact_email/phone/
   stripe_payment_id (must be zero); /teachers excludes NV.
5. Sitemap → Search Console; send Newsletter Issue 1; first-10 relationship
   outreach (no claim links until /claim is verified end-to-end).

Rollback: record the prior production deployment ID before deploying; revert in
the Vercel dashboard if a smoke test fails. No second same-day deploy for polish.


Pre-launch one-minute checks: /contact test submit returns to the thank-you banner; glance at website links before single approvals.
