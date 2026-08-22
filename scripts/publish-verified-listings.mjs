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

// The event_type vocabulary the schema and the player-facing pages agree on. A researched
// tournament shown as open play tells a player to drop in on a ticketed event, so an
// unresolvable category skips the row rather than falling back.
const EVENT_TYPE_RULES = [
  [/tournament/i, "tournament"],
  [/cruise/i, "cruise"],
  [/retreat|getaway/i, "retreat"],
  [/league/i, "league"],
  [/class|lesson|workshop|instruction|learn/i, "class"],
  [/open play|drop.?in|club|game|social|community|library|senior/i, "open_play"],
];
function resolveEventType(verdict) {
  const text = `${verdict.suggested_category || ""} ${verdict.schedule_text || ""} ${verdict.proposed_description || ""}`;
  for (const [re, type] of EVENT_TYPE_RULES) if (re.test(text)) return type;
  return null;
}
// venue_type is rendered verbatim as a public category chip and, together with the
// description, decides whether lib/search.ts routes a row onto /teachers. AI free text cannot
// be trusted with either job, so it is mapped onto a fixed vocabulary and an unmappable
// category skips the row, matching the rule events already follow.
const VENUE_TYPE_RULES = [
  [/instructor|teacher|teaching|lesson|class|coach/i, "Mahjong Instructor"],
  [/studio/i, "Mahjong Studio"],
  [/library/i, "Library"],
  [/jcc|synagogue|temple/i, "JCC"],
  [/senior|55\+|retirement/i, "Senior Center"],
  [/community|rec center|recreation/i, "Community Center"],
  [/club/i, "Club"],
  [/cafe|restaurant|bar|brewery|game store|shop/i, "Venue"],
  [/tournament/i, "Tournament Organizer"],
  [/retreat|travel|cruise/i, "Retreat Organizer"],
];
function resolveVenueType(verdict) {
  for (const [re, label] of VENUE_TYPE_RULES) if (re.test(String(verdict.suggested_category || ""))) return label;
  return null;
}
// A row whose category says one thing while its description routes it somewhere else would
// appear under the wrong heading, so the composed row is checked before it is written.
const TEACHER_ROUTING = /instructor|teacher|lesson|studio|school|class/i;

async function urlIsLive(url) {
  if (!url) return false;
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "User-Agent": "Mozilla/5.0 FindMyMahjGame-publish" } });
    return r.status === 200;
  } catch {
    return false;
  }
}

// PostgREST caps a select at 1000 rows, so the listing scan pages until it runs dry. A short
// page silently truncated here would turn an update into a duplicate public listing.
async function fetchAll(table, columns) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(columns).range(from, from + 999);
    if (error) { console.error(`query failed on ${table}: ${error.message}`); process.exit(1); }
    out.push(...(data || []));
    if (!data || data.length < 1000) return out;
  }
}

const [venues, events, prospectsRes] = await Promise.all([
  fetchAll("venue_listings", "id,business_name,city,source_type,status,review_flag,reviewer_notes"),
  fetchAll("event_listings", "id,event_name,city,source_type,status,review_flag,reviewer_notes"),
  sb.from("prospects").select("id,name,organization_name,city,state,metro,website_url,public_email,public_phone,prospect_type"),
]);
if (prospectsRes.error) { console.error(`prospect query failed: ${prospectsRes.error.message}`); process.exit(1); }
const byProspect = new Map(prospectsRes.data.map((p) => [p.id, p]));
const venueKeys = new Map(venues.map((r) => [norm(r.business_name) + "|" + norm(r.city), r]));
const eventKeys = new Map(events.map((r) => [norm(r.event_name) + "|" + norm(r.city), r]));

