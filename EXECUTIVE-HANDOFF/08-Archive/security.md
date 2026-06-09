# Security — Find My Mahj Game

## Supabase Row Level Security (RLS)

All data access is controlled through PostgreSQL Row Level Security policies.

### Rule Principles

1. **Authenticated reads** — most collections require the user to be signed in
2. **Public reads for public content** — state pages, events, and venue listings are readable by anyone
3. **Write restrictions** — only admins or the owning user can write data
4. **No direct deletes from client** — deletions go through admin review

### RLS Policies

```sql
-- CONNECTORS (people/groups who host games)
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published connectors" ON connectors
  FOR SELECT USING (status = 'published');
CREATE POLICY "Owners can manage their connectors" ON connectors
  FOR ALL USING (auth.uid() = owner_id OR is_admin());
CREATE POLICY "Auth users can create connectors" ON connectors
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- CONNECTIONS (player-to-connector relationships)
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties can view their connections" ON connections
  FOR SELECT USING (auth.uid() = player_id OR auth.uid() = connector_id);
CREATE POLICY "Auth users can create connections" ON connections
  FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Parties can update connections" ON connections
  FOR UPDATE USING (auth.uid() = player_id OR auth.uid() = connector_id);

-- REFERRALS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties can view their referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Auth users can create referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);
CREATE POLICY "Only admins manage referrals" ON referrals
  FOR UPDATE USING (is_admin());

-- EVENTS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published events" ON events
  FOR SELECT USING (status = 'published');
CREATE POLICY "Owners and admins can manage events" ON events
  FOR ALL USING (auth.uid() = owner_id OR is_admin());

-- VENUES
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published venues" ON venues
  FOR SELECT USING (status = 'published');
CREATE POLICY "Owners and admins can manage venues" ON venues
  FOR ALL USING (auth.uid() = owner_id OR is_admin());

-- STATES (map data)
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view states" ON states FOR SELECT USING (true);
CREATE POLICY "Only admins manage states" ON states FOR ALL USING (is_admin());

-- SPONSORS
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sponsors" ON sponsors FOR SELECT USING (true);
CREATE POLICY "Only admins manage sponsors" ON sponsors FOR ALL USING (is_admin());

-- PRICING TIERS
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pricing" ON pricing_tiers FOR SELECT USING (true);
CREATE POLICY "Only admins manage pricing" ON pricing_tiers FOR ALL USING (is_admin());

-- INQUIRIES (contact form)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit inquiry" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins view inquiries" ON inquiries FOR SELECT USING (is_admin());

-- STATS
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stats" ON stats FOR SELECT USING (true);
CREATE POLICY "Only admins manage stats" ON stats FOR ALL USING (is_admin());

-- ADMIN HELPER FUNCTION
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### Authentication

- **Supabase Auth** handles sign-in
- Supported providers: Email/password, Google
- Admin users are stored in an `admins` table with `role = 'admin'`

### Next.js Security Headers

Configured in `next.config.ts`:
- **Content Security Policy (CSP)**
- **HSTS** (force HTTPS)
- **X-Frame-Options** (block iframes)
- **X-Content-Type-Options** (block MIME sniffing)
- **X-Powered-By** — disabled

### Sensitive Data

- **Never commit** `.env.local` — contains Supabase keys
- Supabase `anon` key is safe in client code — RLS policies protect the data
- Service role key stays **server-side only**
- Store third-party API keys in Vercel environment variables
