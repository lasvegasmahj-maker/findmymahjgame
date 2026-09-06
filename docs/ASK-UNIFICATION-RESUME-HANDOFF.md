# Ask cross-site unification: resume pointer (Find My Mahj Game)

Checkpoint 2026-09-05. This branch (`ask-shared-core-parity`, checkpoint 1f0943c, based on
cb87d4c, origin/main cb87d4c at checkpoint) is the Find My Mahj half of the shared Ask core
work. It is NOT merged and NOT deployed. All four launch gates stay OFF and `matcher_enabled`
stays false; nothing on this branch touches them or Stripe.

The canonical handoff lives in the shared core repository:

* Repository: https://github.com/lasvegasmahj-maker/mahj-ask-core (private), branch
  `ask-shared-core-parity`
* Local path: /Users/shaunabruckman/Projects/mahj-ask-core
* File: `docs/ASK-UNIFICATION-RESUME-HANDOFF.md` (plus `docs/ask-unification-checkpoint.json`)

Read that file first. What the next session must know about this repository:

* The vendored core under `lib/ask-core/` (lock `ask-core.lock.json`) came from a DIRTY local
  sync at core commit f68c5a5 and predates the core's current head. Re-sync from the core's
  tagged release before opening a PR: `cd
  /Users/shaunabruckman/Projects/findmymahjgame-ask-parity && node
  scripts/ask-core/ask-core-sync.mjs v1.0.0` (run from this directory, never from the core).
* `lib/ask-site.ts` holds the directory hook (`directorySignal` via `parseAskIntent`); FMG has
  no site override. `docs/ask-shared-core.md` explains the integration.
* Last targeted run here: `PLAYWRIGHT_BASE_URL=http://localhost:9 npx playwright test
  tests/ask-core-site.spec.ts --project=desktop-chromium` 63 passed, at an earlier core state.
  The route, homepage and a11y specs need a server on port 3001 with `RATE_LIMIT_TEST_BYPASS`
  and have not been re-run on this branch.
* Production deploys are CLI-only from a clean main checkout with the `.vercel` link (`npx
  vercel deploy --prod --yes`, run by the owner); a merge does not deploy. The production
  Vercel project has no `ANTHROPIC_API_KEY` (presence only; owner action item).
