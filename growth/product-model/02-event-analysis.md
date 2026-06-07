This is a strategic analysis task, not a coding task — no files need to be read or written. Here is my opinionated, first-principles teardown.

---

# THE EVENT MODEL (Meetup / Eventbrite) as a Template for FindMyMahj

## Verdict up front
The event model is the **right backbone but the wrong front door**. Recurring weekly games are *literally* events, so the data model fits like a glove. But Meetup/Eventbrite optimize for the *organizer's* job (publish, manage, sell tickets), not the *player's* job ("I want to play this week"). If you adopt the model wholesale, you inherit its fatal flaw: **the entire supply side waits on a scarce, unpaid, easily-burned-out organizer.** Steal the calendar and RSVP; reject the pay-to-organize gatekeeping.

---

## The 7 Lenses

### 1. User psychology
- **Eventbrite psychology = transactional/episodic.** "Buy a ticket to a thing happening once." This is the *wrong* mental model for mahjong, which is habitual, not event-shopping. Eventbrite's emotional register (FOMO, scarcity, one-time spend) doesn't match "my Tuesday game."
- **Meetup psychology = belonging + recurrence.** Much closer. Meetup taps "I want to be a regular somewhere." That maps perfectly onto NMJL's weekly cadence and the 45+ female desire for a reliable social ritual.
- The danger: events center the **calendar object**, not the **relationship**. Mahjong players don't fall in love with an event; they fall in love with *their three other people* and *their table*. An event-first UI risks making the product feel like a logistics tool, not a social home.
- Psychology score: **Meetup strong, Eventbrite weak.**

