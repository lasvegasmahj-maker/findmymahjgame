# Directory Membership: Billing Disclosures

**DRAFT FOR OWNER REVIEW, NOT YET IN EFFECT.** This is a working draft for Shauna and counsel to
review and edit. No billing disclosure document exists anywhere on the site today; pricing
currently appears only as marketing copy on `/join` and `/get-listed`. See
`docs/policy/audit-2026-08.md`, section 6, for the full audit.

**This document cannot be finalized yet.** The audit found two different free-period mechanisms
already built in the code, and they do not agree with each other (6 months, no card, manual
billing setup by email, which is what actually runs today, versus a full year, card collected
at checkout, automatic renewal, which is built but not yet turned on). Sections below marked
`[OWNER TO CONFIRM]` include this conflict. Do not publish this document, or flip the `payments`
launch gate, until it is resolved. See `docs/policy/launch-gate.md`.

Bracketed items marked `[OWNER TO CONFIRM]` are business or legal facts only the owner can
decide. Do not publish this document with any bracket still open.

---

## The short version

- Players never pay, for anything, ever.
- A basic listing (Community Listing) is free forever for teachers, organizers, and businesses.
- Directory Membership is $89 a year and adds visibility features on top of your free listing.
- Promo code FINDMYMAHJGAME gives new members a free introductory period.
- We never see or store your card number. Payments are handled by Stripe.

## Who pays, and who does not

Directory Membership is for teachers, organizers, and businesses. Players browsing, searching,
creating a player listing, or using Mahj Match never pay anything.

## What Directory Membership costs

Directory Membership is $89 per year. It includes your profile, your classes, and your events,
plus visibility features on top of the free Community Listing (search placement, state directory
placement, and similar). Your basic listing is never removed or hidden for not paying; paying
only adds promotion on top of it.

## The introductory offer, code FINDMYMAHJGAME

[OWNER TO CONFIRM: which of the following two mechanisms is the actual policy going forward. As
of this draft, only mechanism A is live.]

**A. What is live today:** if you join using promo code FINDMYMAHJGAME, your first 6 months are
free. No card is collected when you submit your listing. Before your free period ends, we email
you to set up billing. Nothing is charged automatically; billing is set up by hand with our team.

**B. What is built but not yet turned on:** an automated checkout, through Stripe, for the $89
per year membership. A promo code applied at checkout can waive an entire billing period. Because
the membership is billed annually, waiving one billing period this way waives a full year, not 6
months, and a card is collected at checkout time even though the waived period is free, so it is
on file for automatic renewal afterward.

Until this is resolved, the only offer this document can describe with confidence is A: 6 months
free, no card collected, billing set up manually by our team before the free period ends.

## Renewal

[OWNER TO CONFIRM, dependent on resolving the section above.] Once mechanism B (automated Stripe
checkout) is turned on: your membership renews automatically each year at $89 unless you cancel
before your renewal date. You will be notified before a renewal charge. [OWNER TO CONFIRM: how
many days of advance notice].

## Cancellation

You can cancel your Directory Membership at any time. [OWNER TO CONFIRM: whether cancellation is
self-service once automated billing is live, or handled by request to hello@findmymahjgame.com
in the meantime]. There is no cancellation fee. Cancelling stops future billing; it does not
remove your listing, which reverts to the free Community Listing tier.

## If a payment fails

[OWNER TO CONFIRM before publishing: this section describes an intended policy that is not yet
built. As of this draft, a failed payment marks your membership as past due internally, but no
automatic grace-period notice, reminder email, or downgrade currently happens; that has to be
built before this paragraph can be published as a description of present behavior.]

The intended policy: if a payment fails, you get a 14-day grace period during which your
Directory Membership benefits continue while we ask you to update your payment method. If
payment is not resolved within that window, your listing reverts to the free Community Listing
tier. It is never deleted. There is no penalty fee for a failed or late payment beyond the loss
of paid visibility features once the grace period ends.

## What we store, and what we never store

We use Stripe to process all payments. We never see or store your card number, expiration date,
or security code. What we do keep, to show you your own membership status and keep your listing
benefits current, is limited to: your email, a reference ID from Stripe identifying your
subscription, its status (active, past due, or cancelled), and the price you are on. If our
records and Stripe's ever disagree, Stripe's record is always the correct one.

## Refunds

[OWNER TO CONFIRM: refund policy for the $89/year Directory Membership. The former advertiser
pricing model had a 30-day prorated refund window for annual plans; whether that carries forward
to Directory Membership, and whether it is the same policy as the separate advertiser/sponsor
track described in Advertiser Terms, needs a decision.]

## Founding Advisor and Charter Member pricing

Founding Advisors (an invitation-only recognition) receive 12 months free, then lifetime
locked-in Charter pricing. Charter Members (early supporters who join during launch and keep an
active profile) lock in the $89/year rate for as long as they stay active. These are recognition
programs layered on top of the membership described above, not separate products.

## Changes to this disclosure

We may update these billing terms. If a change affects your price or renewal, you will be
notified before it takes effect for you.

## Contact

Billing questions: hello@findmymahjgame.com.

---

*Last drafted: this working draft has no effective date until the owner approves and publishes
it, and until the free-period mechanism conflict described above is resolved. See
`docs/policy/launch-gate.md`.*
