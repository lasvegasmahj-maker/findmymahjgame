import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { triageReport, isReportCategory, REPORT_CATEGORIES, LOW_TRIAGE_MAX_DETAIL_LENGTH } from "../lib/safety/triage";
import { canUseDarkFeature } from "../lib/launch-gates";
import { rateLimitCheck, type RateLimitStore } from "../lib/rate-limit";
import { CONSENT_VERSION } from "../lib/match/consent";

// Safety and moderation: 18+ consent (Mahj Match), blocking, reporting, admin
// triage. launch_player_matching stays OFF in production, so the end-to-end
// tests below run as QA (record_class 'test') identities, admin-driven, the
// same pattern tests/identity.spec.ts establishes.
//
// One deliberate gap: filing a harassment/unsafe/false_identity report (or any
// report whose detail escalates) makes the report route call notify() to the
// real hello@findmymahjgame.com inbox for real, see lib/notifications/notify.ts,
// where only @fmg-qa.test recipients are suppressed and the founder inbox is not
// one. A suite that runs on every push must not send that inbox a live email
// each time, so the needs_human path is proven with the deterministic unit tests
// below plus source pins, never a live report that would actually escalate.

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
const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
const supabaseAdmin: SupabaseClient | null = SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

const QA_A = "qa-safety-a@fmg-qa.test";
const QA_B = "qa-safety-b@fmg-qa.test";
const QA_C = "qa-safety-c@fmg-qa.test";

function srcOf(...parts: string[]): string {
  return fs.readFileSync(path.join(__dirname, "..", ...parts), "utf8");
}

type QaSession = { ctx: APIRequestContext; userId: string };

// Mirrors the admin-driven QA walkthrough in tests/identity.spec.ts: admin login,
// then a signin+verify for the QA email, which lands as record_class 'test'.
async function qaSignIn(baseURL: string, email: string): Promise<QaSession | null> {
  if (!ADMIN_PASSWORD || !supabaseAdmin) return null;
  const ctx = await pwRequest.newContext({ baseURL });
  const login = await ctx.post("/api/admin/login", { data: { password: ADMIN_PASSWORD } });
  if (!login.ok()) {
    await ctx.dispose();
    return null;
  }
  const signin = await ctx.post("/api/auth/signin", { data: { email, role: "player" } });
  if (!signin.ok()) {
    await ctx.dispose();
    return null;
  }
  const sj = await signin.json();
  const tokenHash = new URL(sj.confirmUrl).searchParams.get("token_hash");
  if (!tokenHash) {
    await ctx.dispose();
    return null;
  }
  const verify = await ctx.post("/api/auth/verify", { data: { token_hash: tokenHash, role: "player" } });
  if (!verify.ok()) {
    await ctx.dispose();
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    await ctx.dispose();
    return null;
  }
  const user = data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
  if (!user) {
    await ctx.dispose();
    return null;
  }
  return { ctx, userId: user.id };
}

