import { test, expect } from "@playwright/test";
import { canPublishToAmericanDirectory, canPlayerJoin, normalizeVariant, isMahjongVariant, variantLabel, MAHJONG_VARIANTS } from "../lib/mahjong-variant";
import { detectPrivateLocation, redactStreetDetail } from "../lib/private-location";
import { summarizeMetro, metroOf, type CoverageRow } from "../lib/market-coverage";
import { buildDigest, isoWeekAgo } from "../lib/growth-digest";

// Phase 6 answers one question in code: may this entity go in front of a player? The two ways
// to get it wrong are publishing a game they cannot join and publishing a home they should
// not be sent to.

test.describe("the variant gate", () => {
  test("only American may publish, and every other variant is refused with a reason", () => {
    expect(canPublishToAmericanDirectory("AMERICAN").allowed).toBe(true);
    for (const v of ["AMERICAN_NON_NMJL", "RIICHI", "SICHUAN", "GUANGDONG", "CHINESE_OTHER", "OTHER"]) {
      const verdict = canPublishToAmericanDirectory(v);
      expect(verdict.allowed, `${v} must not publish`).toBe(false);
      expect(verdict.reason.length).toBeGreaterThan(0);
    }
  });

  test("unknown is never treated as American", () => {
    const verdict = canPublishToAmericanDirectory("UNKNOWN");
    expect(verdict.allowed).toBe(false);
    expect(verdict.reason).toContain("unknown");
    expect(canPublishToAmericanDirectory(null).allowed).toBe(false);
    expect(canPublishToAmericanDirectory(undefined).allowed).toBe(false);
    expect(canPublishToAmericanDirectory("").allowed).toBe(false);
  });

  test("a low confidence American read is a guess, not evidence", () => {
    expect(canPublishToAmericanDirectory("AMERICAN", "low").allowed).toBe(false);
    expect(canPublishToAmericanDirectory("AMERICAN", "medium").allowed).toBe(true);
    expect(canPublishToAmericanDirectory("AMERICAN", "high").allowed).toBe(true);
  });

  test("an unrecognized value degrades to unknown rather than passing through", () => {
    expect(normalizeVariant("AMERICAN_NMJL")).toBe("UNKNOWN");
    expect(normalizeVariant("anything else")).toBe("UNKNOWN");
    expect(normalizeVariant(42)).toBe("UNKNOWN");
    expect(isMahjongVariant("AMERICAN")).toBe(true);
    expect(isMahjongVariant("NMJL")).toBe(false);
  });

  test("every variant in the vocabulary has a label a person can read", () => {
    for (const v of MAHJONG_VARIANTS) expect(variantLabel(v).length).toBeGreaterThan(3);
  });
});

test.describe("participation and privacy gates", () => {
  test("a game with no evidence outsiders may attend cannot publish", () => {
    expect(canPlayerJoin("YES_EXPLICIT").allowed).toBe(true);
    expect(canPlayerJoin("YES_IMPLIED").allowed).toBe(true);
    expect(canPlayerJoin("NO").allowed).toBe(false);
    expect(canPlayerJoin("UNKNOWN").allowed).toBe(false);
    expect(canPlayerJoin(undefined).allowed).toBe(false);
    expect(canPlayerJoin("").allowed).toBe(false);
  });

  test("a private residence never reaches players through the normal publish path", () => {
    expect(canPlayerJoin("YES_EXPLICIT", "PRIVATE_RESIDENCE").allowed).toBe(false);
    expect(canPlayerJoin("YES_EXPLICIT", "PUBLIC_COMMUNITY").allowed).toBe(true);
  });

  test("a residents only or members only program needs a source saying outsiders may come", () => {
    expect(canPlayerJoin("UNKNOWN", "RESIDENTS_ONLY").allowed).toBe(false);
    expect(canPlayerJoin("UNKNOWN", "MEMBERS_ONLY").allowed).toBe(false);
    expect(canPlayerJoin("YES_EXPLICIT", "MEMBERS_ONLY").allowed).toBe(true);
  });

  test("a private residence never publishes through the normal path", () => {
    const s = detectPrivateLocation({ venue: "Private residence in Naples" });
    expect(s.isPrivateResidence).toBe(true);
  });

  test("a home address never survives into public text", () => {
    // Fictional on purpose. A test for suppressing home addresses must not carry a real one.
    const out = redactStreetDetail("Private residence at 1428 Elm Street, use the white door");
    expect(out).not.toMatch(/1428/);
    expect(out).not.toMatch(/Elm Street/);
  });

  test("schedule text is screened for street detail like any other public field", () => {
    const s = detectPrivateLocation({ day_time: "Thursdays 1pm at 1428 Elm Street" });
    expect(s.hasStreetDetail).toBe(true);
    expect(s.fields).toContain("day_time");
  });
});

