I have a complete strategy document to pressure-test. This is a strategic analysis task, not a code task, so I'll reason directly from the document and first principles. Let me give the kill-the-idea review.

---

**KILL-THE-IDEA REVIEW: FindMyMahj "Standing Table" strategy**

The strategy is well-written and internally coherent, which is exactly why it's dangerous: it reads like a finished thesis, but most of its load-bearing claims are asserted, not proven. Here are the strongest objections, ordered by how likely each is to kill the company.

---

**1. The cold-start math is hand-waved, and Step 3/4 of the "graceful degradation" ladder is where the product actually dies.**

The doc says liquidity is "winnable" because a Table needs "only 4 people within driving distance" and "a single suburb lights up with ~40 committed players." That ~40 number is invented. The real golden-path test is: a real woman in a real cold city searches this week. The honest outcome is Step 3 — "Be the first, start a table and we'll help you fill it." But the strategy never says *how* you fill it. "We'll help you fill it" is the entire product, and it's a promise with no mechanism behind it. If she starts a table and three weeks later it's still 1 of 4, you've converted a hopeful searcher into a disappointed one and burned the most motivated user you had.

The doc explicitly calls "an empty search result the single worst first impression" — then designs a homepage that shows a live count ("12 tables near 89135 have an open seat") that *cannot exist* in a cold metro. So either the homepage lies, or it shows the dreaded zero. The strategy contradicts itself here.

*Fix / forcing question:* Pick ONE launch metro and prove you can manually create 8–10 standing full tables with concierge effort (founder-in-the-Facebook-groups, recruiting by hand) BEFORE writing a line of matching code. Define the minimum viable density per zip empirically, not "~40." If you can't hand-fill 3 tables in your single best metro, the product is vapor regardless of UX.

---

**2. "Demand seeds supply" is the magic-trick assumption the whole wedge rests on — and it's the weakest link.**

The matching section calls the lone-player-starts-a-table inversion "how we manufacture liquidity where none exists." This is the Bumble "seeker makes the first move" insight — but in Bumble, the seeker is choosing among *thousands of existing profiles*. Here, a lone beginner declaring "I want a Tuesday game" is shouting into an empty room. You haven't manufactured liquidity; you've relabeled the absence of it. The seeker still needs three other real humans to exist and opt in within driving distance on a compatible night. The inversion changes who clicks first; it does nothing to create the other three people.

