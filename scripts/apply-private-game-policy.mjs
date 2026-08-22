// Applies the Phase 6 private game policy to the four home game records. A home game may be
// listed only with evidence of both a real recurring game and host intent to accept players
// from outside their existing circle. Where that intent cannot be established the record is
// held, which for an already published row means pulling it back to review.
//
// Dry run by default. Targets records by id, preserves human notes by appending, records an
// audit event per record, and never deletes anything.
// Run: node --env-file=.env.local scripts/apply-private-game-policy.mjs <findings.json> [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { detectPrivateLocation, redactStreetDetail } from "../lib/private-location.ts";
import { canPublishToAmericanDirectory, normalizeVariant, VARIANT_CONFIDENCES } from "../lib/mahjong-variant.ts";

const APPLY = process.argv.includes("--apply");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const findings = JSON.parse(readFileSync(process.argv[2], "utf8"));

// The workflow returns its own slugs, so each finding is bound to a real row here rather than
// trusting an id that never came from the database.
const ROW_BY_SLUG = {
  "meetup-american-mahjong-meetup-group-phoenix-thursday-1245": "59cba99f-d3bd-477b-8b07-a472978f2e4a",
  "henderson-mah-jongg-meetup": "788946a6-bc66-4ecd-9205-da8f2389eb11",
  "meetup-ladies-game-group-american-mahjongg-lv-nv": "91ceb2fc-31db-4f65-a5e1-0b0d5dfe1cd1",
  "naples-ladies-mah-jongg-american-version": "d07607f9-cb04-49b3-9fb6-6a22b89a5993",
};

// Corrections the evidence supports, quoted in each finding. Written here rather than derived
// from prose so every field change is reviewable in the diff.
const CORRECTIONS = {
  "788946a6-bc66-4ecd-9205-da8f2389eb11": {
    description: "Ladies only. Not a National Mah Jongg League group: they play Marvelous and Siamese cards. Mondays and Thursdays, 11:00 AM to 3:00 PM. The host says they play a different Marvelous card each time, from a collection going back to 2014, and they also play Imperial and Siamese. Their page says the group is not a fit for players who only want NMJL play. The location is visible to members once you join.",
    venue: "Henderson, NV",
    day_time: "Mondays and Thursdays, 11:00 AM to 3:00 PM",
    frequency: "weekly",
    source_url: "https://www.meetup.com/henderson-mah-jongg-meetup/",
  },
  "91ceb2fc-31db-4f65-a5e1-0b0d5dfe1cd1": {
    description: "Private group, so you must join before you can see the location or RSVP. American Mahjong at 6:00 PM on a Thursday evening, hosted by the Ladies Game Group, a Meetup group for women 21 and up. The group page currently shows one scheduled session rather than a standing cadence.",
    venue: "Las Vegas, NV",
    day_time: "First Thursday of the month, 6:00 PM",
    frequency: "monthly",
    source_url: "https://www.meetup.com/ladies-game-group/",
  },
  "59cba99f-d3bd-477b-8b07-a472978f2e4a": {
    // The old text claimed the address was gated. It is not: the host publishes it on Meetup.
    // Saying so plainly matters, because the next reader should not trust that protection.
    venue: "Phoenix, AZ",
    description: "American Mahjong, Thursdays 12:45 PM to 2:45 PM, at a private home in Phoenix. Bring a current National Mah Jongg League card. The group describes itself as mostly intermediate and advanced players.",
    day_time: "Thursdays, 12:45 PM to 2:45 PM",
    frequency: "weekly",
    source_url: "https://www.meetup.com/american-mahjong-meetup-group/",
  },
  "d07607f9-cb04-49b3-9fb6-6a22b89a5993": {
    venue: "Naples, FL",
    description: "No sessions are scheduled at the moment. In season this is American Mahjong for women on Tuesdays and Thursdays at a private home in Naples, and beginners are welcome. Players reserve a spot through Meetup. The host collects $1 per person to cover Meetup fees and supplies, and players bring quarters for the game.",
    day_time: "Tuesdays and Thursdays in season, no sessions currently scheduled",
    frequency: null,
    source_url: "https://www.meetup.com/naples-mahjong-meetup-group/",
  },
};

