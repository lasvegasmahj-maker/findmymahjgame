-- Master launch gates. Everything unlaunched reads false; flipping to 'true' is the launch
-- action, taken by the owner, never by an agent.
insert into public.app_settings (key, value) values
  ('launch_public_signup', 'false'),
  ('launch_provider_claims', 'false'),
  ('launch_payments', 'false'),
  ('launch_player_matching', 'false')
on conflict (key) do nothing;

-- Identity: auth.users is the source of truth for who a person is and whether their email is
-- verified. profiles carries the product-side role and the data-trust class, so a QA account
-- can never be counted as a real one.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('player', 'provider')),
  display_name text,
  record_class text not null default 'real_external'
    check (record_class in ('real_external', 'test', 'internal', 'seed_demo')),
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table if not exists public.account_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);
alter table public.account_events enable row level security;
create index if not exists account_events_user_idx on public.account_events (user_id, created_at);
