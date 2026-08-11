-- The inquiries table accepts direct anonymous INSERT through PostgREST. The anon key ships
-- in the browser bundle, so anyone can post rows straight to /rest/v1/inquiries and skip the
-- rate limiting, length clamps and email validation that the API route applies.
--
-- Every legitimate write already goes through a server route holding the service role key
-- (api/get-listed, api/advertise-inquiry, api/connect, actions/submit-inquiry), and the
-- service role bypasses RLS, so removing the anon grant changes no working behaviour.

drop policy if exists "Anyone can submit inquiries" on inquiries;
revoke insert on inquiries from anon;

-- player_listings keeps its anon INSERT because the restrictive policy added on 2026-06-10
-- forces status to pending_review, but the grant is still unnecessary: /api/list-my-game is
-- the only caller and it uses the service role.
revoke insert on player_listings from anon;
