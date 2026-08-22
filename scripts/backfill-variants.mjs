// Moves variant findings that earlier phases wrote into free text notes onto the real
// columns. It classifies only from evidence already recorded; a row with no stored finding is
// left NULL rather than assumed American, which is the whole reason the column exists.
// Dry run by default. Idempotent: a row that already carries a variant is never rewritten.
// Run: node --env-file=.env.local scripts/backfill-variants.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { fetchAllRows } from "../lib/fetch-all.ts";

const APPLY = process.argv.includes("--apply");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// The Phase 4 and 5 vocabulary mapped onto the durable one. MIXED_MULTIPLE becomes UNKNOWN
// on purpose: a venue running both an American club and a Chinese club has no single answer,
// and a listing cannot tell a player which table they would be joining.
const LEGACY = {
  AMERICAN_NMJL: ["AMERICAN", "high"],
  RIICHI_JAPANESE: ["RIICHI", "high"],
  CHINESE_OR_HONG_KONG: ["CHINESE_OTHER", "high"],
  UNSTATED_UNKNOWN: ["UNKNOWN", "high"],
  MIXED_MULTIPLE: ["UNKNOWN", "high"],
};

const TARGETS = [
  { table: "venue_listings", nameCol: "business_name", noteCol: "reviewer_notes", re: /Variant ([A-Z_]+)/ },
  { table: "event_listings", nameCol: "event_name", noteCol: "reviewer_notes", re: /Variant ([A-Z_]+)/ },
  { table: "prospects", nameCol: "name", noteCol: "research_notes", re: /variant ([A-Z_]+)/ },
];

let planned = 0;
const writes = [];
for (const t of TARGETS) {
  const { rows, error } = await fetchAllRows(sb, t.table, `id,${t.nameCol},${t.noteCol},mahjong_variant`);
  if (error) { console.error(`${t.table} query failed: ${error}`); process.exit(1); }
  for (const r of rows) {
    if (r.mahjong_variant) continue;
    const match = String(r[t.noteCol] || "").match(t.re);
    if (!match) continue;
    const mapped = LEGACY[match[1]];
    if (!mapped) { console.error(`  unmapped legacy variant "${match[1]}" on ${r[t.nameCol]}, leaving null`); continue; }
    const [variant, confidence] = mapped;
    writes.push({ table: t.table, id: r.id, name: r[t.nameCol], variant, confidence, source: match[0] });
    planned++;
  }
}

// Second pass: published listings whose own stored text names the variant. This is weaker
// than a re-fetched source, so it lands at medium confidence, and a row naming both American
// and another style is left unclassified for a person rather than guessed at.
const AMERICAN_RE = /\b(american mah\s?-?jongg?|nmjl|national mah jongg)\b/i;
const OTHER_RE = /\b(riichi|sichuan|guangdong|hong kong|cantonese|taiwanese|japanese|filipino|singapore|chinese)\b/i;
// A mention is not a claim. "rather than sticking to the NMJL card" names the card in order to
// rule it out, and a substring match reads that as evidence of the opposite.
const NEGATION_RE = /\b(not|no longer|does not|do not|don'?t|rather than|instead of|without|other than|isn'?t|aren'?t)\b/i;
// American-family but not NMJL. The vocabulary cannot express that difference, so these go to
// a person rather than being flattened into AMERICAN.
const NON_NMJL_AMERICAN_RE = /\b(marvelous|siamese|imperial|royale)\b/i;

function americanClaimIsNegated(text, matchIndex) {
  const before = text.slice(Math.max(0, matchIndex - 80), matchIndex);
  const after = text.slice(matchIndex, matchIndex + 80);
  return NEGATION_RE.test(before) || NEGATION_RE.test(after);
}
const conflicts = [];
for (const t of [
  { table: "venue_listings", nameCol: "business_name", cols: "id,business_name,description,venue_type,mahjong_variant" },
  { table: "event_listings", nameCol: "event_name", cols: "id,event_name,description,event_type,mahjong_variant" },
]) {
  const { rows, error } = await fetchAllRows(sb, t.table, t.cols, [["status", "published"]]);
  if (error) { console.error(`${t.table} query failed: ${error}`); process.exit(1); }
  for (const r of rows) {
    if (r.mahjong_variant) continue;
    if (writes.some((w) => w.id === r.id)) continue;
    // Only public copy is read. Staff notes routinely discuss what a group does NOT play,
    // and a substring match cannot tell the difference.
    const text = [r[t.nameCol], r.description, r.venue_type, r.event_type].filter(Boolean).join(" ");
    const am = text.match(AMERICAN_RE);
    const other = text.match(OTHER_RE);
    const nonNmjl = text.match(NON_NMJL_AMERICAN_RE);
    if (am && other) { conflicts.push({ table: t.table, id: r.id, name: r[t.nameCol], american: am[0], other: other[0] }); continue; }
    if (am && nonNmjl) { conflicts.push({ table: t.table, id: r.id, name: r[t.nameCol], american: am[0], other: `${nonNmjl[0]}, which is American mahjong on a non-NMJL card` }); continue; }
    if (!am) continue;
    if (americanClaimIsNegated(text, am.index)) {
      conflicts.push({ table: t.table, id: r.id, name: r[t.nameCol], american: am[0], other: "the text names it only to rule it out" });
      continue;
    }
    writes.push({ table: t.table, id: r.id, name: r[t.nameCol], variant: "AMERICAN", confidence: "medium", source: `the listing's own text says "${am[0]}"` });
    planned++;
  }
}
if (conflicts.length) {
  console.log(`\nconflicting variant words, left unclassified for a person: ${conflicts.length}`);
  for (const c of conflicts) console.log(`  ${c.name.slice(0, 46)} (says "${c.american}" and "${c.other}")`);
}

const tally = {};
for (const w of writes) tally[w.variant] = (tally[w.variant] || 0) + 1;
console.log(`rows to classify: ${planned}`);
console.log("by variant:", JSON.stringify(tally));
for (const w of writes) console.log(`  ${w.table.padEnd(15)} ${w.variant.padEnd(14)} ${w.name.slice(0, 46)}`);

if (!APPLY) { console.log("\nDRY RUN. Re-run with --apply."); process.exit(0); }

let applied = 0;
for (const w of writes) {
  // The is-null guard makes a rerun a no-op and prevents overwriting a later human correction.
  const { data, error } = await sb.from(w.table)
    .update({ mahjong_variant: w.variant, variant_confidence: w.variant === "UNKNOWN" ? null : w.confidence, variant_evidence: w.source.startsWith("the listing") ? w.source : `carried forward from the recorded finding "${w.source}"` })
    .eq("id", w.id).is("mahjong_variant", null).select("id");
  if (error) { console.error(`  failed ${w.name}: ${error.message}`); continue; }
  if (!data?.length) { console.log(`  SKIP (already classified): ${w.name}`); continue; }
  applied++;
}
const { error: evErr } = await sb.from("outreach_events").insert({
  agent: "variant-backfill-p6",
  action: "variants_classified",
  reason: `classified ${applied} rows from evidence recorded in earlier phases; rows without a recorded finding were left unknown`,
  evidence: JSON.stringify(tally),
  deterministic: true,
});
if (evErr) { console.error(`audit event failed: ${evErr.message}`); process.exitCode = 1; }
console.log(`\nAPPLIED: ${applied} rows classified. Rows with no recorded evidence were left null, not assumed American.`);