test.describe("lib/safety/triage: deterministic report status", () => {
  test("harassment is always needs_human", () => {
    expect(triageReport("harassment", "")).toBe("needs_human");
    expect(triageReport("harassment", "a calm, short note")).toBe("needs_human");
  });

  test("unsafe is always needs_human", () => {
    expect(triageReport("unsafe", "")).toBe("needs_human");
  });

  test("false_identity is always needs_human", () => {
    expect(triageReport("false_identity", "")).toBe("needs_human");
  });

  test("spam_scam with a short, clean detail triages low", () => {
    expect(triageReport("spam_scam", "This looks like a bot account.")).toBe("triaged_low");
  });

  test("spam_scam with no detail at all triages low", () => {
    expect(triageReport("spam_scam", null)).toBe("triaged_low");
    expect(triageReport("spam_scam", undefined)).toBe("triaged_low");
  });

  test("other with a short, clean detail triages low", () => {
    expect(triageReport("other", "Wrong hours listed for this teacher.")).toBe("triaged_low");
  });

  test("spam_scam escalates on a safety keyword", () => {
    expect(triageReport("spam_scam", "they threatened me after I said no")).toBe("needs_human");
  });

  test("other escalates on a safety keyword", () => {
    expect(triageReport("other", "I feel unsafe meeting this person")).toBe("needs_human");
  });

  test("spam_scam escalates once the detail passes the low-triage length", () => {
    const long = "x".repeat(LOW_TRIAGE_MAX_DETAIL_LENGTH + 1);
    expect(triageReport("spam_scam", long)).toBe("needs_human");
  });

  test("isReportCategory accepts only the canonical five categories", () => {
    expect(REPORT_CATEGORIES).toEqual(["harassment", "spam_scam", "unsafe", "false_identity", "other"]);
    expect(isReportCategory("harassment")).toBe(true);
    expect(isReportCategory("hacking")).toBe(false);
    expect(isReportCategory(undefined)).toBe(false);
  });
});

test.describe("launch gate: playerMatching wiring", () => {
  test("canUseDarkFeature blocks real accounts and allows test accounts while dark", () => {
    expect(canUseDarkFeature(false, "real_external")).toBe(false);
    expect(canUseDarkFeature(false, "test")).toBe(true);
    expect(canUseDarkFeature(false, null)).toBe(false);
    expect(canUseDarkFeature(true, "real_external")).toBe(true);
  });

  test("source pin: match/consent enforces the playerMatching gate", () => {
    const source = srcOf("app", "api", "match", "consent", "route.ts");
    expect(source).toMatch(/isLaunched\(supabase, "playerMatching"\)/);
    expect(source).toMatch(/canUseDarkFeature\(launched, profile\.record_class\)/);
  });

  test("source pin: safety/block enforces the playerMatching gate", () => {
    const source = srcOf("app", "api", "safety", "block", "route.ts");
    expect(source).toMatch(/isLaunched\(supabase, "playerMatching"\)/);
    expect(source).toMatch(/canUseDarkFeature\(launched, profile\.record_class\)/);
  });

  test("source pin: safety/report enforces the playerMatching gate", () => {
    const source = srcOf("app", "api", "safety", "report", "route.ts");
    expect(source).toMatch(/isLaunched\(supabase, "playerMatching"\)/);
    expect(source).toMatch(/canUseDarkFeature\(launched, profile\.record_class\)/);
  });

  test("source pin: admin/reports is admin-gated only, not launch-gated", () => {
    // A founder needs to see reports that land during dark QA testing too, so
    // this route checks the admin cookie and nothing else.
    const source = srcOf("app", "api", "admin", "reports", "route.ts");
    expect(source).toMatch(/verifyAdminSessionToken/);
    expect(source).not.toContain("playerMatching");
  });
});

test.describe("rate limiting: safety report threshold", () => {
  const storeWithCount = (count: number): RateLimitStore => ({
    from: () => ({
      select: () => ({ eq: () => ({ gte: async () => ({ count, error: null }) }) }),
      insert: async () => ({ error: null }),
    }),
  });

  test("allows the 3rd request in a 300 second window", async () => {
    expect(await rateLimitCheck(storeWithCount(2), "safety-report:1.2.3.4", 3, 300, "open")).toBe(true);
  });

  test("denies the 4th request in a 300 second window", async () => {
    expect(await rateLimitCheck(storeWithCount(3), "safety-report:1.2.3.4", 3, 300, "open")).toBe(false);
  });

  test("source pin: the report route calls rateLimit with 3 per 300 seconds", () => {
    const source = srcOf("app", "api", "safety", "report", "route.ts");
    expect(source).toMatch(/rateLimit\(req,\s*"safety-report",\s*3,\s*300\)/);
  });
});

