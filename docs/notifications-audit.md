# Notifications Audit

Date: 2026-08-23. Branch: wd-notifications. Author: Worker D.

This audit covers the email infrastructure as it exists today: the send choke point, the tables behind it, and every call site that sends mail. It closes with a recommendation list for the lead. Findings are based on reading the code in this repo and querying the live Supabase project with the service role key (read only, no writes made during the audit).

## 1. Infrastructure inventory

### 1.1 The send choke point: `lib/email.ts`

`sendEmail()` is the single function that talks to Resend. Every route in the app calls it directly, or (going forward) calls `notify()` in `lib/notifications/notify.ts`, which itself calls `sendEmail()`. It:

- Checks `email_suppressions` before sending and silently drops suppressed recipients (fails open if the table is missing, so sends still work before that table exists).
- Strips emoji from subject lines.
- Wraps the HTML in a branded shell (navy header with the real logo image, pink bottom border, generic tagline footer) unless the caller passes `raw: true`.
- Logs one row to `email_sends` per call: `kind`, `recipients` (a count, not the addresses), `subject`, `ok`. It does not record who the email went to.
- Never throws. A Resend failure is caught, logged to the console, and returned as `{ ok: false, error }`.

### 1.2 The new ledger: `notifications_log` (from `supabase/migrations/2026-08-24-wave2-foundations.sql`)

This is the table `notify()` writes to. Unlike `email_sends`, it records the actual recipient email, the user id, the kind, the subject, a status (`sent`, `failed`, `skipped_qa`, `skipped_pref`), an error string, an optional related record, and `record_class`. Confirmed live: the table exists in the shared Supabase project and currently has 0 rows, because nothing calls `notify()` yet (grepped the whole `app/` and `lib/` trees for `notify(` outside of `notify.ts` itself; no hits).

### 1.3 Tables checked against the live database

Queried `information_schema` indirectly (a `select` against each table name, service role, distinguishing a real "table not found" error from an empty result):

| Table | Status live | Notes |
| --- | --- | --- |
| `email_sends` | Exists, 11 rows | Count-only send log described above. |
| `email_suppressions` | Exists, 1 row | Global suppression list, reused by the CRM (`2026-08-20-growth-crm.sql`) for unsubscribes and manual suppressions. |
| `notifications_log` | Exists, 0 rows | New Wave 2 ledger. Empty because no caller uses `notify()` yet. |
| `email_log` | Does not exist | This is the name I was asked to check for. It is not a table in this project; `email_sends` is the closest thing, and it is materially thinner (no recipient, no error, no status besides ok/not-ok). |
| `notification_preferences` | Does not exist | No preference store exists anywhere in the schema today. This matters for `lib/notifications/preferences.ts` (see that file): `checkPreference()` is a documented seam with nothing behind it yet, not a stub hiding a real table. |
| `user_notification_preferences` | Does not exist | Same as above. |

One quirk worth flagging so it does not cost anyone else an hour: a Supabase `head: true, count: "exact"` request against a table that does not exist returns `count: null` with no error, while a normal `select` against the same missing table correctly errors `PGRST205`. Use a real `select`, not a head count, to test table existence.

### 1.4 `notify()` and the taxonomy (`lib/notifications/notify.ts`)

Sixteen kinds across account, provider, and matching. Every send goes to `sendEmail()` (never `raw`), so it always gets the generic branded shell from `lib/email.ts` on top of whatever HTML the caller passes in. `lib/notifications/templates.ts` (this lane) supplies that inner HTML: a lighter content-level header and a kind-specific "why you got this" footer line, not a second full page shell, so the email does not end up with two competing page frames. There will still be two footer-like blocks in the rendered email (the generic `email.ts` tagline footer, and the notify-specific "you are receiving this because of activity on your account" line). That is an intentional trade-off given both `notify.ts` and `email.ts` are frozen contracts for this lane; the alternative is `notify()` passing `raw: true` and `templates.ts` owning the full page frame, which is a one-line change in `notify.ts` if the lead wants to collapse it to a single footer later.

One gap between the schema and the code: `notifications_log.status` has a check constraint that already allows `skipped_pref`, and the taxonomy comment in `notify.ts` implies preferences are wired in. They are not. The current `notify()` body only ever writes `sent`, `failed`, or `skipped_qa`. `checkPreference()` (this lane) exists as a seam but nothing calls it. Wiring `notify()` to call it and write `skipped_pref` is a one-line addition in `notify.ts`, left for whoever owns that file, because it is frozen for this lane.

## 2. Every `sendEmail()` call site

28 call sites across 20 route files, all still calling `lib/email.ts` directly. None of them use `notify()`. Grouped by whether the recipient is a real end user (transactional, candidate for the ledger) or an internal ops address (`hello@findmymahjgame.com`, out of scope for `notify()`, which is a user-facing ledger, not an ops-alert log).

### 2.1 User-facing transactional mail, not yet on the ledger

