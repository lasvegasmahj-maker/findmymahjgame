import { test, expect, request as pwRequest } from "@playwright/test";
import fs from "fs";
import path from "path";

// Identity platform: passwordless sign in behind the launch_public_signup gate,
// with a QA path that requires an admin session and lands as record_class test.
// The gate is OFF in production, so these tests prove the closed behavior plus
// the full QA walkthrough that launch-day verification will reuse.


test.describe("identity", () => {
  test("real email cannot sign in while the gate is closed", async ({ request }) => {
    const r = await request.post("/api/auth/signin", { data: { email: "someone@example.com" } });
    expect(r.status()).toBe(403);
    const j = await r.json();
    expect(String(j.error)).toContain("not open yet");
  });

  test("QA email without an admin session is refused", async ({ request }) => {
    const r = await request.post("/api/auth/signin", { data: { email: "anyone@fmg-qa.test" } });
    expect(r.status()).toBe(403);
  });

  test("me and account endpoints require a session", async ({ request }) => {
    expect((await request.get("/api/auth/me")).status()).toBe(401);
    expect((await request.post("/api/account", { data: { action: "deactivate" } })).status()).toBe(401);
  });

  test("a garbage session cookie is rejected", async ({ baseURL }) => {
    const ctx = await pwRequest.newContext({
      baseURL: baseURL || "http://localhost:3000",
      extraHTTPHeaders: { cookie: "fmg_user=Zm9yZ2VkOnRva2VuOnZhbHVl" },
    });
    expect((await ctx.get("/api/auth/me")).status()).toBe(401);
    await ctx.dispose();
  });

  test("a user cookie never grants admin access", async ({ baseURL }) => {
    const ctx = await pwRequest.newContext({
      baseURL: baseURL || "http://localhost:3000",
      extraHTTPHeaders: { cookie: "fmg_user=Zm9yZ2VkOnRva2VuOnZhbHVl" },
    });
    expect((await ctx.get("/api/admin/data?tab=players")).status()).toBe(401);
    await ctx.dispose();
  });

  test("verify rejects a garbage token", async ({ request }) => {
    const r = await request.post("/api/auth/verify", { data: { token_hash: "not-a-real-token" } });
    expect(r.status()).toBe(400);
    const j = await r.json();
    expect(String(j.error)).toContain("expired or was already used");
  });

  test("signed-out account page tells the truth while the gate is closed", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByText("Accounts are not open yet.")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeHidden();
  });

  test("full QA walkthrough: admin-driven signin lands as a test account", async ({ baseURL }, testInfo) => {
    // The dev server loads .env.local itself; the test process does not, so read
    // the value here. It stays in memory and is never logged. CI has no .env.local,
    // so a missing file falls through to skip instead of crashing.
    let password = process.env.ADMIN_PASSWORD;
    const envPath = path.join(__dirname, "..", ".env.local");
    if (!password && fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, "utf8");
      password = envFile.match(/^ADMIN_PASSWORD=(.*)$/m)?.[1]?.replace(/^"|"$/g, "");
    }
    test.skip(!password, "ADMIN_PASSWORD not available in this environment");

    // Per-project identity: parallel projects each get their own QA user so two
    // concurrent generateLink calls never invalidate each other's token.
    const QA_EMAIL = `playwright-qa-${testInfo.project.name.replace(/[^a-z0-9-]/gi, "-")}@fmg-qa.test`;

    const admin = await pwRequest.newContext({ baseURL: baseURL || "http://localhost:3000" });
    const login = await admin.post("/api/admin/login", { data: { password } });
    expect(login.ok()).toBeTruthy();

    const signin = await admin.post("/api/auth/signin", { data: { email: QA_EMAIL, role: "player" } });
    expect(signin.ok()).toBeTruthy();
    const sj = await signin.json();
    expect(sj.qa).toBe(true);
    expect(String(sj.confirmUrl)).toContain("/auth/confirm?token_hash=");

    const tokenHash = new URL(sj.confirmUrl).searchParams.get("token_hash");
    expect(tokenHash).toBeTruthy();

    const verify = await admin.post("/api/auth/verify", { data: { token_hash: tokenHash, role: "player" } });
    expect(verify.ok()).toBeTruthy();

    const me = await admin.get("/api/auth/me");
    expect(me.ok()).toBeTruthy();
    const mj = await me.json();
    expect(mj.qa).toBe(true);
    expect(mj.role).toBe("player");
    await admin.dispose();
  });

  test("source pins: the gate, QA rules, and classification are wired", () => {
    const signin = fs.readFileSync(path.join(__dirname, "..", "app", "api", "auth", "signin", "route.ts"), "utf8");
    expect(signin).toMatch(/isLaunched\(supabase, "publicSignup"\)/);
    expect(signin).toMatch(/isQaEmail\(email\)/);
    expect(signin).toMatch(/verifyAdminSessionToken/);

    const verify = fs.readFileSync(path.join(__dirname, "..", "app", "api", "auth", "verify", "route.ts"), "utf8");
    expect(verify).toMatch(/isQaEmail\(user.email\) \? "test" : "real_external"/);
  });
});
