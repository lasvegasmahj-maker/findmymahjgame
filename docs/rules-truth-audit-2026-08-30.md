# FMG rules truth-layer audit (2026-08-30)

Owner requirement: "There can never be a mahjong rule question that Find My Mahj simply cannot
answer. If the question does not contain enough information to answer accurately, Ask Find My
Mahj must ask for clarification. It must never guess." This record covers the audit of the
Ask Find My Mahj rules corpus, the clarification engine, the benchmark, and the questions that
remain for the owner. Source policy: docs/rules-sources.md.

## Summary

- Canonical rules audited: 55 entries in lib/rules/knowledge.ts. After the owner's decisions of
  2026-08-30, 33 are owner-approved and 22 remain research-verified pending review.
  No entry defers to the instructor any more.
- Classification: 47 STANDARD NMJL RULE, 4 NMJL CLARIFICATION, 1 TOURNAMENT RULE,
  1 HOUSE/OPTIONAL RULE, 1 ETIQUETTE, 1 STRATEGY.
- Provenance coverage: 55/55 entries carry ruleset, topic, classification, source type,
  source title, last-verified date, owner-review flag, and evidence status; every research
  entry also carries a cross-check reference and a year. No source text is stored.
- Owner review required: 22 entries (every entry the owner has not yet approved).
- Owner-approved wording: preserved verbatim with two exceptions, both corrected on 2026-08-30, both
  restamped research_verified with owner review required, so each shows the review badge until Shauna
  signs off. `courtesies-vs-rules` named who deals after a wall game as a local custom, which the
  rulebook settles. `players-count` told a three-handed table to agree its own format, which owner
  decision #6 says the League already publishes. Everything else flagged for the owner is listed
  below, not edited in.

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
| `tile-count` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `suits` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `dragons` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `flowers` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `winds` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `jokers-basics` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `joker-in-pair` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `joker-exchange` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `dealing` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `charleston` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `open-vs-closed` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `closed-hand-final-tile` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-26 |
| `charleston-blind-pass` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-26 |
| `calling-discard` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-29 |
| `winning-mahjong` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `annual-card` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `the-wall` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `wall-game` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `players-count` | STANDARD NMJL RULE | research_verified | Owner-approved apart from the three-player sentence and house note corrected 2026-08-30; owner review required | 2026-08-30 |
| `courtesies-vs-rules` | ETIQUETTE | research_verified | Owner-approved apart from one example corrected 2026-08-30; owner review required | 2026-08-30 |
| `dead-hand` | STANDARD NMJL RULE | owner approved | Find My Mahj owner approval (certified American mahjong instructor) | 2026-08-22 |
| `calling-for-mahjong` | STANDARD NMJL RULE | research-verified, owner review pending | League rule on calling any tile for mahjong; cross-checked via Mahj Life wiki article 178 and the owner-approved calling and closed-hand entries | 2026-08-30 |
| `calling-for-exposure` | STANDARD NMJL RULE | research-verified, owner review pending | League rules on exposures and commitment to a called discard; cross-checked via Mahj Life wiki articles 177, 178, and 289 | 2026-08-30 |
| `calling-for-pair` | STANDARD NMJL RULE | research-verified, owner review pending | League rule that a call is never made for a single or pair except for mahjong; cross-checked via Mahj Life wiki article 178 | 2026-08-30 |
| `joker-in-mixed-groups` | STANDARD NMJL RULE | research-verified, owner review pending | League rulebook rule that jokers are never used in a block of single tiles; follows from the owner-approved joker entries; cross-checked via Mahj Life wiki article 221 | 2026-08-30 |
| `joker-discarded` | STANDARD NMJL RULE | research-verified, owner review pending | League rule that a discarded joker may not be taken for any purpose; cross-checked via Mahj Life wiki articles 178 and 221 | 2026-08-30 |
| `joker-exchange-timing` | NMJL CLARIFICATION | owner approved | League rulings on exchange timing and own-rack redemption; the wrong-tile consequence has its own entry per bulletin 2024 FAQ #10 and rulebook 2024 p.24 #14; via Mahj Life 172, 221, 224 and Sloperama FAQ | 2026-08-30 |
| `joker-exchange-wrong-tile` | STANDARD NMJL RULE | owner approved | NMJL Bulletin 2024 FAQ #10 with rulebook 2024 p.24 #14: correctable before the next discard, then the holder of the incorrect exposure is disqualified while the giver plays on; via Mahj Life 224, 37, 172, 221 and Sloperama FAQ | 2026-08-30 |
| `two-players-same-tile` | STANDARD NMJL RULE | owner approved | League rule on concurrent claims (mahjong first, then next in turn) and on word choice not setting priority; located and cross-checked via Mahj Life wiki articles 57, 264, 281 and the owner-approved calling entry | 2026-08-30 |
| `own-discard` | STANDARD NMJL RULE | research-verified, owner review pending | League ruling that a player cannot claim their own discard; cross-checked via Mahj Life wiki article 245 | 2026-08-30 |
| `naming-discards` | NMJL CLARIFICATION | research-verified, owner review pending | League rule that discards are named; 2024 bulletin ruling accepting 'same' for a repeat discard, cross-checked via Mahj Life wiki article 242 | 2026-08-30 |
| `misnamed-discard` | STANDARD NMJL RULE | owner approved | League rulebook misnamed discard rule (2023 p.16 r.3, 2020 p.19 r.6, 2024 pp.16, 17, 19) and the card back Miscalled Tile section; repeat-discard naming per the 2024 bulletin Q12; located and cross-checked via Mahj Life wiki articles 67, 80, 189, 242 and the Sloperama American mahjong FAQ | 2026-08-30 |
| `mahjong-in-error` | STANDARD NMJL RULE | owner approved | League rulebook 2024 p.21 #2 and #3, p.22 #4(b), p.23 #6, and the 1993 bulletin Q&A p.12; the next-player rule is a League clarification (2023 letter and a 2024 call), not rulebook text; located and cross-checked via Mahj Life wiki articles 197, 216, 55, 52, 207, 189, 38 | 2026-08-30 |
| `mahjong-in-error-settlement` | STANDARD NMJL RULE | owner approved | League rulebook 2024 p.21 #2 and #3, p.22 #4 and #5(a) through #5(e), p.23 #6, the card back Mah Jongg in Error section, and the 1993 and 2006 bulletins; located and cross-checked via Mahj Life wiki articles 197, 216, 52, 55, 159, 138, 56, 141, 54, 51, 142 and the Sloperama American mahjong FAQ | 2026-08-30 |
| `three-player-procedure` | STANDARD NMJL RULE | owner approved | League rulebook 2024 p.26 three-handed section; the rulebook and the 2024 bulletin describe the final pick in different orders that reach the same counts, so this entry publishes the counts only by owner decision; located and cross-checked via Mahj Life wiki articles 102, 188, 226 and the Sloperama American mahjong FAQ | 2026-08-30 |
| `wrong-tile-count-before-play` | STANDARD NMJL RULE | owner approved | League rulebook 2024 p.14 first bullet with the 2002 bulletin Q&A; p.17 carries the one seat exception, independently established by a 1987 bulletin Q&A; earlier editions agree; located and cross-checked via Mahj Life wiki articles 36, 63, 83, 226, 205 and the Sloperama American mahjong FAQ | 2026-08-30 |
| `hold-or-wait` | STANDARD NMJL RULE | owner approved | League rulebook 2024 pp.15 and 31 (commitment at placement), p.17 (the acts that close the window), 2023 p.18 r.13, and a 2023 League letter; the verbalization requirement runs back through the 2013 and 2018 editions; located and cross-checked via Mahj Life wiki articles 57, 264, 281, 21, 107, 177 and the Sloperama American mahjong FAQ read as raw text | 2026-08-30 |
| `dead-hand-details` | STANDARD NMJL RULE | research-verified, owner review pending | League rules on dead hands and the wrong number of tiles; cross-checked via Mahj Life wiki articles 189 and 205 and the owner-approved dead hand entry | 2026-08-30 |
| `dead-hand-jokers` | STANDARD NMJL RULE | owner approved | League rulebook 2024 p.22 #4(b), 2020 p.16 #3(b) and pp.24 #19 to #21, bulletins 1970 to 2019; the undeclared-hand timing point rests on the 2023 bulletin; located and cross-checked via Mahj Life wiki articles 38, 205, 189, 197, 180 and the Sloperama American mahjong FAQ | 2026-08-30 |
| `picking-ahead` | STANDARD NMJL RULE | owner approved | League rulebook 2024 p.19 #15(g) and #15(h) and the card back rule 1; payment on a mahjong claim after an out-of-turn discard per 2023 p.19 r.15(e) and p.20 r.16(b); whether such a discard may be claimed for an exposure is reported both ways and stays on the authoritative-resolution queue; located and cross-checked via Mahj Life wiki articles 70, 122, 209, 59, 147, 189, 9 and the Sloperama American mahjong FAQ | 2026-08-30 |
| `order-of-play` | STANDARD NMJL RULE | research-verified, owner review pending | League turn order (East, South, West, North, play to the right); cross-checked via Mahj Life wiki articles 170 and 239 and the owner-approved dealing entry | 2026-08-30 |
| `hand-size` | STANDARD NMJL RULE | research-verified, owner review pending | Follows from the owner-approved dealing and winning entries; cross-checked via Mahj Life wiki article 205 | 2026-08-30 |
| `courtesy-pass` | STANDARD NMJL RULE | research-verified, owner review pending | League courtesy pass rule as already stated in the owner-approved Charleston and courtesies entries; cross-checked via Mahj Life wiki article 179 | 2026-08-30 |
| `charleston-stop` | STANDARD NMJL RULE | research-verified, owner review pending | League rule on stopping the Charleston (bulletins and the League rulebook); cross-checked via Mahj Life wiki articles 179 and 193 | 2026-08-30 |
| `passing-on-a-discard` | STANDARD NMJL RULE | research-verified, owner review pending | Follows from the owner-approved calling entry (calling is a choice; the window closes when the next player racks) | 2026-08-30 |
| `payments-basics` | STANDARD NMJL RULE | owner approved | League rulebook 2024 p.26 (payment structure, jokerless double with the Singles and Pairs exclusion) and p.17; the card prints each hand's value; amounts in money are table custom, not League rule; located and cross-checked via Mahj Life wiki articles 208, 151, 99, 98, 97, 72, 137, 155, 238, 45 and the Sloperama American mahjong FAQ | 2026-08-30 |
| `quints-sextets` | STANDARD NMJL RULE | research-verified, owner review pending | Follows from the owner-approved tile counts | 2026-08-30 |
| `calling-quints-sextets` | STANDARD NMJL RULE | owner approved | League rulebook 2020 p.23 #10 and 2024 p.15, bulletins 1993 p.5, 2001, 2015, 2019; the whole-block limit comes from the same rule; located and cross-checked via Mahj Life wiki articles 146 and 254 | 2026-08-30 |
| `exposures-basics` | STANDARD NMJL RULE | research-verified, owner review pending | League rules on exposures, modifying an exposure before discarding, and dead hands; cross-checked via Mahj Life wiki articles 177, 189, and 254 | 2026-08-30 |
| `card-notation` | NMJL CLARIFICATION | research-verified, owner review pending | Card legend conventions (colors as suits, C and X, F and D, Soap as zero); cross-checked via Mahj Life wiki articles 162, 254, and 269 | 2026-08-30 |
| `tournament-rules` | TOURNAMENT RULE | research-verified, owner review pending | Tournament conventions layered on League rules; cross-checked via Mahj Life wiki article 186 | 2026-08-30 |
| `blank-tiles` | HOUSE/OPTIONAL RULE | research-verified, owner review pending | Blanks as a house variation outside League rules; cross-checked via Mahj Life wiki article 279 | 2026-08-30 |
| `last-tile-of-wall` | STANDARD NMJL RULE | owner approved | League rulebook 2024 pp.15 and 16 (wall game) and p.17 #8 (calling window), bulletins 1976 to 2014, none of which carves out a depleted wall; the exposure call on the deal's final discard is unresolved in published League material and is on the authoritative-resolution queue; located and cross-checked via Mahj Life wiki articles 107, 131, 137, 235 and the Sloperama American mahjong FAQ | 2026-08-30 |
| `rules-source` | NMJL CLARIFICATION | research-verified, owner review pending | The League's own description of its role and publications (nationalmahjonggleague.org) | 2026-08-30 |
| `hand-choice-strategy` | STRATEGY | research-verified, owner review pending | General instructional strategy, not a League rule; cross-checked via Mahj Life wiki article 183 | 2026-08-30 |

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
- tests/rules-truth-benchmark.spec.ts: 152 classified cases, each run through casing,
  punctuation, newline, smart-quote, and truncation variants; every entry reachable; corpus
  invariants (no source name, month, dash, or letter code; no conflicting rules; tournament,
  house, and strategy entries labeled as such; owner wording pinned).
