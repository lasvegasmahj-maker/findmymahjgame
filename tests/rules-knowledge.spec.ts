import { test, expect } from "@playwright/test";
import { RULES_KNOWLEDGE } from "../lib/rules/knowledge";
import { lookupRule, summarizeRulesGap, synthesisDigitGuard } from "../lib/rules/lookup";

// The rules knowledge base ships owner-approved text only, so these checks encode the
// hard mahjong facts from CLAUDE.md as assertions. Pure logic, no browser.

const MONTH_RE =
  /\b(january|february|march|april|june|july|august|september|october|november|december)\b|\b(in|every|each|late|early|mid) may\b/i;
const DASH_RE = /[–—]/;
const LETTER_CODE_RE = /\b[PKN]\b/;

function allText(entry: (typeof RULES_KNOWLEDGE)[number]): string {
  return [entry.topic, entry.approved_answer, entry.house_note ?? ""].join(" ");
}

test.describe("knowledge base fact checks", () => {
  test("entry count stays in the seeded range", () => {
    expect(RULES_KNOWLEDGE.length).toBeGreaterThanOrEqual(12);
    expect(RULES_KNOWLEDGE.length).toBeLessThanOrEqual(20);
  });

  test("every entry is well formed and owner approved", () => {
    const seen = new Set<string>();
    for (const e of RULES_KNOWLEDGE) {
      expect(e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(seen.has(e.id)).toBe(false);
      seen.add(e.id);
      expect(e.ruleset).toBe("american_nmjl");
      expect(e.source).toBe("owner_approved");
      expect(e.last_verified).toBe("2026-08-22");
      expect(["high", "medium"]).toContain(e.confidence);
      expect(e.question_patterns.length).toBeGreaterThan(0);
      expect(e.approved_answer.length).toBeGreaterThan(20);
      if (e.house_note) expect(e.varies_by_house).toBe(true);
    }
  });

  test("no answer names a month, uses a dash, or uses letter set codes", () => {
    for (const e of RULES_KNOWLEDGE) {
      const text = allText(e);
      expect(text).not.toMatch(MONTH_RE);
      expect(text).not.toMatch(DASH_RE);
      expect(text).not.toMatch(LETTER_CODE_RE);
    }
  });

  test("any full set count is 152, never another total", () => {
    for (const e of RULES_KNOWLEDGE) {
      for (const num of allText(e).match(/\b\d{3}\b/g) ?? []) {
        expect(num).toBe("152");
      }
    }
    const tileCount = RULES_KNOWLEDGE.find((e) => e.id === "tile-count");
    expect(tileCount?.approved_answer).toContain("152");
  });

  test("dragons map to the correct suits", () => {
    const dragons = RULES_KNOWLEDGE.find((e) => e.id === "dragons");
    expect(dragons).toBeTruthy();
    const a = dragons!.approved_answer;
    expect(a).toMatch(/Red dragon goes with Craks/);
    expect(a).toMatch(/Green dragon goes with Bams/);
    expect(a).toMatch(/White dragon, called the Soap, goes with Dots/);
  });

  test("flowers are interchangeable and unnumbered", () => {
    const flowers = RULES_KNOWLEDGE.find((e) => e.id === "flowers");
    expect(flowers?.approved_answer).toMatch(/interchangeable/i);
    expect(flowers?.approved_answer).toMatch(/not numbered/i);
  });

  test("dealing states 13 tiles per player and 14 for East", () => {
    const dealing = RULES_KNOWLEDGE.find((e) => e.id === "dealing");
    expect(dealing?.approved_answer).toContain("13");
    expect(dealing?.approved_answer).toContain("14");
    expect(dealing?.approved_answer).toMatch(/East/);
  });

  test("set sizes are written as numbers with their names", () => {
    const jokers = RULES_KNOWLEDGE.find((e) => e.id === "jokers-basics");
    expect(jokers?.approved_answer).toMatch(/Pung, Kong, Quint, or Sextet/);
    expect(jokers?.approved_answer).toMatch(/3 or more/);
  });
});

test.describe("rules lookup", () => {
  test("joker in a pair returns the approved answer with high confidence", () => {
    const r = lookupRule({ question: "Can a joker be used in a pair?" });
    expect(r.matched).toBe(true);
    expect(r.entry_id).toBe("joker-in-pair");
    expect(r.confidence).toBe("high");
    expect(r.answer).toMatch(/never be used in a pair/i);
    expect(r.source).toBe("owner_approved");
  });

  test("Charleston question matches the Charleston entry", () => {
    const r = lookupRule({ question: "What is the Charleston?" });
    expect(r.matched).toBe(true);
    expect(r.entry_id).toBe("charleston");
    expect(r.answer).toMatch(/passes 3 tiles right/i);
  });

  test("annual card contents are refused, not reconstructed", () => {
    const r = lookupRule({ question: "What are the hands on this year's card?" });
    expect(r.matched).toBe(false);
    expect(r.confidence).toBe("unsupported");
    expect(r.unsupported_reason).toBe("annual_card_content");
    expect(r.answer).toMatch(/National Mah Jongg League/);
    expect(r.answer).not.toMatch(/\d/);
    expect(r.answer).not.toMatch(/\b(bams?|craks?|dots?|dragons?|winds?|jokers?|flowers?)\b/i);
    expect(r.answer).not.toMatch(MONTH_RE);
  });

  test("card guard catches other phrasings for card content", () => {
    for (const q of [
      "List the categories on the current card",
      "Can you send me a copy of the card?",
      "Tell me the line values on the card",
    ]) {
      const r = lookupRule({ question: q });
      expect(r.confidence).toBe("unsupported");
      expect(r.unsupported_reason).toBe("annual_card_content");
    }
  });

  test("general card questions still get the spring answer with no month", () => {
    const r = lookupRule({ question: "When does the new card come out?" });
    expect(r.matched).toBe(true);
    expect(r.entry_id).toBe("annual-card");
    expect(r.answer).toMatch(/every spring/i);
    expect(r.answer).not.toMatch(MONTH_RE);
  });

  test("riichi phrasing asks for clarification instead of answering", () => {
    const r = lookupRule({ question: "How does riichi declaration work?" });
    expect(r.matched).toBe(false);
    expect(r.needs_clarification).toBeTruthy();
    expect(r.needs_clarification).toMatch(/American mahjong/);
  });

  test("saying American skips the variant clarification", () => {
    const r = lookupRule({ question: "In American mahjong, not Chinese, how many tiles are in a set?" });
    expect(r.needs_clarification).toBeFalsy();
    expect(r.matched).toBe(true);
    expect(r.entry_id).toBe("tile-count");
  });

  test("unknown rule fails honestly with cannot verify", () => {
    const r = lookupRule({ question: "What happens if my elbow knocks over the rack?" });
    expect(r.matched).toBe(false);
    expect(r.confidence).toBe("low");
    expect(r.answer).toMatch(/cannot verify/i);
  });

  test("same question twice returns identical output", () => {
    for (const q of [
      "Can a joker be used in a pair?",
      "What is the Charleston?",
      "What are the hands on this year's card?",
      "What happens if my elbow knocks over the rack?",
    ]) {
      expect(JSON.stringify(lookupRule({ question: q }))).toBe(JSON.stringify(lookupRule({ question: q })));
    }
  });

  test("specific entries beat broad ones", () => {
    const r = lookupRule({ question: "What is a wall game?" });
    expect(r.entry_id).toBe("wall-game");
  });
});

test.describe("synthesis digit guard", () => {
  const approved = "Each player starts with 13 tiles, except East, the dealer, who starts with 14.";

  test("rejects output containing a digit not present in the input", () => {
    expect(synthesisDigitGuard(approved, "You start with 15 tiles.")).toBe(false);
    expect(synthesisDigitGuard(approved, "The set has 152 tiles.")).toBe(false);
  });

  test("accepts output whose digits all appear in the input", () => {
    expect(synthesisDigitGuard(approved, "East starts with 14 tiles and everyone else starts with 13.")).toBe(true);
    expect(synthesisDigitGuard(approved, "East is the dealer and draws first.")).toBe(true);
  });
});

test.describe("gap telemetry summary", () => {
  test("strips emails and digits, lowercases, and caps at 120 chars", () => {
    const s = summarizeRulesGap("Email JANE.DOE@example.com about the 2026 card rules " + "x".repeat(200));
    expect(s).not.toMatch(/@/);
    expect(s).not.toMatch(/\d/);
    expect(s).toBe(s.toLowerCase());
    expect(s.length).toBeLessThanOrEqual(120);
    expect(s).toContain("card rules");
  });

  test("summary is deterministic", () => {
    const q = "Can I pass a joker in the Charleston?";
    expect(summarizeRulesGap(q)).toBe(summarizeRulesGap(q));
  });
});
