# Policy Approval Launch Gate Checklist

This is the checklist for which policy documents must be owner-approved and published, as real
routes on the live site, before each launch gate in `lib/launch-gates.ts` can flip from off to
on. It is a process document, not itself a policy; nothing here is legal advice and nothing here
is published to users.

> Status 2026-08-29: the owner made all 18 policy decisions
> (docs/policy/owner-decisions-2026-08-29.md) and confirmed the operating entity, Mahjong
> Collective, LLC. All five policy documents are live from the resolved drafts (/terms,
> /privacy, /provider-terms, /billing-disclosures, /matching-standards), so the policy
> precondition for every gate is met. Engineering preconditions below are met as well
> (consent wiring, the app-managed 90-day trial with no coupon, sandbox billing verified).
> The billing disclosures still depend on the owner's Stripe Billing settings before
> launch_payments opens; see docs/owner-activation-checklist.md.

The four gates, from `lib/launch-gates.ts`:

```
publicSignup    -> launch_public_signup
providerClaims  -> launch_provider_claims
payments        -> launch_payments
playerMatching  -> launch_player_matching
```

`isLaunched()` reads these from `app_settings` in the database and fails closed: a missing row,
a query error, or any value other than the literal string `"true"` means the gate stays off. All
four are off today. Flipping one is a database change, not a deploy; see
`docs/billing-launch-runbook.md` for how the `payments` gate specifically gets flipped.

## The rule

A gate may not flip until every document listed for it is:

1. **approved by the owner** (Shauna, with counsel input where she wants it), with no
   `[OWNER TO CONFIRM]` bracket left open in the document, and
2. **published as a real route** on the live site, reachable the way `/terms` and `/privacy`
   are reachable today, not just sitting in `docs/`.

A drafted document in `docs/policy/drafts/` satisfies neither condition. Drafting is this lane's
job; approving and publishing is the owner's.

## publicSignup

**Requires:** Terms of Use and Privacy Policy.

**Draft source:** `docs/policy/drafts/terms-of-use.md`, `docs/policy/drafts/privacy-policy.md`.

**Will live at:** `/terms`, `/privacy` (updating the pages that already exist at those routes).

**Why this pair:** signup creates an account and starts collecting the account data described in
the Privacy Policy (email, display name, city, state). The Terms of Use is what a new user is
agreeing to the moment they have an account, even before they create a listing or use matching.

**Status at time of this audit:** both documents are stale versions of themselves already live
at `/terms` and `/privacy`; neither currently mentions accounts at all. See
`docs/policy/audit-2026-08.md`, sections 1 and 2.

## providerClaims

**Requires:** Provider Terms, in addition to the publicSignup pair (a claim requires an
account).

**Draft source:** `docs/policy/drafts/provider-terms.md`.

**Will live at:** a new route, for example `/provider-terms`, linked from the claim flow and
from the footer alongside Terms of Use and Privacy Policy.

**Why this document:** claims now carry evidence, a confidence level, and a system-or-admin
decision (`supabase/migrations/2026-08-24-wave2-foundations.sql` lines 6 to 42). A provider
claiming a listing is agreeing to something specific: how claims are evaluated, what happens if
one is rejected or needs more information, and how paid membership relates to a free listing.
None of that exists anywhere today.

**Status at time of this audit:** missing entirely. See `docs/policy/audit-2026-08.md`,
section 4.

## payments

**Requires:** Billing Disclosures, in addition to the publicSignup pair and Provider Terms
(you cannot pay for a membership on a listing you have not claimed).

**Draft source:** `docs/policy/drafts/billing-disclosures.md`.

**Will live at:** a new route, for example `/billing-disclosures`, linked from `/join`, from
checkout, and from the footer.

**Why this document, and why it is not ready:** the audit found two different, contradictory
free-period mechanisms already built in the code (see `docs/policy/audit-2026-08.md`, section 6,
and the draft's own inline flags). Publishing a billing disclosure before that conflict is
resolved would mean publishing a document that is false the moment it goes live, no matter which
version is chosen, because the code does not yet match either description cleanly. **This gate
should not flip until:**

1. the owner decides which free-period mechanism is the real policy (see
   `[OWNER TO CONFIRM]` item 4 in the audit), and
2. the code matches that decision, and
3. the 14-day grace period and dunning behavior described in the draft is either built, or the
   draft is rewritten to describe only what is actually live.

Note also, from `docs/billing-launch-runbook.md`: `payments` has its own separate technical
checklist (Stripe account, price, coupon, webhook, environment variables, and a full test-mode
run-through) that is independent of this document requirement. Both must be satisfied.

## playerMatching

**Requires:** Matching Terms and Community Standards, in addition to the publicSignup pair (18+
consent is recorded on an account).

**Draft source:** `docs/policy/drafts/matching-community-standards.md`.

**Will live at:** a new route, for example `/matching-standards`, linked from wherever the
player-facing Mahj Match opt-in flow is built, and from the footer.

**Why this document, and an engineering blocker in addition to the document itself:** the audit
found that `readMatchingConsent()` (`lib/match/consent.ts`), the function that enforces the 18+
affirmation and explicit opt-in, has zero call sites anywhere else in the codebase. Neither the
live match-decision route (`app/api/match/decide/route.ts`) nor the matcher cron
(`app/api/cron/matcher/route.ts`) calls it yet. **This gate should not flip, and this document
should not be published claiming an enforced 18+ requirement, until every code path that can
create, propose, or accept a match calls `readMatchingConsent()` (or an equivalent check) and
fails closed when it returns ineligible.** Publishing "Mahj Match is 18+ only" as a true
statement requires the code to actually make that true everywhere, not just in one function that
nothing calls yet.

There is also currently no player-facing UI for matching consent at all (no opt-in screen, no
18+ affirmation screen). That has to exist before this gate is meaningful, separate from the
question of whether the backend check is wired in.

## Quick reference table

| Gate | Documents required | Where they will live | Ready to publish today? |
|---|---|---|---|
| publicSignup | Terms of Use, Privacy Policy | `/terms`, `/privacy` | No, drafts need owner review |
| providerClaims | + Provider Terms | + `/provider-terms` | No, drafts need owner review |
| payments | + Billing Disclosures | + `/billing-disclosures` | No, blocked on the free-period conflict, see above |
| playerMatching | + Matching Terms and Community Standards | + `/matching-standards` | No, blocked on the consent-wiring gap, see above, in addition to owner review |

## What this lane did and did not do

This lane (policy and legal product readiness, branch `wf-policy`) wrote the audit and the
drafts. It did not edit any file under `app/`, did not touch the footer, did not wire
`readMatchingConsent()` into any route, and did not resolve the billing free-period conflict.
Those are follow-up work for the owner and for whichever lane owns `app/` and `lib/match/`. This
document exists so that follow-up work has a single, precise checklist to work against instead
of rediscovering these gaps from scratch.
