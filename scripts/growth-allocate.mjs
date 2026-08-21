// Growth Allocation Agent, Level 0. Reads real demand (play_requests) and real published
// supply, computes per-metro gaps, and writes ranked prospecting objectives as audit events
// the admin can read. Recommendations only; no outreach, no email.
// Run: node --env-file=.env.local scripts/growth-allocate.mjs [--apply]
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const METROS = {
  "Los Angeles": [34.0522, -118.2437], Boston: [42.3601, -71.0589], "Washington DC": [38.9072, -77.0369],
  Nashville: [36.1627, -86.7816], "Las Vegas": [36.1699, -115.1398], "New York": [40.7128, -74.006],
  Chicago: [41.8781, -87.6298], Atlanta: [33.749, -84.388], Dallas: [32.7767, -96.797],
  Phoenix: [33.4484, -112.074], "Naples FL": [26.142, -81.7948], "San Diego": [32.7157, -117.1611],
  Houston: [29.7604, -95.3698], Tampa: [27.9506, -82.4572], "St. Louis": [38.627, -90.1994],
};
const mi = (a, b) => {
  const dla = ((b[0] - a[0]) * Math.PI) / 180, dlo = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dla / 2) ** 2 + Math.sin(dlo / 2) ** 2 * Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180);
  return 2 * 3958.76 * Math.asin(Math.sqrt(h));
};

const [ev, vn, demand] = await Promise.all([
  sb.from("event_listings").select("latitude,longitude,day_of_week,event_type").eq("status", "published"),
  sb.from("venue_listings").select("latitude,longitude,venue_type").eq("status", "published"),
  sb.from("play_requests").select("city,state,created_at"),
]);

const objectives = [];
for (const [name, c] of Object.entries(METROS)) {
  const events = ev.data.filter((r) => r.latitude != null && mi(c, [r.latitude, r.longitude]) <= 25);
  const venues = vn.data.filter((r) => r.latitude != null && mi(c, [r.latitude, r.longitude]) <= 25);
  const teachers = venues.filter((r) => /instructor|teacher|lesson|studio|school|class/i.test(r.venue_type || ""));
  const days = new Set(events.flatMap((r) => r.day_of_week || []));
  const dem = demand.data.filter((r) => (r.city || "").toLowerCase().includes(name.split(" ")[0].toLowerCase())).length;
  const gaps = [];
  if (events.length < 5) gaps.push(`only ${events.length} play opportunities`);
  if (teachers.length === 0) gaps.push("no teachers listed");
  if (days.size < 4) gaps.push(`games on only ${days.size} of 7 days`);
  if (dem > 0 && events.length === 0) gaps.push(`${dem} player demand signals with zero supply`);
  if (!gaps.length) continue;
  const score = (5 - Math.min(events.length, 5)) * 3 + (teachers.length === 0 ? 4 : 0) + (7 - days.size) + dem * 2;
  objectives.push({ metro: name, score, supply: { events: events.length, venues: venues.length, teachers: teachers.length, days: days.size }, demandSignals: dem, gaps });
}
const TOURNAMENTS = ev.data.filter((r) => r.event_type === "tournament").length;
if (TOURNAMENTS === 0) objectives.push({ metro: "Nationwide", score: 20, supply: { tournaments: 0 }, demandSignals: 0, gaps: ["zero verified tournaments anywhere; category-level sourcing effort needed"] });
objectives.sort((a, b) => b.score - a.score);

console.log("RANKED GROWTH OBJECTIVES");
objectives.forEach((o, i) => {
  console.log(`  ${i + 1}. ${o.metro} (score ${o.score}): ${o.gaps.join("; ")}`);
});

if (!APPLY) { console.log("\nDRY RUN. Re-run with --apply to record objectives as audit events."); process.exit(0); }
for (const o of objectives) {
  await sb.from("outreach_events").insert({
    agent: "growth-allocation-l0",
    action: "objective_ranked",
    reason: `${o.metro}: ${o.gaps.join("; ")}`.slice(0, 500),
    evidence: JSON.stringify({ score: o.score, supply: o.supply, demandSignals: o.demandSignals }).slice(0, 500),
    deterministic: true,
  });
}
console.log(`APPLIED: ${objectives.length} objectives recorded for the Growth admin.`);
