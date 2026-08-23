# Find My Mahj: Market Entry Plan, August 2026

Audit and planning only. Build freeze intact: no code, copy, pricing, architecture, or gate was changed. All four public gates remain OFF. This plan is evidence-first, built from live production marketplace data and current web research on eight candidate metros.

## The core strategic finding

The American Mahjong category is hot in every metro examined, and it is already crowded in almost every one. Bam Good Time (aggregated club directory), the American Mah Jongg Association (teacher directory), Oh My Mahjong (certified-instructor network), and vigorous local operators are present in Houston, Dallas, Boston, St. Louis, Phoenix-Scottsdale, and Tampa, all of which read HIGH competitive intensity. There is no greenfield metro. Only two of the eight read MEDIUM, and in both the specific gap is the same: no incumbent owns local player matching. That gap is exactly what Find My Mahj's Mahj Match is built to fill. The seed-market choice therefore should not chase the biggest directory inventory (Dallas and Phoenix have the most, and the most saturation); it should chase the best liquidity per unit of effort in a metro where matching is genuinely unmet.

## Architecture check: does the built system support market-concentrated matching?

Partially, and enough. Verified in the code: the matcher (app/api/cron/matcher/route.ts) removed its old Dallas pilot allowlist and now forms tables among any consented players who share the same city and state, gated by a single national flag, launch_player_matching. The engine's hard geographic constraint means tables only ever form where player density already exists, so matching self-concentrates by nature: a metro with no opted-in players simply forms no tables and honestly shows none.

What the architecture does NOT have is a per-market on/off switch. You cannot technically enable matching in Las Vegas while blocking it in Chicago; the gate is national. Concentration is therefore an operational discipline (drive player opt-ins only in seed metros), not a code control. A player in a non-seed metro who opts in sits in an empty pool and sees an honest "no table yet." That is acceptable for launch.

Limitation recorded for a later owner decision (DO NOT BUILD now, build freeze): if the owner later wants to hard-restrict matching to named metros (for example to guarantee no empty-pool experience anywhere else), that is a small future feature (a per-metro allowlist in app_settings the matcher and opt-in flow would read). It is not needed to launch and is not built.

## 1. Seed market ranking

Scoring model (deterministic, transparent). Each metro scored on: FMG published supply (venues + events in-metro), provider prospect pipeline (QUALIFIED prospects in-metro, from production), freshness/provenance (share of listings confirmed active within 180 days, by state), liquidity potential (metro compactness plus evidenced local player-pool depth, since tables need four compatible players within travel radius), competitive activity (demand is positive, saturation by matching-capable incumbents is negative), SEO/expansion potential (market size and suburb spread), and acquisition efficiency (how little manual effort reaches first liquidity, including any founder presence). Liquidity potential and acquisition efficiency are weighted highest because the seed goal is to prove tables form, not to build the biggest directory.

Production data used: inventory by city (Dallas 9, Phoenix-Scottsdale metro 11, Boston metro ~9, Houston metro 8, Las Vegas 4, LA metro ~6, St. Louis ~5, Tampa metro 6); QUALIFIED prospects by metro (LA 19, Houston 15, Boston 10, Las Vegas 7, St. Louis 7, Tampa 7, Dallas low, Phoenix low); freshness within 180 days by state (Missouri 7/7, Massachusetts 4/4, Texas 12/24, Florida 4/11, Nevada 1/4, California 0/14, Arizona 0/13, New York/DC/Illinois/Georgia 0).

