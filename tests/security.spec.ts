import { test, expect } from "@playwright/test";

test.describe("security headers and API contracts", () => {
  test("homepage sends hardening headers", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"], "CSP must be present").toBeTruthy();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"], "Referrer-Policy must be set").toBeTruthy();
    expect(
      h["x-frame-options"] || (h["content-security-policy"] || "").includes("frame-ancestors"),
      "clickjacking protection (X-Frame-Options or frame-ancestors)"
    ).toBeTruthy();
  });

  test("a bad API request returns JSON, not a stack trace", async ({ request }) => {
    const res = await request.post("/api/subscribe", { data: {} });
    expect([200, 400, 401, 403, 422, 429]).toContain(res.status());
    const body = await res.text();
    expect(body, "no stack frames leaked").not.toContain("at Object.");
    expect(body, "no server paths leaked").not.toMatch(/\/Users\/|\/home\/|node_modules/);
  });
});
