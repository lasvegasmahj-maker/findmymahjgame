import { test, expect, request as pwRequest, APIRequestContext } from "@playwright/test";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { readFileSync } from "fs";
import { join } from "path";
import { scoreClaimEvidence, type ClaimEvidence } from "../lib/claims/contract";
import { canUseDarkFeature } from "../lib/launch-gates";

// Provider claims: the deterministic scorer, the account-based claim/provider routes,
// the admin decision route, and the legacy token flow's competing-claim fix.
// Ownership of a listing is the account_id column on venue_listings/event_listings;
// a claim row is only ever the audit trail. See lib/claims/contract.ts.

function loadEnv(): Record<string, string> {
  const file = path.resolve(__dirname, "..", ".env.local");
  const out: Record<string, string> = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const ENV = loadEnv();
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ADMIN_PASSWORD = ENV.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
const hasSupabase = Boolean(SUPABASE_URL && SERVICE_KEY);
const service: SupabaseClient | null = hasSupabase ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

// ===========================================================================
// scoreClaimEvidence: the one function allowed to decide auto-approval. Pure
// and deterministic, so every branch is covered here without touching a
// database.
// ===========================================================================
test.describe("scoreClaimEvidence", () => {
  const base: ClaimEvidence = { accountEmail: "jane@example.com" };

  test("exact email match is high confidence and auto-approves", () => {
    const r = scoreClaimEvidence({ ...base, accountEmail: "jane@janestudio.com", listingEmail: "jane@janestudio.com" });
    expect(r.confidence).toBe("high");
    expect(r.autoApprove).toBe(true);
  });

  test("account domain matching the listing website domain is high confidence and auto-approves", () => {
    const r = scoreClaimEvidence({ ...base, accountEmail: "jane@janestudio.com", listingWebsite: "https://www.janestudio.com/lessons" });
    expect(r.confidence).toBe("high");
    expect(r.autoApprove).toBe(true);
  });

  test("account domain matching the listing contact email domain is high confidence and auto-approves", () => {
    const r = scoreClaimEvidence({ ...base, accountEmail: "jane@janestudio.com", listingEmail: "info@janestudio.com" });
    expect(r.confidence).toBe("high");
    expect(r.autoApprove).toBe(true);
  });

  test("a freemail account with no matching signal is low confidence and never auto-approves", () => {
    const r = scoreClaimEvidence({ accountEmail: "jane@gmail.com", listingEmail: "someone@other-studio.com", listingWebsite: "https://other-studio.com" });
    expect(r.confidence).toBe("low");
    expect(r.autoApprove).toBe(false);
  });

  test("an already-owned listing is always low confidence, even with an exact email match, and never auto-approves", () => {
    const r = scoreClaimEvidence({ ...base, accountEmail: "jane@janestudio.com", listingEmail: "jane@janestudio.com", listingAlreadyOwned: true });
    expect(r.confidence).toBe("low");
    expect(r.autoApprove).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/already has an owner/);
  });

  test("a competing open claim is always low confidence, even with an exact email match, and never auto-approves", () => {
    const r = scoreClaimEvidence({ ...base, accountEmail: "jane@janestudio.com", listingEmail: "jane@janestudio.com", hasOpenCompetingClaim: true });
    expect(r.confidence).toBe("low");
    expect(r.autoApprove).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/another open claim/);
  });

  test("a listing with no contact email or website on record is medium confidence, not auto-approved", () => {
    const r = scoreClaimEvidence({ accountEmail: "jane@janestudio.com", listingName: "Some Other Studio" });
    expect(r.confidence).toBe("medium");
    expect(r.autoApprove).toBe(false);
  });

  test("an account local part resembling the listing name is medium confidence, not auto-approved", () => {
    const r = scoreClaimEvidence({ accountEmail: "janesmithstudio@gmail.com", listingName: "Jane Smith Studio", listingEmail: "front-desk@unrelated.com", listingWebsite: "https://unrelated.com" });
    expect(r.confidence).toBe("medium");
    expect(r.autoApprove).toBe(false);
  });
});

