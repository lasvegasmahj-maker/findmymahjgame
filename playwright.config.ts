import { defineConfig, devices } from "@playwright/test";

// Set PLAYWRIGHT_BASE_URL to test a deployed preview/prod; otherwise a local
// production server is built and started automatically.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    // WebKit Bus-errors on this Mac, so the default mobile project is Chromium
    // emulation and WebKit is opt-in with PW_WEBKIT=1.
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    ...(process.env.PW_WEBKIT ? [{ name: "mobile-safari", use: { ...devices["iPhone 13"] } }] : []),
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm build && pnpm start",
        url: "http://localhost:3000",
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
      },
});
