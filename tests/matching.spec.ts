import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

import {
  buildGroups,
  groupHardCompatible,
  hardCompatible,
  pickReplacement,
  blockKey,
  type MatchCandidate,
} from "../lib/match/engine";
import { canTransitionSeat, canTransitionTable, TABLE_SIZE } from "../lib/match/states";
import { CONSENT_VERSION } from "../lib/match/consent";
import { canUseDarkFeature } from "../lib/launch-gates";
import { USER_COOKIE } from "../lib/user-auth";
import { runMatcher } from "../app/api/cron/matcher/route";

// Mahj Match: the compatibility engine (pure), the state transition guards (pure), the request
// and respond routes (auth, gating, IDOR), and one full account-based QA walkthrough: request ->
// matcher proposal -> four accepts -> confirmed table, plus a decline -> reopened-seat scenario.

function makeCandidate(overrides: Partial<MatchCandidate> = {}): MatchCandidate {
  return {
    requestId: overrides.requestId ?? `req-${Math.random().toString(36).slice(2)}`,
    userId: overrides.userId ?? `user-${Math.random().toString(36).slice(2)}`,
    recordClass: overrides.recordClass ?? "test",
    consentEligible: overrides.consentEligible ?? true,
    variant: overrides.variant ?? "AMERICAN",
    city: overrides.city ?? "Testville",
    state: overrides.state ?? "ZZ",
    dayPref: overrides.dayPref ?? "Monday",
    timePref: overrides.timePref ?? "Evening",
    skill: overrides.skill ?? "intermediate",
    socialStyle: overrides.socialStyle ?? "social",
    hostPref: overrides.hostPref ?? "either",
    groupPref: overrides.groupPref ?? "either",
    priorTableUserIds: overrides.priorTableUserIds ?? [],
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  };
}

test.describe("engine: hard constraints", () => {
  test("two players in different cities are never compatible", () => {
    const a = makeCandidate({ city: "Las Vegas", state: "NV" });
    const b = makeCandidate({ city: "Reno", state: "NV" });
    expect(hardCompatible(a, b, new Set())).toBe(false);
  });

  test("mismatched variant is never compatible", () => {
    const a = makeCandidate({ variant: "AMERICAN" });
    const b = makeCandidate({ variant: "RIICHI" });
    expect(hardCompatible(a, b, new Set())).toBe(false);
  });

  test("non-overlapping day and time are never compatible, but a flexible (null) side matches anything", () => {
    const a = makeCandidate({ dayPref: "Monday", timePref: "Evening" });
    const b = makeCandidate({ dayPref: "Tuesday", timePref: "Evening" });
    expect(hardCompatible(a, b, new Set())).toBe(false);

    const flexible = makeCandidate({ dayPref: null, timePref: null });
    expect(hardCompatible(a, flexible, new Set())).toBe(true);
  });

  test("a blocked pair is never compatible in either direction", () => {
    const a = makeCandidate({ userId: "u1" });
    const b = makeCandidate({ userId: "u2" });
    const blocked = new Set([blockKey("u2", "u1")]);
    expect(hardCompatible(a, b, blocked)).toBe(false);
    expect(hardCompatible(b, a, blocked)).toBe(false);
  });

  test("mixed record_class is never compatible, even when every other fact matches", () => {
    const a = makeCandidate({ recordClass: "real_external" });
    const b = makeCandidate({ recordClass: "test" });
    expect(hardCompatible(a, b, new Set())).toBe(false);
  });

  test("an ineligible (unconsented) candidate is never compatible, even flagged defensively on an otherwise perfect match", () => {
    const a = makeCandidate({ consentEligible: true });
    const b = makeCandidate({ consentEligible: false });
    expect(hardCompatible(a, b, new Set())).toBe(false);
  });

  test("groupHardCompatible requires all six pairs in a table of four, not just a chain", () => {
    const a = makeCandidate({ userId: "a", dayPref: "Monday" });
    const b = makeCandidate({ userId: "b", dayPref: "Monday" });
    const c = makeCandidate({ userId: "c", dayPref: null }); // flexible: overlaps both slots
    // d only overlaps a's slot via nothing shared with b directly if b were "Tuesday", so keep
    // this group hard-compatible on purpose and assert the positive case, then break one pair.
    const d = makeCandidate({ userId: "d", dayPref: "Monday" });
    expect(groupHardCompatible([a, b, c, d], new Set())).toBe(true);

    const blocked = new Set([blockKey("a", "d")]);
    expect(groupHardCompatible([a, b, c, d], blocked)).toBe(false);
  });
});

