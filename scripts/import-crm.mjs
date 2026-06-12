// Import the deduped outreach contacts and the top-60 ranking into
// crm_contacts, plus the named wave-1 anchors. Idempotent by email.
// Run: node --env-file=.env.local scripts/import-crm.mjs [--dry]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DRY = process.argv.includes("--dry");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DIR = join(homedir(), "Desktop/FMG-Research-2026-06");

function parseCSV(text) {
  const rows = []; let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') inQ = false; else field += c; }
    else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); field = ""; if (row.some((x) => x.trim() !== "")) rows.push(row); row = []; }
    else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((x) => x.trim() !== "")) rows.push(row); }
  const header = rows.shift();
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] || "").trim()])));
}
const clean = (v, n = 200) => { const s = String(v || "").trim(); return s && s.toLowerCase() !== "none" ? s.slice(0, n) : null; };

// Top-60 ranks by normalized email-less name match is unreliable; join by name prefix.
const ranks = new Map();
const top60Path = join(DIR, "SPECIALISTS__top60_outreach_ranking.csv");
if (existsSync(top60Path)) {
  parseCSV(readFileSync(top60Path, "utf8")).forEach((r, i) => {
    const key = String(r.name || "").toLowerCase().slice(0, 24);
    if (key) ranks.set(key, i + 1);
  });
}

const rows = [];
const seen = new Set();
const dedupedPath = join(DIR, "FMG-Outreach-Safe-Contacts-DEDUPED.csv");
for (const r of parseCSV(readFileSync(dedupedPath, "utf8"))) {
  const email = clean(r.email, 254);
  if (!email || seen.has(email.toLowerCase())) continue;
  seen.add(email.toLowerCase());
  const types = String(r.entity_types || "");
  const rank = ranks.get(String(r.name || "").toLowerCase().slice(0, 24)) || null;
  rows.push({
    name: clean(r.name, 120) || clean(r.organization, 120) || email,
    organization: clean(r.organization, 160),
    email,
    city: clean(r.city, 80),
    state: clean(r.state, 30),
    contact_type: types.includes("influencer") ? "media" : types.includes("organization") ? "org" : types.includes("ambassador") ? "ambassador" : "teacher",
    entity_types: clean(types, 120),
    wave: rank ? (rank <= 30 ? 2 : 3) : 3,
    rank,
    best_channel: clean(r.best_channel, 40),
    website: clean(r.website, 300),
    instagram: clean(r.instagram, 120),
    nv_guardrail: String(r.nv_guardrail || "").toUpperCase() === "EXCLUDE",
    notes: rank ? `Top-60 rank ${rank}.` : null,
  });
}

// Wave 1: the named anchors from the launch command center (phone-first; some
// have no email in the research data on purpose).
const ANCHORS = [
  { name: "Kristel Powell", organization: "Troop Mahjong / Stylin Brunette", email: "info@stylinbrunette.com", phone: "210-323-6129", city: "San Antonio", state: "TX", contact_type: "ambassador", notes: "FLAGSHIP. Founder calls personally. Confirm Kristel = Crystal/True Mahjong before any SA outreach." },
  { name: "Lisa Rocchio", organization: "The Charleston Club", city: "Dallas", state: "TX", contact_type: "partner", notes: "Dallas's first dedicated mahjong third place. Welcome Week anchor 1." },
  { name: "Linda Casey & Ashley Gomez", organization: "Dallas Mahj Club", email: "dmc@dallasmahjclub.com", city: "Dallas", state: "TX", contact_type: "partner", notes: "Standing-game keepers, Dallas to Frisco. Welcome Week anchor 2." },
  { name: "Amber & Eleanor", organization: "Peace Love Mahjong", city: "Dallas", state: "TX", contact_type: "partner", notes: "Storefront beginner guided play twice weekly. Welcome Week anchor 3." },
  { name: "Amanda Woolsey & Bethany Factor", organization: "The Mahj Clubhouse", city: "Fort Worth", state: "TX", contact_type: "partner", notes: "Leagues, See You Next Tuesday nights. Welcome Week anchor 4." },
  { name: "Karli Mizrahi", organization: "Aaron Family JCC Dallas (J Mahj Room)", phone: "214-239-7172", city: "Dallas", state: "TX", contact_type: "org", notes: "The only branded JCC mahjong room in the country. First institutional partner." },
];
for (const a of ANCHORS) {
  if (a.email && seen.has(a.email.toLowerCase())) {
    const existing = rows.find((r) => r.email && r.email.toLowerCase() === a.email.toLowerCase());
    if (existing) { existing.wave = 1; existing.contact_type = a.contact_type; existing.notes = a.notes; existing.phone = a.phone || existing.phone; }
  } else {
    rows.push({ wave: 1, rank: null, best_channel: "Phone", nv_guardrail: false, ...a });
    if (a.email) seen.add(a.email.toLowerCase());
  }
}

const { data: existing } = await supabase.from("crm_contacts").select("email, name, organization");
const have = new Set((existing || []).map((e) => (e.email || "").toLowerCase()).filter(Boolean));
const haveNameOrg = new Set((existing || []).map((e) => `${(e.name || "").toLowerCase()}|${(e.organization || "").toLowerCase()}`));
const fresh = rows.filter((r) => {
  if (r.email) return !have.has(r.email.toLowerCase());
  return !haveNameOrg.has(`${(r.name || "").toLowerCase()}|${(r.organization || "").toLowerCase()}`);
});

console.log(`parsed ${rows.length} contacts (${rows.filter((r) => r.wave === 1).length} wave-1 anchors); ${fresh.length} new`);
if (DRY) { console.log("[dry] no writes"); process.exit(0); }
for (let i = 0; i < fresh.length; i += 50) {
  const { error } = await supabase.from("crm_contacts").insert(fresh.slice(i, i + 50));
  if (error) { console.error("INSERT ERROR:", error.message); process.exit(1); }
}
console.log("CRM import complete");
