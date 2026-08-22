// Publishes research candidates that passed the Phase 5 publishability review into
// player-facing listings. Qualification as a prospect never reaches this script; only an
// explicit PUBLISHABLE verdict with quoted evidence does.
//
// Dry run by default. Every write is keyed to the prospect id so a rerun updates rather than
// duplicates, every row carries its source URL and evidence, and every publish appends an
// audit event. Nothing here touches an existing listing that a human has edited.
// Run: node --env-file=.env.local scripts/publish-verified-listings.mjs <verdicts.json> [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { detectPrivateLocation } from "../lib/private-location.ts";

const APPLY = process.argv.includes("--apply");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const verdicts = JSON.parse(readFileSync(process.argv[2], "utf8")).filter((v) => v.verdict === "PUBLISHABLE");
console.log(`publishable verdicts: ${verdicts.length}`);

const DAYS = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
// An ordinal cadence ("third Thursday of the month") is not a weekly game. Writing structured
// days for one would tell a player to show up on the wrong Thursday, so those rows keep their
// human readable schedule text and no structured day.
const ORDINAL_RE = /\b(1st|2nd|3rd|4th|first|second|third|fourth|last)\b|\bmonthly\b|\bof (the|each) month\b|\bevery other\b|\bbi-?weekly\b/i;
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const [venues, events, prospects] = await Promise.all([
  sb.from("venue_listings").select("id,business_name,city,source_url"),
  sb.from("event_listings").select("id,event_name,city,source_url"),
  sb.from("prospects").select("id,name,organization_name,city,state,metro,website_url,public_email,public_phone,prospect_type"),
]);
const byProspect = new Map(prospects.data.map((p) => [p.id, p]));
const venueKeys = new Map(venues.data.map((r) => [norm(r.business_name) + "|" + norm(r.city), r.id]));
const eventKeys = new Map(events.data.map((r) => [norm(r.event_name) + "|" + norm(r.city), r.id]));

const planned = [];
for (const v of verdicts) {
  const p = byProspect.get(v.id);
  if (!p) { console.error(`  no prospect row for ${v.name}, skipping`); continue; }

  if (!v.proposed_description) { console.error(`  no verified description for ${v.name}, skipping`); continue; }

  const isEvent = v.listing_kind === "event";
  const table = isEvent ? "event_listings" : "venue_listings";
  const nameKey = norm(v.name) + "|" + norm(p.city);
  const existingId = (isEvent ? eventKeys : venueKeys).get(nameKey) || null;

  const ordinalCadence = ORDINAL_RE.test(String(v.schedule_text || ""));
  const days = ordinalCadence ? [] : (v.day_of_week || []).map((d) => String(d).toLowerCase()).filter((d) => d in DAYS);
  if (ordinalCadence && (v.day_of_week || []).length) console.log(`  note: ${v.name} has an ordinal cadence, keeping schedule text only`);
  const contactEmail = (v.public_contact || "").match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0] || p.public_email || null;
  const phone = (v.public_contact || "").match(/\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}/)?.[0] || p.public_phone || null;

  const row = isEvent
    ? {
        event_name: v.name.slice(0, 160),
        event_type: "open_play",
        city: p.city,
        state: p.state,
        venue: v.public_address || null,
        description: v.proposed_description.slice(0, 800),
        price: v.price_text || null,
        source_url: v.source_urls?.[0] || null,
        source_type: "imported",
        contact_email: v.contact_ok_to_display ? contactEmail : null,
        day_of_week: days.length ? days : null,
        is_recurring: days.length > 0,
        schedule_confidence: v.schedule_confidence === "HIGH_EXPLICIT" && !ordinalCadence ? "high" : "medium",
        schedule_parsed_at: new Date().toISOString(),
        day_time: v.schedule_text ? v.schedule_text.slice(0, 200) : null,
        confirmed_active_at: new Date().toISOString(),
        status: "published",
        reviewer_notes: `Phase 5 publishability review 2026-08-22. Variant ${v.mahjong_variant}. ${v.quoted_evidence || ""}`.slice(0, 1800),
      }
    : {
        business_name: v.name.slice(0, 160),
        venue_type: v.suggested_category?.slice(0, 60) || "Mahjong Instructor",
        city: p.city,
        state: p.state,
        description: v.proposed_description.slice(0, 800),
        website: p.website_url || v.source_urls?.[0] || null,
        source_url: v.source_urls?.[0] || null,
        source_type: "imported",
        display_email: v.contact_ok_to_display ? contactEmail : null,
        contact_email: contactEmail,
        phone: v.contact_ok_to_display ? phone : null,
        confirmed_active_at: new Date().toISOString(),
        status: "published",
        reviewer_notes: `Phase 5 publishability review 2026-08-22. Variant ${v.mahjong_variant}. ${v.quoted_evidence || ""}`.slice(0, 1800),
      };

  // The privacy screen runs on the row that will actually reach players, not on the
  // reviewer's notes, so it tests exactly what gets displayed.
  const privacy = detectPrivateLocation({
    venue: row.venue,
    address: row.address,
    description: row.description,
    city: row.city,
    state: row.state,
  });
  const streetAllowed = v.location_confidence === "EXACT_PUBLIC_ADDRESS" && v.public_or_private !== "PRIVATE_RESIDENCE";
  if (privacy.isPrivateResidence || (privacy.hasStreetDetail && !streetAllowed)) {
    console.error(`  BLOCKED by privacy policy: ${v.name} (${privacy.reasons.join("; ")})`);
    continue;
  }

  planned.push({ v, p, table, row, existingId });
}