test.describe("engine: pool building", () => {
  test("buildGroups forms a table of exactly four from four hard-compatible candidates", () => {
    const pool = [makeCandidate({ userId: "p1" }), makeCandidate({ userId: "p2" }), makeCandidate({ userId: "p3" }), makeCandidate({ userId: "p4" })];
    const { groups, leftover } = buildGroups(pool, new Set());
    expect(groups.length).toBe(1);
    expect(groups[0].length).toBe(TABLE_SIZE);
    expect(leftover.length).toBe(0);
  });

  test("five mutually compatible candidates: the weakest-fit soft score is left in the pool, not picked arbitrarily", () => {
    const base = new Date("2026-01-01T00:00:00Z").getTime();
    const strong = ["s1", "s2", "s3", "s4"].map((id, i) =>
      makeCandidate({ userId: id, skill: "advanced", socialStyle: "social", createdAt: new Date(base + i * 1000).toISOString() })
    );
    const weak = makeCandidate({ userId: "weak", skill: "beginner", socialStyle: "competitive", createdAt: new Date(base + 4000).toISOString() });
    const { groups, leftover } = buildGroups([...strong, weak], new Set());
    expect(groups.length).toBe(1);
    expect(groups[0].map((c) => c.userId).sort()).toEqual(["s1", "s2", "s3", "s4"]);
    expect(leftover.map((c) => c.userId)).toEqual(["weak"]);
  });

  test("mixed record_class in an otherwise-matching five leaves everyone unmatched: three test-classified players alone cannot fill a table", () => {
    const test1 = makeCandidate({ userId: "t1", recordClass: "test" });
    const test2 = makeCandidate({ userId: "t2", recordClass: "test" });
    const test3 = makeCandidate({ userId: "t3", recordClass: "test" });
    const real1 = makeCandidate({ userId: "r1", recordClass: "real_external" });
    const { groups, leftover } = buildGroups([test1, test2, test3, real1], new Set());
    expect(groups.length).toBe(0);
    expect(leftover.length).toBe(4);
  });

  test("pickReplacement scores against every existing member and never returns a blocked candidate", () => {
    const existing = [
      makeCandidate({ userId: "m1", skill: "advanced" }),
      makeCandidate({ userId: "m2", skill: "advanced" }),
      makeCandidate({ userId: "m3", skill: "advanced" }),
    ];
    const goodFit = makeCandidate({ userId: "good", skill: "advanced", socialStyle: "social" });
    const poorFit = makeCandidate({ userId: "poor", skill: "beginner", socialStyle: "competitive" });
    const blockedButGreatFit = makeCandidate({ userId: "blocked", skill: "advanced", socialStyle: "social" });
    const blocked = new Set([blockKey("blocked", "m1")]);

    const picked = pickReplacement(existing, [poorFit, blockedButGreatFit, goodFit], blocked);
    expect(picked?.userId).toBe("good");
  });

  test("pickReplacement returns null when nobody in the pool is hard-compatible", () => {
    const existing = [makeCandidate({ userId: "m1", city: "Las Vegas", state: "NV" })];
    const pool = [makeCandidate({ userId: "far", city: "Reno", state: "NV" })];
    expect(pickReplacement(existing, pool, new Set())).toBeNull();
  });
});

test.describe("state transition guards (lib/match/states.ts)", () => {
  test("a declined seat can never become accepted", () => {
    expect(canTransitionSeat("declined", "accepted")).toBe(false);
  });

  test("an already-accepted seat cannot be accepted again", () => {
    expect(canTransitionSeat("accepted", "accepted")).toBe(false);
  });

  test("an invited seat can be accepted or declined, nothing else", () => {
    expect(canTransitionSeat("invited", "accepted")).toBe(true);
    expect(canTransitionSeat("invited", "declined")).toBe(true);
    expect(canTransitionSeat("invited", "left")).toBe(false);
  });

  test("a proposed table cannot jump straight to confirmed; forming is mandatory in between", () => {
    expect(canTransitionTable("proposed", "confirmed")).toBe(false);
    expect(canTransitionTable("proposed", "forming")).toBe(true);
    expect(canTransitionTable("forming", "confirmed")).toBe(true);
  });
});

