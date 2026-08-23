import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readRevenueMetrics } from "../lib/billing/metrics";

// Billing ships dark: no Stripe account exists yet, so every test here must pass
// WITHOUT any Stripe key. They pin the safe-off behavior: clean 503 JSON, never a
// crash, never a false 200 on the webhook.

test.describe("billing dark launch", () => {
  test("checkout returns 503 JSON while payments are not enabled", async ({ request }) => {
    const res = await request.post("/api/billing/checkout", {
      data: { email: "qa@fmg-qa.test" },
    });
    expect(res.status()).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("Payments are not yet enabled");
  });

  test("webhook without secret or signature is rejected, never 200", async ({ request }) => {
    const res = await request.post("/api/billing/webhook", {
      data: { id: "evt_fake", type: "checkout.session.completed" },
    });
    // 503 when the webhook secret is not configured, 400 when it is configured but the
    // request carries no valid Stripe signature. Both are correct; 200 never is.
    expect([400, 503]).toContain(res.status());
    expect(res.status()).not.toBe(200);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test("webhook has no GET handler", async ({ request }) => {
    const res = await request.get("/api/billing/webhook");
    expect([404, 405]).toContain(res.status());
  });

  test("readRevenueMetrics reports unconfigured with zeroed metrics and no DB reads", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    // A supabase stand-in that throws on any use: proves the unconfigured path
    // returns before ever touching the database.
    const explodingSupabase = new Proxy(
      {},
      {
        get() {
          throw new Error("readRevenueMetrics must not query the DB when unconfigured");
        },
      }
    ) as SupabaseClient;
    const metrics = await readRevenueMetrics(explodingSupabase);
    expect(metrics).toEqual({
      configured: false,
      payingCustomers: 0,
      mrrCents: 0,
      arrCents: 0,
      failedPayments: 0,
      cancellations: 0,
    });
  });

  test("metrics source counts only real_external subscription rows", async () => {
    const source = readFileSync(join(__dirname, "..", "lib", "billing", "metrics.ts"), "utf8");
    expect(source).toMatch(/eq\(\s*["']record_class["']\s*,\s*["']real_external["']\s*\)/);
    expect(source).toContain("billing_subscriptions");
  });
});
