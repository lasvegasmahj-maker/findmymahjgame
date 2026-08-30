# FMG rules truth-layer audit (2026-08-30)

Owner requirement: "There can never be a mahjong rule question that Find My Mahj simply cannot
answer. If the question does not contain enough information to answer accurately, Ask Find My
Mahj must ask for clarification. It must never guess." This record covers the audit of the
Ask Find My Mahj rules corpus, the clarification engine, the benchmark, and the questions that
remain for the owner. Source policy: docs/rules-sources.md.

## Summary

- Canonical rules audited: 50 entries in lib/rules/knowledge.ts (21 owner-approved, unchanged
  in wording; 26 written for this audit and research-verified against League rules; 3 open
  owner questions whose answers claim no rule and say the instructor is confirming).
- Classification: 40 STANDARD NMJL RULE, 6 NMJL CLARIFICATION, 1 TOURNAMENT RULE,
  1 HOUSE/OPTIONAL RULE, 1 ETIQUETTE, 1 STRATEGY.
- Provenance coverage: 50/50 entries carry ruleset, topic, classification, source type,
  source title, last-verified date, owner-review flag, and evidence status; every research
  entry also carries a cross-check reference and a year. No source text is stored.
- Owner review required: 29 entries (every entry the owner has not yet approved).
- Owner-approved wording: preserved verbatim; no credible source conflict required a change.
  Items flagged for the owner are listed below, not edited in.

## Owner-approved entries: claims, classification, flags

| Entry | Claims | Class | Flag |
| --- | --- | --- | --- |
| tile-count | 152 tiles; 3 suits x 9 x 4; 16 winds; 12 dragons; 8 flowers; 8 jokers | STANDARD | none |
| suits | Bams, Craks, Dots; 1 to 9; 4 copies | STANDARD | none |
| dragons | Red = Craks, Green = Bams, White (Soap) = Dots; 4 each | STANDARD | none |
| flowers | interchangeable, unnumbered, 8 | STANDARD | none |
| winds | N, E, W, S; 4 each; no suit | STANDARD | none |
| jokers-basics | wild; groups of 3 or more only; 8 | STANDARD | none |
| joker-in-pair | never in a pair or single | STANDARD | none |
| joker-exchange | redeem from any exposure on your turn; never from a hidden hand | STANDARD | timing detail now on joker-exchange-timing |
| dealing | 13 each, East 14; East opens by discarding | STANDARD | none |
| charleston | 3 right, across, left (required); second if all agree; blind on last pass; courtesy pass; no jokers | STANDARD | none |
| open-vs-closed | closed hands call only the mahjong tile | STANDARD | none |
| closed-hand-final-tile | same exception stated | STANDARD | none |
| charleston-blind-pass | First Left, Last Right; 1 to 3 tiles; no jokers; unseen | STANDARD | none |
| calling-discard | most recent discard; group of 3 or more or mahjong; face up; mahjong beats exposure | STANDARD | house_note describes a standard window rule as loosely policed at some tables; kept, flagged as wording only |
| winning-mahjong | 14 tiles matching the card; draw or called discard | STANDARD | none |
| annual-card | new card every spring; hands change yearly | STANDARD | "buy directly from the League" is narrow (retailers also sell it); wording flag for owner, not a rule error |
| the-wall | 19 long, 2 high, per player | STANDARD | none |
| wall-game | no winner, no score | STANDARD | house_note on redeal is house variation, labeled |
| players-count | built for 4; 3-player adaptations vary | STANDARD | League rulebook has an official three-handed method; not published here (details unverifiable online) |
| courtesies-vs-rules | rules vs courtesies; courtesy pass optional | ETIQUETTE | none |
| dead-hand | wrong count or unfit exposures; stops playing; challenge formally | STANDARD | confidence medium kept; details now on dead-hand-details |

## All entries with provenance