test.describe("coverage counts player value, not CRM rows", () => {
  const row = (over: Partial<CoverageRow> = {}): CoverageRow => ({
    kind: "event", city: "Houston", state: "TX", type: "open_play", is_recurring: true,
    schedule_confidence: "high", confirmed_active_at: new Date().toISOString(),
    mahjong_variant: "AMERICAN", ...over,
  });

  test("confirmed American, unclassified, and non-American are counted separately", () => {
    const c = summarizeMetro("Houston", [
      row(), row({ mahjong_variant: "UNKNOWN" }), row({ mahjong_variant: null }), row({ mahjong_variant: "RIICHI" }),
    ]);
    expect(c.americanConfirmed).toBe(1);
    expect(c.variantUnclassified).toBe(2);
    expect(c.notCovered).toBe(1);
    expect(c.total).toBe(4);
  });

  test("a non-American listing surfaces as a named limiting factor", () => {
    const c = summarizeMetro("Houston", [row(), row(), row({ mahjong_variant: "RIICHI" })]);
    expect(c.limitingFactors.join(" ")).toContain("this directory does not cover");
  });

  test("variant-held and privacy-held prospects are reported, never counted as coverage", () => {
    const c = summarizeMetro("Las Vegas", [row({ city: "Las Vegas", state: "NV" })], {
      variantHeldProspects: 9,
      privateGameHolds: 2,
    });
    expect(c.variantHeldProspects).toBe(9);
    expect(c.privateGameHolds).toBe(2);
    expect(c.total).toBe(1);
    expect(c.americanConfirmed).toBe(1);
    expect(c.limitingFactors.join(" ")).toContain("held because the mahjong variant");
    expect(c.limitingFactors.join(" ")).toContain("pending host intent");
  });

  test("a monthly game with a named day and time is something a player can act on", () => {
    const monthly = row({ schedule_confidence: "medium", is_recurring: false, day_of_week: null, day_time: "Third Thursday of the month, 6:30 to 7:45 PM" });
    expect(summarizeMetro("Boston", [monthly]).strongSchedules).toBe(1);
    const vague = row({ schedule_confidence: "medium", is_recurring: false, day_of_week: null, day_time: "Tuesdays by appointment only, 1:00 PM" });
    expect(summarizeMetro("Boston", [vague]).strongSchedules).toBe(0);
  });

  test("a teacher counts whether their listing is a profile or a scheduled class", () => {
    const asVenue = summarizeMetro("St. Louis", [row({ kind: "venue", city: "St. Louis", state: "MO", type: "Mahjong Instructor", is_recurring: null, schedule_confidence: null })]);
    const asClass = summarizeMetro("St. Louis", [row({ city: "St. Louis", state: "MO", type: "class" })]);
    expect(asVenue.instructors).toBe(1);
    expect(asClass.instructors).toBe(1);
  });

  test("class listings cannot fill both the teacher gate and the games gate", () => {
    const classes = [1, 2, 3].map(() => row({ type: "class" }));
    const c = summarizeMetro("Houston", classes);
    expect(c.instructors).toBe(3);
    expect(c.recurringGames).toBe(0);
    expect(c.readiness).not.toBe("USEFUL");
  });

  test("a finished one-off event is not actionable, whatever its schedule text says", () => {
    const past = row({
      schedule_confidence: "medium", is_recurring: false, day_of_week: null,
      day_time: "Saturday, 10:00 AM", event_date: new Date(Date.now() - 180 * 86400000).toISOString(),
    });
    expect(summarizeMetro("Houston", [past]).strongSchedules).toBe(0);
  });

  test("a paused game is not something a player can act on", () => {
    const paused = row({ schedule_confidence: "high", is_recurring: true, day_of_week: ["tuesday"], day_time: "Tuesdays at 1:00 PM, no sessions currently scheduled" });
    expect(summarizeMetro("Southwest Florida", [paused]).strongSchedules).toBe(0);
  });

  test("a metro whose games are all a variant we do not cover is never USEFUL", () => {
    const riichi = [1, 2, 3, 4].map(() => row({ mahjong_variant: "RIICHI" }));
    const c = summarizeMetro("Boston", [...riichi, row({ kind: "venue", type: "Mahjong Instructor", mahjong_variant: "RIICHI", is_recurring: null, schedule_confidence: null }), row({ kind: "venue", type: "Mahjong Instructor", mahjong_variant: "RIICHI", is_recurring: null, schedule_confidence: null })]);
    expect(c.recurringGames).toBeGreaterThanOrEqual(3);
    expect(c.readiness).not.toBe("USEFUL");
    expect(c.americanConfirmed).toBe(0);
  });

  test("an unclassified metro is not counted as coverage either", () => {
    const unknown = [1, 2, 3].map(() => row({ mahjong_variant: null }));
    expect(summarizeMetro("Tampa", unknown).readiness).not.toBe("USEFUL");
  });

  test("the three closed metros map their suburbs correctly", () => {
    expect(metroOf("Katy", "TX")).toBe("Houston");
    expect(metroOf("Sugar Land", "TX")).toBe("Houston");
    expect(metroOf("Des Peres", "MO")).toBe("St. Louis");
    expect(metroOf("Webster Groves", "MO")).toBe("St. Louis");
    expect(metroOf("Clearwater", "FL")).toBe("Tampa");
    expect(metroOf("Temple Terrace", "FL")).toBe("Tampa");
  });
});

