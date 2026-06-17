// Demo / preview data. Shown ONLY when DEMO_MODE=1 (a private preview build),
// never on the live site. This lets the founder see a fully populated site.
// To remove the whole preview: delete this file and the `DEMO` branches that
// import from it (grep for "demo-data"). Nothing here is real.

export const DEMO = process.env.DEMO_MODE === "1";

type DemoEvent = {
  id: string;
  event_name: string;
  event_type: string;
  city: string;
  state: string;
  venue: string | null;
  address: string | null;
  description: string | null;
  event_date: string | null;
  end_date: string | null;
  price: string | null;
  registration_url: string | null;
  host: string | null;
  day_time: string | null;
  frequency: string | null;
  beginner_friendly: boolean | null;
  confirmed_active_at: string | null;
  tier: string;
  created_at: string;
};

const CA = "2026-06-01T00:00:00Z"; // confirmed-active stamp (recent)
const ON = "2026-01-01T00:00:00Z"; // created_at

export const demoEvents: DemoEvent[] = [
  { id: "demo-e1", event_name: "Scottsdale Morning Mahjong", event_type: "open_play", city: "Scottsdale", state: "AZ", venue: "Civic Center", address: null, description: "Friendly weekly open play. All levels welcome, bring your card.", event_date: null, end_date: null, price: "Free", registration_url: null, host: "Desert Tiles Club", day_time: "Wednesdays 10am", frequency: "weekly", beginner_friendly: true, confirmed_active_at: CA, tier: "free", created_at: ON },
  { id: "demo-e2", event_name: "Scottsdale Spring League", event_type: "league", city: "Scottsdale", state: "AZ", venue: "Civic Center", address: null, description: "Spring season league play, eight weeks, prizes for top tables.", event_date: null, end_date: null, price: "Free", registration_url: null, host: "Desert Tiles Club", day_time: "Thursdays 6pm", frequency: "weekly", beginner_friendly: false, confirmed_active_at: CA, tier: "free", created_at: ON },
  { id: "demo-e3", event_name: "Arizona Desert Classic", event_type: "tournament", city: "Phoenix", state: "AZ", venue: "Phoenix Convention Center", address: null, description: "Annual one-day tournament. NMJL rules, lunch included.", event_date: "2026-10-03", end_date: null, price: "$60", registration_url: "https://example.com", host: "AZ Mahjong Association", day_time: null, frequency: "once", beginner_friendly: true, confirmed_active_at: null, tier: "free", created_at: ON },
  { id: "demo-e4", event_name: "Sedona Fall Mahjong Retreat", event_type: "retreat", city: "Sedona", state: "AZ", venue: "Enchantment Resort", address: null, description: "Three-day retreat in the red rocks. All levels. Lodging and meals included.", event_date: "2026-10-15", end_date: "2026-10-18", price: "$395", registration_url: "https://example.com", host: "Red Rock Retreats", day_time: null, frequency: "multi_day", beginner_friendly: true, confirmed_active_at: null, tier: "free", created_at: ON },
  { id: "demo-e5", event_name: "Boca Raton Sunday Morning Mahj", event_type: "open_play", city: "Boca Raton", state: "FL", venue: "Boca Raton JCC", address: null, description: "Weekly Sunday morning open play. Intermediate and advanced. Coffee provided.", event_date: null, end_date: null, price: "$5 suggested donation", registration_url: null, host: "Boca Mahj Circle", day_time: "Sundays 9am", frequency: "weekly", beginner_friendly: false, confirmed_active_at: CA, tier: "free", created_at: ON },
  { id: "demo-e6", event_name: "Naples Snowbird Open Play", event_type: "open_play", city: "Naples", state: "FL", venue: "Naples Community Center", address: null, description: "Seasonal open play for winter residents. Newcomers paired with regulars.", event_date: null, end_date: null, price: "Free", registration_url: null, host: "Gulf Coast Mahjong", day_time: "Tuesdays 1pm", frequency: "weekly", beginner_friendly: true, confirmed_active_at: CA, tier: "free", created_at: ON },
  { id: "demo-e7", event_name: "South Florida Championship", event_type: "tournament", city: "Fort Lauderdale", state: "FL", venue: "Marriott Harbor Beach", address: null, description: "Two-day championship with cash prizes. Advance registration required.", event_date: "2026-11-07", end_date: "2026-11-08", price: "$95", registration_url: "https://example.com", host: "Sunshine Mahjong League", day_time: null, frequency: "once", beginner_friendly: false, confirmed_active_at: null, tier: "free", created_at: ON },
  { id: "demo-e8", event_name: "Dallas Tuesday Tiles", event_type: "open_play", city: "Dallas", state: "TX", venue: "Preston Hollow Clubhouse", address: null, description: "Casual weekly game. Beginners welcome, lessons before play.", event_date: null, end_date: null, price: "Free", registration_url: null, host: "Big D Mahjong", day_time: "Tuesdays 10am", frequency: "weekly", beginner_friendly: true, confirmed_active_at: CA, tier: "free", created_at: ON },
  { id: "demo-e9", event_name: "Lone Star Mahjong Tournament", event_type: "tournament", city: "Austin", state: "TX", venue: "Austin Convention Center", address: null, description: "Statewide tournament, all skill brackets. Proceeds to local charities.", event_date: "2026-09-12", end_date: null, price: "$50", registration_url: "https://example.com", host: "Texas Mahjong Society", day_time: null, frequency: "once", beginner_friendly: true, confirmed_active_at: null, tier: "free", created_at: ON },
  { id: "demo-e10", event_name: "Houston Heights League", event_type: "league", city: "Houston", state: "TX", venue: "Heights Community Hall", address: null, description: "Ten-week competitive league with a season finale.", event_date: null, end_date: null, price: "$40 season", registration_url: null, host: "Bayou Tiles", day_time: "Mondays 6:30pm", frequency: "weekly", beginner_friendly: false, confirmed_active_at: CA, tier: "free", created_at: ON },
  { id: "demo-e11", event_name: "Manhattan Lunchtime Mahjong", event_type: "open_play", city: "New York", state: "NY", venue: "92nd Street Y", address: null, description: "Midtown weekday game for working players. Drop in on your lunch break.", event_date: null, end_date: null, price: "$10", registration_url: null, host: "NYC Mahjong Collective", day_time: "Fridays 12pm", frequency: "weekly", beginner_friendly: false, confirmed_active_at: CA, tier: "free", created_at: ON },
  { id: "demo-e12", event_name: "Long Island Charity Classic", event_type: "tournament", city: "Garden City", state: "NY", venue: "Garden City Hotel", address: null, description: "Annual charity tournament. Raffle, lunch, and prizes.", event_date: "2026-12-05", end_date: null, price: "$75", registration_url: "https://example.com", host: "LI Mahjong Friends", day_time: null, frequency: "once", beginner_friendly: true, confirmed_active_at: null, tier: "free", created_at: ON },
  { id: "demo-e13", event_name: "Palm Springs Mahjong Getaway", event_type: "retreat", city: "Palm Springs", state: "CA", venue: "Parker Palm Springs", address: null, description: "Long-weekend desert retreat. Pool, play, and pampering. Limited to 36 players.", event_date: "2026-11-13", end_date: "2026-11-16", price: "$650 all-inclusive", registration_url: "https://example.com", host: "West Coast Mahj Retreats", day_time: null, frequency: "multi_day", beginner_friendly: true, confirmed_active_at: null, tier: "free", created_at: ON },
  { id: "demo-e14", event_name: "Bay Area Beginners Circle", event_type: "class", city: "San Mateo", state: "CA", venue: "Peninsula JCC", address: null, description: "Six-week beginner class. Learn the card, the rules, and the etiquette.", event_date: null, end_date: null, price: "$120 series", registration_url: "https://example.com", host: "Golden Gate Mahjong", day_time: "Saturdays 11am", frequency: "weekly", beginner_friendly: true, confirmed_active_at: CA, tier: "free", created_at: ON },
  { id: "demo-e15", event_name: "Caribbean Mahjong Cruise", event_type: "retreat", city: "Miami", state: "FL", venue: "Royal Caribbean, Symphony of the Seas", address: null, description: "Seven-night organized mahjong cruise. Daily play, lessons, and tournaments at sea.", event_date: "2027-01-17", end_date: "2027-01-24", price: "From $1,450", registration_url: "https://example.com", host: "Mahjong at Sea", day_time: null, frequency: "multi_day", beginner_friendly: true, confirmed_active_at: null, tier: "free", created_at: ON },
  { id: "demo-e16", event_name: "Chicago North Shore Open Play", event_type: "open_play", city: "Evanston", state: "IL", venue: "Levy Senior Center", address: null, description: "Weekly North Shore game. Friendly, social, all levels.", event_date: null, end_date: null, price: "Free", registration_url: null, host: "North Shore Mahjong", day_time: "Wednesdays 1pm", frequency: "weekly", beginner_friendly: true, confirmed_active_at: CA, tier: "free", created_at: ON },
  { id: "demo-e17", event_name: "Atlanta Spring Slam", event_type: "tournament", city: "Atlanta", state: "GA", venue: "Cobb Galleria", address: null, description: "One-day spring tournament with a beginner bracket.", event_date: "2027-03-14", end_date: null, price: "$55", registration_url: "https://example.com", host: "Peach State Mahjong", day_time: null, frequency: "once", beginner_friendly: true, confirmed_active_at: null, tier: "free", created_at: ON },
  { id: "demo-e18", event_name: "Denver Mile-High Mahjong", event_type: "open_play", city: "Denver", state: "CO", venue: "Cherry Creek Library", address: null, description: "Twice-monthly open play downtown. Newcomers always welcome.", event_date: null, end_date: null, price: "Free", registration_url: null, host: "Rocky Mountain Tiles", day_time: "1st and 3rd Mondays 6pm", frequency: "biweekly", beginner_friendly: true, confirmed_active_at: CA, tier: "free", created_at: ON },
];

