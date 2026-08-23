# APPROVED DECISION: Provider Business Model (owner-approved 2026-08-23, implemented)

Owner-approved 2026-08-23 with two refinements (verification is never bought; the founder is not copied on routine leads) and implemented the same day. This records the approved model and the audit that supported it. Analysis backing it: docs/provider-business-model-decision-2026-08.md.

## The proposed model

PLAYERS: free forever.

PROVIDER BASIC: free forever. Includes legitimate listing, claiming and verification, the provider dashboard, editing and maintaining the listing, posting legitimate events, classes, and open plays supported by the current marketplace, neutral organic directory and search placement, Ask Find My Mahj inclusion, and at least one provider-controlled external contact path where available. A free listing must never be a dead end for a player.

PROVIDER PREMIUM: $89/year. Premium monetizes business conversion, not marketplace admission. Centered on structured on-platform lesson and provider inquiries, lead capture, lead notifications, lead history and analytics where already built, the Premium Provider badge (per the owner refinement, verification is a separate earned trust state and is never bought), and Charter or Founding recognition for qualifying early converts. Principle: Basic gets you found. Premium helps turn discovery into customers. No hidden paid ranking. No suppression of Basic providers. No bias in Ask answers toward paid providers. Any future paid promotional placement must be clearly labeled.

FOUNDING OFFER: 90 days of Premium starting from each provider's individual claim date. No card required to begin. At day 90 the provider voluntarily chooses $89/year Premium or automatically returns to permanent free Basic. Nobody is ever billed without a clear opt in.

MONETIZATION DIAGNOSTIC: segment trial-to-paid conversion by market maturity and by leads received during trial (0, 1, 2-3, 4+). The primary diagnostic: among providers who received at least one qualified Find My Mahj lead during their trial, what percentage voluntarily chose $89/year? This separates liquidity failure from Premium value failure. Target rates are deliberately not set yet; operating hypotheses will be proposed separately and replaced by real data.

## Implementation audit (read-only, verified in code)

1. Basic external contact paths, today: the public teacher card shows the provider's display email (mailto link) and Instagram for ANY listing that has them, tier-free, plus a Visit Website link when a site exists. The teacher profile page shows the full Contact Directly block (website, email, Instagram) for every published teacher with no tier condition. Basic listings are already not dead ends wherever contact data exists. The only tier-gated contact element is the structured Request a Lesson button.

2. The structured lesson-inquiry flow, today: a player fills a modal (name, email, message); the API resolves the teacher's email server-side (never trusting the client) and emails the lead directly to the provider with a copy to hello@findmymahjgame.com. It renders only for tier pro.

3. Lead management and analytics, today: lead NOTIFICATION exists (instant email per inquiry, founder copy as archive). Lead HISTORY and MANAGEMENT do not exist: the lesson-inquiry route stores nothing in the database and the provider dashboard has no leads surface. Provider lead ANALYTICS do not exist. So day-one Premium is inquiries plus notifications plus badge plus recognition; history and analytics are future work.

4. Pay-to-list copy, confirmed: the join page metadata and body sell the membership as "list your profile, classes, and events on the national mahjong directory. 6 months free with code FINDMYMAHJGAME, then $89 a year." This implies payment is required to be listed, which the code does not enforce and the proposed model rejects.

5. Unimplemented paid-advantage copy, confirmed: the join page benefit list promises "Higher placement than standard listings." The fairness architecture deliberately provides no paid ranking anywhere. This promise must be removed or converted into clearly labeled promotional placement if ever built.

6. Copy requiring owner-approved correction if the model is adopted: app/join/page.tsx (metadata and headline framing, the Directory Membership section, the benefit checklist including the placement promise, all 6-months language), app/get-listed/get-listed-client.tsx (the FINDMYMAHJGAME 6-months-free Charter copy and promo validation messaging), docs/billing-launch-runbook.md (the 12-month coupon step), and a review of lib/tiers.ts display prices for consistency with the final model.

7. Conflicting old offer mechanics, confirmed: the live teacher path promises 6 months free via FINDMYMAHJGAME with no card and manual billing follow-up; the dark Stripe runbook uses a 100-percent-off-once coupon, which grants 12 months with a card at checkout. These contradict each other and both conflict with the rolling 90-day trial. Both retire if this model is approved.

8. Stripe configuration versus engineering at activation: because the trial requires no card and runs from the claim date, the trial lives app-side and Stripe appears only at voluntary conversion. Stripe configuration becomes simpler: the plain $89/year price, no coupon step, no Stripe-side trial. One honest engineering note, not implemented under the freeze: granting Premium features during the app-side trial needs a small build (a premium-until date derived from the claim date that the existing tier check reads). That is the only engineering the model requires, and it waits for approval.

## Status

APPROVED and implemented 2026-08-23 (see the implementation record below). Launch gates remain OFF; build freeze resumes for unrelated work.

## Implementation record (2026-08-23)

- premium_until entitlement column on venue and event listings. The 90-day trial starts idempotently, after ownership is granted, on venue (teacher) listings only: the only listings where Premium surfaces exist today. The event_listings column is reserved for future use. Paid Premium later extends the date through Stripe truth; a trial provider is never counted as paying.
- Verified badge now comes from the evidence-based claim (trust), Premium Provider is the separate commercial badge; payment cannot award verification anywhere.
- The structured lesson inquiry is entitlement-gated in the API, sends the lead straight to the provider with no founder copy, and records only PII-free metadata (provider, timestamp, delivery status, test or real class) in provider_leads for the conversion diagnostic.
- FINDMYMAHJGAME retired everywhere (validate-promo, get-listed form and route, join, how-it-works, FAQ schema); the Stripe checkout takes no promotion codes and the runbook coupon step is replaced.
- Join and pricing copy rewritten to the Basic free forever / Premium $89 truth with the false higher-placement promise removed.