const planned = [];
for (const v of verdicts) {
  const p = byProspect.get(v.id);
  if (!p) { console.error(`  no prospect row for ${v.name}, skipping`); continue; }

  if (!v.proposed_description) { console.error(`  no verified description for ${v.name}, skipping`); continue; }
  // The directory is built exclusively for American mahjong and has no way to show a player
  // which variant a listing plays. Until it does, only a source-confirmed American NMJL
  // entity may publish; anything else would send a player to a table they cannot sit at.
  if (v.mahjong_variant !== "AMERICAN_NMJL") {
    console.error(`  BLOCKED by variant gate: ${v.name} (${v.mahjong_variant})`);
    continue;
  }

  const isEvent = v.listing_kind === "event";
  const table = isEvent ? "event_listings" : "venue_listings";
  const nameKey = norm(v.name) + "|" + norm(p.city);
  const existing = (isEvent ? eventKeys : venueKeys).get(nameKey) || null;
  // Only a row this pipeline created may be rewritten. Anything an owner submitted, a human
  // flagged, or an admin unpublished is left exactly as it is.
  if (existing && (existing.source_type !== "imported" || (existing.review_flag && !existing.review_flag.startsWith("freshness_")))) {
    console.error(`  existing listing for ${v.name} is human owned or flagged, leaving it alone`);
    continue;
  }
  const existingId = existing?.id || null;

  const ordinalCadence = ORDINAL_RE.test(String(v.schedule_text || ""));
  const days = ordinalCadence ? [] : (v.day_of_week || []).map((d) => String(d).toLowerCase()).filter((d) => d in DAYS);
  if (ordinalCadence && (v.day_of_week || []).length) console.log(`  note: ${v.name} has an ordinal cadence, keeping schedule text only`);
  const contactEmail = (v.public_contact || "").match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0] || p.public_email || null;
  const phone = (v.public_contact || "").match(/\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}/)?.[0] || p.public_phone || null;

  const eventType = isEvent ? resolveEventType(v) : null;
  if (isEvent && !eventType) { console.error(`  cannot resolve event category for ${v.name}, skipping`); continue; }
  const venueType = isEvent ? null : resolveVenueType(v);
  if (!isEvent && !venueType) { console.error(`  cannot resolve venue category for ${v.name} (${v.suggested_category}), skipping`); continue; }

  // The no-dead-links rule applies to anything a player can click.
  const sourceUrl = v.source_urls?.[0] || null;
  const websiteUrl = p.website_url || sourceUrl;
  const [sourceLive, websiteLive] = await Promise.all([urlIsLive(sourceUrl), urlIsLive(websiteUrl)]);
  if (!sourceLive) { console.error(`  source URL not reachable for ${v.name} (${sourceUrl}), skipping`); continue; }

  const row = isEvent
    ? {
        event_name: v.name.slice(0, 160),
        event_type: eventType,
        city: p.city,
        state: p.state,
        venue: v.public_address || null,
        description: v.proposed_description.slice(0, 800),
        price: v.price_text || null,
        source_url: sourceUrl,
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
        venue_type: venueType,
        city: p.city,
        state: p.state,
        description: v.proposed_description.slice(0, 800),
        website: websiteLive ? websiteUrl : null,
        source_url: sourceUrl,
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
  if (!isEvent) {
    const routesAsTeacher = TEACHER_ROUTING.test(`${row.venue_type} ${row.description}`);
    const meantAsTeacher = venueType === "Mahjong Instructor" || venueType === "Mahjong Studio";
    if (routesAsTeacher !== meantAsTeacher) {
      console.error(`  ${v.name} would appear under the wrong heading (category ${venueType}, description routes as teacher ${routesAsTeacher}), skipping`);
      continue;
    }
  }

  const privacy = detectPrivateLocation({
    venue: row.venue,
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
    // Refresh only what the research owns. Status, contact fields, and reviewer notes stay
    // as they are, so a later human edit is never undone by a rerun.
    const refresh = {
      description: row.description,
      source_url: row.source_url,
      confirmed_active_at: row.confirmed_active_at,
      ...(table === "event_listings"
        ? { day_of_week: row.day_of_week, is_recurring: row.is_recurring, day_time: row.day_time, schedule_confidence: row.schedule_confidence, schedule_parsed_at: row.schedule_parsed_at, price: row.price }
        : { website: row.website }),
    };
    const { error } = await sb.from(table).update(refresh).eq("id", existingId);
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
