-- Founder task system (/admin/tasks). One table, no project-management
-- apparatus. Service-role only: RLS on with no anon policies, same posture
-- as the other admin data. Idempotent; safe to run more than once.

create table if not exists public.founder_tasks (
  id uuid primary key default gen_random_uuid(),
  task text not null,
  notes text,
  category text not null default 'ops',
  priority text not null default 'normal',
  due_date date,
  status text not null default 'open',
  waiting_on text,
  related_name text,
  snoozed_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.founder_tasks enable row level security;
