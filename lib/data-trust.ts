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
    gt: (c: string, v: unknown) => Filter & PromiseLike<CountQuery>;
    lte: (c: string, v: unknown) => Filter & PromiseLike<CountQuery>;
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

  // Fairness regression guard: the founder's business lives only in the labelled
  // card. A published organic copy (like the Summerlin duplicate unpublished on
  // by the owner) must never quietly return.
  const { data: founderRows, error: e0 } = await supabase
    .from("venue_listings").select("id, website, instagram").eq("status", "published");
  if (e0) throw new Error(e0.message);
  const founderPublished = (founderRows || []).filter((r) => {
    const ig = String(r.instagram || "").replace(/^@/, "").toLowerCase();
    return String(r.website || "").toLowerCase().includes("lasvegasmahj.com") || ig === "lasvegasmahjong";
  }).length;
  if (founderPublished > 0) {
    issues.push({
      check: "Founder business published as an organic listing",
      count: founderPublished,
      detail: "The founder's business may appear only in the labelled From our founder card, never as an organic venue listing.",
    });
  }

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

  // Unsupported paid status: a non-free tier with neither a Stripe payment nor a
  // founding-member entitlement. Founding members legitimately carry a tier by
  // documented entitlement, so they are excluded; a real payment carries a
  // stripe_payment_id. Anything else is a paid-looking row that never paid, and it
  // must never silently reappear (the historical set was corrected 2026-08-23 and
  // audited in listing_tier_corrections). Checked on both listing tables that
  // carry a tier and a payment id.
  let paidWithoutPayment = 0;
  for (const table of ["venue_listings", "event_listings"] as const) {
    const { count, error } = await supabase
      .from(table).select("id", { count: "exact", head: true })
      .not("tier", "in", '("free")').not("tier", "is", null)
      .is("stripe_payment_id", null).not("is_founding_member", "is", true);
    if (error) throw new Error(error.message);
    paidWithoutPayment += count ?? 0;
  }
  if (paidWithoutPayment > 0) {
    issues.push({
      check: "Paid-looking tier with no payment record",
      count: paidWithoutPayment,
      detail: "Listings with a non-free tier but no payment and no founding-member entitlement. A tier field is not revenue.",
    });
  }


  // ===== Wave 2 reconciliation: identity, ownership, matching, notifications =====
  // Each check is a cross-system invariant; a hit means two sources of truth
  // disagree and a person should look before any number is trusted.

  const authIds = new Set<string>();
  for (let page = 1; page <= 100; page++) {
    const { data: authPage, error: eAuth } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (eAuth) throw new Error(eAuth.message);
    const users = authPage?.users ?? [];
    for (const u of users) authIds.add(u.id);
    if (users.length < 1000) break;
  }
  const { data: profileRows, error: eProf } = await supabase.from("profiles").select("id");
  if (eProf) throw new Error(eProf.message);
  const profileIds = new Set((profileRows ?? []).map((r) => r.id));
  const authWithoutProfile = [...authIds].filter((id) => !profileIds.has(id)).length;
  const profileWithoutAuth = [...profileIds].filter((id) => !authIds.has(id)).length;
  if (authWithoutProfile > 0) {
    issues.push({
      check: "Auth users with no profile",
      count: authWithoutProfile,
      detail: "auth.users rows without a profiles row. Sign-in verification should always create one.",
    });
  }
  if (profileWithoutAuth > 0) {
    issues.push({
      check: "Profiles with no auth user",
      count: profileWithoutAuth,
      detail: "profiles rows whose auth user is gone. Cascade delete should prevent this.",
    });
  }

  const { data: winningClaims, error: eClaims } = await supabase
    .from("listing_claims")
    .select("listing_table, listing_id, profile_id, status")
    .in("status", ["approved", "auto_approved"])
    .not("profile_id", "is", null);
  if (eClaims) throw new Error(eClaims.message);
  let claimOwnershipMismatch = 0;
  const claimsByTable = new Map<string, typeof winningClaims>();
  for (const c of winningClaims ?? []) {
    (claimsByTable.get(c.listing_table) ?? claimsByTable.set(c.listing_table, []).get(c.listing_table)!).push(c);
  }
  for (const [table, claims] of claimsByTable) {
    const ids = (claims ?? []).map((c) => c.listing_id);
    const { data: listings, error } = await supabase.from(table).select("id, account_id").in("id", ids);
    if (error) throw new Error(error.message);
    const ownerById = new Map((listings ?? []).map((l) => [l.id, l.account_id]));
    for (const c of claims ?? []) {
      if (ownerById.get(c.listing_id) !== c.profile_id) claimOwnershipMismatch++;
    }
  }
  if (claimOwnershipMismatch > 0) {
    issues.push({
      check: "Approved claim without matching ownership",
      count: claimOwnershipMismatch,
      detail: "An account-flow claim was approved but the listing's account_id does not point at the claimant.",
    });
  }

  const [{ data: seatRows, error: eSeats }, { data: blockRows, error: eBlocks }] = await Promise.all([
    supabase.from("table_seats").select("table_id, user_id, status").not("user_id", "is", null).in("status", ["invited", "accepted"]),
    supabase.from("user_blocks").select("blocker_user_id, blocked_user_id"),
  ]);
  if (eSeats) throw new Error(eSeats.message);
  if (eBlocks) throw new Error(eBlocks.message);
  const blocked = new Set((blockRows ?? []).map((b) => `${b.blocker_user_id}|${b.blocked_user_id}`));
  const byTable = new Map<string, string[]>();
  for (const s2 of seatRows ?? []) {
    (byTable.get(s2.table_id) ?? byTable.set(s2.table_id, []).get(s2.table_id)!).push(s2.user_id);
  }
  let blockedPairsSeated = 0;
  for (const members of byTable.values()) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        if (blocked.has(`${members[i]}|${members[j]}`) || blocked.has(`${members[j]}|${members[i]}`)) blockedPairsSeated++;
      }
    }
  }
  if (blockedPairsSeated > 0) {
    issues.push({
      check: "Blocked players seated together",
      count: blockedPairsSeated,
      detail: "A table holds two players where one has blocked the other. The matcher must never do this.",
    });
  }

  const { data: openReqs, error: eReqs } = await supabase
    .from("play_requests").select("user_id").eq("status", "open").not("user_id", "is", null);
  if (eReqs) throw new Error(eReqs.message);
  const reqUsers = [...new Set((openReqs ?? []).map((r) => r.user_id))];
  let matchingWithoutConsent = 0;
  if (reqUsers.length > 0) {
    const { data: consents, error: eCons } = await supabase
      .from("matching_profiles")
      .select("user_id, adult_affirmed_at, matching_opt_in_at, matching_deactivated_at")
      .in("user_id", reqUsers);
    if (eCons) throw new Error(eCons.message);
    const ok = new Set(
      (consents ?? [])
        .filter((c) => c.adult_affirmed_at && c.matching_opt_in_at && !c.matching_deactivated_at)
        .map((c) => c.user_id)
    );
    matchingWithoutConsent = reqUsers.filter((u) => !ok.has(u)).length;
  }
  if (matchingWithoutConsent > 0) {
    issues.push({
      check: "Open match requests without valid consent",
      count: matchingWithoutConsent,
      detail: "play_requests marked open for users who are not fully consented (18+, opted in, active).",
    });
  }

  const { count: publicTestTables, error: eTables } = await supabase
    .from("tables").select("id", { count: "exact", head: true })
    .in("status", ["forming", "confirmed"]).neq("record_class", "real_external");
  if (eTables) throw new Error(eTables.message);
  if ((publicTestTables ?? 0) > 0) {
    issues.push({
      check: "Test tables in public statuses",
      count: publicTestTables ?? 0,
      detail: "Non-real tables in forming or confirmed status. Public surfaces filter these out, but they should not linger.",
    });
  }

  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const { count: failedNotifs, error: eNotif } = await supabase
    .from("notifications_log").select("id", { count: "exact", head: true })
    .eq("status", "failed").gte("created_at", dayAgo);
  if (eNotif) throw new Error(eNotif.message);
  if ((failedNotifs ?? 0) > 0) {
    issues.push({
      check: "Failed notifications in the last 24 hours",
      count: failedNotifs ?? 0,
      detail: "Transactional emails that did not send. The platform may be silently failing to speak.",
    });
  }

  return issues;
}

