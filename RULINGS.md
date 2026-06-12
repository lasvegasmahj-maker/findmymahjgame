# FMG Rulings Register

One page. Every accepted ruling has a status. No build or agent overrides a
ruling silently; a change here requires a founder decision. Updated 2026-06-12.

Statuses: IN CODE (on product-readiness-previews) · STAGED SQL (in the
migration file, awaiting paste) · FOUNDER (her decision, prepared) · BUILD
(scheduled, with its gate) · DEFERRED (named trigger) · DEAD.

## Mission and metrics
- FMG is "the place where Mahjong people find their people"; never a directory. FOUNDER (constitution).
- North Star: Weekly Player-Games Confirmed, with the >=50% confirmation-rate guardrail welded beside it. IN CODE (played_at/filled_at stamps); hero tile is BUILD (/admin/today).
- Weekly belonging review metric: PTWM (players with 2+ confirmed sessions, same table lineage, 28 days). BUILD (needs tables.root_id).
- Conversion event: third confirmed played game with the same group ("she found her people"). BUILD (needs game_sessions).

## Safety (red team, non-negotiable)
- Public search never surfaces nearly-full tables; no fill-order sorting. IN CODE.
- No attendee names on public table pages; seat count only. IN CODE.
- Played confirmation never on a public URL; private email tokens with an idempotency guard. IN CODE.
- Rate limits: tables/find 20/min, admin login 5 per 5 min. IN CODE.
- Host approval before a stranger joins via pooling. BUILD (gates the Bench pilot; pooling does not launch without it).
- Stranger matching pilots in Dallas only, founder-approved, 3 tables/day cap. BUILD gate.

## Privacy (verified live)
- Anon SELECT revoked on all four listing tables; pending rows invisible; self-publish closed (default pending_review + restrictive policy). APPLIED in production DB.
- Explicit public-safe column selects on state pages and homepage. IN CODE.
- DELTA NOT YET PASTED: ambassadors.referral_code (added to the migration file after the founder's pastes; one small SQL paste outstanding).

## Product rulings
- ONE Bench: Fourth Chair + Sub Bench + Re-homing + Snowbird + Mover merge into one city seat pool, one daily approve-gated matcher; "this week vs ongoing" is a field. BUILD #1.
- Tables default to a 5-6 person roster; the table that lives at four dies at four. BUILD (with Bench migration).
- Run It Back: minimal link IN CODE (played=yes page); clone-with-roster + is_recurring BUILD. Second-game default ships as an A/B (explicit button vs opt-out) on the first 12-20 tables; opt-out is NOT assumed.
- Recognition at launch = ONE honor: numbered Founding Ambassador email in Shauna's voice + server-issued ref codes. All other honors/profiles/walls DEFERRED (Month 2 trigger: attribution validated). Apparatus DEAD until then.
- Launch trust = four computed lines (freshness stamp, named host + tenure, played counts, route-out CTA). Endorsements + trust stack DEFERRED to Year 1.
- Travel: one copy line only ("Where are you, or where are you going?"). Page DEFERRED (September snowbird campaign). Seasonal paused state ships BEFORE any Florida listing publishes.
- No reviews, no stars, no public points, no leaderboards, ever. DEAD by design.
- Voice charter: no emoji anywhere user-facing. IN CODE (swept).

## Teachers
- The Teacher Promise (final wording) published on /teachers. IN CODE on preview; the deploy go carries it. FOUNDER decision 2.
- Money never crosses the table: no booking cuts, no pay-for-placement, no FMG lessons. DEAD by design, permanent.
- Graduation kit within 14 days of every claim: the highest-ROI founder action. OPERATIONS (Week 1 motion).
- OMM: deter then partner. Founding Teacher invites to her Dallas Mentors first; the Trottier letter at ~60 days with receipts. OPERATIONS.

## Markets
- Texas-first stands. DFW = liquidity proof; San Antonio = founder relationship time; Houston = third anchor (beat Austin); Austin = corridor satellite.
- The Dallas Test: 5 criteria, all must pass, review September 9, 2026; on fail, one remediation quarter, re-review December 9; second fail hands the proof market to San Antonio.
- Day-60 tripwire (~Aug 10): DFW under half its bar AND the SA anchor dead -> market 2 pivots to Boca/Naples for the October snowbird open.
- Las Vegas: community-only; carve-out disclosed publicly (FAQ IN CODE); Sponsored box relabel "From our founder" BUILD (small).
- KRISTEL VS CRYSTAL: unresolved fact, one founder text, hour one. NO San Antonio outreach before the answer. FOUNDER decision 4.

## Founder decisions outstanding (gate everything)
1. LV disclosure (prepared, rides deploy) 2. Teacher Promise (prepared, rides deploy)
3. THE DEPLOY GO 4. Kristel vs Crystal 5. Dallas Welcome Week date (recommended week of July 13).
