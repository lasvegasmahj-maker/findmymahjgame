// Read-only A/B/C analysis of the strong-metro publication batch. Writes nothing to the DB.
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const TODAY = "2026-08-20";
const OUT = process.argv[2];

const [v, e] = await Promise.all([
  sb.from("venue_listings").select("id,business_name,city,state,venue_type,latitude,longitude,source_url,website,phone,status,review_flag").neq("status", "published"),
  sb.from("event_listings").select("id,event_name,city,state,event_type,venue,host,latitude,longitude,source_url,registration_url,status,review_flag,day_of_week,time_of_day,start_time,is_recurring,event_date,schedule_confidence").neq("status", "published"),
]);
if (v.error || e.error) { console.error(v.error?.message || e.error?.message); process.exit(1); }
const rows = [
  ...v.data.map((r) => ({ ...r, kind: "venue", name: r.business_name, day_of_week: null, time_of_day: null })),
  ...e.data.map((r) => ({ ...r, kind: "event", name: r.event_name })),
];
const eligible = rows.filter((r) => {
  if (r.status === "flagged" || !r.source_url || r.latitude == null || !r.city || !r.state) return false;
  if (r.kind === "event") {
    if (!r.day_of_week || r.day_of_week.length === 0 || r.review_flag) return false;
    if (r.event_date && r.event_date.slice(0, 10) < TODAY && !r.is_recurring) return false;
  } else if (!r.website && !r.phone) return false;
  return true;
});
const METROS = {
  Dallas: [32.7767, -96.797], Phoenix: [33.4484, -112.074], Houston: [29.7604, -95.3698],
  Nashville: [36.1627, -86.7816], "New York": [40.7128, -74.006], "Washington DC": [38.9072, -77.0369],
  "Naples FL": [26.142, -81.7948], Chicago: [41.8781, -87.6298], Atlanta: [33.749, -84.388],
  "Los Angeles": [34.0522, -118.2437], "San Diego": [32.7157, -117.1611], Boston: [42.3601, -71.0589],
  "Las Vegas": [36.1699, -115.1398],
};
const mi = (a, b) => {
  const dla = ((b[0] - a[0]) * Math.PI) / 180, dlo = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dla / 2) ** 2 + Math.sin(dlo / 2) ** 2 * Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180);
  return 2 * 3958.76 * Math.asin(Math.sqrt(h));
};
// Strong metro = at least 4 eligible play opportunities across at least 3 different days.
const strong = [];
for (const [name, c] of Object.entries(METROS)) {
  const near = eligible.filter((r) => mi(c, [r.latitude, r.longitude]) <= 25);
  const ev = near.filter((r) => r.kind === "event");
  const days = new Set(ev.flatMap((r) => r.day_of_week || []));
  if (ev.length >= 4 && days.size >= 3) strong.push([name, c]);
}
const batch = [];
const seen = new Set();
for (const [name, c] of strong) {
  for (const r of eligible.filter((x) => mi(c, [x.latitude, x.longitude]) <= 25)) {
    if (seen.has(r.id)) { r.metros = (r.metros || []).concat(name); continue; }
    seen.add(r.id); r.metro = name; batch.push(r);
  }
}
console.log(`strong metros: ${strong.map(([n]) => n).join(", ")}`);
console.log(`batch size: ${batch.length} (events ${batch.filter((r) => r.kind === "event").length}, venues ${batch.filter((r) => r.kind === "venue").length})`);

// Probe every distinct URL once: source URLs for all rows, venue websites, event registration links.
const urls = new Set();
for (const r of batch) {
  urls.add(r.source_url);
  if (r.kind === "venue" && r.website) urls.add(r.website);
  if (r.kind === "event" && r.registration_url) urls.add(r.registration_url);
}
console.log(`distinct URLs to probe: ${urls.size}`);
const status = {};
const list = [...urls];
const CONCURRENCY = 8;
async function probe(u) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(u, { redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) FindMyMahjGame-linkcheck" } });
      return { code: r.status, final: r.url };
    } catch (err) {
      if (attempt === 1) return { code: 0, err: String(err && err.cause ? err.cause.code || err.cause : err).slice(0, 60) };
      await new Promise((res) => setTimeout(res, 1500));
    }
  }
}
let idx = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (idx < list.length) {
    const u = list[idx++];
    status[u] = await probe(u);
  }
}));
const ok = Object.values(status).filter((s) => s.code >= 200 && s.code < 400).length;
console.log(`probed: ${list.length}, 2xx/3xx: ${ok}, dead or erroring: ${list.length - ok}`);

