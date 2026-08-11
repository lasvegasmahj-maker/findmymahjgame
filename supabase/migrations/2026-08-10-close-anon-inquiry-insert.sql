-- The inquiries table accepts direct anonymous INSERT through PostgREST. The anon key ships
-- in the browser bundle, so anyone can post rows straight to /rest/v1/inquiries and skip the
-- rate limiting, length clamps and email validation that the API route applies.
--
-- Every legitimate write already goes through a server route holding the service role key
-- (api/get-listed, api/advertise-inquiry, api/connect, actions/submit-inquiry), and the
-- service role bypasses RLS, so removing the anon grant changes no working behaviour.
--
-- The policy name below is singular and must match supabase/migration.sql:139 exactly.
-- "drop policy if exists" succeeds silently on a name that does not exist, which would leave
-- the permissive policy in place behind the revoke.
drop policy if exists "Anyone can submit inquiry" on inquiries;
revoke insert on inquiries from anon;

-- player_listings keeps its restrictive pending_review policy as a safety net, but the anon
-- grant itself is unnecessary: /api/list-my-game is the only caller and it uses the service
-- role. Policy name matches supabase/migration.sql:123.
drop policy if exists "Anyone can create a player listing" on player_listings;
revoke insert on player_listings from anon;

-- promo_codes was readable from the browser with the public anon key, so dropping the filter
-- enumerated every redeemable code. /api/validate-promo now checks one submitted code with
-- the service role and returns only whether it is valid, so anon needs no access at all.
revoke select on promo_codes from anon;
