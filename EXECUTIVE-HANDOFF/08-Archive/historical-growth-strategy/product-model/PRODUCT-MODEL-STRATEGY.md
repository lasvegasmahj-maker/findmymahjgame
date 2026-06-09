I have everything I need. The task is to revise the draft strategy to directly address the adversarial critique, preserving all ten deliverables, adding a "Hard truths" section, and opening with a one-page executive summary. This is a writing/synthesis task — I'll produce the final document directly.

Here is the complete, final, publishable document.

---

# FindMyMahj Product Strategy

## The Standing Table: A Product Model for Becoming the Default Way America Plays Mahjong

**Author:** Head of Product
**Status:** Committed direction (final)
**KPI priority:** User growth over monetization

---

## Executive Summary (read this page if you read nothing else)

**The model decision, in one sentence:** FindMyMahj is a **community-spined product whose atomic unit is the standing four-person Table** — acquired through an SEO directory front door, converted by a player-to-Table matching mechanic (the legible-intent + mutual-consent insight from dating, with the dating skin removed entirely), and retained by a weekly-cadence event heartbeat — and we win by **concierge-building real, full, repeat-playing tables in one metro before we build most of the software.**

**The golden path for "I want to play mahjong this week":** A woman enters her zip and taps her level → she sees real tables near her with an open seat *this week*, shown as `3 of 4 seats` → she taps "Claim seat" (public venue, instant) or "Request seat" (private home, host-approved) → she gets **"You're in. Tuesday 10am, 3 others confirmed, Linda is your host."** → she plays, the group invites her back, and the Sunday reminder ("your Tuesday game is in 2 days") turns one game into her standing ritual. The whole thing is under 90 seconds from intent to a secured seat, and zero result is impossible by design.

**The three things that must be true for this to work** — stated up front because the rest of this document is honest about them:

1. **We can manufacture the first tables by hand.** The cold-start is not solved by clever UX; it is solved by a founder physically recruiting players in one metro's Facebook groups and classes until 10+ standing tables are playing 3 weeks in a row. If we cannot hand-build that with concierge effort, no architecture saves us, and we should kill or pivot. This is now the v0 before any v1.
2. **The wedge works public-venue-first.** Stranger-matching at launch is **public venues only**. Home games at launch are an **invite-only tool for groups that already know each other**. Strangers-into-homes is deferred until the trust graph is real, not promised as a launch feature. The wedge must — and does — still work under this narrowing.
3. **Formation is a real business even if retention is thin.** We are honest that a happy foursome may leave for a group text. So we optimize for being the best *formation and backfill* engine in the world, treat "find a sub this week" and the seasonal card spike as the genuine recurring hooks, and we only claim the deep-retention moat once the data proves a fully-formed table actually comes back.

If those three are true, we have a category-defining product. If we can't get the first one true in 90 days in one metro, we stop. That kill criterion is written into Section 11.

---

## 0. The one question everything answers

A woman wakes up on a Sunday and thinks: **"I want to play mahjong this week."**

Every screen, every notification, every database table, every dollar of effort is judged by one test: does it shorten the distance from that thought to her sitting at a table with three other people and a card in front of her?

Today the honest answer for most of America is: there is no path. She posts in a Facebook group and hopes. She texts the one friend who plays. She Googles "mahjong near me" and lands on a directory that gives her a list, not a seat. The thought dies on the vine more often than it becomes a game.

**We are not building a better list. We are building the shortest path from intent to seat — and the way we prove that path is real is by walking it ourselves, by hand, in one city, before we scale it.**

---

## 1. Deliverable 1: Recommended Product Strategy (the model decision and thesis)

### The decision

FindMyMahj is a **community-spined matching product with a directory front door and an event-driven retention engine.** It is a hybrid, and a vague hybrid is how products die, so here is the exact architecture — *and, critically, what is in v0/v1 versus deferred*, because the original draft's gravest sin was shipping all five layers at once.

| Layer | Model it borrows from | What it contributes | When it turns on |
|---|---|---|---|
| **The spine: the recurring group ("the Table")** | Community + Event | The persistent object users belong to and return to. The retention engine and the moat. | A *spreadsheet*, not software, in v0. A thin object in v1. Deepens only after retention is proven. |
| **The front door: SEO directory** | Marketplace | Scalable, free, already-built acquisition. The mouth that feeds the gut. | Already live. Reframed in v1. |
| **The conversion engine: player to Table matching** | Matching (dating, re-skinned) | Legible two-sided intent, mutual consent, the "you're in" moment. | **Manual, founder-run, in v0.** Software only in v1, only after manual matching shows repeat usage. |
| **The heartbeat: events, RSVP, reminders** | Event (Meetup, not Eventbrite) | The weekly cadence that turns one game into a habit. | Email/SMS by hand in v0; lightweight automation in v1. |
| **The trust layer: verification, vouching, reviews** | Marketplace (Airbnb) + Community | Safety for women entering private homes. The second moat. | **Public-venue-only at launch.** Home-with-strangers deferred to v2+ until the graph exists. |

### The thesis, stated plainly

The four analyses agree violently on one point, and it is the foundation of this entire strategy:

> **A directory completes its job and dies. The recurring group is the only thing with a chance at retention, and retention is where both growth (referrals) and defensibility (switching cost) could come from.**

