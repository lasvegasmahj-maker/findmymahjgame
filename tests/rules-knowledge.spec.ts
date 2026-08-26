import { test, expect } from "@playwright/test";
import { RULES_KNOWLEDGE } from "../lib/rules/knowledge";
import { lookupRule, summarizeRulesGap, synthesisDigitGuard } from "../lib/rules/lookup";
import { detectAskTopic } from "../lib/ask-intent";

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
    expect(RULES_KNOWLEDGE.length).toBeLessThanOrEqual(25);
  });

  test("every entry is well formed and owner approved", () => {
    const seen = new Set<string>();
    for (const e of RULES_KNOWLEDGE) {
      expect(e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(seen.has(e.id)).toBe(false);
      seen.add(e.id);
      expect(e.ruleset).toBe("american_nmjl");
      expect(e.source).toBe("owner_approved");
      expect(e.last_verified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.last_verified <= new Date().toISOString().slice(0, 10)).toBe(true);
      expect(["high", "medium"]).toContain(e.confidence);
      expect(e.question_patterns.length).toBeGreaterThan(0);
      // A gated entry must be able to score on the concept that gates it, or
      // specificity would select an entry with no matched text and refuse.
      if (e.requires) expect(e.requires.some((re) => e.question_patterns.includes(re)), e.id).toBe(true);
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

// Behavior-class tests for retrieval precedence. Each block generates variants
// (word order, punctuation, casing, line breaks, truncation) from a few seeds so the
// assertions cover a class of phrasings rather than the examples already known.
function variants(seed: string): string[] {
  const out = new Set<string>([seed]);
  out.add(seed.toUpperCase());
  out.add(seed.toLowerCase());
  out.add(seed.replace(/\?$/, "").replace(/\s+/g, "  ") + "??");
  out.add(seed.replace(/ /g, "\n"));
  out.add("Quick question. " + seed);
  out.add(seed + " Thanks!");
  out.add(seed.replace(/'/g, "\u2019").replace(/"/g, "\u201c"));
  return [...out];
}

// The route caps questions at 200 characters before retrieval; a seed padded up to
// that cap still carries its whole meaning and must route the same way.
function padToCap(seed: string): string {
  const filler = "Hi, we are new and my table cannot agree. ";
  let q = seed;
  while ((filler + q).length <= 200) q = filler + q;
  return q;
}

test.describe("retrieval precedence: specific beats generic", () => {
  const closedHand = [
    "Can a closed hand call a discard?",
    "Can I call a discard if I have a closed hand?",
    "Can I call a discard with a closed hand for mahjong?",
    "Can I claim a discard to finish a concealed hand?",
    "Can I pick up a discard with a concealed hand?",
    "Am I allowed to call a discard on a closed hand?",
    "Is claiming a discard allowed for a closed hand?",
    "Can a concealed hand claim the winning discard?",
    "My hand is concealed, can I call the last tile I need?",
    "hand is closed... can I claim?",
    "If my hand is closed, is calling allowed?",
    "Can a closed hand pick up a discard for the last tile to win?",
    "Can a closed hand call a discard, or do I have to trade?",
  ];
  for (const seed of closedHand) {
    test(`closed hand claim question, all variants: ${seed}`, () => {
      for (const q of [...variants(seed), padToCap(seed)]) {
        const r = lookupRule({ question: q });
        expect(r.entry_id, JSON.stringify(q)).toBe("closed-hand-final-tile");
        expect(r.answer, q).toContain("single tile that completes your mahjong");
        expect(detectAskTopic(q.slice(0, 200)), q).not.toBe("directory");
      }
    });
  }

  const blindPass = [
    "Can I do a blind pass?",
    "What is a blind pass?",
    "When is a blind pass allowed?",
    "How does the blind pass work in the Charleston?",
    "Can I pass blind?",
    "Is passing blind legal?",
    "Am I allowed to pass tiles blindly?",
    "Blind passing, when can we do it?",
    "Am I allowed to blind pass?",
    "Do I have to blind pass?",
    "Do I need to blind pass on the last pass?",
    "Can I Blind Pass?",
    "Is a Blind Pass allowed in the Charleston?",
    "Are Blind Passes allowed?",
    "Is Blind Passing legal?",
    "What happens in blind pass?",
    "Can I look at the tiles in blind pass?",
  ];
  for (const seed of blindPass) {
    test(`blind pass question, all variants: ${seed}`, () => {
      for (const q of [...variants(seed), padToCap(seed)]) {
        const r = lookupRule({ question: q });
        expect(r.entry_id, JSON.stringify(q)).toBe("charleston-blind-pass");
        expect(r.answer, q).toContain("does not override the rule against passing jokers");
        expect(detectAskTopic(q.slice(0, 200)), q).not.toBe("directory");
      }
    });
  }

  test("a joker question reaches an answer that states the prohibition, never the bare definition", () => {
    const seeds = [
      "Can I pass a joker?",
      "Can you pass jokers?",
      "Am I allowed to pass a joker?",
      "Is it legal to pass jokers?",
      "Can I pass a joker left?",
      "What if someone passes me a joker?",
      "Can I blind pass a joker?",
      "Can I pass a joker blind?",
      "Is a blind pass with a joker allowed?",
      "Can I hand a joker to the player on my left during passing?",
    ];
    for (const seed of seeds) {
      for (const q of [...variants(seed), padToCap(seed)]) {
        const r = lookupRule({ question: q });
        expect(r.entry_id, JSON.stringify(q)).not.toBe("jokers-basics");
        expect(String(r.answer), q).toMatch(/never pass a joker|rule against passing jokers/i);
      }
    }
  });

  test("the generic entries still win their own broad questions", () => {
    expect(lookupRule({ question: "When can I call a discard?" }).entry_id).toBe("calling-discard");
    expect(lookupRule({ question: "What is the difference between open and closed hands?" }).entry_id).toBe("open-vs-closed");
    expect(lookupRule({ question: "What is a closed hand in mahjong?" }).entry_id).toBe("open-vs-closed");
    expect(lookupRule({ question: "What does concealed mean in mahjong?" }).entry_id).toBe("open-vs-closed");
    expect(lookupRule({ question: "What is the Charleston?" }).entry_id).toBe("charleston");
    expect(lookupRule({ question: "How does the Charleston work?" }).entry_id).toBe("charleston");
    expect(lookupRule({ question: "Can I do a courtesy pass?" }).entry_id).toBe("charleston");
    expect(lookupRule({ question: "What is a joker?" }).entry_id).toBe("jokers-basics");
    expect(lookupRule({ question: "What is a joker? My friend passed one to me." }).entry_id).toBe("jokers-basics");
    expect(lookupRule({ question: "Can a joker pass for any tile?" }).entry_id).toBe("jokers-basics");
    expect(lookupRule({ question: "Can I claim a joker from an exposure with a concealed hand?" }).entry_id).toBe("joker-exchange");
    expect(lookupRule({ question: "Can I use a joker in a pair?" }).entry_id).toBe("joker-in-pair");
    expect(lookupRule({ question: "Can I put a joker in a pair on my rack?" }).entry_id).toBe("joker-in-pair");
    expect(lookupRule({ question: "My friend wants to trade cards. Can I use a joker in a pair?" }).entry_id).toBe("joker-in-pair");
    expect(lookupRule({ question: "We swap seats each game, can I use a joker in a pair?" }).entry_id).toBe("joker-in-pair");
    expect(lookupRule({ question: "Can a joker on my rack be used as a single?" }).entry_id).not.toBe("joker-exchange");
    expect(lookupRule({ question: "Do jokers count in an exposed kong on the rack?" }).entry_id).not.toBe("joker-exchange");
    expect(lookupRule({ question: "Can I exchange a joker from an exposure?" }).entry_id).toBe("joker-exchange");
  });

  test("unrelated questions with overlapping keywords do not reach the specific entries", () => {
    const notClosedHand = [
      "Do I take the final tile from the wall?",
      "When do I take the final tile from the wall?",
      "Is the final tile from the wall a draw?",
      "Can a closed hand take a joker?",
      "Can I take a joker from a closed hand?",
      "When is calling closed?",
      "Is the calling window closed once the next player draws?",
      "Can I still call once the window is closed?",
      "How do I discard from a concealed hand?",
      "Can the final tile give someone mahjong?",
      "Can a concealed hand call a joker exchange?",
      "Can a closed hand exchange a joker from an exposure?",
      "Can I claim a joker from an exposure with a concealed hand?",
      "Can I pick up a joker from an exposure if my hand is closed?",
      "What do you call a closed hand?",
    ];
    for (const seed of notClosedHand) {
      for (const q of variants(seed)) {
        expect(lookupRule({ question: q }).entry_id, JSON.stringify(q)).not.toBe("closed-hand-final-tile");
      }
    }
    const notBlind = [
      "What is a blind spot in strategy?",
      "Passing tiles right, then across, then left?",
      "Who passes first in the Charleston?",
      "My mother is legally blind, can she still pass tiles in the Charleston?",
      "I am color blind, can I pass on the red dragon?",
    ];
    for (const seed of notBlind) {
      for (const q of variants(seed)) {
        expect(lookupRule({ question: q }).entry_id, JSON.stringify(q)).not.toBe("charleston-blind-pass");
      }
    }
  });

  test("Blind Pass the Florida place is a directory search, in every form", () => {
    const places = [
      "Where is Blind Pass Road?",
      "Any mahjong games near Blind Pass Road in Sanibel?",
      "Blind Pass Beach parking?",
      "Blind Pass Estero mahjong",
      "Blind Pass Sanibel",
      "games near Blind Pass",
      "Are there passes near Blind River?",
      "Any day passes Blind River this Saturday?",
      "Are there passes Blind Bay?",
      "Which studios offer hands on lessons, or are they closed for summer?",
      "Are hands-on lessons closed for the holidays in Naples?",
      "second hand set for sale, shop closed",
      "Any groups in Blind Pass?",
      "Teachers around Blind Pass, FL",
      "mahjong blind pass sanibel",
      "groups blind pass fl",
      "blind pass road mahjong",
      "blind pass beach",
      "Blind Pass Road",
      "Are there mahjong groups at Blind Pass?",
      "Is there a teacher by Blind Pass?",
      "Visiting Blind Pass next week, are there any games?",
    ];
    for (const seed of places) {
      for (const q of [seed, seed.replace(/ /g, "\n"), seed + "??"]) {
        expect(detectAskTopic(q.slice(0, 200)), JSON.stringify(q)).toBe("directory");
        expect(lookupRule({ question: q }).entry_id, JSON.stringify(q)).not.toBe("charleston-blind-pass");
      }
    }
  });

  test("ambiguous questions where both broad and narrow match go to the narrow answer", () => {
    for (const q of [
      "When can I call a discard, and does that change with a closed hand?",
      "Explain the Charleston and whether I can pass blind on the last pass.",
      "Jokers are wild, so can I pass one blind?",
    ]) {
      const id = lookupRule({ question: q }).entry_id;
      expect(["closed-hand-final-tile", "charleston-blind-pass"], q).toContain(id);
    }
  });

  test("the generic calling answer and the closed-hand answer cannot contradict each other", () => {
    const calling = RULES_KNOWLEDGE.find((e) => e.id === "calling-discard")!.approved_answer;
    const closed = RULES_KNOWLEDGE.find((e) => e.id === "closed-hand-final-tile")!.approved_answer;
    const openClosed = RULES_KNOWLEDGE.find((e) => e.id === "open-vs-closed")!.approved_answer;
    // The generic answer describes calling for an exposed group or for mahjong and
    // never says a closed hand may call to build a group; both closed-hand texts
    // state the same single exception.
    expect(calling).not.toMatch(/closed|concealed/i);
    expect(closed).toContain("single tile that completes your mahjong");
    expect(openClosed).toContain("single tile that completes your mahjong");
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
