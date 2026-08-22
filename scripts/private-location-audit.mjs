// Sweeps every listing for location text that describes a private home or narrows one to a
// street. Proposes; the only automatic write is the conservative one, which is removing
// street level detail from a live listing and flagging it for a human. Publication status is
// never changed here, because whether a private game belongs in the directory at all is
// Shauna's call, not an agent's.
// Run: node --env-file=.env.local scripts/private-location-audit.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { detectPrivateLocation, redactStreetDetail, PRIVATE_LOCATION_FLAG, LOCATION_ON_REQUEST_TEXT } from "../lib/private-location.ts";

const APPLY = process.argv.includes("--apply");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const [v, e] = await Promise.all([
  sb.from("venue_listings").select("id,business_name,city,state,address,description,status,review_flag,reviewer_notes"),
  sb.from("event_listings").select("id,event_name,city,state,venue,address,description,status,review_flag,reviewer_notes"),
]);
if (v.error || e.error) {
  console.error(`listing query failed: ${v.error?.message || e.error?.message}`);
  process.exit(1);
}
const rows = [
  ...v.data.map((r) => ({ ...r, table: "venue_listings", name: r.business_name, venue: null })),
  ...e.data.map((r) => ({ ...r, table: "event_listings", name: r.event_name })),
];
console.log(`listings scanned: ${rows.length}`);

const findings = [];
for (const r of rows) {
  const s = detectPrivateLocation(r);
  if (!s.isPrivateResidence && !s.hasStreetDetail) continue;
  if (!s.isPrivateResidence) continue; // street detail on a public venue is expected and fine
  // Street detail is removed wherever it appears, not only on live rows: a pending row is
  // one approval click away from being public, so it must be safe before that click.
  findings.push({ r, s, redact: s.hasStreetDetail, urgent: r.status === "published" && s.hasStreetDetail });
}

findings.sort((a, b) => Number(b.urgent) - Number(a.urgent));
console.log(`\nprivate residence listings found: ${findings.length} (urgent, live with street detail: ${findings.filter((f) => f.urgent).length})\n`);
for (const { r, s, urgent, redact } of findings) {
  console.log(`${urgent ? "URGENT " : "       "}[${r.status}] ${r.name} (${r.city}, ${r.state})`);
  console.log(`         signals: ${s.reasons.join("; ")}`);
  if (r.venue) console.log(`         venue text: ${r.venue}`);
  if (redact) {
    console.log(`         venue after redaction: ${redactStreetDetail(r.venue) || LOCATION_ON_REQUEST_TEXT}`);
    console.log(`         description after redaction: ${redactStreetDetail(r.description).slice(0, 160)}`);
  }
}

if (!APPLY) { console.log("\nDRY RUN. Re-run with --apply to redact street detail on live rows and flag every finding."); process.exit(0); }

let redacted = 0, flagged = 0;
for (const { r, s, urgent, redact } of findings) {
  const update = {};
  if (redact) {
    update.description = redactStreetDetail(r.description);
    // address is inside the public allowlist, so it is the column that actually leaks a
    // street. venue exists on events only; writing it to a venue row rejects the whole update.
    if (r.address) update.address = redactStreetDetail(r.address) || null;
    if (r.table === "event_listings") {
      update.venue = redactStreetDetail(r.venue) || LOCATION_ON_REQUEST_TEXT;
    }
  }
  // Never overwrite a flag a human put there, and never clear an existing one.
  if (!r.review_flag) update.review_flag = PRIVATE_LOCATION_FLAG;
  if (!Object.keys(update).length) continue;
  update.reviewer_notes = `${r.reviewer_notes || ""} | 2026-08-22 private location audit: ${s.reasons.join("; ")}. ${redact ? "Street level detail removed from public fields. " : ""}Publication decision left to Shauna.`.slice(0, 1800);

  const { error } = await sb.from(r.table).update(update).eq("id", r.id);
  // A failed write here means a live listing still carries a home address, so the run stops
  // rather than finishing with a summary that reads like a clean sweep.
  if (error) { console.error(`  update failed ${r.name}: ${error.message}`); process.exit(1); }
  if (redact) redacted++;
  if (update.review_flag) flagged++;
  await sb.from("outreach_events").insert({
    agent: "private-location-audit",
    action: redact ? "street_detail_redacted" : "private_location_flagged",
    reason: s.reasons.join("; ").slice(0, 400),
    evidence: `listing ${r.table}/${r.id}`,
    deterministic: true,
  });
}
console.log(`\nAPPLIED: ${redacted} listings had street detail removed, ${flagged} flagged for review. No listing was published or unpublished.`);
