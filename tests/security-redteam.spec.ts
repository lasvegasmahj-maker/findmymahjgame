import { test, expect, request as pwRequest, APIRequestContext } from "@playwright/test";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import type { NextRequest } from "next/server";
import { createAdminSessionToken, verifyAdminSessionToken } from "../lib/admin-auth";
import { createUserSessionToken, verifyUserSessionToken } from "../lib/user-auth";
import { signGameToken, verifyGameToken, signActionToken, verifyActionToken } from "../lib/game-token";
import { enforcePublicName } from "../lib/sanitize";
import { ipOf } from "../lib/rate-limit";

// Red-team regression suite for sec-redteam. Each describe block below pins one
// confirmed-and-fixed vulnerability: a live exploit request that used to succeed,
// verified here to now fail, alongside the legitimate case that must keep working.

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
if (ENV.HMAC_SECRET && !process.env.HMAC_SECRET) process.env.HMAC_SECRET = ENV.HMAC_SECRET;
const hasSupabase = Boolean(SUPABASE_URL && SERVICE_KEY);
const service: SupabaseClient | null = hasSupabase ? createClient(SUPABASE_URL, SERVICE_KEY) : null;
const BASE = "http://localhost:3210";

// A signature with attacker-appended trailing bytes that are (a) not valid hex, so
// Buffer.from(sig, "hex") stops decoding at the real 64-char digest, and (b) contain
// no colon, so the token still splits into the expected number of fields. Before the
// fix this decoded to the same 32-byte signature as the real token and passed;
// doubling a live cookie value reproduced the same class of bug over HTTP, but this
// form is deterministic instead of depending on base64 byte alignment.
function appendGarbageAfterSig(token: string): string {
  const decoded = Buffer.from(token, "base64url").toString("utf8");
  return Buffer.from(decoded + "zz", "utf8").toString("base64url");
}

test.describe("HMAC token strict length: trailing garbage after a valid signature", () => {
  test.skip(!process.env.HMAC_SECRET, "HMAC_SECRET not available in this environment");

  test("admin session token: genuinely valid token still verifies", () => {
    expect(verifyAdminSessionToken(createAdminSessionToken())).toBe(true);
  });

  test("admin session token: garbage appended after the signature is rejected", () => {
    expect(verifyAdminSessionToken(appendGarbageAfterSig(createAdminSessionToken()))).toBe(false);
  });

  test("user session token: genuinely valid token still verifies", () => {
    const tok = createUserSessionToken({ userId: "11111111-1111-1111-1111-111111111111", role: "player" });
    expect(verifyUserSessionToken(tok)).toEqual({ userId: "11111111-1111-1111-1111-111111111111", role: "player" });
  });

  test("user session token: garbage appended after the signature is rejected", () => {
    const tok = createUserSessionToken({ userId: "11111111-1111-1111-1111-111111111111", role: "player" });
    expect(verifyUserSessionToken(appendGarbageAfterSig(tok))).toBeNull();
  });

  test("game token (played link): garbage appended after the signature is rejected", () => {
    const tok = signGameToken("22222222-2222-2222-2222-222222222222", "yes");
    expect(verifyGameToken(tok)).toEqual({ tableId: "22222222-2222-2222-2222-222222222222", answer: "yes" });
    expect(verifyGameToken(appendGarbageAfterSig(tok))).toBeNull();
  });

  test("action token (claim/still-running links): garbage appended after the signature is rejected", () => {
    const tok = signActionToken("claim", "venue_listings|33333333-3333-3333-3333-333333333333");
    expect(verifyActionToken(tok)).toEqual({ action: "claim", subjectId: "venue_listings|33333333-3333-3333-3333-333333333333" });
    expect(verifyActionToken(appendGarbageAfterSig(tok))).toBeNull();
  });
});

test.describe("admin cookie: live tamper attempts over HTTP", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!ADMIN_PASSWORD, "ADMIN_PASSWORD not available in this environment");
  let admin: APIRequestContext;

  test.beforeAll(async () => {
    admin = await pwRequest.newContext({ baseURL: BASE });
    const login = await admin.post("/api/admin/login", { data: { password: ADMIN_PASSWORD } });
    if (!login.ok()) throw new Error("setup: admin login failed");
  });
  test.afterAll(async () => {
    await admin?.dispose();
  });

  test("no cookie, garbage cookie, and a truncated cookie all get 401", async ({ request }) => {
    expect((await request.get("/api/admin/data?tab=inquiries")).status()).toBe(401);
    expect((await request.get("/api/admin/data?tab=inquiries", { headers: { cookie: "fmg_admin=garbage" } })).status()).toBe(401);
  });

  test("a valid admin cookie doubled on itself no longer authenticates", async () => {
    const cookies = await admin.storageState();
    const adminCookie = cookies.cookies.find((c) => c.name === "fmg_admin");
    if (!adminCookie) throw new Error("setup: no fmg_admin cookie captured");
    const doubled = adminCookie.value + adminCookie.value;
    const ctx = await pwRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { cookie: `fmg_admin=${doubled}` } });
    const r = await ctx.get("/api/admin/data?tab=inquiries");
    expect(r.status()).toBe(401);
    await ctx.dispose();
  });

  test("the original valid admin session still works after the tamper attempt", async () => {
    const r = await admin.get("/api/admin/data?tab=inquiries");
    expect(r.status()).toBe(200);
  });
});

