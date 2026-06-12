-- Recurring open play support (Track A2) + launch-gate hardening.
-- Additive and non-breaking; idempotent (safe to run more than once).
-- APPLIED STATUS (verified live 2026-06-12): everything in this file EXCEPT
-- the ambassadors.referral_code block at the bottom has been run by the
-- founder in the Supabase SQL editor and verified against the live database.
-- The referral_code block was added after those pastes: one small paste
-- outstanding. The corrective table-level REVOKEs (revoke select on the four
-- listing tables from anon) were also applied live on 2026-06-12.

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


-- LAUNCH GATE (2026-06-11, corrected 2026-06-12): defense in depth against
-- contact harvesting. Column-level REVOKEs are no-ops while a table-level
-- SELECT grant exists, so the protection is table-level: anon loses SELECT
-- entirely on the four listing tables. Nothing in the browser reads these
-- tables (all public pages render server-side with the service role), so no
-- grants back are needed. This matches what is applied in production.
revoke select on public.venue_listings from anon;
revoke select on public.event_listings from anon;
revoke select on public.player_listings from anon;
revoke select on public.ad_listings from anon;


-- Funnel timestamps (2026-06-12): Weekly Player-Games Confirmed needs WHEN a
-- table filled and played, not just a boolean. Stamped by the claim and
-- played routes; backfill is not possible, counting starts at launch.
alter table public.tables
  add column if not exists filled_at timestamptz,
  add column if not exists played_at timestamptz;


-- LAUNCH GATE (2026-06-11): close the player_listings self-publish hole.
-- Verified live: the anon key can insert a player_listing with
-- status='published' (or omit status, which defaults to 'published'), so a
-- fake or predatory "beginners welcome at my home" listing goes public with
-- no review. venue/event/ambassador anon inserts are already RLS-denied; only
-- player_listings is exposed because /list-my-game writes it client-side.
-- Fix without breaking that form: default new rows to pending_review, and add
-- a RESTRICTIVE policy so the anon role can only ever insert pending_review.
-- The service role (imports, admin approve) bypasses RLS and is unaffected.
alter table public.player_listings alter column status set default 'pending_review';

drop policy if exists "player_listings anon insert pending only" on public.player_listings;
create policy "player_listings anon insert pending only"
  on public.player_listings as restrictive for insert to anon
  with check (status = 'pending_review');


-- Ambassador attribution (ruled Week 1): server-issued referral codes so the
-- first numbered Founding Ambassador invitations are attributable from day one.
alter table public.ambassadors
  add column if not exists referral_code text unique;
