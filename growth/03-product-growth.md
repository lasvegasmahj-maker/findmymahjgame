I now have a complete picture of the product. I've read the homepage, state pages (server + client), both listing flows, the search box, the map component reference, and the seed data. I have what I need to deliver opinionated recommendations grounded in the actual code. No need for the todo tool on a research/recommendation task.

Here is my deliverable.

---

# FindMyMahj: Product Growth Recommendations (Users / Listings / City Coverage)

## The core diagnosis (read this first)

Your product today is a **directory waiting for content it doesn't have**. Every state page, every homepage section ("Retreats", "Venues", "Where to Play") leads with an empty state and a "Be the first!" CTA. That is a cold-start death spiral: a player lands on `/states/ohio`, sees zero players, and leaves. No reason to list, no reason to return.

The single most important strategic shift: **stop treating this as a directory of individuals and start treating it as a directory of GROUPS forming.** A lone player listing is a dead end (you need 3 others, and a directory of singles is a lonely place). A "Table" or "Group Forming" is a magnet: it has a goal (find 4), a progress bar (2 of 4 joined), and a built-in reason to return (did anyone join?). This one reframe fixes cold-start, network effects, AND retention at once. Most of my top recommendations flow from it.

Second diagnosis: **the Connect flow is a black hole.** Right now a player clicks Connect, fills a form, it emails *you* (Shauna), and the player "hears back via email" eventually. That is a manual bottleneck that doesn't scale and gives the requester no feedback loop. It also means the network effect is gated on your inbox.

---

## 1. Prioritized feature list (Impact 1-5 vs Effort 1-5)

