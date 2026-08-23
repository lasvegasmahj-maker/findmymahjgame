-- Wave 2 foundations: provider claims, matching consent, moderation, notification
-- ledger, first-party analytics. Additive and idempotent. Everything ships dark
-- behind the launch gates; QA identities are record_class 'test' and must never
-- count in real business numbers (the data-trust rule from 2026-08-22-data-trust.sql).

-- ===== Provider claims =====
-- Extends the EXISTING token-claim table (2026-06-12) into the account-based audit
-- trail instead of creating a second one. Canonical vocabulary: claimer_email is
-- the claimant email, profile_id (membership-03) is the account link, and
-- ownership itself lives on the listing row as account_id (membership-03), never
-- in this table. Ownership is granted only by deterministic evidence or an admin.
alter table public.listing_claims add column if not exists profile_id uuid;
alter table public.listing_claims add column if not exists evidence jsonb not null default '{}';
alter table public.listing_claims add column if not exists confidence text;
alter table public.listing_claims add column if not exists decision_reason text;
alter table public.listing_claims add column if not exists decided_by text;
alter table public.listing_claims add column if not exists decided_at timestamptz;
alter table public.listing_claims add column if not exists record_class text not null default 'real_external';
alter table public.listing_claims drop constraint if exists listing_claims_record_class_check;
alter table public.listing_claims add constraint listing_claims_record_class_check
  check (record_class in ('real_external', 'test', 'internal', 'seed_demo'));
alter table public.listing_claims drop constraint if exists listing_claims_confidence_check;
alter table public.listing_claims add constraint listing_claims_confidence_check
  check (confidence is null or confidence in ('high', 'medium', 'low'));
alter table public.listing_claims drop constraint if exists listing_claims_decided_by_check;
alter table public.listing_claims add constraint listing_claims_decided_by_check
  check (decided_by is null or decided_by in ('system', 'admin'));

-- The old one-row-per-listing unique blocked recording competing claims. Replace
-- it: exactly one WINNING claim per listing ('claimed' is the legacy token-flow
-- approval), one open claim per listing per account, unlimited history.
alter table public.listing_claims drop constraint if exists listing_claims_listing_table_listing_id_key;
create unique index if not exists listing_claims_winner
  on public.listing_claims (listing_table, listing_id)
  where status in ('claimed', 'approved', 'auto_approved');
create unique index if not exists listing_claims_one_open
  on public.listing_claims (listing_table, listing_id, profile_id)
  where status in ('submitted', 'needs_review');
create index if not exists listing_claims_status_idx on public.listing_claims (status, created_at);

comment on table public.listing_claims is
  'Every ownership claim and its decision, token flow and account flow alike. Ownership is granted only by deterministic evidence or an admin, never by an LLM judgment alone.';

-- ===== Matching consent and profile =====
-- Consent is a database fact with a timestamp and version, checked server side on
-- every matching operation. Adults only: adult_affirmed_at must be set before
-- matching_opt_in_at means anything.
create table if not exists public.matching_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  adult_affirmed_at timestamptz,
  consent_version text,
  matching_opt_in_at timestamptz,
  matching_deactivated_at timestamptz,
  city text,
  state text,
  travel_radius_miles int check (travel_radius_miles between 1 and 200),
  availability jsonb not null default '[]',
  variant text not null default 'AMERICAN',
  skill text check (skill in ('beginner', 'intermediate', 'advanced', 'any')),
  social_style text check (social_style in ('social', 'competitive', 'either')),
  host_pref text check (host_pref in ('can_host', 'prefer_travel', 'either')),
  group_pref text check (group_pref in ('same_group', 'new_people', 'either')),
  record_class text not null default 'real_external'
    check (record_class in ('real_external', 'test', 'internal', 'seed_demo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.matching_profiles enable row level security;

-- ===== Moderation =====
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references auth.users (id) on delete cascade,
  blocked_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_user_id, blocked_user_id)
);
alter table public.user_blocks enable row level security;

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users (id) on delete set null,
  subject_user_id uuid,
  subject_table text,
  subject_id uuid,
  category text not null check (category in ('harassment', 'spam_scam', 'unsafe', 'false_identity', 'other')),
  detail text,
  status text not null default 'new'
    check (status in ('new', 'triaged_low', 'needs_human', 'resolved', 'dismissed')),
  triage_note text,
  record_class text not null default 'real_external'
    check (record_class in ('real_external', 'test', 'internal', 'seed_demo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_reports enable row level security;
create index if not exists user_reports_status_idx on public.user_reports (status, created_at);

-- ===== Notification ledger =====
-- Every transactional notification the platform sends, keyed by kind from
-- lib/notifications/notify.ts. QA addresses are unroutable, so sends to them are
-- recorded as skipped_qa instead of attempted.
create table if not exists public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  kind text not null,
  subject text,
  status text not null check (status in ('sent', 'failed', 'skipped_qa', 'skipped_pref')),
  error text,
  related_table text,
  related_id text,
  record_class text not null default 'real_external'
    check (record_class in ('real_external', 'test', 'internal', 'seed_demo')),
  created_at timestamptz not null default now()
);
alter table public.notifications_log enable row level security;
create index if not exists notifications_log_kind_idx on public.notifications_log (kind, created_at);
create index if not exists notifications_log_user_idx on public.notifications_log (user_id, created_at);

-- ===== First-party analytics =====
-- Canonical event stream (names from lib/analytics/events.ts). Props are scrubbed
-- scalars only: never free text, never PII. QA traffic lands as record_class test
-- so funnels can be verified before a single real user exists without ever
-- contaminating real KPIs.
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  props jsonb not null default '{}',
  session_key text,
  record_class text not null default 'real_external'
    check (record_class in ('real_external', 'test', 'internal', 'seed_demo')),
  created_at timestamptz not null default now()
);
alter table public.analytics_events enable row level security;
create index if not exists analytics_events_name_idx on public.analytics_events (name, created_at);

-- ===== Account-based matching on the existing skeleton =====
-- tables/table_seats/play_requests/match_drafts already exist (all empty in
-- production). Wave 2 makes them account-based and consent-gated without a second
-- architecture: additive columns only, legacy name/email fields stay for the
-- public share-link flow. Canonical states live in lib/match/states.ts.
alter table public.tables add column if not exists host_user_id uuid;
alter table public.tables add column if not exists record_class text not null default 'real_external';
alter table public.table_seats add column if not exists user_id uuid;
alter table public.table_seats add column if not exists status text not null default 'accepted';
alter table public.table_seats add column if not exists record_class text not null default 'real_external';
alter table public.play_requests add column if not exists user_id uuid;
alter table public.play_requests add column if not exists variant text not null default 'AMERICAN';
alter table public.play_requests add column if not exists record_class text not null default 'real_external';

do $$
declare t text;
begin
  foreach t in array array['tables', 'table_seats', 'play_requests'] loop
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_record_class_check');
    execute format($f$alter table public.%I add constraint %I check (
      record_class in ('real_external','test','internal','seed_demo'))$f$, t, t || '_record_class_check');
  end loop;
end $$;

alter table public.table_seats drop constraint if exists table_seats_status_check;
alter table public.table_seats add constraint table_seats_status_check
  check (status in ('invited', 'accepted', 'declined', 'left'));
create index if not exists table_seats_user_idx on public.table_seats (user_id) where user_id is not null;
create index if not exists play_requests_user_idx on public.play_requests (user_id) where user_id is not null;
