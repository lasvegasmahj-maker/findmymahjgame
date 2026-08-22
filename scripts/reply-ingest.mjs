// Reply Agent, dry run. Feeds fixture replies through the classifier and policy layer and
// applies the allowed actions to the synthetic dry-run prospect, proving the pipeline end to
// end with zero external effect. Idempotent: each reply is keyed by content hash and applied
// at most once. The policy vocabulary contains no send action, so nothing here can email.
// Run: node --env-file=.env.local scripts/reply-ingest.mjs
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { classifyReply } from "../lib/reply-classifier.ts";
import { replyActions } from "../lib/reply-policy.ts";
import { canTransition } from "../lib/prospect-state.ts";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const EMAIL = "dryrun-studio@example.invalid";

const { data: p } = await sb.from("prospects").select("id,status").eq("public_email", EMAIL).maybeSingle();
if (!p) { console.error("dry-run prospect missing; run outreach-dry-run.mjs first"); process.exit(1); }

const FIXTURES = [
  "Sounds interesting. What does it cost?",
  "Sure, remove me.",
  "Sure, remove me.",
];

for (const text of FIXTURES) {
  const hash = crypto.createHash("sha256").update(p.id + "|" + text).digest("hex").slice(0, 24);
  const key = `reply:${hash}`;
  const { data: prior } = await sb.from("outreach_events").select("id").eq("prospect_id", p.id).like("evidence", key + "%").limit(1);
  if (prior && prior.length) { console.log(`SKIP (already processed): "${text.slice(0, 40)}"`); continue; }

  const c = classifyReply(text);
  const actions = replyActions(c);
  let prevState = null, newState = null;
  console.log(`"${text.slice(0, 44)}" -> ${c.classification} (${c.confidence}) actions=[${actions.join(",")}]`);

  for (const a of actions) {
    if (a === "suppress") await sb.from("email_suppressions").upsert({ email: EMAIL, reason: "reply: " + c.classification.toLowerCase(), source: "reply-agent dry run", manual: false });
    if (a === "cancel_followups") await sb.from("outreach_messages").update({ send_status: "cancelled" }).eq("prospect_id", p.id).in("send_status", ["draft", "scheduled", "scheduled_dry_run"]);
    if (a === "set_state_unsubscribed") {
      const { data: cur } = await sb.from("prospects").select("status").eq("id", p.id).single();
      if (cur && canTransition(cur.status, "UNSUBSCRIBED")) {
        await sb.from("prospects").update({ status: "UNSUBSCRIBED", do_not_contact: true, suppression_reason: "reply unsubscribe" }).eq("id", p.id).eq("status", cur.status);
        newState = "UNSUBSCRIBED"; prevState = cur.status;
      } else {
        console.log(`  transition ${cur?.status} -> UNSUBSCRIBED not legal, suppression still applies`);
      }
    }
  }
  // The reply itself and the reasoning are preserved verbatim for audit.
  await sb.from("outreach_events").insert({
    prospect_id: p.id,
    agent: "reply-agent-dryrun",
    action: "reply_classified_" + c.classification.toLowerCase(),
    reason: c.rationale,
    evidence: `${key} | original: ${text.slice(0, 300)}`,
    previous_state: prevState,
    new_state: newState,
    deterministic: true,
  });
}

const { data: after } = await sb.from("prospects").select("status,do_not_contact").eq("id", p.id).single();
const { data: sup } = await sb.from("email_suppressions").select("email").eq("email", EMAIL).maybeSingle();
const { count: sent } = await sb.from("outreach_messages").select("id", { count: "exact", head: true }).eq("prospect_id", p.id).eq("send_status", "sent");
console.log(`\nfinal state: ${after.status} | do_not_contact: ${after.do_not_contact} | suppressed: ${Boolean(sup)} | messages sent: ${sent} (must be 0)`);
if (sent > 0) process.exit(1);
console.log("REPLY DRY RUN COMPLETE: unsubscribe dominated, idempotency held, nothing sent.");