type DemoPlayer = {
  id: string; name: string; city: string; state: string; skill_level: string;
  availability: string | null; bio: string | null; avatar_color: string;
  game_types: string[]; contact_email: string | null; status: string; created_at: string;
};

const PINK = "#e91e8c", NAVY = "#1a1f5e", GOLD = "#f5c842", GREEN = "#2ec95c";
export const demoPlayers: DemoPlayer[] = [
  { id: "demo-p1", name: "Susan R.", city: "Scottsdale", state: "AZ", skill_level: "intermediate", availability: "Weekday mornings", bio: "Looking for a regular fourth. Play NMJL, love a friendly table.", avatar_color: PINK, game_types: ["american"], contact_email: null, status: "published", created_at: ON },
  { id: "demo-p2", name: "Marcia L.", city: "Phoenix", state: "AZ", skill_level: "advanced", availability: "Evenings and weekends", bio: "Tournament player happy to mentor newer players.", avatar_color: NAVY, game_types: ["american"], contact_email: null, status: "published", created_at: ON },
  { id: "demo-p3", name: "Ellen K.", city: "Boca Raton", state: "FL", skill_level: "beginner", availability: "Sunday mornings", bio: "New to mahjong and eager to learn. Snowbird, here Nov-Apr.", avatar_color: GOLD, game_types: ["american"], contact_email: null, status: "published", created_at: ON },
  { id: "demo-p4", name: "Rhonda B.", city: "Naples", state: "FL", skill_level: "intermediate", availability: "Afternoons", bio: "Seasonal resident looking to join or start a weekly game.", avatar_color: GREEN, game_types: ["american"], contact_email: null, status: "published", created_at: ON },
  { id: "demo-p5", name: "Debbie S.", city: "Dallas", state: "TX", skill_level: "intermediate", availability: "Tuesday and Thursday mornings", bio: "Played for years in Chicago, new to Dallas and looking for a group.", avatar_color: PINK, game_types: ["american"], contact_email: null, status: "published", created_at: ON },
  { id: "demo-p6", name: "Carol T.", city: "Austin", state: "TX", skill_level: "beginner", availability: "Flexible", bio: "Just took a class and want to keep practicing with patient players.", avatar_color: NAVY, game_types: ["american"], contact_email: null, status: "published", created_at: ON },
  { id: "demo-p7", name: "Linda M.", city: "New York", state: "NY", skill_level: "advanced", availability: "Weekday lunch", bio: "Midtown player, quick games on my lunch hour.", avatar_color: GOLD, game_types: ["american"], contact_email: null, status: "published", created_at: ON },
  { id: "demo-p8", name: "Janet W.", city: "Garden City", state: "NY", skill_level: "intermediate", availability: "Weekends", bio: "Long Island player looking to expand my circle.", avatar_color: GREEN, game_types: ["american"], contact_email: null, status: "published", created_at: ON },
  { id: "demo-p9", name: "Patty H.", city: "San Mateo", state: "CA", skill_level: "beginner", availability: "Saturdays", bio: "Learning the game and loving it. Looking for a beginner-friendly group.", avatar_color: PINK, game_types: ["american"], contact_email: null, status: "published", created_at: ON },
  { id: "demo-p10", name: "Gloria D.", city: "Palm Springs", state: "CA", skill_level: "intermediate", availability: "Mornings", bio: "Desert player, year-round. Always up for a game.", avatar_color: NAVY, game_types: ["american"], contact_email: null, status: "published", created_at: ON },
  { id: "demo-p11", name: "Sandy F.", city: "Evanston", state: "IL", skill_level: "intermediate", availability: "Wednesday afternoons", bio: "North Shore regular, would love another table nearby.", avatar_color: GOLD, game_types: ["american"], contact_email: null, status: "published", created_at: ON },
  { id: "demo-p12", name: "Barbara N.", city: "Atlanta", state: "GA", skill_level: "advanced", availability: "Evenings", bio: "Competitive player, happy to host at my place.", avatar_color: GREEN, game_types: ["american"], contact_email: null, status: "published", created_at: ON },
];

