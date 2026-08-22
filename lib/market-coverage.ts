// Market coverage: does this directory actually help a player in a given city today?
//
// Deliberately not a single opaque score. Every input stays visible, and the readiness label
// is derived from named thresholds so an operator can see which specific gap moved it. Raw
// row count is the weakest signal here: ten stale instructor pages help nobody, while two
// recurring games with current sources help immediately.

export type CoverageRow = {
  kind: "venue" | "event";
  city?: string | null;
  state?: string | null;
  type?: string | null;
  is_recurring?: boolean | null;
  schedule_confidence?: string | null;
  day_of_week?: string[] | null;
  day_time?: string | null;
  event_date?: string | null;
  source_url?: string | null;
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
const CLUB_RE = /club|community|jcc|library|senior|rec|social|league|program/i;
const TOURNAMENT_RE = /tournament/i;
const RETREAT_RE = /retreat|cruise|travel|getaway/i;
const OPEN_PLAY_RE = /open.?play|recurring|drop.?in|game|play/i;

const MS_PER_DAY = 86400000;

function isCurrent(r: CoverageRow, now: number): boolean {
  if (!r.confirmed_active_at) return false;
  const age = (now - new Date(r.confirmed_active_at).getTime()) / MS_PER_DAY;
  return Number.isFinite(age) && age <= 180;
}

function hasStrongSchedule(r: CoverageRow): boolean {
  if (r.kind === "venue") return false;
  if (r.schedule_confidence === "high") return true;
  const days = Array.isArray(r.day_of_week) ? r.day_of_week.filter(Boolean) : [];
  if (days.length > 0 && (r.is_recurring ?? false)) return true;
  return Boolean(r.event_date && new Date(r.event_date).getTime() >= Date.now());
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

    if (hasStrongSchedule(r)) strongSchedules++;
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
  if (recurringGames < 3) limitingFactors.push(`only ${recurringGames} recurring games or open plays`);
  if (instructors < 2) limitingFactors.push(`only ${instructors} instructors`);
  if (strongSchedules < 3) limitingFactors.push(`only ${strongSchedules} listings a player can act on today`);
  if (rows.length > 0 && currentEvidence * 2 < rows.length) limitingFactors.push(`under half the listings have evidence from the last 6 months`);
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

// Metro definitions by the cities the directory actually holds. Kept explicit rather than
// derived from radius maths so an operator can see exactly which cities roll up where.
export const METRO_CITIES: Record<string, string[]> = {
  Boston: ["boston", "cambridge", "somerville", "brookline", "newton", "lexington", "wellesley", "holliston", "medfield", "milford", "duxbury", "north shore", "roslindale", "needham", "natick", "framingham"],
  "Las Vegas": ["las vegas", "henderson", "summerlin", "north las vegas", "boulder city", "enterprise", "spring valley", "paradise"],
  "Los Angeles": ["los angeles", "santa monica", "beverly hills", "pasadena", "culver city", "west hollywood", "sherman oaks", "studio city", "long beach", "torrance", "irvine", "burbank", "glendale", "encino", "calabasas", "manhattan beach"],
  Houston: ["houston", "sugar land", "katy", "the woodlands", "pearland", "bellaire", "cypress", "spring", "humble"],
  "St. Louis": ["st. louis", "st louis", "saint louis", "clayton", "chesterfield", "kirkwood", "ladue", "des peres", "webster groves", "creve coeur", "town and country", "wildwood"],
  Tampa: ["tampa", "st. petersburg", "st petersburg", "saint petersburg", "clearwater", "brandon", "wesley chapel", "lutz", "safety harbor", "palm harbor", "temple terrace"],
  // Metros the directory already serves. They sit alongside the target metros so the table
  // shows where a player is helped today, not only where the growth work is pointed.
  "Dallas Fort Worth": ["dallas", "plano", "frisco", "richardson", "addison", "fort worth", "mckinney", "allen", "irving", "garland", "carrollton", "highland park", "university park", "southlake", "grapevine"],
  Phoenix: ["phoenix", "scottsdale", "chandler", "tempe", "mesa", "gilbert", "paradise valley", "peoria", "glendale", "arcadia"],
  "New York": ["new york", "brooklyn", "manhattan", "queens", "bronx", "staten island", "scarsdale", "great neck", "white plains"],
  Chicago: ["chicago", "evanston", "highland park", "wilmette", "winnetka", "skokie", "northbrook", "oak park", "glencoe", "deerfield"],
  "Washington DC": ["washington", "bethesda", "chevy chase", "arlington", "alexandria", "silver spring", "rockville", "potomac", "mclean"],
  "San Diego": ["san diego", "la jolla", "encinitas", "carlsbad", "del mar", "coronado", "chula vista", "poway", "solana beach"],
  Atlanta: ["atlanta", "decatur", "sandy springs", "roswell", "alpharetta", "marietta", "dunwoody", "brookhaven", "buckhead"],
  "Southwest Florida": ["naples", "marco island", "bonita springs", "estero", "fort myers", "cape coral", "sanibel"],
};

export function metroOf(city?: string | null): string | null {
  const c = String(city || "").trim().toLowerCase();
  if (!c) return null;
  for (const [metro, cities] of Object.entries(METRO_CITIES)) {
    if (cities.includes(c)) return metro;
  }
  return null;
}
