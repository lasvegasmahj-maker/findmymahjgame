-- contact_email was NOT NULL because listings used to arrive through a form where someone
-- typed their address. A researched business can publish a booking page and no email at all,
-- so the choice was to invent an address, which the data honesty rule forbids, or allow null.
-- No send path reads these columns; lib/growth-guards.ts does read contact_email to raise
-- already_a_member, so that guard now also checks the prospect listing linkage.

alter table public.venue_listings alter column contact_email drop not null;
alter table public.event_listings alter column contact_email drop not null;

-- source_type already constrains provenance to a known vocabulary. Research imports are
-- recorded as 'imported', which the existing check allows, so no constraint change is needed
-- here; this comment exists so the next reader does not re-derive that.