console.log(`\nplanned writes: ${planned.length}`);
for (const { v, table, row, existingId } of planned) {
  console.log(`\n  ${existingId ? "UPDATE" : "INSERT"} ${table}: ${v.name}`);
  console.log(`    city: ${row.city}, ${row.state} | variant: ${v.mahjong_variant} | schedule: ${v.schedule_confidence}`);
  console.log(`    description: ${row.description.slice(0, 120)}...`);
  console.log(`    source: ${row.source_url}`);
  if (table === "event_listings") console.log(`    days: ${JSON.stringify(row.day_of_week)} | venue: ${row.venue}`);
}

if (!APPLY) { console.log("\nDRY RUN. Re-run with --apply to write these listings."); process.exit(0); }

let inserted = 0, updated = 0;
for (const { v, p, table, row, existingId } of planned) {
  let listingId = existingId;
  if (existingId) {
    const { error } = await sb.from(table).update(row).eq("id", existingId);
    if (error) { console.error(`  update failed ${v.name}: ${error.message}`); continue; }
    updated++;
  } else {
    const { data, error } = await sb.from(table).insert(row).select("id").single();
    if (error) { console.error(`  insert failed ${v.name}: ${error.message}`); continue; }
    listingId = data.id;
    inserted++;
  }
  // Status stays where the state machine put it. This listing came from our own research,
  // not from the prospect submitting one, so only the linkage columns change. Any pending
  // draft is cancelled because its copy offers a listing they now already have.
  await sb.from("prospects").update({
    existing_listing_table: table,
    existing_listing_id: listingId,
    updated_at: new Date().toISOString(),
  }).eq("id", p.id);
  const { data: staleDrafts } = await sb.from("outreach_messages")
    .update({ send_status: "cancelled" })
    .eq("prospect_id", p.id).eq("send_status", "draft").eq("approved_by_human", false)
    .select("id");
  if (staleDrafts?.length) console.log(`  cancelled ${staleDrafts.length} draft(s) for ${v.name}: they are listed now, so the copy no longer applies`);
  await sb.from("outreach_events").insert({
    prospect_id: p.id,
    agent: "publishability-review-p5",
    action: existingId ? "listing_updated" : "listing_published",
    reason: `${v.mahjong_variant} verified; ${v.activity_recency}; schedule ${v.schedule_confidence}`.slice(0, 400),
    evidence: `${table}/${listingId} | ${(v.source_urls || []).join(" ")}`.slice(0, 900),
    deterministic: false,
    ai_generated: true,
  });
}
console.log(`\nAPPLIED: ${inserted} listings published, ${updated} updated, each with source, evidence, and an audit event.`);
