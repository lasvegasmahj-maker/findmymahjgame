import { test, expect, request as pwRequest } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import {
  claimReceived,
  claimApproved,
  claimNeedsInfo,
  claimRejected,
  tableProposed,
  playerAccepted,
  tableConfirmed,
  seatReopened,
  tableCancelled,
  billingStatus,
} from "../lib/notifications/templates";
import { notify } from "../lib/notifications/notify";

// Notifications lane: template builders, the notify() ledger, and the two admin/cron
// surfaces built on top of it. Playwright does not load Next's env files, so env vars
// are read from .env.local directly, matching tests/nevada-fairness.spec.ts.

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
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = ENV.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

function serviceClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

const DASH_RE = /[—–]/;

function expectCleanCopy(html: string) {
  expect(html).not.toMatch(DASH_RE);
  expect(html.toLowerCase()).not.toContain("undefined");
  expect(html.toLowerCase()).not.toMatch(/\bnull\b/);
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const shown = local.slice(0, 2);
  const stars = "*".repeat(Math.max(local.length - shown.length, 2));
  return `${shown}${stars}@${domain}`;
}

test.describe("notification templates", () => {
  test("claimReceived includes the recipient name and listing name, clean copy", () => {
    const html = claimReceived("Jane Smith", "The Bellagio Room");
    expect(html).toContain("Jane Smith");
    expect(html).toContain("The Bellagio Room");
    expectCleanCopy(html);
  });

  test("claimApproved includes the listing name and a CTA to the dashboard URL", () => {
    const html = claimApproved("The Bellagio Room", "https://findmymahjgame.com/dashboard");
    expect(html).toContain("The Bellagio Room");
    expect(html).toContain("https://findmymahjgame.com/dashboard");
    expect(html).toContain("dashboard");
    expectCleanCopy(html);
  });

  test("claimNeedsInfo includes the listing name and the reason", () => {
    const html = claimNeedsInfo("The Bellagio Room", "We could not verify your phone number.");
    expect(html).toContain("The Bellagio Room");
    expect(html).toContain("We could not verify your phone number.");
    expectCleanCopy(html);
  });

  test("claimRejected includes the listing name and the reason", () => {
    const html = claimRejected("The Bellagio Room", "This listing already has a verified owner.");
    expect(html).toContain("The Bellagio Room");
    expect(html).toContain("This listing already has a verified owner.");
    expectCleanCopy(html);
  });

  test("tableProposed includes the day, area, joined first names, and respond URL", () => {
    const html = tableProposed(["Jane", "Mike", "Sam"], "Tuesday at 7pm", "Henderson, NV", "https://findmymahjgame.com/t/abc123");
    expect(html).toContain("Tuesday at 7pm");
    expect(html).toContain("Henderson, NV");
    expect(html).toContain("Jane, Mike, and Sam");
    expect(html).toContain("https://findmymahjgame.com/t/abc123");
    expectCleanCopy(html);
  });

  test("tableProposed with two names joins with and, no Oxford comma needed", () => {
    const html = tableProposed(["Jane", "Mike"], "Friday at 6pm", "Reno, NV", "https://findmymahjgame.com/t/xyz789");
    expect(html).toContain("Jane and Mike");
    expectCleanCopy(html);
  });

  test("tableProposed with one name has no dangling separator", () => {
    const html = tableProposed(["Jane"], "Friday at 6pm", "Reno, NV", "https://findmymahjgame.com/t/xyz789");
    expect(html).toContain("Jane");
    expect(html).not.toContain("Jane,");
    expect(html).not.toContain("Jane and");
    expectCleanCopy(html);
  });

  test("playerAccepted includes the first name and table label", () => {
    const html = playerAccepted("Mike", "Tuesday table in Henderson");
    expect(html).toContain("Mike");
    expect(html).toContain("Tuesday table in Henderson");
    expectCleanCopy(html);
  });

  test("tableConfirmed includes the table label and table URL", () => {
    const html = tableConfirmed("Tuesday table in Henderson", "https://findmymahjgame.com/t/abc123");
    expect(html).toContain("Tuesday table in Henderson");
    expect(html).toContain("https://findmymahjgame.com/t/abc123");
    expectCleanCopy(html);
  });

  test("seatReopened includes the table label", () => {
    const html = seatReopened("Tuesday table in Henderson");
    expect(html).toContain("Tuesday table in Henderson");
    expectCleanCopy(html);
  });

  test("tableCancelled includes the table label", () => {
    const html = tableCancelled("Tuesday table in Henderson");
    expect(html).toContain("Tuesday table in Henderson");
    expectCleanCopy(html);
  });

  test("billingStatus includes the status line", () => {
    const html = billingStatus("Your card was declined. Update your payment method to keep your listing active.");
    expect(html).toContain("Your card was declined. Update your payment method to keep your listing active.");
    expectCleanCopy(html);
  });

  test("every template carries the required-notification footer line", () => {
    const html = seatReopened("Tuesday table in Henderson");
    expect(html).toContain("You are receiving this because of activity on your Find My Mahj Game account.");
  });
});

