-- Billing mirror tables. Additive and idempotent. Ships dark: nothing writes to these
-- tables until the owner configures Stripe and flips launch_payments.
--
-- Why these tables exist at all: Stripe is the source of financial truth. Whether someone
-- has paid is always answered by Stripe, never by a row here. These tables are a local
-- mirror maintained by the verified webhook so the admin dashboard can report revenue
-- without calling Stripe on every page view, and so subscriptions can be joined to
-- listings. If the mirror and Stripe ever disagree, Stripe wins; lib/billing/reconcile.ts
-- exists to find exactly those disagreements. Never treat a row here as proof of payment.

-- One row per person who started a checkout or became a Stripe customer.
create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  -- Nullable on purpose: checkout can begin before the buyer has an account
  -- (the membership spec's email-is-the-spine rule); linked later by email.
  user_id uuid,
  email text not null,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);
alter table public.billing_customers enable row level security;
create index if not exists billing_customers_email_idx on public.billing_customers (lower(email));

comment on table public.billing_customers is
  'Local mirror of Stripe customers. Stripe is the source of financial truth; this table exists for reporting and email-to-customer joins, never as proof of payment.';

-- One row per Stripe subscription, kept current by the webhook.
create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  -- Which directory listing this subscription pays for, once known.
  listing_table text,
  listing_id uuid,
  -- Same data-trust vocabulary as the rest of the schema (2026-08-22-data-trust.sql):
  -- QA and internal subscriptions must never count as revenue.
  record_class text not null default 'real_external'
    check (record_class in ('real_external', 'test', 'internal', 'seed_demo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.billing_subscriptions enable row level security;
create index if not exists billing_subscriptions_customer_idx on public.billing_subscriptions (stripe_customer_id);
create index if not exists billing_subscriptions_status_idx on public.billing_subscriptions (status);

comment on table public.billing_subscriptions is
  'Local mirror of Stripe subscriptions, upserted only from signature-verified webhook events. Stripe is the source of financial truth; use this for reporting, never to prove payment.';

-- Webhook idempotency ledger: the unique stripe_event_id makes redelivered events no-ops.
create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  type text not null,
  payload_summary text,
  processed_at timestamptz default now()
);
alter table public.billing_events enable row level security;

comment on table public.billing_events is
  'Every Stripe webhook event processed, keyed by Stripe event id so redeliveries are no-ops. Audit trail only; the payload summary is a short label, not the full payload.';

-- RLS is enabled with no anon policies on all three tables: billing data is reachable
-- only through the service-role key on the server, never from the browser.
