# FMG rules truth-layer audit (2026-08-30)

Owner requirement: "There can never be a mahjong rule question that Find My Mahj simply cannot
answer. If the question does not contain enough information to answer accurately, Ask Find My
Mahj must ask for clarification. It must never guess." This record covers the audit of the
Ask Find My Mahj rules corpus, the clarification engine, the benchmark, and the questions that
remain for the owner. Source policy: docs/rules-sources.md.

## Summary

- Canonical rules audited: 49 entries in lib/rules/knowledge.ts (21 owner-approved, unchanged
  in wording; 24 written for this audit and research-verified against League rules; 4 open
  owner questions whose answers claim nothing beyond the supported core and say the instructor is confirming).
- Classification: 38 STANDARD NMJL RULE, 7 NMJL CLARIFICATION, 1 TOURNAMENT RULE,
  1 HOUSE/OPTIONAL RULE, 1 ETIQUETTE, 1 STRATEGY.
- Provenance coverage: 49/49 entries carry ruleset, topic, classification, source type,
  source title, cross-check reference, year where relevant, last-verified date, owner-review
  flag, and evidence status. No source text is stored.
- Owner review required: 28 entries (every entry the owner has not yet approved).
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
| `tile-count` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `suits` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `dragons` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `flowers` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `winds` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `jokers-basics` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `joker-in-pair` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `joker-exchange` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `dealing` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `charleston` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `open-vs-closed` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `closed-hand-final-tile` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-26 |
| `charleston-blind-pass` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-26 |
| `calling-discard` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-29 |
| `winning-mahjong` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `annual-card` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `the-wall` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `wall-game` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `players-count` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `courtesies-vs-rules` | ETIQUETTE | owner approved | Owner approval | 2026-08-29 |
| `dead-hand` | STANDARD NMJL RULE | owner approved | Owner approval | 2026-08-22 |
| `calling-for-mahjong` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League rule on calling any tile for mahjong; cross-checked via Mahj Life wiki article 178 and the owner-approved calling and closed-hand entries | 2026-08-30 |
| `calling-for-exposure` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League rules on exposures and commitment to a called discard; cross-checked via Mahj Life wiki articles 177, 178, and 289 | 2026-08-30 |
| `calling-for-pair` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League rule that a call is never made for a single or pair except for mahjong; cross-checked via Mahj Life wiki article 178 | 2026-08-30 |
| `joker-discarded` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League rule that a discarded joker may not be taken for any purpose; cross-checked via Mahj Life wiki articles 178 and 221 | 2026-08-30 |
| `joker-exchange-timing` | NMJL CLARIFICATION | research-verified (secondary_research), owner review pending | League rulings on joker exchange timing and correction; cross-checked via Mahj Life wiki articles 172, 221, and 224 citing NMJL bulletin Q&A | 2026-08-30 |
| `two-players-same-tile` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League rule on concurrent claims (mahjong first, then next in turn); cross-checked via Mahj Life wiki articles 264 and 281 and the owner-approved calling entry | 2026-08-30 |
| `own-discard` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League ruling that a player cannot claim their own discard; cross-checked via Mahj Life wiki article 245 | 2026-08-30 |
| `naming-discards` | NMJL CLARIFICATION | research-verified (secondary_research), owner review pending | League rule that discards are named; 2024 bulletin ruling accepting 'same' for a repeat discard, cross-checked via Mahj Life wiki article 242 | 2026-08-30 |
| `misnamed-discard` | NMJL CLARIFICATION | OPEN QUESTION for owner | Exact League penalty for a misnamed discard (corrected before or after another player acts on it) | 2026-08-30 |
| `mahjong-in-error` | STANDARD NMJL RULE | OPEN QUESTION for owner | Mahjong declared in error with tiles exposed: is the hand dead outright, or may the declaration be retracted with the exposed tiles staying committed (League rulebook 2024); secondary summaries disagree (Mahj Life wiki articles 189, 197, 216) | 2026-08-30 |
| `dead-hand-details` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League rules on dead hands and the wrong number of tiles; cross-checked via Mahj Life wiki articles 189 and 205 and the owner-approved dead hand entry | 2026-08-30 |
| `dead-hand-jokers` | NMJL CLARIFICATION | OPEN QUESTION for owner | May a joker in a dead player's exposure be exchanged, and does it matter whether that exposure is the one that made the hand dead | 2026-08-30 |
| `picking-ahead` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League rule against picking ahead; cross-checked via Mahj Life wiki articles 59, 189, and 209 | 2026-08-30 |
| `order-of-play` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League turn order (East, South, West, North, play to the right); cross-checked via Mahj Life wiki articles 170 and 239 and the owner-approved dealing entry | 2026-08-30 |
| `hand-size` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | Follows from the owner-approved dealing and winning entries; cross-checked via Mahj Life wiki article 205 | 2026-08-30 |
| `courtesy-pass` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League courtesy pass rule as already stated in the owner-approved Charleston and courtesies entries; cross-checked via Mahj Life wiki article 179 | 2026-08-30 |
| `charleston-stop` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League rule on stopping the Charleston (bulletins and the League rulebook); cross-checked via Mahj Life wiki articles 179 and 193 | 2026-08-30 |
| `passing-on-a-discard` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | Follows from the owner-approved calling entry (calling is a choice; the window closes when the next player racks) | 2026-08-30 |
| `payments-basics` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League payment rules (discarder pays double, self-pick all pay double, jokerless doubles, wall game pays nothing); cross-checked via Mahj Life wiki articles 98 and 208 | 2026-08-30 |
| `quints-sextets` | STANDARD NMJL RULE | research-verified (arithmetic), owner review pending | Follows from the owner-approved tile counts | 2026-08-30 |
| `calling-quints-sextets` | NMJL CLARIFICATION | OPEN QUESTION for owner | May a discard be called to complete a quint or a sextet, or only a pung or kong | 2026-08-30 |
| `exposures-basics` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League rules on exposures, modifying an exposure before discarding, and dead hands; cross-checked via Mahj Life wiki articles 177, 189, and 254 | 2026-08-30 |
| `card-notation` | NMJL CLARIFICATION | research-verified (secondary_research), owner review pending | Card legend conventions (colors as suits, C and X, F and D, Soap as zero); cross-checked via Mahj Life wiki articles 162, 254, and 269 | 2026-08-30 |
| `tournament-rules` | TOURNAMENT RULE | research-verified (secondary_research), owner review pending | Tournament conventions layered on League rules; cross-checked via Mahj Life wiki article 186 | 2026-08-30 |
| `blank-tiles` | HOUSE/OPTIONAL RULE | research-verified (secondary_research), owner review pending | Blanks as a house variation outside League rules; cross-checked via Mahj Life wiki article 279 | 2026-08-30 |
| `last-tile-of-wall` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | Follows from the owner-approved wall game and winning entries; the mahjong call on the last discard is the League's any-tile-for-mahjong rule, cross-checked via Mahj Life wiki articles 178 and 189 | 2026-08-30 |
| `rules-source` | NMJL CLARIFICATION | research-verified (secondary_research), owner review pending | The League's own description of its role and publications (nationalmahjonggleague.org) | 2026-08-30 |
| `hand-choice-strategy` | STRATEGY | research-verified (secondary_research), owner review pending | General instructional strategy, not a League rule; cross-checked via Mahj Life wiki article 183 | 2026-08-30 |

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
- tests/rules-truth-benchmark.spec.ts: 123 classified cases, each run through casing,
  punctuation, newline, smart-quote, and truncation variants; every entry reachable; corpus
  invariants (no source name, month, dash, or letter code; no conflicting rules; tournament,
  house, and strategy entries labeled as such; owner wording pinned).
