# Sprint 4 Schema and Admin Workflows

For review. No SQL has been run and nothing is deployed to production. This covers what is needed so real data can populate the Teacher Directory, Ambassador Profiles, and (later) City Pages, plus the Need a Sub table.

## 1. SQL (prepared, not executed)

Three files in `supabase/`, run them in this order when approved:

1. `supabase/sub_requests.sql` - new `sub_requests` table for Need a Sub, with analytics fields.
2. `supabase/teachers.sql` - new `teachers` table for the real teacher directory.
3. `supabase/ambassador-profiles.sql` - adds profile fields to the existing `ambassadors` table.

All tables use row level security with no anon policies; reads and writes go through server routes using the service-role key, so contact details are never exposed to the public key.

## 2. Data model

### sub_requests (new)
- Identity: id, created_at.
- Request: city, state, day_of_week, time_of_day.
- Host (private): host_name, host_phone, host_email, note.
- Analytics: status (open, filled, expired, cancelled), players_notified, responses, filled_at, source, referred_by.
- Reporting it enables: total requests, fill rate (filled / total), time to fill (filled_at - created_at), demand by city, and requests or fills credited to an ambassador (referred_by).

### teachers (new)
- Identity: id, created_at, reviewed_at.
- Profile: name, city, state, website (public business site), contact (public channel only).
- Flags: is_ambassador, ambassador_id (optional link to an ambassadors row).
- Workflow: status (pending_review, published, flagged, rejected), slug (reserved for future teacher pages), notes (internal).
- The public directory reads only status = published.

### ambassadors (existing, extended)
- Added: slug (for /ambassadors/{slug}), bio, photo_url, referral_code (for example FMM-LV-RUTH), profile_status (draft, published).
- referral_code is the code an ambassador puts in their share link (/start?ref=CODE). The existing attribution rollup in /admin/metrics already groups tables by tables.referred_by, so codes flow straight into reporting.
- Public ambassador pages show only profile_status = published.

### How the pieces connect
- An ambassador can also be a teacher: teachers.ambassador_id links the two, and teachers.is_ambassador shows the badge.
- A city page (later) is "ready" when it has at least one published ambassador, one published teacher, and one real table in that city.
- referred_by ties tables and sub_requests back to an ambassador's referral_code for credit.

## 3. Admin workflows (built, preview only)

These admin tools are built and on the preview. They need the SQL above to be run before they can save or list real rows.

- Teachers: `/admin/teachers`
  - Add a teacher (name, city, state, website, public contact, ambassador flag). Admin-entered listings publish immediately.
  - Manage each row: Publish, Flag, Reject.
  - A launch-progress bar shows published teachers against the minimum of 20.
- Ambassador profiles: `/admin/ambassador-profiles`
  - Lists approved ambassadors. For each, set slug, referral code, photo URL, and bio.
  - Save as draft, then Publish when ready (publish requires at least a slug and a bio). Preview the public page link.
  - A launch-progress bar shows published profiles against the minimum of 10.
- Both pages link to the existing Metrics and Heat Map tools. All are protected by the admin login.

Need a Sub has no admin workflow in this sprint by request; only its SQL is prepared. When approved, the `/api/sub` route would write to sub_requests and the analytics fields would feed a future report.

## 4. Recommended launch criteria

Do not ship a public page until its data is real and meets the bar.

- Teacher Directory: at least 20 real, published teachers. Spread across the active states so the directory does not look empty when filtered.
- Ambassador Profiles: at least 10 active ambassadors with a published profile (slug, bio, photo, referral code).
- City Pages: only publish a city when it has all three present in that city: a published ambassador, at least one published teacher, and at least one real table. This keeps every city page genuinely useful and avoids empty pages.

Until these bars are met, keep the public Teacher Directory, Ambassador Profiles, and City Pages unshipped (they remain on the Sprint 4 preview branch). The admin can watch the launch-progress bars and tell us when each is ready.
