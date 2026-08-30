import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

// The published policy documents: every route serves, carries its owner-decided facts, never
// leaks a draft bracket, and never contradicts the approved provider model.
const PUBLISHED = [
  { path: "/privacy", h1: "Privacy Policy", must: ["generally processed within 30 days", "Las Vegas, Nevada", "Stripe"] },
  { path: "/provider-terms", h1: "Provider Terms", must: ["$89 a year", "never for placement", "prorated basis", "every edit is reviewed", "by emailing hello@findmymahjgame.com"] },
  { path: "/billing-disclosures", h1: "Billing Disclosures", must: ["$89 a year", "targeted 30 days ahead", "customer portal", "within 30 days of your first $89 charge", "except where otherwise required by applicable law"] },
  { path: "/matching-standards", h1: "Matching Community Standards", must: ["18 years of age and older", "one written appeal", "target of 7 days"] },
];
// Affirmative sales language only: the documents deny placement and verification sales, and a
// denial must not trip the check.
const NEVER = ["OWNER TO CONFIRM", "DRAFT FOR OWNER REVIEW", "featured placement", "more visibility", "priority placement", "verified badge and more", "buy a verified badge"];

test.describe("policy documents", () => {
  for (const doc of PUBLISHED) {
    test(`${doc.path} serves the owner-approved text`, async ({ page }) => {
      const res = await page.goto(doc.path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toContainText(doc.h1);
      const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
      for (const m of doc.must) expect(text, `${doc.path} must say: ${m}`).toContain(m);
      for (const n of NEVER) expect(text.toLowerCase(), `${doc.path} must never say: ${n}`).not.toContain(n.toLowerCase());
      // Every published document links to the others.
      const nav = page.locator('nav[aria-label="Policy documents"]');
      await expect(nav).toBeVisible();
      for (const route of ["/terms", "/privacy", "/provider-terms", "/billing-disclosures", "/matching-standards"]) {
        if (route === doc.path) continue;
        await expect(nav.locator(`a[href="${route}"]`)).toHaveCount(1);
      }
    });
  }

  test("/terms still serves and carries no draft bracket while the entity confirmation is pending", async ({ page }) => {
    const res = await page.goto("/terms");
    expect(res?.status()).toBe(200);
    const text = await page.locator("body").innerText();
    expect(text).not.toContain("OWNER TO CONFIRM");
  });

  test("the footer links every policy document", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    for (const route of ["/terms", "/privacy", "/provider-terms", "/billing-disclosures", "/matching-standards"]) {
      await expect(footer.locator(`a[href="${route}"]`)).toHaveCount(1);
    }
  });

  test("billing and provider surfaces link the documents that govern them", async ({ page }) => {
    await page.goto("/join");
    await expect(page.locator('a[href="/billing-disclosures"]').first()).toBeVisible();
    await expect(page.locator('a[href="/provider-terms"]').first()).toBeVisible();
    await page.goto("/mahj-match");
    await expect(page.locator('a[href="/matching-standards"]').first()).toBeVisible();
  });

  test("public copy never sells verification or placement", async ({ page }) => {
    for (const route of ["/", "/join", "/faq", "/how-it-works", "/get-listed", "/advertise", "/provider-terms", "/billing-disclosures"]) {
      await page.goto(route);
      const text = (await page.locator("body").innerText()).toLowerCase();
      for (const phrase of ["featured placement", "more visibility", "verified badge and more", "buy a verified badge", "priority placement", "boost your ranking"]) {
        expect(text, `${route} must not say "${phrase}"`).not.toContain(phrase);
      }
    }
    await page.goto("/faq");
    const faq = await page.locator("body").innerText();
    expect(faq).toContain("Premium Provider badge");
  });

  test("source pins: generated content carries no bracket and published drafts are bracket-free", () => {
    const root = path.resolve(__dirname, "..");
    for (const slug of ["privacy-policy", "provider-terms", "billing-disclosures", "matching-community-standards"]) {
      const generated = fs.readFileSync(path.join(root, "content/policy", `${slug}.ts`), "utf8");
      expect(generated).not.toContain("OWNER TO CONFIRM");
      expect(generated).not.toContain("DRAFT FOR OWNER REVIEW");
      const draft = fs.readFileSync(path.join(root, "docs/policy/drafts", `${slug}.md`), "utf8");
      expect(draft).toContain("PUBLISHED at /");
      expect(draft).not.toContain("OWNER TO CONFIRM");
    }
    // Terms of Use waits on one owner confirmation; if it is ever generated it must be bracket-free.
    const terms = path.join(root, "content/policy/terms-of-use.ts");
    if (fs.existsSync(terms)) expect(fs.readFileSync(terms, "utf8")).not.toContain("OWNER TO CONFIRM");
    const generator = fs.readFileSync(path.join(root, "scripts/policy-content.mjs"), "utf8");
    expect(generator).toContain("still carries an owner bracket; not generating");
    // The site must serve exactly what the drafts say: regenerate in check mode and require no drift.
    const check = execFileSync("node", ["scripts/policy-content.mjs", "--check"], { cwd: root, encoding: "utf8" });
    expect(check).toContain("up to date");
  });
});