test.describe("dark launch gate", () => {
  test("canUseDarkFeature blocks real accounts while dark and always allows test accounts", () => {
    expect(canUseDarkFeature(false, "real_external")).toBe(false);
    expect(canUseDarkFeature(false, "test")).toBe(true);
    expect(canUseDarkFeature(true, "real_external")).toBe(true);
  });

  test("source pin: request and respond both check the gate and consent before doing anything else", () => {
    const reqSrc = fs.readFileSync(path.join(__dirname, "..", "app", "api", "match", "request", "route.ts"), "utf8");
    expect(reqSrc).toMatch(/readMatchingConsent\(supabase, session\.userId\)/);
    expect(reqSrc).toMatch(/canUseDarkFeature\(launched, consent\.recordClass\)/);

    const respSrc = fs.readFileSync(path.join(__dirname, "..", "app", "api", "match", "respond", "route.ts"), "utf8");
    expect(respSrc).toMatch(/readMatchingConsent\(supabase, session\.userId\)/);
    expect(respSrc).toMatch(/canUseDarkFeature\(launched, consent\.recordClass\)/);

    const cronSrc = fs.readFileSync(path.join(__dirname, "..", "app", "api", "cron", "matcher", "route.ts"), "utf8");
    expect(cronSrc).toMatch(/buildCandidates\(/);
    const serviceSrc = fs.readFileSync(path.join(__dirname, "..", "lib", "match", "service.ts"), "utf8");
    expect(serviceSrc).toMatch(/readMatchingConsent/);
    expect(serviceSrc).toMatch(/canUseDarkFeature/);
  });
});

test.describe("match routes: auth and IDOR shape", () => {
  test("GET request requires a session", async ({ request }) => {
    expect((await request.get("/api/match/request")).status()).toBe(401);
  });

  test("POST request requires a session", async ({ request }) => {
    expect((await request.post("/api/match/request", { data: { action: "create" } })).status()).toBe(401);
  });

  test("POST respond requires a session", async ({ request }) => {
    expect((await request.post("/api/match/respond", { data: { action: "accept", tableId: "x" } })).status()).toBe(401);
  });
});

test.describe("legacy match/decide is retired", () => {
  test("GET returns 410", async ({ request }) => {
    const r = await request.get("/api/match/decide?token=whatever");
    expect(r.status()).toBe(410);
  });

  test("POST returns 410", async ({ request }) => {
    const r = await request.post("/api/match/decide", { data: { token: "whatever" } });
    expect(r.status()).toBe(410);
  });

  test("source pin: no live caller ever builds a match-approve token anymore", () => {
    const cronSrc = fs.readFileSync(path.join(__dirname, "..", "app", "api", "cron", "matcher", "route.ts"), "utf8");
    expect(cronSrc).not.toMatch(/match-approve/);
    expect(cronSrc).not.toMatch(/signActionToken/);
  });
});

test.describe("public table listing excludes non-real rows", () => {
  test("source pin: tables/find filters to record_class real_external", () => {
    const source = fs.readFileSync(path.join(__dirname, "..", "app", "api", "tables", "find", "route.ts"), "utf8");
    expect(source).toContain('eq("record_class", "real_external")');
  });

  test("a test-classified table never appears in a live find query", async ({ request }) => {
    const { url, key } = readSupabaseServiceEnv();
    test.skip(!url || !key, "Supabase service env not available in this environment");
    const db: SupabaseClient = createClient(url!, key!);
    const city = `Mahj Match Filter Check ${Date.now()}`;
    const { data: row, error } = await db
      .from("tables")
      .insert({
        share_code: `qafind${Math.random().toString(36).slice(2, 8)}`,
        host_name: "QA Find Filter",
        city,
        skill: "anyone",
        seats_total: 4,
        status: "forming",
        record_class: "test",
      })
      .select("id")
      .single();
    expect(error, error?.message).toBeNull();
    try {
      const res = await request.get(`/api/tables/find?city=${encodeURIComponent(city)}`);
      expect(res.ok()).toBeTruthy();
      const j = await res.json();
      expect(j.tables).toEqual([]);
    } finally {
      if (row?.id) await db.from("tables").delete().eq("id", row.id);
    }
  });
});

// ---- QA end-to-end: account-based matching against the live (test-classified) database ----

function readEnvFile(): string | null {
  const envPath = path.join(__dirname, "..", ".env.local");
  return fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : null;
}

function readAdminPassword(): string | undefined {
  let password = process.env.ADMIN_PASSWORD;
  const envFile = readEnvFile();
  if (!password && envFile) {
    password = envFile.match(/^ADMIN_PASSWORD=(.*)$/m)?.[1]?.replace(/^"|"$/g, "");
  }
  return password;
}

function readSupabaseServiceEnv(): { url?: string; key?: string } {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const envFile = readEnvFile();
  if (envFile) {
    if (!url) url = envFile.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m)?.[1]?.replace(/^"|"$/g, "");
    if (!key) key = envFile.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m)?.[1]?.replace(/^"|"$/g, "");
  }
  return { url, key };
}

