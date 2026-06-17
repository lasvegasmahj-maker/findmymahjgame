-- Find My Mahj Game, membership system, Phase 1, step 3 of 4.
-- The ownership bridge: a nullable account_id on every listing table, and a
-- profile_id link on the claim/edit/ambassador tables, all pointing at profiles.
-- Additive and non-breaking: anonymous creation and claim-by-token keep working
-- unchanged; account_id stays null until an owner signs in and is reconciled
-- (Phase 4). Idempotent, safe to rerun. Run AFTER step 2 (accounts).
-- Spec: docs/membership-system-spec.md section H.4a (and the profile_id parts of H.6e-g).

alter table public.player_listings add column if not exists account_id uuid;
alter table public.venue_listings  add column if not exists account_id uuid;
alter table public.event_listings  add column if not exists account_id uuid;
alter table public.ad_listings     add column if not exists account_id uuid;

do $$ begin
  alter table public.player_listings add constraint player_listings_account_fk
    foreign key (account_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.venue_listings add constraint venue_listings_account_fk
    foreign key (account_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.event_listings add constraint event_listings_account_fk
    foreign key (account_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.ad_listings add constraint ad_listings_account_fk
    foreign key (account_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists idx_player_listings_account on public.player_listings (account_id);
create index if not exists idx_venue_listings_account  on public.venue_listings (account_id);
create index if not exists idx_event_listings_account  on public.event_listings (account_id);
create index if not exists idx_ad_listings_account     on public.ad_listings (account_id);

-- Account link on the pre-account ownership rails. Only profile_id here; the
-- ambassador-program columns (referral_code, points, level, ...) and the
-- edit-risk columns ship in their own later phases.
alter table public.ambassadors    add column if not exists profile_id uuid;
alter table public.listing_claims add column if not exists profile_id uuid;
alter table public.pending_edits  add column if not exists profile_id uuid;

do $$ begin
  alter table public.ambassadors add constraint ambassadors_profile_fk
    foreign key (profile_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.listing_claims add constraint listing_claims_profile_fk
    foreign key (profile_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.pending_edits add constraint pending_edits_profile_fk
    foreign key (profile_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
