# Find My Mahj: Competitive Benchmark and Product Scorecard, August 2026

Audit only. Build freeze intact; no code, copy, pricing, SEO, or gate was changed to produce this. Scored from the investor/acquirer lens, not the builder's. Two states are scored separately: what an anonymous visitor can use today (Current Public) and the complete built-and-verified system behind the launch gates (Launch Ready).

## Headline

- Find My Mahj, Current Public: 54/100, Grade C+
- Find My Mahj, Launch Ready: 74/100, Grade B+
- Competitive rank for the combined discovery/connection need: Current Public roughly #5 of 9; Launch Ready #1 on product capability, with a large caveat that on-paper capability is not the same as market leadership while liquidity is unproven.

## What was verified on Find My Mahj (evidence, not assumption)

Public, reachable today (all HTTP 200): homepage, /ask, /teachers, /events, /tournaments, /leagues, /travel, /states, /cruise, /faq, /help, and state and city pages.

Real published inventory a visitor can actually browse right now (queried against production):
- 41 published venue listings (teachers/studios) across 12 states (top: TX 7, AZ 5, CA 5, GA 4, NY 4, MA 4, VA 3, MD 2).
- 90 published events (81 open play, 6 class, 3 league). Zero published tournaments and zero published retreats/getaways: those pages exist as honest, empty shells.
- 0 published player listings; no public player connection of any kind.
- Ask is live and genuinely good: grounded rules answers (joker-in-a-pair returns the correct "no", copyright-safe), directory search, mixed intent, and an honest "I can help you find..." fallback when it cannot verify.

Gated OFF (a visitor cannot use these today, but they are built and production-verified): accounts and sign-in, player profiles and matching (Mahj Match), provider claims and dashboard, payments. Confirmed by POST probes returning 401/403/503 and by the launch simulator passing 14/14 on production.

Reality check for scoring: the Current Public product is a polished, trustworthy, but thin regional directory plus a strong AI concierge. The Launch Ready product is materially more complete than anything else in the category, but its value is throttled by cold-start liquidity and thin current inventory.

## Competitor set (live evidence, August 2026)

Numbers marked self-reported could not be independently corroborated and must not be treated as fact.

1. I Love Mahj (ilovemahj.com). Online multiplayer (bots and live, built-in video), teacher directory with 5-200 mile radius search, an in-person game organizer that automatically assigns players to tables, and a real rules Q&A / knowledge base. $6/mo or $60/yr. A rival (Bam Good Time) publicly calls it "the most established platform with the largest player base." This is Find My Mahj's strongest direct product competitor: it already ships matching, table formation, and rules Q&A. Score: 60-68/100. Weakest at physical/local club breadth.

2. Bam Good Time (bamgoodtime.com). Club/tournament directory plus genuine club-organizer SaaS (RSVP, waitlists, Stripe payments, ELO scoring app) plus a tile shop. Freemium: Starter $19/mo, Pro $49/mo (Pro adds AI features). Headline "1,000+/1,500+ clubs" is, by its own published methodology, mostly aggregated from other directories (325 from AMA, 574 from Modern Mahjong, only ~173 first-party; the paid club-management tool is used by "30+ clubs"). No radius search, no rules Q&A. Active, national. Score: 55-65/100. Strongest provider-side tooling in the category; unusually transparent about data provenance.

3. American Mah Jongg Association (americanmahjonggassociation.com). Independent of NMJL. The largest verified teacher directory found: "Showing 1-20 of 538 Results," with location search, name search, and credential filters. Self-reported 15,000 members and a 150,000-reader weekly newsletter (unverified). Static FAQ, no interactive rules Q&A. Score: 50-60/100. Best-in-class for finding a teacher specifically; weaker for game/event discovery.

4. Facebook Groups (substitute). The single group "Mah Jongg, That's It!" has 221,000+ members, an order of magnitude larger than every dedicated platform's claimed base combined. City-level groups exist nearly everywhere. No RSVP, no radius search, no verification, chaotic moderation. Score: 40-50/100 as a purpose-built tool, but its real-world importance is far higher because of reach and zero switching cost.

5. Meetup.com (substitute). Best-in-class radius/RSVP/organizer machinery and a real attendance-history trust signal, but mahjong-specific density is thin: the American Mah Jongg topic shows ~10 groups and 2,411 members nationally. Score: 45-55/100 for this need.

6. MeetForMahjong (meetformahjong.com). The closest positioning twin: player profiles with messaging behind $0.99/mo verification, an instructor directory, event aggregation, a moderated forum, radius alerts. But the event calendar is only ~6 items skewed to expensive cruises, a subpage 404s, and there is zero independent corroboration of its "1000+ players" claim (no app, no press, no social footprint). Georgia-centric. Score: 30-40/100.

