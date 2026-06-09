# Discovery Layer Strategy

Evaluation of the proposed discovery architecture (location entry, then filters for venue type, activity type, amenities, and sort options). The direction is right in one way and wrong in another. Right: start with location and lead with activity. Wrong: the heavy filter set is premature and, for our audience, harmful. Build the simplest discovery that works now; earn the filters later when there is inventory to filter.

## What is right about the proposal

- "Find Mahjong Near You" with Use My Location or City and ZIP is the correct entry point. Location first is exactly how a player thinks.
- Leading with activity types (open play, lessons, beginner friendly) over venue types is correct and matches the activity-first model. The activity is what people want.

## What is wrong, or at least premature

- A wall of filters (venue type, activity type, amenities, four sort options) assumes abundant, varied inventory. We have almost none. Filters on an empty set produce empty results, which is the fastest way to make a new user leave and not return.
- For older adults, a screen full of filters and toggles is cognitive load and friction. Our whole design ethos is the opposite: big, clear, one decision at a time. A filter panel betrays that.
- Filters optimize for power users sifting a large catalog. Our user is not sifting; they want the one or two real games near them, now. Show those; do not make them filter to find them.

So the proposed architecture is a good Phase 2 or 3 destination and a bad Phase 1 starting point.

## The discovery that is correct now

Minimal, activity-first, senior-friendly:

1. Find Mahjong Near You. One input: Use My Location, or type a City or ZIP.
2. Show what is happening, soon and close. A simple list of real activities near them (tables forming, open plays, lessons), each as a big card: what, when, where (area), and one action (join, claim a seat, save my spot). Sorted by soonest and closest. No filter panel.
3. If nothing is near them, do not show an empty grid. Show one warm path: start a table in one minute, or tell us your area and we will let you know (which also feeds the heat map). An honest, useful empty state beats a filterable list of nothing.

That is the whole Phase 1 discovery layer. Location in, real nearby activity out, one tap to act.

## When to add filters, and which ones first

Add a filter only when inventory makes it necessary (a city has enough activities that the list is too long to scan). Then add them in order of real value:

1. Activity type first (open play, lessons, beginner friendly). This is the most meaningful cut and matches intent.
2. Accessibility and a couple of high-value amenities next (wheelchair accessible, tile sets available). These genuinely change whether a player can attend.
3. Sort options later (closest is the sensible default; soonest and most active are useful once there is volume).
4. Venue type last, if ever. It is the least important cut, because the player wants a game, not a building type. Keep it as a minor filter, never a primary one.

Each filter should hide until there is enough inventory to justify it. An interface should grow with the data, not pretend the data exists.

## Design guardrails for this audience

- One primary input (location), one primary output (nearby activities), one action per card.
- Defaults over choices. Closest and soonest by default; let people refine only if they want.
- Never show an empty filtered grid. Always offer a next action (start a table, get notified).
- Large text, large tap targets, minimal chrome. The discovery layer must feel as simple as the homepage.

## Verdict

The proposed filter architecture is the right long-term picture and the wrong thing to build now. Ship the minimal location-to-nearby-activity flow, keep it senior-simple, and let filters appear one at a time as inventory grows. Build the interface the data can fill, not the interface that assumes a catalog we do not have yet.