type DemoVenue = {
  id: string; business_name: string; venue_type: string; city: string; state: string;
  address: string | null; description: string | null; website: string | null;
  instagram: string | null; display_email: string | null; logo_url: string | null;
  tier: string; created_at: string;
};

export const demoTeachers: DemoVenue[] = [
  { id: "demo-t1", business_name: "Desert Tiles Mahjong Lessons", venue_type: "Mahjong Instructor", city: "Scottsdale", state: "AZ", address: null, description: "Private and small-group American Mahjong lessons for all levels. Beginners my specialty.", website: "https://example.com", instagram: "deserttiles", display_email: "hello@example.com", logo_url: null, tier: "pro", created_at: ON },
  { id: "demo-t2", business_name: "Gulf Coast Mahjong School", venue_type: "Mahjong Instructor", city: "Naples", state: "FL", address: null, description: "Learn to play in four weeks. Card reading, strategy, and confidence at the table.", website: "https://example.com", instagram: "gulfcoastmahj", display_email: "play@example.com", logo_url: null, tier: "pro", created_at: ON },
  { id: "demo-t3", business_name: "Boca Mahj Studio", venue_type: "studio", city: "Boca Raton", state: "FL", address: null, description: "Lessons, refreshers, and corporate mahjong events in South Florida.", website: "https://example.com", instagram: "bocamahj", display_email: "info@example.com", logo_url: null, tier: "free", created_at: ON },
  { id: "demo-t4", business_name: "Big D Mahjong Lessons", venue_type: "Mahjong Instructor", city: "Dallas", state: "TX", address: null, description: "Patient, friendly instruction. Host your own group lesson at home or at my studio.", website: "https://example.com", instagram: "bigdmahjong", display_email: "teach@example.com", logo_url: null, tier: "pro", created_at: ON },
  { id: "demo-t5", business_name: "Golden Gate Mahjong Classes", venue_type: "class", city: "San Mateo", state: "CA", address: null, description: "Beginner series and intermediate workshops on the Peninsula.", website: "https://example.com", instagram: "ggmahjong", display_email: "learn@example.com", logo_url: null, tier: "free", created_at: ON },
  { id: "demo-t6", business_name: "NYC Mahjong Lessons", venue_type: "Mahjong Instructor", city: "New York", state: "NY", address: null, description: "In-home and virtual lessons across Manhattan and Brooklyn.", website: "https://example.com", instagram: "nycmahjong", display_email: "play@example.com", logo_url: null, tier: "pro", created_at: ON },
  { id: "demo-t7", business_name: "Peach State Mahjong Academy", venue_type: "school", city: "Atlanta", state: "GA", address: null, description: "Group classes, private coaching, and tournament prep.", website: "https://example.com", instagram: "peachmahj", display_email: "hello@example.com", logo_url: null, tier: "free", created_at: ON },
  { id: "demo-t8", business_name: "North Shore Mahjong Lessons", venue_type: "Mahjong Instructor", city: "Evanston", state: "IL", address: null, description: "Learn the 2026 card with a relaxed, encouraging teacher.", website: "https://example.com", instagram: null, display_email: "info@example.com", logo_url: null, tier: "free", created_at: ON },
];

