-- ═══════════════════════════════════════════
-- FindMyMahj WARM CONTACTS: relationship pipeline (founder KPI)
-- Prepared for review. DO NOT run until approved.
-- Tracks warm relationships (Oh My Mahjong first) through the funnel:
-- Identified -> Contacted -> Conversation -> Candidate -> Approved -> Activated.
-- RLS enabled, no anon policies: admin/server access only (private contact data).
-- ═══════════════════════════════════════════

create table if not exists warm_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  name text not null,
  email text,
  phone text,
  city text,
  state text,

  source text default 'oh_my_mahjong',  -- oh_my_mahjong | referral | inbound | other
  role text,                             -- teacher | studio_owner | organizer | host | club_leader | other
  heat text default 'warm',              -- hot | warm | cold
  priority_city boolean default false,   -- in a proof or launch city

  -- the funnel stage = the founder KPI
  stage text default 'identified',       -- identified | contacted | conversation | candidate | approved | activated

  ambassador_id uuid references ambassadors(id) on delete set null,  -- link once they apply/approve
  next_action text,
  next_action_date date,
  notes text
);
alter table warm_contacts enable row level security;

create index if not exists warm_contacts_stage_idx on warm_contacts (stage);
create index if not exists warm_contacts_source_idx on warm_contacts (source);
create index if not exists warm_contacts_heat_idx on warm_contacts (heat);

-- No anon policies. Admin server routes (service role) are the only access.
-- KPI this supports: counts at each stage (the funnel), conversion rates
-- between stages, and progress by source (Oh My Mahjong first), heat, and city.