async function signInQaUser(baseURL: string, adminCtx: APIRequestContext, email: string): Promise<{ ctx: APIRequestContext; userId: string }> {
  const signin = await adminCtx.post("/api/auth/signin", { data: { email, role: "player" } });
  if (!signin.ok()) throw new Error(`signin failed for ${email}: ${signin.status()} ${await signin.text()}`);
  const sj = await signin.json();
  const tokenHash = new URL(sj.confirmUrl).searchParams.get("token_hash");

  const ctx = await pwRequest.newContext({ baseURL });
  const verify = await ctx.post("/api/auth/verify", { data: { token_hash: tokenHash, role: "player" } });
  if (!verify.ok()) throw new Error(`verify failed for ${email}: ${verify.status()} ${await verify.text()}`);

  const cookies = (await ctx.storageState()).cookies;
  const cookie = cookies.find((c) => c.name === USER_COOKIE);
  if (!cookie) throw new Error(`no session cookie set for ${email}`);
  // The session cookie is base64url("user-session:{userId}:{role}:{expires}:{sig}"). Reading the
  // userId back out of a cookie this test just received from a real, HMAC-signed issuance is
  // simpler and more honest than adding a test-only endpoint that returns account ids.
  const payload = Buffer.from(cookie.value, "base64url").toString("utf8");
  const userId = payload.split(":")[1];
  if (!userId) throw new Error(`could not read userId out of session cookie for ${email}`);
  return { ctx, userId };
}

type QaKey = "a" | "b" | "c" | "d" | "e";
const QA_KEYS: QaKey[] = ["a", "b", "c", "d", "e"];