type DemoCruisePost = {
  id: string; name: string; cruise_line: string; ship: string | null;
  depart_date: string; return_date: string | null; skill_level: string | null;
};

export const demoCruisePosts: DemoCruisePost[] = [
  { id: "demo-c1", name: "Maureen", cruise_line: "Royal Caribbean", ship: "Symphony of the Seas", depart_date: "2026-08-15", return_date: "2026-08-22", skill_level: "intermediate" },
  { id: "demo-c2", name: "Joan", cruise_line: "Celebrity", ship: "Celebrity Beyond", depart_date: "2026-09-20", return_date: "2026-09-27", skill_level: "advanced" },
  { id: "demo-c3", name: "Phyllis", cruise_line: "Princess", ship: "Sky Princess", depart_date: "2026-10-10", return_date: "2026-10-17", skill_level: "beginner" },
  { id: "demo-c4", name: "Roberta", cruise_line: "Holland America", ship: "Koningsdam", depart_date: "2026-11-14", return_date: "2026-11-24", skill_level: "intermediate" },
  { id: "demo-c5", name: "Sharon", cruise_line: "Norwegian", ship: "Norwegian Joy", depart_date: "2027-01-10", return_date: "2027-01-17", skill_level: "intermediate" },
  { id: "demo-c6", name: "Diane", cruise_line: "Carnival", ship: "Carnival Celebration", depart_date: "2027-02-08", return_date: "2027-02-15", skill_level: "beginner" },
];

