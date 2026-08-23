import { test, expect, request as pwRequest } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createUserSessionToken } from "../lib/user-auth";

// First-party analytics: /api/events ingestion, the ask-route server-side instrumentation,
// and the admin rollup. A few assertions here write directly to the shared production
// Supabase, so every row this suite creates is deleted immediately after the assertion that
// reads it. Every profile this suite provisions is record_class 'test'; the one
// record_class 'real_external' row the split test needs is inserted and deleted in the same
// breath, never left behind.

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
// createUserSessionToken signs with this; the dev server loads it from .env.local itself,
// this process does not, so it is set here for the token this suite mints to verify.
if (env.HMAC_SECRET && !process.env.HMAC_SECRET) process.env.HMAC_SECRET = env.HMAC_SECRET;

function serviceClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

// A real, verifiable fmg_user session for a fresh QA-domain auth user whose profile is
// record_class 'test', so hitting the live route under test lands only rows this suite is
// allowed to create. Returns null when the environment cannot provision one, in which case
// the calling test skips instead of guessing at a token.
async function qaUserCookie(supabase: SupabaseClient): Promise<{ cookie: string; userId: string } | null> {
  const email = `analytics-test-${crypto.randomUUID()}@fmg-qa.test`;
  const { data, error } = await supabase.auth.admin.createUser({ email, email_confirm: true });
  if (error || !data?.user) return null;
  const userId = data.user.id;
  const { error: profileErr } = await supabase.from("profiles").upsert({ id: userId, role: "player", record_class: "test" });
  if (profileErr) return null;
  const token = createUserSessionToken({ userId, role: "player" });
  return { cookie: `fmg_user=${token}`, userId };
}

async function cleanupQaUser(supabase: SupabaseClient, userId: string) {
  await supabase.from("profiles").delete().eq("id", userId);
  await supabase.auth.admin.deleteUser(userId).catch(() => {});
}

// track() is fire-and-forget by design (lib/analytics/events.ts), so the route's 200
// response can land before the insert commits. A short poll, not a fixed sleep, closes
// that real race without slowing the common case where the row is already there.
async function waitForEventRow(
  supabase: SupabaseClient,
  sessionKey: string
): Promise<{ props: Record<string, unknown>; record_class: string } | null> {
  for (let attempt = 0; attempt < 15; attempt++) {
    const { data } = await supabase
      .from("analytics_events")
      .select("props, record_class")
      .eq("session_key", sessionKey)
      .maybeSingle();
    if (data) return data;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}

test.describe("events ingestion", () => {
  test("an unknown event name gets 200 {ok:true} and inserts nothing", async ({ request }) => {
    const supabase = serviceClient();
    test.skip(!supabase, "Supabase service credentials not available in this environment");

    const bogusName = `not_a_real_event_${crypto.randomUUID()}`;
    const res = await request.post("/api/events", { data: { name: bogusName } });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const { count } = await supabase!
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("name", bogusName);
    expect(count ?? 0).toBe(0);
  });

  test("forbidden prop keys never reach storage", async ({ baseURL }) => {
    const supabase = serviceClient();
    test.skip(!supabase, "Supabase service credentials not available in this environment");
    test.skip(!process.env.HMAC_SECRET, "HMAC_SECRET not available in this environment");

    const qa = await qaUserCookie(supabase!);
    test.skip(!qa, "could not provision a QA session for this test");

    const ctx = await pwRequest.newContext({
      baseURL: baseURL || "http://localhost:3000",
      extraHTTPHeaders: { cookie: qa!.cookie },
    });
    const sessionKey = `analytics-test-${crypto.randomUUID()}`;
    try {
      const res = await ctx.post("/api/events", {
        data: {
          name: "listing_viewed",
          sessionKey,
          props: { kind: "teacher", q: "should never be stored", email: "someone@example.com", extra: "ok" },
        },
      });
      expect(res.status()).toBe(200);

      const data = await waitForEventRow(supabase!, sessionKey);
      expect(data).toBeTruthy();
      expect(data!.record_class).toBe("test");
      expect(data!.props).not.toHaveProperty("q");
      expect(data!.props).not.toHaveProperty("email");
      expect(data!.props.kind).toBe("teacher");
      expect(data!.props.extra).toBe("ok");
    } finally {
      await supabase!.from("analytics_events").delete().eq("session_key", sessionKey);
      await cleanupQaUser(supabase!, qa!.userId);
      await ctx.dispose();
    }
  });

  test("source pin: the events route rate limits before it ever writes", () => {
    const source = fs.readFileSync(path.join(__dirname, "..", "app", "api", "events", "route.ts"), "utf8");
    expect(source).toMatch(/rateLimit\(req,\s*"events",\s*60,\s*60\)/);
  });
});

test.describe("ask instrumentation", () => {
  test("source pins: every ask outcome track name is wired in the route", () => {
    const source = fs.readFileSync(path.join(__dirname, "..", "app", "api", "ask", "route.ts"), "utf8");
    expect(source).toMatch(/"ask_submitted"/);
    expect(source).toMatch(/"ask_intent_directory"/);
    expect(source).toMatch(/"ask_intent_rules"/);
    expect(source).toMatch(/"ask_intent_mixed"/);
    expect(source).toMatch(/"ask_unverified"/);
    expect(source).toMatch(/trackAskOutcome\(/);
  });
});

test.describe("admin analytics", () => {
  test("refuses an unauthenticated request", async ({ request }) => {
    const res = await request.get("/api/admin/analytics");
    expect(res.status()).toBe(401);
  });

  test("splits real and test events into separate buckets", async ({ baseURL }) => {
    const supabase = serviceClient();
    test.skip(!supabase, "Supabase service credentials not available in this environment");
    test.skip(!ADMIN_PASSWORD, "ADMIN_PASSWORD not available in this environment");

    const testRowKey = `analytics-test-class-test-${crypto.randomUUID()}`;
    const realRowKey = `analytics-test-class-real-${crypto.randomUUID()}`;

    const { error: insertErr } = await supabase!.from("analytics_events").insert([
      { name: "listing_viewed", props: { kind: "teacher" }, session_key: testRowKey, record_class: "test" },
      { name: "listing_viewed", props: { kind: "teacher" }, session_key: realRowKey, record_class: "real_external" },
    ]);
    expect(insertErr).toBeFalsy();

    const admin = await pwRequest.newContext({ baseURL: baseURL || "http://localhost:3000" });
    try {
      const login = await admin.post("/api/admin/login", { data: { password: ADMIN_PASSWORD } });
      expect(login.ok()).toBeTruthy();

      const res = await admin.get("/api/admin/analytics");
      expect(res.ok()).toBeTruthy();
      const body = await res.json();

      expect(body.windows["7d"].real.eventCounts.listing_viewed).toBeGreaterThanOrEqual(1);
      expect(body.windows["7d"].test.eventCounts.listing_viewed).toBeGreaterThanOrEqual(1);
      expect(body.windows["30d"].real.eventCounts.listing_viewed).toBeGreaterThanOrEqual(1);
      expect(body.windows["30d"].test.eventCounts.listing_viewed).toBeGreaterThanOrEqual(1);
      expect(body.dataHealth.totalEvents).toBeGreaterThanOrEqual(2);
      expect(body.dataHealth.oldestEventAt).toBeTruthy();
      expect(body.dataHealth.newestEventAt).toBeTruthy();
    } finally {
      await supabase!.from("analytics_events").delete().in("session_key", [testRowKey, realRowKey]);
      await admin.dispose();
    }
  });
});