| # | Feature | Impact | Effort | Quadrant |
|---|---------|:---:|:---:|---|
| 1 | **"Start a Table" / Group-Forming listings** (player listing -> a group seeking N more, with a join counter) | 5 | 3 | DO FIRST |
| 2 | **Seed every state from the existing community** (import public FB Group / Meetup groups as claimable "Group" listings) | 5 | 2 | DO FIRST |
| 3 | **"Notify me when a player joins my city"** email capture on empty states | 5 | 2 | DO FIRST |
| 4 | **Direct, instant connect** (auto-forward intro email both ways, no manual relay) | 4 | 2 | DO FIRST |
| 5 | **Weekly "Mahj in [City]" digest email** (new players, new tables, this week's open plays) | 5 | 3 | DO FIRST |
| 6 | **City pages** (`/states/[state]/[city]`) for coverage + long-tail SEO | 4 | 3 | DO FIRST |
| 7 | **NMJL card-season hook** ("Find a card-study group near you" every spring) | 4 | 2 | DO NEXT |
| 8 | **Claim-your-listing + lightweight profiles/accounts** (magic-link, edit your own listing) | 4 | 4 | DO NEXT |
| 9 | **Recurring open-play calendar** (free for hosts; weekly games, not one-off events) | 4 | 3 | DO NEXT |
| 10 | **"Refer 3 friends to fill your table" share mechanic** | 3 | 2 | DO NEXT |
| 11 | **Skill/availability matching + "players like you nearby"** | 3 | 3 | DO NEXT |
| 12 | **Group/host dashboard** (roster, attendance, message the group) | 4 | 5 | LATER |
| 13 | **In-app messaging / chat** | 2 | 5 | DON'T BUILD (yet) |
| 14 | **Mobile app** | 2 | 5 | DON'T BUILD |
| 15 | **Ratings/reviews of players or venues** | 1 | 3 | DON'T BUILD |

**The "Do First" quadrant (high impact, low-to-moderate effort): #1-6.** Build these as a single coherent sprint, because they reinforce each other: tables give people something to join, seeding gives every state non-empty content, notify-me captures demand where supply is thin, instant-connect removes your inbox bottleneck, the weekly digest pulls people back, and city pages capture the search traffic. Ship that bundle and you have a functioning flywheel instead of 50 empty pages.

---

## 2. Feature details: MVP first, then fuller version

### #1 — "Start a Table" / Group-Forming listings (the keystone)
- **MVP:** Add one field and one concept to the existing `player_listings` flow: a "Looking to..." toggle with "Join a group" vs "**Start a table (find 3 more)**". A "table" renders as a card with a live counter, "2 of 4 players," and a "Join this Table" button instead of "Connect." Reuse the existing inquiry pipeline; "join" creates an inquiry tagged to that table. The card shows a progress bar. When it hits 4, it flips to "Table full, group forming!" This is mostly a schema field, a counter, and copy changes to `client.tsx`.
- **Fuller:** Tables get their own row type with `seats_total`, `seats_filled`, `cadence` (weekly/biweekly), `format` (in-person/virtual), and `level`. Joiners are tracked so the table organizer sees who's in. Auto-status: "forming" -> "active." A full table can convert into a recurring **Group** listing (feeds #9). Tables expire/refresh so the board stays alive.
- **Why it's #1:** It changes the unit of value from "a person" (needs 3 more, feels hopeless when alone) to "a forming group" (has momentum, a goal, and a reason to share). It is the difference between a lonely-hearts column and a flash mob.

### #2 — Seed every state from the existing community
- **MVP:** The audience already lives in Facebook Groups and on Meetup. Compile a list of *public* American Mahjong groups/Meetups per state and create **claimable "Group" listings** for them ("Mahjong players: there's an active group in Columbus -> see it on Meetup / claim this listing"). Now `/states/ohio` is never empty. (Per your CLAUDE.md rules: these must be real, verified, link-checked entries, clearly marked as community groups with a real source link, never presented as something they're not, and never blended into fake counts.)
- **Fuller:** A "Claim this group" flow (magic-link to the group's listed contact) converts a seeded entry into an owned, editable listing with open-play times. Each claim is a free advertiser-equivalent acquisition with zero CAC.
- **Why:** Solves cold-start honestly and instantly. You are not inventing players; you are indexing a community that already exists and giving its organizers a reason to engage. This is your fastest path to city coverage.

### #3 — "Notify me when a player joins my city"
- **MVP:** On every empty state/city view, replace the dead-end "Be the first" with an email capture: "No one yet in Boise. **Be the first to know when a player joins.**" Store `{email, city, state}`. This converts wasted bounce traffic into a demand signal and a future activation list.
- **Fuller:** Auto-fire the notification when the Nth player lists in that city ("3 players are now in Boise. Start a table?"). This is your demand-supply matching engine and it directly powers the weekly digest.
- **Why:** Today, thin-supply pages leak 100% of demand. This captures it and tells you *exactly where to seed next* (the cities with the most "notify me" signups are your coverage roadmap, demand-driven).

### #4 — Direct, instant connect
- **MVP:** When someone clicks Connect/Join, send the intro email **automatically to both parties** (via your existing Resend setup) instead of routing through your inbox for manual relay. Requester gets "we've introduced you to Sandra"; listee gets the intro with reply-to set to the requester. You're CC'd for safety but not in the critical path.
- **Fuller:** Double-opt-in privacy (listee approves before email is shared), per-listing "accepting connections" toggle, and a connection-count badge ("12 players connected here").
- **Why:** Removes the human bottleneck so the network can grow faster than your free time. A directory whose connections depend on one person's inbox cannot scale to 50 states.

### #5 — Weekly "Mahj in [City]" digest
- **MVP:** A weekly email to everyone who listed or signed up: "This week in [their city]: 2 new players, 1 table forming, 1 open play." Even a near-empty digest with "still quiet, invite a friend?" keeps you top-of-mind. Drive it off a cron + the data you already have.
- **Fuller:** Personalized by skill/availability, includes "tables you can still join," NMJL-season content, and a one-tap "I'm still looking" re-activation button.
- **Why:** This is your retention engine. American Mahjong is a *weekly habit*; the email rides that existing cadence. It also recycles attention back into listings and connects (compounding).

### #6 — City pages
- **MVP:** Add `/states/[state]/[city]` for the cities already in `states-data.ts`, filtered from the same Supabase queries, with city-specific metadata. You already have city filtering in the client; this just makes it a real URL.
- **Fuller:** Programmatic expansion beyond the seed list as real listings arrive in new towns; city-level "notify me" and tables; internal links from state -> top cities.
- **Why:** "mahjong in [city]" is how people actually search. This multiplies your indexable surface from 50 pages to hundreds and is pure SEO-driven user acquisition. (Coverage KPI, directly.)

### #7 — NMJL card-season hook (spring)
- **MVP:** A seasonal banner + landing module: "New card season is here. **Find a card-study group near you**" pointing to tables filtered to "learning the new card." (Per CLAUDE.md: never name a month; "every spring.")
- **Fuller:** A dedicated card-season flow that spins up study tables per city and a study-buddy match.
- **Why:** It's the one moment every year when the *entire* audience re-engages simultaneously. Free, predictable, recurring demand spike. Time your biggest push to it.

### #8 — Claim + lightweight accounts (magic-link)
- **MVP:** Passwordless magic-link so a person can edit/refresh/remove their own listing and "bump" it (re-surface as recently active). No passwords, low friction.
- **Fuller:** A simple profile: your tables, your connections, your saved cities.
- **Why:** Enables self-service (kills your moderation/edit workload), enables "active in the last 30 days" freshness signals, and is the foundation for the host dashboard later. I rank it NEXT, not FIRST, because accounts add friction to listing creation; keep the initial list flow account-free and add accounts as an *upgrade*, not a gate.

### #9, #10, #11 — Recurring open-play calendar, referral-to-fill-table, matching
Solid NEXT-tier amplifiers once the core flywheel turns. Recurring open plays make hosting free and weekly (retention for hosts); referral makes filling a table a shareable act (viral loop); matching improves connect quality. All MVP-able on top of the keystone work.

---

## 3. Network-effect mechanics (why each compounds)

The flywheel you want: **more players -> more tables forming -> more visible activity per city -> higher SEO rank + word of mouth -> more players.**

- **Tables (#1)** are the engine. One player listing is subtractive (needs others). One *table* is additive: it's a goal others rally to, and every join makes the next join more likely (a table at 3/4 converts far better than 0/4). This is the classic local-liquidity loop: density begets density.
- **Seeding (#2)** primes the pump so the loop has something to spin on day one in all 50 states. Real existing groups become anchor content that pulls in the players searching for them, who then list, who then form tables.
- **Notify-me (#3)** captures the demand the loop can't yet serve and *converts thin cities into thick ones*: when enough people in Boise raise their hand, you email them all at once and a group materializes from latent demand. Cross-side network effect (askers create supply).
- **Instant connect (#4)** removes the throughput cap. The loop can only spin as fast as connections happen; taking your inbox out of the path lets it spin at internet speed.
- **Weekly digest (#5)** is the loop's flywheel mass: it converts past participants back into present activity every week, so growth doesn't leak.
- **City pages (#6)** turn every new listing into compounding SEO real estate. More listings -> richer city pages -> better ranking -> more searchers find them -> more listings. The content *is* the marketing.
- **Cross-site loop with lasvegasmahj.com:** the LVMahj audience (real students) seeds Nevada with genuine activity, which makes FindMyMahj's Nevada page a credible showcase, which you can point new cities' organizers to as "here's what an active state looks like."

---

## 4. Retention mechanics (reasons to return weekly)

American Mahjong is structurally a **weekly-game habit**. Build the product to ride that cadence, not fight it.

- **The weekly digest (#5)** is the primary hook: it lands the same day each week, mirroring game night. "2 new players in your city" is a reason to click back.
- **Table progress as an open loop:** if you started or joined a 2/4 table, you *will* come back to see if it filled. Email each fill event ("Sandra just joined your table, 3 of 4!"). Open loops are the strongest retention driver you have.
- **"Notify me" payoff:** people who raised their hand for an empty city get pulled back the moment it's no longer empty.
- **NMJL card season (#7):** an annual, calendar-locked re-engagement spike the whole base feels at once. Build a ritual around it.
- **"Still looking?" re-activation:** a monthly one-tap "yes I'm still looking" both keeps listings fresh and re-touches dormant users (and lets you decay stale ones so pages don't rot).
- **Recurring open plays (#9):** a host who lists a weekly game has a standing reason to return and update attendance; attendees have a standing weekly event to check.

What I would NOT lean on for retention: gamification badges, streaks, points. This audience plays for the social game, not a leaderboard. The retention is the *game itself*; your job is to be the connective tissue around it.

---

## 5. Product roadmap

**NOW (this sprint, the flywheel bundle):**
Tables/group-forming (#1) + honest community seeding of all 50 states (#2) + "notify me" on empty cities (#3) + instant two-way connect (#4) + weekly city digest (#5) + city pages (#6). Ship as one coherent release. Outcome: no empty pages, a reason to list, a reason to return, and a demand-capture loop.

**NEXT (4-8 weeks out):**
NMJL card-season hook (#7, time it to spring) + claim/magic-link accounts and listing self-service (#8) + recurring open-play calendar (#9) + refer-to-fill-table (#10) + basic matching (#11).

**LATER (only after the loop is demonstrably turning):**
Host/group dashboard with roster + group messaging (#12). Revisit only when you have enough active groups that organizing them is the bottleneck.

---

## 6. What to NOT build (and why)

- **In-app chat/messaging (#13):** huge build, huge moderation/safety/abuse surface, and email already covers the one job that matters (getting two people in touch). It would consume the whole sprint and slow the flywheel. Skip until messaging volume is a real, measured pain.
- **Native mobile app (#14):** zero ROI for a directory this stage; the mobile web works, and an app fragments your effort and your tiny audience. Don't.
- **Ratings/reviews of players or venues (#15):** toxic for a small, real-name, predominantly-women community where people are inviting strangers into homes. Reviews of *people* create fear and conflict; even venue reviews aren't worth the moderation load now. Trust comes from real identity and the group context, not stars.
- **Distance/zip "radius" search as currently stubbed:** the state-page distance buttons and zip box in `client.tsx` are non-functional UI. Either wire them up minimally (city-level) or remove them. Shipping dead controls erodes trust. Lower priority than the flywheel, but fix or cut.
- **Heavy paid-tier / monetization features:** explicitly out of scope this sprint per your KPIs. Keep player and group listings free and frictionless; free supply is your growth fuel right now.
- **Premature accounts as a gate:** do not require login to create the first listing. Friction here directly suppresses your top KPI. Accounts are an upgrade (#8), never a toll booth.

---

## Most important takeaways

1. **Reframe the unit from "player" to "table/forming group."** This single change in `player_listings` + `client.tsx` is the highest-leverage thing you can do and it fixes cold-start, network effects, and retention simultaneously.
2. **Never show an empty page.** Seed honestly from the real existing community (FB/Meetup, link-verified, clearly labeled) and capture demand with "notify me" everywhere else.
3. **Take your inbox out of the connection path** and **add a weekly digest** so the network can grow faster than your free time and people have a reason to return on their game-night cadence.

Files most relevant to executing the Do-First bundle: `/Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/client.tsx` (tables, connect, notify-me UI), `/Users/shaunabruckman/Projects/findmymahjgame/app/list-my-game/list-my-game-client.tsx` (table toggle in the list flow), `/Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/page.tsx` (new table/notify queries), `/Users/shaunabruckman/Projects/findmymahjgame/lib/states-data.ts` + a new `/Users/shaunabruckman/Projects/findmymahjgame/app/states/[state]/[city]/` route (city pages), and `/Users/shaunabruckman/Projects/findmymahjgame/app/page.tsx` (replace empty homepage sections with seeded/forming content).