| Rank | Metro | FMG supply | Provider prospects | Competitive activity | Liquidity potential | SEO / expansion | Overall /100 | Reason |
|---|---|---|---|---|---|---|---|---|
| 1 | Las Vegas, NV | Low (4) | Medium (7) | MEDIUM, weak incumbent | HIGH | Medium | 82 | Founder's home market (Las Vegas Mahjong, OMM-certified) means the lowest-effort path to first tables; compact valley; Bam Good Time's own LV listing is flagged as needing an organizer; strong fragmented demand (Meetup Vegas + Henderson, library Mission Mahjong every Sunday, JCC, NMJL National Convention each March) with the explicit gap being no local hub with matching. |
| 2 | St. Louis, MO | Medium (~5) | Medium (7) | HIGH but organized | HIGH | Low-Medium | 74 | Freshest FMG data anywhere (Missouri 7/7 confirmed active); compact metro; real prospect pipeline; a well-organized local scene (Magpie, We Mahj STL, Mod Mahj, library and JCC programs) makes players reachable. The clean generalization test: can light-touch acquisition form tables where the owner has no personal presence? |
| 3 | Boston, MA | Higher (~9) | Medium-High (10) | HIGH, saturated | Medium-High | High | 72 | Fresh data (Massachusetts 4/4), strong pipeline, mainstream demand (Boston Magazine trend feature, JCC and library programs), suburb clusters (Newton, Brookline, Wellesley) give compact sub-pools. But 44 Bam Good Time clubs and an OMM instructor cluster make it the most contested of the fresh metros. |
| 4 | Houston, TX | Medium (8) | High (15) | HIGH | Medium | High | 71 | Best cold data pairing after LA (deep pipeline, partial-fresh Texas data) and explosive demand (reported ~867% jump in Houston mahjong-event interest). Held back by sprawl and heavy incumbent saturation (~17 Bam Good Time clubs, active I Love Mahj postings). |
| 5 | Los Angeles, CA | Medium (~6) | Highest (19) | MEDIUM, no matching incumbent | Medium | Very High | 70 | The biggest provider pipeline and the clearest unmet matching demand (repeated public "where do I find a group in LA?" posts; no single incumbent owns LA), plus the largest expansion ceiling. Discounted for stale California inventory (0/14 fresh, needs a freshness pass) and severe sprawl that fights the four-players-within-radius requirement. The scale test, not the first test. |
| 6 | Tampa-St. Petersburg, FL | Medium (6) | Medium (7) | HIGH | Medium | Medium | 65 | Active, growing market (WUSF feature, Tampa Bay leagues) but heavily served already (six Bam Good Time clubs, AMA, OMM, The Mahjong Line). |
| 7 | Dallas-Fort Worth, TX | Highest (9) | Low | HIGH, OMM HQ | Medium | High | 64 | Most directory inventory but the weakest prospect pipeline of the top group, and the most entrenched competition: ~24 Bam Good Time clubs, a 1,000+ member DFW MAHJONG Facebook group, and Oh My Mahjong headquartered here. High demand, hardest head-to-head. |
| 8 | Phoenix-Scottsdale, AZ | Highest (11) | Low | HIGH | Medium | High | 61 | The most FMG inventory but entirely stale (Arizona 0/13 fresh) and a very hot, crowded local field (a new permanent Scottsdale club opened Jan 2026, Mod Mahj, Scottsdale Mahjong Society). Would need a full freshness pass before it could be trusted as a seed. |

Not separately ranked but noted: New York, DC, Chicago, Atlanta, and San Diego all have some inventory but zero recent freshness confirmation and thin prospect pipelines, so they are not seed candidates now.

## Recommendation (maximum three)

- PRIMARY SEED MARKET: Las Vegas, NV. Highest liquidity-per-effort, a weak incumbent, strong demand with a real matching gap, a compact valley, and the founder's existing community to seed the first tables. It is the fastest place to get evidence that a real four-person table forms.
- SECONDARY SEED MARKET: St. Louis, MO. The generalization test in a market with no founder presence: freshest data, compact, reachable players through an organized local scene. If tables form here through light-touch and agentic acquisition, the model generalizes.
- OPTIONAL THIRD MARKET: Los Angeles, CA. The scale and differentiation showcase: biggest provider pipeline, medium competition, and the loudest unmet matching demand. Gate it behind a California freshness pass and treat LA as sub-metros (Westside, San Gabriel Valley, Valley) rather than one region, because LA sprawl is the single biggest threat to the four-players-within-radius requirement. Houston is the alternate third if a fresher-data, higher-competition big market is preferred.