export type MembershipBreakdown = {
  basic: number;
  complimentaryTrial: number;
  paidPremium: number;
  expiredReverted: number;
  charter: number;
};

// The five membership states of the approved provider model, counted from entitlement
// dates and payment records. A complimentary trial has an active premium_until and no
// payment id, so it can never masquerade as revenue; Paid Premium requires a real
// payment record; an expired entitlement is Basic again, kept distinct so conversion
// can be measured. Charter is recognition, not a tier.
export async function readMembershipBreakdown(supabase: SupabaseClient): Promise<MembershipBreakdown> {
  const nowISO = new Date().toISOString();
  type CountQuery = { count: number | null; error: { message: string } | null };
  // Structural any for the same reason as readTruthMetrics: fixed, reviewed queries.
  const count = async (table: string, build: (q: any) => PromiseLike<CountQuery>) => {
    const { count: n, error } = await build(supabase.from(table).select("id", { count: "exact", head: true }));
    if (error) throw new Error(`${table}: ${error.message}`);
    return n ?? 0;
  };

  const tables = ["venue_listings", "event_listings"];
  let published = 0, trial = 0, paid = 0, expired = 0, charter = 0;
  for (const t of tables) {
    const [pub, tr, pd, ex, ch] = await Promise.all([
      count(t, (q: any) => q.eq("status", "published")),
      count(t, (q: any) => q.eq("status", "published").gt("premium_until", nowISO).is("stripe_payment_id", null)),
      count(t, (q: any) => q.eq("status", "published").gt("premium_until", nowISO).not("stripe_payment_id", "is", null)),
      count(t, (q: any) => q.eq("status", "published").lte("premium_until", nowISO)),
      count(t, (q: any) => q.eq("status", "published").eq("is_founding_member", true)),
    ]);
    published += pub; trial += tr; paid += pd; expired += ex; charter += ch;
  }

  return {
    basic: Math.max(0, published - trial - paid),
    complimentaryTrial: trial,
    paidPremium: paid,
    expiredReverted: expired,
    charter,
  };
}