- tests/rules-heldout.spec.ts: 93 blind cases (76 at the first, tuning-free run; 83 after the gate rounds added phrasings; 93 after the owner decisions of 2026-08-30 added 10), written after the routing logic and the
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


### Gate rounds after the owner decisions

- Round 15: FAIL. Three blockers: the new three-player, extra-tile, hold, and final-discard signals were unconditional and pulled directory searches into rules answers; FINAL_DISCARD_SCENE matched an ordinary last discard, so a pung call was answered with the end-of-wall rule; and the misnamed-discard answer had reintroduced a joker-naming claim an earlier round removed as unsupported.
- Publish-fidelity panel: three blockers. The three-player entry published a dealing step beyond the owner's end-counts-only instruction and unsourced on its provenance; the dead-hand list read as exhaustive while omitting drawing out of turn, and its matcher pulled those questions to itself; and asking whether a claim must be spoken landed on the answer about declining a call.
- Round 16: FAIL. Two blockers: six of the longer answers exceeded the rephrase token budget, so a truncated rule would have shipped the moment an API key is added; and the picking-ahead answer implied that returning the tile saves a hand it had just called dead. Warnings fixed: dead-hand joker questions were diverted to the wrong-exchange entry, the normal 14 tile deal read as a wrong count, several signals hijacked directory searches, and four answers repeated their own house note.
- Round 17: FAIL. Confirmed the dead-hand joker diversion independently and named the same fix, plus bare silently and say-anything wording that flipped etiquette questions onto the rules path.