7. Oh My Mahjong / teachmahjong.com. teachmahjong.com is a thin, B2B class-management app for OMM-certified instructors only (App Store 1.0 from 1 rating). But the parent, Oh My Mahjong, is commercially significant: a syndicated release cites $30M+ annual revenue, 360% YoY growth, and 1,000+ certified instructors, and the "OMM Certified Instructor" badge already appears inside AMA's directory. As a player-facing discovery tool: 15-25/100. As a capitalized medium-term threat if it builds consumer discovery on that base: high.

8. National Mah Jongg League (nationalmahjonggleague.org). The rules/card authority since 1937 (self-reported 350,000+ members), not a discovery tool (no game finder, teacher directory, or event calendar; FAQ literally "Under Construction"). Score as a discovery tool: 5-15/100. But most organized games require a current NMJL card, so NMJL sits upstream of the entire category regardless of features. It is the hardest brand moat in the space.

## Weighted scorecard (100 points)

Weights kept as briefed. FMG scored in both states; each cell is points awarded out of the category weight.

| # | Category | Weight | FMG Current | FMG Launch Ready |
|---|---|---|---|---|
| 1 | Game / local discovery | 15 | 8 | 10 |
| 2 | Marketplace coverage + data quality | 12 | 5 | 7 |
| 3 | Player connection / matching | 12 | 1 | 9 |
| 4 | AI / conversational experience | 10 | 8 | 8.5 |
| 5 | Teacher / provider experience | 10 | 3 | 8 |
| 6 | Trust / safety / privacy | 10 | 7 | 9 |
| 7 | UX / brand / mobile | 8 | 6.5 | 6.5 |
| 8 | SEO / organic discoverability | 8 | 5 | 5.5 |
| 9 | Provider business model | 5 | 2 | 3 |
| 10 | Differentiation / defensibility | 10 | 4 | 7 |
| | Total | 100 | 54.5 | 73.5 |

Rounded: Current Public 54/100 (C+), Launch Ready 74/100 (B+).

Notes on the harder judgments:
- Discovery scores the mechanism (radius/city/ZIP search, honest zero-result) as strong; the ceiling is supply, not code.
- Matching is 1/12 today because nothing is usable publicly, and 9/12 launch-ready because the architecture (algorithmic four-seat formation, consent, recurring groups, replacement seats) is as strong as any competitor's, but I Love Mahj already ships a comparable organizer, so this is not unique.
- AI/conversational is Find My Mahj's clearest live edge: every competitor is NONE or PARTIAL here.
- Differentiation is deliberately held to 4/7, not higher: matching and rules Q&A are matched by I Love Mahj, a directory is aggregable (Bam Good Time), and an LLM concierge is replicable by a funded rival. The defensible part is the integration plus data-truth discipline plus grounded/instructor-reviewed rules, not any single feature.

## Sub-scores (out of 10)

- Player experience: Current 5, Launch Ready 8
- Provider experience: Current 3, Launch Ready 8
- Technology / product: 8.5
- Trust: 9
- SEO opportunity: 7 (architecture strong, footprint unproven)
- Differentiation: 6.5 (Ask is unique; matching and rules are not)
- Launch readiness: 9 (engineering complete, gated, simulator 14/14, security/a11y passed)

## Capability comparison matrix

STRONG / PARTIAL / WEAK / NONE / UNKNOWN.

