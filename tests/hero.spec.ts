import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

// The homepage hero replaces the old Find/Ask tab switcher with two always-visible
// side-by-side action cards. This suite covers the new hero contract: both cards
// visible on every viewport, the rotating Ask placeholder, the suggestion chips,
// the discovery strip, and the nav label.

const SEARCH_PLACEHOLDER = "City, state, or ZIP code";
const ASK_LABEL = "Ask where to play or how to play";
const FIRST_ROTATING_QUESTION = "Can I use a joker in a pair?";

test.describe("hero cards", () => {
  test("both cards are visible at desktop", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Find a Game", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ask Find My Mahj" })).toBeVisible();
    await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toBeVisible();
    await expect(page.getByLabel(ASK_LABEL)).toBeVisible();
  });

  test("Always free for players. is visible in the Find card", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Always free for players.")).toBeVisible();
  });

  test("all three suggestion chips are visible and clicking one submits the question", async ({ page }) => {
    let posted: unknown = null;
    await page.route("**/api/ask", async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({
        json: { ok: true, answer: "A joker can stand in for any tile in a pair.", results: [], suggestions: [] },
      });
    });
    await page.goto("/");
    const jokerChip = page.getByRole("button", { name: "Can I use a joker in a pair?" });
    const instructorChip = page.getByRole("button", { name: "Find an instructor near me" });
    const charlestonChip = page.getByRole("button", { name: "How does the Charleston work?" });
    await expect(jokerChip).toBeVisible();
    await expect(instructorChip).toBeVisible();
    await expect(charlestonChip).toBeVisible();

    await jokerChip.click();
    expect(posted).toEqual({ q: "Can I use a joker in a pair?" });
    await expect(page.getByRole("status").getByText("A joker can stand in for any tile in a pair.")).toBeVisible();
  });

  test("rotating placeholder overlay stops permanently once the ask input is focused", async ({ page }) => {
    await page.goto("/");
    const overlay = page.getByTestId("ask-placeholder-overlay");
    await expect(overlay).toBeVisible();
    await page.getByLabel(ASK_LABEL).focus();
    await expect(overlay).toBeHidden();
    // Blurring must not bring it back; the rotation stops for the life of the page.
    await page.getByLabel(ASK_LABEL).evaluate((el) => (el as HTMLElement).blur());
    await expect(overlay).toBeHidden();
  });

  test("reduced motion shows the first question statically, no rotation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const overlay = page.getByTestId("ask-placeholder-overlay");
    await expect(overlay).toHaveText(FIRST_ROTATING_QUESTION);
    await page.waitForTimeout(3800);
    await expect(overlay).toHaveText(FIRST_ROTATING_QUESTION);
  });

  test("nav link reads Ask Find My Mahj and points to /ask", async ({ page }) => {
    await page.goto("/");
    const navLink = page.locator("nav.site-nav").getByRole("link", { name: "Ask Find My Mahj" });
    await expect(navLink).toHaveAttribute("href", "/ask");
  });

  test("discovery strip links are present and each destination resolves", async ({ page, request }) => {
    await page.goto("/");
    const strip = page.getByTestId("discovery-strip");
    const links: Record<string, string> = {
      "Games Near Me": "/states",
      Teachers: "/teachers",
      Events: "/events",
      Tournaments: "/tournaments",
      Getaways: "/travel",
      "Mahjong Rules": "/ask",
    };
    for (const [label, href] of Object.entries(links)) {
      const link = strip.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
    }
  });

  test("keyboard tab order reaches the search input, find button, ask input, ask button, and all three chips", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(SEARCH_PLACEHOLDER).focus();
    await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Find a Game", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel(ASK_LABEL)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Ask", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Can I use a joker in a pair?" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Find an instructor near me" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "How does the Charleston work?" })).toBeFocused();
  });
});

test.describe("hero cards at 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("both cards visible, stacked, no horizontal scroll", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Find a Game", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ask Find My Mahj" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("record_class safety", () => {
  test("the homepage tables-forming query pins record_class to real_external", () => {
    // QA seeds record_class "test" tables into the shared production database.
    // This assertion pins the filter on the same "tables" query so a refactor that
    // drops it fails a test instead of silently leaking synthetic tables onto the
    // public homepage. Same precedent as tests/admin-truth.spec.ts.
    const source = readFileSync(join(__dirname, "..", "app", "page.tsx"), "utf8");
    const tablesQuery = source.match(/\.from\("tables"\)[\s\S]*?\.limit\(20\)/);
    expect(tablesQuery).not.toBeNull();
    expect(tablesQuery![0]).toContain('eq("status", "forming")');
    expect(tablesQuery![0]).toContain('eq("record_class", "real_external")');
  });
});
