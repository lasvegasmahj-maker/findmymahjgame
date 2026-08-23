-- Formalize a column that exists in production but was added out of band: the
-- is_founding_member flag on the listing tables. Runtime code (lib/data-trust.ts)
-- and later migrations read it, so a database rebuilt purely from migrations (CI,
-- a preview branch, supabase db reset) must have it too. Additive and idempotent;
-- a no-op on production where the column already exists.
alter table public.venue_listings add column if not exists is_founding_member boolean not null default false;
alter table public.event_listings add column if not exists is_founding_member boolean not null default false;
alter table public.ad_listings   add column if not exists is_founding_member boolean not null default false;