Governance note: because Las Vegas is the founder's home market, the existing Nevada fairness rules must keep holding (Las Vegas Mahjong appears only in the labeled "From our founder" card, never suppressing competitors, never ranked). Seeding the founder's metro is a legitimate go-to-market advantage, not a reason to relax neutrality.

## 2. Mahj Match liquidity thresholds

These are operational starting thresholds to be replaced by real observations after launch, not mathematical certainty. They describe one metro. "Availability overlap" means players who share at least one day-and-time window within a workable travel radius.

- EMPTY: fewer than roughly 8 opted-in, consented players in the metro, or no availability window with 4 compatible players. No tables can form. Honest empty state.
- EARLY: roughly 8 to 20 opted-in players; at least one window occasionally reaches 4 compatible players; the first 1 to 2 tables form, likely with hand-holding. Time-to-first-table is the metric that matters here.
- USABLE: roughly 20 to 50 opted-in players with 2 or more recurring availability windows that reliably reach 4; a new opt-in typically receives a proposal within a week; some players return for a second table. Match acceptance rate above roughly 50 percent.
- HEALTHY: roughly 50 to 120 opted-in players; multiple windows fill without manual nudging; repeat participation is common; replacement seats fill from the pool when someone drops; the metro sustains a steady rate of tables formed per week without operator effort.
- SELF-SUSTAINING: the metro forms tables and refills replacement seats on its own, repeat participation compounds, and new players arrive organically (word of mouth, provider referral, search) faster than churn. This is the only state that proves a network effect; no metro reaches it at launch.

Variables to watch as real data replaces these guesses: opted-in versus active players, availability overlap density, effective travel radius (this is where LA differs sharply from Las Vegas), skill compatibility friction, match acceptance rate, tables formed, and repeat participation. Do not treat the player-count bands as fixed; the true thresholds depend on availability concentration, which only real opt-ins reveal.

## 3. First 30-day launch plan

Objective is not national signups. It is to prove Find My Mahj can acquire providers, acquire players, form tables, create repeat participation, convert a provider or two, and reveal organic demand, in Las Vegas first and St. Louis close behind. Owner involvement stays minimal; agents handle the routine.

DAY 0 (owner actions, one sitting):
- Complete the owner-activation items already tracked (Stripe test-then-live, Search Console credential, approve the five policy drafts, review the two rules entries, run the real-iPhone Safari check).
- Authorize opening gates in order (below). Nothing new is built.

DAY 1 to 7 (open the national base, seed the primary metro):
- Flip publicSignup and providerClaims ON nationally; keep payments and playerMatching decisions staged. Verify a real account creates and classifies real_external and a real provider can start a claim (the launch simulator already proves the mechanics; this is live confirmation).
- Agentic work: the freshness agent runs a pass over the Las Vegas and St. Louis listings so the seed directories are confirmed-current; the prospect pipeline surfaces the Las Vegas and St. Louis QUALIFIED providers into a claim-outreach queue.
- Founder-seeded liquidity in Las Vegas: the owner invites her existing Las Vegas Mahjong players and local contacts to create player profiles and opt into Mahj Match. This is the single highest-leverage manual action of the month and the reason Las Vegas is primary.
- Human needed: only the owner's personal Las Vegas invitations and any Needs-Human claim escalations.

