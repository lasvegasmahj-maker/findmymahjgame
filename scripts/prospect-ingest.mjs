// Qualification Agent, Level 0 ingestion. Takes researched prospects (JSON from the
// prospecting run), applies deterministic qualification and dedupe, and writes survivors
// into the Growth CRM with audit events. Research only; nothing here can send anything.
// Run: node --env-file=.env.local scripts/prospect-ingest.mjs <prospects.json> [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { admissionVerdict, norm, hostOf } from "../lib/prospect-guards.ts";

const APPLY = process.argv.includes("--apply");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const input = JSON.parse(readFileSync(process.argv[2], "utf8"));
const prospects = input.prospects || input;
console.log(`raw prospects in: ${prospects.length}`);


const [existingP, supp, venues, events] = await Promise.all([
  sb.from("prospects").select("name,organization_name,public_email,source_url"),
  sb.from("email_suppressions").select("email"),
  sb.from("venue_listings").select("business_name,city,contact_email,website"),
  sb.from("event_listings").select("event_name,city,contact_email"),
]);
const suppressed = new Set(supp.data.map((x) => x.email.toLowerCase()));
const existingEmails = new Set(existingP.data.map((x) => (x.public_email || "").toLowerCase()).filter(Boolean));
const existingNames = new Set(existingP.data.map((x) => norm(x.organization_name || x.name)));
const listingEmails = new Set([...venues.data, ...events.data].map((x) => (x.contact_email || "").toLowerCase()).filter(Boolean));
const listingNames = new Set([...venues.data.map((x) => norm(x.business_name) + "|" + norm(x.city)), ...events.data.map((x) => norm(x.event_name) + "|" + norm(x.city))]);
const listingHosts = new Set(venues.data.map((x) => hostOf(x.website)).filter(Boolean));

const known = {
  suppressedEmails: suppressed,
  prospectEmails: existingEmails,
  prospectNames: existingNames,
  listingEmails,
  listingNameCityKeys: listingNames,
  listingHosts,
};
const seenBatch = new Set();
const results = { qualified: [], needs_review: [], rejected: [] };
for (const p of prospects) {
  const email = (p.public_email || "").toLowerCase();
  const nameKey = norm(p.organization_name || p.name);
  const cityKey = nameKey + "|" + norm(p.city);
  const host = hostOf(p.website_url || p.source_url);
  const reasons = [];
  let score = 50;

  if (seenBatch.has(cityKey) || seenBatch.has(email && "e:" + email)) { results.rejected.push({ p, why: "duplicate within batch" }); continue; }
  seenBatch.add(cityKey); if (email) seenBatch.add("e:" + email);
  const verdict = admissionVerdict(p, known);
  if (!verdict.admit) { results.rejected.push({ p, why: verdict.reason }); continue; }
  if (host && listingHosts.has(host)) { reasons.push("website host matches an existing listing"); score -= 20; }

  if (p.confidence === "high") score += 35;
  else if (p.confidence === "medium") score += 20;
  if (p.website_url) score += 5;
  if (email || p.public_phone) score += 5;
  else reasons.push("no public business contact captured");
  if (!/mah\s?-?jong+|mahj/i.test(String(p.offerings) + String(p.evidence))) { score -= 30; reasons.push("mahjong relevance not evidenced"); }

  const bucket = score >= 75 ? "qualified" : score >= 50 ? "needs_review" : "rejected";
  results[bucket].push({ p, score, why: reasons.join("; ") || "clean" });
}

console.log(`qualified: ${results.qualified.length} | needs review: ${results.needs_review.length} | rejected: ${results.rejected.length}`);
const rej = {};
for (const r of results.rejected) rej[r.why] = (rej[r.why] || 0) + 1;
for (const [k, n] of Object.entries(rej).sort((a, b) => b[1] - a[1])) console.log(`   reject ${n}: ${k}`);

if (!APPLY) { console.log("\nDRY RUN. Re-run with --apply to ingest."); process.exit(0); }

let inserted = 0;
for (const bucket of ["qualified", "needs_review"]) {
  for (const { p, score, why } of results[bucket]) {
    const status = bucket === "qualified" ? "QUALIFIED" : "NEEDS_REVIEW";
    const { data: row, error } = await sb.from("prospects").insert({
      name: p.name.slice(0, 160), organization_name: (p.organization_name || p.name).slice(0, 160),
      prospect_type: p.prospect_type, city: p.city, state: p.state, metro: p.metro || "Los Angeles",
      website_url: p.website_url || null, public_email: p.public_email || null, public_phone: p.public_phone || null,
      social_url: p.social_url || null, source_url: p.source_url, source_type: "imported",
      offerings: (p.offerings || "").slice(0, 500),
      qualification_score: score, qualification_reason: (`${p.evidence || ""} ${why !== "clean" ? "(" + why + ")" : ""}`).trim().slice(0, 600),
      agent_confidence: p.confidence, status,
    }).select("id").single();
    if (error) { console.error(`  insert failed ${p.name.slice(0, 30)}: ${error.message}`); continue; }
    await sb.from("prospect_sources").insert({ prospect_id: row.id, source_url: p.source_url, source_type: "research", evidence_text: (p.evidence || "").slice(0, 800), verification_status: p.confidence });
    await sb.from("outreach_events").insert({ prospect_id: row.id, agent: "prospecting-agent-l0", action: "discovered_and_" + (status === "QUALIFIED" ? "qualified" : "queued_for_review"), reason: (p.evidence || "").slice(0, 400), deterministic: false, ai_generated: true, new_state: status });
    inserted++;
  }
}
console.log(`APPLIED: ${inserted} prospects ingested into the Growth CRM with sources and audit events.`);