*Fix / forcing question:* What is the conversion rate from "I started a forming table" to "table actually filled and played a game"? If that number isn't above ~50% in your launch metro, the wedge doesn't work. You may need to seed every forming table with concierge recruiting (i.e., it's a service, not a product) for the first year.

---

**3. The safety story is built for the wrong threat model, and the demographic's real objection is social, not safety-feature-shaped.**

The doc treats the 60-year-old-woman problem as solvable with verification badges, neighborhood-not-address, and "group-as-buffer." But the actual psychology is: a woman is not afraid of a stranger the way the doc implies — she's reluctant to invite *anyone she doesn't have a warm referral for* into her home, and no badge substitutes for "my friend Carol vouches for her." The strategy's own moat (vouching, social graph) doesn't exist until the network is dense, which is exactly when you don't have it. So at launch, the home-game side of the marketplace — the highest-value, most-defensible supply — is precisely the part nobody will use with strangers.

Worse: the "women-only" and "vaccinated" host tags are quietly enormous liability and moderation surfaces, and the doc treats them as casual chips.

*Fix / forcing question:* At launch, the home game should probably be *invite-only among people who already know each other* (a tool for existing groups), and the stranger-matching should be **public-venue-only, full stop**, until the trust graph is real. Does the wedge still work if home-with-strangers is off the table for year one? If yes, narrow to that. If no, the safety problem isn't solved, it's deferred.

---

**4. The hybrid is five products, and v1 is quietly all five.**

The doc swears it won't be "a vague hybrid," then defines v1 as: reframed directory + player↔Table matching + mutual-consent flow + Table object + instant/request dial + minimum trust + email/SMS notifications. That's a marketplace, a matching app, a CRM object, a trust system, and a messaging/notification engine — for a non-technical founder (per the context, Shauna with Jason's guidance) on Next.js + Supabase. The "thin Table object" and "minimum-viable trust" will not stay thin once real strangers and real homes are involved.

*Fix / forcing question:* What is the absolute smallest thing that proves the core hypothesis? Likely: a single-metro "find a 4th this week" board for *public venues only*, with email capture and manual matching by the founder. No accounts, no profiles, no trust tiers, no Table object. If that doesn't get repeat usage, none of the rest matters. Cut v1 by 80%.

---

**5. Retention is asserted to live "in the Table," but once a foursome forms, their natural next move is to leave your product entirely.**

This is the dating-app inversion the doc *names* but doesn't actually solve. Four women who click into a standing Tuesday game will, within two weeks, have each other's phone numbers and a group text. Why would they ever open your app again? The doc's answer is "reminders, subs, history, scorekeeping" — but a group text already does reminders and subs better and with zero friction. "Find a sub this week" is the one genuinely sticky utility, but it fires only on the rare week someone drops AND the group can't fill it themselves AND they remember you exist.

*Fix / forcing question:* What is the concrete, repeated reason a *fully-formed, happy* foursome opens FindMyMahj in month 3? If the only honest answer is "occasionally to find a sub," then your retention engine is a once-a-month event at best, and your real product is *formation*, not retention — which means you're a high-churn acquisition machine, not a community moat. Be honest about which business you're in.

---

**6. The Facebook "harvest, don't compete" plan hands your distribution to a competitor who can flip a switch.**

The strategy's clever move is an "open seats board" tool that Facebook group admins post back into their groups, riding FB's distribution. But (a) FB group admins are exactly the "organizers" you say are scarce and burnable — you're depending on the bottleneck you claim to remove; (b) you're training users to do the action *inside Facebook*, reinforcing FB as the home and you as a utility; and (c) Facebook can add native event/RSVP/"looking for players" features to Groups in a quarter and evaporate the seam. Your defensibility against FB is "they won't bother with this niche" — which is a hope, not a moat.

*Fix / forcing question:* If Facebook ships a "find players near you" feature in Groups next year, what specifically still makes you better? The only durable answers are the cross-group, cross-city trust/reputation graph and mahjong-native structure FB won't replicate. That has to be the moat thesis — not "we harvest their liquidity," which is a launch tactic that strengthens the incumbent.

---

**7. A well-funded competitor (Bam Good Time) skips your hard part and buys the easy one.**

Your wedge is organic SEO + concierge density. A funded competitor doesn't fight you on cold-start mechanics — they sponsor teachers and classes directly (cash beats your "social currency" with instructors instantly), buy the spring-card-season moment with paid acquisition, and partner with venues/retreats for instant supply. Your strategy explicitly refuses to pay supply ("social currency, never cash"), which is principled until someone outbids you for the exact same scarce teachers and hosts you call your "supply multiplier."

*Fix / forcing question:* If a competitor pays the 50 best instructors in your launch metro a stipend to funnel students to them instead, what's your counter? "We're nicer and free" is not a counter. You may need a paid teacher program sooner than the doc's "monetization scales in v3, never taxing volunteers" stance allows.

---

**8. The teacher loop is presented as a force-multiplier but has a built-in conflict and a leaky measurement claim.**

The doc promises teachers an impact dashboard ("5 of your 8 students joined a game this month") and calls teachers "the most important growth input." Two problems: (a) you can only show that dashboard if students *use your product to play*, which is the very retention you haven't proven (see #5) — the metric measures the thing you're assuming; and (b) many serious instructors *want* students dependent on their own classes/groups, not graduated into independent tables. The incentive isn't as aligned as the doc assumes.

*Fix / forcing question:* Will teachers actually hand off students to a free network they don't control, or do they prefer to keep them captive? Talk to 10 instructors before betting growth on them.

---

**9. The KPI is "user growth," but the strategy optimizes a number that doesn't capture value, and there's no defined success/kill metric.**

"User growth over monetization" plus "success metric is number of standing Tables and weekly active players." But the document never states the *threshold* that means it's working vs. dying. Email-captured leads who never play are counted as a growth win in Deliverable 5 ("even a user who never completes a game is now a reachable lead") — that's vanity. The only number that proves the thesis is **filled tables that play 2+ weeks in a row in one metro.** Everything else is noise.

*Fix / forcing question:* Define the 90-day kill criterion now: e.g., "If we cannot get 10 standing tables playing 3+ consecutive weeks in [metro] within 90 days of concierge effort, we kill or pivot." A strategy with no kill metric isn't a strategy; it's a belief.

---

**Bottom line:** The thesis ("the standing Table is the product, not the list") is probably *right*, and that's the strategy's real value. But the document mistakes a clear articulation of the destination for a credible path to it. The four hardest things — manufacturing the first tables, getting strangers into homes, retaining a foursome that has each other's numbers, and defending against Facebook — are each resolved with a confident sentence rather than a mechanism. The single most useful action is to stop writing strategy and **concierge-build 10 full standing tables, public-venue-only, in one metro, by hand, in 90 days.** If that works, you have a product. If it doesn't, no amount of Table-object architecture saves it.
