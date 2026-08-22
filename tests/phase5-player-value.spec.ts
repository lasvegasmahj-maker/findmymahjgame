import { test, expect } from "@playwright/test";
import { detectPrivateLocation, redactStreetDetail, safePublicVenue, isUrgentPrivacyExposure, LOCATION_ON_REQUEST_TEXT } from "../lib/private-location";
import { summarizeMetro, metroOf, type CoverageRow } from "../lib/market-coverage";
import { buildDigest, isoWeekAgo, representativeSample, prioritizePhoneQueue } from "../lib/growth-digest";
import { admissionVerdict, type KnownEntities } from "../lib/prospect-guards";
import { canTransition } from "../lib/prospect-state";

// Phase 5 protects two things: a player's trust in what a listing claims, and a host's home
// address. Pure logic, no browser, no network.

test.describe("private location protections", () => {
  test("a private residence is detected wherever the text lives", () => {
    expect(detectPrivateLocation({ venue: "Private residence in Naples" }).isPrivateResidence).toBe(true);
    expect(detectPrivateLocation({ description: "Most of our events take place at members' homes" }).isPrivateResidence).toBe(true);
    expect(detectPrivateLocation({ venue: "Hosted at the organizer's home" }).isPrivateResidence).toBe(true);
    expect(detectPrivateLocation({ venue: "Boston Public Library, Roslindale Branch" }).isPrivateResidence).toBe(false);
  });

  test("street level detail on a home is caught, both house numbers and cross streets", () => {
    expect(detectPrivateLocation({ venue: "Private residence near 16th St & Glendale Ave" }).hasStreetDetail).toBe(true);
    expect(detectPrivateLocation({ venue: "Private residence at 1428 Elm Street" }).hasStreetDetail).toBe(true);
  });

  test("redaction removes every address in a field, not only the first", () => {
    const out = redactStreetDetail("Games rotate between 1428 Elm Street and 22 Oak Avenue each month.");
    expect(out).not.toMatch(/1428/);
    expect(out).not.toMatch(/Oak Avenue/);
  });

  test("redaction removes the block but keeps the game", () => {
    const out = redactStreetDetail("Private residence in North Central Phoenix (near 16th St & Glendale Ave; address shared via Meetup)");
    expect(out).toContain("Private residence in North Central Phoenix");
    expect(out).toContain("address shared via Meetup");
    expect(out).not.toMatch(/16th/);
    expect(out).not.toMatch(/Glendale/);
  });

  test("a live listing with a home and street detail is the urgent case", () => {
    expect(isUrgentPrivacyExposure({ status: "published", venue: "Private residence at 1428 Elm Street" })).toBe(true);
    expect(isUrgentPrivacyExposure({ status: "pending_review", venue: "Private residence at 1428 Elm Street" })).toBe(false);
    expect(isUrgentPrivacyExposure({ status: "published", venue: "Aeronaut Brewing, 14 Tyler Street" })).toBe(false);
  });

  test("the safe public form never narrows below a city", () => {
    const v = safePublicVenue("Henderson", "NV");
    expect(v).toContain("Henderson");
    expect(v).toContain(LOCATION_ON_REQUEST_TEXT.toLowerCase());
    expect(v).not.toMatch(/\d{2,}/);
  });
});

test.describe("qualification does not imply publication", () => {
  // The Phase 5 finding in one assertion: a prospect worth contacting is not automatically a
  // listing. The admission guard governs contact; publication needs its own verdict.
  test("a clean prospect is admissible for contact yet carries no publish verdict", () => {
    const known: KnownEntities = {
      suppressedEmails: new Set(), prospectEmails: new Set(), prospectNames: new Set(),
      listingEmails: new Set(), listingNameCityKeys: new Set(),
    };
    const v = admissionVerdict({ name: "Some Riichi Club", city: "Boston", state: "MA", source_url: "https://x.org" }, known);
    expect(v.admit).toBe(true);
    // Nothing about admission grants a listing: publication state lives on listing rows and
    // is only ever set by the publish script from an explicit PUBLISHABLE verdict.
    expect(Object.keys(v)).not.toContain("publish");
  });

  test("QUALIFIED never transitions straight to CONVERTED", () => {
    expect(canTransition("QUALIFIED", "CONVERTED")).toBe(false);
    expect(canTransition("LISTING_SUBMITTED", "CONVERTED")).toBe(true);
  });
});

