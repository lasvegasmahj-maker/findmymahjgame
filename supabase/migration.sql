-- ═══════════════════════════════════════════
-- Find My Mahj Game — Database Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- PLAYER LISTINGS (free for players)
CREATE TABLE IF NOT EXISTS player_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL DEFAULT 'NV',
  skill_level text NOT NULL DEFAULT 'beginner',
  availability text,
  bio text,
  game_types text[] DEFAULT '{american}',
  contact_email text,
  avatar_color text DEFAULT '#e91e8c',
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- VENUE LISTINGS (paid)
CREATE TABLE IF NOT EXISTS venue_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  venue_type text NOT NULL DEFAULT 'restaurant',
  city text NOT NULL,
  state text NOT NULL,
  address text,
  description text,
  website text,
  phone text,
  contact_name text,
  contact_email text NOT NULL,
  tier text NOT NULL DEFAULT 'starter',
  stripe_payment_id text,
  status text NOT NULL DEFAULT 'published',
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- EVENT LISTINGS (paid)
CREATE TABLE IF NOT EXISTS event_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  event_type text NOT NULL DEFAULT 'open_play',
  city text NOT NULL,
  state text NOT NULL,
  venue text,
  address text,
  description text,
  event_date timestamptz,
  end_date timestamptz,
  price text DEFAULT 'Free',
  registration_url text,
  contact_name text,
  contact_email text NOT NULL,
  tier text NOT NULL DEFAULT 'local',
  stripe_payment_id text,
  status text NOT NULL DEFAULT 'published',
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- BRAND/ADVERTISING LISTINGS (paid)
CREATE TABLE IF NOT EXISTS ad_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  placement text NOT NULL DEFAULT 'sponsored_card',
  description text,
  website text,
  logo_url text,
  target_states text[],
  contact_name text,
  contact_email text NOT NULL,
  tier text NOT NULL DEFAULT 'basic',
  stripe_payment_id text,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  status text NOT NULL DEFAULT 'published',
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz DEFAULT now()
);

-- INQUIRIES (from contact + advertise forms)
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  inquiry_type text NOT NULL DEFAULT 'general',
  interest text,
  message text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ADMIN USERS
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

-- Insert Shauna as admin
INSERT INTO admins (email, role) VALUES ('jason@boldxtalent.com', 'admin') ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════

-- Player listings: anyone can read published, anyone can create
ALTER TABLE player_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published players" ON player_listings FOR SELECT USING (status = 'published');
CREATE POLICY "Anyone can create a player listing" ON player_listings FOR INSERT WITH CHECK (true);

-- Venue listings: anyone can read published, admins manage
ALTER TABLE venue_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published venues" ON venue_listings FOR SELECT USING (status = 'published');

-- Event listings: anyone can read published
ALTER TABLE event_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published events" ON event_listings FOR SELECT USING (status = 'published');

-- Ad listings: anyone can read published
ALTER TABLE ad_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published ads" ON ad_listings FOR SELECT USING (status = 'published');

-- Inquiries: anyone can submit
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit inquiry" ON inquiries FOR INSERT WITH CHECK (true);
