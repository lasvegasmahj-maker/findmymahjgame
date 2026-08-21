-- Growth CRM foundation, Phase 1: research-only. Additive and idempotent.
-- No sending machinery is enabled by this migration. Outreach is governed by
-- app_settings flags that default OFF, and by deterministic guards in
-- lib/growth-guards.ts that fail closed.
--
-- Reuse decisions, made after inspecting the live schema:
--   email_suppressions  reused as the global suppression list (columns added below)
--   email_sends         stays the transactional send log; outreach logs its own messages
--   app_settings        reused for the global kill switches (matcher_enabled precedent)
--   crm_contacts        left alone: it is Shauna's hand-curated relationship CRM with
--                       different semantics (waves, ranks, touches), not machine prospecting

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization_name text,
  prospect_type text not null,
  city text,
  state text,
  metro text,
  latitude double precision,
  longitude double precision,
  website_url text,
  public_email text,
  public_phone text,
  social_url text,
  offerings text,
  source_url text,
  source_type text,
  qualification_score int,
  qualification_reason text,
  status text not null default 'DISCOVERED',
  discovered_at timestamptz not null default now(),
  verified_at timestamptz,
  last_verified_at timestamptz,
  existing_listing_table text,
  existing_listing_id uuid,
  campaign_id uuid,
  do_not_contact boolean not null default false,
  suppression_reason text,
  agent_confidence text,
  research_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.prospects enable row level security;

alter table public.prospects drop constraint if exists prospects_status_check;
alter table public.prospects add constraint prospects_status_check check (status in (
  'DISCOVERED','VERIFYING','QUALIFIED','NEEDS_REVIEW','REJECTED','READY_FOR_OUTREACH',
  'OUTREACH_ACTIVE','FOLLOW_UP_DUE','REPLIED','INTERESTED','QUESTION','ONBOARDING',
  'SIGNUP_STARTED','LISTING_SUBMITTED','CONVERTED','NOT_INTERESTED','WRONG_CONTACT',
  'BOUNCED','INVALID_CONTACT','UNSUBSCRIBED','DO_NOT_CONTACT','PAUSED'
));
alter table public.prospects drop constraint if exists prospects_type_check;
alter table public.prospects add constraint prospects_type_check check (prospect_type in (
  'instructor','studio','club','open_play_host','league','tournament_organizer',
  'retreat_organizer','travel_organizer','jcc','community_center','library',
  'rec_center','country_club','senior_org','game_store','other'
));

-- One row per contactable email, deduped hard at the database level so the same
-- address can never be prospected twice under two organization records.
create unique index if not exists prospects_email_key
  on public.prospects (lower(public_email)) where public_email is not null;
create index if not exists prospects_status_idx on public.prospects (status);
create index if not exists prospects_metro_idx on public.prospects (metro, state);

create table if not exists public.prospect_sources (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  source_url text not null,
  source_type text,
  evidence_text text,
  retrieved_at timestamptz not null default now(),
  verified_at timestamptz,
  verification_status text
);
alter table public.prospect_sources enable row level security;
create index if not exists prospect_sources_prospect_idx on public.prospect_sources (prospect_id);

create table if not exists public.outreach_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  target_type text,
  target_market text,
  active boolean not null default false,
  daily_send_limit int not null default 0,
  sequence_days int[] not null default '{0,4,10}',
  invitation_offer text,
  created_at timestamptz not null default now()
);
alter table public.outreach_campaigns enable row level security;

-- Immutable message records. Phase 1 creates none; the table exists so drafts,
-- sends, bounces, and replies land in one place when later phases activate.
create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  campaign_id uuid references public.outreach_campaigns(id),
  message_type text not null default 'outreach',
  sequence_step int not null default 0,
  generated_subject text,
  generated_body text,
  facts_used text,
  send_status text not null default 'draft',
  approved_by_human boolean not null default false,
  sent_at timestamptz,
  provider_message_id text,
  bounce_status text,
  reply_status text,
  created_at timestamptz not null default now()
);
alter table public.outreach_messages enable row level security;
create index if not exists outreach_messages_prospect_idx on public.outreach_messages (prospect_id);

-- The audit spine. Every consequential agent or admin action appends here;
-- nothing updates or deletes.
create table if not exists public.outreach_events (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects(id) on delete set null,
  campaign_id uuid,
  agent text not null,
  action text not null,
  reason text,
  evidence text,
  previous_state text,
  new_state text,
  ai_generated boolean not null default false,
  deterministic boolean not null default true,
  human_approved boolean not null default false,
  model_version text,
  created_at timestamptz not null default now()
);
alter table public.outreach_events enable row level security;
create index if not exists outreach_events_prospect_idx on public.outreach_events (prospect_id, created_at);

-- Suppression: extend the existing global table rather than adding a second
-- list an agent could forget to check. lib/email.ts already consults this
-- table on every send.
alter table public.email_suppressions add column if not exists source text;
alter table public.email_suppressions add column if not exists unsubscribed_at timestamptz;
alter table public.email_suppressions add column if not exists manual boolean not null default false;

create table if not exists public.invite_tokens (
  token text primary key,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  campaign_id uuid,
  created_at timestamptz not null default now(),
  clicked_at timestamptz,
  signup_user_id uuid,
  listing_table text,
  listing_id uuid,
  conversion_stage text not null default 'created'
);
alter table public.invite_tokens enable row level security;
create index if not exists invite_tokens_prospect_idx on public.invite_tokens (prospect_id);

-- Global controls, following the matcher_enabled precedent. Everything defaults
-- to the safest value: research only, outreach disabled, follow-ups disabled.
insert into public.app_settings (key, value) values
  ('growth_autonomy_level', '0'),
  ('growth_outreach_enabled', 'false'),
  ('growth_followups_enabled', 'false'),
  ('growth_global_pause', 'false'),
  ('growth_daily_send_limit', '0')
on conflict (key) do nothing;
