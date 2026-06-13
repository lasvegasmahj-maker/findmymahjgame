import { test, expect } from "@playwright/test";

// The two inbound forms a launch visitor is most likely to use must render
// their core fields on desktop and mobile.
test.describe("inbound forms", () => {
  test("newsletter page shows an email field", async ({ page }) => {
    await page.goto("/newsletter");
    await expect(
      page.locator('input[type="email"], input[name*="email" i]').first()
    ).toBeVisible();
  });

  test("contact page shows a message field", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("textarea, input").first()).toBeVisible();
  });
});
