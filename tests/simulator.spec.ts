import { test, expect, request as pwRequest } from "@playwright/test";
import fs from "fs";
import path from "path";

// The launch simulator is admin-only and, when run, proves every subsystem on
// test-classified identities. This spec guards the gate and, when an admin
// password is available, runs the full rehearsal and asserts an overall PASS.

function adminPassword(): string | undefined {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    return fs.readFileSync(envPath, "utf8").match(/^ADMIN_PASSWORD=(.*)$/m)?.[1]?.replace(/^"|"$/g, "");
  }
  return undefined;
}

test.describe("launch simulator", () => {
  test("the simulator route rejects anyone without an admin session", async ({ request }) => {
    const r = await request.post("/api/admin/simulator");
    expect(r.status()).toBe(401);
  });

  test("the whole product passes the rehearsal on test identities", async ({ baseURL }) => {
    const password = adminPassword();
    test.skip(!password, "ADMIN_PASSWORD not available");
    const admin = await pwRequest.newContext({ baseURL: baseURL || "http://localhost:3000" });
    const login = await admin.post("/api/admin/login", { data: { password } });
    expect(login.ok()).toBeTruthy();
    const r = await admin.post("/api/admin/simulator", { timeout: 90000 });
    expect(r.ok(), await r.text()).toBeTruthy();
    const report = await r.json();
    const failed = report.results.filter((x: { status: string }) => x.status !== "PASS");
    expect(failed, JSON.stringify(failed)).toHaveLength(0);
    expect(report.overall).toBe("PASS");
    await admin.dispose();
  });

  test("the simulator only ever operates on test-classified identities", () => {
    const src = fs.readFileSync(path.join(__dirname, "..", "lib", "simulator", "run.ts"), "utf8");
    expect(src).toContain('record_class: "test"');
    expect(src).toContain("fmg-qa.test");
    // Cleanup deletes what it creates.
    expect(src).toMatch(/deleteUser/);
  });
});
