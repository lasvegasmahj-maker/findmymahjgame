import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// Regression for the PostgREST filter-injection the gate caught: the provider
// search must strip every reserved character, not just LIKE wildcards, before
// building the ilike pattern, so a crafted q can never inject an extra predicate.
test.describe("provider search injection", () => {
  test("the route sanitizes to a safe character set, not just wildcards", () => {
    const src = fs.readFileSync(path.join(__dirname, "..", "app", "api", "provider", "search", "route.ts"), "utf8");
    // The dangerous pattern is stripping only % and _.
    expect(src).not.toMatch(/replace\(\/\[%_\]\/g/);
    // The safe pattern keeps only letters, numbers, spaces, apostrophes, hyphens.
    expect(src).toMatch(/\[\^\\p\{L\}\\p\{N\}\\s'-\]/);
    expect(src).toMatch(/rateLimit\(req, "provider-search"/);
  });

  test("the route is gated and never public while claims are dark", async ({ request }) => {
    const r = await request.get("/api/provider/search?q=" + encodeURIComponent("z%),and(id.eq.abc,contact_email.ilike.a%"));
    // Unauthenticated: 401 before any query runs.
    expect(r.status()).toBe(401);
  });
});
