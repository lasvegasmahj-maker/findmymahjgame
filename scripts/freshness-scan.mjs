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
  sb.from("venue_listings").select("id,business_name,city,state,venue_type,website,source_url,confirmed_active_at,updated_at,ended_reports,review_flag").eq("status", "published"),
  sb.from("event_listings").select("id,event_name,city,state,event_type,source_url,registration_url,confirmed_active_at,updated_at,event_date,is_recurring,day_of_week,ended_reports,schedule_parsed_at,review_flag").eq("status", "published"),
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
    return { status: r.status, moved: r.url && r.url !== u && new URL(r.url).pathname === "/" && new URL(u).pathname !== "/" };
  } catch { return { status: 0, moved: false }; }
}

// Cadence: rows verified more recently than the configured interval are skipped entirely,
// so the scan is cheap and safe to run on a schedule without rework.
const { data: cfg } = await sb.from("app_settings").select("value").eq("key", "growth_freshness_interval_days").maybeSingle();
const parsedInterval = Number(cfg?.value);
const INTERVAL_DAYS = Number.isFinite(parsedInterval) && parsedInterval > 0 ? parsedInterval : 14;

const findings = [];
for (const r of rows) {
  const reasons = [];
  let priority = 0;
  const verifiedAt = r.confirmed_active_at || r.schedule_parsed_at || r.updated_at;
  const ageDays = verifiedAt ? (NOW - new Date(verifiedAt).getTime()) / DAY : Infinity;

  const urgent = (r.ended_reports ?? 0) > 0 || (r.kind === "event" && !r.is_recurring && r.event_date && new Date(r.event_date).getTime() < NOW);
  if (Number.isFinite(ageDays) && ageDays < INTERVAL_DAYS && !urgent) continue;
  if (r.kind === "event" && r.is_recurring) { priority += 2; if (ageDays > 45) reasons.push(`recurring game unverified for ${Math.round(ageDays)} days`); }
  if (r.kind === "event" && r.event_date && new Date(r.event_date).getTime() < NOW && !r.is_recurring) { priority += 3; reasons.push("one-off event date has passed"); }
  if ((r.ended_reports ?? 0) > 0) { priority += 3; reasons.push(`${r.ended_reports} player report(s) that it ended`); }
  if (!verifiedAt || ageDays > 90) { priority += 1; reasons.push("no verification in 90 days"); }

  const src = await probe(r.source_url);
  if (r.source_url && (src.status === 404 || src.status === 410)) { priority += 3; reasons.push(`source URL dead (${src.status})`); }
  else if (r.source_url && src.status === 0) { priority += 1; reasons.push("source URL unreachable"); }
  else if (r.source_url && src.moved) { priority += 1; reasons.push("source URL redirects to the site root; content likely moved"); }
  if (r.kind === "venue" && r.website) {
    const own = await probe(r.website);
    if (own.status === 404 || own.status === 410) { priority += 3; reasons.push(`own website dead (${own.status})`); }
  }

  // Severity is a named judgement, not a bare number, so the admin queue reads honestly.
  const severity =
    reasons.some((x) => x.includes("source URL dead")) ? "SOURCE_GONE" :
    priority >= 5 ? "REVIEW_REQUIRED" :
    priority >= 3 ? "REVIEW_SOON" :
    reasons.some((x) => x.includes("redirects")) ? "CHANGED" :
    reasons.length ? "REVIEW_SOON" : "HEALTHY";
  if (reasons.length) findings.push({ id: r.id, kind: r.kind, name: r.name, city: r.city, state: r.state, priority, severity, reasons, currentFlag: r.review_flag });
}

findings.sort((a, b) => b.priority - a.priority);
console.log(`listings needing reverification: ${findings.length}`);
const bySev = {};
for (const f of findings) bySev[f.severity] = (bySev[f.severity] || 0) + 1;
console.log("by severity:", JSON.stringify(bySev));
for (const f of findings.slice(0, 15)) {
  console.log(`  ${f.severity} [${f.kind}] ${f.name.slice(0, 44)} (${f.city}, ${f.state}): ${f.reasons.join("; ")}`);
}

if (!APPLY) { console.log("\nDRY RUN. Re-run with --apply to file review flags and audit events."); process.exit(0); }

let flagged = 0, skippedDup = 0;
for (const f of findings) {
  const table = f.kind === "event" ? "event_listings" : "venue_listings";
  const newFlag = `freshness_${f.severity.toLowerCase()}`;
  // One open review task per listing, keyed on the live flag: while the flag an admin has
  // not yet cleared still matches this severity, nothing is refiled. Clearing the flag or a
  // severity change makes the next scan file a fresh finding.
  if (f.currentFlag === newFlag) { skippedDup++; continue; }
  if (f.currentFlag && !f.currentFlag.startsWith("freshness_")) { console.log(`  ${f.name.slice(0, 40)}: already queued for humans as ${f.currentFlag}, not overwriting`); skippedDup++; continue; }
  await sb.from(table).update({ review_flag: newFlag }).eq("id", f.id);
  await sb.from("outreach_events").insert({
    agent: "freshness-agent-l0",
    action: "reverification_proposed",
    reason: f.reasons.join("; ").slice(0, 500),
    evidence: `listing ${table}/${f.id} severity=${f.severity}`,
    deterministic: true,
  });
  flagged++;
}
console.log(`duplicate findings skipped: ${skippedDup}`);
console.log(`APPLIED: ${flagged} review flags + audit events filed. No public fields changed.`);
