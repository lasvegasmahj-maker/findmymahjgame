// Deliberately not a single opaque score: the readiness label comes from named thresholds so
// an operator can see which gap moved it. Row count is the weakest signal here, since ten
// stale instructor pages help nobody and two current recurring games help immediately.

export type CoverageRow = {
  kind: "venue" | "event";
  city?: string | null;
  state?: string | null;
  type?: string | null;
  is_recurring?: boolean | null;
  schedule_confidence?: string | null;
  day_of_week?: string[] | null;
  event_date?: string | null;
  confirmed_active_at?: string | null;
  review_flag?: string | null;
};

export type MetroCoverage = {
  metro: string;
  total: number;
  instructors: number;
  recurringGames: number;
  clubsAndPrograms: number;
  tournaments: number;
  retreatsAndSpecials: number;
  strongSchedules: number;
  currentEvidence: number;
  needsReview: number;
  cities: number;
  topCity: string | null;
  topCityShare: number;
  readiness: "USEFUL" | "THIN" | "GAP";
  limitingFactors: string[];
};

const INSTRUCTOR_RE = /instructor|teacher|lesson|class|studio|school/i;
const CLUB_RE = /\b(club|community|jcc|library|senior|rec|recreation|social|league|program)\b/i;
const TOURNAMENT_RE = /tournament/i;
const RETREAT_RE = /retreat|cruise|travel|getaway/i;
const OPEN_PLAY_RE = /open.?play|recurring|drop.?in|game|play/i;

const MS_PER_DAY = 86400000;

function isCurrent(r: CoverageRow, now: number): boolean {
  if (!r.confirmed_active_at) return false;
  const age = (now - new Date(r.confirmed_active_at).getTime()) / MS_PER_DAY;
  return Number.isFinite(age) && age <= 180;
}

function hasStrongSchedule(r: CoverageRow, now: number): boolean {
  if (r.kind === "venue") return false;
  if (r.schedule_confidence === "high") return true;
  const days = Array.isArray(r.day_of_week) ? r.day_of_week.filter(Boolean) : [];
  if (days.length > 0 && (r.is_recurring ?? false)) return true;
  return Boolean(r.event_date && new Date(r.event_date).getTime() >= now);
}