DAY 8 to 14 (turn matching on, form the first table):
- Flip playerMatching ON. Because matching self-concentrates by city, only metros with density (Las Vegas first) will form tables.
- Target: the first real four-person table forms in Las Vegas. Measure time-to-first-table from matching-on.
- Agentic work: match proposals, seat reminders, and replacement-seat fills run automatically; notifications fire through the ledger; the analytics funnel records opt-ins, proposals, accepts, and tables formed, classified real.
- Begin St. Louis player acquisition through the community interoperability plan (below), with no founder presence, as the generalization test.
- Human needed: watch the first table form end to end once, confirm the safe-communication and consent flow feels right to a real player, and handle any Needs-Human moderation.

DAY 15 to 30 (prove repeat and conversion, read demand):
- Target: a second and third Las Vegas table, at least one St. Louis table, and at least one player who returns for a second table (repeat participation is the leading indicator of a real network).
- Turn payments ON and confirm one real provider membership can be purchased (do not manufacture a charge; let a genuine provider convert, or the owner completes one known real purchase with full knowledge).
- Read the demand signals: zero-result searches by metro (where players look and find nothing), Ask topics, and, once Search Console is connected, which local queries Find My Mahj is capturing.
- Decide, on evidence, whether to promote Los Angeles (or Houston) to a third seed for the scale test.

## 4. Provider acquisition strategy

The flow is: a provider discovers the profile Find My Mahj already researched for them, claims it, verifies with deterministic evidence (email or domain match auto-approves), sees value immediately, and optionally converts to the $89/year membership. Pricing is not changed.

- Why a provider should claim: the listing already exists and is being shown to local players searching for teachers and games. Claiming is the difference between a listing about them and a listing they control. It is free.
- Immediately valuable on the free claim: control of their own listing (correct details, website, contact), the ability to be found in the reviewed directory that players actually trust, and inclusion in the honest local results a searching player sees. No paywall to be listed.
- Free listing versus $89/year membership: the free claim gives presence and control; the membership is the paid upgrade for providers who want more (the built tier and its benefits already exist behind the payments gate). The message is never "pay to be listed"; it is "you are already listed for free, and here is the optional upgrade if it earns its keep."
- Likely objections and answers: "I am already on Bam Good Time and AMA for free" (true, and you can be here too; this is the only directory with grounded rules answers and real player matching attached, so your listing sits next to demand, not just other listings); "why would I pay $89" (only if the membership demonstrably sends you students or fills your events; prove it free first); "I do not trust a new site" (your listing is reviewed, your data is never sold, and you control it).
- Strongest channels: the existing QUALIFIED prospect pipeline (direct claim-invitation outreach, largely automatable), and provider referral once a few local teachers see value. In Las Vegas the founder's relationships shortcut this entirely.
- What is agentic versus human: prospect surfacing, claim-invitation drafting, deterministic evidence scoring, and auto-approval are automated and already built. Human involvement is genuinely needed only for Needs-Human claim escalations (ambiguous or contested ownership) and for the founder's personal Las Vegas outreach. The owner should not become the routine processing layer.

## 5. Player acquisition strategy

Lead with the outcome a player wants, not the technology. The AI should not be the headline.

- Primary player message: "Find people to play with near you." The scarcest thing for a real American Mahjong player is a fourth, a recurring table, or players with matching availability. That is Mahj Match, and no competitor offers it well. This leads.
- Secondary messages, in order: "Find where to play" (open plays and games), "Find a teacher," and only then "Ask how to play" (the rules concierge as a helpful proof of trustworthiness, not the lead).
- Why not lead with AI: players do not wake up wanting an AI; they want a game and a table. The AI is a reason to trust and stay, not the reason to arrive. Marketing that leads with "AI mahjong concierge" would attract curiosity, not committed players, and would invite a funded competitor to out-message it.
- Channels: the community interoperability plan below is the primary player channel; local provider referral (teachers send their students to find ongoing games) is the second; organic local search is the third, which compounds only after the directory is fresh and indexed in the seed metros.

## 6. Facebook and community interoperability strategy

