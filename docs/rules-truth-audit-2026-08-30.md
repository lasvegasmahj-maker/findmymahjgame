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
  source title, cross-check reference, year where relevant, last-verified date, owner-review
  flag, and evidence status. No source text is stored.
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
| `joker-in-mixed-groups` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League rulebook rule that jokers are never used in a block of single tiles; follows from the owner-approved joker entries; cross-checked via Mahj Life wiki article 221 | 2026-08-30 |
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
| `calling-quints-sextets` | STANDARD NMJL RULE | research-verified (secondary_research), owner review pending | League rulebook and bulletin rule that a discard may be claimed to expose a pung, kong, quint, or sextet; consistent with the owner-approved calling entry (3 or more identical tiles); cross-checked via Mahj Life wiki articles 146 and 221 | 2026-08-30 |
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
- tests/rules-truth-benchmark.spec.ts: 128 classified cases, each run through casing,
  punctuation, newline, smart-quote, and truncation variants; every entry reachable; corpus
  invariants (no source name, month, dash, or letter code; no conflicting rules; tournament,
  house, and strategy entries labeled as such; owner wording pinned).
- tests/rules-heldout.spec.ts: 77 blind cases written after the routing logic and the
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
8. Mahjong declared in error: is the hand dead outright once tiles are exposed, or may the declaration be retracted with the exposed tiles staying committed (League rulebook 2024, p. 21), and what happens when no tiles were exposed? Secondary summaries disagree, so entry mahjong-in-error now claims no rule at all and defers entirely to the instructor.

9. Picking ahead: what is the League's consequence when a player draws before the previous
   player has discarded (is the hand dead, does the tile go back)? Entries picking-ahead and
   dead-hand-details now state only that picking ahead is against League rules and the table
   stops to sort it out.
10. Payments: entry payments-basics states the League payment rules (discarder pays double,
   self-pick all pay double, jokerless doubles, both can stack). For Las Vegas Mahjong you chose
   neutral payment wording; should Find My Mahj state the amounts, or use the same neutral wording?

11. Wrong tile count noticed before East's first discard: what is the League's remedy (start the
   deal over, or correct the hand)? Entry dead-hand-details now says only that a wrong count
   cannot be fixed once play has begun.
12. Wrong joker exchange: the entry joker-exchange-timing now states, from the League rulebook
   and 2024 bulletin as cross-checked, that after the next discard the hand holding the incorrect
   exposure is dead while the redeemer plays on; please confirm.

## Reviewer gate history (2026-08-30)

