import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { lazyServerClient } from "@/lib/supabase-server";

// Read-only rollup of the first-party event stream, real traffic and test traffic kept
// apart the whole way through. Every number here is a live count from analytics_events;
// nothing is estimated or extrapolated. A funnel step that nothing has emitted yet reads
// as zero, honestly, rather than being hidden or guessed at.

const supabase = lazyServerClient();

type EventRow = { name: string; record_class: string; created_at: string };
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

export async function GET(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const since7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [rowsResult, totalResult, oldestResult, newestResult] = await Promise.all([
    supabase.from("analytics_events").select("name, record_class, created_at").gte("created_at", since30),
    supabase.from("analytics_events").select("id", { count: "exact", head: true }),
    supabase.from("analytics_events").select("created_at").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("analytics_events").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (rowsResult.error) {
    console.error("admin analytics read failed:", rowsResult.error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const rows = (rowsResult.data ?? []) as EventRow[];

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
    },
    notes: [
      "search_performed and zero_result_search are counted only from what has actually been posted to /api/events; the homepage does not instrument search yet, so these stay at zero until that ships.",
    ],
  });
}