Facebook is the largest incumbent community channel and should be treated as a partner surface, not a wall to breach. Players will not abandon their Facebook groups, and they should not be asked to. The strategy is to be the structured layer Facebook is bad at, and to let group admins and organizers hand players to Find My Mahj at the exact moment Facebook fails them.

- The division of labor: Facebook is conversation and community; Find My Mahj is structured discovery plus matching plus four-person table formation. Facebook is where a player already belongs; Find My Mahj is where they go when they need a specific outcome the group thread cannot reliably produce.
- The handoff moments (when a group admin or organizer sends players over): "we need a fourth for Thursday," "who wants a recurring table," "match me with players who have my availability," "find a local teacher," and "here is the structured event list." Each is a job Facebook threads do poorly and Mahj Match does well.
- The mechanism, without any new build: local organizers and group admins are exactly the QUALIFIED providers in the pipeline. When they claim their Find My Mahj listing, they gain a clean link to point their group members to for the jobs above. The relationship is symbiotic: the admin keeps their community on Facebook and offloads the tedious "find a fourth" logistics to Find My Mahj. In Las Vegas the founder can model this directly; in St. Louis the organized local businesses (who run their own groups) are the natural first partners.
- What not to do: do not scrape or spam Facebook groups, do not try to replace the group, and do not ask players to leave. The counter-positioning is "keep your group, let us handle the matching," which is defensible precisely because it does not fight the network effect head-on.

## 7. Competitive counter-positioning

For each major competitor: what Find My Mahj should NOT copy, the best counter-position, and the structural weakness to exploit.

- Facebook Groups. Do not try to build a social network or recreate 221,000-member communities. Counter-position: the structured matching and table-formation layer on top of the communities that already exist. Exploit: Facebook has no radius search, no availability matching, no reliable four-person formation, and no verification; it is a bulletin board, not a matcher.
- I Love Mahj. Do not try to out-build its online multiplayer and video play; that is a different product (playing online) from Find My Mahj's job (getting people to a physical table). Counter-position: Find My Mahj is for in-person local play and local discovery, with grounded rules and a curated directory, where I Love Mahj is strongest online. Exploit: its local physical-club discovery breadth is thin, and its brand is "play online," not "find your local game."
- Bam Good Time. Do not try to match its aggregated directory breadth or build club-management SaaS (payments, ELO scoring); that is a provider-tools business. Counter-position: Find My Mahj is player-first (matching and table formation) and data-honest, where Bam Good Time is club-first and openly aggregates competitors' directories. Exploit: no radius search, no rules Q&A, no player matching, and a headline club count that is mostly borrowed, not organic; its value to a player looking for a fourth is low.
- American Mah Jongg Association. Do not try to out-scale a 538-teacher directory on teacher listings alone. Counter-position: Find My Mahj attaches player matching and games to the teacher, so a listing sits next to live demand, not just other listings. Exploit: AMA is a directory and a newsletter, with no matching and no game discovery.
- MeetForMahjong. Do not copy its thin, unverified, cruise-heavy event feed or its paid-to-message wall. Counter-position: Find My Mahj is deeper, verified, and free to connect where it matters, with real matching rather than basic filtering. Exploit: no independent evidence of traction, broken pages, and a mismatched event calendar; it is the closest positioning twin and the easiest to out-execute.
- Oh My Mahjong. Do not try to out-spend a $30M company or build a 1,000-instructor certification funnel; that is a different business (teaching and certification and commerce). Counter-position: Find My Mahj is the neutral, cross-brand discovery and matching layer that lists every teacher fairly (including OMM-certified ones) rather than a single brand's funnel. Exploit: its consumer discovery product (teachmahjong.com) is thin and unproven; its strength is teaching and brand, not finding-a-game or matching. The risk is that it could build discovery later, so speed to liquidity matters.

## 8. CEO metrics (watch these, ignore vanity)

Ten metrics that determine whether the launch is working. Signup totals alone are a vanity metric; liquidity and repeat are the truth.