### 2. Network effects
- Event models have **local, supply-gated** network effects. More organizers → more events → more attendees → (sometimes) more organizers. This is real but **weak and lumpy**: it's a marketplace where supply (organizers) is the choke point, not demand.
- Crucially, the network effect is **organizer-centric, not peer-centric.** Value accrues to/through the host. If a host leaves, their whole group can evaporate (Meetup's classic failure mode). For mahjong, where the asset is a *self-sustaining foursome*, this is backwards — you want the network effect to live in the **group**, not the organizer.
- Density matters enormously: 4 players must be physically near each other. Event network effects are hyper-local, so you win city-by-city, never nationally at once. (Same constraint Meetup hit.)
- Score: **moderate, but fragile and geographically fragmented.**

### 3. Growth potential
- Event platforms grow through **SEO of event pages** + organizer-driven invites. FindMyMahj already has the SEO skeleton (50 state pages). Recurring public games = a firehose of long-tail indexable pages ("Tuesday mahjong Scottsdale").
- BUT growth is **rate-limited by organizer creation.** No organizer, no event, no page, no growth. You can't out-market a supply shortage.
- The spring NMJL card spike is a growth gift the event model *can* capture (seasonal "new card, new games forming" events), but only if forming a game is frictionless — which the organizer model makes it NOT.
- Score: **good ceiling via SEO, throttled by the organizer bottleneck.**

### 4. Retention potential
- This is the event model's **best lens**. Recurring events = built-in re-engagement. A weekly RSVP, a Tuesday reminder, "your game is in 2 days" — these are exactly the notification hooks that build habit. Calendar + recurrence is a retention machine.
- Meetup proves recurring groups retain far better than one-off events (Eventbrite).
- Caveat: retention is **bimodal** — organizers retain (they're invested), attendees churn if the game isn't *theirs*. The fix is converting attendees into co-owners of a persistent group.
- Score: **highest of all lenses — this is the thing worth stealing.**

### 5. Ease of onboarding
- For *attendees*: easy. RSVP is the lowest-friction commitment in consumer software.
- For *organizers*: **brutal.** Creating a recurring event, setting a venue, managing a roster, being "the responsible one" — this is a high-effort, high-anxiety job. Meetup/Eventbrite even *charge* for it. For a 62-year-old who just wants a fourth, "become an event organizer" is a wall, not a door.
- The model onboards demand well and supply terribly. Since supply is the constraint, **net onboarding is poor.**
- Score: **good for players, bad for hosts — and hosts are what you're short on.**

### 6. Ease of finding a game
- Event discovery = browse a list/map of upcoming events, filter by date/location. Decent for "what's happening near me."
- Weaknesses that bite mahjong hard:
  - **Skill/card-year matching is invisible.** Events don't natively express "beginner-friendly," "plays for money," "Siamese," "current card only." Mahjong players desperately need this filter.
  - **"Is there room for me?" is unclear.** Events show capacity, but the visceral mahjong question is "do they need a *4th specifically*?" — the event model doesn't surface seat-level scarcity well.
  - **Empty-map problem.** In low-density areas (most of the US), the event list is blank, which reads as "this product is dead." A directory-of-people degrades more gracefully than an empty event calendar.
- Score: **adequate browse, poor for mahjong-specific fit and for low-density graceful failure.**

### 7. Long-term defensibility
- Event mechanics are **commodity** — Meetup, Eventbrite, Facebook Events, Luma, Partiful all do RSVP+calendar. Copying the mechanic gives you zero moat.
- Real defensibility for FindMyMahj comes from things the event model *doesn't* give you: (a) the **densest geographic graph of actual mahjong players/seats**, (b) **trust & safety / verification** for home games, (c) **NMJL-native data** (card year, ratings, house rules), (d) **the persistent group object** that locks foursomes in. The event layer is table stakes; the defensible asset is the player/seat graph plus trust.
- Score: **low if you stop at events; the moat is adjacent, not in the event model itself.**

---

## The Core Transferable MECHANIC
Strip the event model to its irreducible, transferable parts:

1. **Recurring group as a first-class object** (not the one-off event) — the "Tuesday Game at Linda's" that persists week over week. THIS is the gold.
2. **RSVP / seat-claim** as the lightest-possible commitment primitive — but reframed as **"Claim the 4th seat"**, not "attend an event."
3. **Calendar + recurrence + reminders** — the retention engine. Weekly cadence, push/email nudges, "2 days until your game."
4. **The host relationship** — useful as a *trust anchor* (someone vouches for the table), but dangerous as a *required gatekeeper*.

The insight that transfers: **persistent recurring groups + frictionless seat-claiming + calendar-driven reminders.** The skin that must not transfer: **event-shopping, ticketing, and organizer-as-paid-gatekeeper.**

---

## Fit for "play mahjong this week"
- **Where it maps naturally:** weekly recurring games ARE recurring events. The calendar, the RSVP, the reminder cadence — these are exactly what turns "I want to play this week" into "I'm sitting down Tuesday." Retention and habit formation are near-perfect fits.
- **Organizer-dependency bottleneck (the killer):** the event model makes a single person responsible for creating and running supply. Your supply is therefore capped at the number of willing unpaid organizers — a tiny fraction of players. "Play this week" fails the moment there's no organizer near me. You must let **any 3 players spin up a self-governing table** without anyone formally "organizing."
- **Discovery weaknesses:** event lists don't express seat-level scarcity ("needs a 4th"), skill/card fit, or money stakes — the exact filters mahjong players need. And empty calendars in low-density areas signal death.
- **Pay-to-organize friction:** Meetup/Eventbrite charge organizers. Charging the people who *create your supply* in a supply-constrained market is strategically insane for a growth-first product. Organizing must be free, fast, and even *rewarded*.

---

## WHAT TO STEAL
1. **The persistent recurring-group object** — "Linda's Tuesday Game" as a durable, followable entity with a history, members, and a regular slot. This is the single best idea in the event model.
2. **Calendar + recurrence + reminder notifications** — the retention/habit engine. Weekly nudges are your re-engagement spine.
3. **RSVP as the lowest-friction commitment** — but renamed and reframed to **"Claim the open seat / find your 4th."** Seat-level, not event-level.
4. **Public, indexable group/game pages** — feed the SEO machine you already have with long-tail recurring-game pages per city.
5. **Lightweight "host as trust anchor"** — a name/face that vouches for a home table (safety), borrowed from the host concept but stripped of gatekeeping.
6. **Seasonal event hooks** — "new card, new games forming" each spring; the event model's campaign muscle fits the NMJL calendar perfectly.

## WHAT TO REJECT
1. **Organizer-as-required-gatekeeper.** Do not make supply depend on a scarce unpaid host. Let any 3 players form a table; make "starting" near-zero effort.
2. **Pay-to-organize / ticketing.** Never charge or friction the people who create supply in a supply-starved, growth-first market. Monetize elsewhere (advertisers/venues), exactly as your current funnel already does.
3. **Event-as-the-centerpiece UI.** Don't make the calendar object the hero. The hero is the **group/table and the people in it.** Events are how the group *recurs*, not what the product *is*.
4. **One-off, episodic, FOMO/ticket psychology (the Eventbrite half).** Wrong emotional register for a habitual, belonging-driven, 45+ audience.
5. **Empty-calendar discovery as the only entry point.** In low-density US markets a blank event list reads as "dead." Keep a graceful-degradation layer (a directory of *players* open to forming a game) so discovery never bottoms out at zero.
6. **Generic commodity event mechanics as your moat.** RSVP+calendar is table stakes; do not mistake it for defensibility. Your moat is the dense player/seat graph + trust/verification + NMJL-native data + the locked-in foursome.

---

**Bottom line:** Adopt the event model's *recurring-group + RSVP + calendar-reminder* spine because it's the best retention engine available and it fits mahjong's weekly cadence exactly. But invert its center of gravity: move the gravity from the **organizer** to the **self-governing foursome**, from the **one-off event** to the **persistent group**, and from **pay-to-organize** to **free, frictionless, rewarded table-starting.** Take the mechanic; reject the gatekeeper.