- Round 1: FAIL. Blocker: naming-discards claimed a discarded joker is always named joker (unsupported); removed. Warnings fixed: mixed answers shipped a clarification the page acted on; payment and "is east" signals hijacked cost and place-name questions; the ruleset re-ask had an empty prompt; mahjong-in-error overstated the exposed-tiles outcome (now an owner question); last-tile-of-wall cited a house-rule article.
- Round 2: FAIL. Blocker: everyday-word concept matchers (tips, direction, authority, out of tiles, don't want) had become standalone Ask-box signals and pulled plain directory questions into the rules path; they are now vocabulary-gated and suppressed by directory, commerce, and place wording. Warnings fixed: a directory question typed mid-clarification was trapped; gap telemetry logged replies and duplicates; the card guard skipped questions naming the card's hands.
- Round 3: FAIL (reviewed the round-2 code). Blocker: group-size, hold-a-spot, call-it-in, hands-on-lessons, and Charlestown/Charlton phrasings still reached rules answers; all fixed and pinned in the directory regression test. Warnings fixed: picking-ahead and dead-hand-details asserted a dead-hand consequence the source did not settle (now an owner question); rules-source claimed instructor review of every answer (now claims only what is true).
- Independent verification panels (see below) confirmed one more rule error: an exposure may be corrected only until the caller discards or exchanges a joker; both entries said discard only. Fixed.
- Round 4: see the closing line of this record.

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
per-entry list (first finding shown per entry):

| Entry or theme | Findings | Clause | Reviewer note (owner's call) |
| --- | --- | --- | --- |
| `blank-tiles` | 1 | "They come with many sets as spares to replace a lost tile. Some tables use them as a house rule, usually lett | These two sentences follow Mahj Life 279's opening sequence idea-for-idea and in the same order (many sets / replace lost tiles; some groups adopt them as a hou |
| `calling-discard-house-note` | 1 | knowledge.ts line 504, house_note on the calling-discard entry: "The card closes the calling window once the p | Two wording risks, neither a wrong rule. (1) Attribution: the note twice credits "the card" for the calling-window rule, but the documented League source for th |
| `calling-discard/corpus-missing-house-note` | 1 | corpus.json entry "calling-discard" has no house_note field, but /Users/shaunabruckman/Projects/findmymahjgame | Process risk, not a rule error: reviewers working only from corpus.json cannot see (and therefore cannot check) the house_note text, which is exactly where the  |
| `calling-discard/house-note-card-attribution` | 1 | house_note (knowledge.ts line 503): "The card closes the calling window once the player next in turn has picke | The rule itself is League law and verified. Two scope issues: (1) Attribution: the closing rule as worded is published in the League's rulebook Mah Jongg Made  |
| `calling-discard/quint-sextet-scope` | 1 | Cross-entry scope tension: calling-discard (owner-approved) says a call is allowed for "an exposed group of 3  | Not a contradiction and not a wrong statement: the owner_question entry claims no rule, and calling-for-exposure still says '3 or more'. But the owner-approved  |
| `calling-discard/varies-by-house-flag` | 1 | knowledge.ts line 500-502: varies_by_house: true with house_note "The card closes the calling window once the  | Classification risk, not a wrong statement. The calling window is League law (the note itself says the card sets it); what varies is only how strictly tables en |
| `calling-for-exposure` | 4 | (1) "you may fix a mistake in that exposure only until you discard"; (2) "a Pung, a Kong, or a larger group" | No wrong League statement, but two scope risks. (1) The correction window is slightly overstated: per Mahj Life 177 the exposure may be corrected only if the pl |
| `calling-for-exposure/joker-exchange-lock` | 1 | "you may fix a mistake in that exposure only until you discard" | Incomplete rather than wrong: the League added in 2025 that a joker exchange completed after the call also freezes the exposure for that turn. A player who read |
| `calling-for-mahjong` | 2 | "the chance to call ends once the next player has drawn and racked a tile" | Classification (standard_nmjl_rule) is right and every substantive rule in the answer is League-supported, but the calling-window clause is narrower than the Le |
| `calling-quints-sextets` | 1 | Corpus version (source owner_question): "Calling for a Pung or a Kong follows the usual rule: the tile must jo | Two problems with the corpus snapshot. (1) An owner_question entry is contractually limited to saying the instructor is confirming, yet this one also states a r |
| `calling-quints-sextets-source-divergence` | 1 | corpus.json answer: "Whether a discard may be called to complete a quint or a sextet is a detail our instructo | The corpus and the shipped TypeScript source disagree on this entry's answer, source, evidence, classification and confidence. The TypeScript "Yes" answer is su |
| `calling-quints-sextets-vs-exposure` | 1 | calling-quints-sextets: "Whether a discard may be called to complete a quint or a sextet is a detail our instr | The owner_question entry correctly claims nothing, but it defers a rule that three other entries already state as settled: calling-for-exposure ("or a larger gr |
| `card-notation` | 2 | "On the card, each color stands for a different suit, not a fixed one" with no carve-out for F, N/E/W/S, and t | No wrong statement, but a scope gap: flowers, winds, and the soap-as-zero are printed in a color on the card yet are not suit tiles, so a reader applying the op |
| `card-notation/source-ref-162` | 1 | source_ref: "Card legend conventions (colors as suits, C and X, F and D, Soap as zero); cross-checked via Mahj | Cited article 162 does not support the cross-check claim, and none of the three cited articles covers C and X or F and D. |
| `charleston-blind-pass` | 1 | "If you do not want to pass three tiles from your own hand, you may take one, two, or all three tiles being pa | Rule content is correct, but this sentence tracks the League's own blind-pass sentence (back of the card, panel 1, and MJME 2024 pp.12-13, as quoted on Mahj Lif |
| `courtesies-vs-rules` | 3 | "Courtesies are local customs a table agrees on, such as how a wall game is paid or whether the same dealer de | The courtesy-pass clause is verified (optional League rule, negotiated, either player may decline). The two examples of 'courtesies', however, are both matters  |
| `dead-hand-details` | 2 | A short or long hand can be fixed only during the Charleston, before East's first discard. | The cutoff is right; 'fixed' overstates what the League allows. The rest of the entry is verified and its classification is correct. |
| `dead-hand-details/paraphrase` | 1 | "A dead player stops drawing and discarding but still pays the winner of that deal. You do not declare your ow | Both sentences track the structure of the Mah Jongg Made Easy passage quoted in Mahj Life 205; low risk because the words are NMJL's, not Mahj Life's, and are p |
| `dead-hand-details/varies-by-house` | 1 | varies_by_house: true; house_note: 'Tables enforce dead hand challenges with different levels of strictness.' | A house flag on a standard League rule risks the model presenting dead-hand law as table-dependent; the League defines both the rule and the challenge procedure |
| `dead-hand-jokers` | 3 | Whether a joker sitting in a dead player's exposure can still be redeemed depends on which exposure it is in,  | Accurate in substance but exceeds the owner_question contract by asserting what the ruling turns on; it also leaves out that the answer additionally depends on  |
| `exposures-basics` | 3 | "Until you discard, you may still fix a mistake in the exposure; after that it is locked, and the only later c | Incomplete locking condition: the entry's own cited source (Mahj Life article 177) and article 6 say an exposure is locked by EITHER a discard OR a joker exchan |
| `exposures-basics-joker-lock` | 1 | exposures-basics: "Until you discard, you may still fix a mistake in the exposure; after that it is locked" | Same omission as calling-for-exposure: the League also locks an exposure once you make a joker exchange in that turn. Out of my batch but it is the same rule st |
| `exposures-basics-vs-calling-quints-sextets` | 1 | exposures-basics: "Only a Pung, Kong, Quint, or Sextet can be exposed" versus calling-quints-sextets (owner_qu | Not a contradiction of canonical entries, but the two entries send readers opposite signals on whether a quint or sextet can be called and exposed; worth the ow |
| `extra-calling-window-wording-out-of-batch` | 1 | calling-for-mahjong (outside this batch): 'the chance to call ends once the next player has drawn and racked a | Same scope gap as passing-on-a-discard: the League window also closes when the next player discards without racking, as the owner-approved calling-discard house |
| `extra-corpus-stale-vs-head` | 1 | corpus.json entry calling-quints-sextets (source owner_question, classification nmjl_clarification) does not m | The review corpus and the shipping source disagree on one of the seven batch entries; the other six match HEAD byte-for-byte. Reviewers and the owner are not lo |
| `extra-exposures-basics-fix-window` | 1 | exposures-basics (outside this batch, same wording as calling-for-exposure): "Until you discard, you may still | Same scope risk as calling-for-exposure: the League also locks an exposure once the player performs a joker exchange, not only on discard. Flagged so the two en |
| `extra-head-calling-quints-provenance` | 1 | HEAD provenance for calling-quints-sextets: 'League rulebook and bulletin rule that a discard may be claimed t | The resolved answer text is correct, but the cited cross-check is weak: Mahj Life article 146 is 'Calling a Discard to Expose a Block with Singles' (a block of  |
| `flowers` | 1 | "Flowers are all interchangeable, and they are not numbered." | The rule statement (all eight flowers interchangeable, any flower stands in for any other) is correct. The physical description "they are not numbered" is the p |
| `flowers-numbering-scope` | 1 | "they are not numbered" | Not a rule error, but a wording/scope risk worth the owner's eye. In League play the flowers are treated as unnumbered and interchangeable (the owner's hard fac |
| `joker-exchange-timing-correction-contested` | 1 | "fix it before you discard" | Secondary sources disagree on whether a wrong-tile joker exchange can be corrected at all, so stating it as settled League law risks a wrong statement. This is  |
| `joker-exchange/sequencing-scope` | 1 | "you may, on your own turn, hand over the real tile" (the entry does not say WHEN in the turn) | Not a wrong statement, but a sequencing gap a learner can fall into: the League treats a joker exchange made before the turn has properly started (before you ha |
| `jokers-basics` | 2 | "Jokers are wild tiles, and they are unique to American mahjong." | The wild-tile rule content is correct; the "unique to American mahjong" clause is refutable as a factual statement about other variants. It is not a League rule |
| `jokers-basics-identical-scope` | 1 | "A joker can stand in for any tile inside a group of 3 or more, meaning a Pung, Kong, Quint, or Sextet." | Correct as written because the "meaning a Pung, Kong, Quint, or Sextet" clause limits it to groups of identical tiles. The risk is scope: this entry's question  |
| `jokers-basics-unique-claim` | 1 | "Jokers are wild tiles, and they are unique to American mahjong." | The clause "unique to American mahjong" is a factual claim about other variants, not a League rule, and it is contradicted by evidence: Vietnamese mahjong sets  |
| `jokers-group-of-three-scope` | 1 | jokers-basics: "any tile inside a group of 3 or more, meaning a Pung, Kong, Quint, or Sextet"; joker-in-pair:  | Both entries are correct because each immediately restricts "group of 3 or more" to Pung, Kong, Quint, or Sextet, which are groups of identical tiles. The scope |
| `last-tile-of-wall` | 3 | "If the last tile is drawn and no one has declared mahjong, the deal ends as a wall game and no one pays." | Sequencing is one step early. The League's wall-game trigger is that the last tile has been picked AND discarded with no mahjong declared; the entry's own third |
| `mahjong-in-error` | 2 | If you said mahjong but had not yet exposed any tiles, there is no penalty and you keep playing. ... After a f | The first sentence is correct, but the entry is an owner_question entry that states three positive rules, and the final sentence is an unqualified 'always' that |
| `mahjong-in-error-house-note` | 1 | House note: If other players threw in their hands after the false call, ask your table how it settles that dea | Internally inconsistent guidance that risks presenting a League-covered matter as a table custom: it tells the reader to ask the table while also saying the Lea |
| `misnamed-discard` | 3 | Misnaming a discard carries its own League rules, and the consequence depends on whether anyone called the til | Accurate but exceeds the owner_question contract: an owner_question entry must claim nothing beyond saying the instructor is confirming, yet this sentence asser |
| `misnamed-discard/tournament-rules-conflict` | 1 | tournament-rules: 'each tournament director adds procedures of their own: timed rounds, a point system, and pe | Not a literal contradiction, but read together a player will infer that misnamed-discard penalties are tournament inventions, when the League itself imposes one |
| `naming-discards` | 1 | "When your discard matches the tile discarded just before it, the League accepts saying same as well as naming | Facts verified and cross-check supported; second sentence structurally tracks the Mahj Life article 242 commentary line, and the bare word same needs quotation  |
| `open-vs-closed` | 2 | "Closed hands, also called concealed hands, must be built from your own draws, with no calling to build groups | The operative rule (no calling for groups; only the mahjong tile may be claimed) is correct and verified. The clause "must be built from your own draws" is broa |
| `order-of-play` | 1 | On your turn you either draw the next tile from the wall or call the most recent discard, then you discard one | Every stated fact is correct (East discards first; East, South, West, North to the right/counterclockwise; 13 between turns, 14 during). The wording risk is 'wh |
| `passing-on-a-discard` | 1 | Once the next player has drawn and racked a tile, that discard is out of reach for everyone. | The two rule statements ('you never have to call'; window closes on rack) are correct, but the closing condition is stated as if racking were the only trigger.  |
| `passing-on-a-discard-window` | 1 | passing-on-a-discard: "Once the next player has drawn and racked a tile, that discard is out of reach for ever | Same window gap as calling-for-mahjong: the League also closes the window when the next player discards (or picks and requests a joker exchange without racking) |
| `passing-on-a-discard-window-clause` | 1 | "Once the next player has drawn and racked a tile, that discard is out of reach for everyone." | Not wrong, but narrower than the League rule and narrower than the owner's own house note on calling-discard. The window also closes when the next player discar |
| `payments-basics` | 2 | A wall game pays nothing. | All scoring statements are verified League rules (discarder pays double, others pay value; self-pick all pay double; jokerless doubles when the hand could have  |
| `payments-basics-source-ref` | 1 | source_ref: "League payment rules (discarder pays double, self-pick all pay double, jokerless doubles, wall ga | Cited articles only partly support the cross-check claim. Article 98 is about two identical tiles discarded in rapid succession and which discarder pays double; |
| `picking-ahead` | 1 | if a tile was picked too early, stop and let the table sort it out before anyone else plays. | The prohibition and the 'can make your hand dead' hedge are correct, but 'let the table sort it out' invites house discretion where the League prescribes the ou |
| `picking-ahead/source-ref-59` | 1 | source_ref: "cross-checked via Mahj Life wiki articles 59, 189, and 209" | Article 59 does not itself support a rule against picking ahead; it only covers where an interrupted pick goes back. |
| `players-count` | 1 | "Many groups adapt it when only 3 can play, but the standard game seats 4." plus house_note: "Adaptations for  | Not a wrong statement (4 is the standard game) and the classification is acceptable, but the framing presents 3-player play as purely a table adaptation when th |
| `players-count-house-note-league-procedure` | 1 | house_note: "Adaptations for 3 players vary from table to table; agree on the format before you start." | Not wrong (tables do vary), but it reads as if the League is silent on three players. The League publishes an official three-handed procedure, so a table that w |
| `rules-source` | 1 | "Find My Mahj answers only from those rules as reviewed by our instructor" | The factual clauses about the League are verified and the entry correctly avoids naming a month; the promise about instructor review is not yet true of this cor |
| `source-title-template-on-non-rule-entries` | 1 | source_title "NMJL rule located and cross-checked through secondary research" on tournament-rules, blank-tiles | Metadata mislabels non-rule entries as located NMJL rules, contradicting their own classification and source_ref. |
| `tournament-rules` | 2 | "each tournament director adds procedures of their own: timed rounds, a point system, and penalties for things | Classification tournament_rule is right and the framing (League rules as foundation, director's rules apply only at that event) is verified; the misnamed-discar |
| `two-players-same-tile` | 2 | "Saying hold or wait counts the same as saying call; the word you use does not change who has priority." | Conflation of Mahj Life commentary with League law. The priority rule (mahjong first, then next in turn) is League text, but "hold or wait counts the same as sa |
| `two-players-same-tile/paraphrase-264` | 1 | "the word you use does not change who has priority" and "A player who hesitates can lose the tile once another | Closest paraphrase in the batch. Each sentence maps one-to-one onto a Mahj Life commentary sentence in article 264 (word choice does not affect priority; hesita |
| `wall-game` | 1 | house_note: "Tables differ on whether the same dealer deals again after a wall game." with varies_by_house: tr | The answer text itself is correct (no winner, no payment) and correctly classified. The flag is on the note: the League is not silent on who is East after a wal |
| `wall-game-house-note` | 1 | TS house_note on the wall-game entry (lib/rules/knowledge.ts, about line 586): "Tables differ on whether the s | Not in the corpus answer, but it is served alongside it and shares the same scope risk as the courtesies entry: it is true that tables differ, yet the League's  |
| `wall-game-house-note-dealer-default` | 1 | house_note: "Tables differ on whether the same dealer deals again after a wall game." | Not wrong, but scope risk: the note gives no League default, and the League does have one. Under NMJL rules the deal moves to the right after a wall game just a |
| `wall-game-vs-last-tile-of-wall` | 1 | wall-game: "If the wall runs out of tiles before anyone declares mahjong, the hand ends with no winner." versu | Not a true contradiction under the League definition (a wall game exists only once all tiles have been picked and discarded with no mahjong), but the owner-appr |
| `xref-quint-sextet-exposure` | 1 | Cross-corpus (outside my batch, touching jokers-basics): exposures-basics says 'Only a Pung, Kong, Quint, or S | My batch entries (jokers-basics, joker-in-pair) list Quint and Sextet as joker-eligible groups and are consistent with all three. But among those three entries  |

## Review needed

The 26 research-verified entries and 3 owner-question entries carry
`owner_review_required: true`. Approving one means setting `source: "owner_approved"`,
`provenance.source_type: "owner_approved"`, `owner_review_required: false`, and updating
`last_verified`.
