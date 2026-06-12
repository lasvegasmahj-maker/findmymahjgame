-- Relationship CRM (admin-only). One table: people and organizations FMG is
-- building relationships with (teachers, ambassador candidates, partners,
-- sponsors, media). Service-role only: RLS on, no anon policies. Idempotent.

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text,
  email text,
  phone text,
  city text,
  state text,
  contact_type text not null default 'teacher',
  entity_types text,
  wave int,
  rank int,
  status text not null default 'not_contacted',
  best_channel text,
  website text,
  instagram text,
  nv_guardrail boolean not null default false,
  notes text,
  last_touch date,
  next_touch date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists crm_contacts_email_key
  on public.crm_contacts (lower(email)) where email is not null;

alter table public.crm_contacts enable row level security;
