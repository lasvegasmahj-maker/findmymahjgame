import { createServerClient } from "@/lib/supabase-server";
import { nearMatches } from "@/lib/near-match";
import {
  boundingBox,
  coordsOf,
  distanceMiles,
  type Coords,
  type GeoPrecision,
} from "@/lib/geo";
import { isUpcoming, type DayName, type TimeOfDay } from "@/lib/schedule";

// The single authoritative read path for public discovery. Pages and any future assistant
// must go through here so they cannot disagree about what is published, what is upcoming,
// or which fields are safe to show.

const CONTACT_FIELDS = [
  "contact_email",
  "contact_name",
  "display_email",
  "phone",
  "reviewer_notes",
  "stripe_payment_id",
  "promo_code",
  "review_flag",
];

const EVENT_BASE_FIELDS = [
  "id",
  "event_name",
  "event_type",
  "city",
  "state",
  "venue",
  "description",
  "event_date",
  "end_date",
  "price",
  "registration_url",
  "tier",
  "created_at",
  "day_time",
  "frequency",
  "beginner_friendly",
  "confirmed_active_at",
  "host",
  "source_url",
];

const EVENT_TRUTH_FIELDS = [
  "latitude",
  "longitude",
  "geo_precision",
  "day_of_week",
  "start_time",
  "end_time",
  "time_of_day",
  "is_recurring",
  "schedule_confidence",
  "source_type",
];

const VENUE_BASE_FIELDS = [
  "id",
  "business_name",
  "venue_type",
  "city",
  "state",
  "address",
  "description",
  "website",
  "instagram",
  "tier",
  "created_at",
  "confirmed_active_at",
  "logo_url",
  "source_url",
];

const VENUE_TRUTH_FIELDS = [
  "latitude",
  "longitude",
  "geo_precision",
  "source_type",
];

export type EventRow = {
  id: string;
  event_name: string;
  event_type: string | null;
  city: string | null;
  state: string | null;
  venue: string | null;
  description: string | null;
  event_date: string | null;
  end_date: string | null;
  price: string | null;
  registration_url: string | null;
  tier: string | null;
  created_at: string | null;
  day_time: string | null;
  frequency: string | null;
  beginner_friendly: string | null;
  confirmed_active_at: string | null;
  host: string | null;
  source_url: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geo_precision?: GeoPrecision | null;
  day_of_week?: string[] | null;
  start_time?: string | null;
  end_time?: string | null;
  time_of_day?: TimeOfDay | null;
  is_recurring?: boolean | null;
  schedule_confidence?: string | null;
  source_type?: string | null;
};

export type VenueRow = {
  id: string;
  business_name: string;
  venue_type: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  description: string | null;
  website: string | null;
  instagram: string | null;
  tier: string | null;
  created_at: string | null;
  confirmed_active_at: string | null;
  logo_url: string | null;
  source_url: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geo_precision?: GeoPrecision | null;
  source_type?: string | null;
};

export type Freshness = {
  confirmedActiveAt: string | null;
  isFresh: boolean;
  sourceUrl: string | null;
  sourceType: string | null;
};

export type WithDistance<T> = T & { distanceMiles: number | null; freshness: Freshness };

export type EventSearchParams = {
  center?: Coords | null;
  radiusMiles?: number | null;
  near?: string | null;
  state?: string | null;
  types?: string[] | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  daysOfWeek?: DayName[] | null;
  timeOfDay?: TimeOfDay | null;
  beginnerFriendly?: boolean | null;
  includePast?: boolean;
  limit?: number;
};

export type VenueSearchParams = {
  center?: Coords | null;
  radiusMiles?: number | null;
  near?: string | null;
  state?: string | null;
  venueKind?: "teacher" | "venue" | null;
  limit?: number;
};

const FRESH_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

function freshnessOf(row: {
  confirmed_active_at?: string | null;
  source_url?: string | null;
  source_type?: string | null;
}): Freshness {
  const at = row.confirmed_active_at || null;
  return {
    confirmedActiveAt: at,
    isFresh: Boolean(at) && Date.now() - new Date(at as string).getTime() < FRESH_WINDOW_MS,
    sourceUrl: row.source_url || null,
    sourceType: row.source_type || null,
  };
}

