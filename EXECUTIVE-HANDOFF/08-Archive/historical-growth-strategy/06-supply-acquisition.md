I now have everything I need, including a critical competitive signal: Bam Good Time's "State of American Mahjong 2026" report already aggregated 1,026 unique clubs across 51 states/territories from public sources including Meetup. That tells me (a) the data exists and is acquirable, and (b) FindMyMahj is in a race. This sharpens the recommendation. I have enough grounded sources to deliver the plan.

---

# WORKSTREAM 6: SUPPLY ACQUISITION — National Listings Acquisition Plan

## The blunt truth up front

You have a directory with rich SEED data (50 states, city lists) but the listings are the product. Empty city pages are worse than no city pages — they signal "dead site" to both users and Google. The hardest and most valuable thing you can do this sprint is get to **minimum viable liquidity** in real listings fast.

Two findings reframe the whole problem:

1. **A competitor already did the aggregation.** Bam Good Time's "State of American Mahjong 2026" report claims **1,026 unique clubs across 51 states/territories**, pulled from public sources *including Meetup*. ([source](https://bamgoodtime.com/blog/state-of-american-mahjong-2026)). This proves the data is acquirable at ~1,000-listing scale by one team, and that you are in a land grab. Speed matters.

2. **The incumbents are weak on structure.** Sloperama is a manually-moderated, single-page bulletin board you search with Ctrl-F (one post/person/year, no geo structure) ([source](https://www.sloperama.com/majexchange/findplayer.htm)). Oh My Mahjong outsources its teacher locator to a third-party widget (Stockist.co). Nobody owns a clean, SEO-indexed, per-city structured directory. **That gap is your wedge.**

**The single fastest path to 1,000+ real listings: a hybrid scrape-and-enrich of LibCal + JCC program pages + Meetup, layered with a "claim your listing" outreach loop.** Details below.

---

## Part 1 — Scraping / Import Opportunities (ranked, with permissibility)

I'm ranking these by `(volume × ease × legal safety) ÷ effort`. The legal posture matters because your owner is non-technical and a sister business (lasvegasmahj.com) shares reputation — you cannot afford a cease-and-desist or platform ban.

### TIER 1 — DO THESE FIRST (high volume, structured, defensible)

**1A. LibCal (Springshare) public library calendars — THE single best mechanical source.**
- **Why:** LibCal powers **3,600+ libraries worldwide** ([source](https://blog.springshare.com/2024/11/21/libcal-the-most-popular-event-ticketing-and-kit-management-software-for-libraries)). Libraries host an enormous and growing volume of mahjong programs (American Mahjong Club, open play, beginner classes) and the data is genuinely public, recurring, and free of PII. Confirmed live examples: Hussey-Mayfield Memorial (IN), Charleston County (SC), Mill Valley (CA).
- **Mechanics:** LibCal subdomains follow a predictable pattern (`[library].libcal.com`). It has a **read API returning JSON** (events from 2 weeks past to 1 year forward, 500-event cap per pull) and embeddable event widgets ([source](https://ask.springshare.com/libcal/faq/1407)). Even without per-library API keys, each LibCal calendar exposes public event pages and feeds you can fetch and parse.
- **Permissibility:** GREEN. This is public civic event data, no login wall, no PII. The cleanest possible source. Honor robots.txt, rate-limit, attribute, and link back to the source event page.
- **Playbook:** Build a list of LibCal subdomains (enumerate from a seed list + Google `site:libcal.com mahjong`), fetch each calendar's mahjong-tagged events, normalize to `event_listings`. Re-run weekly so recurring programs stay fresh.

**1B. JCC program pages — highest-quality recurring listings.**
- **Why:** JCC Association represents **170+ JCCs** serving 1.5M weekly visitors ([source](https://jcca.org/what-we-do/jcc-resource-center/)); NY (37), CA (~20), FL & NJ (13 each). Mahjong is a *staple* JCC program and explicitly NMJL-sanctioned. Confirmed live class pages: JCC Central NJ, JCC Greater Boston, Gordon JCC Nashville, Silver Lake IJCC (LA), Weinstein JCC, Birnbaum JCC. These are recurring, structured, instructor-attached listings — the gold standard.
- **Permissibility:** GREEN. Public program pages on public-facing sites. Scrape program calendars, attribute, link back. (Note: the JCC Association's internal directory — JRC — is password-protected, so you scrape the *individual JCC public sites*, not the central registry.)
- **Playbook:** ~170 JCC domains is a finite, hand-curatable list. Worth a semi-manual pass plus a scraper for the ones on common CMS platforms.

**1C. Meetup public American Mahjong groups.**
- **Why:** "Hundreds of mahjong groups across major US cities"; Bam Good Time's 1,026-club count drew heavily from Meetup ([source](https://mahjongplaybook.com/culture/where-to-play-mahjong-usa/)). Topic hubs exist: `/topics/american-mah-jongg/` and `/topics/mahjong/`. This is where the *living* community already is.
- **Permissibility:** YELLOW. The official API requires a **Meetup Pro subscription ($30/group/mo)** and approval, and the license is limited/revocable ([source](https://help.meetup.com/hc/en-us/articles/360028705532-Meetup-API-license-terms)). Public group/event *pages* are crawlable, but ToS restricts automated access. **Recommended posture:** treat Meetup as a *discovery* source, not a bulk-import source — find the groups, then run outreach (Part 2) to get organizers to claim/submit their own listing. That converts a legal-gray scrape into a clean, owner-consented listing. This is the legally safe and higher-quality move.

### TIER 2 — DO SECOND (good volume, more friction)

**2A. Eventbrite mahjong events.**
- **Reality check:** As of 2024 **there is no public API endpoint to search all Eventbrite events** ([source](https://www.eventbrite.com/help/en-us/articles/833731/eventbrite-api-terms-of-use/)). You can only pull events you have org access to. Public event pages are indexable via Google (`site:eventbrite.com mahjong`).
- **Permissibility constraint:** If you display Eventbrite event content you **must show the event title and a direct link to the Eventbrite page**, and **may not store data about past events** ([source, API ToU](https://www.eventbrite.com/help/en-us/articles/833731/eventbrite-api-terms-of-use/)). Workable for *future* events with attribution. YELLOW.
- **Playbook:** Google-discover individual mahjong event URLs, fetch the public page, store future-event data only with mandatory back-link. Lower priority than LibCal/JCC because of the storage restrictions and lack of search API.

**2B. Senior centers, parks & rec, community centers.**
- **Why:** Mahjong is a top senior-center activity nationwide; parks & rec catalogs (ActiveNet, RecTrac, CivicRec, PerfectMind) list rec classes including mahjong ([source](https://betaquick.com/blog/ai-parks-recreation-scheduling/)).
- **Permissibility:** GREEN (public civic data) but **fragmented** — no common API, every city is a different platform/page. High effort per listing.
- **Playbook:** Defer to a per-metro manual pass during city expansion (Part 4), not a national scrape.

### TIER 3 — AVOID OR HANDLE WITH CARE

**3A. Facebook public group events — DO NOT SCRAPE.**
- The Facebook **Groups API was fully deprecated in April 2024** — no legitimate API path remains. Public group content is now gated behind a login wall, and automated access violates Meta ToS ([source](https://developers.facebook.com/docs/graph-api/reference/event/), [overview](https://data365.co/blog/facebook-unofficial-api)). RED. Scraping risks account bans and reputational harm to a women-led brand whose audience *lives on Facebook*. Instead: use Facebook for **outreach to group admins** (Part 2), never for scraping.

**3B. Competitor directories (Sloperama, MahjongCompare, Bam Good Time, I Love Mahj, MahJongg Maven).**
- Do not bulk-copy a competitor's curated DB — that's the one move most likely to draw a complaint and is low-integrity. Use them only as *cross-checks* and as *leads* for first-party outreach. (Modern Mahjong even took its teacher directory offline due to spam — a cautionary tale about unmoderated user-gen listings.)

**Recommended scraping order:** LibCal → JCC public pages → Meetup (as discovery → outreach) → Eventbrite (future events w/ attribution) → parks/rec & senior centers (per-metro, manual).

---

## Part 2 — Outreach Opportunities (with templated pitch angle per persona)

Outreach converts gray-area discovery into clean, owner-consented, *higher-trust* listings — and seeds your USER base. Every pitch leads with **"free, gets you found, takes 2 minutes"** and routes to your existing `/list-my-game` or `/get-listed` flows.

**1. Independent instructors** (sourced from Oh My Mahjong locator, The Mahjong Line instructors, I Love Mahj, MahJongg Maven, Sloperama).
- *Angle:* "You teach NMJL mahjong in [city]. We're the free directory players search to find local games and teachers — list your classes free and get found by students in your area. No fee, no catch. Here's your link: [/get-listed]." Instructors want students; you offer demand. Strongest converter.

**2. Club / open-play organizers** (sourced from Meetup discovery, LibCal hosts).
- *Angle:* "Your [city] group is exactly what local players search for on FindMyMahj. Claim your free listing so newcomers find you — we'll send you the players, you keep your Meetup/Facebook as-is." Frame as *additive distribution*, not a competitor to their existing platform.

**3. Facebook group admins** (the largest, most engaged pool — since you can't scrape the groups, you recruit the admins).
- *Angle:* DM/post: "Admins like you are how players in [city] find games. We built a free directory — add your group once and stop fielding the same 'is there a game near me?' question every week." Solves a real admin pain (repetitive newcomer questions).

**4. JCC / community-center program directors.**
- *Angle:* "Your beginner mahjong class fills a real need — let's get it in front of every NMJL player searching in [metro]. Free listing, we drive sign-ups, you do nothing but say yes." Program directors are measured on enrollment; you're free enrollment.

**5. Library program coordinators** (warm — many already on LibCal you've scraped).
- *Angle:* "We already feature your American Mahjong Club from your public calendar — want to confirm/enhance the listing and add a contact?" This *converts a scrape into a consented, enriched listing* and builds goodwill.

---

## Part 3 — Partnership Opportunities (what each side gets)

**1. Oh My Mahjong — the #1 partner to pursue.**
- They have a **nationwide network of 1,000+ certified "Mahji Mentors"** and run a teacher locator on a clunky third-party widget ([source](https://www.prnewswire.com/news-releases/oh-my-mahjong-launches-international-mahjong-card-302607462.html)).
- *They get:* a better, SEO-indexed, free directory for their mentors (upgrade over Stockist.co) + player demand for their teachers.
- *You get:* potentially **1,000+ instructor listings in one deal** — instant national coverage. This single partnership could be most of your path to 1,000. Pitch a co-branded "Find a Mahji Mentor near you" integration.

**2. National Mah Jongg League (NMJL).**
- NMJL is the rules authority and card publisher; it does *not* run a strong teacher/game finder (it points people to third parties).
- *They get:* a free service to offer the players who contact them looking for local teachers/games (a request they currently can't satisfy well).
- *You get:* authority/legitimacy and referral traffic. Lower probability (NMJL is conservative/slow) but high-value halo. Worth one warm, patient approach.

**3. Set sellers — The Mahjong Line, Bird & Bamboo, Modern Mahjong.**
- *They get:* "where to play" content that supports their product sales + co-marketing to your players.
- *You get:* their instructor/community lists and cross-promotion. Modern Mahjong already maintains per-state pages (e.g. NY) — a content-share partnership beats scraping.

**4. Cruise / retreat / tournament organizers** (Mah Jongg Fever, Destination Mah Jongg, Tile Travelers, Lookout Mountain, Crak Your Bags).
- *They get:* free national event promotion to a targeted audience.
- *You get:* premium, high-intent **event listings** that make your events vertical look alive nationally. Easy yes.

**5. JCC Association of North America.**
- *They get:* a turnkey way to surface member-JCC mahjong programs to the public.
- *You get:* a blessed path to 170+ JCCs' program data (vs. scraping each). Long sales cycle; pursue in parallel while scraping public JCC pages now.

**6. Sister-business leverage — lasvegasmahj.com.** Shauna is a certified instructor with an existing audience. Use it as the proof-of-concept anchor listing and as credibility ("built by an instructor, for players") in every partnership pitch.

---

## Part 4 — City Expansion Strategy

### Which ~25 metros to seed first (and why)
Sequence by **demonstrated mahjong density + NMJL demographic concentration (affluent suburban women, retiree hubs) + your existing geographic reach**. The data shows the long tail is huge (top-10 cities = only ~6% of clubs), so go *deep in a few metros* to demonstrate liquidity, not thin everywhere.

**Wave 1 (anchor metros — highest density / your home turf):**
1. Las Vegas (your sister business — instant warm supply)
2. New York City (dozens of active groups, 37 JCCs)
3. Los Angeles (~20 CA JCCs, active scene)
4. South Florida — Miami/Boca/Palm Beach (retiree + NMJL heartland)
5. Chicago
6. Boston
7. Northern NJ (13 JCCs)
8. San Francisco Bay Area

**Wave 2 (strong secondary):**
9. Philadelphia (Main Line) · 10. Washington DC · 11. Atlanta · 12. Dallas · 13. Houston · 14. Phoenix/Scottsdale (retiree) · 15. Austin · 16. Seattle · 17. Denver

**Wave 3 (retiree & Sun Belt — disproportionate mahjong density):**
18. Naples/Sarasota FL · 19. The Villages FL · 20. San Diego · 21. Minneapolis · 22. Nashville · 23. Charlotte · 24. Portland OR · 25. Tucson/Phoenix retiree belt

### Minimum Viable Liquidity (MVL) per city
A city page must not look dead. Define MVL as **the smallest count that signals "active scene":**
- **MVL = 5 real listings per city**, with **at least 1 recurring open-play or club** and **at least 1 instructor/class**. Below this, the page reads as abandoned; at/above it, a searcher finds a real next action.
- *Stretch target:* 10+ for Wave-1 anchor metros so they're showcase-quality for partnership pitches.
- 25 metros × 5 = 125 minimum, but anchors will overshoot — realistically Wave 1 alone yields several hundred via LibCal + JCC + the Oh My Mahjong deal.

### Repeatable per-city playbook (run identically per metro)
1. **Scrape** all LibCal calendars + JCC + community/senior/parks pages in the metro → seed `event_listings`/`venue_listings`.
2. **Discover** Meetup + Facebook groups in the metro (manual list).
3. **Outreach blast** to discovered organizers/instructors/admins using the Part-2 templates → convert to consented listings via `/list-my-game` & `/get-listed`.
4. **Enrich** scraped library/JCC listings into claimed listings (Part-2 #5 angle).
5. **Verify MVL** (≥5, ≥1 club, ≥1 teacher). If short, hand-add from Sloperama/competitor *leads* (research only) + extra outreach.
6. **Publish + ship local SEO** (you already have JSON-LD, sitemap, OG, per-page metadata — make sure each newly-populated city page re-pings the sitemap).
7. **Seed the flywheel:** every claimed listing = a USER; ask each to refer one more game ("know another group? add it free"). Listings beget users beget listings.

---

## The one thing to do first

If you do nothing else this sprint: **(a) build the LibCal + JCC public-page scraper this week** (green-light legality, ~3,600 libraries + 170 JCCs, instantly fills events nationally), and **(b) open the Oh My Mahjong partnership conversation immediately** (1,000+ instructors in a single deal). Those two moves alone plausibly clear 1,000+ real listings — one mechanical, one relational — without touching Facebook or any ToS-violating scrape. Run Meetup as discovery-to-outreach, not bulk import, to stay clean.

**Speed note:** Bam Good Time already published 1,026 clubs. This is a race to own the structured, SEO-indexed, *claimable* directory layer that none of the incumbents have built. Win on structure and freshness, not on being first to copy a list.

---

**Sources:** [Meetup API license terms](https://help.meetup.com/hc/en-us/articles/360028705532-Meetup-API-license-terms) · [Meetup Pro pricing](https://help.meetup.com/hc/en-us/articles/28677808413197-Organizer-Subscription-prices-overview) · [Eventbrite API Terms of Use](https://www.eventbrite.com/help/en-us/articles/833731/eventbrite-api-terms-of-use/) · [Facebook Groups API deprecation / scraping](https://data365.co/blog/facebook-unofficial-api) · [Facebook Event Graph API ref](https://developers.facebook.com/docs/graph-api/reference/event/) · [LibCal most popular library events software (3,600+ libraries)](https://blog.springshare.com/2024/11/21/libcal-the-most-popular-event-ticketing-and-kit-management-software-for-libraries) · [LibCal API FAQ](https://ask.springshare.com/libcal/faq/1407) · [JCC Association Resource Center (170+ JCCs)](https://jcca.org/what-we-do/jcc-resource-center/) · [JCC mahjong class examples (JCC NJ)](https://www.jccnj.org/artscultureclasses/) · [Oh My Mahjong 1,000+ Mahji Mentors](https://www.prnewswire.com/news-releases/oh-my-mahjong-launches-international-mahjong-card-302607462.html) · [Oh My Mahjong teacher locator](https://ohmymahjong.com/pages/mahjong-teacher-locator) · [Sloperama Maj Exchange](https://www.sloperama.com/majexchange/findplayer.htm) · [Where to Play Mahjong in the USA](https://mahjongplaybook.com/culture/where-to-play-mahjong-usa/) · [Bam Good Time: State of American Mahjong 2026 (1,026 clubs)](https://bamgoodtime.com/blog/state-of-american-mahjong-2026) · [Mahjong tournament cruises/retreats 2026](https://mahjongcompare.com/events) · [Parks & rec registration platforms](https://betaquick.com/blog/ai-parks-recreation-scheduling/)