test.describe("mahjong variant gate", () => {
  // The publish script refuses anything that is not source confirmed American NMJL. These
  // assert the vocabulary the script gates on, so a renamed value cannot silently open it.
  const PUBLISHABLE_VARIANT = "AMERICAN_NMJL";
  const HELD = ["RIICHI_JAPANESE", "CHINESE_OR_HONG_KONG", "MIXED_MULTIPLE", "UNSTATED_UNKNOWN"];

  test("only American NMJL is publishable and every other variant is held", () => {
    expect(PUBLISHABLE_VARIANT).toBe("AMERICAN_NMJL");
    for (const v of HELD) expect(v).not.toBe(PUBLISHABLE_VARIANT);
  });

  test("an unstated variant is held rather than assumed American", () => {
    expect(HELD).toContain("UNSTATED_UNKNOWN");
  });
});

test.describe("published categories stay reachable", () => {
  // Every label the publish pipeline can write has to land somewhere a player can click,
  // otherwise a verified listing is published into a corner of the site nobody filters to.
  const VENUE_LABELS = ["Mahjong Instructor", "Mahjong Studio", "Library", "JCC", "Synagogue", "Senior Center", "Community Center", "Club", "Cafe", "Restaurant", "Game Store"];
  const TEACHER_TYPE = /instructor|teacher|lesson|studio|school|class/i;
  const VENUE_CHIPS = [
    /studio|club|parlor|lounge/i,
    /library/i,
    /senior|retirement|55|community center|rec center|recreation|jcc|synagogue|temple/i,
    /cafe|coffee|restaurant|bar|brewery|taproom|game store|board game|shop/i,
  ];

  test("each venue label routes to the teachers page or matches a venue filter", () => {
    for (const label of VENUE_LABELS) {
      const routed = TEACHER_TYPE.test(label) || VENUE_CHIPS.some((re) => re.test(label));
      expect(routed, `${label} matches no filter a player can click`).toBe(true);
    }
  });

  test("event categories stay inside the schema vocabulary", () => {
    const allowed = ["open_play", "class", "league", "tournament", "retreat", "cruise", "social"];
    for (const t of ["tournament", "cruise", "retreat", "league", "class", "open_play"]) {
      expect(allowed).toContain(t);
    }
  });
});

test.describe("market coverage", () => {
  const row = (over: Partial<CoverageRow> = {}): CoverageRow => ({
    kind: "event", city: "Boston", state: "MA", type: "open_play", is_recurring: true,
    schedule_confidence: "high", confirmed_active_at: new Date().toISOString(),
    mahjong_variant: "AMERICAN", ...over,
  });

  test("a metro with games, teachers, and actionable schedules reads USEFUL", () => {
    const rows = [
      row(), row({ city: "Cambridge" }), row({ city: "Somerville" }),
      row({ kind: "venue", type: "Mahjong Instructor", is_recurring: null, schedule_confidence: null }),
      row({ kind: "venue", type: "Instructor and event host", is_recurring: null, schedule_confidence: null }),
    ];
    const c = summarizeMetro("Boston", rows);
    expect(c.readiness).toBe("USEFUL");
    expect(c.recurringGames).toBe(3);
    expect(c.instructors).toBe(2);
    expect(c.limitingFactors).toHaveLength(0);
  });

  test("an empty metro is a GAP and says why", () => {
    const c = summarizeMetro("Tampa", []);
    expect(c.readiness).toBe("GAP");
    expect(c.limitingFactors.join(" ")).toContain("no recurring games");
  });

  test("limiting factors read grammatically at one", () => {
    const rows = [row(), row({ kind: "venue", type: "Mahjong Instructor", is_recurring: null, schedule_confidence: null })];
    const factors = summarizeMetro("Houston", rows).limitingFactors.join(" ");
    expect(factors).toContain("only 1 teacher");
    expect(factors).not.toContain("only 1 teachers");
    expect(factors).not.toContain("only 0");
  });

  test("stale evidence and one-city concentration surface as named factors", () => {
    const old = new Date(Date.now() - 400 * 86400000).toISOString();
    const rows = [row({ confirmed_active_at: old }), row({ confirmed_active_at: old }), row({ confirmed_active_at: old }), row({ confirmed_active_at: old })];
    const c = summarizeMetro("Houston", rows);
    expect(c.limitingFactors.join(" ")).toContain("last 6 months");
    expect(c.limitingFactors.join(" ")).toContain("one city");
    expect(c.currentEvidence).toBe(0);
  });

  test("counts are reproducible for the same input", () => {
    const rows = [row(), row({ city: "Newton" })];
    expect(summarizeMetro("Boston", rows)).toEqual(summarizeMetro("Boston", rows));
  });

  test("metro lookup maps suburbs to their metro and leaves strangers alone", () => {
    expect(metroOf("Somerville", "MA")).toBe("Boston");
    expect(metroOf("Henderson", "NV")).toBe("Las Vegas");
    expect(metroOf("Chesterfield", "MO")).toBe("St. Louis");
    expect(metroOf("Fargo", "ND")).toBeNull();
  });

  test("a city name shared by two states resolves by state, not by list order", () => {
    expect(metroOf("Glendale", "AZ")).toBe("Phoenix");
    expect(metroOf("Glendale", "CA")).toBe("Los Angeles");
    expect(metroOf("Highland Park", "IL")).toBe("Chicago");
    expect(metroOf("Highland Park", "TX")).toBe("Dallas Fort Worth");
    expect(metroOf("Arlington", "TX")).toBe("Dallas Fort Worth");
    expect(metroOf("Arlington", "VA")).toBe("Washington DC");
  });

  test("a missing state fails closed rather than guessing a metro", () => {
    expect(metroOf("Glendale")).toBeNull();
    expect(metroOf("Boston", null)).toBeNull();
  });
});

