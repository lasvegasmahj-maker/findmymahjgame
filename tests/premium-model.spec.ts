import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { trialUntilFrom, isPremiumActive, PREMIUM_TRIAL_DAYS } from "../lib/premium";

// Pins the owner-approved provider business model (2026-08-23): Basic is free
// forever and publicly listed with neutral placement; Premium ($89/year) buys the
// structured lesson inquiry, never ranking and never verification; the 90-day
// founding trial starts at claim with no card and auto-reverts to Basic; the old
// 6-month code and 12-month coupon are retired; the founder is not copied on
// routine leads. Source pins fail the build if any of that quietly regresses.

function srcOf(...parts: string[]): string {
  return fs.readFileSync(path.join(__dirname, "..", ...parts), "utf8");
}

test.describe("trial entitlement math", () => {
  test("trial expires exactly 90 days after the qualifying claim, timezone-independent", () => {
    expect(PREMIUM_TRIAL_DAYS).toBe(90);
    const until = trialUntilFrom("2026-08-23T15:30:00.000Z");
    expect(until).toBe("2026-11-21T15:30:00.000Z");
  });

  test("entitlement is active strictly before the expiry instant and not after", () => {
    const until = "2026-11-21T15:30:00.000Z";
    const t = new Date(until).getTime();
    expect(isPremiumActive(until, t - 1)).toBe(true);
    expect(isPremiumActive(until, t)).toBe(false);
    expect(isPremiumActive(until, t + 1)).toBe(false);
  });

  test("no entitlement date means Basic, and garbage never grants Premium", () => {
    expect(isPremiumActive(null)).toBe(false);
    expect(isPremiumActive(undefined)).toBe(false);
    expect(isPremiumActive("not-a-date")).toBe(false);
    expect(isPremiumActive("")).toBe(false);
  });

  test("an expired entitlement reverts to Basic with no other state change needed", () => {
    expect(isPremiumActive(trialUntilFrom("2020-01-01T00:00:00.000Z"))).toBe(false);
  });
});

test.describe("claim starts the trial, payment is never faked", () => {
  test("every ownership-granting claim path sets the 90-day trial idempotently", () => {
    // Every route starts the trial in a separate write guarded on premium_until
    // being null: the trial starts once per listing, ever. Neither a re-claim nor
    // an ownership transfer can restart it, and granting ownership can never
    // overwrite an existing entitlement (such as a paid period already stamped
    // by the billing webhook).
    for (const route of [
      ["app", "api", "claims", "route.ts"],
      ["app", "api", "claim", "route.ts"],
      ["app", "api", "admin", "claims", "route.ts"],
    ]) {
      const source = srcOf(...route);
      expect(source, route.join("/")).toContain("trialUntilFrom");
      expect(source, route.join("/")).toContain('.is("premium_until", null)');
    }
  });

  test("no claim path touches Stripe or writes a payment record", () => {
    for (const route of [
      ["app", "api", "claims", "route.ts"],
      ["app", "api", "admin", "claims", "route.ts"],
      ["app", "api", "claim", "route.ts"],
    ]) {
      const source = srcOf(...route);
      expect(source, route.join("/")).not.toMatch(/stripe/i);
      expect(source, route.join("/")).not.toContain("billing_subscriptions");
    }
  });

  test("paid Premium survives trial expiration: the webhook moves premium_until to the paid period end", () => {
    const source = srcOf("app", "api", "billing", "webhook", "route.ts");
    expect(source).toContain("syncListingEntitlement");
    expect(source).toContain("premium_until: periodEnd");
    expect(source).toContain("stripe_payment_id: sub.id");
    expect(source).toMatch(/sub\.status !== "active"/);
  });

  test("the app-managed trial never creates a Stripe subscription", () => {
    const premium = srcOf("lib", "premium.ts");
    expect(premium).not.toMatch(/import[^\n]*stripe/i);
    expect(premium).not.toMatch(/stripe\./);
    expect(premium).not.toContain("subscriptions.create");
  });
});

