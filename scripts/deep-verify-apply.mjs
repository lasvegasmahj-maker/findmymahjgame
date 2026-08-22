// Applies deep-verify dispositions to the NEEDS_REVIEW prospects. Deterministic mapping,
// legal state transitions only, one immutable audit event per prospect, idempotent.
// Run: node --env-file=.env.local scripts/deep-verify-apply.mjs <findings.json>
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import { canTransition } from "../lib/prospect-state.ts";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const findings = JSON.parse(readFileSync(process.argv[2], "utf8"));
const counts = {};

for (const f of findings) {
  const findingKey = "deepverify:" + crypto.createHash("sha256").update(f.id + "|" + f.disposition + "|" + (f.evidence || "")).digest("hex").slice(0, 24);
  const { data: prior } = await sb.from("outreach_events").select("id").eq("prospect_id", f.id).eq("agent", "deep-verify-agent").like("evidence", findingKey + "%").limit(1);
  if (prior && prior.length) { console.log(`SKIP (this finding already applied): ${f.name}`); continue; }

  const { data: p, error: perr } = await sb.from("prospects").select("id,name,status,city,public_email,public_phone,website_url,metro,state").eq("id", f.id).single();
  if (perr || !p) { console.error(`missing prospect ${f.name}: ${perr?.message}`); continue; }

  const target = f.disposition === "QUALIFIED" ? "QUALIFIED" : f.disposition === "REJECTED" ? "REJECTED" : null;
  const update = {
    qualification_score: f.score,
    qualification_reason: (f.evidence || "").slice(0, 600),
    last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const alreadyThere = target && p.status === target;
  if (target && !alreadyThere) {
    if (!canTransition(p.status, target)) { console.error(`ILLEGAL ${p.status} -> ${target} for ${f.name}, leaving as is`); continue; }
    update.status = target;
    if (target === "QUALIFIED") update.verified_at = new Date().toISOString();
  } else if (!target) {
    const label = f.disposition === "PHONE_VERIFY" ? "PHONE_VERIFY" : "STILL_NEEDS_HUMAN_REVIEW";
    update.research_notes = `${label}: ${(f.evidence || "").slice(0, 700)}`;
  }
  const CONTACT_FIELDS = new Set(["public_email", "public_phone", "website_url", "metro", "state", "city"]);
  for (const [k, v] of Object.entries(f.contact_updates || {})) {
    if (!CONTACT_FIELDS.has(k)) { console.log(`  refusing to write non-contact field ${k}`); continue; }
    if (k === "public_email") {
      if (p.public_email) continue;
      const { data: clash } = await sb.from("prospects").select("id").ilike("public_email", String(v).replace(/[%_]/g, "\\$&")).limit(1);
      if (clash && clash.length) { console.log(`  email ${v} already on another prospect, not copying`); continue; }
      update.public_email = v;
    } else if (!p[k]) update[k] = v;
  }

  const { data: touched, error: uerr } = await sb.from("prospects").update(update).eq("id", f.id).eq("status", p.status).select("id");
  if (uerr) { console.error(`update failed ${f.name}: ${uerr.message}`); continue; }
  if (!touched || !touched.length) { console.error(`status moved concurrently for ${f.name}, skipping audit`); continue; }

  const { error: aerr } = await sb.from("outreach_events").insert({
    prospect_id: f.id,
    agent: "deep-verify-agent",
    action: "deep_verify_" + f.disposition.toLowerCase(),
    reason: (f.evidence || "").slice(0, 400) + (f.duplicate_of ? ` | duplicate_of: ${f.duplicate_of}` : ""),
    evidence: findingKey + " | " + (f.source_urls || []).join(" "),
    previous_state: p.status,
    new_state: target || p.status,
    deterministic: false,
    ai_generated: true,
  });
  if (aerr) { console.error(`audit insert failed ${f.name}: ${aerr.message}`); continue; }
  counts[f.disposition] = (counts[f.disposition] || 0) + 1;
  console.log(`${f.disposition.padEnd(26)} ${f.name}${target ? ` (${p.status} -> ${target})` : ""}`);
}
console.log("\napplied:", JSON.stringify(counts));