export function summarizeMetro(metro: string, rows: CoverageRow[], now = Date.now()): MetroCoverage {
  const cityCounts = new Map<string, number>();
  let instructors = 0;
  let recurringGames = 0;
  let clubsAndPrograms = 0;
  let tournaments = 0;
  let retreatsAndSpecials = 0;
  let strongSchedules = 0;
  let currentEvidence = 0;
  let needsReview = 0;

  for (const r of rows) {
    const key = (r.city || "unknown").toLowerCase();
    cityCounts.set(key, (cityCounts.get(key) || 0) + 1);
    const type = String(r.type || "");

    if (r.kind === "venue" && INSTRUCTOR_RE.test(type)) instructors++;
    if (TOURNAMENT_RE.test(type)) tournaments++;
    else if (RETREAT_RE.test(type)) retreatsAndSpecials++;
    else if (r.kind === "event" && (r.is_recurring || OPEN_PLAY_RE.test(type))) recurringGames++;
    if (CLUB_RE.test(type)) clubsAndPrograms++;

    if (hasStrongSchedule(r, now)) strongSchedules++;
    if (isCurrent(r, now)) currentEvidence++;
    if (r.review_flag) needsReview++;
  }

  const sortedCities = [...cityCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topCity = sortedCities.length ? sortedCities[0][0] : null;
  const topCityShare = rows.length ? Math.round((sortedCities[0]?.[1] ?? 0) * 100 / rows.length) : 0;

  // A player needs somewhere to actually show up: a recurring game or a teacher, with a
  // schedule they can act on. These thresholds are the definition of useful, stated plainly
  // rather than hidden inside a weighted score.
  const limitingFactors: string[] = [];
  const count = (n: number, one: string, many: string) =>
    n === 0 ? `no ${many}` : n === 1 ? `only 1 ${one}` : `only ${n} ${many}`;
  if (recurringGames < 3) limitingFactors.push(count(recurringGames, "recurring game or open play", "recurring games or open plays"));
  if (instructors < 2) limitingFactors.push(count(instructors, "teacher", "teachers"));
  if (strongSchedules < 3) limitingFactors.push(count(strongSchedules, "listing a player can act on today", "listings a player can act on today"));
  if (rows.length > 0 && currentEvidence * 2 < rows.length) limitingFactors.push("under half the listings have evidence from the last 6 months");
  if (rows.length >= 4 && topCityShare >= 80) limitingFactors.push(`${topCityShare} percent of listings sit in one city`);

  const readiness: MetroCoverage["readiness"] =
    recurringGames >= 3 && strongSchedules >= 3 && instructors >= 2
      ? "USEFUL"
      : recurringGames + instructors >= 2
        ? "THIN"
        : "GAP";

  return {
    metro,
    total: rows.length,
    instructors,
    recurringGames,
    clubsAndPrograms,
    tournaments,
    retreatsAndSpecials,
    strongSchedules,
    currentEvidence,
    needsReview,
    cities: cityCounts.size,
    topCity,
    topCityShare,
    readiness,
    limitingFactors,
  };
}

// Metro definitions keyed "city|state", because city names repeat across states: Glendale is
// in both the Phoenix and Los Angeles lists, and Highland Park in both Dallas and Chicago.
export const METRO_CITIES: Record<string, string[]> = {
  Boston: ["boston|MA", "cambridge|MA", "somerville|MA", "brookline|MA", "newton|MA", "lexington|MA", "wellesley|MA", "holliston|MA", "medfield|MA", "milford|MA", "duxbury|MA", "north shore|MA", "roslindale|MA", "needham|MA", "natick|MA", "framingham|MA"],
  "Las Vegas": ["las vegas|NV", "henderson|NV", "summerlin|NV", "north las vegas|NV", "boulder city|NV", "enterprise|NV", "spring valley|NV", "paradise|NV"],
  "Los Angeles": ["los angeles|CA", "santa monica|CA", "beverly hills|CA", "pasadena|CA", "culver city|CA", "west hollywood|CA", "sherman oaks|CA", "studio city|CA", "long beach|CA", "torrance|CA", "irvine|CA", "burbank|CA", "glendale|CA", "encino|CA", "calabasas|CA", "manhattan beach|CA"],
  Houston: ["houston|TX", "sugar land|TX", "katy|TX", "the woodlands|TX", "pearland|TX", "bellaire|TX", "cypress|TX", "spring|TX", "humble|TX"],
  "St. Louis": ["st. louis|MO", "st louis|MO", "saint louis|MO", "clayton|MO", "chesterfield|MO", "kirkwood|MO", "ladue|MO", "des peres|MO", "webster groves|MO", "creve coeur|MO", "town and country|MO", "wildwood|MO"],
  Tampa: ["tampa|FL", "st. petersburg|FL", "st petersburg|FL", "saint petersburg|FL", "clearwater|FL", "brandon|FL", "wesley chapel|FL", "lutz|FL", "safety harbor|FL", "palm harbor|FL", "temple terrace|FL"],
  "Dallas Fort Worth": ["dallas|TX", "plano|TX", "frisco|TX", "richardson|TX", "addison|TX", "fort worth|TX", "mckinney|TX", "allen|TX", "irving|TX", "garland|TX", "carrollton|TX", "highland park|TX", "university park|TX", "southlake|TX", "grapevine|TX", "arlington|TX"],
  Phoenix: ["phoenix|AZ", "scottsdale|AZ", "chandler|AZ", "tempe|AZ", "mesa|AZ", "gilbert|AZ", "paradise valley|AZ", "peoria|AZ", "glendale|AZ", "arcadia|AZ"],
  "New York": ["new york|NY", "brooklyn|NY", "manhattan|NY", "queens|NY", "bronx|NY", "staten island|NY", "scarsdale|NY", "great neck|NY", "white plains|NY"],
  Chicago: ["chicago|IL", "evanston|IL", "highland park|IL", "wilmette|IL", "winnetka|IL", "skokie|IL", "northbrook|IL", "oak park|IL", "glencoe|IL", "deerfield|IL"],
  "Washington DC": ["washington|DC", "bethesda|MD", "chevy chase|MD", "silver spring|MD", "rockville|MD", "potomac|MD", "arlington|VA", "alexandria|VA", "mclean|VA"],
  "San Diego": ["san diego|CA", "la jolla|CA", "encinitas|CA", "carlsbad|CA", "del mar|CA", "coronado|CA", "chula vista|CA", "poway|CA", "solana beach|CA"],
  Atlanta: ["atlanta|GA", "decatur|GA", "sandy springs|GA", "roswell|GA", "alpharetta|GA", "marietta|GA", "dunwoody|GA", "brookhaven|GA", "buckhead|GA"],
  "Southwest Florida": ["naples|FL", "marco island|FL", "bonita springs|FL", "estero|FL", "fort myers|FL", "cape coral|FL", "sanibel|FL"],
};

export function metroOf(city?: string | null, state?: string | null): string | null {
  const c = String(city || "").trim().toLowerCase();
  const st = String(state || "").trim().toUpperCase();
  if (!c || !st) return null;
  const key = `${c}|${st}`;
  for (const [metro, cities] of Object.entries(METRO_CITIES)) {
    if (cities.includes(key)) return metro;
  }
  return null;
}
