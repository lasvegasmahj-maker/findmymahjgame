import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { lazyServerClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

// Read-only rollup of the first-party event stream, real traffic and test traffic kept
// apart the whole way through. Every number here is a live count from analytics_events;
// nothing is estimated or extrapolated. A funnel step that nothing has emitted yet reads
// as zero, honestly, rather than being hidden or guessed at.

export const maxDuration = 60;

const supabase = lazyServerClient();

type EventRow = { id: string; name: string; record_class: string; created_at: string };
type EventCounts = Record<string, number>;

type WindowReport = {
  eventCounts: EventCounts;
  askIntent: { submitted: number; directory: number; rules: number; mixed: number; unverified: number };
  funnels: Record<string, EventCounts>;
};

// Groups of event names whose order is a real sequence today. Reported as raw per-step
// counts only, never as a computed conversion rate between two unrelated counts.
const FUNNEL_GROUPS: Array<{ name: string; steps: readonly string[] }> = [
  { name: "signup", steps: ["signup_started", "account_created", "profile_completed"] },
  { name: "provider_claim", steps: ["provider_claim_started", "provider_claim_submitted", "provider_claim_approved", "provider_claim_escalated", "provider_claim_rejected"] },
  { name: "listing", steps: ["listing_created", "listing_updated", "listing_published"] },
  { name: "matching", steps: ["matching_opt_in", "match_request_created", "table_proposed", "table_accept", "table_formed"] },
  { name: "billing", steps: ["checkout_started", "test_payment_completed", "subscription_status_changed"] },
  // search_performed and zero_result_search are only ever recorded once a caller POSTs
  // them to /api/events; the homepage does not do this yet, so these read zero until it does.
  { name: "discovery", steps: ["search_performed", "zero_result_search", "listing_viewed"] },
];

function buildReport(rows: EventRow[], sinceIso: string, recordClass: string): WindowReport {
  const eventCounts: EventCounts = {};
  for (const row of rows) {
    if (row.record_class !== recordClass || row.created_at < sinceIso) continue;
    eventCounts[row.name] = (eventCounts[row.name] ?? 0) + 1;
  }
  const askIntent = {
    submitted: eventCounts.ask_submitted ?? 0,
    directory: eventCounts.ask_intent_directory ?? 0,
    rules: eventCounts.ask_intent_rules ?? 0,
    mixed: eventCounts.ask_intent_mixed ?? 0,
    unverified: eventCounts.ask_unverified ?? 0,
  };
  const funnels: Record<string, EventCounts> = {};
  for (const group of FUNNEL_GROUPS) {
    funnels[group.name] = {};
    for (const step of group.steps) funnels[group.name][step] = eventCounts[step] ?? 0;
  }
  return { eventCounts, askIntent, funnels };
}

// PostgREST caps a select at 1,000 rows and reports no error, so page the window.
// Keyset paging (cursor on created_at, id) rather than offsets: QA cleanups delete
// rows from this table while the rollup may be reading it, and an offset would skip
// rows after such a delete. Stops only on an empty page, which stays correct if the
// server page size is ever lowered. Newest first, so a ceiling hit drops the oldest
// days first and the 7-day window stays complete until the log is very large.
const PAGE = 1000;
const MAX_PAGES = 100;

async function readEventsSince(sinceIso: string): Promise<{ rows: EventRow[]; error: string | null; truncated: boolean }> {
  const rows: EventRow[] = [];
  let after: { created_at: string; id: string } | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    let query = supabase
      .from("analytics_events")
      .select("id, name, record_class, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE);
    if (after) {
      query = query.or(`created_at.lt."${after.created_at}",and(created_at.eq."${after.created_at}",id.lt."${after.id}")`);
    }
    const { data, error } = await query;
    if (error) return { rows: [], error: error.message, truncated: false };
    const batch = (data ?? []) as EventRow[];
    if (batch.length === 0) return { rows, error: null, truncated: false };
    rows.push(...batch);
    const last = batch[batch.length - 1];
    after = { created_at: last.created_at, id: last.id };
  }
  // Reached the ceiling with a full last page: truncated only if something older
  // exists past the cursor.
  const { count, error: probeErr } = await supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceIso)
    .or(`created_at.lt."${after!.created_at}",and(created_at.eq."${after!.created_at}",id.lt."${after!.id}")`);
  // An unknown remainder must never read as a complete window.
  const truncated = Boolean(probeErr) || (count ?? 0) > 0;
  if (truncated) console.error(`admin analytics: window exceeded ${MAX_PAGES} pages; report is truncated`);
  return { rows, error: null, truncated };
}

export async function GET(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await rateLimit(req, "admin-analytics", 20, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const now = Date.now();
  const since7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [rowsResult, totalResult, oldestResult, newestResult] = await Promise.all([
    readEventsSince(since30),
    supabase.from("analytics_events").select("id", { count: "exact", head: true }),
    supabase.from("analytics_events").select("created_at").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("analytics_events").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (rowsResult.error) {
    console.error("admin analytics read failed:", rowsResult.error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const rows = rowsResult.rows;

  return NextResponse.json({
    ok: true,
    windows: {
      "7d": { real: buildReport(rows, since7, "real_external"), test: buildReport(rows, since7, "test") },
      "30d": { real: buildReport(rows, since30, "real_external"), test: buildReport(rows, since30, "test") },
    },
    dataHealth: {
      totalEvents: totalResult.count ?? 0,
      oldestEventAt: oldestResult.data?.created_at ?? null,
      newestEventAt: newestResult.data?.created_at ?? null,
      windowTruncated: rowsResult.truncated,
      windowRowsRead: rowsResult.rows.length,
    },
    notes: [
      "search_performed and zero_result_search are counted only from what has actually been posted to /api/events; the homepage does not instrument search yet, so these stay at zero until that ships.",
    ],
  });
}
