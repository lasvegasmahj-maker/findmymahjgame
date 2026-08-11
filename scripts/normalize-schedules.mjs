// Turn recurring schedules that currently live in prose into the structured columns search
// filters on. Parsing is deterministic (lib/schedule.ts); no model is involved.
// Low confidence rows are never written, only flagged for a human.
// Reads only unless --apply is passed.
// Run: node --env-file=.env.local scripts/normalize-schedules.mjs [--apply] [--show=N]
import { createClient } from "@supabase/supabase-js";
import { parseSchedule } from "../lib/schedule.ts";

const APPLY = process.argv.includes("--apply");
// Without this guard a second run would overwrite a schedule an admin had corrected by hand.
// schedule_parsed_at is only ever set by this script, so it marks rows it already owns.
const FORCE = process.argv.includes("--force");
const showArg = process.argv.find((a) => a.startsWith("--show="));
const SHOW = showArg ? Number(showArg.split("=")[1]) : 8;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
  .from("event_listings")
  .select("id, event_name, description, day_time, frequency, event_date, event_type, status");

if (error) {
  console.error("FAILED reading event_listings:", error.message);
  process.exit(1);
}

const buckets = { high: [], medium: [], low: [] };
const ambiguityCounts = {};

for (const row of data) {
  const parsed = parseSchedule({
    dayTime: row.day_time,
    frequency: row.frequency,
    description: row.description,
    eventName: row.event_name,
    eventDate: row.event_date,
  });
  for (const a of parsed.ambiguities) {
    const key = a.replace(/\(.*?\)/g, "(...)").slice(0, 70);
    ambiguityCounts[key] = (ambiguityCounts[key] || 0) + 1;
  }
  buckets[parsed.confidence].push({ row, parsed });
}

const total = data.length;
console.log(`event_listings rows: ${total}`);
console.log(`  high confidence:   ${buckets.high.length}`);
console.log(`  medium confidence: ${buckets.medium.length}`);
console.log(`  low confidence:    ${buckets.low.length}`);

const withDay = [...buckets.high, ...buckets.medium].filter((b) => b.parsed.days.length > 0);
const withTime = [...buckets.high, ...buckets.medium].filter((b) => b.parsed.startTime);
console.log(`\nwould gain a day of week: ${withDay.length}`);
console.log(`would gain a start time:  ${withTime.length}`);

console.log("\nambiguities seen:");
for (const [k, c] of Object.entries(ambiguityCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${c.toString().padStart(4)}  ${k}`);
}

function line(b) {
  const p = b.parsed;
  const src = b.row.day_time ? `day_time="${b.row.day_time}"` : `desc="${(b.row.description || "").slice(0, 68)}"`;
  return (
    `  ${b.row.event_name.slice(0, 40).padEnd(40)} [${b.row.status}]\n` +
    `     ${src}\n` +
    `     -> days=${JSON.stringify(p.days)} start=${p.startTime} end=${p.endTime} ` +
    `periods=${JSON.stringify(p.periods)} freq=${p.frequency} recurring=${p.isRecurring}` +
    (p.ambiguities.length ? `\n     ambiguity: ${p.ambiguities.join("; ")}` : "")
  );
}

for (const level of ["high", "medium", "low"]) {
  console.log(`\n--- ${level} confidence samples ---`);
  for (const b of buckets[level].slice(0, SHOW)) console.log(line(b));
}

console.log("\n=== write plan ===");
console.log(`WOULD WRITE structured schedule for: ${buckets.high.length + buckets.medium.length} rows`);
console.log(`WOULD FLAG for human review (no write): ${buckets.low.length} rows`);

if (!APPLY) {
  console.log("\nMode: DRY RUN. Nothing was written. Re-run with --apply.");
  process.exit(0);
}

let ok = 0;
let failed = 0;
for (const b of [...buckets.high, ...buckets.medium]) {
  const p = b.parsed;
  let write = supabase
    .from("event_listings")
    .update({
      day_of_week: p.days.length ? p.days : null,
      start_time: p.startTime,
      end_time: p.endTime,
      time_of_day: p.timeOfDay,
      is_recurring: p.isRecurring,
      frequency: p.frequency,
      schedule_confidence: p.confidence,
      schedule_parsed_at: new Date().toISOString(),
    })
    .eq("id", b.row.id);
  if (!FORCE) write = write.is("schedule_parsed_at", null);
  const { error: upErr } = await write;
  if (upErr) {
    failed++;
    if (failed <= 3) console.error(`  ${b.row.id}: ${upErr.message}`);
  } else ok++;
}

let flagged = 0;
for (const b of buckets.low) {
  let flagWrite = supabase
    .from("event_listings")
    .update({ review_flag: "schedule_needs_review", schedule_parsed_at: new Date().toISOString() })
    .eq("id", b.row.id);
  if (!FORCE) flagWrite = flagWrite.is("schedule_parsed_at", null);
  const { error: flagErr } = await flagWrite;
  if (!flagErr) flagged++;
}

console.log(`APPLIED: ${ok} schedules written, ${failed} failed, ${flagged} flagged for review`);
