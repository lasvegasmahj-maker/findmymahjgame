-- Phase 6: record which mahjong a listing or prospect actually plays.
--
-- Phase 5 found that 14 of 25 qualified prospects either played a non-American variant or had
-- never said, and that finding lived only in free text notes. Without a column the fact is
-- unqueryable, so coverage counts silently mix American listings with games an American
-- player cannot join.
--
-- Every column defaults to NULL rather than 'AMERICAN'. Backfilling published rows to
-- AMERICAN because they are published would manufacture evidence that does not exist; those
-- rows are classified separately, one at a time, from their own sources.
--
-- Additive and reversible. No existing value is rewritten by this migration.

alter table public.venue_listings add column if not exists mahjong_variant text;
alter table public.venue_listings add column if not exists variant_confidence text;
alter table public.venue_listings add column if not exists variant_evidence text;

alter table public.event_listings add column if not exists mahjong_variant text;
alter table public.event_listings add column if not exists variant_confidence text;
alter table public.event_listings add column if not exists variant_evidence text;

alter table public.prospects add column if not exists mahjong_variant text;
alter table public.prospects add column if not exists variant_confidence text;
alter table public.prospects add column if not exists variant_evidence text;

do $$
declare t text;
begin
  foreach t in array array['venue_listings', 'event_listings', 'prospects'] loop
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_variant_check');
    execute format($f$alter table public.%I add constraint %I check (
      mahjong_variant is null or mahjong_variant in
      ('AMERICAN','AMERICAN_NON_NMJL','RIICHI','SICHUAN','GUANGDONG','CHINESE_OTHER','OTHER','UNKNOWN'))$f$, t, t || '_variant_check');
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_variant_conf_check');
    execute format($f$alter table public.%I add constraint %I check (
      variant_confidence is null or variant_confidence in ('high','medium','low'))$f$, t, t || '_variant_conf_check');
  end loop;
end $$;

create index if not exists venue_listings_variant_idx on public.venue_listings (mahjong_variant);
create index if not exists event_listings_variant_idx on public.event_listings (mahjong_variant);
create index if not exists prospects_variant_idx on public.prospects (mahjong_variant);
