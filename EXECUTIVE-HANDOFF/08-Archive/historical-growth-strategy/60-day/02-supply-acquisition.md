I have all the grounding I need, including the multiple competing teacher directories (Oh My Mahjong, Modern Mahjong, MahjongCompare, Mahj Life Instructor Guild, The Mahjong Line, I Love Mahj) and the 11,000 senior center figure. I'm now ready to write the complete plan. This is my deliverable.

---

# NATIONAL SUPPLY ACQUISITION PLAN — 1,000+ Real Published Listings in 60 Days

## The one number that should set your pulse: 1,218

When the prior strategy doc was written, the competitor Bam Good Time had aggregated 1,026 mahjong clubs. As of this week their directory reads **"Browse 1,218 mahjong clubs across the US and Canada"** and they now run the *exact* model you want to own: browse-by-state, browse-by-city, individual club pages, a **"Claim"** button on unclaimed listings, and a **"Start a Club — it's free to get started"** CTA. ([source](https://bamgoodtime.com/clubs))

That changes the strategic read. The data is not just acquirable, a competitor is acquiring ~200 net-new listings per ~quarter and is building the claimable-directory layer that was supposed to be your wedge. You are not first. You win by being **deeper per metro, fresher (weekly re-crawl), better-structured for SEO, and easier to claim** than they are, and by owning channels they are weak in (libraries via LibCal, JCCs, and retirement communities, where they have thin coverage). Speed is the whole game now.

This plan covers all seven channels with the four required elements each (where listings live + national-scale discovery, realistic acquisition method with a blunt legality note, the actual template/scrape approach, expected yield), then gives the prioritized sequence, weekly targets, and the single channel to attack first. Schema note: all of this writes into your existing tables (`venues`, `events`, `connectors`) with `status='draft'` until verified, then `status='published'`. Civic/scraped data lands as `venues`/`events`; consented people land as `connectors`.

---

## CHANNEL 1 — LIBRARIES (via LibCal / Springshare) — *highest mechanical yield, cleanest legality*

**Where the listings live / how to find them at national scale.** LibCal (Springshare) powers 3,600+ libraries ([source](https://blog.springshare.com/2024/11/21/libcal-the-most-popular-event-ticketing-and-kit-management-software-for-libraries/)). Mahjong is a staple recurring library program. Live, confirmed examples this week: Charlotte County FL ("Learn Mahjong," Tuesdays 2-4pm, [source](https://charlottecountyfl.libcal.com/event/16092514)), Prince Memorial ME ([source](https://princememorial.libcal.com/calendar/16477/mah-jongg)), Arlington VA, Santa Cruz CA, Montgomery County MD ([libnet variant](https://mcpl.libnet.info/event/15141832)). Discovery at scale, two paths combined:
1. Google dorking: `site:libcal.com mahjong`, `site:libcal.com "mah jongg"`, `site:libnet.info mahjong`. Each hit is a live event URL on a predictably-patterned subdomain (`[library].libcal.com`).
2. Subdomain enumeration: harvest the `[name].libcal.com` host from each hit, then hit that library's full calendar feed for ALL its mahjong events (recurring series = many dated listings from one host).

**Acquisition method + blunt legality.** Scrape — GREEN light, the cleanest source you have. Public civic event data, no login wall, no PII (the host is the library, not a person). LibCal also exposes a read API returning JSON (events 2 weeks back to 1 year forward, 500/pull) and embeddable widgets ([source](https://ask.springshare.com/libcal/faq/1407/)). You do not need per-library API keys; public event pages and iCal/feed endpoints are fetchable directly. Risk note: honor each subdomain's robots.txt, rate-limit to ~1 req/2s, set a descriptive User-Agent, and **link back to the source event page** on every listing. That keeps you defensible and is good for the libraries.

**Actual scrape approach (concrete).**
1. Seed file `libcal_hosts.txt` from the Google-dork harvest (target 300-500 hosts week 1).
2. For each host, fetch `https://[host]/calendar?cid=-1&t=m` and the JSON/iCal feed; regex/keyword filter title+description for `mahjong|mah jongg|mah-jongg`.
3. Normalize each event into `events`: `title`, `type='open_play'` (or `'lesson'` if title contains learn/beginner/class), `state`, `city`, `venue`=library name, `address`, `date`/`end_date`, `registration_url`=source page, `status='draft'`.
4. Dedupe on (venue + title + recurring series); collapse a weekly series into one listing with next date.
5. Re-run the crawler **weekly** (cron) so recurring programs never go stale. Freshness is your edge over Bam Good Time's static list.

**Expected yield.** Realistically **250-400 published listings over the sprint**, front-loaded. Roughly 1 in 8-12 LibCal libraries runs a mahjong program; 3,600 libraries implies 300-450 candidate programs, most genuinely public and recurring. This is your single best mechanical fill.

---

## CHANNEL 2 — JCCs (Jewish Community Centers) — *highest-quality recurring listings*

**Where they live / national-scale discovery.** JCC Association represents 170+ JCCs serving 1.5M weekly visitors ([source](https://jcca.org/what-we-do/jcc-resource-center/)); densest in NY (~37), CA (~20), FL and NJ (~13 each). Mahjong is a core JCC program. Live class pages confirmed: JCC Central NJ, Greater Boston, Gordon JCC Nashville, Valley of the Sun J Phoenix ([games page](https://valleyofthesunj.org/adults-seniors/games/)), Weinstein Richmond. 170 domains is a finite, hand-curatable universe. Build the master list from the JCC Association member map plus `site:[jcc-domain] mahjong` per domain.

**Acquisition method + legality.** Hybrid scrape-then-confirm — GREEN. Public program pages on public sites. (The Association's internal member registry "JRC" is password-protected, so you scrape the individual public JCC sites, never the central registry.) Because most JCC programs are seasonal sessions, pair the scrape with a one-line confirmation email to the program director (template below) so the listing carries a real contact and survives the next session.

**Actual outreach template (JCC program director, also the Channel-4 community-center pattern):**

> Subject: Free listing for your mahjong class — we'll send you players
>
> Hi [Name],
> I run FindMyMahjGame.com, the free national directory players use to find local mahjong games, classes, and clubs. I found your American Mahjong class on the [JCC name] site and would love to feature it so NMJL players searching in [metro] find you.
> It's free, it stays your program (we link straight to your registration), and your enrollment is the only thing that goes up. Can I confirm two things: is the class still running this session, and what's the best public link or contact to list?
> I built this with Shauna Bruckman, a certified NMJL instructor, so it's by-a-player, for-players.
> Thanks, [Name] — FindMyMahjGame

**Expected yield.** **60-110 listings.** ~170 JCCs, mahjong present at well over half, often multiple programs (beginner class + open play) per JCC. High trust, high freshness once confirmed.

---

## CHANNEL 3 — TEACHERS / INSTRUCTORS — *highest-converting outreach, your `connectors` engine*

**Where they live / national-scale discovery.** Instructors are already aggregated on six competing directories you can mine as *lead lists* (not bulk-copy): Oh My Mahjong's Mahji Mentor locator ([source](https://ohmymahjong.com/pages/mahjong-teacher-locator)), Modern Mahjong teacher directory, MahjongCompare teachers, Mahj Life Instructor Guild ([source](https://mahjlife.com/instructor-guild-directory/)), The Mahjong Line instructors ([source](https://themahjongline.com/pages/tml-mahjong-teachers)), and I Love Mahj ([source](https://www.ilovemahj.com/learn/teachers)). Sloperama's Maj Exchange adds independents.

**Acquisition method + legality.** Outreach for consented listings (GREEN); the directories are *discovery only*. Do not bulk-import a competitor's curated teacher DB, that's the move most likely to draw a complaint and it produces low-trust, un-consented PII listings that collide with your RLS posture. Instead, harvest names + public contact, then pitch each to self-list via `/get-listed`. Teachers are the strongest converters because you offer them exactly what they want: students/demand.

**Actual outreach template (instructor):**

> Subject: Free students in [city] — list your mahjong classes
>
> Hi [Name],
> You teach NMJL mahjong in [city], and players there are searching for exactly that. FindMyMahjGame.com is the free directory they use to find local teachers and games. List your classes free and get found by students near you, no fee, no catch: [/get-listed link]
> Takes about 2 minutes. You keep everything as-is; we just send you the demand. Built with certified instructor Shauna Bruckman, so it's player-first.
> Want me to set up your listing draft and send it to you to approve?

**Expected yield.** **120-200 consented `connectors`.** This is also your flywheel seed: every teacher who lists is a USER who can refer their own students and the venues they teach at.

---

## CHANNEL 4 — COMMUNITY CENTERS / SENIOR CENTERS / PARKS & REC — *huge but fragmented*

**Where they live / national-scale discovery.** ~11,000 senior centers serve 1M+ older adults daily ([source](https://www.ncoa.org/page/senior-centers/)); mahjong is a top-tier activity at them, plus municipal parks-and-rec catalogs (ActiveNet, RecTrac, CivicRec, PerfectMind, MyRec, Augusoft). The problem: no common API, every city is a different platform. Confirmed live mahjong listings: Rocky Hill CT (MyRec), North Shore Senior Center (Augusoft), Scottsdale, Chandler, San Mateo senior centers.

**Acquisition method + legality.** Per-metro semi-manual scrape — GREEN (public civic data) but high effort per listing because it is fragmented. Do NOT attempt a national scrape; attack it per-metro during city expansion using platform-specific dorks: `"mahjong" site:*.myrec.com`, `"mah jongg" recreation senior center [metro]`, `"mahjong" inurl:activenet`. Use the same JCC-style confirmation email (Channel 2 template) to the activities coordinator.

**Expected yield.** **80-150 listings**, accrued steadily as you light up each Wave-1/Wave-2 metro. Treat as fill that pushes anchor metros above showcase MVL, not a standalone sprint.

---

## CHANNEL 5 — CLUBS / OPEN-PLAY GROUPS (Meetup + Facebook as discovery) — *largest living pool*

**Where they live / national-scale discovery.** Hundreds of active groups on Meetup (topic hubs `/topics/american-mah-jongg/` and `/topics/mahjong/`) and the largest, most-engaged pool on Facebook groups. New permanent venues are appearing too: Phoenix Mahjong Club opened a 15-table, 80-player Scottsdale venue on Jan 10, 2026 ([source](https://www.azfamily.com/2026/01/12/phoenix-mahjong-club-opens-first-permanent-venue-scottsdale/)) — exactly the kind of anchor club to list and partner with.

**Acquisition method + legality.** Discovery-to-outreach, NOT bulk scrape.
- Meetup: YELLOW. The official API needs Meetup Pro ($30/group/mo) and approval, and the license is limited/revocable. ToS restricts automated access to public pages. So use Meetup to *find* groups, then recruit the organizer to self-list. That converts a gray scrape into a clean, consented listing.
- Facebook: RED for scraping. The Groups API was fully deprecated in April 2024; public group content sits behind a login wall and automated access violates Meta ToS. Critically, your audience LIVES on Facebook, so scraping risks banning the very accounts (and the women-led sister brand) you need there. Use Facebook only to DM/post to group admins.

**Actual outreach (club organizer / FB admin):**

> Subject (or DM): Stop answering "is there a game near me?" every week
>
> Hi [Name], admins like you are how players in [city] actually find games. I built FindMyMahjGame.com, a free directory, so newcomers find your group without flooding your inbox. Add your group once (2 min, [/list-my-game link]); you keep your Meetup/Facebook exactly as-is, we just point local searchers to you. Built with certified instructor Shauna Bruckman. Want me to draft your listing for a one-click approve?

**Expected yield.** **150-250 consented club listings**, the richest seam of *living* community. Organizers convert well because you solve a real pain (repetitive newcomer questions) and add free distribution.

---

## CHANNEL 6 — TOURNAMENT DIRECTORS / RETREAT & CRUISE ORGANIZERS — *low count, high-prestige `events`*

**Where they live / discovery.** There is no sanctioning body; each director sets their own rules under NMJL conventions ([source](https://bamgoodtime.com/blog/how-to-run-mahjong-tournament-2026-modern-guide/)), so there's no master list, but the operators are few and findable: Destination Mah Jongg (3-day NMJL tournament Oct 16-18, 2026, Las Vegas), Mah Jongg Fever, Tile Travelers, Crak Your Bags, Lookout Mountain, plus MahjongCompare's events page ([source](https://mahjongcompare.com/events)) and Bam Good Time's per-state tournament pages ([source](https://bamgoodtime.com/tournaments/new-jersey)) as lead lists.

**Acquisition method + legality.** Direct partnership outreach — GREEN, and an easy yes (you offer free national promotion to their exact audience). Each organizer runs multiple dated events, so a handful of partners yields many `events` rows.

**Actual outreach (tournament/retreat organizer):**

> Subject: Free national promotion for your 2026 mahjong events
>
> Hi [Name], FindMyMahjGame.com is the free directory players use to find tournaments and retreats nationwide. I'd love to list your 2026 events, no cost, with a direct link to your registration. You reach high-intent players actively searching; we get a great event to feature. Send me your 2026 schedule (or a link) and I'll build the listings and send them to you to approve.

**Expected yield.** **40-80 event listings** from ~10-15 organizers. Low volume but they make your events vertical look nationally alive and are showcase material for partnership pitches.

---

## CHANNEL 7 — RETIREMENT COMMUNITIES (55+ / The Villages / Sun Belt) — *special focus: your demographic bullseye*

This is the audience. NMJL's core (affluent retiree women) clusters in Sun Belt active-adult communities, and mahjong is wall-to-wall there. The reason this channel is underexploited by competitors is that the data isn't on Meetup, it's inside resident club rosters. Here's how to crack it at scale.

**Where the listings live / national-scale discovery (three layers):**
1. **Mega-communities with public/quasi-public club registries.** The Villages (FL) publishes a downloadable **club-contact PDF** on the district government site ("Club-Contact-8.15.25.pdf," 3,000+ resident clubs, [source](https://www.thevillages.com/recreation/card-game-players/)) and runs club listings every Thursday in The Villages Daily Sun ([recreation club listings](https://www.thevillagesdailysun.com/clublistings/)). Sun City West has 90+ chartered clubs across 4 rec centers ([source](https://suncitywest.com/)). These are the single densest mahjong rosters in America.
2. **The national community universe via aggregators.** 55places.com and Where55 list active-adult communities by state with amenity/activity data (Texas alone ~90 communities; [55places all-states](https://www.55places.com/all-states), [Where55](https://where55.com/communities/)). Builder portals add structured rosters: Del Webb, Robson Resort Communities (SaddleBrooke, Robson Ranch TX/AZ — mahjong confirmed, [source](https://robson.com/mah-jongg-provides-a-way-to-give-back-at-saddlebrooke-ranch/)), Toll Brothers Regency, On Top of the World (Ocala), Latitude Margaritaville, Sun City Center.
3. **Per-community resident sites + activity newsletters** (e.g., robsonranchhouses.com/lifestyle/activities-clubs, community "Views"/"News" papers) that name the mahjong chair and meeting time.

**Acquisition method + blunt legality.**
- The Villages club-contact PDF is a **public government record** — GREEN to read and to extract the mahjong-relevant entries. But it lists *resident-led club contacts (often a personal name/phone)*. Do NOT publish a private resident's name/phone scraped from it. Instead, extract the mahjong club names + meeting venue (public), publish the *club/venue* as a `venue`/`event`, and **email/call the listed contact for consent** before showing any personal contact info. This respects your RLS/PII posture.
- Aggregator sites (55places, builder portals): GREEN to read amenity pages for *which communities have mahjong*; use as a lead list, then go to the community activities office. Don't republish their proprietary listing copy.
- Community newsletters: GREEN to read; same consent rule for any named person.

**Realistic mechanic (this is the unlock):** retirement communities don't have an API, they have an **Activities/Lifestyle Director**. One email to that director gets you the whole community's mahjong roster, consented, in one shot, and they're delighted because filling activities is literally their job.

**Actual outreach (activities/lifestyle director):**

> Subject: Free way to fill your mahjong tables (and help new residents find them)
>
> Hi [Name],
> I run FindMyMahjGame.com, the free national directory players use to find local mahjong games. New residents at [community] constantly ask "where's the mahjong game?" — I'd love to list your community's mahjong groups and open-play so they find you instantly. It's free, you control what's shown, and it helps your residents connect faster.
> Could you point me to your mahjong club contact(s) or the activities calendar? I'll build the listing and send it to you to approve before anything goes live. Built with Shauna Bruckman, a certified NMJL instructor.
> Thank you, [Name] — FindMyMahjGame

**Where to find the directors at scale:** activities/lifestyle contacts are public on community sites, in the resident newsletters, and via the HOA/lifestyle office line. Prioritize: The Villages, Sun City + Sun City West + Sun City Grand (AZ), SaddleBrooke + Robson Ranch (AZ/TX), On Top of the World (FL), Latitude Margaritaville (FL/SC), Sun City Center + Kings Point (FL), Laguna Woods Village (CA), Solivita (FL), Lakewood Ranch (FL).

**Expected yield.** **150-250 listings**, and the highest-density-per-touch of any channel. A single Villages or Sun City contact can surface 5-15 mahjong groups at once. This is where you out-cover Bam Good Time.

---

## Prioritized sequence (fastest REAL listings first)

1. **Week 1-2: LibCal library scraper (Channel 1).** Mechanical, GREEN, no human in the loop, hundreds of listings. Build it first, set it to re-run weekly.
2. **Week 1-2 (parallel): Oh My Mahjong partnership conversation.** Still the single biggest one-deal lever — a network of 1,000+ Mahji Mentors and a clunky third-party (Stockist.co) locator they'd happily upgrade. One yes could deliver most of 1,000. Open it day one; it's relational and slow, so start early.
3. **Week 2-4: JCC public-page scrape + confirm (Channel 2)** and **instructor outreach (Channel 3)** in parallel.
4. **Week 2-6: Retirement-community director outreach (Channel 7)** — start with The Villages PDF + Sun City rosters immediately; highest density per touch, your bullseye audience.
5. **Week 3-6: Club/organizer discovery-to-outreach (Channel 5)** via Meetup + Facebook admins.
6. **Week 3-8: Per-metro community/senior-center fill (Channel 4)** as each Wave-1/2 metro lights up.
7. **Week 2-8 (low effort, rolling): Tournament/retreat partnerships (Channel 6).**

---

## Weekly targets to clear 1,000+ published in 60 days (~8.5 weeks)

Target the **1,200 mark** (clears 1,000 with margin for verification fallout and to overtake Bam Good Time's 1,218). Per-channel sprint totals and the weekly cadence:

| Channel | Sprint target | Weekly cadence | Method |
|---|---|---|---|
| 1. Libraries (LibCal) | 320 | ~45/wk (front-loaded wks 1-5) | Scrape + weekly re-crawl |
| 2. JCCs | 90 | ~12/wk | Scrape + confirm |
| 3. Teachers | 160 | ~20/wk | Outreach → self-list |
| 4. Community/senior centers | 110 | ~14/wk (per-metro) | Semi-manual scrape + confirm |
| 5. Clubs (Meetup/FB) | 200 | ~25/wk | Discovery → outreach |
| 6. Tournament/retreat | 60 | ~8/wk | Partnership outreach |
| 7. Retirement communities | 200 | ~25/wk | Director outreach |
| **Wildcard: Oh My Mahjong deal** | **+100-1,000** | one-time | Partnership |
| **TOTAL (ex-partnership)** | **1,140** | **~150/wk** | |

Operating notes that make these numbers real:
- **~150 net-published/week** is the drumbeat. Front-load Channels 1+3+5 in weeks 1-4 so the scraper-fed and fastest-converting channels carry the early curve while director/partnership outreach (slower) compounds in weeks 4-8.
- **Verification tax:** assume ~15-20% of scraped drafts fail verification (dead program, no longer running, can't confirm). The 1,140 target already pads for this against the 1,000 goal. Every external link must return 200 before publish, per your own hard rules.
- **Depth over breadth:** enforce MVL = 5 real listings/city (≥1 club + ≥1 teacher), stretch 10+ in Wave-1 anchors (Las Vegas, NYC, LA, South Florida, Chicago, Boston, North NJ, SF Bay). Anchors overshoot and become showcase pages for the partnership pitches.
- **Flywheel on every consented listing:** the closing ask is always "know another group? add it free" — listings beget users beget listings.

---

## The single highest-yield channel to attack FIRST

**Libraries via the LibCal scraper (Channel 1).** It is the only channel that is simultaneously (a) GREEN on legality with zero PII risk, (b) fully mechanical (no human reply needed, so it produces listings on day one while every outreach channel is still waiting on responses), (c) high-volume (250-400 from 3,600 LibCal libraries), and (d) self-refreshing weekly, which is your durable edge over Bam Good Time's static 1,218. Build it in week 1, point it at a 300-500 host seed list, and it carries your early curve solo while the relational channels (Oh My Mahjong, retirement directors, instructors) warm up.

Run **Channel 7 (retirement communities) as the close-second priority and your true differentiator** — it's where your NMJL demographic actually plays, where competitors are thinnest, and where one activities-director email surfaces 5-15 listings at once.

---

**Key new/updated sources this pass:** [Bam Good Time clubs directory — now 1,218, claim + start-a-club model](https://bamgoodtime.com/clubs) · [Charlotte County FL LibCal mahjong](https://charlottecountyfl.libcal.com/event/16092514) · [LibCal 3,600+ libraries](https://blog.springshare.com/2024/11/21/libcal-the-most-popular-event-ticketing-and-kit-management-software-for-libraries/) · [The Villages card & game clubs + club-contact PDF](https://www.thevillages.com/recreation/card-game-players/) · [The Villages Daily Sun club listings](https://www.thevillagesdailysun.com/clublistings/) · [Sun City West 90+ chartered clubs](https://suncitywest.com/) · [Robson/SaddleBrooke mahjong](https://robson.com/mah-jongg-provides-a-way-to-give-back-at-saddlebrooke-ranch/) · [55places all-states directory](https://www.55places.com/all-states) · [NCOA 11,000 senior centers](https://www.ncoa.org/page/senior-centers/) · [Phoenix Mahjong Club Scottsdale venue Jan 2026](https://www.azfamily.com/2026/01/12/phoenix-mahjong-club-opens-first-permanent-venue-scottsdale/) · [Mahj Life Instructor Guild](https://mahjlife.com/instructor-guild-directory/) · [Destination Mah Jongg / no sanctioning body](https://bamgoodtime.com/blog/how-to-run-mahjong-tournament-2026-modern-guide/) · plus prior-doc sources (Meetup API terms, Eventbrite ToU, Facebook Groups API deprecation, JCC Association 170+, Oh My Mahjong 1,000+ mentors).

Note: the existing doc lives on the `growth-strategy` branch at `growth/06-supply-acquisition.md` (not on the current `honesty-cleanup` branch, which is why it wasn't found at the working-directory path). I did not modify any files. This plan is delivered here as text per the no-summary-file rule; tell me if you want it committed to `growth/06-supply-acquisition.md` on the `growth-strategy` branch.
