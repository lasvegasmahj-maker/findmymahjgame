import { test, expect } from "@playwright/test";
import { admissionVerdict, type KnownEntities } from "../lib/prospect-guards";
import { canTransition } from "../lib/prospect-state";

// Admission and state rules that keep the growth engine from ever contacting the wrong
// people: our own business, suppressed addresses, or entities already in the product.

function known(over: Partial<KnownEntities> = {}): KnownEntities {
  return {
    suppressedEmails: new Set(),
    prospectEmails: new Set(),
    prospectNames: new Set(),
    listingEmails: new Set(),
    listingNameCityKeys: new Set(),
    listingHosts: new Set(),
    ...over,
  };
}

test.describe("prospect admission guards", () => {
  test("Las Vegas Mahjong can never become a prospect, under any spelling", () => {
    for (const name of ["Las Vegas Mahjong", "las vegas mahjong studio", "LAS VEGAS MAHJONG, LLC"]) {
      const v = admissionVerdict({ name, city: "Las Vegas", state: "NV", source_url: "https://example.org/x" }, known());
      expect(v.admit).toBe(false);
      expect(v.reason).toContain("canonical");
    }
    const byDomain = admissionVerdict(
      { name: "Some Studio", city: "Summerlin", state: "NV", source_url: "https://x.org", website_url: "https://lasvegasmahj.com/studio" },
      known()
    );
    expect(byDomain.admit).toBe(false);
  });

  test("suppressed contacts cannot be rediscovered as prospects", () => {
    const v = admissionVerdict(
      { name: "Opted Out Org", city: "Boston", state: "MA", source_url: "https://x.org", public_email: "OptedOut@example.com" },
      known({ suppressedEmails: new Set(["optedout@example.com"]) })
    );
    expect(v.admit).toBe(false);
    expect(v.reason).toBe("suppressed contact");
  });

  test("existing listings are recognized by name and city", () => {
    const v = admissionVerdict(
      { name: "Scottsdale Mahjong Society", city: "Scottsdale", state: "AZ", source_url: "https://x.org" },
      known({ listingNameCityKeys: new Set(["scottsdalemahjongsociety|scottsdale"]) })
    );
    expect(v.admit).toBe(false);
    expect(v.reason).toBe("already a listing");
  });

  test("existing contacts are recognized by email", () => {
    const v = admissionVerdict(
      { name: "New Name Same Person", city: "Tampa", state: "FL", source_url: "https://x.org", public_email: "known@studio.com" },
      known({ listingEmails: new Set(["known@studio.com"]) })
    );
    expect(v.admit).toBe(false);
  });

  test("a clean new prospect is admitted", () => {
    const v = admissionVerdict(
      { name: "Brand New Mahjong Club", city: "Boston", state: "MA", source_url: "https://newclub.org" },
      known()
    );
    expect(v.admit).toBe(true);
  });
});

test.describe("suppression dominance in the state machine", () => {
  test("unsubscribed and do-not-contact never re-enter any outreach state", () => {
    for (const from of ["UNSUBSCRIBED", "DO_NOT_CONTACT"] as const) {
      for (const to of ["READY_FOR_OUTREACH", "OUTREACH_ACTIVE", "FOLLOW_UP_DUE", "QUALIFIED", "VERIFYING"] as const) {
        expect(canTransition(from, to)).toBe(false);
      }
    }
  });
});
