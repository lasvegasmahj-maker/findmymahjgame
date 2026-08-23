# Provider Business Model: Decision Support, August 2026

Decision support only. Build freeze intact: no code, pricing, copy, or gates were changed. Everything below distinguishes what exists in the shipped system from what would be future work.

## Headline recommendation

- Basic (free forever): claim, control, and maintain a listing; full marketplace participation; neutral placement. This matches what the code already does and what every competitor offers.
- Premium ($89/year): credibility plus demand capture: the Verified Community Leader badge and structured on-platform lesson-inquiry leads (both already built), plus Charter recognition for early converts. Premium buys being chosen more often, never being listed.
- Founding offer: a 90-day Premium trial starting from each provider's own claim date, no card required, reverting automatically to permanent free Basic. This also cleanly replaces the currently conflicting 6-month-code versus 12-month-coupon mechanics recorded in owner-decisions.

## 1. Current provider functionality audit (verified in code and production)

PUBLIC / FREE-CAPABLE TODAY (no tier gate anywhere in the code path):
- Being listed: research-sourced listings exist and publish without payment; the public get-listed submission flow exists.
- Claiming: account-based claims with deterministic evidence scoring, auto-approval on strong evidence, admin review otherwise. No payment involved.
- Verification: the claim evidence system (email or domain match). Free.
- Provider dashboard (/provider): owned listings, claim status and history, membership status display, account settings. No tier gating in app/api/provider or the dashboard UI.
- Editing: change requests through the pending-edits review flow. Free.
- Profile fields: business name, type, city, state, description, website, Instagram, display email. Free listings with a website get their site link shown on the public card.
- Search and directory placement: neutral. The Nevada fairness work removed all placement manipulation; nothing in ranking reads tier.
- Notifications: claim received, approved, needs info, rejected, listing status. Free, ledgered.
- Ask inclusion: directory answers draw from all published listings regardless of tier.

CURRENTLY ASSOCIATED WITH THE $89 MEMBERSHIP (tier "pro") IN CODE:
- The Verified Community Leader badge on the public teacher card (StatusBadge, tier pro).
- Structured lesson-inquiry lead capture: the "Request a lesson" flow renders only for tier pro. Leads are the one concrete demand-capture feature in the product, and today they are Premium-gated.
- Charter Member badge and the locked-in $89 renewal promise (join page, badge system).
- Billing rails: $89/year Stripe checkout, webhook, reconciliation, membership status surface. Built, dark, awaiting Stripe credentials.
- Note a copy-versus-code contradiction: the join page currently sells the membership as "list your profile, classes, and events" (pay to be listed) and promises "higher placement than standard listings." The code does neither: listings are free in practice and ranking is deliberately neutral. lib/tiers.ts states the design intent explicitly: the paid tier "buys visibility, credibility, and promotion, never the listing itself." The owner's new direction resolves this contradiction in favor of the code's design.

DOES NOT EXIST (would be future work; do not treat as available):
- Provider analytics or demand insights (profile views, search appearances, local zero-result demand). The first-party analytics infrastructure exists platform-side, but no provider-facing surface.
- Event creation or management from the dashboard (new events go through the public submission flow; no RSVP or attendee tools).
- Featured or promoted placement mechanics (the featured event sort is deliberately disabled; the separate advertising product is deferred to Year 2).
- Lead inbox or lead intelligence in the dashboard (inquiries relay by email today).
- Listing or event limits of any kind.
- Stripe customer portal (checkout and webhook exist; self-serve plan management does not).
- Trial mechanics (90-day auto-reverting trial is not built; the current dark Stripe setup uses a 100-percent-off-once coupon, which grants 12 months, and the live teacher path promises 6 months by code. These conflict; the trial recommendation replaces both).

## 2. Should Basic listing be free? Yes, and the evidence is one-sided.

For free Basic:
- Marketplace completeness is the product. The competitive benchmark scored Find My Mahj weakest on inventory breadth. Every legitimate free listing makes search results fuller, city pages stronger, Ask answers better, and SEO pages richer. Charging to appear directly taxes the thing the platform most needs.
- Every serious competitor lists providers free. Bam Good Time's directory is free (it charges $19-49/month for club-management tools, not listing). AMA's 538-teacher directory is free to browse. Facebook is free. A pay-to-be-listed Find My Mahj would be the only paywalled directory in the category and would structurally guarantee thinner supply than free rivals.
- Cold start: pre-liquidity, providers have no evidence the platform sends them anything. Asking for $89 before demonstrated value converts almost nobody and poisons goodwill; the benchmark's provider-conversion risk becomes a certainty.
- The code was already designed this way (tiers.ts), and the fairness architecture already guarantees free listings are never suppressed.

