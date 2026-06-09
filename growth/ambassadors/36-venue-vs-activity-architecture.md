# Venue vs Activity Architecture Analysis

The question: should the product be a directory of mahjong-friendly venues, or something else. Conclusion: a scrolling venue directory is the wrong product. People do not want a list of venues. They want to know where and when they can play. The right unit is the activity (an open play, a table, a lesson) at a place and time near them. The venue is an attribute of the activity, not the main thing.

## What users are actually searching for

"Mahjong-friendly venues" and "places to play mahjong" sound similar but are different products.

- "Mahjong-friendly venues" is a static reference list: places that tolerate or welcome mahjong. Low intent, rarely the real question, and nothing changes week to week.
- "Places to play mahjong" is really "when and where is there a game I can join near me." High intent, time-bound, and it changes constantly. This is the actual job.

Nobody wakes up wanting a venue. They want a game: an open play Thursday at 2, a table that needs a 4th this Tuesday, a beginner lesson Saturday. The venue matters only as a detail of that game (is it close, is it accessible, does it have parking). Building the product around venues optimizes the wrong noun.

## The 100 and 1,000 venue problem

A venue directory gets worse as it grows, not better.

- At 10 venues, a list is fine.
- At 100 venues, a scrolling list is noise. Which of these has a game I can actually join this week? Most have nothing happening. The list is mostly dead ends.
- At 1,000 venues, the directory is actively harmful: it looks comprehensive but answers no real question, and it sets the expectation of activity that is not there. A long list of places where nothing is scheduled is a worse experience than a short list of real games.

A directory scales in entries but degrades in usefulness, because the value is not the place, it is whether something is happening there. Scale the wrong unit and you scale the noise.

## Option A versus Option B

Option A, Venue Directory (restaurant, library, community center, country club, studio, with listings):
- Optimizes the venue. Static, low-intent, degrades at scale. A funded competitor can scrape and replicate a venue list in a weekend. Low defensibility, weak return reason. This is the wrong product.

Option B, Places to Play Mahjong (open plays, lessons, tournaments, leagues, retreats, cruises, with venue secondary):
- Optimizes the activity. Time-bound, high-intent, changes weekly (a reason to return), and ties directly to the core actions (join a game, claim a seat, save a spot). The venue is metadata on the activity. This scales, because each new activity adds real value, and it is defensible, because the moat is the live local activity and the relationships behind it, not a list of buildings.

Option B is correct. The product is activity-first. A venue is an attribute of an activity, never the primary entity.

## The right data model

- The primary object is an activity (a table, an open play, a lesson, an event), with a time, an area, and a host or organizer.
- A venue is an optional attribute of an activity (where it happens), with its own attributes (type, parking, accessible, tile sets) used for filtering and trust, not as the thing users browse.
- Discovery answers "what can I do near me, soon," sorted by soonest and closest, not "what venues exist near me."

This also matches the priorities: P5 is event and open-play inventory, which is exactly the activity supply that powers an activity-first product. It matches the return-visit problem: activities change weekly, so there is always a reason to come back; a venue list does not change, so there is not.

## What about venues at all

Venues still matter, but operationally, not as the product:
- As supply: secure safe public places (libraries, senior centers, community centers) to host activities. This is the partnership and operations work, free for now.
- As an attribute: tag each activity with its venue and the amenities that help players choose (accessible, parking, tile sets available).
- As future revenue: once there is real local activity and audience, featured venues and sponsors become a clean revenue layer (later, not now).

Do not build a browsable venue directory as the core product. Build activity-first discovery, and let venues be the where, not the what.

## The one-line verdict

Stop thinking "directory of venues." Think "what mahjong is happening near me, soon." Build the activity, attach the venue, and the product gets better as it grows instead of drowning in dead listings.
