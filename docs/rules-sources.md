# Ask Find My Mahj: rules sources and provenance

Owner requirement (2026-08-30): there can never be an American mahjong rules question that
Find My Mahj simply cannot answer. If a question does not carry enough information to answer
accurately, Ask Find My Mahj asks one targeted clarification. It never guesses.

## Source hierarchy

1. Owner-approved canonical Find My Mahj rule decisions (`source: "owner_approved"` in
   `lib/rules/knowledge.ts`). The owner is a certified American mahjong instructor. These
   answers are never reworded by research; a credible conflict is reported to the owner, not
   edited in.
2. Primary National Mah Jongg League material that can be lawfully referenced: the League's
   current rule guidance, its rulebook Mah Jongg Made Easy, its bulletin questions and
   answers and rulings, and the instructions printed on the current card. No card hands, line
   values, or card text are ever reproduced.
3. Mahj Life (https://mahjlife.com/) as a strong secondary research source, especially where
   it identifies the underlying League ruling, bulletin, or rulebook page.
4. Other reputable American mahjong instructional sources, for corroboration only.

A tournament rule, a house rule, or another mahjong variant never overrides a standard League
rule. Each entry is classified so the site can say which kind of rule it is giving.

## Mahj Life: approved for research, with a copyright boundary

Mahj Life publishes its educational material under
Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 (CC BY-NC-ND 4.0)
and marks its names as trademarks. Its Terms of Use page says CC BY-NC 4.0 "unless otherwise
noted" while the site footer says CC BY-NC-ND 4.0; this policy follows the stricter footer
license either way. Find My Mahj is a
commercial site, so:

- Mahj Life is used for research, verification, source discovery, and cross-checking only.
- No Mahj Life prose is copied or closely paraphrased into Find My Mahj. Every answer is
  written independently, in this site's own words, from the rule itself.
- Where Mahj Life cites a League ruling, bulletin, rulebook page, or card instruction, the
  entry's provenance names the League source; the Mahj Life article number is recorded as
  the cross-check reference only.
- No scraper republishes Mahj Life content. Research is done by a person reading the page.
- Provenance metadata holds titles, article numbers, and years, never source text.

## Provenance structure

Every entry in `lib/rules/knowledge.ts` records:

| Field | Meaning |
| --- | --- |
| `ruleset` | Always `american_nmjl`. |
| `topic` | Short player-facing topic name. |
| `classification` | `standard_nmjl_rule`, `nmjl_clarification`, `tournament_rule`, `house_optional_rule`, `etiquette`, or `strategy`. |
| `source` | `owner_approved`, `research_verified`, or `owner_question` (an unresolved ruling filed for the owner; the answer says the instructor is confirming it and claims no rule). |
| `provenance.source_type` | `owner_approved`, `nmjl_primary`, `secondary_research`, or `arithmetic`. |
| `provenance.source_title` | Which source class the rule was located in (no source text). |
| `provenance.source_ref` | Cross-check reference, for example the League publication and the Mahj Life article number used to locate it. |
| `provenance.source_year` | Year of the source or ruling where relevant. |
| `last_verified` | Date the entry was last verified. |
| `provenance.owner_review_required` | `true` for every entry the owner has not yet approved. |
| `provenance.evidence` | `verified` (owner-approved), `owner_review_pending` (research-verified, awaiting the owner), or `owner_question_pending` (an open owner question). |
| `varies_by_house` / `house_note` | Marks table-to-table variation without softening the League rule. |

Tests enforce the structure: `tests/rules-knowledge.spec.ts` (well-formed entries, hard
mahjong facts, provenance rules), `tests/rules-truth-benchmark.spec.ts` (every case answers
correctly or clarifies; every entry is reachable; corpus invariants), `tests/rules-clarify.spec.ts`
(the clarification engine), and `tests/ask-rules-route.spec.ts` (multi-turn clarification
through the real Ask route and the real /ask page).

## Clarification engine

`lib/rules/clarify.ts`. A rules question missing one deciding fact enters a clarification turn:

- `call-purpose`: "Can I call that tile?" asks whether the tile makes an exposure or completes mahjong.
- `hand-type`: a call-for-a-group question about "my hand" with no C or X context asks which the card shows.
- `ruleset`: a question naming another mahjong style asks whether the player means American mahjong.
- `tournament`: a rules question set inside a tournament asks whether standard League play or the tournament's rules are meant.
- `pass-context`: a bare "Can I pass?" asks whether it is Charleston passing or passing on a discard.
- `topic`: a rules question that matches no entry is offered the closest topics; the scrubbed
  topic is logged for the owner the moment that clarification is shown, and a "Something else"
  reply gets the honest gap answer without a second log entry.

The server keeps no state. The response carries the clarification id and the original
question; the client sends both back with the reply (typed or clicked). Obvious questions
are never interrogated: a question that already carries the fact is answered directly.

## Adding or changing a rule

1. Locate the League rule (hierarchy above). If it cannot be resolved confidently, add an
   `owner_question` entry whose answer says the instructor is confirming it, and file the exact
   question in the audit record.
2. Write the answer in this site's own words. No dashes, no month names, no letter set codes,
   numbers for set sizes, the hard mahjong facts in CLAUDE.md.
3. Fill in classification and provenance; new entries carry `owner_review_required: true`.
4. Add benchmark cases (held-out phrasings, not the matcher's own words) and run the four
   rules specs plus the reviewer gate before merging.