// "Keep published" means keep, never promote. Putting a home game in front of players for
// the first time is Shauna's call, and this script only ever moves a record toward review.
const HOLDING_DISPOSITIONS = new Set(["HOLD_PENDING_HOST_INTENT", "UNPUBLISH_RECOMMENDED", "HUMAN_DECISION_REQUIRED"]);
function targetStatusFor(disposition, currentStatus) {
  if (HOLDING_DISPOSITIONS.has(disposition)) return "pending_review";
  return currentStatus;
}

const planned = [];
for (const f of findings) {
  const id = ROW_BY_SLUG[f.id];
  if (!id) { console.error(`  no row mapped for finding ${f.id}, skipping`); continue; }
  const { data: row, error } = await sb.from("event_listings")
    .select("id,event_name,status,venue,address,description,day_time,review_flag,reviewer_notes,mahjong_variant,variant_confidence").eq("id", id).single();
  if (error) { console.error(`  lookup failed for ${f.name}: ${error.message}`); continue; }

  const corrections = CORRECTIONS[id] || {};
  const KNOWN = ["KEEP_PUBLISHED_WITH_PRIVACY_CONTROLS", "SAFE_AS_IS", "HOLD_PENDING_HOST_INTENT", "UNPUBLISH_RECOMMENDED", "HUMAN_DECISION_REQUIRED"];
  if (!KNOWN.includes(f.disposition)) { console.error(`  unrecognized disposition ${f.disposition} for ${f.name}, skipping`); continue; }
  const targetStatus = targetStatusFor(f.disposition, row.status);
  const update = { ...corrections };
  // Structured recurrence outlives corrected text, so a monthly or paused game would keep
  // telling a player it runs every week.
  if (/\bmonthly\b/i.test(String(corrections.frequency || "")) || /\b(first|second|third|fourth|last)\b|no sessions/i.test(String(corrections.day_time || ""))) {
    update.day_of_week = null;
    update.is_recurring = false;
  }
  if (targetStatus !== row.status) update.status = targetStatus;
  // The flag means "held", so it only goes on records actually pulled back to review.
  // Only flag when this script is the thing moving the row, so a phone_verify or freshness
  // flag another reviewer set is not silently replaced.
  if (targetStatus === "pending_review" && targetStatus !== row.status && !row.review_flag) update.review_flag = "private_location_hold";
  if (!row.mahjong_variant) {
    const proposed = normalizeVariant(f.mahjong_variant === "AMERICAN_NMJL" ? "AMERICAN" : f.mahjong_variant);
    // American family but not NMJL has no value in this vocabulary, so those go to a person
    // rather than being flattened into AMERICAN. Same rule the backfill applies.
    const text = `${corrections.description || row.description || ""} ${f.variant_evidence || ""}`;
    update.mahjong_variant = proposed === "AMERICAN" && /\b(marvelous|siamese|imperial|royale)\b/i.test(text) ? "AMERICAN_NON_NMJL" : proposed;
    // "High confidence unknown" says nothing, so an unresolved variant records no confidence.
    const conf = String(f.variant_confidence || "").toLowerCase();
    update.variant_confidence = update.mahjong_variant === "UNKNOWN" ? null : (VARIANT_CONFIDENCES.includes(conf) ? conf : "low");
    update.variant_evidence = (f.variant_evidence || "").slice(0, 900);
  }

  // Nothing this script writes may narrow a home below city level. A record that still has
  // street detail is the one that most needs holding, so the hold always applies and the
  // unsafe text is scrubbed rather than the whole record being skipped.
  const privacy = detectPrivateLocation({ venue: update.venue ?? row.venue, address: row.address, description: update.description ?? row.description, day_time: update.day_time ?? row.day_time });
  let heldForPrivacy = false;
  if (privacy.hasStreetDetail) {
    console.error(`  ${f.name} still carries street detail, redacting it and holding the record`);
    heldForPrivacy = true;
    if (row.address) update.address = redactStreetDetail(row.address) || null;
    update.venue = redactStreetDetail(update.venue ?? row.venue) || null;
    update.description = redactStreetDetail(update.description ?? row.description) || null;
    if (update.day_time ?? row.day_time) update.day_time = redactStreetDetail(update.day_time ?? row.day_time) || null;
    if (!row.review_flag) update.review_flag = "private_location_hold";
  }

  // One gate, one answer. A row the publish path would refuse must not stay live here.
  const variantGate = canPublishToAmericanDirectory(update.mahjong_variant ?? row.mahjong_variant, update.variant_confidence ?? row.variant_confidence);
  const mustHold = heldForPrivacy || (row.status === "published" && !variantGate.allowed);
  const effectiveStatus = mustHold ? "pending_review" : targetStatus;
  if (effectiveStatus !== row.status) update.status = effectiveStatus;
  if (mustHold && !row.review_flag) update.review_flag = "private_location_hold";
  if (mustHold && !variantGate.allowed) console.error(`  holding ${f.name}: ${variantGate.reason}`);

  // Nothing may leave this script still carrying a street.
  const after = detectPrivateLocation({ venue: update.venue ?? row.venue, address: update.address ?? row.address, description: update.description ?? row.description, day_time: update.day_time ?? row.day_time });
  if (after.hasStreetDetail) { console.error(`  ABORT: ${f.name} still contains street detail after redaction`); process.exitCode = 1; continue; }

  planned.push({ row, f, update, targetStatus: effectiveStatus });
}