export type PremiumLeadDiagnostic = {
  premiumProviders: number;
  buckets: { none: number; one: number; twoToThree: number; fourPlus: number };
  providersWithRealLead: number;
  providersWithRealLeadWhoPaid: number;
};

// The primary Premium diagnostic: among providers who received at least one qualified
// (real, delivered) Find My Mahj lead during their entitlement, how many chose to pay?
// Zero leads and zero conversions is a liquidity problem; plenty of leads and zero
// conversions is a Premium value problem. Only record_class real_external, status sent
// leads count, so QA traffic can never make Premium look like it is working.
export async function readPremiumLeadDiagnostic(supabase: SupabaseClient): Promise<PremiumLeadDiagnostic> {
  const providers: Array<{ id: string; paid: boolean; table: string }> = [];
  for (const t of ["venue_listings", "event_listings"]) {
    const { data, error } = await supabase
      .from(t)
      .select("id, stripe_payment_id")
      .not("premium_until", "is", null);
    if (error) throw new Error(`${t}: ${error.message}`);
    for (const r of data || []) providers.push({ id: String(r.id), paid: r.stripe_payment_id != null, table: t });
  }

  const { data: leadRows, error: leadErr } = await supabase
    .from("provider_leads")
    .select("provider_table, provider_id")
    .eq("record_class", "real_external")
    .eq("status", "sent");
  if (leadErr) throw new Error(`provider_leads: ${leadErr.message}`);
  const leadCount = new Map<string, number>();
  for (const r of leadRows || []) {
    const k = `${r.provider_table}:${r.provider_id}`;
    leadCount.set(k, (leadCount.get(k) ?? 0) + 1);
  }

  const buckets = { none: 0, one: 0, twoToThree: 0, fourPlus: 0 };
  let withLead = 0, withLeadPaid = 0;
  for (const p of providers) {
    const n = leadCount.get(`${p.table}:${p.id}`) ?? 0;
    if (n === 0) buckets.none += 1;
    else if (n === 1) buckets.one += 1;
    else if (n <= 3) buckets.twoToThree += 1;
    else buckets.fourPlus += 1;
    if (n > 0) {
      withLead += 1;
      if (p.paid) withLeadPaid += 1;
    }
  }

  return {
    premiumProviders: providers.length,
    buckets,
    providersWithRealLead: withLead,
    providersWithRealLeadWhoPaid: withLeadPaid,
  };
}