| Entry | Classification | Provenance | Cross-check reference | Verified |
| --- | --- | --- | --- | --- |
| `tile-count` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `suits` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `dragons` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `flowers` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `winds` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `jokers-basics` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `joker-in-pair` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `joker-exchange` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `dealing` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `charleston` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `open-vs-closed` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `closed-hand-final-tile` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-26 |
| `charleston-blind-pass` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-26 |
| `calling-discard` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-29 |
| `winning-mahjong` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `annual-card` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `the-wall` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `wall-game` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `players-count` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `courtesies-vs-rules` | ETIQUETTE | owner approved (evidence verified) | Owner approval | 2026-08-29 |
| `dead-hand` | STANDARD NMJL RULE | owner approved (evidence verified) | Owner approval | 2026-08-22 |
| `calling-for-mahjong` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League rule on calling any tile for mahjong; cross-checked via Mahj Life wiki article 178 and the owner-approved calling and closed-hand entries | 2026-08-30 |
| `calling-for-exposure` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League rules on exposures and commitment to a called discard; cross-checked via Mahj Life wiki articles 177, 178, and 289 | 2026-08-30 |
| `calling-for-pair` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League rule that a call is never made for a single or pair except for mahjong; cross-checked via Mahj Life wiki article 178 | 2026-08-30 |
| `joker-in-mixed-groups` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League rulebook rule that jokers are never used in a block of single tiles; follows from the owner-approved joker entries; cross-checked via Mahj Life wiki article 221 | 2026-08-30 |
| `joker-discarded` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League rule that a discarded joker may not be taken for any purpose; cross-checked via Mahj Life wiki articles 178 and 221 | 2026-08-30 |
| `joker-exchange-timing` | NMJL CLARIFICATION | research-verified (secondary_research), evidence owner_review_pending | League rules on joker exchange timing and a wrong exchange (fixable before the next discard; then the hand holding the incorrect exposure is dead); Mahj Life wiki articles 172, 221, 224 citing the rulebook and 2024 bulletin; Sloperama FAQ corroborates | 2026-08-30 |
| `two-players-same-tile` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League rule on concurrent claims (mahjong first, then next in turn); cross-checked via Mahj Life wiki articles 264 and 281 and the owner-approved calling entry | 2026-08-30 |
| `own-discard` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League ruling that a player cannot claim their own discard; cross-checked via Mahj Life wiki article 245 | 2026-08-30 |
| `naming-discards` | NMJL CLARIFICATION | research-verified (secondary_research), evidence owner_review_pending | League rule that discards are named; 2024 bulletin ruling accepting 'same' for a repeat discard, cross-checked via Mahj Life wiki article 242 | 2026-08-30 |
| `misnamed-discard` | NMJL CLARIFICATION | OPEN QUESTION for owner (evidence owner_question_pending) | Exact League penalty for a misnamed discard (corrected before or after another player acts on it) | 2026-08-30 |
| `mahjong-in-error` | STANDARD NMJL RULE | OPEN QUESTION for owner (evidence owner_question_pending) | Mahjong declared in error with tiles exposed: is the hand dead outright, or may the declaration be retracted with the exposed tiles staying committed (League rulebook 2024); secondary summaries disagree (Mahj Life wiki articles 189, 197, 216) | 2026-08-30 |
| `dead-hand-details` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League rules on dead hands and the wrong number of tiles; cross-checked via Mahj Life wiki articles 189 and 205 and the owner-approved dead hand entry | 2026-08-30 |
| `dead-hand-jokers` | NMJL CLARIFICATION | OPEN QUESTION for owner (evidence owner_question_pending) | May a joker in a dead player's exposure be exchanged, and does it matter whether that exposure is the one that made the hand dead | 2026-08-30 |
| `picking-ahead` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League rule against picking ahead; cross-checked via Mahj Life wiki articles 59, 189, and 209 | 2026-08-30 |
| `order-of-play` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League turn order (East, South, West, North, play to the right); cross-checked via Mahj Life wiki articles 170 and 239 and the owner-approved dealing entry | 2026-08-30 |
| `hand-size` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | Follows from the owner-approved dealing and winning entries; cross-checked via Mahj Life wiki article 205 | 2026-08-30 |
| `courtesy-pass` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League courtesy pass rule as already stated in the owner-approved Charleston and courtesies entries; cross-checked via Mahj Life wiki article 179 | 2026-08-30 |
| `charleston-stop` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League rule on stopping the Charleston (bulletins and the League rulebook); cross-checked via Mahj Life wiki articles 179 and 193 | 2026-08-30 |
| `passing-on-a-discard` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | Follows from the owner-approved calling entry (calling is a choice; the window closes when the next player racks) | 2026-08-30 |
| `payments-basics` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League payment rules exist in the rulebook (amounts held back pending the owner's wording decision, question 10); wall game pays nothing per the owner-approved wall-game entry; cross-checked via Mahj Life wiki articles 98 and 208 | 2026-08-30 |
| `quints-sextets` | STANDARD NMJL RULE | research-verified (arithmetic), evidence owner_review_pending | Follows from the owner-approved tile counts | 2026-08-30 |
| `calling-quints-sextets` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League rulebook and bulletin rule that a discard may be claimed to expose a pung, kong, quint, or sextet; consistent with the owner-approved calling entry (3 or more identical tiles); cross-checked via Mahj Life wiki articles 146 and 221 | 2026-08-30 |
| `exposures-basics` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | League rules on exposures, modifying an exposure before discarding, and dead hands; cross-checked via Mahj Life wiki articles 177, 189, and 254 | 2026-08-30 |
| `card-notation` | NMJL CLARIFICATION | research-verified (secondary_research), evidence owner_review_pending | Card legend conventions (colors as suits, C and X, F and D, Soap as zero); cross-checked via Mahj Life wiki articles 162, 254, and 269 | 2026-08-30 |
| `tournament-rules` | TOURNAMENT RULE | research-verified (secondary_research), evidence owner_review_pending | Tournament conventions layered on League rules; cross-checked via Mahj Life wiki article 186 | 2026-08-30 |
| `blank-tiles` | HOUSE/OPTIONAL RULE | research-verified (secondary_research), evidence owner_review_pending | Blanks as a house variation outside League rules; cross-checked via Mahj Life wiki article 279 | 2026-08-30 |
| `last-tile-of-wall` | STANDARD NMJL RULE | research-verified (secondary_research), evidence owner_review_pending | Follows from the owner-approved wall game and winning entries; the mahjong call on the last discard is the League's any-tile-for-mahjong rule, cross-checked via Mahj Life wiki articles 178 and 189 | 2026-08-30 |
| `rules-source` | NMJL CLARIFICATION | research-verified (secondary_research), evidence owner_review_pending | The League's own description of its role and publications (nationalmahjonggleague.org) | 2026-08-30 |
| `hand-choice-strategy` | STRATEGY | research-verified (secondary_research), evidence owner_review_pending | General instructional strategy, not a League rule; cross-checked via Mahj Life wiki article 183 | 2026-08-30 |

## Mahj Life research integration and copyright boundary

Mahj Life (https://mahjlife.com/, CC BY-NC-ND 4.0) was used to locate and cross-check League
rulings for every new entry (wiki articles 59, 98, 162, 170, 172, 177, 178, 179, 183, 186,
188, 189, 193, 197, 205, 208, 209, 216, 221, 224, 235, 239, 242, 245, 254, 264, 269, 279,
281, 289). Every answer was written independently in this site's words; no sentence was
copied or closely paraphrased, the corpus invariant test refuses any entry text that names
the source, and no scraper exists. The National Mah Jongg League's own FAQ and bulletin
pages are rendered by script and could not be read directly; where Mahj Life cites the
League rulebook (Mah Jongg Made Easy) or a bulletin ruling, that League source is named in
the entry's provenance.

## Clarification engine

lib/rules/clarify.ts, wired through lib/rules/lookup.ts, app/api/ask/route.ts, and
app/ask/ask-client.tsx. Clarifications: call-purpose, hand-type, ruleset, tournament,
pass-context, and the topic fallback. The server keeps no state; the reply carries the
clarification id and the original question. The route returns `rules.clarify` with the
prompt and options; the page renders the options as buttons and also accepts a typed reply.

## Benchmark and blind evaluation

- tests/rules-knowledge.spec.ts: hard mahjong facts, provenance rules, precedence classes.
- tests/rules-clarify.spec.ts: triggers, non-interrogation, multi-turn resolution.
- tests/rules-truth-benchmark.spec.ts: 130 classified cases, each run through casing,
  punctuation, newline, smart-quote, and truncation variants; every entry reachable; corpus
  invariants (no source name, month, dash, or letter code; no conflicting rules; tournament,
  house, and strategy entries labeled as such; owner wording pinned).
- tests/rules-heldout.spec.ts: 83 blind cases (76 at the first, tuning-free run; 83 after the gate rounds added phrasings), written after the routing logic and the
  benchmark were finished. First, tuning-free run: 60 passed, 16 failed. Of the 16: 0 stated
  a wrong rule; 3 answered a related entry that did not address the asked point
  (joker-exchange question answered by the exposure entry, dealer's extra tile answered by
  hand size, dead-hand jokers answered by dead-hand details); 7 asked a safe clarification
  where an answer was available; 6 were Ask-box detection misses that would have fallen to
  the directory search. All 16 were fixed by widening concept matchers and detection
  signals, then the set was rerun clean and kept as a regression guard.
- tests/ask-rules-route.spec.ts: multi-turn clarification through the real /api/ask route
  and the real /ask page (button and typed reply).

## Questions for the owner (exact wording)

Reviewer gate round 1 (2026-08-30) found one blocker, fixed before merge: naming-discards had
claimed a discarded joker is always named joker, which its cited sources do not support; the
clause was removed. It also flagged mahjong-in-error as overstated against the 2024 League
rulebook summary; that entry now states only the supported core and carries question 8 below.

1. Misnamed discard: what is the League's exact consequence when a discard is misnamed, and
   does it differ if the name is corrected before anyone acts on it versus after another player
   calls it or declares mahjong on it? (Entry misnamed-discard says the instructor is confirming.)
2. Jokers in a dead hand: may a joker sitting in a dead player's exposure still be
   exchanged, and does it matter whether that exposure is the one that made the hand dead?
   (Entry dead-hand-jokers says the instructor is confirming.)
3. Calling for a quint or sextet (confirmation): entry calling-quints-sextets now answers yes,
   because the League rulebook and four bulletin rulings (located through Mahj Life articles 146
   and 221) say a discard may be claimed to expose a pung, kong, quint, or sextet, and the
   owner-approved calling entry already says "3 or more identical tiles". One secondary summary
   had suggested sextets cannot be claimed; please confirm the yes.
4. Last discard of the deal: when the wall is exhausted, may the final discard be claimed for
   an exposure, or only for mahjong? (Entry last-tile-of-wall states only the mahjong case.)
5. Mahjong declared in error: how should payments be settled when other players have already
   thrown in their hands after a false mahjong? (Entry mahjong-in-error defers that point to
   the table and the League rulebook.)
6. Three-player play: should the League rulebook's official three-handed procedure be
   published, and if so what are its exact steps? (Entry players-count keeps the owner's
   current wording.)
7. Wording flag: annual-card says players buy the card "directly from the League"; retailers
   also sell it. Keep or soften?
8. Mahjong declared in error: is the hand dead outright once tiles are exposed, or may the declaration be retracted with the exposed tiles staying committed (League rulebook 2024, p. 21 as quoted by Mahj Life article 189), and what happens when no tiles were exposed? Secondary summaries disagree, so entry mahjong-in-error now claims no rule at all and defers entirely to the instructor.
9. Picking ahead: what is the League's consequence when a player draws before the previous
   player has discarded (is the hand dead, does the tile go back)? Entries picking-ahead and
   dead-hand-details now state only that picking ahead is against League rules and the table
   stops to sort it out.
10. Payments: entry payments-basics currently holds the amounts back and says only that the
   League rulebook sets who pays and how much (the same neutral approach you chose for Las Vegas
   Mahjong). Should Find My Mahj state the League amounts (discarder pays double, self-pick all pay
   double, jokerless doubles, both can stack), or keep the neutral wording?
11. Wrong tile count noticed before East's first discard: what is the League's remedy (start the
   deal over, or correct the hand)? Entry dead-hand-details now says only that a wrong count
   cannot be fixed once play has begun.
12. Wrong joker exchange: after a wrong tile goes into an exposure and the next discard is made,
   what is the League's consequence (secondary sources say the hand holding the incorrect exposure
   is dead and the redeemer plays on)? Entry joker-exchange-timing now defers this to you and
   states only the correction window before the discard.
13. Hold or wait: does saying hold or wait count as a call for priority, or only pause play
   until the player says call or mahjong? Entry two-players-same-tile now says the instructor
   is confirming this point; the settled priority rules stay.

## Reviewer gate history (2026-08-30)

- Round 1: FAIL. Blocker: naming-discards claimed a discarded joker is always named joker (unsupported); removed. Warnings fixed: mixed answers shipped a clarification the page acted on; payment and "is east" signals hijacked cost and place-name questions; the ruleset re-ask had an empty prompt; mahjong-in-error overstated the exposed-tiles outcome (now an owner question); last-tile-of-wall cited a house-rule article.
- Round 2: FAIL. Blocker: everyday-word concept matchers (tips, direction, authority, out of tiles, don't want) had become standalone Ask-box signals and pulled plain directory questions into the rules path; they are now vocabulary-gated and suppressed by directory, commerce, and place wording. Warnings fixed: a directory question typed mid-clarification was trapped; gap telemetry logged replies and duplicates; the card guard skipped questions naming the card's hands.
- Round 3: FAIL (reviewed the round-2 code). Blocker: group-size, hold-a-spot, call-it-in, hands-on-lessons, and Charlestown/Charlton phrasings still reached rules answers; all fixed and pinned in the directory regression test. Warnings fixed: picking-ahead and dead-hand-details asserted a dead-hand consequence the source did not settle (now an owner question); rules-source claimed instructor review of every answer (now claims only what is true).
- Independent verification panels (see below) confirmed one more rule error: an exposure may be corrected only until the caller discards or exchanges a joker; both entries said discard only. Fixed.
- Rounds 4 and 5: PASS, no blockers; warnings fixed (a typed reply that answers an option is never treated as a search; owner-question answers count as unverified in telemetry; wall-game payment wording agrees with the owner-approved courtesies entry).
- Round 6: FAIL on one hard-rule slip (an em dash inside a pasted panel note in this record); fixed together with its warnings (negated style replies land on the other-style answer; the wall game begins only after the last tile is drawn and discarded; payment amounts held back pending question 10; owner-question entries claim nothing).
- Round 7: PASS, no blockers; warnings fixed (passing questions reach the Charleston answer; a bare parsed location no longer ejects a reply from its clarification; research entries record evidence owner_review_pending until approved).
- Round 8: PASS, no blockers; warnings fixed (the homepage Ask card answers a clarification in place; an open clarification turn is not counted as unanswered; audit tables regenerated from the corpus).
- Round 9: FAIL on the home-card chips being white on white (invisible); fixed with a navy pill style and a computed-color assertion on both viewports; negated replies never resolve to the option they refuse; a mixed question no longer echoes its rules half as a place name.
- Round 10: PASS, no blockers; warnings fixed (a negation in a topic reply keeps the named topic; the pending-review note claims no provenance; the hold-or-wait sentence became owner question 13 and the wrong-exchange consequence was folded into question 12; the calling window wording matches the owner-approved house note in every research entry).
- Round 11: PASS, no blockers; warnings fixed (tournament, rulebook, suit, and blank signals vocabulary-gated; a rate limit mid-clarification keeps the pending question).
- Round 12: PASS, no blockers; warnings fixed (a capitalized style word after a preposition is never a place; a statement-form variant question reaches the style clarification; the Charleston-stop entry states only the settled rule).
- Round 13: PASS, no blockers; warning fixed (the mixed-question location repair no longer strips a long place name from a plain search); this record was tidied for the owner.
- Round 14: PASS, no blockers, style nits only (three deferral sentences in passive voice; the home-card chip class duplicates the global outline button; a wall-game wording tie). Merged to main as 862992a and deployed to findmymahjgame.com on 2026-08-30; production verified with all four launch gates OFF and matcher_enabled false.

## Independent truth-verification panel (2026-08-30)

Three adversarial panels ran over the corpus (a 21-agent panel over all entries with correctness
refutation, conflation and classification, and copyright lenses, plus two confirmers per
blocker; then two follow-up panels over every entry whose wording changed). Confirmed blockers,
all fixed before merge: naming-discards joker-naming clause (removed); exposure correction
window has two cut-offs, discard or joker exchange (calling-for-exposure, exposures-basics);
after a wrong joker exchange the hand holding the incorrect exposure is dead, not the redeemer
(joker-exchange-timing); the pre-play remedy for a wrong tile count was unsupported
(dead-hand-details, now owner question 11); mahjong-in-error asserted rules as an owner
question (now claims none). Two panel findings led to additions: joker-in-mixed-groups and
the resolved calling-quints-sextets.

The panel's warnings are the owner's call and were not edited into owner-approved text. The
main themes: jokers described as "unique to American mahjong" (other variants use jokers);
flowers "not numbered" (many sets print numbers or seasons that League play ignores); the
calling-discard house note credits "the card" for the calling window and marks the entry as
varying by table, while the window is a rulebook rule and only enforcement varies; the
wall-game and courtesies entries treat "same dealer deals again" and "how a wall game is paid"
as table customs, while the League's default is that the deal rotates and a wall game pays
nothing; the blind-pass sentence tracks the League's own phrasing closely; the League publishes
an official three-handed procedure (no Charleston) that players-count does not mention. Full
per-entry list (first finding per entry, in the reviewer's own words; the full panel transcripts
are filed with the CEO OS Drive report):

Quoted clauses come from the corpus snapshot the panel reviewed; where the gate history below
says an item was fixed, the shipped wording in lib/rules/knowledge.ts differs.

| Entry or theme | Findings | Clause the reviewer questioned | Reviewer's suggested change (owner's call; nothing applied to owner wording) |
| --- | --- | --- | --- |
| `blank-tiles` | 1 | "They come with many sets as spares to replace a lost tile. Some tables use them as a house rule, usually letting a player trade a blank for a tile in the discard area." | Reorder and reword so the answer does not mirror the article's sequence, e.g. lead with the League point, then: "Most sets include a few blanks only so you can stand in for a tile that goes missing. Tables that play with them treat it as a house rule; the usual version lets you swap a blank for a tile that has already been thrown. Settle the details before the first deal, and remember the table is then off standard League rules." |
| `calling-discard-house-note` | 1 | knowledge.ts line 504, house_note on the calling-discard entry: "The card closes the calling window once the player next in turn has picked and racked, or discarded; some tables police that moment loosely, so confirm your table follows the card." | Owner to verify whether the current card back states the calling-window rule; if not, change "The card closes" and "follows the card" to refer to the League's rules (Mah Jongg Made Easy) instead. Optionally restate the closing moment in the owner's own words. |
| `calling-discard/corpus-missing-house-note` | 1 | corpus.json entry "calling-discard" has no house_note field, but lib/rules/knowledge.ts lines 503-504 attach one that the router serves. | Regenerate corpus.json from knowledge.ts including house_note so every served sentence is inside the review set. |
| `calling-discard/house-note-card-attribution` | 1 | house_note (knowledge.ts line 503): "The card closes the calling window once the player next in turn has picked and racked, or discarded; some tables police that moment loosely, so confirm your table follows the card." | Owner's eye only (owner-approved). If the owner wants the attribution airtight, saying "the League's rulebook" instead of "the card" would match the verifiable source; and the varies_by_house flag could be reconsidered since only enforcement, not the rule, varies. |
| `calling-discard/quint-sextet-scope` | 1 | Cross-entry scope tension: calling-discard (owner-approved) says a call is allowed for "an exposed group of 3 or more identical tiles", while calling-quints-sextets says "Whether a discard may be called to complete a quint or a sextet is a detail our instructor is confirming" and calling-for-exposure narrows the examples to "a Pung or a Kong". | For the owner: confirm against the current Mah Jongg Made Easy that a discard may complete a quint or sextet, then resolve calling-quints-sextets and let calling-for-exposure name quint and sextet alongside pung and kong. No edit to calling-discard. |
| `calling-discard/varies-by-house-flag` | 1 | knowledge.ts line 500-502: varies_by_house: true with house_note "The card closes the calling window once the player next in turn has picked and racked, or discarded; some tables police that moment loosely, so confirm your table follows the card." | Owner's call: consider varies_by_house: false for calling-discard, keeping the note (if wanted) as a plain clarification rather than a house-variation flag; no change to the approved answer text. |
| `calling-for-exposure` | 4 | (1) "you may fix a mistake in that exposure only until you discard"; (2) "a Pung, a Kong, or a larger group" | Change the last clause to: 'you may fix a mistake in that exposure only until you discard or make a joker exchange, whichever comes first.' Apply the same change to exposures-basics, which uses identical wording. For (2), either have the owner resolve calling-quints-sextets (League support: MJME 2024 pp.14-15 via Mahj Life 16 and 280) or trim 'or a larger group' to 'a Pung or a Kong' until she does, so the two entries agree. |
| `calling-for-exposure/joker-exchange-lock` | 1 | "you may fix a mistake in that exposure only until you discard" | Append 'unless you have already made a joker exchange this turn' or leave the clause out and let the exposure-correction entry carry it. |
| `calling-for-mahjong` | 2 | "the chance to call ends once the next player has drawn and racked a tile" | "...and the chance to call ends once the next player has drawn a tile from the wall and either racked or discarded it." |
| `calling-quints-sextets` | 1 | Corpus version (source owner_question): "Calling for a Pung or a Kong follows the usual rule: the tile must join a group of 3 or more identical tiles that goes face up on your rack." | Regenerate corpus.json from the committed knowledge.ts before any further review passes; if the owner_question version is ever restored, drop the pung/kong sentence so the entry claims nothing beyond 'the instructor is confirming'. |
| `calling-quints-sextets-source-divergence` | 1 | corpus.json answer: "Whether a discard may be called to complete a quint or a sextet is a detail our instructor is confirming..." versus lib/rules/knowledge.ts lines 1028-1044 approved_answer: "Yes. A discard may be called to complete any group of 3 or more identical tiles, and that includes a Quint or a Sextet..." with source research_verified, confidence high, classification standard_nmjl_rule, provenance citing Mahj Life articles 146 and 221. | Decide which version is canonical. If the owner has not yet confirmed, update knowledge.ts to the owner_question form (minus the extra rule sentence). If the owner accepts the MJME 2024 p.15 evidence, keep the knowledge.ts answer and update the corpus to research_verified with source_ref citing articles 146 and 221. |
| `calling-quints-sextets-vs-exposure` | 1 | calling-quints-sextets: "Whether a discard may be called to complete a quint or a sextet is a detail our instructor is confirming" | Owner clears calling-quints-sextets with the League cite (quints and sextets of identical tiles may be called; jokers fill the extra copies), or calling-for-exposure says "a Pung or a Kong" until she does. |
| `card-notation` | 2 | "On the card, each color stands for a different suit, not a fixed one" with no carve-out for F, N/E/W/S, and the zero (Soap). | Add one clause: "Flowers, winds, and the zero are not suit tiles, so their color on the card does not tie them to a suit." Optionally add: "Anything in parentheses on the card overrides the colors." |
| `card-notation/source-ref-162` | 1 | source_ref: "Card legend conventions (colors as suits, C and X, F and D, Soap as zero); cross-checked via Mahj Life wiki articles 162, 254, and 269" | Re-point the ref: keep 254 and 269, replace 162 with 144 for C and X, and state that F, D, and wind letters are verified against the card's printed legend (owner to confirm against the current card) rather than a Mahj Life article. |
| `charleston-blind-pass` | 1 | "If you do not want to pass three tiles from your own hand, you may take one, two, or all three tiles being passed to you and pass them onward without looking at them." | Owner decision only (entry is owner_approved). If the owner wants more distance from the card text, the same rule can be stated without the League's construction, for example by saying the player may top up their pass with any of the incoming tiles, unseen, so that three tiles still go out. |
| `courtesies-vs-rules` | 3 | "Courtesies are local customs a table agrees on, such as how a wall game is paid or whether the same dealer deals again." | Owner-approved text, so no rewording proposed; owner to confirm she is comfortable with these two examples or swap in examples the League genuinely leaves open (e.g. betting on a wall game, seat rotation schedule, snack breaks). |
| `dead-hand-details` | 2 | A short or long hand can be fixed only during the Charleston, before East's first discard. | Replace 'can be fixed only during the Charleston' with 'must be caught before East's first discard; the deal is then thrown in and redealt (the one exception: East's left-hand neighbor who is short one tile takes the next wall tile)'. |
| `dead-hand-details/paraphrase` | 1 | "A dead player stops drawing and discarding but still pays the winner of that deal. You do not declare your own hand dead; the other players do." | Optional: recast the self-declaration sentence, e.g. Only another player can call your hand dead. Leave the first sentence, which follows the owner-approved wording. |
| `dead-hand-details/varies-by-house` | 1 | varies_by_house: true; house_note: 'Tables enforce dead hand challenges with different levels of strictness.' | Set varies_by_house false; if the note stays, reword it as etiquette ('how vigilantly a table polices this is up to the table; the rule is the League's'). |
| `dead-hand-jokers` | 3 | Whether a joker sitting in a dead player's exposure can still be redeemed depends on which exposure it is in, and the League's guidance draws that line carefully. | Keep only the deferral: 'Our instructor is confirming the League's exact ruling on redeeming jokers from a dead player's exposures before we publish it here. Until then, ask your table to follow the League's rulebook for that deal.' |
| `exposures-basics` | 3 | "Until you discard, you may still fix a mistake in the exposure; after that it is locked, and the only later change is a player redeeming a joker in it." | Change to: "Until you discard or exchange a joker, you may still fix a mistake in the exposure; after either, it is locked, and the only later change is a player redeeming a joker in it." Have the instructor confirm against the 2025 NMJL Bulletin and update source_year/last_verified accordingly. |
| `exposures-basics-joker-lock` | 1 | exposures-basics: "Until you discard, you may still fix a mistake in the exposure; after that it is locked" | "Until you discard or exchange a joker, you may still fix a mistake in the exposure; after either, it is locked..." |
| `exposures-basics-vs-calling-quints-sextets` | 1 | exposures-basics: "Only a Pung, Kong, Quint, or Sextet can be exposed" versus calling-quints-sextets (owner_question): "Whether a discard may be called to complete a quint or a sextet is a detail our instructor is confirming" | Either have the owner resolve calling-quints-sextets (then retire it or convert it to standard_nmjl_rule), or soften exposures-basics to "a group of 3 or more identical tiles, never a pair" until the owner confirms. |
| `extra-calling-window-wording-out-of-batch` | 1 | calling-for-mahjong (outside this batch): 'the chance to call ends once the next player has drawn and racked a tile.' | Use 'drawn and racked a tile, or discarded' in calling-for-mahjong as well. |
| `extra-corpus-stale-vs-head` | 1 | corpus.json entry calling-quints-sextets (source owner_question, classification nmjl_clarification) does not match lib/rules/knowledge.ts at HEAD (source research_verified, classification standard_nmjl_rule, answer beginning 'Yes. A discard may be called to complete any group of 3 or more identical tiles, and that includes a Quint or a Sextet'). | Rebuild the corpus dump used by the panel from HEAD before the owner review, or note in the audit doc that the corpus snapshot predates b9320e2. |
| `extra-exposures-basics-fix-window` | 1 | exposures-basics (outside this batch, same wording as calling-for-exposure): "Until you discard, you may still fix a mistake in the exposure; after that it is locked" | Mirror whatever wording the owner adopts for calling-for-exposure: 'Until you discard or make a joker exchange, you may still fix a mistake in the exposure; after either, it is locked.' |
| `extra-head-calling-quints-provenance` | 1 | HEAD provenance for calling-quints-sextets: 'League rulebook and bulletin rule that a discard may be claimed to expose a pung, kong, quint, or sextet ... cross-checked via Mahj Life wiki articles 146 and 221' (source_year 2020). | In knowledge.ts, change the provenance string to cite Mahj Life wiki articles 16 and 221 (MJME 2024 pp.12 and 14) and set the year to 2024. No change to the answer text. |
| `flowers` | 1 | "Flowers are all interchangeable, and they are not numbered." | No rewording proposed (owner-approved). If the owner wants to close the gap, the safe statement is that any number or season printed on a flower is ignored in League play; otherwise leave as is. |
| `flowers-numbering-scope` | 1 | "they are not numbered" | Owner's call; no rewording proposed for an owner-approved entry. If the owner wants to close the gap, the point is that any number or season mark printed on a flower is ignored in League play, so every flower counts the same. |
| `joker-exchange-timing-correction-contested` | 1 | "fix it before you discard" | Keep the timing and own-exposure sentences; replace the correction clause with owner-question language ("our instructor is confirming the League's current ruling on a joker exchanged for the wrong tile") or move it to a separate owner_question entry with source_ref citing MJME 2024 p24 #14 vs the 03/20/2024 League ruling. |
| `joker-exchange/sequencing-scope` | 1 | "you may, on your own turn, hand over the real tile" (the entry does not say WHEN in the turn) | Owner's call. If the router can send timing questions ("before I pick?", "when in my turn?") to joker-exchange-timing, nothing changes here; otherwise consider whether this entry's question_patterns should cede those phrasings so the more specific entry answers. |
| `jokers-basics` | 2 | "Jokers are wild tiles, and they are unique to American mahjong." | No rewording proposed (owner-approved). Owner may decide whether "unique to American mahjong" is acceptable shorthand or whether she prefers a narrower claim such as the joker being a hallmark of American play. |
| `jokers-basics-identical-scope` | 1 | "A joker can stand in for any tile inside a group of 3 or more, meaning a Pung, Kong, Quint, or Sextet." | Do not reword the owner-approved text. Consider a new research_verified entry (owner review required) stating that jokers cannot fill a group made of different tiles such as NEWS, a year, or a run of singles, since those are singles even though they sit together on the card. |
| `jokers-basics-unique-claim` | 1 | "Jokers are wild tiles, and they are unique to American mahjong." | Owner's call; no rewording proposed for an owner-approved entry. The defensible claim is that the joker is a signature feature of American mahjong, rather than found only there. |
| `jokers-group-of-three-scope` | 1 | jokers-basics: "any tile inside a group of 3 or more, meaning a Pung, Kong, Quint, or Sextet"; joker-in-pair: "Jokers only work inside groups of 3 or more: a Pung, Kong, Quint, or Sextet." | Optional: add a research-verified entry stating that a joker is never used in a group made of single, non-identical tiles such as NEWS, a year, or a run, even though such groups have 3 or more tiles; and tighten card-notation to say "identical tiles." Leave the two owner-approved batch entries as they are. |
| `last-tile-of-wall` | 3 | "If the last tile is drawn and no one has declared mahjong, the deal ends as a wall game and no one pays." | Rewrite sentence two: "If the last tile is drawn and discarded and no one declares mahjong on it, the deal ends as a wall game and, under League rules, no one pays." Optionally add house_note: "Some tables add a wall-game payment as a table courtesy; agree on it before the first hand." |
| `mahjong-in-error` | 2 | If you said mahjong but had not yet exposed any tiles, there is no penalty and you keep playing. ... After a false mahjong, play continues with the player to the right of the one who made the error. | Scope the last sentence to the dead-hand case: 'If the false mahjong makes your hand dead, play continues with the player to your right, unless another player can use that same discard for mahjong.' Or, to honor the owner_question contract, drop the positive rules and keep only the deferral. |
| `mahjong-in-error-house-note` | 1 | House note: If other players threw in their hands after the false call, ask your table how it settles that deal; the League's rulebook covers those payments. | Rewrite as deferral: 'If other players threw in their hands after the false call, the back of the League card covers who pays; our instructor is confirming the current wording before we publish it.' |
| `misnamed-discard` | 3 | Misnaming a discard carries its own League rules, and the consequence depends on whether anyone called the tile or declared mahjong based on the wrong name. | Trim to deferral-only wording, e.g. 'The League has a specific ruling for a misnamed discard. Our instructor is confirming the exact ruling before we publish it here; until then, ask your table to apply the League's rulebook rather than a table custom.' |
| `misnamed-discard/tournament-rules-conflict` | 1 | tournament-rules: 'each tournament director adds procedures of their own: timed rounds, a point system, and penalties for things like misnamed discards.' vs misnamed-discard: 'Misnaming a discard carries its own League rules'. | In tournament-rules, change the example to 'stricter penalties than the League's for things like a misnamed discard' or use a purely tournament example (timed rounds, score sheets, seating rotation). |
| `naming-discards` | 1 | "When your discard matches the tile discarded just before it, the League accepts saying same as well as naming the tile." | Reshape the second sentence so it does not mirror the article, e.g. lead with the option: Saying "same" is also accepted by the League for a discard that repeats the tile thrown right before yours. Put same in quotation marks either way. |
| `open-vs-closed` | 2 | "Closed hands, also called concealed hands, must be built from your own draws, with no calling to build groups" | Owner decision only. If the owner wants it covered without touching this entry, a separate small entry ("Can I exchange a joker while playing a concealed hand? Yes") sourced to NMJL Bulletin 2020 would close the gap. |
| `order-of-play` | 1 | On your turn you either draw the next tile from the wall or call the most recent discard, then you discard one tile face up and name it. | Optional: 'Any player may call the most recent discard; after a call, play continues to the caller's right, so players in between lose that turn. Unless the tile you draw or call completes your mahjong, you then discard one tile face up and name it.' |
| `passing-on-a-discard` | 1 | Once the next player has drawn and racked a tile, that discard is out of reach for everyone. | Change the last sentence to: 'Once the next player has drawn and racked a tile, or has discarded, that discard is out of reach for everyone.' Apply the same wording to calling-for-mahjong so the three entries agree. |
| `passing-on-a-discard-window` | 1 | passing-on-a-discard: "Once the next player has drawn and racked a tile, that discard is out of reach for everyone." | "Once the next player has drawn a tile and either racked or discarded it, that discard is out of reach for everyone." |
| `passing-on-a-discard-window-clause` | 1 | "Once the next player has drawn and racked a tile, that discard is out of reach for everyone." | Optional tightening, owner's call: 'Once the next player has picked and racked a tile, or discarded, that discard is out of reach for everyone.' Same simplification appears in calling-for-mahjong (outside this batch) if the owner wants both aligned. |
| `payments-basics` | 2 | A wall game pays nothing. | Extend house_note, e.g.: 'Some tables add their own bonuses, pay a small kitty on a wall game, or play for points instead of money; those are table customs, so agree on them before the first hand.' Optionally add 'Singles and Pairs hands, which cannot use jokers, do not get that double' after the jokerless sentence. |
| `payments-basics-source-ref` | 1 | source_ref: "League payment rules (discarder pays double, self-pick all pay double, jokerless doubles, wall game pays nothing); cross-checked via Mahj Life wiki articles 98 and 208" | Replace 98 with 97 and 151 for the payment multipliers and add 137 for the wall game; keep 208. |
| `picking-ahead` | 1 | if a tile was picked too early, stop and let the table sort it out before anyone else plays. | Replace the last clause with: 'stop play; an unracked tile goes back where it came from in the wall, and a tile that was racked or discarded makes the hand dead'. |
| `picking-ahead/source-ref-59` | 1 | source_ref: "cross-checked via Mahj Life wiki articles 59, 189, and 209" | Either drop 59 from the cross-check list or describe it as supporting the tile-return remedy only. |
| `players-count` | 1 | "Many groups adapt it when only 3 can play, but the standard game seats 4." plus house_note: "Adaptations for 3 players vary from table to table; agree on the format before you start." | Owner's call: house_note could say the League has an official 3-player format (no Charleston) and that anything beyond it is a table agreement; or add a research_verified 3-player entry limited to the settled points (Charleston omitted, four walls, 13/14 tiles). |
| `players-count-house-note-league-procedure` | 1 | house_note: "Adaptations for 3 players vary from table to table; agree on the format before you start." | Owner-approved text, so no rewording proposed; owner to decide whether to acknowledge that the League has an official three-handed procedure (no Charleston) alongside table adaptations. |
| `rules-source` | 1 | "Find My Mahj answers only from those rules as reviewed by our instructor" | Until owner review is complete, reword to: "Find My Mahj answers from those League sources; our instructor reviews every rule before it is marked confirmed, and where a review is still pending we say so." Consider whether a meta/policy entry belongs in the rules corpus at all rather than in site copy. |
| `source-title-template-on-non-rule-entries` | 1 | source_title "NMJL rule located and cross-checked through secondary research" on tournament-rules, blank-tiles, hand-choice-strategy, and rules-source | Give these entries a source_title that matches their classification, e.g. "House variation documented through secondary research", "Tournament convention documented through secondary research", "Instructional strategy, not a League rule", and "League publications as described on nationalmahjonggleague.org". |
| `tournament-rules` | 2 | "each tournament director adds procedures of their own: timed rounds, a point system, and penalties for things like misnamed discards" | Swap the example for something that is unmistakably tournament-only, e.g. "bonus points for jokerless hands or self-picked wins, and penalty points for throwing the winning tile", or phrase it as "their own penalty scale for situations the League also rules on, such as misnamed discards." |
| `two-players-same-tile` | 2 | "Saying hold or wait counts the same as saying call; the word you use does not change who has priority." | "Saying hold or wait is an accepted way to pause the game while you decide, but you still have to say call or mahjong to claim the tile. Who gets it is set by the League rule above, not by who spoke first or which word they used." and "...once another player has claimed it and racked it or exposed tiles." |
| `two-players-same-tile/paraphrase-264` | 1 | "the word you use does not change who has priority" and "A player who hesitates can lose the tile once another player has claimed it and racked it" | See the rewrite proposed on two-players-same-tile. |
| `wall-game` | 1 | house_note: "Tables differ on whether the same dealer deals again after a wall game." with varies_by_house: true on a standard_nmjl_rule entry. | Owner's call, since the entry is owner-approved: consider a house_note that names the League default (East passes to the right after a wall game) and labels keeping East as a table custom, or set varies_by_house to false so the model does not soften the rule. |
| `wall-game-house-note` | 1 | TS house_note on the wall-game entry (lib/rules/knowledge.ts, about line 586): "Tables differ on whether the same dealer deals again after a wall game." | Owner decision only: consider phrasing the note as "Under League rules the deal passes after a wall game; some tables let East deal again as a house rule." |
| `wall-game-house-note-dealer-default` | 1 | house_note: "Tables differ on whether the same dealer deals again after a wall game." | Owner-approved text, so no rewording proposed; owner to decide whether the house note should name the League default (deal rotates) before saying tables differ. |
| `wall-game-vs-last-tile-of-wall` | 1 | wall-game: "If the wall runs out of tiles before anyone declares mahjong, the hand ends with no winner." versus last-tile-of-wall: "The final tile drawn from the wall can still win for the player who draws it, and the last discard of the deal can still be called for mahjong." | Retrieval-level, not text-level: add a blocks entry on wall-game for last-tile and last-discard phrasing (LAST_OF_WALL minus the wall-game phrasing), or a requires on last-tile-of-wall so it outranks wall-game for those questions. |
| `xref-quint-sextet-exposure` | 1 | Cross-corpus (outside my batch, touching jokers-basics): exposures-basics says 'Only a Pung, Kong, Quint, or Sextet can be exposed, never a pair', calling-for-exposure says a call must make 'a group of 3 or more identical tiles: a Pung or a Kong', and calling-quints-sextets says the instructor is still confirming whether a discard may be called to complete a quint or sextet. | No change to my batch. Whoever owns exposures-basics / calling-for-exposure should make them agree with each other once the owner answers calling-quints-sextets. |

## Review needed

The 26 research-verified entries and 3 owner-question entries carry
`owner_review_required: true`. Approving one means setting `source: "owner_approved"`,
`provenance.source_type: "owner_approved"`, `owner_review_required: false`, and updating
`last_verified`.