Against free Basic (and why each is manageable):
- Loses the immediate revenue gate: true, but the gate is currently worth almost nothing (at today's 41 venues, full paid compliance would be about $3,600 a year) while costing supply. Freemium on a larger base is the standard directory economics, and Bam Good Time validates freemium in this exact market at higher price points.
- Some providers never upgrade: expected and fine; their free listings still feed the national engine and SEO.
- Free may dilute Premium's perceived value: only if Premium is vague. The answer is a sharp Premium promise (below), not a listing paywall.
- Requires a genuine Premium proposition: correct, and two Premium features already exist in code.

Conclusion: free Basic is the right model economically, competitively, and architecturally.

## 3. What $89/year should actually buy

Principles honored: no paywalled completeness, no limiting useful events to force payment, no hidden pay-to-win ranking, no suppression of free competitors, no biased Ask answers (any future sponsored treatment must be explicit and labeled, like the existing From-our-founder card pattern).

The smallest sensible Premium, using only what EXISTS NOW (day-one sellable):
1. Verified Community Leader badge: a trust marker on the public card. Credibility.
2. Structured lesson-inquiry leads: the on-platform "Request a lesson" capture. Demand. Free listings remain fully reachable through their own website and contact links, so the marketplace stays connective; Premium adds the frictionless structured lead path.
3. Charter Member recognition and locked-in $89 renewal for early converts. Belonging and price certainty.
Positioning in one sentence: Basic gets you found; Premium gets you chosen.

FUTURE POSSIBILITY (not built; candidates once real data exists, in value order):
4. Provider demand insights: your profile views, search appearances, and unmet demand near you (zero-result searches). The analytics substrate exists; the provider surface does not. Likely the strongest future retention feature.
5. Clearly labeled promotional placement (a labeled Featured slot that never replaces or outranks organic results, following the established labeled-card pattern).
6. Event tools (RSVP and rosters) are Bam Good Time's home turf; recommend not chasing them.

Required copy consequence (owner-approved change, later, not now): the join page's "list your profile" framing and the "higher placement than standard listings" promise must be rewritten to the Basic/Premium truth, since neutral ranking is a fairness commitment the code enforces.

## 4. Founding offer comparison

Scored qualitatively against: provider acquisition, marketplace supply, willingness-to-pay learning, price anchoring, complexity, gaming risk, long-term revenue, goodwill, national growth.

- A. $89 immediately: worst acquisition and supply at cold start; clean but tiny willingness-to-pay signal; simple; no gaming; revenue trivial at current scale; poor goodwill; slows national growth. Rejected.
- B. Entire provider product free for the first 3 calendar months: good early acquisition, but a fixed calendar cliff gives late joiners short trials, synchronizes one messy conversion moment, and muddies cohort learning. Moderate complexity. Rejected.
- C. 90-day Premium trial from each provider's own claim date: strong acquisition (free to start, no card), full supply effect, the best willingness-to-pay learning (clean rolling cohorts each deciding at day 90 after experiencing value), anchors $89 as the real price, simple to explain ("Premium free for your first 90 days, then $89 or stay free forever"), minimal gaming (one trial per listing), revenue delayed one quarter but better informed, high goodwill, supports national growth. Recommended.
- D. Permanent founding free Premium: maximum goodwill, zero willingness-to-pay learning, permanent revenue forgone, and it devalues Premium for every later cohort. Rejected.
- E. Discounted founding annual price: immediate revenue signal but anchors the price below $89 permanently and complicates the single-price model. Rejected as a discount; its good part survives as Charter recognition (permanent badge plus locked-in $89) for those who convert during their trial.

Recommended structure (best 1-2): C, optionally paired with the Charter overlay (convert during your trial, keep the Charter badge and the locked $89 renewal). This also resolves the open 6-month versus 12-month free-period contradiction with one clean mechanic. Implementation note for later, not now: Stripe supports trial periods natively, so this is configuration-level when the freeze lifts and Stripe is activated.

## 5. 90-day success model (operating hypotheses, not proven benchmarks)

These are starting guesses to be replaced by real observations; there is no historical user data. Seed metros are Las Vegas, then St. Louis, per the market-entry plan.

MINIMUM PROOF (the thesis survives):
- Player: 150 real accounts; 100 completed profiles; 60 Mahj Match opt-ins; 40 match-ready players concentrated in seed metros.
- Liquidity: Las Vegas reaches the EARLY band; 10 table proposals; 4 tables formed; median time-to-table under 3 weeks for seed-metro opt-ins; 7-day match success at or above 20 percent in Las Vegas; at least one repeat table or 3 players requesting repeat play.
- Provider: 15 claims; 10 actively maintained claimed listings; 10 events or updates contributed by providers; 8 Premium trials started; mature trial-to-paid conversion at or above 10 percent (tiny cohorts, directional only).
- National discovery: 20+ states with at least one current listing; 200+ current listings; zero-result search rate under 60 percent; steady Ask engagement; organic traffic measurable once Search Console connects.

STRONG LAUNCH:
- Player: 400 accounts; 275 profiles; 150 opt-ins; 100 match-ready.
- Liquidity: Las Vegas USABLE and St. Louis EARLY; 40 proposals; 15 tables; median time-to-table under 10 days in Las Vegas; 7-day success at or above 40 percent in seed metros; repeat participation at or above 25 percent of table players.
- Provider: 40 claims; 30 active; 40 events contributed; 25 trials; mature conversion at or above 20 percent.
- National: 30 states covered; 350 current listings; zero-result under 40 percent; Search Console impressions trending up.

BREAKOUT:
- Player: 1,000 accounts; 600 profiles; 350 opt-ins; 250 match-ready.
- Liquidity: Las Vegas HEALTHY, St. Louis USABLE, a third metro EARLY; 120 proposals; 45 tables; median time-to-table under 7 days; 7-day success at or above 60 percent in seed metros; repeat participation at or above 40 percent.
- Provider: 100 claims; 75 active; 120 events contributed; 60 trials; mature conversion at or above 30 percent.
- National: 40 states; 600+ current listings; zero-result under 25 percent; organic becomes the largest acquisition channel.

## 6. North Star and CEO metrics

Recommended North Star: PERCENTAGE OF MATCH-READY PLAYERS WHO FORM A VIABLE TABLE WITHIN 7 DAYS.

Why it beats the alternatives: it is a quality ratio, not a vanity count; it captures exactly the marketplace's unique promise (a real table, fast); it is comparable across metros and over time; and it directly exposes the liquidity ceiling. Tables-formed-per-week measures volume but hides whether players wait weeks; time-to-first-table is good but is a one-time per-metro milestone, not an ongoing rate; repeat-play rate is the best long-term truth but lags too much to steer a launch. Guardrails: pair it with repeat participation (a table that forms once and never repeats is not success), hold the match-ready definition fixed so the denominator cannot be gamed, and read it per-metro because tiny early denominators are noisy.

CEO launch metrics (10, including the North Star):
1. North Star: 7-day match success rate among match-ready players, per seed metro.
2. Match-ready players by metro (the liquidity pool).
3. Tables formed per week, and proposals-to-formed ratio.
4. Repeat participation rate (players returning for a second table).
5. Real provider claims (and share of researched listings claimed in seed metros).
6. Actively maintained claimed listings (edited or confirmed current in the last 90 days).
7. Premium trials started, and mature trial-to-paid conversion (only cohorts past day 90).
8. Zero-result search rate by metro (demand the supply does not meet).
9. Organic acquisition share (players and providers arriving without founder or paid effort).
10. Needs-Human volume (the hands-off test: agents should absorb routine work).
Total accounts may be reported for context but is not a success measure.

## 7. National versus seed-market growth: the two-engine model is right

Yes, run both engines, and the free-Basic decision makes the national engine stronger:
- NATIONAL ENGINE (everywhere, from day one): directory, provider claims with free Basic, events, Ask, rules, SEO, accounts. Free Basic means every legitimate provider anywhere strengthens completeness and SEO at zero acquisition cost. Nothing about this engine needs density.
- LIQUIDITY ENGINE (concentrated): player acquisition and Mahj Match promotion in Las Vegas, then St. Louis, then a third metro. Matching self-concentrates by architecture (tables only form where players share a city), so concentration is operational.
This decision does not change the seed-market ranking; no reopening needed. One tension to manage honestly: Premium's strongest value (leads) depends on local player demand, which exists first in seed metros, so early trial-to-paid conversion will look weakest outside them. Read conversion per-metro and judge mature cohorts only; the trial costs nothing to the provider either way.

## 8. Risks of the recommended model

- Revenue is deferred about one quarter (trials) and depends on conversion that will lag liquidity. Mitigation: conversion is a metric, not a launch gate; the model optimizes supply first, which the benchmark says is the binding constraint.
- Premium may under-convert if leads are thin pre-liquidity. Mitigation: seed-metro concentration puts player demand where the first trials are; add demand-insights later as the retention feature.
- Free-rider perception: some providers stay Basic forever. Accepted; their listings are the product's raw material.
- Copy debt: the join page's pay-to-list framing and placement promise must be rewritten once the owner commits (an owner-approved copy change, permitted under the freeze rules when she directs it).
- Mechanics debt: the 90-day trial replaces the conflicting 6-month code and 12-month coupon; Stripe configuration must change at activation time (configuration, not engineering).

## 9. The one unresolved business question for Shauna

Where exactly does the free/paid line sit on player-to-provider contact? Specifically: should structured on-platform lesson inquiries remain Premium-only (the recommendation: it is the strongest, already-built conversion hook, while free listings stay reachable through their own website and contact links), or should inquiries be free for everyone, with Premium reduced to credibility and recognition only? Everything else in this model follows from that single choice: the strength of the $89 promise, the trial's conversion logic, and how connective the free marketplace feels. It is a values-and-economics call only the owner can make.
