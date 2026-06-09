The growth files don't exist in the repo. The brief said I "may" read them for grounding but should reason independently, so I'll proceed from the four analyses, the actual homepage code I read, and first principles. I have everything I need.

Here is the complete strategy document.

---

# FindMyMahj Product Strategy

## The Standing Table: A Product Model for Becoming the Default Way America Plays Mahjong

**Author:** Head of Product
**Status:** Committed direction
**KPI priority:** User growth over monetization

---

## 0. The one question everything answers

A woman wakes up on a Sunday and thinks: **"I want to play mahjong this week."**

Every screen, every notification, every database table, every dollar of effort is judged by one test: does it shorten the distance from that thought to her sitting at a table with three other people and a card in front of her?

Today the honest answer for most of America is: there is no path. She posts in a Facebook group and hopes. She texts the one friend who plays. She Googles "mahjong near me" and lands on a directory that gives her a list, not a seat. The thought dies on the vine more often than it becomes a game.

**We are not building a better list. We are building the shortest path from intent to seat, and then we are keeping the four people who found each other.**

---

## 1. Deliverable 1: Recommended Product Strategy (the model decision and thesis)

### The decision

FindMyMahj is a **community-spined matching product with a directory front door and an event-driven retention engine.** It is a hybrid, and I will not hedge on what that means, because a vague hybrid is how products die. Here is the exact architecture:

| Layer | Model it borrows from | What it contributes | When it turns on |
|---|---|---|---|
| **The spine: the recurring group ("the Table")** | Community + Event | The persistent object users belong to and return to. The retention engine and the moat. | v1 (as a thin object), deepens over time |
| **The front door: SEO directory** | Marketplace | Scalable, free, already-built acquisition. The mouth that feeds the gut. | v1 (we already have it; we reframe it) |
| **The conversion engine: player to Table matching** | Matching (dating, re-skinned) | Legible two-sided intent, mutual consent, the "you're in" moment. Turns a visitor into a member of a real group. | v1 (this is the wedge) |
| **The heartbeat: events, RSVP, reminders** | Event (Meetup, not Eventbrite) | The weekly cadence that turns one game into a habit. | v1 lightweight, v2 full |
| **The trust layer: verification, vouching, reviews** | Marketplace (Airbnb) + Community | Safety for women entering private homes. The second moat. | v1 minimum viable, deepens continuously |

### The thesis, stated plainly

The four analyses agree violently on one point, and it is the foundation of this entire strategy:

> **A directory completes its job and dies. The recurring group is the only thing that retains, and retention is where both growth (referrals) and defensibility (switching cost) actually come from.**

Every analysis arrives here by a different road. The marketplace analysis: "The real product begins after the match." The event analysis: "Move the gravity from the organizer to the self-governing foursome." The matching analysis: "Treat the match as a one-time funnel step whose entire purpose is to graduate people into a durable recurring group." The community analysis: "Community is the retention and defensibility engine, not the acquisition engine."

So the **primary spine is community-as-recurring-group.** Not a forum. Not a feed. Not chat. A *small, named, persistent four-person Table* is the atomic community unit. "Linda's Tuesday Game" is the product. Everything else exists to create Tables and keep them full.

### Why not pick a single pure model

