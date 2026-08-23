import { test, expect } from "@playwright/test";
import { hostRecordClass } from "../lib/analytics/events";

// The deterministic guard that keeps test, CI, dev, and preview analytics out of
// the real funnel: only the production host classifies as real.
test.describe("analytics host classification", () => {
  test("production host is real", () => {
    expect(hostRecordClass("findmymahjgame.com")).toBe("real_external");
    expect(hostRecordClass("www.findmymahjgame.com")).toBe("real_external");
    expect(hostRecordClass("findmymahjgame.com:443")).toBe("real_external");
  });

  test("every other host is test", () => {
    for (const h of ["localhost:3000", "findmymahjgame-abc.vercel.app", "127.0.0.1:3205", "", null, undefined]) {
      expect(hostRecordClass(h)).toBe("test");
    }
  });
});