1. Provider claims (real, by metro): are the researched listings being claimed?
2. Real player profiles created (by metro): the raw pool for matching.
3. Matching opt-ins (by metro): players who consented and want a table.
4. Qualified match rate: share of opt-ins for whom a compatible table of four is even possible given availability and radius. This exposes the real liquidity ceiling per metro.
5. Tables proposed and tables formed (and the ratio): proposal-to-formed is the acceptance signal.
6. Time to first table (per metro): the single cleanest proof the mechanic works in a market.
7. Repeat table interest: players who return for a second table. The leading indicator of a network effect and the most important early metric after time-to-first-table.
8. Provider conversion to $89/year: does the free claim lead to paid membership, and at what rate?
9. Organic acquisition share: how many players and providers arrived without paid or founder effort (word of mouth, referral, search). This is the hands-off test.
10. Zero-result searches by metro plus Needs-Human volume: where demand exists that supply does not meet (the demand-to-supply signal), and whether agents are handling routine work so Needs-Human stays small (the low-touch test).

North-star: tables formed with repeat participation in a seed metro. One metro that reaches the USABLE band with real repeat play proves the entire thesis; a million signups with no tables disproves it.

## 9. Score-evolution framework

The competitive benchmark put Find My Mahj at 74 (Launch Ready). The score should rise through market proof, not added features. Do not build to the number.

- 74 to 80: real-world evidence that the machine turns. First seed metro (Las Vegas) reaches EARLY-to-USABLE: the first several real tables form, at least one player returns for a second table, a handful of providers claim, and at least one provider converts. Proof the mechanic works with real people.
- 80 to 85: evidence it generalizes and holds. The secondary metro (St. Louis) forms tables without founder presence, one seed metro reaches HEALTHY (tables form without manual nudging, replacement seats fill from the pool), provider conversion shows a repeatable rate, and organic acquisition becomes a meaningful share. Proof it is not a one-market, founder-powered fluke.
- 85 to 90: evidence of a compounding advantage. A seed metro approaches SELF-SUSTAINING (organic arrivals outpace churn, repeat participation compounds), Search Console shows Find My Mahj capturing local transactional queries, and a third metro (Los Angeles or Houston) reaches USABLE on the same playbook. Proof of a real, if early, network effect and organic demand engine.
- 90 plus: durable, defensible leadership. Multiple metros self-sustaining, a recognizable local brand ("the place that finds your fourth"), providers choosing Find My Mahj because that is where players are, and a demand-to-supply flywheel visible in the data. This is a moat that exists, not a moat on paper. It cannot be reached by engineering; only by market proof over quarters.

## 10. Decisions that genuinely require Shauna

1. Authorize launch and the gate-activation order (public signup, provider claims, payments, player matching). Nothing opens without this.
2. Confirm the seed markets: primary Las Vegas, secondary St. Louis, optional third Los Angeles (or Houston). This plan recommends them on evidence; the choice is the owner's.
3. Personally seed Las Vegas liquidity: invite the existing Las Vegas Mahjong community to create player profiles and opt into Mahj Match. This is the highest-leverage manual action and only the owner can do it.
4. Supply the still-outstanding activation credentials and approvals (Stripe, Search Console, the five policies, the two rules entries, the real-device Safari check). Already tracked in docs/owner-activation-checklist.md.
5. Decide the payments-gate posture for the first real charge: allow a genuine provider to convert, or knowingly complete one real membership purchase for verification. Do not want a test charge created without the owner's knowledge.
6. Later, and only if wanted, decide whether to fund a per-metro matching allowlist (not built, not needed to launch). Recorded as a future option, not a task.

The plan requires no new engineering. The smallest path to a higher score and a real market position is liquidity in Las Vegas, then generalization in St. Louis, then scale in Los Angeles, earned with real players and near-zero manual effort, exactly as the owner wants.
