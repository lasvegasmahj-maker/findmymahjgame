// Pre-approval link check (CLAUDE.md: never ship a link without confirming it
// loads). Checks website/registration_url on pending_review rows and flags
// failures into reviewer_notes so the approval session can hold them.
// Run: node --env-file=.env.local scripts/check-links.mjs [--fix]
import { createClient } from "@supabase/supabase-js";
const FIX = process.argv.includes("--fix");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(10000) });
    if (res.ok || res.status === 405 || res.status === 403) return res.status;
    const res2 = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(10000) });
    return res2.status;
  } catch { return 0; }
}

const targets = [];
const { data: venues } = await supabase.from("venue_listings").select("id, business_name, website").eq("status", "pending_review").not("website", "is", null);
for (const v of venues || []) targets.push({ table: "venue_listings", id: v.id, name: v.business_name, col: "website", url: v.website });
const { data: events } = await supabase.from("event_listings").select("id, event_name, registration_url").eq("status", "pending_review").not("registration_url", "is", null);
for (const e of events || []) targets.push({ table: "event_listings", id: e.id, name: e.event_name, col: "registration_url", url: e.registration_url });

console.log(`checking ${targets.length} links (concurrency 12)...`);
const bad = [];
const manual = [];
let done = 0;
const queue = [...targets];
await Promise.all(Array.from({ length: 12 }, async () => {
  while (queue.length) {
    const t = queue.pop();
    const status = await check(t.url);
    done++;
    // 401/403/405/406 are typically bot-blocking, not dead pages; only
    // unreachable (0), missing (404/410), and server-error URLs get flagged.
    if (status === 0 || status === 404 || status === 410 || status >= 500) bad.push({ ...t, status });
    else if (status === 401 || status === 403 || status === 405 || status === 406) manual.push({ ...t, status });
    if (done % 50 === 0) console.log(`  ${done}/${targets.length}`);
  }
}));

console.log(`\nRESULT: ${targets.length - bad.length - manual.length} ok, ${bad.length} failing, ${manual.length} need a manual browser check (bot-blocked status)`);
for (const m of manual) console.log(`  [manual ${m.status}] ${m.table} ${m.name}: ${m.url}`);
for (const b of bad) console.log(`  [${b.status}] ${b.table} ${b.name}: ${b.url}`);
if (FIX && bad.length) {
  for (const b of bad) {
    await supabase.from(b.table).update({ status: "flagged" }).eq("id", b.id);
  }
  console.log(`flagged ${bad.length} rows (held out of the approval session)`);
}
