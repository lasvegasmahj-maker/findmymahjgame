import { test, expect } from "@playwright/test";
import {
  cityIndexability,
  cityCategoryIndexability,
  belongsInSitemap,
  CITY_THRESHOLDS,
  CATEGORY_THRESHOLDS,
} from "../lib/seo/indexability";

// Title and description must exist and be a sane length, and each page must
// have exactly one h1. These guard the on-page SEO the launch depends on.
// One representative per public route class (see docs/seo-measurement-audit.md 1.6).
const PAGES = [
  "/", // homepage
  "/events", // discovery hubs
  "/teachers",
  "/tournaments",
  "/leagues",
  "/travel",
  "/cruise",
  "/states", // geography index
  "/states/texas", // state page
  "/states/texas/dallas", // city page (launch metro)
  "/play", // intent pages
  "/ask",
  "/help",
  "/list-my-game", // conversion pages
  "/get-listed",
  "/join",
  "/newsletter",
  "/faq", // brochure pages
  "/about",
  "/how-it-works",
  "/contact",
  "/founding-advisors",
];

test.describe("SEO metadata", () => {
  for (const path of PAGES) {
    test(`${path} has a sound title, description, and single h1`, async ({ page }) => {
      await page.goto(path);

      const title = await page.title();
      expect(title.length, `${path} title too short`).toBeGreaterThan(10);
      expect(title.length, `${path} title too long for SERP`).toBeLessThanOrEqual(70);

      const desc = await page.locator('meta[name="description"]').getAttribute("content");
      expect(desc, `${path} needs a meta description`).toBeTruthy();
      expect((desc || "").length, `${path} description too short`).toBeGreaterThan(50);

      const h1 = await page.locator("h1").count();
      expect(h1, `${path} should have exactly one h1`).toBe(1);
    });
  }

  test("user-facing copy has no em or en dashes (brand rule)", async ({ page }) => {
    await page.goto("/");
    const body = (await page.locator("main, body").first().innerText()) || "";
    expect(body, "homepage copy must not contain em/en dashes").not.toMatch(/[–—]/);
  });
});

test.describe("Sitemap", () => {
  test("includes the header-linked intent pages", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();
    expect(xml).toContain("https://findmymahjgame.com/ask");
    expect(xml).toContain("https://findmymahjgame.com/help");
  });

  test("sampled sitemap URLs return 200 locally", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(urls.length, "sitemap should not be empty").toBeGreaterThan(50);

    // Sample across the whole file so every route class (static, state, city,
    // teacher) gets hit without making the suite crawl 160+ URLs.
    const step = Math.max(1, Math.floor(urls.length / 15));
    const sample = urls.filter((_, i) => i % step === 0).slice(0, 15);
    for (const url of sample) {
      const path = url.replace("https://findmymahjgame.com", "") || "/";
      const r = await request.get(path);
      expect(r.status(), `${path} from sitemap should return 200`).toBe(200);
    }
  });
});

test.describe("Structured data", () => {
  // Every JSON-LD block must parse, and Event markup must not claim fields the
  // visible card does not display. The Event builder in app/events/page.tsx
  // emits exactly these keys; anything new must be displayed before it ships.
  const EVENT_ALLOWED_KEYS = new Set([
    "@context",
    "@type",
    "name",
    "startDate",
    "eventStatus",
    "eventAttendanceMode",
    "location",
    "url",
  ]);

  test("/events JSON-LD parses and Event fields match the page", async ({ page }) => {
    await page.goto("/events");
    // Streaming SSR: wait for the h1 so visible-text checks see the real page.
    await page.locator("h1").first().waitFor();
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length, "/events should emit at least the sitewide schema").toBeGreaterThan(0);

    const visible = (await page.locator("body").innerText()) || "";
    for (const raw of blocks) {
      const parsed = JSON.parse(raw); // throws = test fails, which is the point
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (node["@type"] !== "Event") continue;
        for (const key of Object.keys(node)) {
          expect(EVENT_ALLOWED_KEYS.has(key), `Event markup key "${key}" is not displayed on /events cards`).toBe(true);
        }
        expect(typeof node.name).toBe("string");
        expect(visible, `Event name "${node.name}" must be visible on the page`).toContain(node.name);
        expect(isNaN(new Date(node.startDate).getTime()), "startDate must be a real date").toBe(false);
        expect(new Date(node.startDate).getTime()).toBeGreaterThanOrEqual(new Date().setHours(0, 0, 0, 0) - 24 * 3600 * 1000);
      }
    }
  });

  test("a teacher profile's JSON-LD parses and matches the visible page", async ({ page, request }) => {
    const res = await request.get("/sitemap.xml");
    const xml = await res.text();
    const teacherUrl = [...xml.matchAll(/<loc>(https:\/\/findmymahjgame\.com\/teachers\/[a-f0-9-]+)<\/loc>/g)].map((m) => m[1])[0];
    test.skip(!teacherUrl, "no teacher profiles in the sitemap right now");

    const path = teacherUrl!.replace("https://findmymahjgame.com", "");
    await page.goto(path);
    // Streaming SSR shows the route loading state first; wait for the profile
    // h1 so the visible-text comparison sees the real page, not the shell.
    await page.locator("h1").first().waitFor();
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);

    const visible = (await page.locator("body").innerText()) || "";
    // The profile builder in app/teachers/[id]/page.tsx emits exactly these keys.
    const PROFILE_ALLOWED_KEYS = new Set(["@context", "@type", "name", "description", "areaServed", "url"]);
    let sawProfile = false;
    for (const raw of blocks) {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (node["@type"] !== "LocalBusiness" && node["@type"] !== "Person") continue;
        // The sitewide Organization founder node also nests a Person; only the
        // top-level profile nodes (they carry areaServed or a /teachers url) count.
        const url = String(node.url || "");
        if (!url.includes("/teachers/") && !node.areaServed) continue;
        sawProfile = true;
        for (const key of Object.keys(node)) {
          expect(PROFILE_ALLOWED_KEYS.has(key), `profile markup key "${key}" is not displayed on ${path}`).toBe(true);
        }
        expect(visible, `profile name "${node.name}" must be visible`).toContain(node.name);
        if (node.description) {
          expect(visible, "schema description must be the displayed description").toContain(String(node.description).slice(0, 40));
        }
      }
    }
    expect(sawProfile, `${path} should emit LocalBusiness or Person markup`).toBe(true);
  });
});

