// Give listings real coordinates so radius search can exist. Geocodes distinct city and state
// pairs rather than rows, which keeps this to a few hundred lookups instead of a few thousand.
// Uses the same OpenStreetMap Nominatim service the app already calls in app/api/geocode.
// Reads only unless --apply is passed.
// Run: node --env-file=.env.local scripts/geocode-listings.mjs [--apply] [--limit=N]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const APPLY = process.argv.includes("--apply");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CACHE_PATH = join(process.cwd(), ".cache", "geocode-cities.json");
const CONTACT = "https://findmymahjgame.com";
const USER_AGENT = `FindMyMahjGame/1.0 (${CONTACT})`;

function loadCache() {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Lower bound is 17 rather than 24 so Hawaii and Puerto Rico are not discarded as misses.
// countrycodes=us already constrains the lookup; this box only catches obvious garbage.
function validCoords(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 17 &&
    lat <= 72 &&
    lng >= -180 &&
    lng <= -66
  );
}

// The research import wrote values like "Atlanta (Brookhaven), GA" and "Austin / Dripping
// Springs, TX". Those are real places written imprecisely, not bad data, so the raw string is
// tried first and these narrowing rewrites only run if it misses. Order matters: the
// parenthetical is usually the neighbourhood and the leading name is usually the city.
function cityVariants(city) {
  const raw = String(city || "").trim();
  const out = [raw];
  const noParens = raw.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  if (noParens && noParens !== raw) out.push(noParens);
  const inParens = raw.match(/\(([^)]+)\)/);
  const firstSlash = noParens.split(/\s*[/,]\s*/)[0].trim();
  if (firstSlash && !out.includes(firstSlash)) out.push(firstSlash);
  if (inParens) {
    const p = inParens[1].trim();
    if (p && !/metro|area|suburbs|county/i.test(p) && !out.includes(p)) out.push(p);
  }
  return out.filter(Boolean);
}

async function lookup(city, state) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us" +
    `&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const body = await res.json();
  const hit = Array.isArray(body) ? body[0] : null;
  if (!hit) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!validCoords(lat, lng)) return null;
  return { lat, lng, label: hit.display_name };
}

async function geocodeCity(city, state) {
  const variants = cityVariants(city);
  for (let i = 0; i < variants.length; i++) {
    const hit = await lookup(variants[i], state);
    if (hit) return { ...hit, matchedOn: variants[i], narrowed: i > 0 };
    if (i < variants.length - 1) await sleep(1100);
  }
  return null;
}

const TABLES = [
  { table: "venue_listings", nameCol: "business_name" },
  { table: "event_listings", nameCol: "event_name" },
];

const rowsByTable = {};
const needed = new Map();

for (const { table, nameCol } of TABLES) {
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${nameCol}, city, state, status, latitude, longitude`);
  if (error) {
    console.error(`FAILED reading ${table}: ${error.message}`);
    console.error("If this mentions latitude, the truth-layer migration has not been applied yet.");
    process.exit(1);
  }
  rowsByTable[table] = data;
  for (const row of data) {
    if (row.latitude != null && row.longitude != null) continue;
    const city = String(row.city || "").trim();
    const state = String(row.state || "").trim();
    if (!city || !state) continue;
    needed.set(`${city.toLowerCase()}|${state.toUpperCase()}`, { city, state });
  }
}

console.log(`distinct city and state pairs needing coordinates: ${needed.size}`);

const cache = loadCache();
let looked = 0;
let missed = 0;
const failures = [];

for (const [key, { city, state }] of needed) {
  if (cache[key]) continue;
  if (looked >= LIMIT) break;
  const hit = await geocodeCity(city, state);
  looked++;
  if (hit) {
    cache[key] = hit;
  } else {
    missed++;
    failures.push(`${city}, ${state}`);
  }
  if (looked % 25 === 0) {
    saveCache(cache);
    console.log(`  looked up ${looked} of ${needed.size} (${missed} misses)`);
  }
  await sleep(1100);
}
saveCache(cache);

console.log(`\nlookups performed this run: ${looked}, misses: ${missed}`);
console.log(`cache now holds ${Object.keys(cache).length} city coordinates`);
if (failures.length) {
  console.log("could not resolve:");
  for (const f of failures.slice(0, 20)) console.log(`  ${f}`);
}

let planned = 0;
let unresolved = 0;
const perTable = {};

for (const { table } of TABLES) {
  const updates = [];
  for (const row of rowsByTable[table]) {
    if (row.latitude != null && row.longitude != null) continue;
    const city = String(row.city || "").trim();
    const state = String(row.state || "").trim();
    const hit = cache[`${city.toLowerCase()}|${state.toUpperCase()}`];
    if (!hit) {
      unresolved++;
      continue;
    }
    updates.push({ id: row.id, lat: hit.lat, lng: hit.lng });
  }
  perTable[table] = updates;
  planned += updates.length;
  console.log(`\n${table}: would set coordinates on ${updates.length} rows`);
}

console.log(`\nrows that would gain coordinates: ${planned}`);
console.log(`rows still without coordinates: ${unresolved}`);
console.log(
  "precision is recorded as 'city', because a city centroid is honest at 25 miles and misleading at 1 mile"
);

if (APPLY) {
  for (const { table } of TABLES) {
    let ok = 0;
    let failed = 0;
    for (const u of perTable[table]) {
      const { error } = await supabase
        .from(table)
        .update({
          latitude: u.lat,
          longitude: u.lng,
          geo_precision: "city",
          geocoded_at: new Date().toISOString(),
        })
        .eq("id", u.id)
        .is("latitude", null);
      if (error) {
        failed++;
        if (failed <= 3) console.error(`  ${table} ${u.id}: ${error.message}`);
      } else ok++;
    }
    console.log(`APPLIED ${table}: ${ok} updated, ${failed} failed`);
  }
} else {
  console.log("\nMode: DRY RUN. Nothing was written. Re-run with --apply.");
}