test.describe("the digest separates research from coverage", () => {
  const input = {
    prospectsCreated: [{ status: "QUALIFIED" }],
    eventsInWindow: [{ action: "publishability_hold_variant_unknown" }],
    listingsPublished: [{}, {}],
    drafts: { total: 29, approved: 0 },
    sends: 0,
    suppressions: 1,
    flaggedListings: 4,
    privateLocationHolds: 4,
    researchedProspects: 120,
    qualifiedProspects: 90,
    publishableAmericanListings: 76,
    publishableUnclassifiedListings: 52,
    variantHeldProspects: 18,
  };

  test("prospect counts and publishable listing counts are distinct tiles", () => {
    const d = buildDigest(input, isoWeekAgo(1_700_000_000_000));
    const labels = d.changed.map(([l]) => l);
    expect(labels).toContain("Prospects on file");
    expect(labels).toContain("Qualified or further along");
    expect(labels).toContain("Published American Mahjong listings");
    expect(labels).toContain("Held on mahjong variant");
    const researched = d.changed.find(([l]) => l === "Prospects on file")?.[1];
    const published = d.changed.find(([l]) => l === "Published American Mahjong listings")?.[1];
    expect(researched).toBe(120);
    expect(published).toBe(76);
    expect(researched).toBeGreaterThan(published as number);
  });

  test("the unclassified count sits beside the American count so neither reads alone", () => {
    const d = buildDigest(input, isoWeekAgo(1_700_000_000_000));
    const labels = d.changed.map(([l]) => l);
    expect(labels).toContain("Published listings not yet classified");
    expect(d.changed.find(([l]) => l === "Published listings not yet classified")?.[1]).toBe(52);
  });

  test("variant holds reach the list of things waiting on a person", () => {
    const d = buildDigest(input, isoWeekAgo(1_700_000_000_000));
    expect(d.needsShauna.join(" ")).toContain("mahjong variant");
  });

  test("sends stay zero and are reported as a running total", () => {
    const d = buildDigest(input, isoWeekAgo(1_700_000_000_000));
    const sends = d.changed.find(([l]) => l === "Emails sent");
    expect(sends?.[1]).toBe(0);
    expect(sends?.[2]).toBe("total");
  });

  test("the digest is reproducible for the same window", () => {
    const w = isoWeekAgo(1_700_000_000_000);
    expect(buildDigest(input, w)).toEqual(buildDigest(input, w));
  });
});
