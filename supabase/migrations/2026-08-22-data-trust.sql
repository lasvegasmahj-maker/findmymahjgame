-- Every KPI question ("how many players do we have?") needs one deterministic answer, and
-- today seed rows, test rows, and the owner's own records sit in the same tables as any
-- future real signup. record_class makes the distinction a column instead of a guess, so a
-- report cannot accidentally count a demo row as a customer. Nothing is deleted: history
-- stays, classified.

alter table public.player_listings add column if not exists record_class text default 'real_external';
alter table public.listing_submissions add column if not exists record_class text default 'real_external';
alter table public.cruise_posts add column if not exists record_class text default 'real_external';

do $$
declare t text;
begin
  foreach t in array array['player_listings', 'listing_submissions', 'cruise_posts'] loop
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_record_class_check');
    execute format($f$alter table public.%I add constraint %I check (
      record_class in ('real_external','test','internal','seed_demo'))$f$, t, t || '_record_class_check');
  end loop;
end $$;

-- Backfill from evidence, not assumption:
--   @fmg-sample.test addresses are demo by construction.
--   The 2026-05-22 batch is the states-data seed import (same day, no contact email).
--   state 'ZZ' is a test row. The owner's own record is internal.
update public.player_listings set record_class = 'seed_demo'
 where contact_email like '%@fmg-sample.test'
    or (created_at::date = '2026-05-22' and contact_email is null);
update public.player_listings set record_class = 'test' where state = 'ZZ';
update public.player_listings set record_class = 'internal' where lower(contact_email) = 'sbruckma@gmail.com';

-- The nine 2026-06-13 submissions all use x.com test addresses.
update public.listing_submissions set record_class = 'test'
 where contact_email like '%@x.com';

update public.cruise_posts set record_class = 'seed_demo'
 where contact_email like '%@fmg-sample.test';

-- Seed players and demo cruise posts must not be shown to the public as real people. This is
-- the site's own hard rule; the rows are archived to review status, not deleted.
update public.player_listings set status = 'pending_review'
 where record_class = 'seed_demo' and status = 'published';
update public.cruise_posts set status = 'pending_review'
 where record_class = 'seed_demo' and status = 'published';
