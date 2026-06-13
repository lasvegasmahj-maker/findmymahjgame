# code-proposal: new /admin/today founder roll-up of all pending approvals (listings, inquiries, ambassadors, edits, and match drafts)

WHAT EXISTS TODAY (so the proposal does not duplicate it)
- /admin (app/admin/page.tsx) already has a banner counting pending listings, new inquiries, and new ambassador applications, plus tabbed approve/reject and a "Today's focus" tasks strip. It reads counts from /api/admin/data.
- /admin/edits (app/admin/edits/page.tsx + /api/admin/edits) is the only place claimer-proposed edits are reviewed.
- Match drafts have NO admin UI at all. The matcher cron (app/api/cron/matcher/route.ts) emails hello@findmymahjgame.com one approve/skip link per draft. If that email is buried, lost, or the founder is on her phone, there is no way to see or act on a pending match. The only "match" trace in /admin is a result banner after she clicks an email link (app/admin/page.tsx lines 215-227).

THE GAP / WHY IT HELPS LAUNCH
The founder-leverage ask is one place that surfaces ALL pending approvals (edits, claims, matches). Today they are scattered across /admin (3 surfaces), /admin/edits (1 surface), and email-only (match drafts, 0 UI surfaces). The riskiest is match drafts: launch depends on the matcher actually forming tables, and a missed approval email means real players sit unmatched with no recovery path. A single /admin/today page closes that and gives a 10-second "what needs me right now" view she can check from anywhere.

PROPOSAL (under 2 hours, low risk, no schema change, no new mutation code)
Two new files plus one 1-line nav link. The page is read-only aggregation; the only mutation it triggers is the match Approve/Skip, and that reuses the EXISTING audited /api/match/decide flow via signed action tokens (same tokens the cron email uses), so there is no new write path to review. Every Supabase read tolerates a not-yet-migrated table (mirrors the existing routes), so the page never blanks.

FILE 1 (new): /Users/shaunabruckman/Projects/findmymahjgame/app/api/admin/today/route.ts
Read-only GET, admin-session gated. Counts in parallel: player/venue/event pending_review, new inquiries, new ambassadors, pending_edits, and pending match_drafts. Resolves match-draft player names from play_requests in one query, and builds signed approve/skip URLs with signActionToken("match-approve"/"match-skip", draftId, 7) pointing at the existing /api/match/decide. Full file content was written to disk.

FILE 2 (new): /Users/shaunabruckman/Projects/findmymahjgame/app/admin/today/page.tsx
Client page using the same auth-probe pattern as /admin/edits. Shows a total ("N items waiting on you" or "all caught up"), six count cards linking to the existing review screens (/admin and /admin/edits), and a Match drafts section that lists each waiting draft with city, player names, preference, and inline Approve/Skip links to the existing confirm flow. Full file content was written to disk.

FILE 3 (1-line edit, applied): /Users/shaunabruckman/Projects/findmymahjgame/app/admin/page.tsx
Added a "Today" nav link (navy) as the first button in the admin header so the page is reachable.

VERIFICATION DONE
- npx tsc --noEmit: clean (exit 0).
- npx eslint on both new files: clean.
- Hard-rule scan on both new files: no em/en dashes, no emoji.

NOTES / OPTIONAL FOLLOW-UPS (not blocking launch)
- The page links the listing/inquiry/ambassador cards to /admin (not a pre-selected tab) because /admin holds tab state in React, not the URL. If wanted later, /admin could read a ?tab= query param so a card deep-links straight to the right tab. Left out to keep this low-risk.
- Approve/Skip on a match draft navigates to the existing /match/confirm screen (the GET on /api/match/decide intentionally never mutates; only the confirm form POST does), so a link prefetch or scanner cannot approve a match. This matches the existing email behavior exactly.