| Capability | FMG Current | FMG Launch | Bam Good Time | I Love Mahj | MeetForMahjong | AMA | Meetup | Facebook |
|---|---|---|---|---|---|---|---|---|
| National game discovery | PARTIAL | PARTIAL | STRONG | WEAK | PARTIAL | WEAK | PARTIAL | STRONG |
| Radius search | STRONG | STRONG | WEAK | STRONG | PARTIAL | PARTIAL | STRONG | NONE |
| Teachers | STRONG | STRONG | STRONG | STRONG | STRONG | STRONG | NONE | WEAK |
| Events | STRONG | STRONG | STRONG | PARTIAL | PARTIAL | PARTIAL | STRONG | PARTIAL |
| Tournaments | NONE (empty) | PARTIAL | STRONG | WEAK | PARTIAL | PARTIAL | WEAK | WEAK |
| Retreats / getaways | NONE (empty) | PARTIAL | WEAK | NONE | PARTIAL | NONE | NONE | WEAK |
| Player profiles | NONE | STRONG | PARTIAL | STRONG | STRONG | WEAK | PARTIAL | WEAK |
| Player matching | NONE | STRONG | PARTIAL | STRONG | PARTIAL | WEAK | WEAK | WEAK |
| Table-of-four formation | NONE | STRONG | PARTIAL | STRONG | UNKNOWN | NONE | WEAK | WEAK |
| Availability matching | NONE | STRONG | WEAK | UNKNOWN | UNKNOWN | NONE | NONE | NONE |
| Rules Q&A | STRONG | STRONG | NONE | STRONG | NONE | PARTIAL | NONE | PARTIAL |
| Conversational / AI search | STRONG | STRONG | PARTIAL | NONE | NONE | NONE | NONE | NONE |
| Provider claiming | NONE | STRONG | STRONG | UNKNOWN | PARTIAL | STRONG | STRONG | NONE |
| Provider dashboard | NONE | STRONG | STRONG | UNKNOWN | UNKNOWN | PARTIAL | STRONG | NONE |
| Paid provider options | NONE | STRONG (dark) | STRONG | N/A | UNKNOWN | UNKNOWN | STRONG | NONE |
| Safety / moderation | PARTIAL | STRONG | UNKNOWN | UNKNOWN | PARTIAL | UNKNOWN | PARTIAL | WEAK |
| Data provenance | STRONG | STRONG | MIXED (disclosed) | PARTIAL | WEAK | PARTIAL | STRONG | WEAK |
| Freshness | PARTIAL | STRONG (agentic) | PARTIAL | UNKNOWN | WEAK | UNKNOWN | PARTIAL | WEAK |
| Mobile UX | STRONG | STRONG | STRONG | UNKNOWN | PARTIAL | PARTIAL | STRONG | STRONG |
| SEO / local architecture | PARTIAL | PARTIAL | STRONG | WEAK | WEAK | PARTIAL | STRONG | WEAK |

Find My Mahj is the only product in the set that is STRONG on both conversational AI search and grounded rules Q&A, and the only one pairing algorithmic table formation with a consent/safety layer. It is not the leader on raw directory breadth (Bam Good Time, Facebook), teacher count (AMA, 538), or live player base (I Love Mahj, Facebook).

## Rankings

Current Public (how well it serves the combined need today):
1. Facebook Groups (reach and incumbency)
2. I Love Mahj (most complete live product)
3. Bam Good Time (broad directory + provider tooling)
4. American Mah Jongg Association (teacher-finding)
5. Find My Mahj, Current Public (best UX and only live AI, but thin inventory and no live connection)
6. Meetup
7. MeetForMahjong
8. teachmahjong / OMM (as a discovery tool)
9. NMJL (as a discovery tool)

Launch Ready (product capability on paper):
1. Find My Mahj, Launch Ready (74) - the most complete product in the category
2. I Love Mahj (60-68) - closest live product, already has users
3. Bam Good Time (55-65)
4. Facebook Groups (as a substitute, on reach)
5. American Mah Jongg Association
6. Meetup
7. MeetForMahjong
8. teachmahjong / OMM
9. NMJL

The Launch Ready #1 is a capability ranking. In the real world, Facebook, I Love Mahj, Bam Good Time, and NMJL currently hold the users, the supply, and the brand. Find My Mahj wins on product; it has not yet won a single one of those.

## If Find My Mahj fails, why (five most plausible modes)

1. Cold-start / matching liquidity. Mahj Match needs four consented, compatible, available adults in one metro to form a single table. With 0 public players today, the flagship feature shows empty tables until a metro reaches density. This is the single largest risk. GO-TO-MARKET.
2. Thin and stale supply versus incumbents. 41 venues and 90 events across 12 states is small next to Facebook's reach and Bam Good Time's aggregated directory. If inventory does not grow and stay fresh, discovery feels empty. GO-TO-MARKET / SUPPLY.
3. Provider conversion. Teachers can already be listed free or cheaply on AMA, Bam Good Time, and Facebook. Converting them to a paid $89/yr membership is unproven and competes with entrenched free options. MONETIZATION / GO-TO-MARKET.
4. Brand awareness and distribution. NMJL owns authority, Facebook owns the communities, and Oh My Mahjong has $30M+ of revenue and marketing behind a 1,000+-instructor funnel. Find My Mahj is unknown and has no organic distribution channel yet. GO-TO-MARKET.
5. Differentiation erosion. I Love Mahj already ships matching, table formation, and rules Q&A; a funded competitor can add an LLM concierge in months. The AI edge is real but not durable on its own. PRODUCT / COMPETITIVE.

Product/technology risk is low: the engineering is complete, verified, secure, accessible, and passes a full production launch rehearsal. Four of the five failure modes are go-to-market, supply, or monetization. The honest conclusion is that this product will live or die on demand generation and liquidity, not on whether the software works.

## Moat analysis (1-10, and durability)