| File | Kind string today | Sends to | What it says | Taxonomy kind it matches |
| --- | --- | --- | --- | --- |
| `app/api/auth/signin/route.ts:66` | `auth-signin` | the signer-in | passwordless magic link | `account_signin_link`, exact match |
| `app/api/match/decide/route.ts:92` | `match-invite` | each invited player | "a table is forming, claim your seat" | `match_table_proposed`, exact match |
| `app/api/advertise-approve/route.ts:93` | `advertise-approve` | the advertiser | "your listing is approved" | `listing_status`, close match (advertising is Year 2 deferred per product decision, so this route is currently unlinked; lower urgency) |
| `app/api/get-listed/route.ts:180` | `get-listed-confirm` | the submitter | "we got your listing" receipt | no exact kind; closest is `listing_status` used as a receipt, or a new kind if the lead wants to distinguish "received" from "status changed" |
| `app/api/list-my-game/route.ts:84` | `player-listing-confirm` | the submitter | "we got your listing" receipt | same as above |
| `app/api/advertise-submit/route.ts:231` | `advertise-submit` | the submitter | "we received your listing details" | same as above; also Year 2 deferred |
| `app/api/lesson-inquiry/route.ts:65` | `lesson-inquiry` | the teacher (a provider) | "new lesson request from a player" | no matching kind; this is a lead notification to a provider, not an account-status message. Worth a conversation with the lead about whether providers get their own small taxonomy someday, but it is out of scope for v1 as defined. |
| `app/api/tables/claim/route.ts` (3 sends, lines 72, 99, 126) | `table-claim` | host, all seated players (bcc), or hello@ for phone-only tables | seat-joined nudge, "table is full, pick a spot" coordination email, phone-only manual-coordination alert | This is the legacy public share-link table system, a different code path from the Wave 2 account-based `tables`/`table_seats` schema described in the migration. It is the closest existing analog to `match_table_proposed` / `match_table_confirmed` / `match_seat_reopened`, and it is real, currently-live, user-facing mail. **This is the single highest-value migration candidate** once the account-based match system it will be replaced by is ready; see recommendations. |

### 2.2 User-facing but outside the current taxonomy on purpose

| File | Kind | Sends to | Why it stays off the ledger for now |
| --- | --- | --- | --- |
| `app/api/advertise-inquiry/route.ts:153` | `advertise-inquiry` | the inquirer | Business inquiry reply about advertising options, marketing/sales territory, not a transactional account message. Advertising is deferred to Year 2 per product decision. |
| `app/api/ambassadors/apply/route.ts:46` | `ambassador-apply` | the applicant | "thanks for applying" for an invite-only status program. No taxonomy kind exists for it; the Ambassador program has its own admin flow separate from the Community Leader / claims system this taxonomy targets. |
| `app/api/connect/route.ts:86` | `connect` / `cruise-connect` | a listing owner or player being contacted | Peer-to-peer message forwarding (one user reaching another), not a platform-initiated status notification. Forwards user-authored text, so it also should not go through a masked ledger the same way; flagging only, not touching this route. |

### 2.3 Internal ops mail, correctly out of scope for `notify()`