test.describe("verification is never bought", () => {
  test("the Verified badge comes from a completed claim, never from tier or payment", () => {
    const card = srcOf("components", "teacher-card.tsx");
    expect(card).toContain("const verified = Boolean(t.verified)");
    expect(card).not.toMatch(/verified\s*=.*tier/);
  });

  test("the owner's auth UUID never crosses to the client: pages derive a boolean", () => {
    const card = srcOf("components", "teacher-card.tsx");
    expect(card).not.toContain("account_id");
    for (const page of [
      ["app", "teachers", "page.tsx"],
      ["app", "states", "[state]", "page.tsx"],
    ]) {
      const source = srcOf(...page);
      expect(source, page.join("/")).toContain("verified: Boolean(account_id)");
    }
  });

  test("Premium is a commercial badge, distinct from every trust badge", () => {
    const badges = srcOf("components", "status-badge.tsx");
    expect(badges).toContain('"Premium Provider"');
    for (const trust of ["verified", "leader", "advisor"]) {
      expect(badges).toContain(`${trust}:`);
    }
  });

  test("the paid tier label carries no verification or community-leadership claim", () => {
    const tiers = srcOf("lib", "tiers.ts");
    expect(tiers).toContain('pro: "Premium Provider"');
    expect(tiers).not.toContain('pro: "Verified');
  });
});

test.describe("Basic is listed, contactable, and neutrally ranked", () => {
  test("public teacher queries never filter or order by premium or tier", () => {
    for (const page of [
      ["app", "teachers", "page.tsx"],
      ["app", "states", "[state]", "page.tsx"],
    ]) {
      const source = srcOf(...page);
      expect(source, page.join("/")).not.toMatch(/\.order\([^)]*(premium|tier)/);
      expect(source, page.join("/")).not.toMatch(/\.(eq|gt|gte|not)\(\s*"(premium_until|tier)"/);
    }
  });

  test("external contact paths on the card do not require Premium", () => {
    const card = srcOf("components", "teacher-card.tsx");
    expect(card).toMatch(/\{\(premium \|\| site\) &&/);
    expect(card).not.toMatch(/premium && site &&/);
  });

  test("the structured inquiry renders only with an active entitlement", () => {
    const card = srcOf("components", "teacher-card.tsx");
    expect(card).toMatch(/\{premium && \(?\s*<LessonInquiry/);
  });

  test("Ask reads no premium or tier signal", () => {
    const askDir = path.join(__dirname, "..", "app", "api", "ask");
    const files = fs.readdirSync(askDir, { recursive: true }) as string[];
    for (const f of files) {
      const full = path.join(askDir, f);
      if (!fs.statSync(full).isFile()) continue;
      const source = fs.readFileSync(full, "utf8");
      expect(source, `app/api/ask/${f}`).not.toMatch(/premium_until|"tier"|\.tier\b/);
    }
  });
});

test.describe("the structured inquiry API", () => {
  test("refuses a non-premium listing with a helpful redirect to external contact", () => {
    const source = srcOf("app", "api", "lesson-inquiry", "route.ts");
    expect(source).toContain("isPremiumActive");
    expect(source).toContain("status: 403");
  });

  test("the founder is not copied on routine leads", () => {
    const source = srcOf("app", "api", "lesson-inquiry", "route.ts");
    expect(source).not.toMatch(/bcc/i);
    expect(source).not.toContain("hello@findmymahjgame.com");
  });

  test("stores delivery metadata only: no message content, no player identity", () => {
    const source = srcOf("app", "api", "lesson-inquiry", "route.ts");
    const insertMatch = source.match(/provider_leads"\)\.insert\(\{([\s\S]*?)\}\)/);
    expect(insertMatch).toBeTruthy();
    const inserted = insertMatch![1];
    expect(inserted).toContain("provider_table");
    expect(inserted).toContain("record_class");
    for (const pii of ["name", "email", "phone", "message"]) {
      expect(inserted, `provider_leads insert must not store ${pii}`).not.toMatch(new RegExp(`\\b${pii}\\b`));
    }
  });

  test("QA and founder-demo traffic is classified test, keeping the diagnostic honest", () => {
    const source = srcOf("app", "api", "lesson-inquiry", "route.ts");
    expect(source).toContain("hostRecordClass");
    expect(source).toContain('"real_external"');
  });

  test("rejects an unknown teacher over the live API", async ({ request }) => {
    const res = await request.post("/api/lesson-inquiry", {
      data: { teacherId: "00000000-0000-4000-8000-000000000000", name: "QA", email: "qa@fmg-qa.test", message: "hi" },
    });
    expect([403, 422]).toContain(res.status());
  });
});

test.describe("old offers are retired", () => {
  test("FINDMYMAHJGAME no longer validates", async ({ request }) => {
    const res = await request.post("/api/validate-promo", { data: { code: "FINDMYMAHJGAME" } });
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.valid).not.toBe(true);
    } else {
      expect([400, 404, 410, 422]).toContain(res.status());
    }
  });

  test("no public page or API still offers the 6-month code", () => {
    const roots = ["app", "components", "lib"];
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) {
          const source = fs.readFileSync(full, "utf8");
          if (source.includes("FINDMYMAHJGAME") && !/retired|superseded/i.test(source)) offenders.push(full);
        }
      }
    };
    for (const r of roots) walk(path.join(__dirname, "..", r));
    expect(offenders).toEqual([]);
  });

  test("checkout takes no promotion codes: the 12-month coupon path is closed", () => {
    const source = srcOf("app", "api", "billing", "checkout", "route.ts");
    expect(source).toContain("allow_promotion_codes: false");
  });

  test("checkout identity is the session, never the request body", () => {
    // The payer and the listing their payment extends are both derived
    // server-side from the signed-in session. The request body is never read,
    // so a crafted request cannot bind a subscription to someone else's
    // listing or spoof another payer's email.
    const source = srcOf("app", "api", "billing", "checkout", "route.ts");
    expect(source).toContain("verifyUserSessionToken");
    expect(source).toContain('.eq("account_id", session.userId)');
    expect(source).toContain("auth.admin.getUserById(session.userId)");
    expect(source).not.toContain("req.json");
    expect(source).not.toContain("b?.");
    expect(source).toContain("canUseDarkFeature");
  });

  test("checkout fails closed when the owned listing is missing or ambiguous", () => {
    const source = srcOf("app", "api", "billing", "checkout", "route.ts");
    expect(source).toContain("Claim your listing first");
    expect(source).toContain("more than one listing");
    const refusals = source.match(/status: 409/g) || [];
    expect(refusals.length).toBe(2);
  });

  test("checkout binds the subscription to the payer's own teacher listing", () => {
    const source = srcOf("app", "api", "billing", "checkout", "route.ts");
    expect(source).toContain('subscription_data: { metadata: { listing_table: "venue_listings", listing_id: listingId } }');
  });

  test("the dashboard Premium button ships dark behind billing configuration", () => {
    const source = srcOf("app", "provider", "provider-client.tsx");
    expect(source).toContain("dash?.billing.configured");
    expect(source).toContain("Choose Premium: $89/year");
    const api = srcOf("app", "api", "provider", "route.ts");
    expect(api).toContain("premium_until");
  });

  test("live API: checkout stays dark right now", async ({ request }) => {
    const res = await request.post("/api/billing/checkout");
    expect(res.status()).toBe(503);
  });

  test("an unreconciled paid subscription surfaces as a data-quality issue", () => {
    const source = srcOf("lib", "data-trust.ts");
    expect(source).toContain("Active paid subscription not linked to any listing");
    expect(source).toMatch(/billing_subscriptions[\s\S]{0,200}eq\("status", "active"\)/);
  });

  test("the billing runbook no longer instructs creating the coupon", () => {
    const runbook = srcOf("docs", "billing-launch-runbook.md");
    expect(runbook).not.toMatch(/create the FINDMYMAHJGAME promo code/i);
    expect(runbook).toContain("$89");
  });
});

