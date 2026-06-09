This is a strategy/analysis task, not a coding task. I'll reason from first principles and deliver the analysis directly. No tools needed.

# Matching Model as a Template for FindMyMahj

## The honest framing first

Dating apps solve a brutal problem: pairing two strangers who each have private, fluctuating intent, where the cost of a bad match is high and the cost of rejection is emotionally expensive. The genius of Bumble/Tinder is not "swiping" — it's that they manufactured **legible, two-sided, real-time intent out of a population that was previously illegible**. You used to not know who in the room was single, interested, and looking *tonight*. The app made that knowable and made acting on it low-risk.

That exact illegibility problem exists in mahjong, and it's the strongest reason the matching insight transfers. Right now a woman who wants to play this week has no idea who within 15 miles also wants to play, has an open seat, plays her rules (NMJL vs other), and would actually welcome a stranger. The information is locked inside Facebook Groups and private text threads. **The transferable job is making local, time-bound "I want to play" intent legible and actionable.**

But the *unit* is wrong if you copy dating literally. Dating is 1:1 and the relationship IS the product. Mahjong is 4-person and the relationship is the *substrate* — the product is the recurring game. So I'll evaluate the template, then redesign the unit.

## The 7 lenses

**1. User psychology.**
Dating's core psychological wins: low-commitment expression of interest, mutual-consent before contact (you only talk if both opted in), and the dopamine of "it's a match." For our audience these map *partially*. The mutual-consent gate is a massive win for a 45+, safety-conscious, predominantly-female group — it solves "I don't want to be cold-DM'd by strangers." The dopamine of a match transfers too, but the *valence* is different: dating's thrill is romantic/sexual novelty; ours is **belonging and relief** ("I found my people, I have a seat Tuesday"). Where dating psychology actively misfires: the disposability and abundance mindset (swipe culture treats people as interchangeable). Our users want the *opposite* — a durable foursome they keep. Designing for endless browsing would feel cheap and slightly predatory to this demo.

**2. Network effects.**
Dating's network effect is local liquidity (enough singles in your zip). Ours is identical in structure but *better in one way and worse in another*. Better: a mahjong table only needs **4 people, not thousands** — liquidity is achievable block-by-block, and one filled table seeds a recurring node. Worse: dating churns users out on success (a couple leaves the app), whereas a successful mahjong group should keep using us forever IF we own the recurring ritual. The network effect is therefore **local-density-gated, same as dating**, but with far lower critical mass per geography. You can light up a single suburb with ~40 committed players. That's a winnable cold-start.

**3. Growth potential.**
Matching models grow via the "who's single near me" curiosity loop + word of mouth. Ours grows differently and arguably better: every formed table is a **4-person referral unit**, and the spring NMJL card release is a predictable annual demand spike (a built-in "new year" growth moment dating apps would kill for). The constraint on growth is trust, not desire — demand clearly exists (Facebook Groups prove it). So growth potential is high, but the gating function is *safety-enabled supply of hosts*, not desire generation.

**4. Retention potential.**
This is where the dating analogy *breaks in our favor*. Dating optimizes for churn (success = you leave). Mahjong is inherently **weekly and habitual** — "my Tuesday game." If we own the recurring table, retention is structurally enormous, far beyond any dating app. The matching event should be treated as a *one-time funnel step*, not the product. The product is the standing table. Any design that keeps people in the "matching" surface long-term is a failure; the win is graduating them OUT of matching into a durable group with tools (reminders, subs/"find a 4th for this week," scorekeeping).

**5. Ease of onboarding.**
Dating onboarding (photos, bio, swipe) is too high-friction and too identity-exposing for this demo, AND it carries dating connotations that will scare them. We need onboarding that feels like Meetup/Facebook Group joining, not a profile-creation ritual. The transferable piece: **structured preference capture** (skill level, rules played, days/times, in-home vs public venue, distance). The piece to reject: selfie-forward, self-marketing bios. Onboarding should be answerable in under 90 seconds and feel like "tell us when and where you like to play," not "sell yourself."

**6. Ease of finding a game.**
The matching model's real gift here is **filters + mutual intent = high-precision results**. Instead of scrolling a directory of 50 state pages (current product — passive, undifferentiated, no intent signal), a user states intent ("Tuesday mornings, beginner-friendly, near 89135, public venue OK") and sees *tables forming that fit*. This is a 10x improvement over a directory. This lens is the single strongest argument for adopting the matching insight.

**7. Long-term defensibility.**
Dating apps are weakly defensible (people multi-home, switch easily). Our defensibility is *potentially much stronger* because the asset is the **persistent local group and its ritual**, plus accumulated trust/reputation data, plus seasonal habit. Once four women run their Tuesday game through us with reminders, subs, and history, switching cost is real and social. The directory has near-zero defensibility; the recurring-table graph has a lot. The matching model alone is NOT the moat — the moat is what matching *graduates into*.

## The core transferable INSIGHT (stripped of the dating skin)

1. **Two-sided, time-bound intent made legible.** Both "I have a seat" and "I want a seat" are explicitly declared and matched — not a passive listing.
2. **Mutual-consent before contact.** No one gets cold-contacted; both sides opt in before any personal info or location is shared. (This is the safety keystone — and it maps perfectly to an older female audience.)
3. **Lightweight structured profiles**, not marketing bios. Preferences (rules, skill, schedule, venue type) do the matching work, not charisma.
4. **Preference filters as the primary navigation**, replacing the directory browse.
5. **The "match" dopamine** — re-skinned as *belonging/relief*, the satisfying "you're in" moment.
6. **Reduced rejection sting** via group dynamics and soft language (you're not rejected by a person; a table fills up or isn't your fit).

