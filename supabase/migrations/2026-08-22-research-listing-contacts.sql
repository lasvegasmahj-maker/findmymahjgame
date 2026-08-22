-- Phase 5: allow a researched listing to exist without a contact email.
--
-- contact_email was NOT NULL because every listing used to arrive through a form where the
-- submitter typed their address. Research sourced listings break that assumption: a real,
-- currently active business can publish a booking page and no email at all. The choice is
-- either to invent an address, which the data honesty rule forbids, or to let the column be
-- null. Nothing reads venue_listings.contact_email to send mail (the claim flow uses
-- display_email, and the connect route reads player_listings and cruise_posts), and the
-- column is outside the public field allowlist in lib/search.ts, so relaxing it changes no
-- public surface.
--
-- Additive and reversible: existing rows keep their values, and no default is introduced.

alter table public.venue_listings alter column contact_email drop not null;

-- source_type already constrains provenance to a known vocabulary. Research imports are
-- recorded as 'imported', which the existing check allows, so no constraint change is needed
-- here; this comment exists so the next reader does not re-derive that.
