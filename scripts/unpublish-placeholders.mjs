// Take the demo rows that use example.com off the public site. That domain is reserved by
// RFC 2606 and can never belong to a real business, so these are provably not real listings.
// Records are preserved and moved to flagged, never deleted. Reads only unless --apply.
// Run: node --env-file=.env.local scripts/unpublish-placeholders.mjs [--apply]
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESERVED = /(^|\/\/|\.)(example|test|localhost|invalid)\.(com|org|net|test)/i;
const NEW_STATUS = "flagged";
const REASON =
  "Unpublished 2026-08-10: uses a reserved example.com URL, so this cannot be a real listing. " +
  "Record preserved for review, not deleted.";

const TARGETS = [
  { table: "venue_listings", nameCol: "business_name", urlCols: ["website"] },
  { table: "event_listings", nameCol: "event_name", urlCols: ["registration_url"] },
];

let total = 0;
const plan = [];

for (const { table, nameCol, urlCols } of TARGETS) {
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${nameCol}, city, state, status, reviewer_notes, ${urlCols.join(", ")}`)
    .eq("status", "published");
  if (error) {
    console.error(`FAILED reading ${table}: ${error.message}`);
    process.exit(1);
  }
  for (const row of data) {
    const hit = urlCols.find((c) => row[c] && RESERVED.test(String(row[c])));
    if (!hit) continue;
    plan.push({ table, nameCol, id: row.id, name: row[nameCol], city: row.city, state: row.state, url: row[hit], hadNotes: Boolean(row.reviewer_notes) });
    total++;
  }
}

console.log(`published records using a reserved domain: ${total}\n`);
for (const p of plan) {
  console.log(`  [${p.table}] ${p.name}`);
  console.log(`     ${p.city}, ${p.state}   url=${p.url}`);
  console.log(`     published -> ${NEW_STATUS}${p.hadNotes ? "  (existing reviewer_notes preserved)" : ""}`);
}

if (total !== 10) {
  console.log(`\nWARNING: expected exactly 10 records, found ${total}.`);
  console.log("The authorisation covered 10 specific placeholder rows. Stopping so a human can look.");
  if (APPLY) process.exit(1);
}

if (!APPLY) {
  console.log("\nMode: DRY RUN. Nothing was written. Re-run with --apply.");
  process.exit(0);
}

let ok = 0;
let failed = 0;
for (const p of plan) {
  const update = { status: NEW_STATUS };
  if (!p.hadNotes) update.reviewer_notes = REASON;
  const { error } = await supabase
    .from(p.table)
    .update(update)
    .eq("id", p.id)
    .eq("status", "published");
  if (error) {
    failed++;
    console.error(`  failed ${p.id}: ${error.message}`);
  } else ok++;
}
console.log(`\nAPPLIED: ${ok} unpublished, ${failed} failed. No records were deleted.`);