test.describe("Indexability rule (ships dark, lib/seo/indexability.ts)", () => {
  const base = { published: 0, variantConfirmed: 0, currentEvidence: 0, isLaunchMetro: false };

  test("launch metro status grants no index bypass (owner ruling 2026-08-24)", () => {
    const v = cityIndexability({ ...base, isLaunchMetro: true });
    expect(v.indexable).toBe(false);
    expect(v.disposition).toBe("noindex");
    expect(belongsInSitemap(v)).toBe(false);
  });

  test("zero published listings is noindex", () => {
    const v = cityIndexability(base);
    expect(v).toEqual({ indexable: false, disposition: "noindex", reason: "no-published-listings" });
    expect(belongsInSitemap(v)).toBe(false);
  });

  test("below the published threshold is noindex, never 404", () => {
    const v = cityIndexability({ ...base, published: CITY_THRESHOLDS.minPublished - 1, variantConfirmed: 2, currentEvidence: 1 });
    expect(v.indexable).toBe(false);
    expect(v.disposition).toBe("noindex");
    expect(v.reason).toBe("below-published-threshold");
  });

  test("enough listings but too few variant-confirmed is noindex", () => {
    const v = cityIndexability({ ...base, published: 3, variantConfirmed: CITY_THRESHOLDS.minVariantConfirmed - 1, currentEvidence: 1 });
    expect(v.reason).toBe("below-variant-confirmed-threshold");
    expect(v.indexable).toBe(false);
  });

  test("no current evidence is noindex", () => {
    const v = cityIndexability({ ...base, published: 3, variantConfirmed: 2, currentEvidence: 0 });
    expect(v.reason).toBe("no-current-evidence");
    expect(v.indexable).toBe(false);
  });

  test("meeting every threshold exactly is indexable (3 published, 2 confirmed, 1 current)", () => {
    const v = cityIndexability({ ...base, published: 3, variantConfirmed: 2, currentEvidence: 1 });
    expect(v).toEqual({ indexable: true, disposition: "index", reason: "meets-city-threshold" });
    expect(belongsInSitemap(v)).toBe(true);
  });

  test("Dallas-shaped metro (9 published) is indexable", () => {
    const v = cityIndexability({ published: 9, variantConfirmed: 6, currentEvidence: 3, isLaunchMetro: false });
    expect(v.indexable).toBe(true);
  });

  test("category page 404s when its city is not indexable", () => {
    const v = cityCategoryIndexability(base, { categoryPublished: 5, categoryCurrentEvidence: 2 });
    expect(v).toEqual({ indexable: false, disposition: "not-found", reason: "city-not-indexable" });
  });

  test("category page 404s below the category threshold", () => {
    const city = { published: 9, variantConfirmed: 6, currentEvidence: 3, isLaunchMetro: false };
    const v = cityCategoryIndexability(city, { categoryPublished: CATEGORY_THRESHOLDS.minCategoryPublished - 1, categoryCurrentEvidence: 1 });
    expect(v.disposition).toBe("not-found");
    expect(v.reason).toBe("below-category-threshold");
  });

  test("category page 404s without current category evidence", () => {
    const city = { published: 9, variantConfirmed: 6, currentEvidence: 3, isLaunchMetro: false };
    const v = cityCategoryIndexability(city, { categoryPublished: 2, categoryCurrentEvidence: 0 });
    expect(v.reason).toBe("no-current-category-evidence");
  });

  test("category page indexes at exactly the documented thresholds", () => {
    const city = { published: 3, variantConfirmed: 2, currentEvidence: 1, isLaunchMetro: false };
    const v = cityCategoryIndexability(city, { categoryPublished: 2, categoryCurrentEvidence: 1 });
    expect(v).toEqual({ indexable: true, disposition: "index", reason: "meets-category-threshold" });
  });
});