// Near-duplicate detection: same city plus same day set plus same start time for events,
// or same normalized name plus city for anything.
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const byName = new Map();
for (const r of batch) {
  const k = norm(r.name) + "|" + norm(r.city);
  if (!byName.has(k)) byName.set(k, []);
  byName.get(k).push(r.id);
}
const hardDupes = [...byName.values()].filter((v2) => v2.length > 1);
const evKey = new Map();
for (const r of batch.filter((x) => x.kind === "event")) {
  const k = [norm(r.city), (r.day_of_week || []).join(","), r.start_time || "", norm(r.venue || "")].join("|");
  if (!evKey.has(k)) evKey.set(k, []);
  evKey.get(k).push(r);
}
const softDupes = [...evKey.values()].filter((v2) => v2.length > 1);

for (const r of batch) {
  const src = status[r.source_url] || { code: 0 };
  const own = r.kind === "venue" ? (r.website ? status[r.website] : null) : (r.registration_url ? status[r.registration_url] : null);
  const srcOk = src.code >= 200 && src.code < 400;
  const srcDead = src.code === 404 || src.code === 410;
  const ownOk = own == null ? null : own.code >= 200 && own.code < 400;
  const inHardDupe = hardDupes.some((g) => g.includes(r.id));
  const inSoftDupe = softDupes.some((g) => g.some((x) => x.id === r.id));
  const reasons = [];
  let group = "A";
  if (srcDead && own && !ownOk) { group = "C"; reasons.push(`source ${src.code} and own link ${own.code || own.err}`); }
  else if (srcDead && !own) { group = "C"; reasons.push(`source gone (${src.code}) and no other link`); }
  else if (inHardDupe) { group = "C"; reasons.push("exact duplicate of another batch row"); }
  else {
    if (srcDead) { group = "B"; reasons.push(`source gone (${src.code}) but own link works`); }
    if (!srcOk && !srcDead) { group = "B"; reasons.push(`source not confirmed (${src.code || src.err})`); }
    if (own && !ownOk) { group = "B"; reasons.push(`own link failing (${own.code || own.err})`); }
    if (inSoftDupe) { group = "B"; reasons.push("possible duplicate: same city, day, time, venue as another row"); }
    if (r.kind === "venue" && !r.website) { group = "B"; reasons.push("phone-only venue, cannot verify online"); }
    if (r.kind === "event" && r.schedule_confidence === "medium") reasons.push("schedule confidence medium (no caveat recorded)");
  }
  r.group = group; r.reasons = reasons;
  r.srcStatus = src.code || src.err; r.ownStatus = own ? own.code || own.err : null;
}
writeFileSync(OUT, JSON.stringify({ strong: strong.map(([n]) => n), batch, hardDupes, softDupes: softDupes.map((g) => g.map((x) => ({ id: x.id, name: x.name, city: x.city, src: x.source_url }))) }, null, 1));
for (const g of ["A", "B", "C"]) {
  const rowsG = batch.filter((r) => r.group === g);
  const ev = rowsG.filter((r) => r.kind === "event");
  console.log(`\nGROUP ${g}: ${rowsG.length} (plays ${ev.length}, venues ${rowsG.length - ev.length})`);
  console.log(`  sources: ${new Set(rowsG.map((r) => { try { return new URL(r.source_url).hostname.replace(/^www\./, ""); } catch { return "?"; } })).size}, metros: ${new Set(rowsG.map((r) => r.metro)).size}`);
  const rc = {};
  for (const r of rowsG) for (const x of r.reasons) rc[x.split("(")[0].trim()] = (rc[x.split("(")[0].trim()] || 0) + 1;
  for (const [k, n] of Object.entries(rc).sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(3)}  ${k}`);
}