test.describe("enforcePublicName: PII cannot be smuggled through the account/player/cruise name field", () => {
  test("a raw email address is rejected, not stored verbatim", () => {
    expect(enforcePublicName("redteam-a@fmg-qa.test")).toBe("");
  });

  test("a raw phone number is rejected, not stored verbatim", () => {
    expect(enforcePublicName("702-555-0134")).toBe("");
  });

  test("a first name with a phone number tacked on the end is rejected", () => {
    // Before the fix, enforcePublicName only rewrites the surname when it has
    // letters; a numeric "surname" fell through and the whole string, phone
    // number included, was stored and later shown to co-invitees via firstNameOf.
    expect(enforcePublicName("Jane 702-555-0134")).toBe("");
  });

  test("a legitimate two-word name still abbreviates to first name + last initial", () => {
    expect(enforcePublicName("Jane Doe")).toBe("Jane D.");
  });

  test("a legitimate single first name still passes through", () => {
    expect(enforcePublicName("Jane")).toBe("Jane");
  });
});

test.describe("rate limiting: keys on the unspoofable x-real-ip on Vercel", () => {
  function fakeReq(headers: Record<string, string | null>): NextRequest {
    return { headers: { get: (name: string) => headers[name.toLowerCase()] ?? null } } as unknown as NextRequest;
  }

  test("prefers x-real-ip, which Vercel sets from the real connection", () => {
    // Even when a caller injects a fake x-forwarded-for, the unspoofable x-real-ip wins.
    expect(ipOf(fakeReq({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  test("a caller spoofing x-forwarded-for cannot change the key when x-real-ip is present", () => {
    const a = ipOf(fakeReq({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "9.9.9.9" }));
    const b = ipOf(fakeReq({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "6.6.6.6" }));
    expect(a).toBe(b);
    expect(a).toBe("203.0.113.7");
  });

  test("falls back to the first forwarded hop only when x-real-ip is absent", () => {
    expect(ipOf(fakeReq({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(ipOf(fakeReq({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
  });
});

test.describe("malformed input: a literal JSON null body never crashes a route", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!ADMIN_PASSWORD || !hasSupabase, "admin password or supabase service key not available in this environment");

  const QA_EMAIL = "qa-redteam-nullbody@fmg-qa.test";
  let admin: APIRequestContext;
  let user: APIRequestContext;
  let userId = "";

  test.beforeAll(async () => {
    admin = await pwRequest.newContext({ baseURL: BASE });
    const login = await admin.post("/api/admin/login", { data: { password: ADMIN_PASSWORD } });
    if (!login.ok()) throw new Error("setup: admin login failed");

    const signin = await admin.post("/api/auth/signin", { data: { email: QA_EMAIL, role: "player" } });
    const sj = await signin.json();
    const tokenHash = new URL(sj.confirmUrl).searchParams.get("token_hash");
    user = await pwRequest.newContext({ baseURL: BASE });
    const verify = await user.post("/api/auth/verify", { data: { token_hash: tokenHash, role: "player" } });
    if (!verify.ok()) throw new Error("setup: user verify failed");

    const { data: usersPage } = await service!.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = usersPage?.users.find((u) => u.email?.toLowerCase() === QA_EMAIL)?.id || "";
  });

  test.afterAll(async () => {
    if (service && userId) await service.auth.admin.deleteUser(userId).catch(() => {});
    await admin?.dispose();
    await user?.dispose();
  });

  const unauthedNullBodyRoutes = [
    "/api/notify-area",
    "/api/get-listed",
    "/api/lesson-inquiry",
    "/api/connect",
    "/api/validate-promo",
    "/api/advertise-submit",
  ];
  for (const route of unauthedNullBodyRoutes) {
    test(`POST ${route} with a null body returns a clean response, not a 500`, async ({ request }) => {
      const r = await request.post(route, { data: "null", headers: { "content-type": "application/json" } });
      expect(r.status(), await r.text()).toBeLessThan(500);
      await r.json(); // must be parseable JSON, not an empty crash body
    });
  }

  const authedNullBodyRoutes = ["/api/account", "/api/claims", "/api/match/consent", "/api/match/respond", "/api/safety/report", "/api/safety/block", "/api/provider/edit"];
  for (const route of authedNullBodyRoutes) {
    test(`POST ${route} (signed in) with a null body returns a clean 4xx, not a 500`, async () => {
      const r = await user.post(route, { data: "null", headers: { "content-type": "application/json" } });
      expect(r.status(), await r.text()).toBeLessThan(500);
      await r.json();
    });
  }

  test("POST /api/admin/update (signed in as admin) with a null body returns a clean 4xx, not a 500", async () => {
    const r = await admin.post("/api/admin/update", { data: "null", headers: { "content-type": "application/json" } });
    expect(r.status(), await r.text()).toBeLessThan(500);
    await r.json();
  });

  const syntacticallyInvalidJsonRoutes = ["/api/notify", "/api/advertise-inquiry"];
  for (const route of syntacticallyInvalidJsonRoutes) {
    test(`POST ${route} with syntactically invalid JSON returns a clean 4xx, not a 500`, async ({ request }) => {
      const r = await request.post(route, { data: "{not valid json", headers: { "content-type": "application/json" } });
      expect(r.status(), await r.text()).toBeLessThan(500);
      await r.json();
    });
  }
});