## How "matching" should actually FEEL here — matching a player to a forming TABLE

Reframe the atomic unit from person↔person to **player ↔ table**. A "Table" is a small, named, semi-persistent group object (e.g., "Summerlin Tuesday Mornings — beginner-friendly, 3/4 seats filled"). Three flows:

- **Join a forming table.** The hero experience. You filter by day/skill/venue/distance and see tables that need a 4th (or 3rd/2nd). One tap: "Request to join." The host (or table) approves — *mutual consent*. The dopamine moment is "**You're in. Tuesday 10am, 3 others confirmed.**" That's the re-skinned match: not romance, but the relief of a secured seat in a real group.

- **Start a table.** The supply side. "Start a Table" (the prior sprint's wedge — correct, keep it) lets a host or even a *single eager player* declare intent: "I want to start a Tuesday morning beginner game near me." This is critical — it means **demand can seed supply**. A lone player isn't stuck waiting for a host; she can announce a forming table and let the system gather the other three. This is the "Bumble women-make-the-first-move" insight, re-skinned: **the seeker can initiate the group, not just wait to be picked.**

- **Find a 4th (the retention engine).** Existing standing groups use us when someone's out this week. "Need a sub for our Tuesday game, this week only." This is where matching becomes a recurring utility, not a one-time funnel — and it's the bridge from acquisition to durable retention. It also lowers the bar for newcomers (a one-week sub is far less scary than joining a permanent group, for both sides).

**The feeling to engineer:** warm, finite, and reassuring — not the infinite-scroll slot-machine of dating. Show *progress toward a full table* ("3 of 4 seats"), not an endless deck. Scarcity-as-comfort ("almost full, join now") rather than scarcity-as-anxiety. The emotional target is "I found my people / I have a plan," not "look how many options I have."

## Safety / trust adaptations (non-negotiable for this audience)

- **Mutual opt-in before any contact or exact location.** Approve-to-join. Exact addresses revealed only after acceptance; before that, show neighborhood + venue *type* only.
- **Public-venue-first default for first meetings.** Surface libraries, cafés, community centers, clubs as default venues for newcomers; in-home is opt-in and gated behind reputation/verification. This directly addresses "games happen in private homes."
- **Verification tiers, soft not bureaucratic.** Verified email/phone baseline; optional ID/host verification that earns a visible trust badge. Don't make it feel like a background-check gauntlet — make it a status symbol ("Verified Host").
- **Host controls + reputation.** Hosts approve members, can set "women-only" / "beginners welcome" / "vaccinated" / "no-pets" style tags. Two-way lightweight reviews after games (attended? respectful? would play again?) build durable trust data — *this is also part of the moat*.
- **Group-as-buffer.** Joining a *group of 4* is psychologically and physically safer than meeting one stranger. Lean on this — it's a genuine advantage over 1:1 dating safety, and worth saying out loud in the UX copy.
- **No public broadcast of women's home locations or schedules.** The directory's current habit of publishing player/venue info publicly should be re-examined hard against this.

## WHAT TO STEAL

- **Two-sided declared intent** (seat-offered + seat-wanted), replacing passive directory listings.
- **Mutual consent before contact** — the approve-to-join gate. Doubles as the #1 safety feature.
- **Preference filters as primary navigation** (rules/NMJL, skill, day/time, venue type, distance) instead of 50 state pages.
- **Lightweight structured profiles**, not bios — preferences carry the matching load.
- **Seeker-initiates** ("Start a Table"): let demand seed supply, the Bumble first-move insight re-skinned.
- **The match-dopamine moment**, re-skinned as *belonging/relief*: "You're in — Tuesday 10am, 3 confirmed."
- **Progress-toward-full-table** UI (3/4 seats) as comforting scarcity.

## WHAT TO REJECT

- **Swipe / infinite deck / abundance mechanics.** Wrong unit (4 not 2), wrong emotion (disposability vs belonging), wrong demo.
- **Selfie-forward, self-marketing profiles and bios.** Too dating-coded, too identity-exposing, too high-friction for 45+ women.
- **Optimizing for time-in-matching-surface.** Dating monetizes attention in the feed; we must monetize the *graduation* into a durable recurring group. Time spent matching is friction, not engagement.
- **Churn-on-success model.** Dating loses users when they succeed; we must *capture* success as a standing table (reminders, subs, history) — that's the retention engine and the moat.
- **Any romantic/flirtatious framing, color, or copy.** The insight transfers; the skin must die completely. Tone = community/club/belonging, not attraction.
- **Public exposure of personal location/schedule data** — incompatible with the audience's safety reality.

**Bottom line:** Adopt the matching *insight* (legible two-sided intent + mutual-consent + preference filtering + seeker-initiates + a dopamine "you're in" moment), reject the matching *unit and skin* (1:1, swiping, bios, abundance, romance). Reframe the atom as **player↔forming-table**, treat the match as a one-time funnel step whose entire purpose is to graduate people into a **durable, recurring local group** — because unlike dating, our success state is retention, and the standing table plus its trust/reputation data is the only real moat.
