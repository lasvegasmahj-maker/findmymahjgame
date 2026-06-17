-- Find My Mahj Game, membership system, Phase 1, step 2 of 4.
-- Account-ready core: profiles, roles, listing ownership, memberships, badges,
-- and the audit log, plus the RLS helper functions. Additive. New tables get
-- RLS enabled with NO policies, so the service role (server routes) is the only
-- reader/writer, exactly like the existing ambassadors table. Nothing in the UI
-- changes. Idempotent, safe to rerun. Run AFTER step 1 (enums).
-- Spec: docs/membership-system-spec.md sections H.3 and H.7a.
--
-- DEFERRED on purpose to the teacher-profiles migration (Phase 2): the
-- certifications table and the reconcile_account function both reference
-- teacher_profiles, which does not exist yet, so creating them here would fail.

create table if not exists public.profiles (
  id            uuid primary key,                 -- = auth.users.id once auth is enabled (FK added in Phase 4)
  email         text not null unique,             -- lowercased mirror of the auth email
  display_name  text,
  city          text,
  state         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;
create index if not exists idx_profiles_email on public.profiles (lower(email));

create table if not exists public.account_roles (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role        account_role not null,
  granted_by  text,                               -- 'self' | admin email | 'system'
  granted_at  timestamptz not null default now(),
  unique (profile_id, role)
);
alter table public.account_roles enable row level security;
create index if not exists idx_account_roles_profile on public.account_roles (profile_id);

create table if not exists public.listing_owners (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  listing_table text not null,                     -- player_listings | venue_listings | teacher_profiles | event_listings | ad_listings
  listing_id    uuid not null,
  created_at    timestamptz not null default now(),
  unique (listing_table, listing_id)
);
alter table public.listing_owners enable row level security;
create index if not exists idx_listing_owners_profile on public.listing_owners (profile_id);
create index if not exists idx_listing_owners_lookup on public.listing_owners (listing_table, listing_id);

create table if not exists public.memberships (
  id                     uuid primary key default gen_random_uuid(),
  listing_table          text not null default 'venue_listings',
  listing_id             uuid not null,
  tier                   membership_tier not null,        -- pro | ambassador | enterprise
  billing_interval       text not null default 'monthly', -- monthly | annual
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text not null default 'active',  -- active | past_due | canceled | comped
  comped_reason          text,                            -- 'ambassador' | 'founding_partner'
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (listing_table, listing_id, tier)
);
alter table public.memberships enable row level security;
create index if not exists idx_memberships_listing on public.memberships (listing_table, listing_id);
create index if not exists idx_memberships_sub on public.memberships (stripe_subscription_id);

create table if not exists public.badges (
  id            uuid primary key default gen_random_uuid(),
  listing_table text not null,           -- teacher_profiles | venue_listings | event_listings
  listing_id    uuid not null,
  badge         text not null,           -- claimed | verified | certified | pro | ambassador | official_mahj_spot | founding_partner
  granted_by    text,                    -- 'system' | admin email
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  unique (listing_table, listing_id, badge)
);
alter table public.badges enable row level security;
create index if not exists idx_badges_listing on public.badges (listing_table, listing_id) where revoked_at is null;

create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_email  text not null,           -- admin/ambassador email, or 'system' for cron
  action       text not null,           -- 'role.grant' | 'listing.tier_override' | 'edit.approve' | ...
  target_table text,
  target_id    uuid,
  before       jsonb,
  after        jsonb,
  created_at   timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create index if not exists idx_audit_target on public.audit_log (target_table, target_id, created_at);
create index if not exists idx_audit_actor on public.audit_log (actor_email, created_at);

-- RLS helper functions (used by the policies that ship in Phase 4). Safe to
-- create now: they reference only the tables above plus auth.uid(), which is
-- present in every Supabase project. They stay inert until policies reference them.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.account_roles
    where profile_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.owns_listing(p_table text, p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.listing_owners
    where profile_id = auth.uid()
      and listing_table = p_table
      and listing_id = p_id
  );
$$;

create or replace function public.has_role(p_role account_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.account_roles
    where profile_id = auth.uid() and role = p_role
  );
$$;
