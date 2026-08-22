// Outreach Agent, Level 1: DRAFT ONLY. Generates personalized outreach for QUALIFIED
// prospects from their verified facts, creates a unique invite token, and stores the draft
// with approved_by_human=false. Nothing is sent; sending remains impossible until autonomy
// level 2 and the deterministic guards allow it. Templates are deterministic; no model.
// Run: node --env-file=.env.local scripts/outreach-drafts.mjs [--apply] [--limit=N]
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const APPLY = process.argv.includes("--apply");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : 30;
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const OPENERS = {
  instructor: "Find My Mahj Game is a national directory players use to find American mahjong teachers near them.",
  studio: "Find My Mahj Game is a national directory players use to find places to play and learn American mahjong.",
  club: "Find My Mahj Game is a national directory players use to find mahjong groups and open play near them.",
  open_play_host: "Find My Mahj Game is a national directory players use to find open mahjong games near them.",
  league: "Find My Mahj Game is a national directory players use to find mahjong leagues near them.",
  tournament_organizer: "Find My Mahj Game is a national directory players use to find American mahjong tournaments.",
  retreat_organizer: "Find My Mahj Game is a national directory players use to discover mahjong retreats and travel.",
  travel_organizer: "Find My Mahj Game is a national directory players use to discover mahjong retreats and travel.",
  jcc: "Find My Mahj Game is a national directory players use to find community mahjong programs near them.",
  community_center: "Find My Mahj Game is a national directory players use to find community mahjong programs near them.",
};

const { data: prospects, error } = await sb
  .from("prospects")
  .select("id,name,organization_name,prospect_type,city,state,public_email,offerings,do_not_contact,campaign_id,status")
  .eq("status", "QUALIFIED")
  .eq("do_not_contact", false)
  .not("public_email", "is", null)
  .limit(LIMIT);
if (error) { console.error(error.message); process.exit(1); }

const { data: supp } = await sb.from("email_suppressions").select("email");
const suppressed = new Set((supp || []).map((x) => x.email.toLowerCase()));
const { data: drafted } = await sb.from("outreach_messages").select("prospect_id");
const alreadyDrafted = new Set((drafted || []).map((x) => x.prospect_id));

let planned = 0, skipped = 0;
for (const p of prospects) {
  if (suppressed.has(p.public_email.toLowerCase()) || alreadyDrafted.has(p.id)) { skipped++; continue; }
  const org = p.organization_name || p.name;
  const opener = OPENERS[p.prospect_type] || OPENERS.club;
  // Facts only: the offering line is the qualification evidence the researcher captured
  // from the prospect's own site. No compliments, no claimed relationship, no invention.
  const offering = (p.offerings || "").split(/[.;]/)[0].trim();
  const subject = `Listing ${org} on Find My Mahj Game`;
  const token = "inv_" + crypto.randomBytes(12).toString("base64url");
  const body = [
    `Hi ${p.name.split(" ")[0]},`,
    ``,
    opener,
    ``,
    offering ? `We found ${org} through your public listing (${offering.length > 120 ? offering.slice(0, 120).replace(/\s+\S*$/, "") + "..." : offering}) and would love to include you so players in ${p.city} can find you.` : `We would love to include ${org} so players in ${p.city} can find you.`,
    ``,
    `A listing is free to create and takes a few minutes. Your invitation link:`,
    `https://findmymahjgame.com/join?invite=${token}`,
    ``,
    `If this is not relevant, reply and we will not contact you again.`,
    ``,
    `Shauna`,
    `Find My Mahj Game, findmymahjgame.com`,
  ].join("\n");
  planned++;
  if (!APPLY) { if (planned <= 3) console.log(`--- DRAFT for ${org} (${p.city}, ${p.state}) ---\n${subject}\n${body}\n`); continue; }
  await sb.from("invite_tokens").insert({ token, prospect_id: p.id });
  await sb.from("outreach_messages").insert({
    prospect_id: p.id, message_type: "outreach", sequence_step: 0,
    generated_subject: subject, generated_body: body,
    facts_used: `type=${p.prospect_type}; city=${p.city}; offerings from research evidence`,
    send_status: "draft", approved_by_human: false,
  });
  await sb.from("outreach_events").insert({ prospect_id: p.id, agent: "outreach-agent-l1", action: "draft_created", reason: "deterministic template from verified facts; awaiting human approval", deterministic: true });
}
console.log(`${APPLY ? "DRAFTED" : "WOULD DRAFT"}: ${planned}, skipped (suppressed or already drafted): ${skipped}`);