test.describe("public copy tells the approved model", () => {
  test("join sells Basic free forever and Premium as conversion, with no placement promise", async ({ page }) => {
    await page.goto("/join");
    const body = await page.textContent("body");
    expect(body).toContain("Free forever");
    expect(body).toContain("$89");
    expect(body).not.toMatch(/higher placement/i);
    expect(body).not.toContain("FINDMYMAHJGAME");
    expect(body).not.toMatch(/6 months free/i);
  });

  test("get-listed no longer collects a promo code", async ({ page }) => {
    await page.goto("/get-listed");
    const body = await page.textContent("body");
    expect(body).not.toMatch(/promo code/i);
    expect(body).not.toContain("FINDMYMAHJGAME");
  });

  test("how-it-works describes the 90-day claim trial on the provider tab", async ({ page }) => {
    await page.goto("/how-it-works");
    expect(await page.textContent("body")).not.toContain("FINDMYMAHJGAME");
    await page.getByRole("button", { name: "For Teachers & Organizers" }).click();
    const body = await page.textContent("body");
    expect(body).toMatch(/90 days/i);
    expect(body).not.toContain("FINDMYMAHJGAME");
  });
});

test.describe("data truth", () => {
  test("a trial provider never counts as paying: paid requires a payment record", () => {
    const source = srcOf("lib", "data-trust.ts");
    expect(source).toContain("paidMembers: 0");
    expect(source).toContain("paidPremium");
    expect(source).toContain('.not("stripe_payment_id", "is", null)');
  });

  test("the conversion diagnostic counts only real delivered leads", () => {
    const source = srcOf("lib", "data-trust.ts");
    expect(source).toMatch(/provider_leads[\s\S]{0,300}real_external/);
    expect(source).toMatch(/eq\("status", "sent"\)/);
  });
});
