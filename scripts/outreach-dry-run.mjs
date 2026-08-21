// End-to-end outreach dry run. Simulates the full lifecycle for one synthetic prospect:
// discover -> qualify -> ready -> draft -> simulated send -> scheduled follow-up -> reply ->
// classify interested -> cancel follow-up -> invite click -> signup -> listing submitted.
// EVERYTHING stays inside the database: send_status never leaves 'dry_run', the send guard is
// exercised and must DENY (autonomy 0), and the whole run is audited then left in place for
// admin inspection. No email of any kind is generated to a provider.
// Run: node --env-file=.env.local scripts/outreach-dry-run.mjs
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const audit = (prospect_id, agent, action, reason, extra = {}) =>
  sb.from("outreach_events").insert({ prospect_id, agent, action, reason: reason.slice(0, 500), deterministic: true, ...extra });

const EMAIL = "dryrun-studio@example.invalid";
await sb.from("invite_tokens").delete().like("token", "dryrun_%");
await sb.from("prospects").delete().eq("public_email", EMAIL);

const { data: p, error } = await sb.from("prospects").insert({
  name: "Dry Run Studio (synthetic)",
  organization_name: "Dry Run Studio",
  prospect_type: "studio",
  city: "Testville", state: "ZZ", metro: "Dry Run",
  website_url: "https://example.invalid", public_email: EMAIL,
  source_url: "https://example.invalid/source", source_type: "imported",
  qualification_score: 92, qualification_reason: "synthetic end-to-end dry run",
  status: "DISCOVERED",
}).select().single();
if (error) { console.error(error.message); process.exit(1); }
console.log("1 prospect created:", p.id);

const steps = [["VERIFYING","qualification-agent"],["QUALIFIED","qualification-agent"],["READY_FOR_OUTREACH","qualification-agent"]];
for (const [to, agent] of steps) {
  const { data: cur } = await sb.from("prospects").select("status").eq("id", p.id).single();
  await sb.from("prospects").update({ status: to }).eq("id", p.id).eq("status", cur.status);
  await audit(p.id, agent, "state_transition", `dry run: ${cur.status} -> ${to}`, { previous_state: cur.status, new_state: to });
}
console.log("2 qualified -> READY_FOR_OUTREACH");

// The send guard MUST deny at autonomy 0. Exercised via the same settings checks the app uses.
const { data: settings } = await sb.from("app_settings").select("key,value").like("key", "growth_%");
const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));
const denials = [];
if (s.growth_outreach_enabled !== "true") denials.push("outreach_disabled");
if (Number(s.growth_autonomy_level) < 2) denials.push("autonomy_level_too_low");
if (Number(s.growth_daily_send_limit) <= 0) denials.push("daily_limit_reached");
if (denials.length === 0) { console.error("GUARD FAILURE: send would have been allowed"); process.exit(1); }
console.log("3 SEND GUARD DENIED as required:", denials.join(", "));
await audit(p.id, "outreach-agent", "send_blocked_by_guard", `denials: ${denials.join(", ")}`);

const token = "dryrun_" + crypto.randomBytes(12).toString("base64url");
await sb.from("invite_tokens").insert({ token, prospect_id: p.id, conversion_stage: "created" });
const { data: msg } = await sb.from("outreach_messages").insert({
  prospect_id: p.id, message_type: "outreach", sequence_step: 0,
  generated_subject: "List Dry Run Studio on Find My Mahj Game",
  generated_body: `Facts used: studio in Testville ZZ; source example.invalid. Invite: https://findmymahjgame.com/join?invite=${token}`,
  facts_used: "prospect_type=studio; city=Testville; source_url on file",
  send_status: "dry_run",
}).select().single();
await sb.from("outreach_messages").insert({ prospect_id: p.id, message_type: "followup", sequence_step: 1, send_status: "scheduled_dry_run" });
await sb.from("prospects").update({ status: "OUTREACH_ACTIVE" }).eq("id", p.id).eq("status", "READY_FOR_OUTREACH");
console.log("4 draft + simulated Day 0 send + Day 4 follow-up scheduled (all dry_run):", msg.id);

await sb.from("outreach_messages").update({ reply_status: "replied_interested" }).eq("id", msg.id);
await sb.from("prospects").update({ status: "REPLIED" }).eq("id", p.id).eq("status", "OUTREACH_ACTIVE");
await sb.from("prospects").update({ status: "INTERESTED" }).eq("id", p.id).eq("status", "REPLIED");
const { data: cancelled } = await sb.from("outreach_messages")
  .update({ send_status: "cancelled" }).eq("prospect_id", p.id).eq("send_status", "scheduled_dry_run").select("id");
await audit(p.id, "reply-agent", "reply_classified", "simulated reply classified INTERESTED; follow-ups cancelled", { ai_generated: false });
console.log(`5 reply -> INTERESTED, follow-ups cancelled: ${cancelled.length}`);

await sb.from("invite_tokens").update({ clicked_at: new Date().toISOString(), conversion_stage: "clicked" }).eq("token", token);
await sb.from("prospects").update({ status: "ONBOARDING" }).eq("id", p.id).eq("status", "INTERESTED");
await sb.from("prospects").update({ status: "SIGNUP_STARTED" }).eq("id", p.id).eq("status", "ONBOARDING");
await sb.from("invite_tokens").update({ conversion_stage: "listing_submitted" }).eq("token", token);
await sb.from("prospects").update({ status: "LISTING_SUBMITTED" }).eq("id", p.id).eq("status", "SIGNUP_STARTED");
await audit(p.id, "onboarding-agent", "conversion_tracked", "invite clicked -> signup -> listing submitted (simulated)");
console.log("6 invite click -> signup -> LISTING_SUBMITTED, attribution tracked");

const { data: trail } = await sb.from("outreach_events").select("agent,action,new_state").eq("prospect_id", p.id).order("created_at");
console.log(`7 audit trail rows: ${trail.length}`);
const { count } = await sb.from("outreach_messages").select("id", { count: "exact", head: true }).eq("prospect_id", p.id).eq("send_status", "sent");
console.log(`8 messages with send_status=sent: ${count} (must be 0)`);
if (count > 0) process.exit(1);
console.log("\nDRY RUN COMPLETE. Synthetic records left in place for admin inspection.");