Everything below sends only to `hello@findmymahjgame.com` (or bcc's the founder alongside a user send already counted above). These are operational alerts, not user-facing account notifications, so they do not belong in a user-facing ledger:

`app/api/get-listed/route.ts` (admin copy), `app/api/notify/route.ts`, `app/api/advertise-inquiry/route.ts` (admin copy), `app/api/ambassadors/apply/route.ts` (admin copy), `app/api/notify-area/route.ts`, `app/api/list-my-game/route.ts` (admin copy), `app/api/want-to-play/route.ts`, `app/api/advertise-submit/route.ts` (admin copy), `app/api/subscribe/route.ts`, `app/api/cruise/post/route.ts`, `app/api/listing/confirm/route.ts`, `app/api/cron/ask-played/route.ts`, `app/api/cron/matcher/route.ts`, `app/api/claim/route.ts`.

### 2.4 Notable gap: the current claim flow sends nothing to the claimant

`app/api/claim/route.ts` is the live provider-claims MVP. When someone claims a venue or event listing, the only email sent is an internal alert to `hello@findmymahjgame.com`. The person who just claimed their listing gets no confirmation, no approval notice, no rejection notice, nothing. The four kinds this lane built templates for (`claimReceived`, `claimApproved`, `claimNeedsInfo`, `claimRejected`) cover exactly this gap. Wiring them in is Lane A's work (claims), not this lane's, per the ownership split, but it is the most user-visible hole this audit found.

### 2.5 Notable gap: account deactivation and deletion send nothing

`app/api/account/route.ts` handles `set_display_name`, deactivation, and deletion requests. None of the three send a confirmation email. `account_deactivated` and `account_deletion` are taxonomy kinds with no implementation anywhere yet, net new.

### 2.6 Notable gap: no billing mail exists yet

Grepped for any send related to membership or billing; there is none. `membership_billing_status` is entirely net new, which lines up with the billing model still being dark (no card at launch, per the founder's approved plan).

## 3. Transactional vs marketing

Every kind in `NOTIFICATION_KINDS` (`lib/notifications/notify.ts`) is transactional: account access, claim status, listing status, membership billing status, and match coordination. None of them are promotional. This is also the reasoning behind `lib/notifications/preferences.ts`: v1 has no blockable kind because nothing in the taxonomy is marketing.

The one marketing channel on the platform, the newsletter, is entirely separate: it signs users up to Mailchimp's "Las Vegas Mahjong" list through `/api/subscribe`, not through `sendEmail()` or `notify()`. `/api/subscribe/route.ts`'s own `sendEmail()` call is an internal ops alert telling the founder someone subscribed; it is not the subscription confirmation itself, Mailchimp handles that end of it.

## 4. Unsubscribe posture

- **Marketing (newsletter):** lives entirely in Mailchimp. Single opt-in by design (documented decision, not a bug). Mailchimp's own unsubscribe footer and suppression list apply; this repo does not need to build anything for it.
- **Transactional (everything in `NOTIFICATION_KINDS`):** no unsubscribe link, and none is needed. Every kind is a service message tied to something the user did (signed in, claimed a listing, got matched to a table, has a billing issue). CAN-SPAM and CASL both carve out transactional and relationship messages from the unsubscribe/consent requirements that apply to advertising. Nothing here crosses into promotional content, so there is nothing to add. `lib/notifications/preferences.ts` documents this reasoning next to `isTransactional()` so it does not have to be re-derived later.
- `email_suppressions` (the global suppression list `sendEmail()` checks) still applies underneath all of this: if an address hard-bounces or is manually suppressed, transactional mail to it silently drops rather than retrying forever. That is deliverability hygiene, not a consent mechanism, and it already works today regardless of `notify()`.

## 5. Recommendations for the lead

Ordered by user impact, not by size of the change:

1. **Wire the claims flow (`app/api/claim/route.ts`) through `notify()` using `claimReceived`.** Today a claimant gets silence. This is a one-call addition alongside the existing admin alert; templates are ready in `lib/notifications/templates.ts`.
2. **Build the actual approve/needs-info/reject actions for claims** (they do not exist as routes yet, only the initial claim submission does) and wire `claimApproved` / `claimNeedsInfo` / `claimRejected` through `notify()`. This closes the biggest hole this audit found.
3. **Migrate `app/api/auth/signin/route.ts` to `notify()` with kind `account_signin_link`.** Same content as today's `auth-signin` send, but it lands in the ledger, gets QA/`skipped_qa` handling for free (right now the route hand-rolls its own QA branch before calling `sendEmail`, which is fine, but duplicated logic), and shows up in the new admin notifications view.
4. **Migrate `app/api/match/decide/route.ts` to `notify()` with kind `match_table_proposed`.** Same reasoning as above; this is the cleanest 1:1 match between existing code and the new taxonomy.
5. **Decide the fate of the legacy `app/api/tables/claim/route.ts` share-link flow relative to the Wave 2 account-based matching schema.** Once account-based tables are live, its three sends (`table-claim` kind, seat-joined nudge, table-full coordination, phone-only alert) are strong candidates for `match_player_accepted`, `match_table_confirmed`, and a manual-ops path respectively. Until then it is real, live, user-facing mail with zero ledger visibility, worth knowing about even before migrating it.
6. **Wire `account_deactivated` and `account_deletion` into `app/api/account/route.ts`.** Right now a user can deactivate or request deletion of their account and receive no confirmation either way. This is a trust gap, not just an observability one.
7. **When billing ships, use `membership_billing_status` from day one** rather than a bespoke send; the template (`billingStatus`) is ready and waiting.
8. **Lower priority, product decision needed first:** `get-listed-confirm`, `player-listing-confirm`, and `advertise-submit`'s confirmation sends are all "we got it" receipts with no exact taxonomy kind. Either fold them under `listing_status` as a `received` state, or leave them off the ledger as pure UX niceties rather than account-status messages. Not urgent either way.
9. **Once two or more real kinds are live in the ledger and someone actually asks to opt out of a transactional message that should not be a marketing message,** revisit `lib/notifications/preferences.ts`; today `checkPreference()` is a documented no-op by design because it has nothing legitimate to block.
10. **Consider collapsing the double shell.** `notify()` always wraps through `sendEmail()`'s non-raw path (see 1.4). If the visual result (two footer blocks) is undesirable, the cleanest fix is having `notify()` pass `raw: true` and moving the full page frame into `lib/notifications/templates.ts`. That is a change to `notify.ts`, out of scope for this lane.

## 6. What this lane did not touch

Per the lane boundaries: no changes to `notify.ts`, `email.ts`, any claim route, match route, or `app/admin/page.tsx`. No schema changes. No call site listed above was rewired; this document is the list, not the migration.
