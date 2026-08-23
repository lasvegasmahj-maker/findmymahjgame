import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { buildCityCounts } from "../lib/seo/city-counts";
import { cityIndexability } from "../lib/seo/indexability";
import { gscStatus } from "../lib/seo/gsc";

// Lead SEO and system-health unit: indexation is earned on marketplace value,
// the sitemap and city pages share one verdict, Search Console is honestly
// NOT CONNECTED without a credential, and the reconciliation net covers Wave 2.

test.describe("city counts and indexability", () => {
  test("buildCityCounts computes value from variant confirmation and evidence", () => {
    const recent = new Date().toISOString();
    const counts = buildCityCounts(
      new Map([[
        "texas/dallas",
        [
          { mahjong_variant: "AMERICAN", variant_confidence: "high", confirmed_active_at: recent },
          { mahjong_variant: "AMERICAN", variant_confidence: "medium", confirmed_active_at: null },
          { mahjong_variant: "AMERICAN", variant_confidence: "low", confirmed_active_at: null },
          { mahjong_variant: null, variant_confidence: null, confirmed_active_at: "2020-01-01T00:00:00Z" },
        ],
      ]])
    ).get("texas/dallas");
    expect(counts).toEqual({ published: 4, variantConfirmed: 2, currentEvidence: 1, isLaunchMetro: false });
  });

  test("a city meeting thresholds is indexable; a thin one is noindex", () => {
    expect(cityIndexability({ published: 3, variantConfirmed: 2, currentEvidence: 1, isLaunchMetro: false }).indexable).toBe(true);
    expect(cityIndexability({ published: 2, variantConfirmed: 2, currentEvidence: 1, isLaunchMetro: false }).indexable).toBe(false);
  });
});

test.describe("shared verdict wiring", () => {
  const read = (rel: string) => fs.readFileSync(path.join(__dirname, "..", rel), "utf8");

  test("sitemap consults cityIndexability, no launch bypass", () => {
    const sitemap = read("app/sitemap.ts");
    expect(sitemap).toMatch(/cityIndexability\(counts\)\.indexable/);
    expect(sitemap).not.toMatch(/const cityKeys = new Set<string>\(LAUNCH_CITY_KEYS\)/);
  });

  test("city page consults the same verdict", () => {
    const page = read("app/states/[state]/[city]/page.tsx");
    expect(page).toMatch(/cityIndexability\(/);
    expect(page).toMatch(/buildCityCounts\(/);
  });

  test("wave 2 reconciliation checks exist in data trust", () => {
    const dt = read("lib/data-trust.ts");
    for (const marker of [
      "Auth users with no profile",
      "Approved claim without matching ownership",
      "Blocked players seated together",
      "Open match requests without valid consent",
      "Failed notifications in the last 24 hours",
      "Founder business published as an organic listing",
    ]) {
      expect(dt).toContain(marker);
    }
  });
});

test.describe("search console adapter", () => {
  test("reports credential-missing honestly when unconfigured", async () => {
    if (process.env.GSC_SERVICE_ACCOUNT_JSON) test.skip();
    const status = await gscStatus();
    expect(status.connected).toBe(false);
    if (!status.connected) expect(status.reason).toBe("credential-missing");
  });
});

test.describe("admin surfaces", () => {
  test("admin seo route requires the admin session", async ({ request }) => {
    expect((await request.get("/api/admin/seo")).status()).toBe(401);
  });

  test("admin home shows the launch gates to the signed-in owner", async ({ request, baseURL }) => {
    let password = process.env.ADMIN_PASSWORD;
    const envPath = path.join(__dirname, "..", ".env.local");
    if (!password && fs.existsSync(envPath)) {
      password = fs.readFileSync(envPath, "utf8").match(/^ADMIN_PASSWORD=(.*)$/m)?.[1]?.replace(/^"|"$/g, "");
    }
    test.skip(!password, "ADMIN_PASSWORD not available");
    const login = await request.post("/api/admin/login", { data: { password } });
    expect(login.ok()).toBeTruthy();
    const page = await request.get("/admin");
    const html = await page.text();
    expect(html).toContain("Launch readiness");
    expect(html).toContain("Public signup");
    expect(html).toContain("Player matching");
  });
});
