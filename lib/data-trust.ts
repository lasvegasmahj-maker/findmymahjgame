import type { SupabaseClient } from "@supabase/supabase-js";

// One deterministic answer to "is this record a real person's action?". Seed rows, test rows
// and the owner's own records live in the same tables as any future real signup, so the
// distinction is a column, never a guess made at query time.

export const RECORD_CLASSES = ["real_external", "test", "internal", "seed_demo"] as const;
export type RecordClass = (typeof RECORD_CLASSES)[number];

export type TruthMetrics = {
  realPlayers: number;
  realPlayersPending: number;
  nonRealPlayers: number;
  realProviderSubmissions: number;
  testProviderSubmissions: number;
  claimedListings: number;
  foundingMembers: number;
  paidMembers: number;
  publishedListings: number;
  importedListings: number;
  ownerSubmittedListings: number;
  pendingReviewListings: number;
  verifiedPayments: number;
};

// A signup is a person acting; a listing is a fact we researched. The queries keep those two
// ideas apart so a directory import can never inflate a signup number.
export async function readTruthMetrics(supabase: SupabaseClient): Promise<TruthMetrics> {
  type CountQuery = { count: number | null; error: { message: string } | null };
  type Filter = {
    eq: (c: string, v: unknown) => Filter & PromiseLike<CountQuery>;
    neq: (c: string, v: unknown) => Filter & PromiseLike<CountQuery>;
    in: (c: string, v: unknown[]) => Filter & PromiseLike<CountQuery>;
    not: (c: string, op: string, v: unknown) => Filter & PromiseLike<CountQuery>;
    is: (c: string, v: unknown) => Filter & PromiseLike<CountQuery>;
  } & PromiseLike<CountQuery>;
  // The builder is typed structurally because the generated PostgREST generics fight any
  // generic wrapper, and every call site is a fixed, reviewed query.
  const count = async (table: string, build: (q: Filter) => PromiseLike<CountQuery>) => {
    const { count: n, error } = await build(supabase.from(table).select("id", { count: "exact", head: true }) as unknown as Filter);
    if (error) throw new Error(`${table}: ${error.message}`);
    return n ?? 0;
  };

  const [
    realPlayers, realPlayersPending, nonRealPlayers,
    realProviderSubmissions, testProviderSubmissions,
    claimedListings,
    foundingVenues, foundingEvents,
    stripeVenues, stripeEvents,
    publishedVenues, publishedEvents,
    importedVenues, importedEvents,
    ownerVenues, ownerEvents,
    pendingVenues, pendingEvents,
  ] = await Promise.all([
    count("player_listings", (q) => q.eq("record_class", "real_external").eq("status", "published")),
    count("player_listings", (q) => q.eq("record_class", "real_external").neq("status", "published")),
    count("player_listings", (q) => q.neq("record_class", "real_external")),
    count("listing_submissions", (q) => q.eq("record_class", "real_external")),
    count("listing_submissions", (q) => q.neq("record_class", "real_external")),
    count("listing_claims", (q) => q),
    count("venue_listings", (q) => q.eq("is_founding_member", true)),
    count("event_listings", (q) => q.eq("is_founding_member", true)),
    count("venue_listings", (q) => q.not("stripe_payment_id", "is", null)),
    count("event_listings", (q) => q.not("stripe_payment_id", "is", null)),
    count("venue_listings", (q) => q.eq("status", "published")),
    count("event_listings", (q) => q.eq("status", "published")),
    count("venue_listings", (q) => q.eq("status", "published").eq("source_type", "imported")),
    count("event_listings", (q) => q.eq("status", "published").in("source_type", ["imported", "admin"])),
    count("venue_listings", (q) => q.eq("status", "published").in("source_type", ["organizer", "community"])),
    count("event_listings", (q) => q.eq("status", "published").in("source_type", ["organizer", "community"])),
    count("venue_listings", (q) => q.eq("status", "pending_review")),
    count("event_listings", (q) => q.eq("status", "pending_review")),
  ]);

  return {
    realPlayers,
    realPlayersPending,
    nonRealPlayers,
    realProviderSubmissions,
    testProviderSubmissions,
    claimedListings,
    foundingMembers: foundingVenues + foundingEvents,
    // A plan or status field is not money. Paid requires a payment record, and none exists
    // until a payment provider is integrated.
    paidMembers: 0,
    publishedListings: publishedVenues + publishedEvents,
    importedListings: importedVenues + importedEvents,
    ownerSubmittedListings: ownerVenues + ownerEvents,
    pendingReviewListings: pendingVenues + pendingEvents,
    verifiedPayments: stripeVenues + stripeEvents,
  };
}

export type DataQualityIssue = { check: string; count: number; detail: string };

// Deterministic reconciliation. Anything here belongs in front of a person, not silently
// inside a KPI.
export async function readDataQualityIssues(supabase: SupabaseClient): Promise<DataQualityIssue[]> {
  const issues: DataQualityIssue[] = [];

  const { count: publishedNonRealCount, error: e1 } = await supabase
    .from("player_listings").select("id", { count: "exact", head: true })
    .eq("status", "published").neq("record_class", "real_external");
  if (e1) throw new Error(e1.message);
  if ((publishedNonRealCount ?? 0) > 0) {
    issues.push({
      check: "Seed or test players visible to the public",
      count: publishedNonRealCount ?? 0,
      detail: "player_listings rows that are published but not classified real_external. These render on state pages as real people.",
    });
  }
  const { count: unclassified, error: e2 } = await supabase
    .from("player_listings").select("id", { count: "exact", head: true }).is("record_class", null);
  if (e2) throw new Error(e2.message);
  if ((unclassified ?? 0) > 0) {
    issues.push({
      check: "Players with no trust classification",
      count: unclassified ?? 0,
      detail: "record_class is null, so KPI queries cannot place these rows.",
    });
  }

  const { count: paidWithoutPayment, error: e3 } = await supabase
    .from("venue_listings").select("id", { count: "exact", head: true })
    .not("tier", "in", '("free")').not("tier", "is", null).is("stripe_payment_id", null);
  if (e3) throw new Error(e3.message);
  if ((paidWithoutPayment ?? 0) > 0) {
    issues.push({
      check: "Paid-looking tier with no payment record",
      count: paidWithoutPayment ?? 0,
      detail: "venue_listings with a non-free tier but no stripe_payment_id. A tier field is not revenue.",
    });
  }

  return issues;
}