- National directory / data: 4. Aggregable; AMA and Bam Good Time already have more.
- SEO / geographic footprint: 5. Strong architecture, unproven reach; compounds slowly if it works.
- Ask Find My Mahj (conversational AI): 6 now, but easy to copy for a funded rival.
- Rules intelligence (grounded, copyright-safe, instructor-reviewed): 6. The curation and copyright discipline are harder to copy well than the LLM itself.
- Provider network: 3. Behind AMA and OMM.
- Player network: 2. None today.
- Mahj Match: 5. Comparable to I Love Mahj.
- Table formation: 5.
- Marketplace data / provenance (data-truth discipline): 6. Genuinely differentiated as a discipline, but invisible to users, so it converts to trust only over time.
- Autonomous freshness (agentic): 5.
- Search-demand to supply intelligence: 4.
- Brand: 2.
- Community / network effects: 2.

The 2-3 that could become real long-term moats:
1. Player-and-table-formation network effect, if liquidity is ever achieved in even a few metros. This is the only durable moat in the category and no one, including Facebook, has purpose-built it. It does not exist yet.
2. A trust brand built on grounded AI plus data-truth plus instructor-reviewed rules. Defensible if Find My Mahj becomes "the place that never lies to you and never fakes a listing," but that requires brand-building time.
3. A demand-to-supply SEO flywheel that captures local transactional search intent and converts it into provider signups. Compounding and moderately defensible if it takes hold.

Easy to copy today: the AI Ask, the directory itself, and the matching feature. None of Find My Mahj's current features is a standalone moat. The moat can only come from execution into liquidity and brand trust.

## Executive assessment (outside product executive)

Recommendation: LAUNCH WITH CAUTION.

Rationale: the product is genuinely ready and is the most capable in the category, so keeping it fully gated accrues no further value and delay only lets funded competitors (Oh My Mahjong) and incumbents (I Love Mahj, Bam Good Time, Facebook) extend their lead. But the market is more crowded and more entrenched than a builder-side view assumes, and Find My Mahj has zero users, thin supply, and no brand. A national blast would spread thin inventory across 50 states and make the flagship matching feature look empty. The disciplined move is to open the gates against one or two seed metros where inventory density already exists (Dallas, Scottsdale, Boca, which also happen to be where Bam Good Time is strong, so head-to-head is unavoidable), prove table formation and provider conversion there, then expand on evidence.

Biggest remaining risk: USER ACQUISITION and SUPPLY liquidity (cold-start), with MONETIZATION (provider conversion against free alternatives) a close second. It is not product, technology, or trust/safety; those are in good shape.

## Answers to the six primary questions

1. Clearly better than competitors: conversational AI concierge (unique), grounded and copyright-safe rules Q&A, data-truth/provenance discipline, integrated safety/consent for matching, and end-to-end product completeness.
2. Competitors clearly better: raw reach and community (Facebook), live player base and a proven online-play product (I Love Mahj), teacher directory breadth (AMA, 538), club directory breadth and provider SaaS tooling (Bam Good Time), and brand authority (NMJL).
3. What could prevent it winning: cold-start liquidity, thin/stale supply, weak brand and distribution, provider conversion against free incumbents.
4. Strongest defensible advantages: the potential player/table network effect (unbuilt but uniquely positioned), and a trust brand from AI grounding plus data-truth. Everything else is copyable.
5. Truly differentiated or merely feature-rich: honestly, closer to feature-rich-plus-one-genuine-edge. The AI concierge and the data-truth discipline are real differentiation; matching, directory, and rules are table stakes that competitors already match. It is the best-integrated product, which is worth something, but integration alone is not a moat.
6. Ready to compete nationally once gates open: ready as a product, not yet ready to win nationally. It is ready to compete seriously in a small number of seed metros and should earn national rollout with liquidity and conversion evidence.

## Release blockers

None found in this audit. No launch-critical defect and no new security or privacy problem surfaced. Build freeze remains intact; nothing was changed.

## Recommendations, classified (build freeze: do not implement)

- PRE-LAUNCH REQUIRED: none beyond the existing owner-activation items already tracked (Stripe, Search Console, policy approval, two rules entries, real-device Safari QA). The product does not need more features to launch.
- POST-LAUNCH, DATA DEPENDENT: seed-metro liquidity strategy for Mahj Match; provider-conversion testing versus free alternatives; deciding whether to interoperate with Facebook communities rather than fight them; SEO capture measured against real Search Console demand.
- POST-LAUNCH, NICE TO HAVE: tournament and retreat inventory (pages exist but are empty); deeper teacher breadth to rival AMA; considering whether the NMJL card requirement should be surfaced as a trust signal the way Meetup groups already do.

The smallest set of things that would make it clearly #1 is not more product. It is liquidity in a few metros plus brand trust. Those are earned post-launch, not built.
