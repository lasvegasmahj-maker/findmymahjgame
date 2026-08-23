import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { enforcePublicName } from "../lib/sanitize";
import { rateLimitCheck, type RateLimitStore } from "../lib/rate-limit";

// Player safety and privacy hardening. The forms promise "first name and last
// initial" and "city only"; these tests pin the server-side enforcement of
// those promises so a refactor cannot quietly turn them back into suggestions.

test.describe("public name rule is enforced, not suggested", () => {
  test("a full name becomes first name plus last initial", () => {
    expect(enforcePublicName("Sandra Miller")).toBe("Sandra M.");
  });

  test("an already compliant name passes through unchanged", () => {
    expect(enforcePublicName("Sandra M.")).toBe("Sandra M.");
  });

  test("single names pass through", () => {
    expect(enforcePublicName("Sandra")).toBe("Sandra");
    expect(enforcePublicName("Madonna")).toBe("Madonna");
  });

  test("messy whitespace is normalized before the rule applies", () => {
    expect(enforcePublicName("  Sandra   Miller  ")).toBe("Sandra M.");
  });

  test("truncates at 40 characters", () => {
    expect(enforcePublicName("S".repeat(60)).length).toBe(40);
    expect(enforcePublicName(`${"A".repeat(50)} Miller`).length).toBeLessThanOrEqual(40);
  });
});

test.describe("street detail cannot reach a public listing", () => {
  test("a player submission with a street address in the bio is rejected kindly", async ({ request }) => {
    const res = await request.post("/api/list-my-game", {
      data: {
        name: "Test P.",
        city: "Las Vegas",
        state: "Nevada",
        bio: "We host every week at 123 Maple Street, come join us!",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error, "the rejection must explain the safety rule").toMatch(/street/i);
    expect(body.error).toMatch(/city and state/i);
  });

  test("a street address in the availability field is rejected the same way", async ({ request }) => {
    const res = await request.post("/api/list-my-game", {
      data: {
        name: "Test P.",
        city: "Las Vegas",
        state: "Nevada",
        availability: "Tuesdays at 456 N Oak Avenue after 6pm",
      },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/street/i);
  });
});

test.describe("cruise posts go through review", () => {
  // Pinned at the source instead of POSTing a real submission: a live post
  // writes a row to the production cruise_posts table and emails the founder
  // inbox on every test run. Same pattern as admin-truth.spec.ts.
  test("new cruise posts land as pending_review, never published", () => {
    const source = readFileSync(join(__dirname, "..", "app", "api", "cruise", "post", "route.ts"), "utf8");
    expect(source).toContain('status: "pending_review"');
    expect(source).not.toContain('status: "published"');
  });

  test("the cruise form no longer promises instant posting", () => {
    const board = readFileSync(join(__dirname, "..", "app", "cruise", "cruise-board.tsx"), "utf8");
    expect(board).toContain("after a quick review");
  });
});

test.describe("rate limiting failure modes", () => {
  const storeThatErrors: RateLimitStore = {
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: async () => ({ count: null, error: { message: 'relation "rate_hits" does not exist' } }),
        }),
      }),
      insert: async () => ({ error: null }),
    }),
  };

  const storeWithCount = (count: number, onInsert?: () => void): RateLimitStore => ({
    from: () => ({
      select: () => ({
        eq: () => ({ gte: async () => ({ count, error: null }) }),
      }),
      insert: async () => {
        onInsert?.();
        return { error: null };
      },
    }),
  });

  test("strict mode denies when the backing table errors", async () => {
    expect(await rateLimitCheck(storeThatErrors, "admin-login:1.2.3.4", 5, 300, "strict")).toBe(false);
  });

  test("open mode still allows when the backing table errors", async () => {
    expect(await rateLimitCheck(storeThatErrors, "list-my-game:1.2.3.4", 5, 60, "open")).toBe(true);
    expect(await rateLimitCheck(storeThatErrors, "list-my-game:1.2.3.4", 5, 60)).toBe(true);
  });

  test("a healthy store enforces the limit and records the hit", async () => {
    let recorded = 0;
    expect(await rateLimitCheck(storeWithCount(0, () => recorded++), "x:ip", 5, 60, "strict")).toBe(true);
    expect(recorded).toBe(1);
    expect(await rateLimitCheck(storeWithCount(5), "x:ip", 5, 60)).toBe(false);
  });

  test("admin login opts into strict mode", () => {
    const source = readFileSync(join(__dirname, "..", "app", "api", "admin", "login", "route.ts"), "utf8");
    expect(source).toMatch(/rateLimit\(req, "admin-login", 5, 300, "strict"\)/);
  });
});