- **Pure directory** (today's product): zero retention, zero defensibility, trivially cloneable. It is a phone book. It succeeds when the user leaves. Rejected as the core, kept as the front door.
- **Pure marketplace**: right about trust and SEO, catastrophically wrong about frequency and the volunteer-supply economics. There is no buyer and no seller. Everyone is a peer who wants the same thing: a fourth chair filled. Rejected as the core, harvested for trust and search.
- **Pure event** (Meetup): the best retention engine available, but it makes all supply depend on a scarce, unpaid, easily-burned-out organizer. If there is no organizer near me, "play this week" fails. Rejected as the center of gravity, adopted as the heartbeat.
- **Pure matching** (Bumble): the strongest single insight (make local time-bound intent legible, gate it with mutual consent), but the unit is wrong (4 not 2), the skin is wrong (this is not dating), and the success model is inverted (dating churns on success; we must capture it). Adopted as the conversion mechanic, the unit redrawn from person↔person to **player↔Table**.
- **Pure community** (Facebook Groups): the right psychology and the only real moat, but the network already exists on Facebook with infinite distribution and zero-friction onboarding. We will lose a head-on cold-start war. We do not compete; we **harvest Facebook's liquidity and win the seam Facebook leaves open**: structured, trusted "find a 4th this week."

### The brutal-honesty constraints that shape the whole design

These are non-negotiable realities. Naive analogies break on them.

1. **The 4-player quorum problem.** A marketplace matches 1 guest to 1 listing. We need *four compatible people simultaneously on a compatible night*. A 3-person table is worth zero until the 4th arrives. We design for **group formation and seat backfill**, never for pairwise matching. Partial liquidity has no value; the product must explicitly manufacture the 4th.

2. **Liquidity is local and small-N.** A thriving scene in Scottsdale does nothing for a player in Cleveland. But a Table needs only 4 people within driving distance, so a single suburb lights up with ~40 committed players. This is a *winnable* cold-start, unlike dating's thousands-per-zip requirement. **Go to market like Uber (one metro to density, then template), never like Airbnb (thin national spread).** An empty search result in a cold city is the single worst first impression in this product.

3. **Supply is unpaid volunteers, not vendors.** No money flows to compensate effort or absorb risk. Therefore onboarding must be radically *lighter* than a marketplace's, and hosts are rewarded in **social currency** (status, gratitude, a reliably-filled table), never cash. Importing Airbnb-grade supply onboarding (calendars, pricing, photoshoots, verification gauntlets) onto volunteers will crush supply. Starting a Table is a 60-second act.

4. **Homes, not hotels.** Trust must be heavier than OpenTable (just RSVP) but the supply cannot bear Airbnb-grade friction. The resolution is the **request-to-book vs. instant-book dial**: public/community-venue games are instant-RSVP; private-home games are host-approval. Match friction to trust stakes, per context.

5. **This is not a dating demographic.** The matching *insight* transfers; the *skin must die completely*. No swiping, no bios, no selfies, no abundance, no flirtation, no romance color or copy. The emotional target is **belonging and relief** ("I found my people, I have a plan"), not romantic novelty.

6. **The spring NMJL card release is an annual demand spike** most products would kill for, a built-in "New Year" when new and returning players flood in. We design the calendar around it.

### The sequence: what is v1 vs. later

**v1 (the wedge): "Find a 4th this week" in one metro.**
The minimum loop that proves the thesis. Reframe the homepage from "list your game" to "Start a Table / find a 4th." Ship: player↔Table matching, mutual-consent join, the lightweight Table object, instant-RSVP for public venues + host-approval for homes, minimum-viable trust (verified email/phone, profile photo optional, public-venue-first default), and the keystone email/SMS notifications. Keep the SEO directory as the front door but rewire its CTA from "see a list" to "find or start a Table." **Win one metro to density before opening a second.**

**v2 (the heartbeat): full recurring-group tooling and the retention engine.**
Standing-Table objects with history and roster, calendar + recurrence + the weekly reminder spine, "find a sub this week," after-game lightweight reviews, host superpowers (roster, reminders, fill-the-seat), seasonal "new card, new games forming" campaign machinery. This is where retention compounds.

**v3 (the moat and the graph): trust depth, the social graph, expansion.**
Verification tiers as status badges, vouching ("vouched by a known member"), the who-plays-with-whom graph powering smarter matching, teacher/instructor layer, traveling-player handoff, and the metro-by-metro expansion playbook templated from the first won market. Monetization (advertisers, venues, teachers, retreats) scales here, never taxing the volunteer-run living-room game.

---

## 2. Deliverable 2: User Journey Maps

For each persona: trigger, steps, the magic moment, what makes them return. The magic moment is always the same shape (a secured seat in a real group) re-skinned per persona.

### A. The New Player

She just took a class, or her daughter showed her TikTok, or the new card came out and she wants in.

- **Trigger:** "I learned the basics. Now I need people to actually play with, and I'm nervous I'm not good enough."
- **Steps:**
  1. Googles "mahjong for beginners near me" or "mahjong games [her city]" and lands on our SEO city page (front door).
  2. Sees not a static list but **"3 beginner-friendly tables forming near you this week."** Enters zip + taps "Beginner."
  3. Sees a Table: "Summerlin Tuesday Mornings, beginner-friendly, public library, 3 of 4 seats filled." Neighborhood + venue *type* shown, not exact address.
  4. Taps "Request the open seat." Captures email here. No full account yet.
  5. Host (or table) approves. **Mutual consent.**
- **Magic moment:** the screen that says **"You're in. Tuesday 10am at Sahara West Library. 3 others confirmed, all beginner-friendly. Linda is your host."** Relief, not romance. The anxiety ("will they be nice? am I good enough? is it safe?") is answered before she walks in: it's a public library, they're all beginners, a real named person welcomed her.
- **What makes her return:** she played, it was warm, the group invited her back next week. The Table object now lives in her account. The reminder lands Sunday: "Your Tuesday game is in 2 days." She is no longer a searcher; she is a member.

### B. The Casual Player

Plays sometimes, no fixed group, fits games in when life allows.

- **Trigger:** "I have a free Thursday and I'd love to play, but my usual people are busy."
- **Steps:**
  1. Opens the app (already has an account from a prior game).
  2. "This week near you" surfaces tables needing a 4th and public open-plays she can drop into.
  3. Filters by "this Thursday, evening, public venue OK."
  4. One tap to claim a seat or RSVP to an open play.
- **Magic moment:** "Seat claimed. Thursday 6:30pm, Maple Street Cafe open play. You're the 4th, the game is on because of you." She is the hero who completed the quorum.
- **What makes her return:** low commitment, no obligation, always something available because we drove the metro to density. The "find a 4th this week" utility is her on-ramp every time the itch strikes.

### C. The Serious Player

Has a regular game, wants stronger competition, plays the current card seriously, maybe for stakes.

- **Trigger:** "My Tuesday group is fine but I want sharper play, current-card-only, people who take it seriously."
- **Steps:**
  1. Searches with serious filters: "current card only, advanced, plays for [stakes], no jokers in [house rule]."
  2. Finds or starts an advanced Table; discovers tournaments and competitive open-plays (event layer).
  3. Builds a reputation via after-game reviews ("would play again," "knows the card cold").
- **Magic moment:** matched into a table where everyone is at her level: "Advanced Tuesday, current card, 3 confirmed, all rated advanced." The relief of *finally* not having to slow down.
- **What makes her return:** the depth of fit (mahjong-native filters Facebook cannot express), her accumulating reputation, tournament discovery, and the social graph that keeps surfacing better-matched players as the network densifies.

### D. The Organizer / Host

Opens her home or runs a community-center game for love of the game and company. Currently the scarce, burnable bottleneck.

- **Trigger:** "Someone dropped out of my Tuesday game and I need a 4th, fast, and I'd rather not text everyone I know."
- **Steps:**
  1. From her standing Table, taps **"Find a 4th this week."**
  2. We surface her open seat to nearby vetted players who match her table's level and rules.
  3. Approves a requester with one tap. Address revealed only after approval.
- **Magic moment:** **"Your seat is filled. Maria (Verified, vouched by 2 members, beginner-friendly) joins Tuesday."** The thing that used to take ten anxious texts is done in one tap, with a vetted stranger she can trust.
- **What makes her return:** we solve her single worst recurring pain (the no-show 4th) better than anything else, and we reward her in status: "Trusted Host," "welcomed 12 newcomers," a reliably-full table. **Critically: she never has to "become an event organizer."** Starting and refilling a table is a 60-second act, not a job. We move the gravity from organizer-as-gatekeeper to self-governing Table, but keep the host as a warm trust anchor.

### E. The Teacher / Instructor

Certified instructor (like Shauna) who teaches new players and wants students to keep playing after class.

- **Trigger:** "I taught a class of 8. In a month, 6 of them will have quit because they have no one to play with."
- **Steps:**
  1. Creates a Teacher profile (credentials, location, class schedule, beginner-friendly tables she runs).
  2. After a class, sends students a single link: "Find your first game here."
  3. Students land in a pre-warmed beginner Table or open-play, often one she seeds.
- **Magic moment:** her students *keep playing*, and she can see it: "5 of your 8 students joined a game this month." Her teaching converts to a living community, which makes her a better teacher and grows her business.
- **What makes her return:** we are her retention engine for students, her lead source for new classes, and her reputation home. Teachers are a force-multiplier on new-player supply, the most important growth input.

### F. The Traveling Player

Has a home game, travels, refuses to go a week without mahjong. (The current homepage already gestures at this with the travel and cruise sections.)

- **Trigger:** "I'm in Phoenix for a week / on a cruise next month, and I want to play while I'm there."
- **Steps:**
  1. Sets destination + dates: "Phoenix, June 12-18."
  2. Sees open-plays and visitor-friendly tables in that metro for those dates.
  3. Instant-RSVPs to public open-plays (low friction, she's a stranger passing through) or requests a visitor-welcome table.
- **Magic moment:** "You have a game in Phoenix. Wednesday 1pm, Desert Ridge community center open play. Bring yourself; sets provided." Mahjong follows her anywhere.
- **What makes her return:** she becomes a node that lights up *other* metros (a referral unit that travels), and every trip reinforces that we are the universal layer for "play mahjong, anywhere, this week." The cruise/travel angle is a delightful, shareable edge that seeds new geographies organically.

---

## 3. Deliverable 3: Recommended Homepage Experience

The current homepage (read in `/Users/shaunabruckman/Projects/findmymahjgame/app/page.tsx`) leads with "Find Your Perfect Mahjong Game Nationwide," a US map, then four "nothing listed yet, get listed" sections (retreats, venues), then advertise. The above-the-fold job is "browse a map." That is the directory mental model. Three of the four visible sections show empty states, which signals a dead product, exactly the failure mode every analysis warned about.

**We redesign the fold around the core job: intent in, seat out. The map becomes secondary. The empty "get listed" graveyards come down.**

### Above-the-fold wireframe (desktop)

```
+----------------------------------------------------------------------+
|  FindMyMahj            This Week   Tables   How It Works   [Sign in]  |
+----------------------------------------------------------------------+
|                                                                      |
|              Play mahjong this week.                                 |
|        Find your table, or start one, in 60 seconds.                 |
|                                                                      |
|   +--------------------------------------------------------------+   |
|   |  Where do you play?   [ Zip or city ........... ]            |   |
|   |  I am a:  ( ) Beginner  ( ) Casual  ( ) Serious             |   |
|   |                                    [  Find my table  > ]      |   |
|   +--------------------------------------------------------------+   |
|                                                                      |
|        12 tables near 89135 have an open seat this week              |
|        (live count for the entered metro; never shown as 0)          |
|                                                                      |
|   +------------------+  +------------------+  +------------------+    |
|   | Summerlin Tues   |  | Henderson Thurs  |  | Downtown Sat AM  |    |
|   | Beginner-friendly|  | Casual, current  |  | Open play, public|    |
|   | Public library   |  | Private home     |  | Community center |    |
|   |  [ 3 of 4 seats ]|  |  [ 2 of 4 seats ]|  |  [ drop-in RSVP ]|    |
|   | Claim open seat >|  | Request seat   > |  | RSVP free      > |    |
|   +------------------+  +------------------+  +------------------+    |
|                                                                      |
|        Don't see your night?   [ Start a table > ]  (60 seconds)     |
|                                                                      |
+----------------------------------------------------------------------+
```

### Above-the-fold wireframe (mobile)

```
+---------------------------+
|  FindMyMahj        [Menu] |
+---------------------------+
|  Play mahjong this week.  |
|  Find or start a table    |
|  in 60 seconds.           |
|                           |
| +-----------------------+ |
| | Zip or city ......... | |
| | ( )Beg ( )Cas ( )Ser  | |
| | [  Find my table  > ] | |
| +-----------------------+ |
|                           |
| 12 tables near you have   |
| an open seat this week    |
|                           |
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
|                           |
| Don't see your night?     |
| [ Start a table > ]       |
+---------------------------+
```

### Design principles enforced above the fold

- **The hero is intent capture, not a map.** One input (zip), one self-classification (level), one button. The map moves below the fold as a secondary "browse the country" affordance, useful for travelers and SEO, never the primary job.
- **The result is always "tables with an open seat this week,"** framed as `3 of 4 seats` (comforting, finite progress) not infinite scroll. This is the matching insight re-skinned: progress toward a full table, scarcity-as-comfort.
- **The instant-vs-request dial is visible per card:** "Claim open seat" (public, instant), "Request seat" (home, approval), "RSVP free" (open play, drop-in).
- **Zero-result is impossible by design above the fold.** If a metro is genuinely thin, the section becomes "Be the first, start a table this week and we'll help you fill it," never a blank shelf or an empty "get listed" card.
- **The four empty "get listed" sections come down.** Advertiser/venue/retreat funnels move to dedicated pages reachable from a "Partners" footer and nav, not the player's hero. Monetization never sits in the path of the core job.

Below the fold, in order: How it works (3 steps, with the safety promise), the US map (browse/SEO/traveler entry), seasonal banner during card season, teacher spotlight, and finally a slim Partners/Advertise strip.

---

## 4. Deliverable 4: Recommended Navigation Structure

Strip it to the core job. The current nav implicitly centers browsing and listing. We center playing.

**Primary nav (logged-out):**

```
This Week   |   Tables   |   How It Works   |   Sign in / Start a Table
```

- **This Week** — the time-bound discovery surface: open seats and open-plays near you, this week. The verb of the product.
- **Tables** — browse standing groups and venues by area; the structured, queryable layer (directory rigor, community warmth).
- **How It Works** — trust, safety, and the 3-step path. Critical for the anxious newcomer.
- **Start a Table** — the supply CTA, always one tap away, doubles as the sign-in entry.

**Primary nav (logged-in):**

```
My Table   |   This Week   |   Find a 4th   |   Messages   |   [Profile]
```

- **My Table** — the home base. The standing group(s) she belongs to, with the next game, the roster, and reminders. This is the retention surface; for a member, the app *opens here*, not on search.
- **Find a 4th** — the recurring utility for organizers and groups with a hole this week.
- **Messages** — gated, mutual-consent-only conversation (no cold contact).

**Footer / secondary (never in the player's main path):** Partners & Advertise, For Teachers, Venues, Retreats & Tournaments, all 50 state pages (SEO), About, Safety, Privacy.

The principle: **a member's app revolves around My Table; a visitor's app revolves around This Week.** Listing, advertising, and browsing-the-country are real but demoted out of the core path.

---

## 5. Deliverable 5: Recommended Onboarding Flow

Account-less first. Capture email early. Under 90 seconds to a meaningful action. No selfie, no bio, no "sell yourself."

```
STEP 0  (no account)  Land on homepage or SEO city page.
        Enter zip + pick level (Beginner / Casual / Serious).
        -> Immediately see real tables with open seats. Value before signup.

STEP 1  (no account)  Tap a table's "Claim seat" / "Request seat" / "RSVP".
        Prompt: "Where should we send your confirmation?"
        Capture EMAIL here (single field). This is the one hard gate, and
        it sits AFTER she has seen value, not before.

STEP 2  (lightweight account, auto-created from email + magic link)
        Three structured questions, no free text, ~30 seconds:
          - Days/times you like to play  (chips: Tue AM, Thu PM, weekends...)
          - Rules/level                  (NMJL current card / beginner-OK / stakes? )
          - Venue comfort                (Public venues / Open to private homes)
        Optional, skippable: first name, photo. Never required to proceed.

STEP 3  Request sent / seat claimed.
        Confirmation screen = the magic moment:
        "You're in / Your request is with Linda. We'll text you the moment
         she approves." 
        Offer (not require) SMS for the weekly reminder.

LATER   Trust upgrades are progressive and OPTIONAL, framed as status:
        verify phone -> "Verified" badge; get vouched -> trust score;
        first game completed -> can host. Never a gate at the front.
```

Design rules:

- **Email is captured at the moment of intent (Step 1), after value is visible, never as a wall on arrival.** This serves the growth KPI: even a user who never completes a game is now a reachable lead for the weekly cadence and the spring spike.
- **No dating-coded onboarding.** Structured preference chips do the matching work, not charisma. It feels like joining a Facebook group, not building a profile.
- **Progressive trust.** Baseline is verified email; phone/ID/vouching are optional badges earned over time, presented as status symbols ("Verified Host"), never a bureaucratic background-check gauntlet up front. That friction is fine for the moat layer; it is poison at the front door.
- **The host's onboarding to *start* a table is the same 60 seconds**, not a separate vendor flow. No calendar, no pricing, no photoshoot.

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
+ My Tables: the standing groups she belongs to (private to her + her tables)
```

Privacy default: **a player's home location and schedule are never publicly broadcast.** This directly corrects a directory habit that is incompatible with the audience's safety reality. Exact location is revealed only to a table after a mutual join.

### Table / Group profile (the spine object)

```
+ Name: "Summerlin Tuesday Mornings"
+ Recurring slot: Tuesdays, 10am  (calendar + recurrence)
+ Type: standing private home | community venue | rotating | open play
+ Level + rules + stakes tags
+ Vibe tags: beginner-friendly · women-only (host option) · current-card-only ·
             vaccinated · no-pets · social vs. competitive
+ Venue: neighborhood + venue TYPE publicly; exact address after join
+ Seats: 4 of 4 / "needs a 4th this week" / "1 standing seat open"
+ Host: name + face + trust badges (the warm trust anchor, not a gatekeeper-job)
+ Members: roster (visible to members)
+ History: weeks played, longevity (a longer-running table reads as trustworthy)
+ Join mode: Instant RSVP (public) | Request to join (home)  <- the trust dial
+ Public, indexable page (SEO) with structured data; conversation gated behind join
```

The Table is the **first-class object** every analysis pointed to. It persists, it has history, it accrues trust, and it is what the member returns to. It is also what makes switching painful (breaking up a friend group's Tuesday ritual), which is the core of our moat.

### Teacher / Instructor profile

```
+ Name, photo, credentials (e.g., certified instructor), metro
+ Class schedule + how to book (their funnel, we don't tax it)
+ Beginner-friendly tables / open-plays they run or seed
+ Trust: verified instructor badge, student reviews
+ "Find your first game" link they hand students after class
+ Impact view (private): "5 of your 8 students joined a game this month"
```

Teachers are a supply multiplier for the hardest input (new players who stick), so we give them a real home and real tooling, framed entirely in social/professional currency, not a cash take-rate.

---

## 7. Deliverable 7: Recommended Matching System

The atomic unit is **player ↔ forming/standing Table**, never person ↔ person. We are forming and refilling foursomes, not pairing strangers.

### The three flows

**1. Join a forming or standing table (the hero, demand side).**
Player filters and sees tables that need a seat. One tap: "Request to join" (home) or "Claim seat" / "RSVP" (public). The dopamine payoff is **"You're in. Tuesday 10am, 3 others confirmed."**

**2. Start a table (supply side, and the wedge for cold markets).**
A host, *or even a single eager player*, declares intent: "I want a Tuesday-morning beginner game near me." This is the critical inversion: **demand seeds supply.** A lone player is not stuck waiting to be picked; she announces a forming table and the system gathers the other three. This is the Bumble "seeker makes the first move" insight, re-skinned, and it is how we manufacture liquidity where none exists.

**3. Find a 4th this week (the retention engine).**
A standing group with a no-show or vacancy surfaces its open seat to nearby vetted players for that week only. This turns matching from a one-time funnel into a recurring utility, and it is the gentlest possible on-ramp for newcomers (a one-week sub is far less scary than committing to a permanent group, for both sides).

### The filters (mahjong-native, the thing Facebook cannot express)

```
Distance / neighborhood   ·   Day + time   ·   Level (beginner/casual/serious)
Rules (NMJL current card / learning)   ·   Stakes (Y/N)   ·   House-rule tags
Venue type (public vs. home)   ·   Vibe (social/competitive, women-only, etc.)
```

### Who initiates and how consent works

- **Demand initiates.** The seeker requests; she is never cold-contacted by strangers.
- **Mutual consent before contact and before exact location.** The host (or table) approves. Only then is the precise address and the messaging channel unlocked. This single gate is simultaneously the #1 conversion mechanic (the "you're in" moment) and the #1 safety feature for this audience.
- **The friction dial matches the stakes:** instant for public venues, request-to-approve for private homes.

### The safety layer (non-negotiable)

- **Mutual opt-in** before any contact or exact address. Pre-approval shows neighborhood + venue *type* only.
- **Public-venue-first default for first meetings.** Libraries, cafes, community centers surfaced first to newcomers; private homes are opt-in and gated behind reputation/verification.
- **Verification tiers as status, not bureaucracy.** Verified email/phone baseline; optional ID/host verification earns a visible badge people *want*.
- **Host controls + reputation.** Hosts approve members and set tags (women-only, beginners welcome, vaccinated, no-pets). Two-way lightweight after-game reviews ("attended? respectful? would play again?") build durable trust data, which is also part of the moat.
- **Group-as-buffer, said out loud in the copy.** Joining a *group of four* is far safer than meeting one stranger; this is a genuine advantage over 1:1 matching, and we make it explicit to reassure.
- **No public broadcast of any woman's home location or weekly schedule.** Ever.

What we explicitly **reject**: swiping, infinite decks, abundance mechanics, bios, selfies, any romantic framing, and optimizing for time-in-the-matching-surface. Time spent matching is friction, not engagement. The win is **graduating the player out of matching into a durable Table.**

---

## 8. Deliverable 8: Recommended Search / Discovery Experience

Three lenses, all anchored on "this week," all degrading gracefully so the shelf is never empty.

### Near-me

Default surface for a logged-out visitor: enter zip, see tables and open-plays ranked by **proximity + this-week availability + level/rules fit**, OpenTable-style time-to-yes. Results are framed as `3 of 4 seats` progress cards, not an undifferentiated list. The US map remains as a secondary, browse-the-country affordance (good for SEO and travelers), never the primary input.

### This-week

The verb of the product. A time-boxed feed: "Tables with an open seat this week" + "Open-plays you can drop into this week." This is what converts "I want to play this week" into a tap. It is also the notification surface (see Deliverable 9).

### Zero-result handling (the most important screen in discovery)

A blank result in a cold market is the worst first impression in this product. **Search must never bottom out at zero.** The graceful-degradation ladder:

```
1. Exact match this week?        -> show tables with open seats.
2. None this week, but standing  -> "These tables are full this week but
   tables exist nearby?              welcome subs, want to be notified when
                                     a seat opens?"  [Notify me]
3. No nearby tables at all?       -> FLIP from "find" to "start":
                                     "Be the first in [area]. Start a table and
                                      we'll help you fill it." [Start a table]
                                     + "There are N players near you who want
                                       to play. Want us to gather them?"
4. Truly empty metro?             -> Capture intent + email:
                                     "We're not live in [area] yet. Tell us when
                                      and how you'd play, and we'll text you the
                                      moment a table forms." (seeds the next market)
```

Step 3 is the marketplace-to-matching pivot the pure marketplace template lacks: the system does not just show what exists, it **manufactures what doesn't yet exist** by converting a frustrated searcher into a table-starter and aggregating latent local demand. Step 4 turns even a total miss into a captured lead and a signal for where to launch next, feeding the city-by-city GTM.

---

## 9. Deliverable 9: Notifications and Engagement Loops

Notifications are the heartbeat. They are the single mechanic that turns a once-a-year directory lookup into a weekly habit. We tie them to two clocks: **the weekly cadence** and **the NMJL season.**

### Channels

Email (baseline, captured at intent) + SMS (opt-in, for time-sensitive game reminders). No always-on chat. Cadence is weekly, not minute-by-minute, matching the audience and the game.

### The weekly cadence loop (the core retention engine)

```
SUN  "Your Tuesday game is in 2 days. 4 of 4 confirmed. See you at Linda's."
       (or) "Linda's Tuesday game needs a 4th this week. Claim the seat?"
TUE  (morning)  "Game day. 10am, Sahara West Library. Tap for the address."
WED  (after)    "How was the game? One tap: would you play again?"  (builds
                trust data + the review moat, frictionlessly)
THU  (if she has no standing table)  "3 tables near you have an open seat
                this week."  (re-activation for casual players)
```

### Match / formation loops

```
- "You're in. Linda approved you for Tuesday." (the payoff push)
- Host: "Maria requested your open seat. Verified, vouched by 2. Approve?"
- Table-forming: "Your beginner table is 3 of 4. One more and you're on for
   Tuesday." (progress-to-quorum nudges; the comforting scarcity)
- "A seat opened in Henderson Thursday, the table you wanted to join."
```

### Seasonal loop (the NMJL card spike, an annual growth gift)

```
PRE-RELEASE  "The new card drops soon. Want to learn it with a group?
              Beginner tables forming now." (capture the returning wave early)
RELEASE WEEK "New card is here. New games are forming across [metro].
              Find your table for the new year of mahjong."
ONGOING      "Switch your table to current-card-only?" / teacher class promos
```

This is the event model's campaign muscle aligned to the calendar most native to this audience. The spring spike is when new and returning players flood in; we design the notification machine to catch them and graduate them into standing Tables before the wave recedes.

### Host / organizer loops

```
- "Your seat is filled for this week." (solving their worst pain)
- Status nudges: "You've welcomed 12 newcomers, you're a Trusted Host."
- "Your table has run 20 weeks straight. Longest-running in [neighborhood]."
```

Guardrails: warm, low-frequency, opt-out-easy. **No aggressive gamification** (points, streaks, competitive leaderboards). Status is warm and reciprocal ("welcomed N newcomers"), never juvenile or manipulative, because that reads as cheap to a 45+, relationship-driven audience.

### The viral / growth loops these enable

- **Every formed table is a 4-person referral unit.** Forming a table naturally pulls in friends ("invite your other two").
- **The host's "find a 4th" broadcasts** can post back into the Facebook groups she already runs (harvest, don't compete): a free "open seats board" tool for admins that rides Facebook's distribution and pulls members onto our structured, trusted layer.
- **Teachers funnel whole classes** in with one link.
- **Travelers light up new metros**, seeding geographies for the GTM.

---

## 10. Deliverable 10: Long-Term Product Vision

**FindMyMahj becomes the default operating system for American mahjong: the layer through which the country plays, week after week.**

The arc, in three horizons:

**Horizon 1 (now-12 months): own "find a 4th this week" in depth, one metro at a time.**
Win the seam Facebook leaves open. Prove that intent-to-seat in 60 seconds, with trust and structure, converts searchers into members of standing Tables. Build the weekly-cadence retention engine. Template the metro playbook (Uber-style) so each new city launches into density, never into an empty shelf. Success metric: number of *standing Tables* and weekly active players, not listings.

**Horizon 2 (1-3 years): own the recurring ritual and the trust graph.**
Every standing game in covered metros runs its week through us: reminders, subs, history, scorekeeping, the works. The two-sided after-game review system has produced a dense **trust/reputation graph** no generic group can match in this niche. The **who-plays-with-whom social graph** powers matching that gets better the more the network plays, a true data network effect. Teachers run their entire student-retention pipeline on us. Switching cost is now social and real: leaving means breaking up your Tuesday ritual and abandoning your reputation.

**Horizon 3 (3+ years): the platform and the institution.**
We are the **densest geographic graph of mahjong players, tables, venues, teachers, and events in the United States**, and the trusted institution for safe, organized play. From this defensible position, adjacent value compounds without ever taxing the living-room game: venue partnerships, retreats and tournaments, teacher tooling and certification, brand/advertiser reach to an engaged audience, sets and merchandise, the seasonal card moment as a tentpole event we own. The younger TikTok-driven wave enters through us as the obvious front door. The moat is the layered triple: SEO acquisition we keep refreshing, the standing-Table social graph that retains, and the trust/reputation data that protects, none of which a directory or a Facebook group can replicate together.

**The north star, restated:** when anyone in America wakes up and thinks "I want to play mahjong this week," the path from that thought to a seat at a warm, trusted table runs through FindMyMahj, and once they have found their four, FindMyMahj is how they keep playing together for years. We do not win by being a better list. We win by being the shortest path to a seat and the home of the group that fills it.

---

### Appendix: the model decision in one line

**Community-spined (the standing Table is the product), with a directory front door (SEO acquisition), a matching conversion engine (legible intent + mutual consent, re-skinned from dating to belonging), and an event-driven heartbeat (weekly cadence + NMJL season retention), wrapped in an Airbnb-grade trust layer sized for women entering private homes. Harvest Facebook's liquidity; do not fight it. Win one metro to density; never market a market you cannot fill. Optimize for the standing foursome, never the one-time match.**

---

Grounding note: the two referenced growth files (`growth/03-product-growth.md`, `growth/04-viral-loops.md`) do not exist in the repo (no `growth/` directory present), so this strategy is reasoned independently from the four model analyses, the four-realities brief, and the live homepage at `/Users/shaunabruckman/Projects/findmymahjgame/app/page.tsx`, which I read and critiqued directly in Deliverable 3.