I have softened "is where retention comes from" to "could come from" deliberately, because the adversarial review landed a real hit here (see Section 11, Hard Truth #3): a fully-formed happy foursome's natural next move is a group text, not our app. So the honest version of the thesis is two-part:

1. **Formation is unambiguously valuable and unambiguously ours to win.** Getting four compatible strangers into a first game is hard, nobody does it well, and it is the literal golden path. We will be the best formation-and-backfill engine in the country.
2. **Retention is a *hypothesis to be tested*, not a fact to be assumed.** We will earn the right to claim the standing-Table moat only when the data shows formed tables return for the sub-finding, seasonal, and reputation utilities. Until then we plan as if we are a (very good) high-velocity formation engine, and we treat every retention feature as a bet we measure, not a promise we make.

So the **primary spine is community-as-recurring-group** — *as an aspiration earned with data*. The atomic unit is a small, named, persistent four-person Table. "Linda's Tuesday Game" is the product we want to be. Everything else exists to create Tables and keep them full, and we measure relentlessly whether "keep them full" is something users actually return to us for.

### Why not pick a single pure model

- **Pure directory** (today's product): zero retention, trivially cloneable, a phone book. Rejected as the core, kept as the front door.
- **Pure marketplace**: right about trust and SEO, wrong about frequency and volunteer-supply economics. There is no buyer and no seller; everyone is a peer who wants a fourth chair filled. Rejected as core, harvested for trust and search.
- **Pure event** (Meetup): best retention engine available, but all supply depends on a scarce, unpaid, burnable organizer. Rejected as center of gravity, adopted as the heartbeat — *and we explicitly reduce, not increase, our dependence on organizers* (see Hard Truth #5).
- **Pure matching** (Bumble): strongest single insight (make local time-bound intent legible, gate with mutual consent), but the unit is wrong (4 not 2), the skin is wrong (not dating), the success model is inverted (dating churns on success; we must capture it). Adopted as the conversion mechanic; unit redrawn from person↔person to **player↔Table**. Note the inversion the critique correctly flagged: Bumble's seeker chooses among *thousands of existing profiles*. Ours does not. That is exactly why our cold-start is a concierge problem, not a software problem (Hard Truth #1).
- **Pure community** (Facebook Groups): right psychology, the only real moat, but the network already lives on Facebook with infinite distribution. We will lose a head-on cold-start war. We do not compete head-on; we **win the structured, trusted, cross-group "find a 4th this week" seam Facebook leaves open** — while being clear-eyed that "harvest Facebook" is a launch tactic, not a moat (Hard Truth #6).

### The brutal-honesty constraints that shape the whole design

1. **The 4-player quorum problem.** A 3-person table is worth zero until the 4th arrives. We design for **group formation and seat backfill**, never pairwise matching. Partial liquidity has no value; the product must explicitly manufacture the 4th — and at launch, "manufacture" means *a human does it*.

2. **Liquidity is local and small-N — but the threshold is unknown until we measure it.** A Table needs only 4 people within driving distance, so a suburb can light up with a few dozen committed players. The original draft asserted "~40 committed players"; that number was invented and I am striking it. **We will determine the minimum viable density per zip empirically in the launch metro, not assert it.** Go to market like Uber (one metro to density, then template), never like Airbnb (thin national spread).

3. **Supply is unpaid volunteers, not vendors.** Onboarding must be radically lighter than a marketplace's; hosts are rewarded in social currency. *Exception, conceded to the critique (Hard Truth #7):* teachers are the one place we will likely need real money sooner than "v3," because a funded competitor can simply outbid social currency for the scarce instructors who are our most important supply multiplier. A paid teacher program is now an explicit v2 option, not a v3 afterthought.

4. **Homes, not hotels — and at launch, mostly not homes at all.** The request-to-book vs. instant-book dial stands as the long-term design, but the launch posture is narrower and safer than the draft: **stranger-matching is public-venue-only; private homes are an invite-only tool for pre-existing groups.** We match friction to trust stakes, and at zero trust (launch) the home-with-strangers path is simply closed.

5. **This is not a dating demographic.** The matching *insight* transfers; the *skin must die completely*. No swiping, bios, selfies, abundance, flirtation, or romance. The emotional target is **belonging and relief**, not romantic novelty.

6. **The spring NMJL card release is an annual demand spike** — a built-in "New Year." It is also our single most credible *recurring* re-engagement hook for already-formed tables (see Hard Truth #3), so we design the calendar around it deliberately, not decoratively.

### The sequence: v0 (new and load-bearing), then v1, v2, v3

**v0 (the proof, and the most important phase in this entire document): concierge-build the market by hand.**
Before a line of matching code, the founder personally recruits players in ONE metro — in the Facebook groups and classes that already exist — and hand-assembles **10 full standing tables, public-venue-first, that play 3+ consecutive weeks.** Tooling is a spreadsheet, email, and SMS. The deliverable of v0 is not software; it is *proof the golden path is walkable and the minimum density is known.* This directly answers the critique's central charge: we are not writing strategy in place of building tables; the strategy's first instruction is to build the tables. The 90-day kill criterion (Section 11) gates everything after.

**v1 (the wedge, only if v0 succeeds): "Find a 4th this week" in that one metro, public-venue-first.**
The minimum software that productizes what the founder did by hand. Reframe the homepage from "list your game" to "Start a Table / find a 4th." Ship the smallest possible slice: a **single-metro, public-venue open-seats board** with email capture and player↔Table requests, mutual-consent join, a thin Table object, and the keystone email/SMS reminders. Private homes are invite-only-among-knowns. We cut the original v1 by ~80%: no trust tiers, no ID verification, no social graph, no scorekeeping. **Win one metro to density before opening a second.**

**v2 (the heartbeat and the first real retention bets): recurring-group tooling — measured, not assumed.**
Standing-Table objects with history and roster, calendar + recurrence + the weekly reminder spine, **"find a sub this week"** (the one genuinely sticky utility), after-game lightweight reviews, the seasonal "new card, new games forming" machinery, and a **paid teacher program** if a competitor forces it. Every feature here ships behind a retention metric; if formed tables don't return for it, we don't build more of it.

**v3 (the moat and the graph, earned not assumed): trust depth, the social graph, expansion.**
Verification tiers as status badges, vouching, the who-plays-with-whom graph powering smarter matching and *finally* a safe strangers-into-homes flow, teacher/instructor depth, traveling-player handoff, and the metro-by-metro expansion playbook. Monetization scales here, never taxing the volunteer living-room game.

---

## 2. Deliverable 2: User Journey Maps

For each persona: trigger, steps, magic moment, what makes them return. The magic moment is always the same shape (a secured seat in a real group), re-skinned per persona. Note: in v0/v1 the "system" steps below are *performed by the founder by hand*; the journeys are written for the productized state but are deliberately designed to be concierge-deliverable first.

### A. The New Player

- **Trigger:** "I learned the basics. Now I need people to actually play with, and I'm nervous I'm not good enough."
- **Steps:**
  1. Googles "mahjong for beginners near me" → lands on our SEO city page (front door).
  2. Sees **"beginner-friendly tables forming near you this week,"** not a static list. Enters zip + taps "Beginner."
  3. Sees a Table: "Summerlin Tuesday Mornings, beginner-friendly, **public library**, 3 of 4 seats filled." Neighborhood + venue *type*, never exact address.
  4. Taps "Claim the open seat." Email captured here. No full account yet.
  5. Host (or table) approves — **mutual consent** — and because it's a public library, this is instant.
- **Magic moment:** **"You're in. Tuesday 10am at Sahara West Library. 3 others confirmed, all beginner-friendly. Linda is your host."** Relief, not romance. The anxiety ("will they be nice? am I good enough? is it safe?") is answered before she walks in: public venue, all beginners, a named person welcomed her.
- **What makes her return:** she played, it was warm, the group invited her back. The reminder lands Sunday. She is no longer a searcher; she is a member. *(Honest caveat: "return" here may mean the group text, not our app. v2 tests whether the sub-finder and seasonal hooks bring her back to us. We measure it.)*

### B. The Casual Player

- **Trigger:** "I have a free Thursday and I'd love to play, but my usual people are busy."
- **Steps:**
  1. Opens the app (account from a prior game).
  2. "This week near you" surfaces tables needing a 4th and public open-plays.
  3. Filters: "this Thursday, evening, public venue OK."
  4. One tap to claim a seat.
- **Magic moment:** "Seat claimed. Thursday 6:30pm, Maple Street Cafe open play. You're the 4th — the game is on because of you." She is the hero who completed the quorum.
- **What makes her return:** low commitment, always something available *because we drove the metro to density first*. The casual player is the truest test of liquidity — if the board is thin, she is the first to churn, which is why density (v0) precedes everything.

### C. The Serious Player

- **Trigger:** "My Tuesday group is fine but I want sharper play, current-card-only, people who take it seriously."
- **Steps:**
  1. Searches serious filters: current card only, advanced, stakes, house rules.
  2. Finds or starts an advanced Table; discovers tournaments and competitive open-plays.
  3. Builds reputation via after-game reviews.
- **Magic moment:** matched into a table where everyone is at her level — "Advanced Tuesday, current card, 3 confirmed, all rated advanced." The relief of *finally* not having to slow down.
- **What makes her return:** depth of fit (mahjong-native filters Facebook cannot express), accumulating reputation, tournament discovery, and the social graph surfacing better-matched players as the network densifies. *(This persona depends most on the v3 graph; we serve her well only in a dense, mature metro.)*

### D. The Organizer / Host

- **Trigger:** "Someone dropped out of my Tuesday game and I need a 4th, fast, and I'd rather not text everyone I know."
- **Steps:**
  1. From her standing Table, taps **"Find a 4th this week."**
  2. We surface her open seat to nearby vetted players matching her table's level and rules.
  3. She approves a requester with one tap. For a home game, address revealed only after approval — *and at launch, home backfill is offered only to players already known to the group or to the broader network once the trust graph exists.*
- **Magic moment:** **"Your seat is filled. Maria joins Tuesday."** The thing that used to take ten anxious texts, done in one tap.
- **What makes her return:** we solve her single worst recurring pain (the no-show 4th). **Critically: she never has to "become an event organizer."** Refilling a table is a 60-second act, not a job. We move gravity from organizer-as-gatekeeper to self-governing Table — *which is also our deliberate defense against the burnable-organizer dependency the critique flagged (Hard Truth #5).*

### E. The Teacher / Instructor

- **Trigger:** "I taught a class of 8. In a month, 6 will have quit because they have no one to play with."
- **Steps:**
  1. Creates a Teacher profile (credentials, location, class schedule, beginner tables she runs).
  2. After class, sends one link: "Find your first game here."
  3. Students land in a pre-warmed beginner Table or open-play, often one she seeds.
- **Magic moment:** her students *keep playing*, and her teaching converts to a living community.
- **What makes her return:** we are her retention engine for students and her reputation home. **But we are clear-eyed (Hard Truth #8):** some instructors want students *dependent on their own classes*, not graduated to independent free tables, and a funded competitor can simply pay teachers to funnel elsewhere. So the teacher loop is a *validated hypothesis, not an assumption* — we interview 10 instructors in the launch metro before betting growth on them, and we hold a **paid teacher program** in reserve (v2) as the counter to a cash competitor.

### F. The Traveling Player

- **Trigger:** "I'm in Phoenix for a week / on a cruise next month, and I want to play while I'm there."
- **Steps:**
  1. Sets destination + dates: "Phoenix, June 12-18."
  2. Sees open-plays and visitor-friendly tables for those dates — **public venues first**, since she is a stranger passing through (this is also the safest possible matching).
  3. Instant-RSVPs to public open-plays.
- **Magic moment:** "You have a game in Phoenix. Wednesday 1pm, Desert Ridge community center open play. Sets provided."
- **What makes her return:** she is a referral unit that travels and lights up *other* metros. *(Caveat: travelers only have somewhere to land in metros we've already densified; this persona is a v2+ delight, not a launch driver.)*

---

## 3. Deliverable 3: Recommended Homepage Experience

The current homepage (`/Users/shaunabruckman/Projects/findmymahjgame/app/page.tsx`) leads with "Find Your Perfect Mahjong Game Nationwide," a US map, then four "nothing listed yet, get listed" empty sections, then advertise. The above-the-fold job is "browse a map" — the directory mental model — and three of four visible sections show empty states, which signals a dead product.

**We redesign the fold around the core job: intent in, seat out. The map becomes secondary. The empty "get listed" graveyards come down.**

**A critical correction the adversarial review forced:** the draft promised a live count ("12 tables near 89135 have an open seat") that *cannot exist in a cold metro* — so the homepage would either lie or show the dreaded zero. **Resolution: the live count only renders in metros we have actually densified (post-v0).** In any non-launched metro, the same real estate flips to the *start/seed* posture. We never show a fabricated number, and we never show zero. This is enforced below.

### Above-the-fold wireframe (desktop) — densified (launched) metro

```
+----------------------------------------------------------------------+
|  FindMyMahj            This Week   Tables   How It Works   [Sign in]  |
+----------------------------------------------------------------------+
|              Play mahjong this week.                                  |
|        Find your table, or start one, in 60 seconds.                 |
|   +--------------------------------------------------------------+   |
|   |  Where do you play?   [ Zip or city ........... ]            |   |
|   |  I am a:  ( ) Beginner  ( ) Casual  ( ) Serious             |   |
|   |                                    [  Find my table  > ]      |   |
|   +--------------------------------------------------------------+   |
|        12 tables near 89135 have an open seat this week              |
|        (renders ONLY where real density exists; never fabricated)    |
|   +------------------+  +------------------+  +------------------+    |
|   | Summerlin Tues   |  | Henderson Thurs  |  | Downtown Sat AM  |    |
|   | Beginner-friendly|  | Casual, current  |  | Open play, public|    |
|   | Public library   |  | Private (known)  |  | Community center |    |
|   |  [ 3 of 4 seats ]|  |  [ 2 of 4 seats ]|  |  [ drop-in RSVP ]|    |
|   | Claim open seat >|  | Request seat   > |  | RSVP free      > |    |
|   +------------------+  +------------------+  +------------------+    |
|        Don't see your night?   [ Start a table > ]  (60 seconds)     |
+----------------------------------------------------------------------+
```

### Above-the-fold wireframe (desktop) — non-launched / cold metro

```
+----------------------------------------------------------------------+
|              Mahjong is coming to [Cleveland].                        |
|        Be one of the first players — we'll build your table with you.|
|   +--------------------------------------------------------------+   |
|   |  Where do you play?   [ Zip or city ........... ]            |   |
|   |  When would you play?  [ day/time chips ]                    |   |
|   |  I am a:  ( ) Beginner  ( ) Casual  ( ) Serious             |   |
|   |                              [  Start the first table  > ]    |   |
|   +--------------------------------------------------------------+   |
|        37 players near you have asked for a game. (real count of     |
|        captured intent, or hidden if <N.) We're gathering a table.   |
|        We'll text you the moment we have your four.                  |
+----------------------------------------------------------------------+
```

### Mobile (densified metro)

```
+---------------------------+
|  FindMyMahj        [Menu] |
+---------------------------+
|  Play mahjong this week.  |
|  Find or start a table    |
|  in 60 seconds.           |
| +-----------------------+ |
| | Zip or city ......... | |
| | ( )Beg ( )Cas ( )Ser  | |
| | [  Find my table  > ] | |
| +-----------------------+ |
| 12 tables near you have   |
| an open seat this week    |
| +-----------------------+ |
| | Summerlin Tuesday     | |
| | Beginner, public lib  | |
| | [ 3 of 4 seats ]      | |
| | Claim open seat   >   | |
| +-----------------------+ |
| +-----------------------+ |
| | Henderson Thursday    | |
| | [ 2 of 4 seats ]      | |
| | Request seat      >   | |
| +-----------------------+ |
| Don't see your night?     |
| [ Start a table > ]       |
+---------------------------+
```

### Design principles enforced above the fold

- **The hero is intent capture, not a map.** One input (zip), one self-classification (level), one button.
- **The result is always "tables with an open seat this week,"** framed as `3 of 4 seats` (comforting, finite progress), never infinite scroll.
- **The instant-vs-request dial is visible per card.** Public = "Claim seat" (instant). Private/known = "Request seat" (approval). Open play = "RSVP free."
- **Zero-result is impossible AND fabricated-count is impossible.** Densified metros show the real live count; non-launched metros flip the entire hero to the *start/seed/capture-intent* posture with a *real* count of captured demand (or no number if below a threshold). We never invent supply that isn't there.
- **The four empty "get listed" sections come down.** Advertiser/venue/retreat funnels move to a "Partners" footer/nav. Monetization never sits in the path of the core job.

Below the fold, in order: How it works (3 steps + the safety promise), the US map (browse/SEO/traveler entry), seasonal banner during card season, teacher spotlight, slim Partners/Advertise strip.

---

## 4. Deliverable 4: Recommended Navigation Structure

Strip it to the core job. We center playing.

**Primary nav (logged-out):**

```
This Week   |   Tables   |   How It Works   |   Sign in / Start a Table
```

- **This Week** — time-bound discovery: open seats and open-plays near you, this week. The verb of the product.
- **Tables** — browse standing groups and venues by area; structured, queryable (directory rigor, community warmth).
- **How It Works** — trust, safety, the 3-step path. Critical for the anxious newcomer; this is where we tell the public-venue-first safety story plainly.
- **Start a Table** — the supply CTA, always one tap away, doubles as sign-in.

**Primary nav (logged-in):**

```
My Table   |   This Week   |   Find a 4th   |   Messages   |   [Profile]
```

- **My Table** — the home base: standing group(s), next game, roster, reminders. The retention surface; for a member, the app *opens here*. *(This surface earns its prominence only if the retention hypothesis validates; in early metros it may be lean.)*
- **Find a 4th** — the recurring backfill utility, the single stickiest reason a formed table returns to us.
- **Messages** — gated, mutual-consent-only (no cold contact).

**Footer / secondary (never in the player's main path):** Partners & Advertise, For Teachers, Venues, Retreats & Tournaments, all 50 state pages (SEO), About, Safety, Privacy.

Principle: **a member's app revolves around My Table; a visitor's app revolves around This Week.** Listing, advertising, browsing-the-country are real but demoted out of the core path.

---

## 5. Deliverable 5: Recommended Onboarding Flow

Account-less first. Capture email early. Under 90 seconds to a meaningful action. No selfie, no bio, no "sell yourself."

```
STEP 0  (no account)  Land on homepage or SEO city page.
        Enter zip + pick level (Beginner / Casual / Serious).
        -> Densified metro: see real tables with open seats (value before signup).
        -> Cold metro: see the start/seed posture + real captured-demand count.

STEP 1  (no account)  Tap "Claim seat" / "Request seat" / "RSVP" (or "Start the
        first table" in a cold metro).
        Prompt: "Where should we send your confirmation?"
        Capture EMAIL here. The one hard gate, AFTER value is visible.

STEP 2  (lightweight account, auto-created from email + magic link)
        Three structured questions, no free text, ~30 seconds:
          - Days/times you like to play  (chips: Tue AM, Thu PM, weekends...)
          - Rules/level                  (NMJL current card / beginner-OK / stakes?)
          - Venue comfort                (Public venues / Open to private homes)
        Optional, skippable: first name, photo. Never required to proceed.

STEP 3  Request sent / seat claimed.
        Confirmation = the magic moment:
        "You're in / Your request is with Linda. We'll text you the moment
         she approves."
        Offer (not require) SMS for the weekly reminder.

LATER   Trust upgrades are progressive and OPTIONAL, framed as status:
        verify phone -> "Verified"; get vouched -> trust score;
        first game completed -> can host. Never a gate at the front.
```

Design rules:

- **Email captured at the moment of intent (Step 1), after value is visible.** *Correction the critique forced:* an email-captured lead who never plays is **not** a growth win and we will not count it as one (Section 11). It is a *re-engagement asset* for the weekly cadence and the spring spike — useful, but it is not the KPI. The KPI is filled tables that play 2+ weeks.
- **No dating-coded onboarding.** Structured preference chips do the matching, not charisma. It feels like joining a Facebook group.
- **Progressive trust.** Baseline is verified email; phone/ID/vouching are optional badges earned over time. That friction is fine for the v3 moat layer; it is poison at the front door.
- **The host's onboarding to *start* a table is the same 60 seconds.** No calendar, no pricing, no photoshoot — and in v0/v1, "starting a table" in a cold metro routes to the founder's concierge queue, not a dead object.

---

## 6. Deliverable 6: Recommended Profile Structure

Three profile types. All lightweight, preference-driven, safety-aware. None are marketing bios.

### Player profile

```
+ First name (last name private; shown to a table only after mutual join)
+ Photo (optional, encouraged for warmth, never required)
+ Neighborhood / metro (NOT exact address, ever, publicly)
+ Level: Beginner / Casual / Serious  (self-set, refined by reviews)
+ Rules: NMJL current card | learning | plays for stakes (Y/N) | house-rule tags
+ Availability: day/time chips
+ Venue comfort: public only | open to homes
+ Trust signals (earned, shown as badges):
    Verified (email/phone) · ID-verified · Vouched-by (N members) ·
    Games played · "Would play again" rating · Welcomed N newcomers
+ My Tables: standing groups she belongs to (private to her + her tables)
```

Privacy default: **a player's home location and weekly schedule are never publicly broadcast.** Exact location is revealed to a table only after a mutual join. This corrects a directory habit incompatible with the audience's safety reality.

### Table / Group profile (the spine object)

```
+ Name: "Summerlin Tuesday Mornings"
+ Recurring slot: Tuesdays, 10am  (calendar + recurrence)
+ Type: standing private home | community venue | rotating | open play
+ Level + rules + stakes tags
+ Vibe tags: beginner-friendly · current-card-only · social vs. competitive
             (sensitive tags handled per Hard Truth #2 — see below)
+ Venue: neighborhood + venue TYPE publicly; exact address after join
+ Seats: 4 of 4 / "needs a 4th this week" / "1 standing seat open"
+ Host: name + face + trust badges (warm trust anchor, not a gatekeeper-job)
+ Members: roster (visible to members)
+ History: weeks played, longevity (a longer-running table reads as trustworthy)
+ Join mode: Instant RSVP (public) | Request to join (home, known-only at launch)
+ Public, indexable page (SEO) with structured data; conversation gated behind join
```

**On sensitive vibe tags (conceded to the critique):** "women-only" and "vaccinated" are not casual chips — they are liability and moderation surfaces. Decision: **"women-only" is supported** (it materially serves this audience's safety and comfort and is the kind of self-selection these groups already practice) **but is enforced socially by the host, never as a verified system attribute, and is presented as a host preference, not a platform guarantee.** **Health-status tags (e.g., vaccinated) are cut from launch** — they are a moderation and liability swamp with little upside; hosts can communicate such preferences in the gated post-join channel if they wish. We do not turn the platform into the arbiter of either.

The Table is the **first-class object** every analysis pointed to — *once we've earned it with retention data.* In v0 it is a spreadsheet row; in v1 a thin object; it deepens only as the moat hypothesis validates.

### Teacher / Instructor profile

```
+ Name, photo, credentials (e.g., certified instructor), metro
+ Class schedule + how to book (their funnel, we don't tax it... unless we
  choose to pay them; see paid teacher program, v2)
+ Beginner-friendly tables / open-plays they run or seed
+ Trust: verified instructor badge, student reviews
+ "Find your first game" link they hand students after class
+ Impact view (private): "5 of your 8 students joined a game this month"
  (NOTE: this metric only renders if students actually play through us —
   it measures the retention we are testing, so we treat it as a learning
   instrument first and a teacher-acquisition pitch second)
```

---

## 7. Deliverable 7: Recommended Matching System

The atomic unit is **player ↔ forming/standing Table**, never person ↔ person. **At launch, all stranger-matching is public-venue-only.**

### The three flows

**1. Join a forming or standing table (the hero, demand side).**
Player filters and sees tables that need a seat. One tap: "Claim seat" / "RSVP" (public, instant) or "Request to join" (home — *known-members-only at launch*). Payoff: **"You're in. Tuesday 10am, 3 others confirmed."**

**2. Start a table (supply side, and the wedge for cold markets) — with the mechanism the draft was missing.**
A host, *or a single eager player*, declares intent: "I want a Tuesday-morning beginner game near me." The draft called this "how we manufacture liquidity" and the critique correctly shredded that: relabeling absence is not creating liquidity; the seeker still needs three real humans nearby. **The honest mechanism, stated plainly:**
   - In **v0/v1**, a "started" forming table routes into the **founder's concierge recruiting queue.** A human aggregates the captured local demand, works the Facebook groups and class rosters, and hand-assembles the four. This is a *service*, and we are not ashamed of it — every liquidity business (Uber, DoorDash, Airbnb) was hand-cranked at the start.
   - The **target conversion rate** from "forming table started" to "table actually played a game" is **≥50%** in the launch metro. Below that, the wedge does not work and we revisit (Section 11).
   - Software *augments* this only after the manual version clears the bar; it never replaces the human until the data says it can.

**3. Find a 4th this week (the retention engine — and our single best retention bet).**
A standing group with a vacancy surfaces its open seat to nearby vetted players for that week only. This is the gentlest on-ramp for newcomers (a one-week sub is far less scary than a permanent commitment) and, per the critique, **the one genuinely sticky reason a formed foursome opens our app.** We invest in making it dramatically better than a group text: it reaches *beyond* the group's own contacts, it's vetted, it's one tap. If this utility doesn't pull formed tables back, our retention thesis is weaker than hoped and we plan as a formation engine (Hard Truth #3).

### The filters (mahjong-native, the thing Facebook cannot express)

```
Distance / neighborhood   ·   Day + time   ·   Level (beginner/casual/serious)
Rules (NMJL current card / learning)   ·   Stakes (Y/N)   ·   House-rule tags
Venue type (public vs. home)   ·   Vibe (social/competitive, women-only host pref)
```

### Who initiates and how consent works

- **Demand initiates.** The seeker requests; she is never cold-contacted by strangers.
- **Mutual consent before contact and before exact location.** Approval unlocks the precise address and the messaging channel. This single gate is both the #1 conversion mechanic (the "you're in" moment) and the #1 safety feature.
- **Friction matches stakes:** instant for public venues, request-to-approve for homes — and at launch, **home + stranger is simply unavailable**; home is for known groups only.

### The safety layer (reframed to the *real* threat model)

The critique landed a crucial correction: the demographic's real objection is **social, not safety-feature-shaped.** A woman is not primarily afraid of a verified stranger; she is reluctant to invite *anyone she lacks a warm referral for* into her home. Badges do not substitute for "Carol vouches for her" — and the vouching graph doesn't exist at launch. Therefore:

- **Launch posture: stranger-matching is public-venue-only, full stop.** Libraries, cafes, community centers. This is not a limitation we apologize for; it is the correct, safe, *liquid-enough* wedge.
- **Home games at launch are an invite-only tool for groups that already know each other** — i.e., we help an existing Tuesday group manage and backfill *among people they already trust*, not import strangers.
- **Strangers-into-homes turns on only in v3,** gated behind a *real* vouching/social graph, because that referral — "vouched by 2 members you know" — is the only thing that actually answers the social objection. We do not promise it at launch; we earn it.
- **Group-as-buffer, said out loud.** Joining a *group of four* is safer than meeting one stranger; we make this explicit, and combined with public-venue-first it is a genuine advantage over 1:1 matching.
- **No public broadcast of any woman's home location or weekly schedule. Ever.**
- **Sensitive tags handled per Section 6:** women-only as a host-enforced social preference; health-status tags cut at launch.

What we explicitly **reject:** swiping, infinite decks, abundance mechanics, bios, selfies, romantic framing, and optimizing for time-in-matching-surface. Time spent matching is friction, not engagement. The win is **graduating the player out of matching into a real game** — and, where the data supports it, into a durable Table.

---

## 8. Deliverable 8: Recommended Search / Discovery Experience

Three lenses, all anchored on "this week," all degrading gracefully so the shelf is never empty — *and never fabricated.*

### Near-me

Default for a logged-out visitor: enter zip, see tables and open-plays ranked by **proximity + this-week availability + level/rules fit**, OpenTable-style time-to-yes, framed as `3 of 4 seats` progress cards. The US map remains a secondary browse-the-country affordance for SEO and travelers.

### This-week

The verb of the product. A time-boxed feed: "Tables with an open seat this week" + "Open-plays you can drop into this week." Also the notification surface (Deliverable 9).

### Zero-result handling (the most important screen in discovery) — corrected

The draft's degradation ladder ended in promises with no mechanism. Here it is rebuilt so every rung has a *real* action behind it, and so we never show a fabricated count:

```
1. Densified metro, exact match this week?  -> show tables with open seats.
2. Densified, none open this week but tables -> "These tables are full this
   exist nearby?                                week but welcome subs. Notify
                                                me when a seat opens." [Notify]
3. Densified but thin for this slot?         -> FLIP to start/seed:
                                                "Be the first for [Tue AM] in
                                                [area]. Start a table — a real
                                                person on our team will help you
                                                gather your four." [Start]
                                                (routes to concierge queue in v0/v1)
4. Non-launched / cold metro?                -> capture intent, show REAL demand:
                                                "We're not live in [area] yet.
                                                Tell us when/how you'd play.
                                                N players near you have already
                                                asked." (number hidden if < threshold;
                                                never invented) Seeds the next market.
```

Rung 3 is the marketplace-to-matching pivot the pure marketplace template lacks — but now it names the mechanism the critique demanded: **a real person helps fill it** until software can. Rung 4 turns a total miss into a captured lead and a *data signal for where to launch next*, feeding the metro-by-metro GTM — and it shows a true count or no count, never a lie.

---

## 9. Deliverable 9: Notifications and Engagement Loops

Notifications are the heartbeat — the mechanic that turns a once-a-year directory lookup into a weekly habit. Two clocks: **the weekly cadence** and **the NMJL season.** In v0/v1 these are sent by hand; the content below is the target automation.

### Channels

Email (baseline, captured at intent) + SMS (opt-in, for time-sensitive reminders). No always-on chat. Weekly cadence, not minute-by-minute.

### The weekly cadence loop (the core retention bet)

```
SUN  "Your Tuesday game is in 2 days. 4 of 4 confirmed. See you at Linda's."
       (or) "Linda's Tuesday game needs a 4th this week. Claim the seat?"
TUE  (morning)  "Game day. 10am, Sahara West Library. Tap for the address."
WED  (after)    "How was the game? One tap: would you play again?" (trust data,
                frictionless)
THU  (if no standing table)  "3 tables near you have an open seat this week."
                (re-activation)
```

*Honest framing:* a group text does Sunday reminders and subs too. We do not pretend to beat a group text at reminding *people who already have each other's numbers*. We win where the group text can't reach: **finding a sub beyond the group's own contacts, the seasonal re-formation moment, and cross-group reputation.** Those are the loops we over-invest in; the rest are table stakes.

### Match / formation loops

```
- "You're in. Linda approved you for Tuesday." (the payoff push)
- Host: "Maria requested your open seat. Approve?"
- Table-forming: "Your beginner table is 3 of 4. One more and you're on."
   (progress-to-quorum; comforting scarcity)
- "A seat opened in Henderson Thursday — the table you wanted."
```

### Seasonal loop (the NMJL card spike — our most credible recurring re-engagement)

```
PRE-RELEASE  "The new card drops soon. Want to learn it with a group?
              Beginner tables forming now."
RELEASE WEEK "New card is here. New games are forming across [metro].
              Find your table for the new year of mahjong."
ONGOING      "Switch your table to current-card-only?" / teacher class promos
```

This is the one moment every year when *even fully-formed, happy foursomes* have a real reason to re-engage with the network (new card, new energy, sometimes new players, re-evaluating their game). We treat the spring spike as a tentpole and design the machine to catch the returning wave and graduate it into tables before it recedes.

### Host / organizer loops

```
- "Your seat is filled for this week." (their worst pain, solved)
- Status nudges: "You've welcomed 12 newcomers — you're a Trusted Host."
- "Your table has run 20 weeks straight — longest-running in [neighborhood]."
```

Guardrails: warm, low-frequency, opt-out-easy. **No aggressive gamification** (points, streaks, leaderboards). Status is warm and reciprocal, never juvenile — that reads as cheap to a 45+, relationship-driven audience.

### The viral / growth loops these enable — and their honest limits

- **Every formed table is a 4-person referral unit** ("invite your other two"). Strong.
- **The host's "find a 4th" can post back into the Facebook groups she runs** — a free "open seats board" for admins. *Conceded limit (Hard Truth #6):* this rides Facebook's distribution but also reinforces Facebook as home and depends on the very admins/organizers we call scarce. We use it as a *launch acquisition tactic*, explicitly time-boxed, and we do not mistake it for a moat. The moat is the cross-group, cross-city trust + mahjong-native structure, not the FB tool.
- **Teachers funnel whole classes with one link** — *if* they will (validated, not assumed; Hard Truth #8).
- **Travelers light up new metros** — *only* metros we've already densified.

---

## 10. Deliverable 10: Long-Term Product Vision

**FindMyMahj becomes the default operating system for American mahjong: the layer through which the country plays, week after week.** Stated as ambition, pursued as a sequence of *proven* steps — not assumed.

**Horizon 0 (months 0–3): prove the golden path by hand in one metro.**
Concierge-build 10 full standing tables, public-venue-first, playing 3+ weeks. Determine minimum viable density empirically. This horizon exists because the destination is worthless without a walked path to it.

**Horizon 1 (months 3–12): own "find a 4th this week" in depth, one metro at a time.**
Productize the manual loop. Win the seam Facebook leaves open. Prove intent-to-seat in under 90 seconds converts searchers into *players*, and measure honestly whether they become returning members. Template the metro playbook (Uber-style) so each new city launches into density, never an empty shelf. Success metric: **standing tables playing 2+ consecutive weeks** and weekly active players — not listings, not email leads.

**Horizon 2 (1–3 years): test and, if validated, own the recurring ritual and the trust graph.**
Reminders, subs, history, the sub-finder, the seasonal tentpole, a paid teacher program if competition forces it. Build the two-sided after-game review system into a dense **trust/reputation graph** no generic group can match in this niche, and the **who-plays-with-whom social graph** that makes matching better the more the network plays (a real data network effect) — *and only here does it become safe to open strangers-into-homes.* Every retention feature ships behind a metric; we double down only on what formed tables actually return for.

**Horizon 3 (3+ years): the platform and the institution.**
The densest geographic graph of mahjong players, tables, venues, teachers, and events in the US, and the trusted institution for safe, organized play. Adjacent value compounds without taxing the living-room game: venue partnerships, retreats and tournaments, teacher tooling and certification, brand/advertiser reach, sets and merchandise, the seasonal card moment as a tentpole we own. The younger TikTok-driven wave enters through us as the obvious front door. The moat is the layered triple — SEO acquisition we keep refreshing, the standing-Table social graph that retains, the trust/reputation data that protects — *none of which we claim until the data earns it, and the deepest of which (cross-city trust graph) is also our only durable answer to Facebook.*

**The north star, restated honestly:** when anyone in America wakes up and thinks "I want to play mahjong this week," the path from that thought to a seat at a warm, trusted table runs through FindMyMahj. We win first by being the best *formation* engine in the country — the shortest path to a seat — and we earn the deeper community moat only by proving, table by table and metro by metro, that the four people we bring together actually keep playing through us.

---

## 11. Hard truths and how we handle them

The strongest objections to this strategy, answered without flinching. Where the critique lands, we narrow the recommendation rather than defend it.

### Hard truth #1 — Cold-start is a concierge problem, not a UX problem; the first tables must be hand-built.
**The objection:** the "~40 players" and "we'll help you fill it" claims were invented and mechanism-free; the homepage's live count can't exist in a cold metro.
**How we handle it:** v0 is now explicitly *concierge-build 10 full tables by hand before writing matching code.* Minimum density is measured, not asserted (the "~40" is struck). The homepage live count renders **only** in densified metros; cold metros flip to a start/seed posture showing *real* captured demand or no number at all. The single most important instruction in this document is to build tables by hand first.

### Hard truth #2 — "Demand seeds supply" does not create the other three people; at launch, a human does.
**The objection:** a lone seeker declaring a forming table is shouting into an empty room; the inversion changes who clicks first, not whether three other humans exist.
**How we handle it:** "Start a table" routes to a **founder concierge recruiting queue** in v0/v1 — a service, not a magic feature. Target: **≥50% of forming tables actually play a game** in the launch metro. Software augments the human only after that bar is cleared. We name this honestly rather than hiding it behind "manufacture liquidity."

### Hard truth #3 — A happy foursome may leave for a group text; we may be a formation business, not a retention moat.
**The objection:** four players who form a game get each other's numbers and never open the app again; "find a sub" fires rarely.
**How we handle it:** we demote retention from *asserted fact* to *measured hypothesis.* We plan as the best **formation-and-backfill** engine in the country (unambiguously valuable, unambiguously ours), and we over-invest in the three loops a group text *can't* replicate: cross-contact **sub-finding**, the annual **NMJL re-formation spike**, and **cross-group reputation.** If formed tables don't return for those, we accept we're a high-velocity formation/acquisition business and run it as one — a good business — rather than pretend a moat exists.

### Hard truth #4 — Safety's real threat model is social (lack of a warm referral), not feature-shaped; so homes-with-strangers is deferred.
**The objection:** badges don't substitute for "Carol vouches for her"; the vouching graph doesn't exist when you need it; the highest-value home supply is exactly what nobody will use with strangers at launch.
**How we handle it:** **stranger-matching is public-venue-only at launch.** Home games are an **invite-only tool for groups that already know each other.** Strangers-into-homes turns on only in v3, gated behind a *real* vouching/social graph — the only thing that answers the social objection. The wedge is explicitly designed to work under this narrowing. Sensitive tags: "women-only" supported as a host-enforced social preference; health-status tags cut at launch to avoid a liability/moderation swamp.

### Hard truth #5 — We claim to remove the burnable organizer, yet lean on FB admins; we resolve this by making refilling a 60-second act, not a job.
**The objection:** the FB "open seats board" depends on the scarce organizers we say we're freeing.
**How we handle it:** the *self-governing Table* (any member can backfill in 60 seconds, address-gated, one tap) structurally reduces organizer dependence — that is the point of the design. The FB admin tool is a **time-boxed launch acquisition tactic**, not the engine, and not the moat. We do not build the long-term product on the shoulders of a bottleneck.

### Hard truth #6 — "Harvest Facebook" strengthens the incumbent; our only durable defense is the cross-city trust + mahjong-native graph.
**The objection:** FB can ship "find players near you" in Groups in a quarter and evaporate the seam.
**How we handle it:** "harvest Facebook" is reclassified as a **launch tactic, explicitly not a moat.** Our stated, durable defense if FB ships a players feature: the **cross-group, cross-city trust/reputation graph** and **mahjong-native structure** (current-card, stakes, house-rule, level filters; vetted subs; reputation that travels between cities and groups) that a generic Groups feature will not replicate. That graph is the moat thesis; everything else is acquisition.

### Hard truth #7 — A funded competitor (e.g., Bam Good Time) can buy the supply we refuse to pay for.
**The objection:** cash beats "social currency" with teachers and hosts instantly; refusing to pay supply is principled until you're outbid.
**How we handle it:** we keep social currency as the default (it's cheaper and more authentic to this audience), **but we pull a paid teacher program forward from v3 to a standby v2 lever**, deployable the moment a competitor pays instructors to funnel elsewhere. Our non-price counters: deeper student-retention tooling teachers can't easily replicate, the reputation home, and a free network effect that benefits *their* students. We do not pretend "nicer and free" is, by itself, a counter to cash.

### Hard truth #8 — The teacher loop has a built-in incentive conflict and a self-referential metric.
**The objection:** some instructors want students captive, not graduated; and the impact dashboard only works if students already retain — measuring the thing we're assuming.
**How we handle it:** teachers move from *assumed force-multiplier* to *validated hypothesis* — **interview 10 launch-metro instructors before betting growth on them.** The impact dashboard is treated as a **learning instrument first** (does retention even happen?) and a teacher pitch second. If instructors prefer captivity, we lead with the value we *can* deliver them (a reputation home, leads, the paid program) rather than a graduation story they don't want.

### Hard truth #9 — No KPI threshold = a belief, not a strategy. So here is the kill criterion.
**The objection:** "user growth" plus counting never-played email leads is vanity; there's no defined success/kill line.
**How we handle it — the explicit 90-day kill criterion, committed now:**

> **If we cannot get 10 standing tables playing 3+ consecutive weeks in ONE launch metro within 90 days of concentrated concierge effort, we kill or pivot.**

Supporting bars: **≥50% of started/forming tables actually play a game**; the **minimum viable density per zip is measured and documented** (replacing the invented "~40"); the **primary KPI is filled tables that play 2+ consecutive weeks**, with weekly active players secondary. **Email-captured leads who never play are explicitly *not* counted as growth** — they are re-engagement assets only. A strategy with a kill metric is a strategy; without one it is a hope, and we will not run on hope.

---

### Appendix: the model decision in one line

**Community-spined (the standing Table is the product *we earn the right to call the product*), with a directory front door (SEO acquisition), a matching conversion engine (legible intent + mutual consent, re-skinned from dating to belonging), and an event-driven heartbeat (weekly cadence + NMJL season), wrapped in a trust layer that is public-venue-only at launch and opens homes-to-strangers only once a real vouching graph exists. Concierge-build the first 10 tables by hand in one metro before building the software; manufacture the missing 4th with a human until the data lets a machine do it; defend against Facebook with a cross-city trust + mahjong-native graph, not by harvesting their liquidity; and kill the project if 10 tables can't play 3 weeks running in 90 days. Optimize first for being the best formation engine in the country; earn the retention moat with data, table by table.**
