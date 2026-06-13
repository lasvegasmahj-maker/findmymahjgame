import { test, expect } from "@playwright/test";

// Title and description must exist and be a sane length, and each page must
// have exactly one h1. These guard the on-page SEO the launch depends on.
const PAGES = ["/", "/states/texas", "/events", "/faq"];

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