- tests/rules-heldout.spec.ts: 76 blind cases written after the routing logic and the
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
8. Mahjong declared in error with tiles exposed: is the hand dead outright, or may the declaration be retracted with the exposed tiles staying committed (League rulebook 2024, p. 21)? Secondary summaries disagree, so entry mahjong-in-error now states only the supported core (no exposure means no penalty; play continues to the right) and says the instructor is confirming the rest.

## Independent truth-verification panel (2026-08-30)

A 21-agent adversarial panel (correctness refutation, conflation and classification, and
copyright boundary lenses over all entries, with two confirmers per blocker) found no
confirmed blocker. Its warnings on owner-approved wording are reported here for the owner,
unchanged in the corpus: jokers described as "unique to American mahjong" (other variants use
jokers); flowers "not numbered" (many sets print numbers or seasons that League play ignores);
the calling-discard house note credits "the card" for the calling window and marks the entry
as varying by table, while the window is a rulebook rule and only enforcement varies; the
wall-game and courtesies entries treat "same dealer deals again" and "how a wall game is
paid" as table customs, while the League's default is that the deal rotates and a wall game
pays nothing; the blind-pass sentence tracks the League's own phrasing closely. Two panel
findings led to corpus additions: a joker-in-mixed-groups entry (jokers never fill NEWS, a
year, or a run) and the resolution of calling-quints-sextets above.

## Review needed

The 24 research-verified entries and 4 owner-question entries carry
`owner_review_required: true`. Approving one means setting `source: "owner_approved"`,
`provenance.source_type: "owner_approved"`, `owner_review_required: false`, and updating
`last_verified`.
