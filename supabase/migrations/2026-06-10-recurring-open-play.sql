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