type QueryShape = {
  select: (s: string) => QueryShape;
  eq: (c: string, v: unknown) => QueryShape;
  in: (c: string, v: unknown[]) => QueryShape;
  gte: (c: string, v: unknown) => QueryShape;
  lte: (c: string, v: unknown) => QueryShape;
  order: (c: string, o: { ascending: boolean; nullsFirst?: boolean }) => QueryShape;
  limit: (n: number) => QueryShape;
};

function applyGeoBox(query: QueryShape, center: Coords, radiusMiles: number): QueryShape {
  const box = boundingBox(center, radiusMiles);
  return query
    .gte("latitude", box.minLat)
    .lte("latitude", box.maxLat)
    .gte("longitude", box.minLng)
    .lte("longitude", box.maxLng);
}

async function runEventQuery(
  params: EventSearchParams,
  fields: string[],
  useGeo: boolean
): Promise<EventRow[]> {
  const supabase = createServerClient();
  let query = supabase
    .from("event_listings")
    .select(fields.join(", "))
    .eq("status", "published") as unknown as QueryShape;

  if (params.state) query = query.eq("state", params.state.toUpperCase());
  if (params.dateFrom) query = query.gte("event_date", params.dateFrom);
  if (params.dateTo) query = query.lte("event_date", params.dateTo);
  if (useGeo && params.center && params.radiusMiles) {
    query = applyGeoBox(query, params.center, params.radiusMiles);
  }
  query = query.order("event_date", { ascending: true, nullsFirst: false });
  query = query.limit(params.limit && params.limit > 0 ? Math.min(params.limit * 5, 1000) : 1000);

  const { data, error } = (await (query as unknown as Promise<{
    data: EventRow[] | null;
    error: { message?: string } | null;
  }>)) as { data: EventRow[] | null; error: { message?: string } | null };

  if (error) throw new Error(error.message || "event query failed");
  return data || [];
}

async function fetchEvents(params: EventSearchParams): Promise<{
  rows: EventRow[];
  geoAvailable: boolean;
}> {
  try {
    const rows = await runEventQuery(
      params,
      [...EVENT_BASE_FIELDS, ...EVENT_TRUTH_FIELDS],
      true
    );
    return { rows, geoAvailable: true };
  } catch {
    const rows = await runEventQuery(params, EVENT_BASE_FIELDS, false);
    return { rows, geoAvailable: false };
  }
}

const TYPE_ALIASES: Record<string, string[]> = {
  open_play: ["open_play", "openplay", "recurring", "open play"],
  tournament: ["tournament"],
  league: ["league"],
  class: ["class", "lesson", "workshop"],
  retreat: ["retreat", "cruise"],
  social: ["social", "event", "conference", "festival", "fundraiser"],
};

function normalizeType(t: string | null): string {
  return String(t || "").toLowerCase().replace(/[^a-z]/g, "");
}

function matchesTypes(row: EventRow, types: string[]): boolean {
  const rowType = normalizeType(row.event_type);
  return types.some((t) => {
    const aliases = TYPE_ALIASES[t] || [t];
    return aliases.some((a) => normalizeType(a) === rowType);
  });
}

function matchesDay(row: EventRow, days: DayName[]): boolean {
  const structured = Array.isArray(row.day_of_week) ? row.day_of_week : [];
  if (structured.length > 0) {
    return days.some((d) => structured.includes(d));
  }
  // Falling back to prose would guess, and a guessed day is exactly the kind of invented
  // fact this layer exists to prevent. An unparsed row is excluded from day filtering.
  return false;
}

function matchesTimeOfDay(row: EventRow, tod: TimeOfDay): boolean {
  if (!row.time_of_day) return false;
  return row.time_of_day === tod;
}