console.log(`records to update: ${planned.length}\n`);
for (const { row, f, update, targetStatus } of planned) {
  console.log(`${f.disposition}`);
  console.log(`  ${String(row.event_name || "").slice(0, 56)}`);
  console.log(`  status: ${row.status}${targetStatus !== row.status ? ` -> ${targetStatus}` : " (unchanged)"}`);
  console.log(`  venue: ${row.venue} -> ${update.venue ?? "(unchanged)"}`);
  console.log(`  variant: ${row.mahjong_variant || "(none)"} -> ${update.mahjong_variant ?? "(unchanged)"}`);
  console.log(`  outside players welcome: ${f.outsiders_invited}; address exposed on the source itself: ${f.residential_detail_found_publicly}`);
}

if (!APPLY) { console.log("\nDRY RUN. Re-run with --apply."); process.exit(0); }

let applied = 0;
for (const { row, f, update, targetStatus } of planned) {
  update.reviewer_notes = `${new Date().toISOString().slice(0, 10)} private game policy: ${f.disposition}. Outside players welcome: ${f.outsiders_invited}. ${(f.reasoning || "").slice(0, 500)} | ${(row.reviewer_notes || "").slice(0, 2200)}`;
  const { data, error } = await sb.from("event_listings").update(update).eq("id", row.id).eq("status", row.status).select("id");
  if (error) { console.error(`  update failed ${f.name}: ${error.message}`); process.exitCode = 1; continue; }
  if (!data?.length) { console.error(`  status moved concurrently for ${f.name}, skipped`); process.exitCode = 1; continue; }
  const { error: evErr } = await sb.from("outreach_events").insert({
    agent: "private-game-policy-p6",
    action: "private_game_" + f.disposition.toLowerCase(),
    reason: `${f.outsiders_invited} on outside players; ${f.is_real_recurring_game ? "real recurring game" : "activity unconfirmed"}`.slice(0, 400),
    evidence: `event_listings/${row.id} status ${row.status} -> ${targetStatus} | ${(f.source_urls || []).join(" ")}`.slice(0, 900),
    deterministic: false,
    ai_generated: true,
  });
  if (evErr) { console.error(`  audit event failed for ${f.name}: ${evErr.message}`); process.exitCode = 1; }
  applied++;
}
console.log(`\nAPPLIED: ${applied} records updated. Nothing was deleted; held records moved to review, not removed.`);
