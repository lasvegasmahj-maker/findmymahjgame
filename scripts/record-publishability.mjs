// Writes the Phase 5 publishability verdicts back onto the prospect records so the research
// is not lost between phases: which variant a source states, why a candidate is held, and
// what a human would need to resolve. Prospect status is untouched (a hold is a listing
// decision, not an outreach decision) except where the verdict is an outright reject.
// Run: node --env-file=.env.local scripts/record-publishability.mjs <verdicts.json> [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { canTransition } from "../lib/prospect-state.ts";

const APPLY = process.argv.includes("--apply");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const verdicts = JSON.parse(readFileSync(process.argv[2], "utf8")).filter((v) => v.verdict !== "PUBLISHABLE");

console.log(`non-publishable verdicts to record: ${verdicts.length}\n`);
let planned = 0;
const writes = [];
for (const v of verdicts) {
  const { data: p } = await sb.from("prospects").select("id,name,status,research_notes").eq("id", v.id).maybeSingle();
  if (!p) { console.error(`  no prospect ${v.name}`); continue; }
  const note = `PUBLISHABILITY ${v.verdict} (${new Date().toISOString().slice(0, 10)}): variant ${v.mahjong_variant}. ${v.variant_evidence || ""} ${v.reasoning || ""}`.slice(0, 1500);
  if (p.research_notes === note) { console.log(`  SKIP unchanged: ${v.name}`); continue; }
  const target = v.verdict === "REJECT_NOT_CURRENT" && canTransition(p.status, "REJECTED") ? "REJECTED" : null;
  console.log(`  ${v.verdict.padEnd(28)} ${v.name.slice(0, 44).padEnd(44)} ${target ? `${p.status} -> ${target}` : `status unchanged (${p.status})`}`);
  writes.push({ p, v, note, target });
  planned++;
}
console.log(`\nplanned: ${planned}`);
if (!APPLY) { console.log("DRY RUN. Re-run with --apply."); process.exit(0); }

let applied = 0;
for (const { p, v, note, target } of writes) {
  const update = { research_notes: note, updated_at: new Date().toISOString() };
  if (target) update.status = target;
  const { data: touched, error } = await sb.from("prospects").update(update).eq("id", p.id).eq("status", p.status).select("id");
  if (error) { console.error(`  failed ${v.name}: ${error.message}`); continue; }
  if (!touched?.length) { console.error(`  status moved concurrently for ${v.name}, skipped`); continue; }
  await sb.from("outreach_events").insert({
    prospect_id: p.id,
    agent: "publishability-review-p5",
    action: "publishability_" + v.verdict.toLowerCase(),
    reason: `${v.mahjong_variant}: ${(v.reasoning || "").slice(0, 300)}`,
    evidence: (v.source_urls || []).join(" ").slice(0, 900),
    previous_state: p.status,
    new_state: target || p.status,
    deterministic: false,
    ai_generated: true,
  });
  applied++;
}
console.log(`APPLIED: ${applied} prospects annotated with their publishability verdict and evidence.`);
