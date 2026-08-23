-- Data-truth correction (owner-approved 2026-08-23): directory listings that carry
-- a paid tier with no verified payment and no founding-member entitlement. They
-- predate the Stripe billing system; the tier was set during research import, not
-- bought. Paid status must trace to a real payment or a documented entitlement, so
-- these reset to 'free'. Provenance is preserved in an audit table; nothing is
-- deleted, no financial event is created, and this is not churn (none were ever
-- paying). Covers both venue_listings and event_listings; the count of corrected
-- rows is whatever the definition below matches and is recorded per row in the
-- audit table, not asserted here.

create table if not exists public.listing_tier_corrections (
  id uuid primary key default gen_random_uuid(),
  listing_table text not null,
  listing_id uuid not null,
  old_tier text,
  new_tier text not null,
  reason text not null,
  corrected_at timestamptz not null default now()
);
alter table public.listing_tier_corrections enable row level security;

comment on table public.listing_tier_corrections is
  'Audit trail for tier data-truth corrections. Preserves the prior tier and the reason so no provenance is lost when an unsupported paid status is reset.';

-- Unsupported paid status, precisely: a non-free tier with neither a Stripe payment
-- id nor a founding-member entitlement. Record the before-state, then reset. Both
-- statements share the same WHERE clause, so re-running is safe: already-free rows
-- no longer match and are neither re-audited nor re-updated.
do $$
declare t text;
begin
  foreach t in array array['venue_listings', 'event_listings'] loop
    execute format($f$
      insert into public.listing_tier_corrections (listing_table, listing_id, old_tier, new_tier, reason)
      select %L, id, tier, 'free',
             'Paid tier without verified payment or founding-member entitlement; predates billing, reset to free per data-truth policy 2026-08-23.'
        from public.%I
       where tier is not null and tier <> 'free'
         and stripe_payment_id is null
         and coalesce(is_founding_member, false) = false
    $f$, t, t);
    execute format($f$
      update public.%I set tier = 'free'
       where tier is not null and tier <> 'free'
         and stripe_payment_id is null
         and coalesce(is_founding_member, false) = false
    $f$, t);
  end loop;
end $$;
