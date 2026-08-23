import { test, expect } from "@playwright/test";

// The homepage search card has two modes: Find a Game (default) and Ask Find My Mahj.
// Find a Game must keep the exact destination it always had, and Ask must show only
// what POST /api/ask returns, never an invented answer.

const SEARCH_PLACEHOLDER = "City, state, or ZIP code";
const ASK_PLACEHOLDER = "Ask where to play or how to play...";

test.describe("homepage search card", () => {
  test("Find a Game is the default mode", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("tab", { name: "Find a Game" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toBeVisible();
    await expect(page.getByPlaceholder(ASK_PLACEHOLDER)).toBeHidden();
  });

  test("switching modes shows Ask and preserves the search input", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill("Dallas");
    await page.getByRole("tab", { name: "Ask Find My Mahj" }).click();
    await expect(page.getByPlaceholder(ASK_PLACEHOLDER)).toBeVisible();
    await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toBeHidden();
    await page.getByRole("tab", { name: "Find a Game" }).click();
    await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toHaveValue("Dallas");
  });

  test("search submits to the same state destination as before", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill("Dallas");
    await page.getByRole("button", { name: "Find a Game", exact: true }).click();
    await page.waitForURL(
      (url) =>
        url.pathname === "/states/texas" &&
        url.searchParams.get("city") === "Dallas" &&
        url.searchParams.get("tab") === "events"
    );
  });

  test("Ask mode posts to /api/ask and renders the answer with up to 3 links", async ({ page }) => {
    let posted: unknown = null;
    await page.route("**/api/ask", async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({
        json: {
          ok: true,
          answer: "Found 4 listings near Dallas, every one reviewed before publishing.",
          results: [1, 2, 3, 4].map((n) => ({
            id: `e${n}`,
            kind: "event",
            name: `Open Play ${n}`,
            city: "Dallas",
            state: "TX",
            when: "Thursdays",
            distance: null,
            type: "open_play",
            url: "/events",
          })),
          suggestions: [],
        },
      });
    });
    await page.goto("/");
    await page.getByRole("tab", { name: "Ask Find My Mahj" }).click();
    await page.getByPlaceholder(ASK_PLACEHOLDER).fill("Where can I play near Dallas?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();

    const status = page.getByRole("status");
    await expect(status.getByText("Found 4 listings near Dallas", { exact: false })).toBeVisible();
    expect(posted).toEqual({ q: "Where can I play near Dallas?" });
    await expect(status.locator("ul li")).toHaveCount(3);
    await expect(status.getByRole("link", { name: "Continue on the Ask page" })).toHaveAttribute(
      "href",
      "/ask?q=Where%20can%20I%20play%20near%20Dallas%3F"
    );
  });

  test("a failed Ask request shows the fixed error, not an invented answer", async ({ page }) => {
    await page.route("**/api/ask", (route) => route.abort());
    await page.goto("/");
    await page.getByRole("tab", { name: "Ask Find My Mahj" }).click();
    await page.getByPlaceholder(ASK_PLACEHOLDER).fill("Where can I play near Dallas?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    const status = page.getByRole("status");
    await expect(status.getByText("Something went wrong. Try again, or browse the Events page.")).toBeVisible();
    await expect(status.locator("ul li")).toHaveCount(0);
  });

  test("mode control works with arrow keys", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Find a Game" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Ask Find My Mahj" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByPlaceholder(ASK_PLACEHOLDER)).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab", { name: "Find a Game" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toBeVisible();
  });

  test("/ask prefills the question from ?q=", async ({ page }) => {
    await page.goto("/ask?q=Where%20can%20I%20play%20near%20Dallas%3F");
    await expect(page.locator("#ask-q")).toHaveValue("Where can I play near Dallas?");
  });
});

test.describe("homepage at 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no horizontal scroll", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