test.describe("Mahj Match QA end-to-end", () => {
  test.describe.configure({ mode: "serial" });

  const startedAt = new Date().toISOString();
  let serviceClient: SupabaseClient;
  let adminCtx: APIRequestContext;
  const users = {} as Record<QaKey, { ctx: APIRequestContext; userId: string; requestId?: string }>;
  const created = {
    playRequests: new Set<string>(),
    tableSeats: new Set<string>(),
    tables: new Set<string>(),
    matchDrafts: new Set<string>(),
  };
  let tableAId: string;
  let table2Id: string;

  test.beforeAll(async ({ baseURL }) => {
    const password = readAdminPassword();
    const { url, key } = readSupabaseServiceEnv();
    test.skip(!password || !url || !key, "ADMIN_PASSWORD or Supabase service env not available in this environment");

    serviceClient = createClient(url!, key!);
    adminCtx = await pwRequest.newContext({ baseURL: baseURL || "http://localhost:3000" });
    const login = await adminCtx.post("/api/admin/login", { data: { password } });
    if (!login.ok()) throw new Error(`admin login failed: ${login.status()}`);

    for (const k of QA_KEYS) {
      const email = `qa-match-${k}@fmg-qa.test`;
      const { ctx, userId } = await signInQaUser(baseURL || "http://localhost:3000", adminCtx, email);
      users[k] = { ctx, userId };

      await serviceClient.from("profiles").update({ display_name: `Qa ${k.toUpperCase()}.` }).eq("id", userId);
      const { error: mpErr } = await serviceClient.from("matching_profiles").upsert({
        user_id: userId,
        adult_affirmed_at: new Date().toISOString(),
        consent_version: CONSENT_VERSION,
        matching_opt_in_at: new Date().toISOString(),
        matching_deactivated_at: null,
        city: "Mahj Match QA City",
        state: "ZZ",
        variant: "AMERICAN",
        skill: "advanced",
        social_style: "social",
        host_pref: k === "a" ? "can_host" : "either",
        group_pref: "either",
        record_class: "test",
      });
      if (mpErr) throw new Error(`matching_profiles upsert failed for ${email}: ${mpErr.message}`);
    }
  });

  test.afterAll(async () => {
    if (!serviceClient) return;
    if (created.tableSeats.size) await serviceClient.from("table_seats").delete().in("id", [...created.tableSeats]);
    if (created.matchDrafts.size) await serviceClient.from("match_drafts").delete().in("id", [...created.matchDrafts]);
    if (created.tables.size) await serviceClient.from("tables").delete().in("id", [...created.tables]);
    if (created.playRequests.size) await serviceClient.from("play_requests").delete().in("id", [...created.playRequests]);
    const userIds = QA_KEYS.map((k) => users[k]?.userId).filter((v): v is string => !!v);
    if (userIds.length) await serviceClient.from("matching_profiles").delete().in("user_id", userIds);
    await adminCtx?.dispose();
    for (const k of QA_KEYS) await users[k]?.ctx.dispose();
  });

  test("four consented players get matched, propose, and all accept into a confirmed table", async () => {
    for (const k of (["a", "b", "c", "d"] as const)) {
      const { data, error } = await serviceClient
        .from("play_requests")
        .insert({
          user_id: users[k].userId,
          name: `Qa ${k.toUpperCase()}.`,
          city: "Mahj Match QA City",
          state: "ZZ",
          day_pref: "Monday",
          time_pref: "Evening",
          variant: "AMERICAN",
          status: "open",
          record_class: "test",
        })
        .select("id")
        .single();
      if (error || !data) throw new Error(`play_request insert failed for ${k}: ${error?.message}`);
      users[k].requestId = data.id as string;
      created.playRequests.add(data.id as string);
    }

    const result = await runMatcher(serviceClient);
    expect(result.tablesProposed).toBeGreaterThanOrEqual(1);

    const { data: seatA } = await serviceClient
      .from("table_seats")
      .select("id, table_id, status")
      .eq("user_id", users.a.userId)
      .eq("status", "invited")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    expect(seatA, "the matcher should have invited A to a proposed table").toBeTruthy();
    tableAId = seatA!.table_id as string;
    created.tables.add(tableAId);

    const { data: allSeatsForTable } = await serviceClient.from("table_seats").select("id").eq("table_id", tableAId);
    for (const s of allSeatsForTable || []) created.tableSeats.add(s.id as string);
    const { data: draftRow } = await serviceClient.from("match_drafts").select("id").eq("table_id", tableAId).maybeSingle();
    if (draftRow) created.matchDrafts.add(draftRow.id as string);

    for (const k of (["b", "c", "d"] as const)) {
      const { data: seat } = await serviceClient
        .from("table_seats")
        .select("status")
        .eq("user_id", users[k].userId)
        .eq("table_id", tableAId)
        .maybeSingle();
      expect(seat?.status, `${k} should be invited to the same table as a`).toBe("invited");
    }

    for (const k of (["a", "b", "c"] as const)) {
      const r = await users[k].ctx.post("/api/match/respond", { data: { action: "accept", tableId: tableAId } });
      expect(r.ok(), `${k} accept should succeed`).toBeTruthy();
      const j = await r.json();
      expect(j.tableStatus, "table must not form before all four accept").toBe("proposed");
    }

    // IDOR: user E has no seat on this table.
    const idor = await users.e.ctx.post("/api/match/respond", { data: { action: "accept", tableId: tableAId } });
    expect(idor.status()).toBe(404);

    // Unknown action, authenticated: reaches validation, not the auth check.
    const badAction = await users.a.ctx.post("/api/match/respond", { data: { action: "nonsense", tableId: tableAId } });
    expect(badAction.status()).toBe(400);

    // Cannot re-accept an already-accepted seat.
    const reaccept = await users.a.ctx.post("/api/match/respond", { data: { action: "accept", tableId: tableAId } });
    expect(reaccept.status()).toBe(409);

    const last = await users.d.ctx.post("/api/match/respond", { data: { action: "accept", tableId: tableAId } });
    expect(last.ok()).toBeTruthy();
    const lastJson = await last.json();
    expect(lastJson.tableStatus).toBe("confirmed");

    const { data: confirmedTable } = await serviceClient.from("tables").select("status, host_user_id").eq("id", tableAId).single();
    expect(confirmedTable?.status).toBe("confirmed");
    expect(confirmedTable?.host_user_id, "the only can_host member should become host").toBe(users.a.userId);

    const { data: finalSeats } = await serviceClient.from("table_seats").select("status").eq("table_id", tableAId);
    expect((finalSeats || []).filter((s) => s.status === "accepted").length).toBe(4);

    for (const k of (["a", "b", "c", "d"] as const)) {
      const { data: pr } = await serviceClient.from("play_requests").select("status").eq("id", users[k].requestId!).single();
      expect(pr?.status).toBe("matched");
    }
  });

  test("declining an invited seat reopens it for the remaining members without cancelling the table", async () => {
    const { data: t2, error: t2Err } = await serviceClient
      .from("tables")
      .insert({
        share_code: `qadecl${Math.random().toString(36).slice(2, 8)}`,
        host_name: "Mahj Match",
        city: "Mahj Match QA City",
        state: "ZZ",
        day_of_week: "Tuesday",
        time_of_day: "Afternoon",
        skill: "anyone",
        seats_total: TABLE_SIZE,
        status: "proposed",
        record_class: "test",
      })
      .select("id")
      .single();
    if (t2Err || !t2) throw new Error(`decline-scenario table insert failed: ${t2Err?.message}`);
    table2Id = t2.id as string;
    created.tables.add(table2Id);

    for (const k of (["b", "c", "d", "e"] as const)) {
      const { data: s, error: sErr } = await serviceClient
        .from("table_seats")
        .insert({ table_id: table2Id, user_id: users[k].userId, name: `Qa ${k.toUpperCase()}.`, status: "invited", record_class: "test" })
        .select("id")
        .single();
      if (sErr || !s) throw new Error(`decline-scenario seat insert failed for ${k}: ${sErr?.message}`);
      created.tableSeats.add(s.id as string);
    }

    const decline = await users.e.ctx.post("/api/match/respond", { data: { action: "decline", tableId: table2Id } });
    expect(decline.ok()).toBeTruthy();
    expect((await decline.json()).seatStatus).toBe("declined");

    const { data: eSeat } = await serviceClient.from("table_seats").select("status").eq("table_id", table2Id).eq("user_id", users.e.userId).single();
    expect(eSeat?.status).toBe("declined");

    const { data: t2After } = await serviceClient.from("tables").select("status").eq("id", table2Id).single();
    expect(t2After?.status, "a decline never cancels the table").toBe("proposed");

    const stillInvited = await serviceClient
      .from("table_seats")
      .select("status")
      .eq("table_id", table2Id)
      .in("user_id", [users.b.userId, users.c.userId, users.d.userId]);
    expect((stillInvited.data || []).every((s) => s.status === "invited")).toBeTruthy();

    // Declining twice is not a legal transition.
    const redecline = await users.e.ctx.post("/api/match/respond", { data: { action: "decline", tableId: table2Id } });
    expect(redecline.status()).toBe(409);

    const { data: reopenedNotices } = await serviceClient
      .from("notifications_log")
      .select("user_id, status")
      .eq("kind", "match_seat_reopened")
      .gte("created_at", startedAt);
    const notifiedUserIds = (reopenedNotices || []).map((n) => n.user_id);
    for (const k of (["b", "c", "d"] as const)) {
      expect(notifiedUserIds).toContain(users[k].userId);
    }
    expect((reopenedNotices || []).every((n) => n.status === "skipped_qa"), "QA emails must never actually send").toBeTruthy();
  });

  test("notifications and analytics for this run are ledgered as test / skipped_qa", async () => {
    // The scenarios above insert play_requests directly via the service client (as instructed,
    // to set up matcher fixtures), which never touches app/api/match/request and so never fires
    // match_request_created. E has no active request yet, so exercising the real route once here
    // covers that event through its actual code path instead of asserting something no test ever
    // triggers.
    const createRes = await users.e.ctx.post("/api/match/request", {
      data: { action: "create", city: "Mahj Match QA City", state: "ZZ" },
    });
    expect(createRes.ok()).toBeTruthy();
    const createJson = await createRes.json();
    created.playRequests.add(createJson.request.id);

    const userIds = QA_KEYS.map((k) => users[k].userId);
    const { data: notices } = await serviceClient
      .from("notifications_log")
      .select("kind, status")
      .in("user_id", userIds)
      .gte("created_at", startedAt);
    const kinds = new Set((notices || []).map((n) => n.kind));
    for (const expectedKind of ["match_table_proposed", "match_player_accepted", "match_table_confirmed", "match_seat_reopened"]) {
      expect(kinds.has(expectedKind), `expected a ${expectedKind} notification in this run`).toBeTruthy();
    }
    expect((notices || []).every((n) => n.status === "skipped_qa"), "every QA notification must be ledgered skipped_qa, never sent").toBeTruthy();

    const { data: events } = await serviceClient.from("analytics_events").select("name").eq("record_class", "test").gte("created_at", startedAt);
    const names = new Set((events || []).map((e) => e.name));
    for (const expectedName of ["match_request_created", "table_proposed", "table_accept", "table_formed", "table_decline"]) {
      expect(names.has(expectedName), `expected a ${expectedName} analytics event in this run`).toBeTruthy();
    }
  });
});
