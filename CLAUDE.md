# CLAUDE.md — Find My Mahj Game

## Hard Rules (read first, these override everything below)

Non-negotiable. When any other instruction conflicts with this section, this section wins.

### Writing style
- No em dashes or en dashes anywhere. Use commas, periods, semicolons, parentheses. Numeric ranges use an ASCII hyphen (5-7 days).
- Active voice, plain language, no jargon.
- No emojis unless explicitly asked.
- No code comments unless the WHY is non-obvious. Never comment WHAT the code does.

### Mahjong facts (Shauna is a certified instructor; never ship an error)
- An American Mahjong set has 152 tiles.
- The three suits are Bams, Craks, Dots.
- Dragons: Red = Crak, Green = Bam, White = Soap.
- Flowers are all interchangeable. They are not numbered. A flower is a flower is a flower.
- Jokers are wild tiles, unique to American Mahjong.
- The NMJL card releases every spring. Never say "March" or name a specific month.
- Each player starts with 13 tiles, except East (the dealer), who starts with 14.
- Set sizes are written as numbers: 2 = Pair, 3 = Pung, 4 = Kong, 5 = Quint, 6 = Sextet. Never use letter codes (no P, K, N).
- Open hands can call discards to build exposed sets. Closed hands must be built from your own draws, with no calling.

### Data honesty
- lib/states-data.ts is seed data. Never describe listings sourced from it as real players, groups, venues, or events. Do not state or imply counts ("47 players in Texas") drawn from seed data as if they were real.
- Every factual claim must trace to a source. If you cannot source it, do not publish it.

### No dead or hallucinated links
- Before shipping any external link, fetch it and confirm it loads (expect 200). This includes any advertiser-submitted URL (website, registration link, logo URL, social link).
- Never invent a URL, citation, statistic, or testimonial.

### Verify before publish
- All outbound content (pages, emails, JSON-LD schema) is cross-checked against its source before going live.

### Pre-push safety gate
- This repo pushes straight to main and Vercel auto-deploys, so there is no review between push and live. Before every `git push`, run the gate: `npx tsc --noEmit` clean, then the Technical and Brand reviewer workflows (.claude/workflows/), and only push if both pass. About 90 seconds after deploy, smoke-check the key routes for 200s. See the "Pre-push gate" section below.

## Posture

- Auto mode by default: execute, don't plan unless asked. Make reasonable assumptions and proceed end-to-end. Don't ask clarifying questions for routine decisions.
- After meaningful code changes, deploy 3 parallel verification agents with non-overlapping lenses (e.g., internal-routes, external-URLs, live-UX). Catches hallucinations and regressions.
- Prefer editing existing files over creating new ones. Don't create README, planning, or summary files unless asked.

## Code quality

- Typecheck before every commit. `npx tsc --noEmit` (or project equivalent).
- No premature abstractions. Three similar lines beats a generic helper for two callers.
- No defensive code for impossible cases. Validate at boundaries (user input, external APIs), not at every layer.
- Default to NO comments. Add one only when the WHY is non-obvious. Never explain WHAT the code does.
- No backward-compat shims for code being actively rewritten. Delete unused code; don't rename to `_unused`.

## Testing

Organize Playwright specs by lens, run on every push via GitHub Actions matrix:

- Critical flows (200s, sitemap, robots, 404s)
- Interactive flows (search/filter clicks at desktop AND mobile viewports)
- Forms (validation, submit handlers, success states)
- SEO metadata (title length, description length, canonical, schema markup)
- Auth + protected routes (anon redirects, 401/403 enforcement)
- Dynamic pages (sample first/middle/last entry per data source)
- API contracts (JSON errors not stack traces, security headers)
- Visual regression (bounding-box checks, elementFromPoint() overlay detection, hydration error capture)

Test as a real user (clicks, not just HTTP 200). Multi-viewport. Free-tier tools only by default (Playwright, GitHub Actions, Lighthouse).

## Security

- Service-role secrets are SERVER-ONLY. Never `NEXT_PUBLIC_*` for anything sensitive.
- Admin gating: server-side checks via allowlist email or session role. UI hide-button is convenience, not security.
- HMAC-signed tokens for one-click email actions (approval, unsubscribe). Timing-safe validation, 7-day TTL default.
- Rate limit public endpoints: 20 req/min per IP baseline.
- Secrets in chat = compromised. If a key gets pasted, ROTATE immediately.
- OAuth: keep basic auth (email/profile) in a separate Google Cloud project from sensitive-scope (Gmail, Drive). Sensitive scope drags the whole project into Google's verification queue.
- Security headers: CSP, HSTS, X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy.
- New user-facing surfaces (prompts, banners, OS permissions) ship flag-gated OFF by default until confirmed.

## AI / hallucination guards

When the project uses LLMs:

- System prompts forbid trivializing language ("easily", "guaranteed", "more than enough"). These trigger hallucinations.
- Runtime verifier: cheap second model (Haiku) audits each main response for hallucination markers. Persist to DB.
- Eval harness with golden Q/A cases. Must-contain and must-not-contain phrase lists. Run before deploy.
- Don't fine-tune unless prompt + tool use + RAG can't reach the target.
- Verify before publish: outbound AI content cross-checks claims against scraped + primary sources before going live.

## Process

- Feature branches, PR to main. NEVER push directly to main.
- Commit messages: WHY in the body, not WHAT.
- Auto-deploy on push creates preview URLs; verify the preview before merging.
- 3-agent verification on significant changes: parallel Explore agents, non-overlapping lenses, structured reports.
- Run typecheck + linter + tests before pushing. If any fail, don't push.

## Style

- NO em dashes (--). NO en dashes. Use commas, periods, semicolons, parentheses. Em dashes read as AI-generated.
- Numeric ranges use ASCII hyphen: `5-7 days`, not `5-7 days`.
- Active voice. State decisions directly.
- Plain language over jargon.

## Memory

Persistent memory across Claude sessions:

- Directory: `~/.claude/projects/<encoded-cwd>/memory/`
- Index: `MEMORY.md` (one line per memory, max ~150 chars)
- Per-topic files: `feedback_<topic>.md`, `user_<topic>.md`, `project_<topic>.md`, `reference_<topic>.md`
- Save corrections AND validated approaches. Save why, not just what.
- Don't save credentials, in-progress task state, or anything derivable from the repo.

## Don't add

- Backwards-compat layers I didn't ask for
- Observability libraries (Sentry, Datadog) unless asked
- Framework migrations
- Refactors adjacent to a bug fix

## When in doubt

Ask once, briefly. Then proceed with a reasonable default and tell me what you picked.