test.describe.serial("safety and moderation: end to end", () => {
  test.skip(!ADMIN_PASSWORD, "ADMIN_PASSWORD not available in this environment");

  let a: QaSession;
  let b: QaSession;
  let c: QaSession;
  let adminCtx: APIRequestContext;
  let anonCtx: APIRequestContext;
  let otherReportId = "";
  let subjectReportId = "";

  test.beforeAll(async ({ baseURL }) => {
    const base = baseURL || "http://localhost:3203";
    const [sa, sb, sc] = await Promise.all([qaSignIn(base, QA_A), qaSignIn(base, QA_B), qaSignIn(base, QA_C)]);
    if (!sa || !sb || !sc) throw new Error("QA sign-in setup failed for the safety-moderation suite");
    a = sa;
    b = sb;
    c = sc;
    adminCtx = await pwRequest.newContext({ baseURL: base });
    await adminCtx.post("/api/admin/login", { data: { password: ADMIN_PASSWORD } });
    anonCtx = await pwRequest.newContext({ baseURL: base });
  });

  test.afterAll(async () => {
    await a?.ctx.dispose();
    await b?.ctx.dispose();
    await c?.ctx.dispose();
    await adminCtx?.dispose();
    await anonCtx?.dispose();
    if (!supabaseAdmin) return;
    // c never opts in successfully by design, but every negative test that might
    // accidentally succeed writes under c's id, so it is cleaned up defensively too.
    const optedInIds = [a?.userId, c?.userId].filter((x): x is string => !!x);
    if (optedInIds.length) await supabaseAdmin.from("matching_profiles").delete().in("user_id", optedInIds);
    if (a && b) await supabaseAdmin.from("user_blocks").delete().eq("blocker_user_id", b.userId).eq("blocked_user_id", a.userId);
    const reportIds = [otherReportId, subjectReportId].filter(Boolean);
    if (reportIds.length) await supabaseAdmin.from("user_reports").delete().in("id", reportIds);
  });

  test.describe("match/consent", () => {
    test("opt_in rejects when adult is missing", async () => {
      const r = await c.ctx.post("/api/match/consent", {
        data: { action: "opt_in", agree: true, city: "Reno", state: "NV", travel_radius_miles: 25 },
      });
      expect(r.status()).toBe(400);
    });

    test("opt_in rejects when agree is false", async () => {
      const r = await c.ctx.post("/api/match/consent", {
        data: { action: "opt_in", adult: true, agree: false, city: "Reno", state: "NV", travel_radius_miles: 25 },
      });
      expect(r.status()).toBe(400);
    });

    test("opt_in rejects a truthy non-boolean adult value", async () => {
      const r = await c.ctx.post("/api/match/consent", {
        data: { action: "opt_in", adult: "yes", agree: true, city: "Reno", state: "NV", travel_radius_miles: 25 },
      });
      expect(r.status()).toBe(400);
    });

    test("opt_in rejects a street address in city", async () => {
      const r = await c.ctx.post("/api/match/consent", {
        data: { action: "opt_in", adult: true, agree: true, city: "123 Main St", state: "NV", travel_radius_miles: 25 },
      });
      expect(r.status()).toBe(400);
      const j = await r.json();
      expect(String(j.error)).toContain("street");
    });

    test("opt_in rejects an out-of-range travel radius", async () => {
      const r = await c.ctx.post("/api/match/consent", {
        data: { action: "opt_in", adult: true, agree: true, city: "Reno", state: "NV", travel_radius_miles: 500 },
      });
      expect(r.status()).toBe(400);
    });

    test("opt_in succeeds and writes the consent facts with the current version", async () => {
      const r = await a.ctx.post("/api/match/consent", {
        data: {
          action: "opt_in",
          adult: true,
          agree: true,
          city: "Henderson",
          state: "NV",
          travel_radius_miles: 25,
          availability: [{ day: "monday", time_of_day: "evening" }],
          variant: "AMERICAN",
          skill: "intermediate",
          social_style: "social",
          host_pref: "either",
          group_pref: "either",
        },
      });
      expect(r.ok()).toBeTruthy();

      const getRes = await a.ctx.get("/api/match/consent");
      const gj = await getRes.json();
      expect(gj.optedIn).toBe(true);
      expect(gj.consentVersion).toBe(CONSENT_VERSION);

      if (!supabaseAdmin) return;
      const { data: mp } = await supabaseAdmin.from("matching_profiles").select("*").eq("user_id", a.userId).single();
      expect(mp.adult_affirmed_at).toBeTruthy();
      expect(mp.consent_version).toBe(CONSENT_VERSION);
      expect(mp.matching_opt_in_at).toBeTruthy();
      expect(mp.matching_deactivated_at).toBeNull();
      expect(mp.record_class).toBe("test");
      expect(mp.city).toBe("Henderson");
      expect(mp.state).toBe("NV");
      expect(mp.travel_radius_miles).toBe(25);
      expect(mp.availability).toEqual([{ day: "monday", time_of_day: "evening" }]);
      expect(mp.skill).toBe("intermediate");
    });

    test("IDOR: another account cannot read this account's consent", async () => {
      const r = await b.ctx.get("/api/match/consent");
      const j = await r.json();
      expect(j.optedIn).toBe(false);
      expect(j.city).toBeUndefined();
    });

    test("IDOR: another account's id in the body cannot deactivate this account", async () => {
      const r = await b.ctx.post("/api/match/consent", { data: { action: "deactivate", user_id: a.userId } });
      expect(r.status()).toBe(400); // b is not opted in; the injected id changes nothing

      if (!supabaseAdmin) return;
      const { data: mp } = await supabaseAdmin.from("matching_profiles").select("matching_deactivated_at").eq("user_id", a.userId).single();
      if (!mp) throw new Error("matching_profiles row missing for a.userId");
      expect(mp.matching_deactivated_at).toBeNull();
    });

    test("update_preferences requires opting in first", async () => {
      const r = await c.ctx.post("/api/match/consent", { data: { action: "update_preferences", city: "Reno", state: "NV" } });
      expect(r.status()).toBe(400);
    });

    test("deactivate requires opting in first", async () => {
      const r = await c.ctx.post("/api/match/consent", { data: { action: "deactivate" } });
      expect(r.status()).toBe(400);
    });

    test("update_preferences updates only the fields provided", async () => {
      const r = await a.ctx.post("/api/match/consent", { data: { action: "update_preferences", travel_radius_miles: 50 } });
      expect(r.ok()).toBeTruthy();

      if (!supabaseAdmin) return;
      const { data: mp } = await supabaseAdmin.from("matching_profiles").select("city, state, travel_radius_miles").eq("user_id", a.userId).single();
      if (!mp) throw new Error("matching_profiles row missing for a.userId");
      expect(mp.travel_radius_miles).toBe(50);
      expect(mp.city).toBe("Henderson");
      expect(mp.state).toBe("NV");
    });

    test("deactivate works", async () => {
      const r = await a.ctx.post("/api/match/consent", { data: { action: "deactivate" } });
      expect(r.ok()).toBeTruthy();

      const getRes = await a.ctx.get("/api/match/consent");
      const gj = await getRes.json();
      expect(gj.optedIn).toBe(false);

      if (!supabaseAdmin) return;
      const { data: mp } = await supabaseAdmin.from("matching_profiles").select("matching_deactivated_at").eq("user_id", a.userId).single();
      if (!mp) throw new Error("matching_profiles row missing for a.userId");
      expect(mp.matching_deactivated_at).toBeTruthy();
    });
  });

  test.describe("safety/block", () => {
    test("cannot block yourself", async () => {
      const r = await a.ctx.post("/api/safety/block", { data: { action: "block", user_id: a.userId } });
      expect(r.status()).toBe(400);
    });

    test("invalid user id is rejected", async () => {
      const r = await a.ctx.post("/api/safety/block", { data: { action: "block", user_id: "not-a-uuid" } });
      expect(r.status()).toBe(400);
    });

    test("unknown action is rejected", async () => {
      const r = await a.ctx.post("/api/safety/block", { data: { action: "nope", user_id: b.userId } });
      expect(r.status()).toBe(400);
    });

    test("requires a session", async () => {
      const r = await anonCtx.post("/api/safety/block", { data: { action: "block", user_id: a.userId } });
      expect(r.status()).toBe(401);
    });

    test("block writes a row", async () => {
      const r = await b.ctx.post("/api/safety/block", { data: { action: "block", user_id: a.userId } });
      expect(r.ok()).toBeTruthy();
      const j = await r.json();
      expect(j.blocked).toBe(true);

      if (!supabaseAdmin) return;
      const { data: row } = await supabaseAdmin
        .from("user_blocks").select("*").eq("blocker_user_id", b.userId).eq("blocked_user_id", a.userId).single();
      expect(row).toBeTruthy();
    });

    test("blocking the same account twice does not error", async () => {
      const r = await b.ctx.post("/api/safety/block", { data: { action: "block", user_id: a.userId } });
      expect(r.ok()).toBeTruthy();
    });

    test("GET lists only the caller's own blocks", async () => {
      const rb = await b.ctx.get("/api/safety/block");
      const jb = await rb.json();
      expect(jb.blocks.some((x: { userId: string }) => x.userId === a.userId)).toBe(true);

      const ra = await a.ctx.get("/api/safety/block");
      const ja = await ra.json();
      expect(ja.blocks.some((x: { userId: string }) => x.userId === b.userId)).toBe(false);
    });

    test("source pin: blocking never notifies the blocked person", () => {
      const source = srcOf("app", "api", "safety", "block", "route.ts");
      expect(source).not.toMatch(/notify\(/);
    });

    test("unblock removes the row", async () => {
      const r = await b.ctx.post("/api/safety/block", { data: { action: "unblock", user_id: a.userId } });
      expect(r.ok()).toBeTruthy();
      const j = await r.json();
      expect(j.blocked).toBe(false);

      if (!supabaseAdmin) return;
      const { data: row } = await supabaseAdmin
        .from("user_blocks").select("id").eq("blocker_user_id", b.userId).eq("blocked_user_id", a.userId).maybeSingle();
      expect(row).toBeNull();
    });
  });

  test.describe("safety/report", () => {
    test("requires a session", async () => {
      const r = await anonCtx.post("/api/safety/report", { data: { category: "other", detail: "test" } });
      expect(r.status()).toBe(401);
    });

    test("rejects an invalid category", async () => {
      const r = await a.ctx.post("/api/safety/report", { data: { category: "hacking", detail: "x" } });
      expect(r.status()).toBe(400);
    });

    test("rejects mixing a person subject and a listing subject", async () => {
      const r = await a.ctx.post("/api/safety/report", {
        data: { category: "other", subject_user_id: b.userId, subject_table: "tables", subject_id: randomUUID() },
      });
      expect(r.status()).toBe(400);
    });

    test("rejects a subject table outside the allowlist", async () => {
      const r = await a.ctx.post("/api/safety/report", {
        data: { category: "other", subject_table: "profiles", subject_id: randomUUID() },
      });
      expect(r.status()).toBe(400);
    });

    // Both of these resolve to triaged_low (short, clean detail) so neither one
    // triggers the live founder-inbox email; see the suite-level comment above.
    test("files a low-severity report with no subject and triages it low", async () => {
      const r = await a.ctx.post("/api/safety/report", { data: { category: "other", detail: "wrong hours listed on this teacher's page" } });
      expect(r.ok()).toBeTruthy();

      if (!supabaseAdmin) return;
      const { data: rows } = await supabaseAdmin
        .from("user_reports").select("*").eq("reporter_user_id", a.userId).order("created_at", { ascending: false }).limit(1);
      const row = rows?.[0];
      expect(row).toBeTruthy();
      expect(row.status).toBe("triaged_low");
      expect(row.category).toBe("other");
      expect(row.subject_user_id).toBeNull();
      expect(row.record_class).toBe("test");
      otherReportId = row.id;
    });

    test("files a report naming a subject player and triages it low", async () => {
      const r = await b.ctx.post("/api/safety/report", { data: { category: "spam_scam", detail: "kept sending me links", subject_user_id: a.userId } });
      expect(r.ok()).toBeTruthy();

      if (!supabaseAdmin) return;
      const { data: rows } = await supabaseAdmin
        .from("user_reports").select("*").eq("reporter_user_id", b.userId).order("created_at", { ascending: false }).limit(1);
      const row = rows?.[0];
      expect(row.status).toBe("triaged_low");
      expect(row.subject_user_id).toBe(a.userId);
      subjectReportId = row.id;
    });

    test("source pin: needs_human reports ring the founder inbox", () => {
      const source = srcOf("app", "api", "safety", "report", "route.ts");
      expect(source).toMatch(/status === "needs_human"/);
      expect(source).toContain('kind: "account_security"');
      expect(source).toContain("hello@findmymahjgame.com");
    });
  });

  test.describe("admin/reports", () => {
    test("GET requires an admin cookie", async () => {
      const r = await anonCtx.get("/api/admin/reports");
      expect(r.status()).toBe(401);
    });

    test("POST requires an admin cookie", async () => {
      const r = await anonCtx.post("/api/admin/reports", { data: { id: randomUUID(), decision: "resolve", triage_note: "x" } });
      expect(r.status()).toBe(401);
    });

    test("GET rejects an invalid status filter", async () => {
      const r = await adminCtx.get("/api/admin/reports?status=bogus");
      expect(r.status()).toBe(400);
    });

    test("resolve requires a non-empty triage note", async () => {
      const r = await adminCtx.post("/api/admin/reports", { data: { id: otherReportId, decision: "resolve", triage_note: "" } });
      expect(r.status()).toBe(400);
    });

    test("invalid decision is rejected", async () => {
      const r = await adminCtx.post("/api/admin/reports", { data: { id: otherReportId, decision: "nope", triage_note: "reviewed" } });
      expect(r.status()).toBe(400);
    });

    test("resolves an open report and stores the note", async () => {
      const r = await adminCtx.post("/api/admin/reports", { data: { id: otherReportId, decision: "resolve", triage_note: "Reviewed, no action needed." } });
      expect(r.ok()).toBeTruthy();

      if (!supabaseAdmin) return;
      const { data: row } = await supabaseAdmin.from("user_reports").select("status, triage_note").eq("id", otherReportId).single();
      if (!row) throw new Error("user_reports row missing for otherReportId");
      expect(row.status).toBe("resolved");
      expect(row.triage_note).toBe("Reviewed, no action needed.");
    });

    test("cannot resolve an already-decided report twice", async () => {
      const r = await adminCtx.post("/api/admin/reports", { data: { id: otherReportId, decision: "resolve", triage_note: "again" } });
      expect(r.status()).toBe(409);
    });

    test("GET filters by status", async () => {
      const r = await adminCtx.get("/api/admin/reports?status=resolved");
      expect(r.ok()).toBeTruthy();
      const j = await r.json();
      expect(j.items.some((x: { id: string }) => x.id === otherReportId)).toBe(true);
    });

    test("dismisses the remaining open report", async () => {
      const r = await adminCtx.post("/api/admin/reports", { data: { id: subjectReportId, decision: "dismiss", triage_note: "Not enough detail to act on." } });
      expect(r.ok()).toBeTruthy();
    });
  });
});