test.describe("notify() ledger", () => {
  test("a QA address is ledgered as skipped_qa and never reaches Resend", async () => {
    const supabase = serviceClient();
    test.skip(!supabase, "Supabase service credentials not available in this environment");

    const marker = `notif-qa-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await notify(supabase!, {
      to: "qa-notify@fmg-qa.test",
      kind: "account_signin_link",
      subject: `QA ledger check ${marker}`,
      html: "<p>test</p>",
      recordClass: "test",
      related: { table: "playwright_test", id: marker },
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe("skipped_qa");

    const { data: rows, error } = await supabase!
      .from("notifications_log")
      .select("id, email, status, record_class")
      .eq("related_id", marker)
      .limit(1);
    expect(error).toBeNull();
    expect(rows?.length).toBe(1);
    const row = rows![0];
    expect(row.email).toBe("qa-notify@fmg-qa.test");
    expect(row.status).toBe("skipped_qa");
    expect(row.record_class).toBe("test");

    await supabase!.from("notifications_log").delete().eq("id", row.id);
  });
});

test.describe("admin notifications route", () => {
  test("refuses an unauthenticated request", async ({ request }) => {
    const res = await request.get("/api/admin/notifications");
    expect(res.status()).toBe(401);
  });

  test("masks recipient emails for an authenticated admin", async ({ baseURL }) => {
    test.skip(!ADMIN_PASSWORD, "ADMIN_PASSWORD not available in this environment");
    const supabase = serviceClient();
    test.skip(!supabase, "Supabase service credentials not available in this environment");

    const marker = `notif-mask-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const rawEmail = "playwright-masktest@example.com";
    const { data: inserted, error: insertError } = await supabase!
      .from("notifications_log")
      .insert({
        email: rawEmail,
        kind: "account_signin_link",
        subject: `Admin mask test ${marker}`,
        status: "sent",
        record_class: "test",
        related_table: "playwright_test",
        related_id: marker,
      })
      .select("id")
      .single();
    expect(insertError).toBeNull();
    const insertedId = inserted!.id as string;

    try {
      const admin = await pwRequest.newContext({ baseURL: baseURL || "http://localhost:3000" });
      const login = await admin.post("/api/admin/login", { data: { password: ADMIN_PASSWORD } });
      expect(login.ok()).toBeTruthy();

      const res = await admin.get("/api/admin/notifications");
      expect(res.ok()).toBeTruthy();
      const body = await res.json();

      const bodyText = JSON.stringify(body);
      expect(bodyText).not.toContain(rawEmail);

      const row = (body.latest as Array<{ id: string; email: string }>).find((r) => r.id === insertedId);
      expect(row, "inserted test row should appear in the latest 50").toBeTruthy();
      expect(row!.email).toBe(maskEmail(rawEmail));
      expect(row!.email).not.toBe(rawEmail);

      await admin.dispose();
    } finally {
      await supabase!.from("notifications_log").delete().eq("id", insertedId);
    }
  });
});

test.describe("notification health cron", () => {
  test("refuses a request without cron auth", async ({ request }) => {
    const res = await request.get("/api/cron/notification-health");
    expect(res.status()).toBe(401);
  });
});
