import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Nevada must be a fair market: NV teachers query and rank like every other
// state's, and the founder's business (Las Vegas Mahjong) appears only as a
// clearly labelled house card that never replaces the organic list.

const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;
const LV_METRO = ["las vegas", "summerlin", "henderson", "north las vegas", "boulder city"];
const FOUNDER_NAME = "Las Vegas Mahjong";

// Playwright does not load Next's env files, so read .env.local directly.
function loadEnv(): Record<string, string> {
  const file = path.resolve(__dirname, "..", ".env.local");
  const out: Record<string, string> = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

type NvTeacher = { business_name: string | null; city: string | null };
let nvTeachersCache: Promise<NvTeacher[] | null> | null = null;

// null = database unreachable (fall back to structural assertions).
function publishedNvTeachers(): Promise<NvTeacher[] | null> {
  if (!nvTeachersCache) {
    nvTeachersCache = (async () => {
      const env = loadEnv();
      const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) return null;
      try {
        const supabase = createClient(url, key);
        const { data, error } = await supabase
          .from("venue_listings")
          .select("business_name, city, venue_type, description, website, instagram")
          .eq("status", "published")
          .eq("state", "NV");
        if (error) return null;
        // Founder-owned rows render only through the labelled card, so they
        // are not organic competitors (mirrors lib/featured-listings.ts).
        const founderOwned = (r: { website: string | null; instagram: string | null }) =>
          String(r.website || "").toLowerCase().includes("lasvegasmahj.com") ||
          String(r.instagram || "").replace(/^@/, "").toLowerCase() === "lasvegasmahjong";
        return (data || [])
          .filter((r) => TEACHER_TYPE.test(`${r.venue_type || ""} ${r.description || ""}`) && !founderOwned(r))
          .map((r) => ({ business_name: r.business_name, city: r.city }));
      } catch {
        return null;
      }
    })();
  }
  return nvTeachersCache;
}

const competitorNames = (rows: NvTeacher[]) =>
  rows.map((r) => r.business_name).filter((n): n is string => !!n && n !== FOUNDER_NAME);

test.describe("nevada fairness", () => {
  test("/teachers includes Nevada teachers from the database", async ({ page }) => {
    const nv = await publishedNvTeachers();
    await page.goto("/teachers");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find a mahjong teacher");
    const names = nv ? competitorNames(nv) : [];
    if (names.length > 0) {
      for (const name of names.slice(0, 3)) {
        await expect(page.getByText(name).first(), `NV teacher "${name}" must list on /teachers`).toBeVisible();
      }
    } else {
      // No published NV competitor exists to assert on, so verify the page
      // renders with the founder card labelled instead of an exclusion.
      await expect(page.getByTestId("founder-card")).toBeVisible();
      await expect(page.getByTestId("founder-card")).toContainText("From our founder");
    }
  });

  test("founder card carries the literal label From our founder", async ({ page }) => {
    await page.goto("/teachers");
    const card = page.getByTestId("founder-card");
    await expect(card).toBeVisible();
    await expect(card).toContainText("From our founder");
    await expect(card).toContainText(FOUNDER_NAME);

    await page.goto("/states/nevada");
    await expect(page.getByTestId("founder-card").first()).toContainText("From our founder");

    await page.goto("/states/nevada/las-vegas");
    await expect(page.getByTestId("founder-card").first()).toContainText("From our founder");
  });

  test("Nevada city page renders database teachers, not an outbound replacement", async ({ page }) => {
    const nv = await publishedNvTeachers();
    await page.goto("/states/nevada/las-vegas");
    await expect(page.getByRole("heading", { name: "Teachers", exact: true })).toBeVisible();
    await expect(page.getByText("For lessons in")).toHaveCount(0);
    const metroNames = nv
      ? competitorNames(nv.filter((r) => LV_METRO.includes(String(r.city || "").trim().toLowerCase())))
      : [];
    if (metroNames.length > 0) {
      for (const name of metroNames.slice(0, 3)) {
        await expect(page.getByText(name).first(), `NV teacher "${name}" must list on the Las Vegas page`).toBeVisible();
      }
    } else {
      await expect(page.getByText("Be one of the first to list a teacher or class")).toBeVisible();
    }
  });

  test("lasvegasmahj.com links appear only on the labelled founder card", async ({ page }) => {
    await page.goto("/states/nevada/las-vegas");
    const all = await page.locator('a[href*="lasvegasmahj.com"]').count();
    const inFounder = await page.locator('[data-testid="founder-card"] a[href*="lasvegasmahj.com"]').count();
    expect(all).toBe(inFounder);

    await page.goto("/states/nevada");
    await expect(page.getByText("Sponsored", { exact: true })).toHaveCount(0);
    const allState = await page.locator('a[href*="lasvegasmahj.com"]').count();
    const inFounderState = await page.locator('[data-testid="founder-card"] a[href*="lasvegasmahj.com"]').count();
    expect(allState).toBe(inFounderState);
  });

  test("regression: Texas state and city pages render without the house treatment", async ({ page }) => {
    await page.goto("/states/texas");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Texas");
    await expect(page.getByTestId("founder-card")).toHaveCount(0);
    await page.getByRole("button", { name: /Events/ }).click();
    await expect(page.getByRole("heading", { name: "Events Near You" })).toBeVisible();
    await page.getByRole("button", { name: /Teachers/ }).click();
    await expect(page.getByRole("heading", { name: "Teachers in Texas" })).toBeVisible();

    await page.goto("/states/texas/dallas");
    await expect(page.getByRole("heading", { name: "Open play and events" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Teachers", exact: true })).toBeVisible();
    await expect(page.getByTestId("founder-card")).toHaveCount(0);
  });
});