export async function searchEvents(
  params: EventSearchParams = {}
): Promise<WithDistance<EventRow>[]> {
  const { rows, geoAvailable } = await fetchEvents(params);
  let out = rows;

  if (!params.includePast) {
    out = out.filter((r) => isUpcoming(r));
  }
  if (params.types && params.types.length > 0) {
    out = out.filter((r) => matchesTypes(r, params.types as string[]));
  }
  if (params.daysOfWeek && params.daysOfWeek.length > 0) {
    out = out.filter((r) => matchesDay(r, params.daysOfWeek as DayName[]));
  }
  if (params.timeOfDay) {
    out = out.filter((r) => matchesTimeOfDay(r, params.timeOfDay as TimeOfDay));
  }
  if (params.beginnerFriendly) {
    out = out.filter((r) => /yes|true|beginner|all level/i.test(String(r.beginner_friendly || "")));
  }
  if (params.near && !params.center) {
    out = out.filter((r) => nearMatches(params.near as string, r.city, r.state));
  }

  const withDistance: WithDistance<EventRow>[] = out.map((r) => {
    const c = coordsOf(r);
    return {
      ...r,
      distanceMiles: params.center && c ? distanceMiles(params.center, c) : null,
      freshness: freshnessOf(r),
    };
  });

  let final = withDistance;
  if (params.center && params.radiusMiles && geoAvailable) {
    final = final.filter(
      (r) => r.distanceMiles !== null && r.distanceMiles <= (params.radiusMiles as number)
    );
    final.sort((a, b) => (a.distanceMiles as number) - (b.distanceMiles as number));
  }

  return params.limit ? final.slice(0, params.limit) : final;
}

async function runVenueQuery(fields: string[], params: VenueSearchParams, useGeo: boolean) {
  const supabase = createServerClient();
  let query = supabase
    .from("venue_listings")
    .select(fields.join(", "))
    .eq("status", "published") as unknown as QueryShape;

  if (params.state) query = query.eq("state", params.state.toUpperCase());
  if (useGeo && params.center && params.radiusMiles) {
    query = applyGeoBox(query, params.center, params.radiusMiles);
  }
  query = query.limit(1000);

  const { data, error } = (await (query as unknown as Promise<{
    data: VenueRow[] | null;
    error: { message?: string } | null;
  }>)) as { data: VenueRow[] | null; error: { message?: string } | null };
  if (error) throw new Error(error.message || "venue query failed");
  return data || [];
}

const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;

export async function searchVenues(
  params: VenueSearchParams = {}
): Promise<WithDistance<VenueRow>[]> {
  let rows: VenueRow[];
  let geoAvailable = true;
  try {
    rows = await runVenueQuery([...VENUE_BASE_FIELDS, ...VENUE_TRUTH_FIELDS], params, true);
  } catch {
    geoAvailable = false;
    rows = await runVenueQuery(VENUE_BASE_FIELDS, params, false);
  }

  let out = rows;
  if (params.venueKind) {
    out = out.filter((r) => {
      const isTeacher = TEACHER_TYPE.test(`${r.venue_type || ""} ${r.description || ""}`);
      return params.venueKind === "teacher" ? isTeacher : !isTeacher;
    });
  }
  if (params.near && !params.center) {
    out = out.filter((r) => nearMatches(params.near as string, r.city, r.state));
  }

  let final: WithDistance<VenueRow>[] = out.map((r) => {
    const c = coordsOf(r);
    return {
      ...r,
      distanceMiles: params.center && c ? distanceMiles(params.center, c) : null,
      freshness: freshnessOf(r),
    };
  });

  if (params.center && params.radiusMiles && geoAvailable) {
    final = final.filter(
      (r) => r.distanceMiles !== null && r.distanceMiles <= (params.radiusMiles as number)
    );
    final.sort((a, b) => (a.distanceMiles as number) - (b.distanceMiles as number));
  }

  return params.limit ? final.slice(0, params.limit) : final;
}

// Fetch by primary key. Scanning the published set and filtering in JS would silently 404 any
// listing past the first page of rows once the backlog is published.
async function getByIdWithFallback<T>(
  table: string,
  baseFields: string[],
  truthFields: string[],
  id: string
): Promise<T | null> {
  const supabase = createServerClient();
  const run = async (fields: string[]) => {
    const { data, error } = await supabase
      .from(table)
      .select(fields.join(", "))
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as T | null) ?? null;
  };
  try {
    return await run([...baseFields, ...truthFields]);
  } catch {
    return await run(baseFields);
  }
}

