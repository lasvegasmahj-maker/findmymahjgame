-- Recurring open play support (Track A2).
-- Additive and non-breaking: existing queries and inserts are unaffected.
-- Run in the Supabase SQL editor (management token was unauthorized on 2026-06-10).

alter table public.event_listings
  add column if not exists frequency text,
  add column if not exists day_time text,
  add column if not exists beginner_friendly text,
  add column if not exists source_url text;

alter table public.venue_listings
  add column if not exists source_url text;

-- After running, backfill from reviewer_notes/description is optional; the
-- import script writes schedule into description and provenance into
-- reviewer_notes so nothing is lost in the meantime.


-- LAUNCH GATE (2026-06-11): defense in depth against contact harvesting.
-- RLS correctly limits anon to published rows, but it is row-level only:
-- anyone holding the public anon key can SELECT contact_email and
-- reviewer_notes off published listings via the REST API. Revoke the
-- private columns from anon; the public email field is display_email.
revoke select (contact_name, contact_email, reviewer_notes, stripe_payment_id, promo_code)
  on public.venue_listings from anon;
revoke select (contact_name, contact_email, reviewer_notes, stripe_payment_id, promo_code)
  on public.event_listings from anon;
revoke select (contact_email)
  on public.player_listings from anon;
revoke select (contact_name, contact_email, reviewer_notes, stripe_payment_id)
  on public.ad_listings from anon;


-- Funnel timestamps (2026-06-12): Weekly Player-Games Confirmed needs WHEN a
-- table filled and played, not just a boolean. Stamped by the claim and
-- played routes; backfill is not possible, counting starts at launch.
alter table public.tables
  add column if not exists filled_at timestamptz,
  add column if not exists played_at timestamptz;
