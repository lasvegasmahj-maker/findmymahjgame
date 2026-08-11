// Rank the pending inventory by source so one verification unlocks many listings.
// Read only. Never writes.
// Run: node --env-file=.env.local scripts/source-review-queue.mjs [--top=N] [--cohort]
import { createClient } from "@supabase/supabase-js";
import { parseSchedule } from "../lib/schedule.ts";

const topArg = process.argv.find((a) => a.startsWith("--top="));
const TOP = topArg ? Number(topArg.split("=")[1]) : 15;
const COHORT = process.argv.includes("--cohort");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function host(url) {
  if (!url) return "(no source)";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "(bad url)";
  }
}

const [venuesRes, eventsRes] = await Promise.all([
  supabase
    .from("venue_listings")
    .select("id, business_name, city, state, venue_type, website, phone, description, source_url, status, created_at")
    .neq("status", "published"),
  supabase
    .from("event_listings")
    .select("id, event_name, city, state, event_type, venue, host, description, day_time, frequency, event_date, registration_url, source_url, status, created_at")
    .neq("status", "published"),
]);

if (venuesRes.error || eventsRes.error) {
  console.error("read failed:", venuesRes.error?.message || eventsRes.error?.message);
  process.exit(1);
}

const rows = [
  ...venuesRes.data.map((r) => ({ kind: "venue", name: r.business_name, ...r })),
  ...eventsRes.data.map((r) => ({ kind: "event", name: r.event_name, ...r })),
];

for (const r of rows) {
  r.host = host(r.source_url);
  if (r.kind === "event") {
    const p = parseSchedule({
      dayTime: r.day_time,
      frequency: r.frequency,
      description: r.description,
      eventName: r.event_name,
      eventDate: r.event_date,
    });
    r.parsed = p;
    r.scheduleClean = p.ambiguities.length === 0 && p.days.length > 0;
  }
}

const bySource = new Map();
for (const r of rows) {
  if (!bySource.has(r.host)) bySource.set(r.host, []);
  bySource.get(r.host).push(r);
}

const ranked = [...bySource.entries()]
  .map(([h, list]) => {
    const venues = list.filter((r) => r.kind === "venue");
    const events = list.filter((r) => r.kind === "event");
    const states = new Set(list.map((r) => r.state).filter(Boolean));
    const cities = new Set(list.map((r) => `${r.city}|${r.state}`.toLowerCase()).filter(Boolean));
    const clean = events.filter((r) => r.scheduleClean).length;
    const withContact = list.filter((r) => r.website || r.registration_url || r.phone).length;
    const flagged = list.filter((r) => r.status === "flagged").length;
    return {
      host: h,
      total: list.length,
      venues: venues.length,
      events: events.length,
      states: states.size,
      cities: cities.size,
      cleanSchedule: clean,
      cleanPct: events.length ? Math.round((clean / events.length) * 100) : null,
      withContact,
      flagged,
      topStates: [...new Set(list.map((r) => r.state))].slice(0, 5).join(","),
      list,
    };
  })
  .sort((a, b) => b.total - a.total);

console.log(`pending inventory: ${rows.length} rows across ${bySource.size} distinct sources\n`);
console.log("RANKED SOURCE REVIEW QUEUE (verify one source, unlock many rows)");
console.log(
  "  " +
    "source".padEnd(42) +
    "rows".padStart(5) +
    "ven".padStart(5) +
    "evt".padStart(5) +
    "st".padStart(4) +
    "cty".padStart(5) +
    "sched".padStart(7) +
    "link".padStart(6) +
    "  states"
);
let cum = 0;
for (const s of ranked.slice(0, TOP)) {
  cum += s.total;
  console.log(
    "  " +
      s.host.slice(0, 41).padEnd(42) +
      String(s.total).padStart(5) +
      String(s.venues).padStart(5) +
      String(s.events).padStart(5) +
      String(s.states).padStart(4) +
      String(s.cities).padStart(5) +
      (s.cleanPct === null ? "    n/a" : `${s.cleanPct}%`.padStart(7)) +
      String(s.withContact).padStart(6) +
      "  " +
      s.topStates
  );
}
console.log(
  `\n  top ${Math.min(TOP, ranked.length)} sources cover ${cum} of ${rows.length} rows (${Math.round((cum / rows.length) * 100)}%)`
);

const singles = ranked.filter((s) => s.total === 1).length;
console.log(`  long tail: ${singles} sources contribute exactly 1 row each`);

// Concentration: how few sources must be verified to reach coverage milestones.
for (const target of [0.5, 0.8, 0.9]) {
  let acc = 0;
  let n = 0;
  for (const s of ranked) {
    acc += s.total;
    n++;
    if (acc / rows.length >= target) break;
  }
  console.log(`  ${Math.round(target * 100)}% of pending rows come from the top ${n} sources`);
}

if (!COHORT) {
  console.log("\nRe-run with --cohort for the first publishable cohort analysis.");
  process.exit(0);
}

// A row is cohort eligible on deterministic grounds only. Nothing is inferred or invented.
function eligible(r) {
  const reasons = [];
  if (!r.source_url) reasons.push("no source");
  if (!r.city || !r.state) reasons.push("no location");
  if (!r.name || r.name.length < 3) reasons.push("no identity");
  if (r.status === "flagged") reasons.push("flagged");
  if (r.kind === "event") {
    if (!r.scheduleClean) reasons.push("schedule not clean");
    if (r.event_date && new Date(r.event_date) < new Date()) reasons.push("date passed");
  }
  if (r.kind === "venue" && !r.website && !r.phone) reasons.push("no way to reach it");
  return reasons;
}

const cohort = [];
const rejected = new Map();
for (const r of rows) {
  const reasons = eligible(r);
  if (reasons.length === 0) cohort.push(r);
  else for (const x of reasons) rejected.set(x, (rejected.get(x) || 0) + 1);
}

console.log(`\n\nFIRST PUBLISHABLE COHORT (deterministic criteria only)`);
console.log(`  eligible now: ${cohort.length} of ${rows.length}`);
console.log("  excluded by reason (a row can fail more than one):");
for (const [k, v] of [...rejected.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`     ${String(v).padStart(4)}  ${k}`);
}

const cCities = new Map();
for (const r of cohort) {
  const k = `${r.city}, ${r.state}`;
  cCities.set(k, (cCities.get(k) || 0) + 1);
}
const cStates = new Set(cohort.map((r) => r.state));
console.log(`\n  coverage if published: ${cCities.size} cities across ${cStates.size} states`);
console.log(`  venues: ${cohort.filter((r) => r.kind === "venue").length}, events: ${cohort.filter((r) => r.kind === "event").length}`);

const byType = {};
for (const r of cohort.filter((x) => x.kind === "event")) {
  byType[r.event_type] = (byType[r.event_type] || 0) + 1;
}
console.log("  event types:", JSON.stringify(byType));

console.log("\n  densest cities (a city with several options answers a real search):");
for (const [c, n] of [...cCities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18)) {
  console.log(`     ${String(n).padStart(3)}  ${c}`);
}
const dense = [...cCities.values()].filter((n) => n >= 3).length;
const thin = [...cCities.values()].filter((n) => n === 1).length;
console.log(`\n  cities with 3 or more listings: ${dense}`);
console.log(`  cities with exactly 1 listing:  ${thin}`);
