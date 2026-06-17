-- Find My Mahj Game, membership system, Phase 1, step 5 of 5.
-- (Step 4, the tier-column enum cast, is deferred on purpose: it is the only
-- step that rewrites the tier columns in place, so it runs separately after a
-- data check. See the runbook in docs/membership-system-spec.md, section J.)
--
-- Adds the membership / verification / event feature columns and the cross-table
-- foreign keys, backfills listing_kind once, and normalizes legacy
-- event_type / frequency values before adding their CHECK constraints.
-- rewrites known legacy values to the canonical set. The CHECK constraints are
-- added NOT VALID so a stray legacy value cannot abort this file; they still
-- enforce on every new and updated row. Run the pre-flight query in the runbook,
-- hand-correct any stray values, then VALIDATE the constraints in a follow-up.
-- Idempotent, safe to rerun. Run AFTER step 3 (ownership).
-- Spec: docs/membership-system-spec.md sections H.6b, H.6c, H.6d, H.5.
--
-- DEFERRED on purpose: the event_listings.teacher_id FOREIGN KEY (only the
-- column is added here) because teacher_profiles does not exist until Phase 2.

-- H.6b venue_listings: membership + listing_kind + verification feature columns.
alter table public.venue_listings
  add column if not exists display_email              text,
  add column if not exists instagram                  text,
  add column if not exists logo_url                   text,
  add column if not exists listing_kind               text,   -- 'teacher' | 'venue' (replaces the regex)
  add column if not exists verified                   boolean not null default false,
  add column if not exists verified_at                timestamptz,
  add column if not exists is_official_mahj_spot       boolean not null default false,
  add column if not exists is_founding_partner        boolean not null default false,
  add column if not exists tier_renews_at             timestamptz,
  add column if not exists pro_expires_at             timestamptz,
  add column if not exists billing_interval           text,
  add column if not exists featured_until             timestamptz,
  add column if not exists photo_count                int not null default 0,
  add column if not exists link_count                 int not null default 0,
  add column if not exists events_boosted_this_period int not null default 0,
  add column if not exists seat_count                 int not null default 1,
  add column if not exists priority_support           boolean not null default false,
  add column if not exists org_id                     uuid;
create index if not exists idx_venue_listings_kind on public.venue_listings (listing_kind);
create index if not exists idx_venue_listings_tier on public.venue_listings (tier);

-- Backfill listing_kind ONCE from the legacy teacher regex; new writes set it directly.
update public.venue_listings
  set listing_kind = case
    when (venue_type || ' ' || coalesce(description, '')) ~* 'instructor|teacher|lesson|studio|school|class'
      then 'teacher' else 'venue' end
  where listing_kind is null;

-- H.6c event_listings: recurrence/taxonomy + boost + lifecycle feature columns.
-- frequency is added defensively in case the recurring-series migration is absent.
alter table public.event_listings
  add column if not exists frequency      text,
  add column if not exists subtype        text,
  add column if not exists day_of_week    text[],
  add column if not exists time_of_day    text,
  add column if not exists week_of_month  smallint,
  add column if not exists series_status  text not null default 'active',
  add column if not exists boosted_until  timestamptz,
  add column if not exists pro_expires_at timestamptz;
create index if not exists idx_event_listings_series on public.event_listings (series_status);
create index if not exists idx_event_listings_date on public.event_listings (event_date);

-- Normalize legacy values BEFORE adding the CHECK constraints. Idempotent: a
-- rerun finds no legacy values left and is a no-op.
update public.event_listings set event_type = 'open_play'
  where event_type in ('openplay', 'recurring');
update public.event_listings set event_type = 'class'
  where event_type in ('lesson', 'instructor', 'workshop');
update public.event_listings set event_type = 'social'
  where event_type in ('conference', 'festival', 'fundraiser', 'special', 'event');
update public.event_listings set frequency = 'once'
  where frequency is null or frequency = '' or lower(frequency) in ('one-time', 'one time', 'single');
update public.event_listings set frequency = lower(frequency)
  where frequency is not null and frequency <> lower(frequency);

do $$ begin
  alter table public.event_listings add constraint event_type_allowed
    check (event_type in ('open_play', 'class', 'league', 'tournament', 'retreat', 'cruise', 'social')) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.event_listings add constraint event_frequency_allowed
    check (frequency in ('once', 'weekly', 'biweekly', 'monthly', 'multi_day')) not valid;
exception when duplicate_object then null; end $$;

-- H.6d ad_listings sponsorship lifecycle.
alter table public.ad_listings
  add column if not exists pro_expires_at timestamptz;

-- H.5 cross-table foreign keys (additive, on delete set null). The teacher_id FK
-- is deferred to Phase 2 (teacher_profiles does not exist yet); only the column
-- is added now so the backfill in Phase 2 can populate it.
alter table public.event_listings add column if not exists teacher_id uuid;
create index if not exists idx_event_listings_teacher on public.event_listings (teacher_id);

alter table public.event_listings add column if not exists organizer_listing_id uuid;
do $$ begin
  alter table public.event_listings add constraint event_listings_organizer_fk
    foreign key (organizer_listing_id) references public.venue_listings(id) on delete set null;
exception when duplicate_object then null; end $$;
create index if not exists idx_event_listings_organizer on public.event_listings (organizer_listing_id);

alter table public.tables add column if not exists event_listing_id uuid;
do $$ begin
  alter table public.tables add constraint tables_event_listing_fk
    foreign key (event_listing_id) references public.event_listings(id) on delete set null;
exception when duplicate_object then null; end $$;
create index if not exists idx_tables_event_listing on public.tables (event_listing_id);

alter table public.venue_listings add column if not exists parent_org_id uuid;
do $$ begin
  alter table public.venue_listings add constraint venue_listings_parent_fk
    foreign key (parent_org_id) references public.venue_listings(id) on delete set null;
exception when duplicate_object then null; end $$;
create index if not exists idx_venue_listings_parent on public.venue_listings (parent_org_id);
