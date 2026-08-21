// Recover provenance that is currently trapped in reviewer_notes prose and write it into the
// structured source_url and source_type columns. Reads only unless --apply is passed.
// Run: node --env-file=.env.local scripts/backfill-source-url.mjs [--apply]
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLES = [
  { table: "venue_listings", nameCol: "business_name" },
  { table: "event_listings", nameCol: "event_name" },
];

const SOURCE_RE = /Source:\s*(https?:\/\/[^\s,)]+)/i;
const ANY_URL_RE = /(https?:\/\/[^\s,)]+)/i;
const IMPORTED_RE = /^Imported from verified research/i;

function cleanUrl(raw) {
  if (!raw) return null;
  let u = String(raw).trim().replace(/[.,;)]+$/, "");
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname.includes(".")) return null;
    if (/(^|\.)example\.(com|org|net)$/i.test(parsed.hostname)) return null;
    return parsed.toString().slice(0, 500);
  } catch {
    return null;
  }
}

// source_url predates the truth-layer migration but source_type ships with it. Probing lets
// the URL recovery run now and pick up source_type automatically once the migration lands.
const probe = await supabase.from("venue_listings").select("source_type").limit(1);
const HAS_SOURCE_TYPE = !probe.error;
console.log(
  HAS_SOURCE_TYPE
    ? "source_type column present: writing both source_url and source_type"
    : "source_type column missing: writing source_url only (re-run after the migration to fill source_type)"
);

let totalPlanned = 0;
let totalSkipped = 0;
const unparsed = [];

for (const { table, nameCol } of TABLES) {
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${nameCol}, city, state, status, reviewer_notes, source_url${HAS_SOURCE_TYPE ? ", source_type" : ""}`);
  if (error) {
    console.error(`FAILED reading ${table}:`, error.message);
    process.exit(1);
  }

  const planned = [];
  let alreadySet = 0;
  let noNotes = 0;

  for (const row of data) {
    const hasUrl = Boolean(row.source_url && String(row.source_url).trim());
    const hasType = Boolean(row.source_type && String(row.source_type).trim());
    // source_url landed before source_type existed. Skipping every row that already has a URL
    // would leave source_type permanently empty, so the two fields are considered separately.
    if (hasUrl && (hasType || !HAS_SOURCE_TYPE)) {
      alreadySet++;
      continue;
    }
    const notes = String(row.reviewer_notes || "").trim();
    if (!notes) {
      noNotes++;
      continue;
    }
    const m = SOURCE_RE.exec(notes) || ANY_URL_RE.exec(notes);
    const url = cleanUrl(m && m[1]);
    const sourceType = IMPORTED_RE.test(notes) ? "imported" : "admin";

    if (hasUrl && !hasType) {
      planned.push({ id: row.id, name: row[nameCol], status: row.status, url: null, source_type: sourceType, typeOnly: true });
      continue;
    }
    if (!url) {
      unparsed.push({ table, id: row.id, name: row[nameCol], notes: notes.slice(0, 90) });
      continue;
    }
    planned.push({ id: row.id, name: row[nameCol], status: row.status, url, source_type: sourceType, typeOnly: false });
  }

  console.log(`\n=== ${table} ===`);
  console.log(`  rows:                  ${data.length}`);
  console.log(`  source_url already set: ${alreadySet} (never overwritten)`);
  console.log(`  no reviewer_notes:      ${noNotes}`);
  console.log(`  could not parse a URL:  ${unparsed.filter((u) => u.table === table).length}`);
  console.log(`  WOULD WRITE:            ${planned.length}`);
  console.log(`     of which source_type only: ${planned.filter((p) => p.typeOnly).length}`);

  const hosts = {};
  for (const p of planned.filter((x) => x.url)) {
    const h = new URL(p.url).hostname;
    hosts[h] = (hosts[h] || 0) + 1;
  }
  const top = Object.entries(hosts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  console.log("  top source hosts:", top.map(([h, c]) => `${h}(${c})`).join(", "));
  console.log("  samples:");
  for (const p of planned.slice(0, 3)) {
    console.log(`    ${p.name} [${p.status}] -> ${p.typeOnly ? `source_type=${p.source_type}` : p.url}`);
  }

  totalPlanned += planned.length;
  totalSkipped += alreadySet;

  if (APPLY) {
    let ok = 0;
    let failed = 0;
    for (const p of planned) {
      // A type-only fill must not carry the source_url guard, since that row already has one.
      let write;
      if (p.typeOnly) {
        write = supabase.from(table).update({ source_type: p.source_type }).eq("id", p.id).is("source_type", null);
      } else {
        const payload = HAS_SOURCE_TYPE
          ? { source_url: p.url, source_type: p.source_type }
          : { source_url: p.url };
        write = supabase.from(table).update(payload).eq("id", p.id).or("source_url.is.null,source_url.eq.");
      }
      const { error: upErr } = await write;
      if (upErr) {
        failed++;
        console.error(`    write failed ${p.id}: ${upErr.message}`);
      } else {
        ok++;
      }
    }
    console.log(`  APPLIED: ${ok} updated, ${failed} failed`);
  }
}

console.log("\n=== summary ===");
console.log(`rows that would be updated: ${totalPlanned}`);
console.log(`rows left alone (already had a source): ${totalSkipped}`);
console.log(`rows whose notes held no usable URL: ${unparsed.length}`);
if (unparsed.length) {
  console.log("\nunparseable (review these by hand):");
  for (const u of unparsed.slice(0, 20)) {
    console.log(`  [${u.table}] ${u.name}: ${u.notes}`);
  }
  if (unparsed.length > 20) console.log(`  ... and ${unparsed.length - 20} more`);
}
console.log(
  APPLY ? "\nMode: APPLIED changes." : "\nMode: DRY RUN. Nothing was written. Re-run with --apply."
);
