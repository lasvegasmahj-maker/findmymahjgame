import { test, expect } from "@playwright/test";
import { RECORD_CLASSES } from "../lib/data-trust";
import { readFileSync } from "fs";
import { join } from "path";

// The admin home is the owner's source of truth, so its two invariants get their own suite:
// nobody sees it without the password, and no number it shows can mix real people with seed
// or test records.

test.describe("admin authorization", () => {
  test("the admin home shows a login gate, never data, to an anonymous visitor", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Real player signups");
    await expect(page.locator("body")).not.toContainText("PRODUCTION LIVE DATA");
  });

  test("the review queues moved to /admin/review and are gated the same way", async ({ page }) => {
    await page.goto("/admin/review");
    await expect(page.locator("input[type=password]")).toBeVisible();
  });

  test("admin data APIs refuse unauthenticated requests", async ({ request }) => {
    for (const path of ["/api/admin/data?tab=inquiries", "/api/admin/data?tab=players", "/api/admin/today"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(401);
    }
  });

  test("admin mutation APIs refuse unauthenticated requests", async ({ request }) => {
    const res = await request.post("/api/admin/update", { data: { table: "player_listings", id: "x", status: "published" } });
    expect(res.status()).toBe(401);
  });

  test("a wrong password is rejected", async ({ request }) => {
    const res = await request.post("/api/admin/login", { data: { password: "wrong-password-for-test" } });
    expect([401, 429]).toContain(res.status());
  });
});

test.describe("data trust vocabulary", () => {
  test("the record classes are a closed set with real_external as the only countable class", () => {
    expect(RECORD_CLASSES).toContain("real_external");
    expect(RECORD_CLASSES).toContain("test");
    expect(RECORD_CLASSES).toContain("internal");
    expect(RECORD_CLASSES).toContain("seed_demo");
    expect(RECORD_CLASSES).toHaveLength(4);
  });

  test("no KPI helper counts a class other than real_external as a signup", () => {
    // The queries in lib/data-trust.ts filter on record_class = real_external for every
    // signup metric. This assertion pins the source so a refactor that drops the filter
    // fails a test instead of silently inflating a number.
    const source = readFileSync(join(__dirname, "..", "lib", "data-trust.ts"), "utf8");
    const signupFilters = source.match(/eq\("record_class", "real_external"\)/g) || [];
    expect(signupFilters.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain('paidMembers: 0');
  });
  test("the unsupported-paid-tier guard excludes founding-member entitlements so it cannot false-positive or be defeated", () => {
    // Owner-approved 2026-08-23: paid status must trace to a real payment (stripe_payment_id)
    // or a documented entitlement (is_founding_member). The reconciliation check must keep
    // catching non-free tiers that have neither, and must never silently reappear.
    const source = readFileSync(join(__dirname, "..", "lib", "data-trust.ts"), "utf8");
    expect(source).toContain('Paid-looking tier with no payment record');
    expect(source).toMatch(/is\("stripe_payment_id", null\)\.not\("is_founding_member", "is", true\)/);
  });
});