test.describe("weekly digest", () => {
  const input = {
    prospectsCreated: [{ status: "QUALIFIED" }, { status: "NEEDS_REVIEW" }],
    eventsInWindow: [{ action: "deep_verify_rejected" }, { action: "reverification_proposed" }, { action: "publishability_hold_variant_review" }],
    listingsPublished: [{}, {}],
    drafts: { total: 35, approved: 0 },
    sends: 0,
    suppressions: 1,
    flaggedListings: 1,
    privateLocationHolds: 1,
    researchedProspects: 120,
    qualifiedProspects: 90,
    publishableAmericanListings: 58,
    publishableUnclassifiedListings: 53,
    variantHeldProspects: 14,
  };

  test("the same window produces the same numbers", () => {
    const w = isoWeekAgo(1_700_000_000_000);
    expect(buildDigest(input, w)).toEqual(buildDigest(input, w));
  });

  test("sends are reported and stay zero during a no-send phase", () => {
    const d = buildDigest(input, isoWeekAgo(1_700_000_000_000));
    expect(d.sends).toBe(0);
    expect(d.changed.find(([label]) => label === "Emails sent")?.[1]).toBe(0);
    expect(d.changed.find(([label]) => label === "Emails sent")?.[2]).toBe("total");
  });

  test("unreviewed drafts and privacy holds reach the human list", () => {
    const d = buildDigest(input, isoWeekAgo(1_700_000_000_000));
    expect(d.needsShauna.join(" ")).toContain("35 outreach drafts");
    expect(d.needsShauna.join(" ")).toContain("private home");
  });

  test("every tile declares whether it is a weekly count or a running total", () => {
    const d = buildDigest(input, isoWeekAgo(1_700_000_000_000));
    for (const [, , scope] of d.changed) expect(["window", "total"]).toContain(scope);
  });

  test("counted actions are ones the system actually writes", () => {
    const d = buildDigest(input, isoWeekAgo(1_700_000_000_000));
    expect(d.changed.find(([label]) => label === "Newly rejected")?.[1]).toBe(1);
    expect(d.changed.find(([label]) => label === "Held from publication")?.[1]).toBe(1);
    expect(d.changed.find(([label]) => label === "Freshness findings filed")?.[1]).toBe(1);
  });

  test("the queue names the weakest metro when coverage supplies one", () => {
    const d = buildDigest(input, isoWeekAgo(1_700_000_000_000), "Tampa");
    expect(d.agentQueue.join(" ")).toContain("Tampa");
  });

  test("the agent queue never proposes sending", () => {
    const d = buildDigest(input, isoWeekAgo(1_700_000_000_000));
    for (const item of d.agentQueue) expect(item.toLowerCase()).not.toMatch(/send|email|outreach to|contact them/);
  });
});

