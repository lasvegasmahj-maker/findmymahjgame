// Freshness Agent, Level 0. Scores every published listing for reverification need, probes
// source URLs, and files findings as review flags plus audit events. Proposes; never edits
// public fields. Reads only unless --apply is passed.
// Run: node --env-file=.env.local scripts/freshness-scan.mjs [--apply]
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const NOW = Date.now();
const DAY = 86400000;

const [v, e] = await Promise.all([
  sb.from("venue_listings").select("id,business_name,city,state,venue_type,website,source_url,confirmed_active_at,updated_at,ended_reports").eq("status", "published"),
  sb.from("event_listings").select("id,event_name,city,state,event_type,source_url,registration_url,confirmed_active_at,updated_at,event_date,is_recurring,day_of_week,ended_reports,schedule_parsed_at").eq("status", "published"),
]);
const rows = [
  ...v.data.map((r) => ({ ...r, kind: "venue", name: r.business_name })),
  ...e.data.map((r) => ({ ...r, kind: "event", name: r.event_name })),
];
console.log(`published listings scanned: ${rows.length}`);

async function probe(u) {
  if (!u) return null;
  try {
    const r = await fetch(u, { redirect: "follow", signal: AbortSignal.timeout(10000), headers: { "User-Agent": "Mozilla/5.0 FindMyMahjGame-freshness" } });
    return r.status;
  } catch { return 0; }
}

const findings = [];
for (const r of rows) {
  const reasons = [];
  let priority = 0;
  const verifiedAt = r.confirmed_active_at || r.schedule_parsed_at || r.updated_at;
  const ageDays = verifiedAt ? (NOW - new Date(verifiedAt).getTime()) / DAY : Infinity;

  if (r.kind === "event" && r.is_recurring) { priority += 2; if (ageDays > 45) reasons.push(`recurring game unverified for ${Math.round(ageDays)} days`); }
  if (r.kind === "event" && r.event_date && new Date(r.event_date).getTime() < NOW && !r.is_recurring) { priority += 3; reasons.push("one-off event date has passed"); }
  if ((r.ended_reports ?? 0) > 0) { priority += 3; reasons.push(`${r.ended_reports} player report(s) that it ended`); }
  if (!verifiedAt || ageDays > 90) { priority += 1; reasons.push("no verification in 90 days"); }

  const src = await probe(r.source_url);
  if (r.source_url && (src === 404 || src === 410)) { priority += 3; reasons.push(`source URL dead (${src})`); }
  else if (r.source_url && src === 0) { priority += 1; reasons.push("source URL unreachable"); }
  if (r.kind === "venue" && r.website) {
    const own = await probe(r.website);
    if (own === 404 || own === 410) { priority += 3; reasons.push(`own website dead (${own})`); }
  }

  if (reasons.length) findings.push({ id: r.id, kind: r.kind, name: r.name, city: r.city, state: r.state, priority, reasons });
}

findings.sort((a, b) => b.priority - a.priority);
console.log(`listings needing reverification: ${findings.length}`);
for (const f of findings.slice(0, 15)) {
  console.log(`  P${f.priority} [${f.kind}] ${f.name.slice(0, 44)} (${f.city}, ${f.state}): ${f.reasons.join("; ")}`);
}

if (!APPLY) { console.log("\nDRY RUN. Re-run with --apply to file review flags and audit events."); process.exit(0); }

let flagged = 0;
for (const f of findings) {
  const table = f.kind === "event" ? "event_listings" : "venue_listings";
  await sb.from(table).update({ review_flag: `freshness_p${f.priority}` }).eq("id", f.id);
  await sb.from("outreach_events").insert({
    agent: "freshness-agent-l0",
    action: "reverification_proposed",
    reason: f.reasons.join("; ").slice(0, 500),
    evidence: `listing ${table}/${f.id}`,
    deterministic: true,
  });
  flagged++;
}
console.log(`APPLIED: ${flagged} review flags + audit events filed. No public fields changed.`);