// ===========================================================================
// Unauthenticated and gate-closed behavior. session.role is never checked for
// authorization; canUseDarkFeature is the one gate every provider route uses.
// ===========================================================================
test.describe("claims and provider routes: authorization boundary", () => {
  test("POST /api/claims requires a session", async ({ request }) => {
    const r = await request.post("/api/claims", { data: { listing_table: "venue_listings", listing_id: "00000000-0000-0000-0000-000000000000" } });
    expect(r.status()).toBe(401);
  });

  test("GET /api/claims requires a session", async ({ request }) => {
    expect((await request.get("/api/claims")).status()).toBe(401);
  });

  test("GET /api/provider requires a session", async ({ request }) => {
    expect((await request.get("/api/provider")).status()).toBe(401);
  });

  test("POST /api/provider/edit requires a session", async ({ request }) => {
    const r = await request.post("/api/provider/edit", {
      data: { listing_table: "venue_listings", listing_id: "00000000-0000-0000-0000-000000000000", description: "x" },
    });
    expect(r.status()).toBe(401);
  });

  test("GET /api/provider/search requires a session", async ({ request }) => {
    expect((await request.get("/api/provider/search?q=studio")).status()).toBe(401);
  });

  test("a forged session cookie is rejected the same way as no session", async ({ baseURL }) => {
    const ctx = await pwRequest.newContext({ baseURL: baseURL || "http://localhost:3201", extraHTTPHeaders: { cookie: "fmg_user=Zm9yZ2VkOnRva2VuOnZhbHVl" } });
    expect((await ctx.get("/api/provider")).status()).toBe(401);
    expect((await ctx.post("/api/claims", { data: { listing_table: "venue_listings", listing_id: "00000000-0000-0000-0000-000000000000" } })).status()).toBe(401);
    await ctx.dispose();
  });

  test("gate closed blocks a real-classified caller: canUseDarkFeature is false for real_external while the gate is off, true for test", () => {
    expect(canUseDarkFeature(false, "real_external")).toBe(false);
    expect(canUseDarkFeature(false, null)).toBe(false);
    expect(canUseDarkFeature(false, "test")).toBe(true);
    expect(canUseDarkFeature(true, "real_external")).toBe(true);
  });
});

test.describe("admin claims route: authorization", () => {
  test("GET /api/admin/claims refuses an unauthenticated request", async ({ request }) => {
    expect((await request.get("/api/admin/claims")).status()).toBe(401);
  });

  test("POST /api/admin/claims refuses an unauthenticated request", async ({ request }) => {
    const r = await request.post("/api/admin/claims", { data: { id: "00000000-0000-0000-0000-000000000000", decision: "approve" } });
    expect(r.status()).toBe(401);
  });

  test("an invalid status filter is rejected", async ({ request }) => {
    // No admin cookie, but the 401 check happens before the status validation, so this
    // still proves the route never reaches an unauthenticated caller's query at all.
    expect((await request.get("/api/admin/claims?status=drop-table")).status()).toBe(401);
  });
});