export const demoForming: { share_code: string; day_of_week: string | null; time_of_day: string | null; city: string | null; total: number; filled: number }[] = [
  { share_code: "demo-f1", day_of_week: "Tuesday", time_of_day: "Morning", city: "Scottsdale, AZ", total: 4, filled: 3 },
  { share_code: "demo-f2", day_of_week: "Wednesday", time_of_day: "Afternoon", city: "Dallas, TX", total: 4, filled: 2 },
  { share_code: "demo-f3", day_of_week: "Thursday", time_of_day: "Evening", city: "Boca Raton, FL", total: 4, filled: 3 },
  { share_code: "demo-f4", day_of_week: "Sunday", time_of_day: "Morning", city: "New York, NY", total: 4, filled: 2 },
  { share_code: "demo-f5", day_of_week: "Monday", time_of_day: "Afternoon", city: "Evanston, IL", total: 4, filled: 3 },
  { share_code: "demo-f6", day_of_week: "Saturday", time_of_day: "Morning", city: "San Mateo, CA", total: 4, filled: 2 },
];

// Map counts derived from the demo rows so states light up on the homepage map.
export const demoStateCounts: Record<string, { players: number; events: number; venues: number }> = (() => {
  const c: Record<string, { players: number; events: number; venues: number }> = {};
  const bump = (st: string, key: "players" | "events" | "venues") => {
    const a = (st || "").toUpperCase();
    if (!a) return;
    (c[a] ||= { players: 0, events: 0, venues: 0 })[key]++;
  };
  demoPlayers.forEach((p) => bump(p.state, "players"));
  demoEvents.forEach((e) => bump(e.state, "events"));
  demoTeachers.forEach((t) => bump(t.state, "venues"));
  return c;
})();