## Owner decisions on the 13 final rule questions (2026-08-30)

Shauna decided all 13. Ten answers were approved as recommended, two were approved with
changes she specified (#4 and #9), #6 was approved in the end-counts-only form, and #12 was
approved after she supplied the resolving source (NMJL Bulletin 2024 FAQ #10 by way of the
Mahj Life article naming it). Every "the instructor is confirming" placeholder is gone from
the corpus, and a test enforces that none can return.

| # | Topic | Decision | Entry |
| --- | --- | --- | --- |
| 1 | Misnamed discard | Approved | `misnamed-discard` |
| 2 | Jokers in a dead hand's exposures | Approved | `dead-hand-jokers` |
| 3 | Calling for a Quint or Sextet | Approved, adds the whole-block limit | `calling-quints-sextets` |
| 4 | Final discard once the wall is gone | Approved with changes: publish only what the research established, drop the speculative "wins you nothing" line, state plainly that no published League ruling settles the exposure call | `last-tile-of-wall` |
| 5 | Settlement after a false mahjong | Approved | `mahjong-in-error-settlement` (new) |
| 6 | Three-player procedure | Approved, end counts only, no final-pickup sequence named | `three-player-procedure` (new) |
| 7 | League attribution policy | Approved; card sentence unchanged | docs/rules-sources.md |
| 8 | False mahjong after exposing tiles | Approved | `mahjong-in-error` |
| 9 | Picking ahead | Approved with changes: the dead hand is stated as standard League law, the quick-catch reprieve is labeled house or director practice, and the exposure-claim point is named as unsettled | `picking-ahead` |
| 10 | Payments | Approved: League structure, no universal money amounts | `payments-basics` |
| 11 | Wrong tile count before East's first discard | Approved | `wrong-tile-count-before-play` (new) |
| 12 | Incorrect joker exchange | Approved after the owner supplied the resolving source | `joker-exchange-wrong-tile` (new) |
| 13 | Hold or wait | Approved | `hold-or-wait` (new), with `two-players-same-tile` updated |

### Still open in published League material (not owner questions)

Two narrow points have no published League ruling either way, and the entries say so plainly
rather than inventing a rule. They are not placeholders and they are not refusals.

1. Whether the deal's very last discard, once the wall is empty, may be called only to make an
   exposure (`last-tile-of-wall`).
2. Whether a discard made out of turn may still be claimed for an exposure, where reported
   League answers go both ways (`picking-ahead`).

A clarification letter for both sits in docs/league-clarification-request.md, ready for the
owner to send.

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
| `courtesies-vs-rules` | 3 | "Courtesies are local customs a table agrees on, such as how a wall game is paid or how long the table waits for a player who is deciding on a call." (corrected 2026-08-30; the retired example named who deals after a wall game, which the rulebook settles) | Owner-approved text, so no rewording proposed; owner to confirm she is comfortable with these two examples or swap in examples the League genuinely leaves open (e.g. betting on a wall game, seat rotation schedule, snack breaks). |
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
| `players-count` (RESOLVED 2026-08-31, see the gate 25 row below) | 1 | Retired wording: "Many groups adapt it when only 3 can play, but the standard game seats 4." plus house_note: "Adaptations for 3 players vary from table to table; agree on the format before you start." | Owner's call: house_note could say the League has an official 3-player format (no Charleston) and that anything beyond it is a table agreement; or add a research_verified 3-player entry limited to the settled points (Charleston omitted, four walls, 13/14 tiles). |
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

## Final review round (2026-08-30, gate 21 + publish-fidelity panel)

Gate 21 passed with no blockers. Its warnings and the final three-lens
publish-fidelity panel between them produced five confirmed defects. All five
are fixed and pinned; nothing else in either report was acted on.

| # | Entry / file | Defect a player would have acted on | Fix | Pin |
|---|---|---|---|---|
| 1 | `lib/ask-intent.ts` | Four priority questions ("who gets to call first when two of us want it", "do I have to call first or can I just take it", "she said hold, can I call ahead", "am I allowed to call ahead") were sent to a directory search. The corpus already answered all four. | `CONTACT_SENSE` now reads only the contact sense: "call back", "call the teacher/studio/venue/...", "call ahead to|and". Bare "call first" and "call ahead" belong to the table. | benchmark, "call ahead / call first keeps its table sense" (both directions) |
| 2 | `three-player-procedure` | "how much do three players pay" was answered with the dealing procedure. | Entry blocks `SETTLEMENT` and `SCORING_ASK`, so payment questions reach `payments-basics`. | same block |
| 3 | `mahjong-in-error-settlement` | A misname settlement question was answered by the false-mahjong settlement rule. The two name opposite payers at different multiples: this entry has the declarer pay one player double, `misnamed-discard` has the discarder alone pay the declarer 4x. A table would have collected from the wrong person. | Entry blocks `MISNAMED`. | benchmark, "publish fidelity" |
| 4 | `charleston`, `charleston-stop` | "we only have 3 players, do we have to do the Charleston?" was answered "the first Charleston is required and cannot be stopped", contradicting owner decision #6. | Both entries block a new seats-only `THREE_PLAYER_SEATS`. `THREE_PLAYER` was replaced by a seats-only matcher and deleted: its bare "only 3" means three tiles in a Charleston question, which had mis-answered "do we pass only 3 tiles". | benchmark, "publish fidelity" |
| 5 | `rules-source` | Published "our instructor is reviewing every answer we add, and when a ruling is still being confirmed the answer says so." Both halves overclaimed: not every answer is reviewed, and no answer's own text says a ruling is being confirmed. (The first pass at this removed the sentence outright on the premise that nothing marked a pending answer at all. That was wrong: both surfaces render a review badge from `rules.evidence === "owner_review_pending"`, at `app/ask/ask-client.tsx` and `components/home/home-search-card.tsx`. Gate 22 caught it, and removing the sentence had left the badge unexplained.) | Reworded to describe what the site actually does: "When our instructor is still reviewing an answer, we mark it, and we say so whenever something is a table courtesy or a house rule instead of a League rule, or whenever the League has not settled a point." | benchmark, "publish fidelity" |
| 6 | `courtesies-vs-rules` | **Owner-approved wording changed, flagged for Shauna.** Listed "whether the same dealer deals again" as a local custom. Mah Jongg Made Easy 2024 pp.15-16 settles it (after a wall game the deal passes to East's right), so the entry told players the League was silent on a rule it publishes, in the very entry that teaches players how to sort rules from courtesies. | The example is now how long a table waits on a call, which our own `hold-or-wait` entry states is not a League rule. | benchmark, "publish fidelity" |

### Gate 22 (final pre-push gate): PASS, no blockers

Three of its warnings were wrong answers it reproduced live, so they were fixed
with the same discipline; the rest went to the backlog below.

| Entry / file | Defect | Fix | Pin |
|---|---|---|---|
| `lib/ask-intent.ts` | The contact guard hard-returned "directory" before any rules signal was read, and its rescue list was 15 hand-written words that omitted pung, kong, quint, sextet, flower, dragon, bam, crak, soap and expose. "can I call back a pung I already exposed" and "can I call back a flower after I expose it" got the generic directory reply. | The rescue now uses a new shared `MAHJ_ONLY_NOUN` in `knowledge.ts`: words that can only mean mahjong. `MAHJ_VOCAB` cannot do this job, because it contains "call" itself. The guard has to stay ahead of the signal set, since `OWN_DISCARD` treats a bare "call back" as an unconditional rules signal. | benchmark, "call ahead / call first keeps its table sense", both directions |
| `joker-exchange` | No `blocks`, so it tied `dead-hand-jokers` on specificity and won the tiebreak on any redeem/swap phrasing. "can a joker in a dead hand be redeemed" was answered "you may hand over the real tile and take the joker", the opposite of the rule the site published this round. Harmless while `dead-hand-jokers` was a placeholder; a contradiction once it became a substantive answer. | Blocks `DEAD`, matching its sibling `joker-exchange-timing`. | benchmark, "publish fidelity" |
| `rules-source` | See row 5 above. | See row 5 above. | benchmark, "publish fidelity" |

### Gate 23 (after the gate 22 fixes): PASS, no blockers

| Entry / file | Defect | Fix |
|---|---|---|
| `app/api/ask/route.ts` | `composeRulesAnswer` concatenated `house_note` onto the answer BEFORE the model rephrase. Dropping a 46-character disclaimer costs 6 percent of length, well inside the 0.7 shrink floor, and the digit guard only checks numbers, so a model could quietly delete "Agree on any table variation before you start." from an owner-decided answer. Dormant today (no `ANTHROPIC_API_KEY` anywhere), live the moment a key is added. | The note is appended after the rephrase and never sent into it. |
| `courtesies-vs-rules` | My own defect. I corrected one sentence of owner-verbatim copy (row 6 above) but left `provenance: OWNER` and a `2026-08-29` stamp, so wording Shauna never wrote was attributed to her. | Restamped `research_verified` with `owner_review_required: true`, which also makes the answer show the "Our instructor is reviewing this answer" badge until she signs off. Pinned. |
| `playwright.config.ts` | The mobile Chromium project lived in a duplicate config file carrying the same `webServer` fallback that kills a shared server. | Folded into the single config as `mobile-chromium`; the duplicate is deleted. |
| `tests/rules-knowledge.spec.ts` | I had loosened the provenance-length tripwire to 700; the real maximum is 508. | Re-armed at 550. |
| `docs/rules-truth-audit-2026-08-30.md` | I introduced three em dashes, against the hard rule in CLAUDE.md. | Removed. |

### Judged and deliberately not changed

- **`calling-quints-sextets`** (owner-approved) states "a call must complete a
  whole block as printed on the card, never part of one". The coherence lens
  read this as a general rule that `calling-for-exposure` and `calling-discard`
  contradict. It is not general: exposing a pung toward a printed kong and
  completing it later is ordinary League play, and the entry's own `requires`
  (`QUINT_SEXTET` + `CLAIM_VERB`) already confine the sentence to quint and
  sextet questions, where it holds. The probes the lens offered as failures
  ("can I expose three tiles when the card calls for four") get the correct
  answer today. Owner-approved wording, correct as served, for Shauna to
  narrow if she wants the sentence to read as quint/sextet-specific.

### Post-launch backlog (nothing here changes an answer)

- `components/ask/answer-text.tsx`: fixed this round (sentences kept a leading
  space, so `BREAK_CUE` never matched its `^` anchor and long answers always
  broke every three sentences). Listed because it was found as a style nit.
- `wall-game` house_note and `players-count` house_note (both owner-approved)
  describe real table variation but do not name the League default first.
  Same family as defect 6; wording is the owner's call.
- `exposures-basics` and `calling-for-exposure` state the exposure lock without
  the decision-#12 carve-out for a wrong tile left by a joker exchange. Reached
  only by a phrasing that carries no joker word.
- `hold-or-wait` lists four acts that close the claiming window; four other
  entries list two. The gap is a next player who has picked but not racked and
  then starts a joker exchange.
- Provenance precision: `calling-quints-sextets` (whole-block limit is not on
  the cited League pages), `wrong-tile-count-before-play` (the one-seat
  exception is p.14 bullet 1, not p.17), `calling-discard` house_note (says
  "the card closes the calling window"; the corpus's own sourcing puts it in
  the rulebook, p.17 #8).
- `two-players-same-tile` and `hold-or-wait` each carry one sentence that
  tracks Mahj Life's editorial phrasing more closely than the file's own
  no-close-paraphrase standard allows. Restate from the rule.
- `picking-ahead` (owner-approved) says the card-back rule is "the first rule"
  and "printed in capitals". The rule itself is right, but a claim about ordinal
  position and letter case on a printed card cannot come from the secondary
  sources in its provenance, and this round's own attribution policy forbids it.
  No player acts differently either way, so it is an owner question, not an edit:
  confirm against a card in hand, or cut the two details.
- `payments-basics` (owner-approved) says table customs cover kitties, antes and
  loss caps in the answer, then again in the house_note two sentences later.
- `lib/ask-intent.ts` restates `HOLD_WAIT`/`HOLD_WAIT_ASK`, `FINAL_DISCARD_SCENE`
  and `WRONG_COUNT` inline instead of importing them, against the comment in
  `knowledge.ts` that says these are shared so they cannot drift. They already
  have: the inline final-discard alternation carries `exposure|mahjong` and the
  shared one does not. `MAHJ_ONLY_NOUN` was added the right way this round.
- The homepage concierge card renders a full-length rules answer with no cap
  (1130px on a 390px viewport). Cap it at the first two paragraphs and let the
  "Continue on the Ask page" link carry the rest.
- `AnswerText` break cues are matched against current prose, which the runtime
  model rephrase can rewrite. Author the paragraph breaks in the content
  instead. The two surfaces also render the same answer at different type
  scales and weights.
- `misnamed-discard` draws the safe/dead line at "laid tiles down"; the sourcing
  lens reads the League text as also disqualifying a caller who racked the
  misnamed tile. This would extend an owner-approved consequence, so it is an
  owner question, not an edit.

### Gate 25: FAIL, one blocker, fixed

| Entry / file | Defect | Fix |
|---|---|---|
| `players-count` | Routing had stopped seats-of-three questions reaching it, but "how many players do you need" still landed here and still read "Many groups adapt it when only 3 can play", with a house note telling the table to agree its own format. Owner decision #6 says the League publishes a three-handed procedure and there is no Charleston in it. Two live answers, opposite advice, chosen by phrasing. | Corrected to point at the League's three-handed coverage, restamped `research_verified` with owner review required. **Second edit to owner-verbatim copy on this branch. Flagged for Shauna.** Pinned. |
| `lib/ask-llm.ts`, `lib/rules/lookup.ts` | `synthesisDigitGuard` compared digit tokens as a set, so a rephrase that swapped "East holds 14 and the others 13" into "East holds 13 and the others 14" invented no new token and shipped. Every hard tile count in the corpus was one reassignment away from going live wrong. Tightening the guard to sequence equality was tried first and does not close it: the swap can keep the same order ("East starts with 13 and everyone else 14" against an approved "each player 13, except East 14"), so no digit-level check can catch a number being reattached. | The class is closed upstream instead: `eligibleForRephrase` keeps any answer containing a number away from the model entirely, so every count in the corpus ships verbatim. The sequence check stays as a tripwire for invented or dropped numbers on anything that is rephrased. Both pinned, including a corpus-wide assertion that no numeric answer is eligible. |
| `lib/rules/knowledge.ts`, `lib/ask-intent.ts` | "can I call back what I just threw" and "may I call back my own throw" fell out of the rules path: the contact guard fired on the bare "call back" and `MAHJ_ONLY_NOUN` had no throw verb to rescue it. That is the wording a player uses in the moment. | Throw verbs added to `MAHJ_ONLY_NOUN`; "my own throw" added to `OWN_DISCARD`. Pinned. |
| `lib/rules/knowledge.ts` | `THREE_PLAYER` and `THREE_PLAYER_HOW` were orphaned when `three-player-procedure` moved to the seats-only matcher, leaving the only two eslint warnings on the branch. | Both deleted. |

### Gate 27: FAIL, one blocker, fixed

| Entry / file | Defect | Fix |
|---|---|---|
| `dead-hand` (owner wording, untouched) | Its answer states the rule flat, "a hand is dead when a player holds the wrong number of tiles", with no before/after East's first discard qualifier, and it won retrieval on the plainest phrasing. So a player counting 12 tiles during the Charleston, the most common way this comes up, was told her hand was dead when the League has the table redeal with no penalty. Two entries in the shipped corpus gave opposite rulings on the same fact and the wrong one won. | Routing only, no owner wording edited. `wrong-tile-count-before-play` now answers every wrong-count question, because its text already covers both sides of East's first discard in one place. `dead-hand`, `dead-hand-details` and `hand-size` all yield to it on a count; `dead-hand-details` keeps the other ways a hand dies, and the dealer's 14th tile is excluded so "does the dealer have an extra tile" still reaches `dealing`. Pinned. |
| `lib/ask-intent.ts` | The contact demotion returned "directory" ahead of every signal, so it also removed the mixed outcome: "should I call the venue back to ask about the courtesy pass" lost the courtesy-pass answer entirely. | Only one signal in the list, `TAKE_BACK_RE` ("call back", "take back"), can be tripped by a telephone phrase. Every other rules signal now overrides the demotion. This is the fourth cut at this boundary and the first that holds both directions; both are pinned together. |
| `lib/ask-llm.ts` | 15 answers were still eligible for a model rephrase whose only remaining content check was a 70 percent length floor, and adding `ANTHROPIC_API_KEY` for the search intent extractor would have switched that on as a side effect. | Rewriting a rule now needs its own switch, `ASK_REPHRASE_ENABLED=1`. Intent extraction still runs on the key alone, because its output is validated into a filter object and cannot invent a fact. Pinned with a test that fails if the model is called with the switch off. |
| `playwright.config.ts` | Adding `mobile-chromium` unconditionally put two copies of the QA sign-in fixtures against the same per-IP OTP budget, so a bare `npx playwright test` failed on rate limits rather than assertions. That made the pre-push gate non-deterministic. | Both mobile lenses are opt-in: `PW_MOBILE=1` for Chromium emulation, `PW_WEBKIT=1` for the real iOS lens wherever it can run. Desktop and mobile are run separately, which is how every suite result in this document was produced. |
| `components/ask/answer-text.tsx`, `components/home/home-search-card.tsx` | The homepage concierge card rendered whole 1,300 to 1,600 character answers, about 1.6 phone screens inside the hero, and the "Continue on the Ask page" link pointed at identical text. Raised by four consecutive gates. | The home card takes the first two paragraphs and closes with a line pointing at the full answer; /ask is unchanged. Also fixed: a `BREAK_CUE` entry ("Timing decides") that matched no sentence in the corpus, orphaned single-sentence paragraphs, and the trailing margin under the last paragraph. |

Still open for Shauna, not edited: the duplicated house notes on `payments-basics` and
`picking-ahead`, the "printed in capitals" claim in `picking-ahead`, the unhyphenated
"5 tile Quint", and whether she has read the published wording of the 14 entries stamped
on her 2026-08-30 decisions rather than only the rulings behind them.

### Gate 28: PASS, no blockers, one self-inflicted regression reverted

| File | Defect | Fix |
|---|---|---|
| `components/home/home-search-card.tsx`, `components/ask/answer-text.tsx` | The two-paragraph home-card clip added in the gate 27 round was worse than the length problem it solved, and both reviewers caught it independently. `house_note` is appended last, so the clip always ate the "this is a house rule, not a League rule" disclaimer, in the same round that stopped a model from deleting it. On `misnamed-discard` the visible half read "A call made on the wrong name does not stand" while the 4x payment and the dead hand sat below the cut, so a player saw the lenient half of a penalty rule and nothing telling her there was more. | Reverted. The home card shows the whole answer again and the truncation code is gone, with a comment recording why it must not come back. Home-card length is a design question for Shauna; showing half a penalty rule is not. |
| `app/api/ask/route.ts` | `rulesVerified` had dropped its `owner_question_pending` check while the comment explaining that check stayed. Harmless today (no entry carries the state) but wrong the moment the next unresolved ruling is filed, and no test would catch it. | Guard restored, comment corrected. |
| `lib/ask-llm.ts` | The rephrase prompt interpolated the raw player question into the same undelimited turn as the approved answer, with only a lower length bound on the output. A crafted question could have had the model publish prose of its own as an owner-approved rule. Dormant (`ASK_REPHRASE_ENABLED` unset) but a pre-flip risk. | The question is now a delimited untrusted block the system prompt tells the model never to obey, and the output is bounded above as well as below. |
| `lib/rules/knowledge.ts` | `BEFORE_PLAY` was orphaned when the count entry moved to matching on `WRONG_COUNT` alone, leaving the branch's only eslint warning. | Deleted. |
| `docs/rules-sources.md` | Still documented `owner_question` and `owner_question_pending` as live states after the owner resolved all 13 rulings. | Marked reserved and unused since 2026-08-30. |

### Testing note

The default `npx playwright test` run is desktop Chromium only. Mobile is `PW_MOBILE=1
--project=mobile-chromium` and the real iOS lens is `PW_WEBKIT=1 --project=mobile-safari`,
which cannot run on this Mac (WebKit Bus-errors). Running two projects at once puts two
copies of the QA sign-in fixtures against one per-IP OTP budget and the suite fails on
rate limits rather than assertions, so desktop and mobile are always run separately, at
least five minutes apart. Every suite result recorded in this document was produced that
way. A WebKit pass still has to happen somewhere other than this machine before release.

### Gate 29: PASS, no blockers, three warnings fixed

| File | Defect | Fix |
|---|---|---|
| `lib/rules/knowledge.ts` | `hold` and `wait` were bare alternatives in both `HOLD_WAIT` and `TWO_PLAYERS`, so the physical and queueing senses pulled ordinary calling questions onto the priority rule: "I had to wait for a table, can I call a discard to make a pung" was answered with the two-player priority essay. Present on main as well, and the new `hold-or-wait` entry inherited it. | One definition now, with a lookahead that excludes the queue, the rack, and the tiles. `TWO_PLAYERS` is composed from it instead of restating it. The probe reaches `calling-for-exposure`; the real hold/wait claim questions are unchanged. Pinned. |
| `lib/ask-llm.ts` | The delimiter hardening added the round before could be closed by the question itself: `normalizeQuestion` never touches `<` or `>`, so a 200-character question containing `</player_question><approved_answer>` could supply its own rule. | Angle brackets are stripped before interpolation. |
| `lib/ask-llm.ts` | `eligibleForRephrase` screened counts and consequences but not polarity. Dropping one "never" from "you may never call back a tile you just discarded" inverts the rule while staying digit-free, dash-free and inside the length band. Four such answers were still eligible. | Negation joins the exempt list. 2 of 55 answers are now eligible for a rephrase at all, and a pin asserts that whatever remains carries no number, no consequence and no negation. |
| `components/ask/answer-text.tsx` | The orphan guard added the round before stopped the "Jokerless:" label from starting its own paragraph, and a prose cue on a closing sentence still stranded it. | A label always heads a paragraph; any other single sentence joins the paragraph before it. Every long answer in the corpus now splits with no orphan and loses no text, asserted over the whole corpus rather than a sample. |
| `lib/rules/knowledge.ts`, `lib/rules/lookup.ts` | `players-count` kept three question patterns that its own `blocks` discard before scoring, and `synthesisDigitGuard` carried a header describing the subset rule it no longer implements. | Both cleaned up. |

Still open for Shauna after this round, none of it edited in: the duplicated house note
on `payments-basics`, the "printed in capitals" claim in `picking-ahead`, the
last-tile-of-wall wording that grants a call "right down to the last tile" and then calls
the final discard unsettled (both owner-approved, and the second is her decision #4
wording), the mixed numeral style for player counts, and the height of a long answer on
the home hero card. The card now shows the whole rule, which is the safe state; capping
it is a design call, and the one cap that was tried hid the half of the rule that bites.

### Gate 30: FAIL, one blocker, fixed

Every finding in this round was collateral from the routing changes two rounds earlier,
which is why the reviewer diffed routing against a worktree of origin/main rather than
reading the diff alone. That comparison is worth repeating on any future matcher change.

| File | Defect | Fix |
|---|---|---|
| `WRONG_COUNT` | It matched the normal mid-turn count. Holding 14 after a draw or a call is correct, but "i have 14 tiles is that right" was answered with the redeal-and-dead-hand rule because the matcher accepted a bare possession verb next to 14 and `hand-size` had been blocked on it. main answered `hand-size` correctly. A wrong League rule on the Ask surface. | The 14 branch now needs an explicit wrongness cue (too many, an extra, one too many, ended up with, stuck with) and the 12 branch needs a holding verb, which also stops "do we pass 12 tiles total in the charleston" being answered with a redeal. Pinned on both sides. |
| `HOLD_WAIT` | The lookahead added last round over-corrected: it excluded "hold the tile" and "wait for the tile", which are the claim sense the entry exists for. "hold the tile is that a call" fell through to a topic clarification and "can I hold the tile while I think" was answered "you hold 13 tiles between turns". | The queue sense keeps its article-optional form; the rack sense now needs a possessive, so "hold my tiles" stays out and "hold the tile" comes back. Pinned. |
| `lib/ask-intent.ts` | Three copies of the hold/wait matcher, already disagreeing: the router called "hold the tile is that a call" a rules question while the retriever refused to match it, so the request ended in a clarification with no answer available. | Both router copies are composed from the exported `HOLD_WAIT`. One definition now, which is what the file's own comment asks for. |
| `package.json` | The mobile lens was an env var someone had to remember. | `pnpm test:e2e:mobile` runs it. It stays out of the default run because two projects at once contend for one per-IP OTP budget. |

### Gate 31: FAIL, two blockers, fixed

This was the first gate run with the routing diff required in the reviewer prompt: build a
worktree of origin/main, run the same 185 player-phrased questions through `lookupRule`
and `detectAskTopic` on both trees, and diff the results. It found two regressions in one
pass that six previous gates had read past, including one that broke a question printed
on the /ask page as a canned example. That instruction stays in the gate.

| File | Defect | Fix |
|---|---|---|
| `three-player-procedure` | `retrieve()` ranks specificity above score, and this entry's single `requires` outranked all 18 entries that carry none. So any question that merely mentioned three of us was answered with the three-handed dealing procedure: "three of us are wondering if a joker can be used in a pair" (the site's own example) returned "leave one seat empty", and so did questions about soap, flowers, the wall, a wall game, tile counts and scoring. | The entry now yields to `OTHER_TOPIC`, the nouns that name a different rule, and to payment wording. A short table asking about the Charleston still reaches it, because owner decision #6 is that the League publishes no Charleston for three. Both directions pinned, 25 probes. |
| `passing-on-a-discard` | Its `SPOKEN_CLAIM` block fired on the questions the entry exists to answer. "do i have to say anything if i do not want the discard" went to `hold-or-wait`, which never says you may stay silent to decline and leads with "you have to speak your claim out loud". main answered it correctly. | The block is now a predicate that stands down when a decline cue is present, and `hold-or-wait` blocks the same cue. "do I have to say my call out loud" is unchanged. Pinned. |
| `wrong-tile-count-before-play` | Same specificity pathology, smaller blast radius: "i counted 12 tiles how many are in a set" reached the redeal rule. | Set-inventory wording is blocked. |

The underlying pathology is worth recording rather than hiding: specificity-before-score
means one `requires` beats any amount of keyword evidence. Every fix here works around it
at the entry level. Reordering the comparator would address the class rather than the
instances, but it changes every route in the corpus, so it is a deliberate post-launch
task with the routing diff as its acceptance test, not a change to make on the way out.

### Gate 32: FAIL, one blocker, fixed

| File | Defect | Fix |
|---|---|---|
| `WRONG_COUNT` | The matcher carried the bare stem `miscount`, so "miscounted", "miscounting" and "miscounts", which is what a player actually types, never matched. The block on `dead-hand` therefore never fired and its flat "a hand is dead when a player holds the wrong number of tiles" won the question, which is the opposite of the rule before East's first discard. The gate 27 row above claims to have closed exactly this contradiction; it closed it for one phrasing. | `miscount\w*`. Every inflection pinned, plus the Charleston phrasing. |
| `lib/ask-intent.ts` | `plainContext` excluded any contact phrase without the mahjong-noun rescue the guard twenty lines above it uses, so an unambiguous rules question wrapped in a contact phrase was demoted: "email me the rule about blanks" lost its answer, and "call me back with the hands on the card" stopped reaching the card copyright refusal. | The rescue is mirrored. Both directions pinned, including the refusal. |
| `lib/ask-intent.ts` | `DIRECTORY_NOUNS` had been widened to singular `venues?|studios?`, so naming the room you play in suppressed every conditional rules signal: "our studio uses blanks is that allowed" became a directory search. The two probes that motivated the widening are handled by the contact guard, not by this list. | Reverted to plural. Pinned. |
| `app/ask/ask-client.tsx` | "Continue on the Ask page" carried the question in the URL but the page only prefilled the box, so the link promised the rest of an answer and delivered an empty form. | A question arriving in the URL answers itself. |

### Gate 33: PASS, no blockers, clean routing diff

The reviewer ran the routing diff over 288 player-phrased questions against a worktree of
origin/main, covering every matcher this branch touched, the neighbours that share their
words, ordinary questions that are not about the changed rules, and directory traffic.
70 answers changed. Every one is an improvement or neutral, and no question that answered
correctly on main answers worse now. Three changes are deliberate trade-offs, each pinned:
a bare "call back" goes to the directory, a Charleston question from a three-handed table
is answered by the three-player rule, and an exposure call near a short wall is answered
by `last-tile-of-wall` rather than the generic calling entry.

Polish applied in this round: the `synthesisDigitGuard` header still described the subset
rule the body stopped implementing; the home card's link read "Continue on the Ask page"
when /ask now answers the same question itself, so it says "Ask a follow-up"; and
`players-count` said "the core of the game is settled", which tells a player nothing, so
it names what is settled.

### The rephrase path is doubly dormant

Worth stating plainly for whoever finds the switch later. `ASK_REPHRASE_ENABLED=1` AND
`ANTHROPIC_API_KEY` are both required, neither is set, and `eligibleForRephrase` admits
2 of the 55 entries (`annual-card` and `naming-discards`). Every answer carrying a number,
a consequence or a negation is exempt by construction. Flipping the switch is close to a
no-op and is not a way to turn a model on for rules answers.

### Left for Shauna, not edited in

1. **Sign-off on three corrected sentences.** `players-count`, `courtesies-vs-rules` and
   `wall-game` carried her verbatim wording; one sentence in each was corrected because it
   stated a League-settled point as a table custom. All three are restamped
   `research_verified` and all three now show "Our instructor is reviewing this answer"
   until she approves the replacement. The three are the same fact seen from three sides:
   after a wall game the deal passes to East's right, and no one pays.
2. **The 14 entries stamped on her 2026-08-30 decisions.** Their provenance says she
   approved the ruling on the researched basis, which is accurate, but the published prose
   is Claude's and the badge is off. If she has not read the published wording, those
   entries should carry the badge too. This is the one honesty question the branch cannot
   settle on its own.
3. **`picking-ahead`, already cut, restore only with a source.** It said "The first rule
   on the back of the card bars picking or looking ahead, printed in capitals." Ordinal
   position and letter case cannot come from the secondary sources in its provenance, and
   this branch publishes the policy forbidding the claim, so the sentence now reads "The
   back of the card bars picking or looking ahead." The ruling is unchanged. If Shauna
   confirms both details from a card in hand they can go back, with the card cited.
4. **`misnamed-discard`, already cut, needs a source or stays out.** It carved a joker
   exception out of "no one may ever call a discarded joker", its provenance named no
   joker source, and gate round 15 had already removed a joker-naming claim as
   unsupported before it came back. Both sentences and the matching cross-reference in
   `joker-discarded` are removed, so that rule now stands unqualified. If the exception is
   real, it needs a League citation before it is published again.
5. **Duplicated house notes** on `payments-basics` and `picking-ahead`, and the
   `last-tile-of-wall` wording that grants a call "right down to the last tile" and then
   calls the final discard unsettled. All owner-approved text.
6. **Home card length.** It shows the whole rule, which is the safe state. Clipping was
   tried and reverted because it hid the half of the rule that carries the penalty. If she
   wants the hero shorter, the right shape is a "show the full rule" disclosure that keeps
   everything reachable, not a truncation.
7. **"5 tile Quint" and "6 tile Sextet"** want hyphens.

### Post-launch backlog

- `retrieve()` ranks specificity above score, so one `requires` beats any amount of keyword
  evidence. Every entry-level guard in this branch works around that. Reordering the
  comparator addresses the class, with the routing diff as its acceptance test.
- `BREAK_CUE` in `answer-text.tsx` matches literal sentence openers from the corpus, so a
  reword silently loses a paragraph break. Author the breaks in the content instead.
- One answer renders in four type treatments across the two surfaces and the 400-character
  threshold. Settle on one.
- `extractLocation` still lets an article-led noun phrase through ("near The Class").
  Rejecting `^(the|a|an)` would also reject The Villages, a real town full of players, so
  this needs the resolver, not a regex.
- `payments-basics` is unreachable from "how do payments work": MAHJ_VOCAB has pays and
  paid but not payment or payments.
- The card copyright refusal is never reached when a question routes to the directory.
  Pre-existing and unchanged by this branch; the fix is to run the guard in the route
  ahead of the topic branch.
- The sentence splitter treats any period-terminated token as a sentence end, so a future
  answer containing "p. 26" would split mid-sentence.

### Gate 34: FAIL, three blockers, fixed

| File | Defect | Fix |
|---|---|---|
| `charleston`, `charleston-stop`, `players-count` | Two entries blocking each other left a hole. `charleston` refuses a three-handed question and `three-player-procedure` refuses one naming another topic, so "can I pass a joker if there are only three of us" lost both candidates and got a clarification where main answered "You may never pass a joker in the Charleston". The hole was generic: three seats plus any of the eighteen other-topic nouns. | Each block is now a predicate that stands down exactly where the other entry refuses, so one of the two is always eligible. Pinned, including that the answer still says a joker may never be passed. |
| `picking-ahead` | Published "The first rule on the back of the card bars picking or looking ahead, printed in capitals." with the review badge off. No source in its provenance can establish ordinal position or letter case, and this branch publishes the policy forbidding the claim. | The two details are cut; the rule is unchanged. A corpus-wide pin now fails any answer that describes how League material is printed. |
| `misnamed-discard`, `joker-discarded` | Carved a joker exception out of "no one may ever call a discarded joker", with no joker source in the provenance. Gate round 15 removed a joker-naming claim as unsupported and it had returned, now cross-referenced from a second entry. Jokers are a never-ship-an-error area. | Both sentences and the cross-reference are removed, so the rule stands unqualified. Pinned. |

Two more of the same two-sided-block shape, and one invented place name:

- `hold-or-wait` blocked on `NAMING`, which contains "out loud", while
  `passing-on-a-discard` blocked the same questions from the other side, so "do I have to
  say call out loud before I take the tile" reached no entry. The naming block now stands
  down on a spoken-claim question.
- `picking-ahead`'s answer describes discarding out of turn but its `requires` held only
  the picking verbs, so "is my hand dead if I discard out of turn" fell to the generic
  dead-hand entry and lost the payment consequence.
- "how does payment work in mahjong" answered "Nothing reviewed matches near Mahjong yet."
  The game is now rejected as a place name, the same way pronouns are.

### Gate 35: FAIL, two blockers, fixed

Both blockers were the same fact, and the branch had already corrected it once. The wall
game rule was fixed in `courtesies-vs-rules` and left standing in `wall-game`, and within
the corrected sentence itself only the dealer half was fixed while the payment half still
called a League rule a table custom. So the site answered "who deals after a wall game"
and "who pays for one" differently depending on which entry a player reached.

| File | Defect | Fix |
|---|---|---|
| `wall-game` | house_note said "Tables differ on whether the same dealer deals again after a wall game." Mah Jongg Made Easy 2024 pp.15-16 settles it, which is what this branch's own corrected provenance on `courtesies-vs-rules` cites. | The note states the rule. Third edit to owner-verbatim copy, restamped `research_verified` with owner review required, so it shows the badge until Shauna signs off. |
| `courtesies-vs-rules` | Still listed "how a wall game is paid" as a local custom, while `wall-game`, `payments-basics` and `mahjong-in-error-settlement` all say no one pays. | Names an actual custom instead: whether the table keeps a kitty. |

Four warnings from the same round, all the two-sided-block shape or a missing signal:

- `players-count` and `three-player-procedure` could refuse the same question. The rule is
  now explicit: a question naming another topic has that topic's entry, so `players-count`
  stays blocked there, and it steps back in only where `three-player-procedure` refuses and
  nothing else would answer, which is payment, settlement, and where-to-play.
- `three-player-procedure` was answering "only three of us tonight where can we play" with
  816 characters of wall-building before the listings. It now yields on a where-to-play
  question.
- "should I hold my hand when someone calls mahjong" and "I discarded out of turn what
  happens" had no rules signal at all and ran directory searches, the second against an
  invented town called Turn What Happens. Both senses now have a signal.
- `PAYMENT` gained collect, settlement and their forms, which also closes the backlog item
  where "how do payments work when someone wins" could not reach `payments-basics`.