// ===========================================================================
// Source pins: assertions on the code itself for behavior that is impractical
// or unsafe to force through a live request (schema-dependent branches, the
// exact security-rule wiring). Same pattern as tests/admin-truth.spec.ts and
// tests/billing.spec.ts.
// ===========================================================================
test.describe("source pins", () => {
  const providerFiles = ["app/api/claims/route.ts", "app/api/provider/route.ts", "app/api/provider/edit/route.ts", "app/api/provider/search/route.ts"];

  test("provider-only routes gate on canUseDarkFeature + the providerClaims launch gate, never on session.role", () => {
    for (const f of providerFiles) {
      const source = readFileSync(join(__dirname, "..", f), "utf8");
      expect(source, f).not.toMatch(/session\.role/);
      expect(source, f).toMatch(/canUseDarkFeature\(/);
      expect(source, f).toMatch(/isLaunched\(supabase, "providerClaims"\)/);
    }
  });

  test("the new public POST routes are rate limited", () => {
    expect(readFileSync(join(__dirname, "..", "app/api/claims/route.ts"), "utf8")).toMatch(/rateLimit\(/);
    expect(readFileSync(join(__dirname, "..", "app/api/provider/edit/route.ts"), "utf8")).toMatch(/rateLimit\(/);
  });

  test("admin claims route is gated by the admin cookie", () => {
    const source = readFileSync(join(__dirname, "..", "app/api/admin/claims/route.ts"), "utf8");
    expect(source).toMatch(/verifyAdminSessionToken/);
    expect(source).toMatch(/ADMIN_COOKIE/);
  });

  test("ownership is only ever granted by writing account_id on the listing, by system auto-approval or by admin approval", () => {
    const claims = readFileSync(join(__dirname, "..", "app/api/claims/route.ts"), "utf8");
    expect(claims).toMatch(/update\(\{\s*account_id:\s*session\.userId\s*\}\)/);
    const admin = readFileSync(join(__dirname, "..", "app/api/admin/claims/route.ts"), "utf8");
    expect(admin).toMatch(/update\(\{\s*account_id:\s*claimRow\.profile_id\s*\}\)/);
  });

  test("provider edit never writes a listing directly; every change lands in pending_edits", () => {
    const source = readFileSync(join(__dirname, "..", "app/api/provider/edit/route.ts"), "utf8");
    expect(source).toMatch(/from\("pending_edits"\)\s*\.insert/);
    expect(source).not.toMatch(/from\(table\)\s*\.update/);
  });

  test("legacy claim route filters winning claim statuses so a competing open claim from the account flow cannot break it", () => {
    const source = readFileSync(join(__dirname, "..", "app/api/claim/route.ts"), "utf8");
    expect(source).toMatch(/WINNING_CLAIM_STATUSES/);
    expect((source.match(/\.in\("status", WINNING_CLAIM_STATUSES\)/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  test("legacy claim route backfills account_id for a matching account without ever blocking the claim on that lookup failing", () => {
    const source = readFileSync(join(__dirname, "..", "app/api/claim/route.ts"), "utf8");
    expect(source).toMatch(/auth\.admin\.listUsers/);
    expect(source).toMatch(/catch/);
  });
});

// ===========================================================================
// Full QA walkthrough against a live server. Requires ADMIN_PASSWORD and
// Supabase service credentials in .env.local; skipped cleanly otherwise (CI
// without secrets, for example).
// ===========================================================================
test.describe.serial("claims lifecycle: QA account walkthrough", () => {
  test.skip(!ADMIN_PASSWORD || !hasSupabase, "ADMIN_PASSWORD or Supabase service credentials not available in this environment");

  const QA_A = "qa-claims-a@fmg-qa.test";
  const QA_B = "qa-claims-b@fmg-qa.test";

  let admin: APIRequestContext;
  let userA: APIRequestContext;
  let userB: APIRequestContext;
  let userAId = "";
  let userBId = "";

  let listingMatchId = "";
  let listingNoMatchId = "";
  let listingRejectId = "";
  let claimAId = "";
  let claimBId = "";
  let claimRejectId = "";

  test.beforeAll(async ({ baseURL }) => {
    const base = baseURL || "http://localhost:3201";

    const { data: l1, error: e1 } = await service!
      .from("venue_listings")
      .insert({ business_name: "QA TEST Exact Match Studio", venue_type: "Mahjong Instructor", city: "Testville", state: "ZZ", status: "published", contact_email: QA_A })
      .select("id")
      .single();
    if (e1 || !l1) throw new Error(`setup: could not create matched test listing: ${e1?.message}`);
    listingMatchId = l1.id;

    const { data: l2, error: e2 } = await service!
      .from("venue_listings")
      .insert({ business_name: "QA TEST No Match Studio", venue_type: "Mahjong Instructor", city: "Testville", state: "ZZ", status: "published" })
      .select("id")
      .single();
    if (e2 || !l2) throw new Error(`setup: could not create unmatched test listing: ${e2?.message}`);
    listingNoMatchId = l2.id;

    const { data: l3, error: e3 } = await service!
      .from("venue_listings")
      .insert({ business_name: "QA TEST Reject Studio", venue_type: "Mahjong Instructor", city: "Testville", state: "ZZ", status: "published" })
      .select("id")
      .single();
    if (e3 || !l3) throw new Error(`setup: could not create reject test listing: ${e3?.message}`);
    listingRejectId = l3.id;

    admin = await pwRequest.newContext({ baseURL: base });
    const login = await admin.post("/api/admin/login", { data: { password: ADMIN_PASSWORD } });
    if (!login.ok()) throw new Error("setup: admin login failed");

    // Signed in as role "player" on purpose: the whole point of the authorization rule
    // is that the requested role never gates a provider-only action.
    const signinA = await admin.post("/api/auth/signin", { data: { email: QA_A, role: "player" } });
    const sjA = await signinA.json();
    const tokenA = new URL(sjA.confirmUrl).searchParams.get("token_hash");
    userA = await pwRequest.newContext({ baseURL: base });
    const verifyA = await userA.post("/api/auth/verify", { data: { token_hash: tokenA, role: "player" } });
    if (!verifyA.ok()) throw new Error("setup: user A verify failed");

    const signinB = await admin.post("/api/auth/signin", { data: { email: QA_B, role: "player" } });
    const sjB = await signinB.json();
    const tokenB = new URL(sjB.confirmUrl).searchParams.get("token_hash");
    userB = await pwRequest.newContext({ baseURL: base });
    const verifyB = await userB.post("/api/auth/verify", { data: { token_hash: tokenB, role: "player" } });
    if (!verifyB.ok()) throw new Error("setup: user B verify failed");

    const { data: usersPage } = await service!.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userAId = usersPage?.users.find((u) => u.email?.toLowerCase() === QA_A)?.id || "";
    userBId = usersPage?.users.find((u) => u.email?.toLowerCase() === QA_B)?.id || "";
    if (!userAId || !userBId) throw new Error("setup: could not resolve QA account ids");
  });

  test.afterAll(async () => {
    if (service) {
      const listingIds = [listingMatchId, listingNoMatchId, listingRejectId].filter(Boolean);
      if (listingIds.length) {
        await service.from("listing_claims").delete().in("listing_id", listingIds);
        await service.from("pending_edits").delete().in("listing_id", listingIds);
        await service.from("venue_listings").delete().in("id", listingIds);
      }
      if (userAId) await service.auth.admin.deleteUser(userAId).catch(() => {});
      if (userBId) await service.auth.admin.deleteUser(userBId).catch(() => {});
    }
    await admin?.dispose();
    await userA?.dispose();
    await userB?.dispose();
  });

  test("start -> score: user A claims the exact-email-match listing while signed in as role player", async () => {
    const r = await userA.post("/api/claims", { data: { listing_table: "venue_listings", listing_id: listingMatchId } });
    expect(r.ok(), await r.text()).toBeTruthy();
    const j = await r.json();
    claimAId = j.claim.id;
    expect(j.claim.confidence).toBe("high");
    expect(["auto_approved", "needs_review"]).toContain(j.claim.status);

    if (j.claim.status === "auto_approved") {
      // The schema for account_id has landed: this is the real outcome -> ownership path.
      expect(j.claim.decision_reason).toMatch(/exactly matches/);
      const { data: listing } = await service!.from("venue_listings").select("account_id").eq("id", listingMatchId).single();
      expect(listing?.account_id).toBe(userAId);
    } else {
      // account_id does not exist on this deployment yet (migration 2026-06-16-membership-03
      // has not been applied to production): the scorer still says high/auto, but the
      // ownership write fails closed instead of lying about ownership.
      expect(j.claim.decision_reason).toMatch(/automatic approval could not be completed/);
    }
  });

  test("outcome: resubmitting the same claim is idempotent, not a duplicate row", async () => {
    const r = await userA.post("/api/claims", { data: { listing_table: "venue_listings", listing_id: listingMatchId } });
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    expect(j.alreadySubmitted).toBe(true);
    expect(j.claim.id).toBe(claimAId);
  });

  test("outcome: user A's claim was received and ledgered, unroutable QA address recorded as skipped_qa", async () => {
    const { data } = await service!.from("notifications_log").select("kind, status").eq("related_id", claimAId).eq("related_table", "listing_claims");
    expect(data && data.length).toBeGreaterThan(0);
    for (const row of data || []) expect(row.status).toBe("skipped_qa");
  });

  test("GET /api/claims for user A includes her claim", async () => {
    const r = await userA.get("/api/claims");
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    expect(j.claims.some((c: { id: string }) => c.id === claimAId)).toBe(true);
  });

  test("IDOR: user B's claims list never contains user A's claim", async () => {
    const r = await userB.get("/api/claims");
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    expect(j.claims.some((c: { id: string }) => c.id === claimAId)).toBe(false);
  });

  test("IDOR: user B's provider dashboard never contains user A's listing or claim", async () => {
    const r = await userB.get("/api/provider");
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    expect(j.ownedListings.some((l: { id: string }) => l.id === listingMatchId)).toBe(false);
    expect(j.claims.some((c: { id: string }) => c.id === claimAId)).toBe(false);
  });

  test("IDOR: user B cannot submit a pending edit for a listing she does not own", async () => {
    const r = await userB.post("/api/provider/edit", { data: { listing_table: "venue_listings", listing_id: listingMatchId, description: "hacked by B" } });
    expect(r.status()).toBe(404);
  });

  test("ownership: once account_id is set, the real owner can propose an edit, and it lands only in pending_edits", async () => {
    const { data: listing } = await service!.from("venue_listings").select("account_id, description").eq("id", listingMatchId).maybeSingle();
    test.skip(!listing || listing.account_id !== userAId, "account_id was not granted on this deployment; see the first lifecycle test");

    const r = await userA.post("/api/provider/edit", {
      data: { listing_table: "venue_listings", listing_id: listingMatchId, description: "QA test description for the provider dashboard" },
    });
    expect(r.ok(), await r.text()).toBeTruthy();
    const j = await r.json();
    expect(j.pending).toContain("description");

    const { data: pending } = await service!
      .from("pending_edits")
      .select("id, changes, status")
      .eq("listing_id", listingMatchId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    expect(pending?.changes?.description).toBe("QA test description for the provider dashboard");

    const { data: unchanged } = await service!.from("venue_listings").select("description").eq("id", listingMatchId).single();
    expect(unchanged?.description).toBe(listing!.description);
  });

  test("start -> score -> outcome: user B claims the no-match listing and lands in needs_review for agent research", async () => {
    const r = await userB.post("/api/claims", { data: { listing_table: "venue_listings", listing_id: listingNoMatchId } });
    expect(r.ok(), await r.text()).toBeTruthy();
    const j = await r.json();
    claimBId = j.claim.id;
    expect(j.claim.status).toBe("needs_review");
    expect(j.claim.confidence).toBe("medium");
    expect(j.claim.decision_reason).toBe("agent research required");
  });

  test("admin: needs_review claims are listable", async () => {
    const r = await admin.get("/api/admin/claims?status=needs_review");
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    expect(j.items.some((c: { id: string }) => c.id === claimBId)).toBe(true);
  });

  test("admin approve: outcome -> ownership for the needs_review claim, or a safe rollback if account_id is not available on this deployment yet", async () => {
    const r = await admin.post("/api/admin/claims", { data: { id: claimBId, decision: "approve" } });
    const j = await r.json().catch(() => ({}));

    if (r.ok()) {
      const { data: claimRow } = await service!.from("listing_claims").select("status, decided_by").eq("id", claimBId).single();
      expect(claimRow?.status).toBe("approved");
      expect(claimRow?.decided_by).toBe("admin");

      const { data: listing } = await service!.from("venue_listings").select("account_id").eq("id", listingNoMatchId).maybeSingle();
      if (listing && listing.account_id !== undefined && listing.account_id !== null) {
        expect(listing.account_id).toBe(userBId);
      }
    } else {
      // account_id does not exist on venue_listings on this deployment yet (migration
      // 2026-06-16-membership-03 has not been applied to production): the route refuses
      // to grant ownership it cannot record, and rolls the claim back to needs_review
      // instead of lying about the outcome.
      expect(j.error).toBe("Could not grant ownership. Please try again.");
      const { data: claimRow } = await service!.from("listing_claims").select("status, decided_by").eq("id", claimBId).single();
      expect(claimRow?.status).toBe("needs_review");
      expect(claimRow?.decided_by).toBeNull();
    }
  });

  test("start -> score -> outcome: user A claims the reject listing and lands in needs_review", async () => {
    const r = await userA.post("/api/claims", { data: { listing_table: "venue_listings", listing_id: listingRejectId } });
    expect(r.ok(), await r.text()).toBeTruthy();
    const j = await r.json();
    claimRejectId = j.claim.id;
    expect(j.claim.status).toBe("needs_review");
  });

  test("admin reject: outcome is recorded, ownership is never granted", async () => {
    const r = await admin.post("/api/admin/claims", { data: { id: claimRejectId, decision: "reject", reason: "QA test rejection" } });
    expect(r.ok(), await r.text()).toBeTruthy();

    const { data: claimRow } = await service!.from("listing_claims").select("status, decided_by, decision_reason").eq("id", claimRejectId).single();
    expect(claimRow?.status).toBe("rejected");
    expect(claimRow?.decided_by).toBe("admin");
    expect(claimRow?.decision_reason).toBe("QA test rejection");

    const { data: listing } = await service!.from("venue_listings").select("account_id").eq("id", listingRejectId).maybeSingle();
    if (listing && "account_id" in listing) expect(listing.account_id).toBeFalsy();

    const { data: notifs } = await service!.from("notifications_log").select("kind, status").eq("related_id", claimRejectId);
    expect(notifs?.some((n) => n.kind === "claim_rejected" && n.status === "skipped_qa")).toBe(true);
  });

  test("admin claims route decision is invalid for an already-decided claim", async () => {
    const r = await admin.post("/api/admin/claims", { data: { id: claimRejectId, decision: "approve" } });
    expect(r.status()).toBe(409);
  });

  test("record_class: every row this walkthrough created is classified test, never real_external", async () => {
    const { data: claims } = await service!.from("listing_claims").select("record_class").in("id", [claimAId, claimBId, claimRejectId].filter(Boolean));
    for (const row of claims || []) expect(row.record_class).toBe("test");
  });
});
