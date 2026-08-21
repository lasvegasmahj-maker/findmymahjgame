-- "Who is hosting" for events. Advertisers (open plays, tournaments, retreats)
-- give a host/organizer name and a sign-up link; both surface on the public
-- cards. Idempotent; safe to rerun.
alter table public.event_listings add column if not exists host text;
alter table public.listing_submissions add column if not exists host text;
