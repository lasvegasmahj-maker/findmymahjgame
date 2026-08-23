-- Provider Premium entitlement (owner-approved 2026-08-23). A listing is Premium
-- while premium_until is in the future. It is set to the claim date plus 90 days
-- when a claim grants ownership (the complimentary Founding trial, no card), and
-- later extended by a real Stripe subscription once payments are live. Null or a
-- past date means Basic. This is an entitlement date, never a payment record:
-- revenue and paying-member truth still come only from billing_subscriptions, so a
-- trial provider is never counted as paying.
alter table public.venue_listings add column if not exists premium_until timestamptz;
alter table public.event_listings add column if not exists premium_until timestamptz;

-- Minimal structured-lead metadata. No message content and no player name or email
-- are stored: only enough to confirm delivery, handle abuse, reconcile, and measure
-- whether Premium generated qualified leads. record_class keeps QA leads out of real
-- counts. RLS on, no policies: service-role only, never read from the browser.
create table if not exists public.provider_leads (
  id uuid primary key default gen_random_uuid(),
  provider_table text not null check (provider_table in ('venue_listings', 'event_listings')),
  provider_id uuid not null,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  record_class text not null default 'real_external'
    check (record_class in ('real_external', 'test', 'internal', 'seed_demo')),
  created_at timestamptz not null default now()
);
alter table public.provider_leads enable row level security;
create index if not exists provider_leads_provider_idx
  on public.provider_leads (provider_table, provider_id, created_at);

comment on table public.provider_leads is
  'Minimal structured-lead metadata for delivery, abuse handling, reconciliation, and the Premium conversion diagnostic. Never stores message content or player PII.';
