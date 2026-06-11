// Track A1: import verified research inventory into the listing tables as
// pending_review. Never publishes directly; the admin approval workflow stays
// the gate. Run: node --env-file=.env.local scripts/import-inventory.mjs [--dry]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DRY = process.argv.includes("--dry");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DESK = join(homedir(), "Desktop");

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((f) => f.trim() !== "")) rows.push(row); }
  const header = rows.shift();
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] || "").trim()])));
}

const has = (v) => {
  const s = String(v || "").trim().toLowerCase();
  return s && !["none", "n/a", "not found", "none public", "unknown", "-", "find", "(none public)"].includes(s) && !s.startsWith("not found") && !s.startsWith("(no");
};
const clean = (v, max = 500) => (has(v) ? String(v).trim().slice(0, max) : null);
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const isNV = (r) => ["nv", "nevada"].includes(String(r.State || "").trim().toLowerCase()) || /las vegas|henderson|summerlin/i.test(r.City || "");
const validUrl = (u) => { if (!has(u)) return null; const s = String(u).trim(); if (/^https?:\/\//i.test(s)) return s.slice(0, 500); if (/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}/i.test(s)) return ("https://" + s).slice(0, 500); return null; };
const igClean = (v) => { if (!has(v)) return null; const m = String(v).match(/@?[\w.]{2,30}/); return m ? (m[0].startsWith("@") ? m[0] : "@" + m[0]) : null; };
const stClean = (v) => { const s = String(v || "").trim(); return s.length >= 2 ? s.slice(0, 2).toUpperCase() : null; };

const report = { teachers: { read: 0, unverified: 0, nv: 0, dupe: 0, invalid: 0, inserted: 0 },
  orgs: { read: 0, unverified: 0, dupe: 0, invalid: 0, inserted: 0 },
  events: { read: 0, unverified: 0, dupe: 0, invalid: 0, inserted: 0 } };

const { data: exVen } = await supabase.from("venue_listings").select("business_name, city, website");
const { data: exEv } = await supabase.from("event_listings").select("event_name, city");
const venKeys = new Set((exVen || []).flatMap((v) => [norm(v.business_name) + norm(v.city), v.website ? norm(v.website) : null]).filter(Boolean));
const evKeys = new Set((exEv || []).map((e) => norm(e.event_name) + norm(e.city)));
const evByCity = new Map();
for (const e of exEv || []) {
  const c = norm(e.city);
  if (!evByCity.has(c)) evByCity.set(c, []);
  evByCity.get(c).push(norm(e.event_name));
}
function evDupe(name, city) {
  const n = norm(name), c = norm(city);
  if (evKeys.has(n + c)) return true;
  const inCity = evByCity.get(c) || [];
  if (inCity.some((x) => x.length > 8 && n.length > 8 && (x.includes(n) || n.includes(x)))) return true;
  evKeys.add(n + c); inCity.push(n); evByCity.set(c, inCity);
  return false;
}

function venueRow(r, venueType, bucket) {
  const b = report[bucket];
  b.read++;
  if (String(r.Verified).toLowerCase() !== "yes") { b.unverified++; return null; }
  if (bucket === "teachers" && isNV(r)) { b.nv++; return null; }
  const name = clean(r.Name, 120) || clean(r.Organization, 120);
  const city = clean(r.City, 80);
  if (!name || !city) { b.invalid++; return null; }
  const key = norm(name) + norm(city);
  const site = validUrl(r.Website);
  if (venKeys.has(key) || (site && venKeys.has(norm(site)))) { b.dupe++; return null; }
  venKeys.add(key); if (site) venKeys.add(norm(site));
  return {
    business_name: name,
    venue_type: venueType === "teacher" ? "Mahjong Instructor" : clean(r.Type, 60) || "Mahjong Club",
    city, state: stClean(r.State),
    website: site, instagram: igClean(r.Instagram),
    phone: clean(r.Phone, 40), display_email: clean(r.Email, 254),
    contact_email: clean(r.Email, 254) || "hello@findmymahjgame.com",
    description: clean(r.Notes, 400),
    tier: "free", status: "pending_review",
    reviewer_notes: `Imported from verified research. Source: ${clean(r["Source URL"], 400) || "n/a"}. Player help: ${clean(r["Player-Help Rank"], 30) || "n/a"}. Claim: ${clean(r["Claim-invitable"], 10) || "n/a"} via ${clean(r["Best Channel"], 30) || "n/a"}.`,
  };
}

function eventRow(r, fmt) {
  const b = report.events;
  b.read++;
  if (String(r.Verified).toLowerCase() !== "yes") { b.unverified++; return null; }
  const name = clean(fmt === "dallas" ? r.Event : r.Name, 120);
  const city = clean(r.City, 80);
  if (!name || !city) { b.invalid++; return null; }
  if (evDupe(name, city)) { b.dupe++; return null; }
  const schedule = fmt === "dallas" ? clean(r.Schedule, 200) : null;
  const venue = fmt === "dallas" ? clean(r.Venue, 120) : clean(r.Organization, 120);
  const descBits = [schedule, fmt === "dallas" ? clean(r.Type, 60) : clean(r.Type, 60), clean(r.Notes, 250) || (fmt === "dallas" ? clean(r["Player Use"], 30) : null)].filter(Boolean);
  return {
    event_name: name, event_type: "open_play",
    city, state: stClean(r.State) || (fmt === "dallas" ? "TX" : null),
    venue, description: descBits.join(". ").slice(0, 480) || null,
    registration_url: validUrl(r.Website) || validUrl(r.Source || r["Source URL"]),
    contact_email: clean(r.Email, 254) || (has(r["Claim Contact"]) && String(r["Claim Contact"]).includes("@") ? clean(r["Claim Contact"], 254) : "hello@findmymahjgame.com"),
    tier: "free", status: "pending_review",
    reviewer_notes: `Imported from verified research. Source: ${clean(r.Source || r["Source URL"], 400) || "n/a"}.`,
  };
}

const batches = [];
const tFile = join(DESK, "FMG-CRM-Teachers.csv");
if (existsSync(tFile)) batches.push({ table: "venue_listings", rows: parseCSV(readFileSync(tFile, "utf8")).map((r) => venueRow(r, "teacher", "teachers")).filter(Boolean) });
const oFile = join(DESK, "FMG-CRM-Organizations.csv");
if (existsSync(oFile)) batches.push({ table: "venue_listings", rows: parseCSV(readFileSync(oFile, "utf8")).map((r) => venueRow(r, "org", "orgs")).filter(Boolean) });
const dFile = join(DESK, "FMG-dallas-events.csv");
if (existsSync(dFile)) batches.push({ table: "event_listings", rows: parseCSV(readFileSync(dFile, "utf8")).map((r) => eventRow(r, "dallas")).filter(Boolean) });
const eFile = join(DESK, "FMG-CRM-Events-OpenPlays.csv");
if (existsSync(eFile)) batches.push({ table: "event_listings", rows: parseCSV(readFileSync(eFile, "utf8")).map((r) => eventRow(r, "crm")).filter(Boolean) });

for (const { table, rows } of batches) {
  if (!rows.length) continue;
  if (DRY) { console.log(`[dry] would insert ${rows.length} into ${table}`); continue; }
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) { console.error(`INSERT ERROR ${table}:`, error.message); process.exit(1); }
    const bucket = table === "event_listings" ? "events" : null;
    if (bucket) report[bucket].inserted += chunk.length;
  }
  if (table === "venue_listings") {
    // attribute inserted counts back to the right bucket by venue_type
    const t = rows.filter((r) => r.venue_type === "Mahjong Instructor").length;
    report.teachers.inserted += t;
    report.orgs.inserted += rows.length - t;
  }
}

console.log(DRY ? "DRY RUN (no writes)" : "IMPORT COMPLETE (all rows pending_review)");
console.table(report);
