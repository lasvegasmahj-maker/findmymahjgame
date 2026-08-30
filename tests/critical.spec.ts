import { test, expect } from "@playwright/test";

// Every public route must return 200, the sitemap and robots must serve, and
// an unknown route must 404. This is the launch tripwire: a stale deploy or a
// broken route shows up here first.
const ROUTES = [
  "/", "/play", "/start", "/events", "/teachers", "/venues", "/faq", "/about",
  "/help", "/newsletter", "/how-it-works", "/get-listed", "/list-my-game",
  "/ambassadors", "/privacy", "/terms", "/provider-terms", "/billing-disclosures",
  "/matching-standards", "/states/texas",
  "/states/texas/dallas", "/states/nevada/las-vegas", "/events?type=tournament",
];

test.describe("critical routes", () => {
  for (const path of ROUTES) {
    test(`GET ${path} returns 200`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status(), `${path} should be 200`).toBe(200);
    });
  }

  test("sitemap.xml is served as xml", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] || "").toContain("xml");
  });

  test("robots.txt is served", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
  });

  test("unknown route returns 404", async ({ request }) => {
    const res = await request.get("/this-route-does-not-exist-xyz-123");
    expect(res.status()).toBe(404);
  });
});
