# Ask Find My Mahj: the shared rules core (2026-09-05)

The rules corpus, the retrieval and clarification engine, the card copyright guard, the
follow-up context, and the model framing contract are not written in this repository. They
live in the shared package **mahj-ask-core** (https://github.com/lasvegasmahj-maker/mahj-ask-core)
and this site carries a byte-identical copy under `lib/ask-core/`, pinned by
`ask-core.lock.json`. Las Vegas Mahjong carries the same copy. A rule the owner approves there
is approved here at the next sync.

- Behavioral contract both sites share: the core's `docs/ARCHITECTURE.md`.
- Change a rule or the engine: the core's `docs/UPDATE-PROCEDURE.md`. Never edit
  `lib/ask-core` here; `scripts/ask-core/ask-core-check.mjs` fails CI when a vendored file
  differs from the lock or when the sibling site's main is on a newer core version.
- Approve a pending answer: the core's `docs/OWNER-APPROVAL.md`.
- What only the owner can decide: the core's `docs/OWNER-RULE-ESCALATION.md`.
- Cross-site parity: `node scripts/ask-core/ask-parity.mjs --probes`.

## What stays in this repository

| Concern | Where |
|---|---|
| Brand and the directory hook (days, times, event types, teachers keep searches out of the rules engine) | `lib/ask-site.ts` |
| Directory search, result cards, suggestions, mixed rules-plus-search answers | `app/api/ask/route.ts`, `lib/ask-intent.ts`, `lib/ask-llm.ts` (intent extraction only) |
| The Anthropic adapter for the shared model contract | `lib/ask-model-client.ts` |
| The Ask UI (/ask thread, home card) | `app/ask/*`, `components/home/home-search-card.tsx`, `components/ask/answer-text.tsx` |
| Gap escalation sink (`outreach_events`, agent `ask-rules-gap`) and analytics | `app/api/ask/route.ts`, `lib/analytics/events.ts` |
| Site identity for the parity check | `app/api/ask/version/route.ts` |

## Request and response

`POST /api/ask` with `{ question, history?, clarify? }` (`q` is still accepted for the home
card). The response carries the shared fields (`kind`, `label`, `entry_id`, `followups`,
`clarify`, `evidence`, `year_note`) beside this site's `results`, `suggestions`, `intent`,
`topic`, and the `rules` block older clients read.

## Switches (Vercel project findmymahjgame, names only)

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | Turns on the shared conversational layer for rules answers and the directory intent extractor. Absent: fully deterministic. Not set on production as of 2026-09-05 (owner action). |
| `ASK_MODEL` | Optional model id override. Default `claude-haiku-4-5`. |
| `ASK_MODEL_DISABLED` | `1` switches the model off while Ask keeps working from approved text. |
| `ASK_DISABLED` | `1` switches Ask off: the API returns 503 with a pointer to the Events page. |
| `RATE_LIMIT_TEST_BYPASS` | Local only; ignored on Vercel. |

## Tests

- `tests/ask-core-site.spec.ts`: pure logic, runs in CI (`.github/workflows/ask-core.yml`).
- `tests/ask-rules-route.spec.ts`, `tests/ask.spec.ts`, `tests/homepage-search.spec.ts`,
  `tests/a11y-mobile.spec.ts`: need a running server with Supabase env; run locally against
  `PLAYWRIGHT_BASE_URL=http://localhost:3001` with `RATE_LIMIT_TEST_BYPASS=1`.
- The rules benchmark, held-out set, clarification and precedence specs moved into the core
  (`mahj-ask-core/tests`), where they run on every core change.