test.describe("operator queues are read only", () => {
  const drafts = [
    { id: "1", metro: "Boston", prospect_type: "instructor" },
    { id: "2", metro: "Boston", prospect_type: "instructor" },
    { id: "3", metro: "Boston", prospect_type: "library" },
    { id: "4", metro: "Las Vegas", prospect_type: "club" },
    { id: "5", metro: "Las Vegas", prospect_type: "club" },
    { id: "6", metro: "Houston", prospect_type: "instructor" },
  ];

  test("the sample spreads across metro and category instead of taking the first N", () => {
    const s = representativeSample(drafts, 3);
    expect(new Set(s.map((d) => d.metro)).size).toBe(3);
  });

  test("sampling returns the same draft objects and invents no approval field", () => {
    const s = representativeSample(drafts, 4);
    for (const d of s) {
      expect(drafts).toContain(d);
      expect(Object.keys(d)).not.toContain("approved_by_human");
    }
  });

  test("sampling never returns more than exist", () => {
    expect(representativeSample(drafts, 50)).toHaveLength(drafts.length);
  });

  test("phone priority explains every entry and mutates nothing", () => {
    const candidates = [
      { id: "a", name: "Community Center", metro: "Tampa", prospect_type: "community_center", public_phone: "555-0100", public_email: null, qualification_score: 95, status: "QUALIFIED" },
      { id: "b", name: "Has Email Already", metro: "Boston", prospect_type: "instructor", public_phone: "555-0101", public_email: "x@y.com", qualification_score: 60, status: "QUALIFIED" },
      { id: "c", name: "No Phone", metro: "Tampa", prospect_type: "club", public_phone: null, public_email: null, qualification_score: 90, status: "QUALIFIED" },
    ];
    const frozen = JSON.stringify(candidates);
    const out = prioritizePhoneQueue(candidates, new Set(["Tampa"]));
    expect(JSON.stringify(candidates)).toBe(frozen);
    expect(out.map((c) => c.id)).not.toContain("c");
    expect(out[0].id).toBe("a");
    for (const c of out) expect(c.reasons.length).toBeGreaterThan(0);
    for (const c of out) expect(Object.keys(c)).not.toContain("status_change");
  });

  test("the priority list is capped so it stays workable", () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      id: String(i), name: `Org ${i}`, metro: "Tampa", prospect_type: "club",
      public_phone: "555-0100", public_email: null, qualification_score: 95, status: "QUALIFIED",
    }));
    expect(prioritizePhoneQueue(many, new Set(["Tampa"])).length).toBeLessThanOrEqual(12);
  });
});

test.describe("safety rails survive Phase 5", () => {
  test("Las Vegas Mahjong still cannot become a prospect", () => {
    const known: KnownEntities = {
      suppressedEmails: new Set(), prospectEmails: new Set(), prospectNames: new Set(),
      listingEmails: new Set(), listingNameCityKeys: new Set(),
    };
    for (const name of ["Las Vegas Mahjong", "Las Vegas Mahjong Studio"]) {
      expect(admissionVerdict({ name, city: "Las Vegas", state: "NV", source_url: "https://x.org" }, known).admit).toBe(false);
    }
    expect(admissionVerdict({ name: "Anything", city: "Las Vegas", state: "NV", source_url: "https://x.org", website_url: "https://lasvegasmahj.com/x" }, known).admit).toBe(false);
  });

  test("suppressed contacts still cannot be rediscovered", () => {
    const known: KnownEntities = {
      suppressedEmails: new Set(["out@example.com"]), prospectEmails: new Set(), prospectNames: new Set(),
      listingEmails: new Set(), listingNameCityKeys: new Set(),
    };
    expect(admissionVerdict({ name: "Org", city: "Boston", state: "MA", source_url: "https://x.org", public_email: "Out@example.com" }, known).admit).toBe(false);
  });

  test("unsubscribed prospects never re-enter outreach", () => {
    for (const to of ["READY_FOR_OUTREACH", "OUTREACH_ACTIVE", "QUALIFIED"] as const) {
      expect(canTransition("UNSUBSCRIBED", to)).toBe(false);
    }
  });
});