export async function getEvent(id: string): Promise<EventRow | null> {
  return getByIdWithFallback<EventRow>("event_listings", EVENT_BASE_FIELDS, EVENT_TRUTH_FIELDS, id);
}

export async function getVenue(id: string): Promise<VenueRow | null> {
  return getByIdWithFallback<VenueRow>("venue_listings", VENUE_BASE_FIELDS, VENUE_TRUTH_FIELDS, id);
}

export type RelaxationStep = {
  constraint: "radius" | "timeOfDay" | "dayOfWeek" | "type";
  from: string;
  to: string;
};

export type RelaxedSearch = {
  results: WithDistance<EventRow>[];
  relaxations: RelaxationStep[];
  exact: boolean;
};

const RADIUS_LADDER = [5, 10, 25, 50];

// Order matters and is a product judgement, not an arbitrary sequence.
// Radius widens first because coordinates are city centroid precision, so a small radius is
// closer to noise than to a real constraint, and players will travel for a game.
// Time of day widens next because staying on the requested DAY is closer to what someone
// asked for than keeping the hour but moving the day.
// Day moves third, and event type last, because a tournament is not a substitute for a
// casual open play and swapping it silently would misrepresent the result.
export async function searchEventsWithRelaxation(
  params: EventSearchParams,
  minResults = 1
): Promise<RelaxedSearch> {
  const exactResults = await searchEvents(params);
  if (exactResults.length >= minResults) {
    return { results: exactResults, relaxations: [], exact: true };
  }

  const relaxations: RelaxationStep[] = [];
  const working: EventSearchParams = { ...params };

  if (working.center && working.radiusMiles) {
    const start = working.radiusMiles;
    for (const step of RADIUS_LADDER) {
      if (step <= start) continue;
      working.radiusMiles = step;
      const results = await searchEvents(working);
      if (results.length >= minResults) {
        relaxations.push({
          constraint: "radius",
          from: `${start} miles`,
          to: `${step} miles`,
        });
        return { results, relaxations, exact: false };
      }
    }
    working.radiusMiles = RADIUS_LADDER[RADIUS_LADDER.length - 1];
    relaxations.push({
      constraint: "radius",
      from: `${start} miles`,
      to: `${working.radiusMiles} miles`,
    });
  }

  if (working.timeOfDay) {
    const from = working.timeOfDay;
    working.timeOfDay = null;
    const results = await searchEvents(working);
    relaxations.push({ constraint: "timeOfDay", from, to: "any time of day" });
    if (results.length >= minResults) return { results, relaxations, exact: false };
  }

  if (working.daysOfWeek && working.daysOfWeek.length > 0) {
    const from = working.daysOfWeek.join(", ");
    working.daysOfWeek = null;
    const results = await searchEvents(working);
    relaxations.push({ constraint: "dayOfWeek", from, to: "any day" });
    if (results.length >= minResults) return { results, relaxations, exact: false };
  }

  if (working.types && working.types.length > 0) {
    const from = working.types.join(", ");
    working.types = null;
    const results = await searchEvents(working);
    relaxations.push({ constraint: "type", from, to: "any kind of play" });
    if (results.length >= minResults) return { results, relaxations, exact: false };
  }

  return { results: await searchEvents(working), relaxations, exact: false };
}

// Built from the parameter difference, never written by a model.
export function describeRelaxations(steps: RelaxationStep[]): string | null {
  if (steps.length === 0) return null;
  const parts = steps.map((s) => {
    if (s.constraint === "radius") return `widened the search from ${s.from} to ${s.to}`;
    if (s.constraint === "timeOfDay") return `included every time of day, not just ${s.from}`;
    if (s.constraint === "dayOfWeek") return `included every day, not just ${s.from}`;
    return `included every kind of play, not just ${s.from}`;
  });
  if (parts.length === 1) return `No exact match, so we ${parts[0]}.`;
  return `No exact match, so we ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}.`;
}

export const PRIVATE_FIELDS_NEVER_RETURNED = CONTACT_FIELDS;
