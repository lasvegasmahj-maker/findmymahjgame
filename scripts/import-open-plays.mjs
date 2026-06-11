// Import researched recurring open plays (the single biggest "games this week"
// lever) into event_listings as pending_review. Only verified + High/Medium
// player value, deduped against what is already in the table.
// Run: node --env-file=.env.local scripts/import-open-plays.mjs [--dry]
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DRY = process.argv.includes("--dry");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SRC = join(homedir(), "Desktop/FMG-Research-2026-06/wpsav9v0f__openplays.csv");

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
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const has = (v) => { const s = String(v || "").trim().toLowerCase(); return s && !["none", "n/a", "unknown", "-", "tbd", "private"].includes(s); };
const clean = (v, n = 500) => (has(v) ? String(v).trim().slice(0, n) : null);
const url = (u) => { if (!has(u)) return null; const s = String(u).trim(); if (/^https?:\/\//i.test(s)) return s.slice(0, 500); if (/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}/i.test(s)) return ("https://" + s).slice(0, 500); return null; };
const email = (v) => { const m = String(v || "").match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i); return m ? m[0] : null; };
const st = (v) => { const s = String(v || "").trim(); return s.length >= 2 ? s.slice(0, 2).toUpperCase() : null; };

const { data: ex } = await supabase.from("event_listings").select("event_name, city");
const keys = new Set((ex || []).map((e) => norm(e.event_name) + norm(e.city)));
const byCity = new Map();
for (const e of ex || []) { const c = norm(e.city); (byCity.get(c) || byCity.set(c, []).get(c)).push(norm(e.event_name)); }
function dupe(name, city) {
  const n = norm(name), c = norm(city);
  if (keys.has(n + c)) return true;
  const inCity = byCity.get(c) || [];
  if (inCity.some((x) => x.length > 8 && n.length > 8 && (x.includes(n) || n.includes(x)))) return true;
  keys.add(n + c); inCity.push(n); byCity.set(c, inCity); return false;
}

const rep = { read: 0, unverified: 0, lowValue: 0, dupe: 0, invalid: 0, inserted: 0 };
const rows = [];
for (const r of parseCSV(readFileSync(SRC, "utf8"))) {
  rep.read++;
  if (String(r.verified).toLowerCase() !== "true" && String(r.verified).toLowerCase() !== "yes") { rep.unverified++; continue; }
  if (String(r.player_value).trim().toLowerCase() === "low") { rep.lowValue++; continue; }
  const name = clean(r.event_name, 120), city = clean(r.city, 80);
  if (!name || !city) { rep.invalid++; continue; }
  if (dupe(name, city)) { rep.dupe++; continue; }
  const descBits = [
    clean(r.day_time, 120), clean(r.frequency, 60),
    has(r.beginner_friendly) && /yes|true|beginner/i.test(r.beginner_friendly) ? "Beginner friendly" : null,
    has(r.host) ? `Host: ${clean(r.host, 80)}` : (has(r.teacher) ? `Teacher: ${clean(r.teacher, 80)}` : null),
    clean(r.venue, 120),
  ].filter(Boolean);
  rows.push({
    event_name: name, event_type: "open_play", city, state: st(r.state),
    venue: clean(r.venue, 120), description: descBits.join(" · ").slice(0, 480) || null,
    registration_url: url(r.website) || url(r.source_url),
    contact_email: email(r.contact) || "hello@findmymahjgame.com",
    tier: "free", status: "pending_review",
    reviewer_notes: `Researched open play (${clean(r.player_value, 10) || "?"} player value). Source: ${clean(r.source_url, 300) || "n/a"}. ${clean(r.verification_note, 200) || ""}`.slice(0, 500),
  });
}

if (DRY) { console.log(`[dry] would insert ${rows.length} open plays`); }
else for (let i = 0; i < rows.length; i += 50) {
  const { error } = await supabase.from("event_listings").insert(rows.slice(i, i + 50));
  if (error) { console.error("INSERT ERROR:", error.message); process.exit(1); }
  rep.inserted += Math.min(50, rows.length - i);
}
console.log(DRY ? "DRY RUN" : "IMPORT COMPLETE (pending_review)");
console.table(rep);
