import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { classifyTopic, coreIdentity, lookup, CORE_VERSION, RULES_KNOWLEDGE, isPending } from "../lib/ask-core/index.ts";
import { FMG_SITE, directorySignal } from "../lib/ask-site";

// The Find My Mahj overlay on the shared core. The core has its own tests (mahj-ask-core);
// these prove this site's use of it: the directory hook keeps searches out of the rules
// engine, the vendored copy's identity, and the client boundary. Pure logic, no server:
//   PLAYWRIGHT_BASE_URL=http://localhost:9 npx playwright test tests/ask-core-site.spec.ts --project=desktop-chromium

const hooks = { discoverySignal: FMG_SITE.discoverySignal };

test.describe("vendored core", () => {
  test("the lock and the vendored version agree", () => {
    const lock = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../ask-core.lock.json"), "utf8"));
    expect(lock.version).toBe(CORE_VERSION);
    expect(Object.keys(lock.files).length).toBeGreaterThan(10);
  });

  test("identity is stable and secret free; no site override is in force here", () => {
    const id = coreIdentity();
    expect(id.core_version).toBe(CORE_VERSION);
    expect(id.corpus_fingerprint).toMatch(/^[0-9a-f]{16}$/);
    expect(id.behavior_fingerprint).toMatch(/^[0-9a-f]{16}$/);
    expect(id.entries).toBeGreaterThan(80);
    expect(FMG_SITE.overrides).toEqual([]);
    expect(JSON.stringify(id)).not.toMatch(/sk-ant|ANTHROPIC|key/i);
  });
});

test.describe("directory questions stay directory questions", () => {
  const probes = [
    "Do I have to pay to play mahjong in Naples?",
    "do i pay to play mahjong at the club",
    "Is East Naples in your directory?",
    "what time is east side mahjong in Boca",
    "How much are lessons near Phoenix?",
    "Any games in East Hampton this Saturday?",
    "any tips for finding a game in Naples",
    "which direction is the club from downtown Sarasota",
    "I am out of tiles, where can I buy a set in Phoenix",
    "best way to meet other players in Boca Raton",
    "What suits me best, a class or open play in Tampa",
    "who is the authority on mahjong groups in Austin",
    "I don't want it too far, games in Naples",
    "the mahjong club address is wrong, who fixes listings",
    "We are three players looking for a fourth in Naples",
    "Any games for 2 players in Boca?",
    "Is there a mahjong meetup for 5 people in Austin",
    "Can they hold a spot for me if I call ahead?",
    "Who goes first on the waitlist for the Boca game?",
    "Looking for a game with official rules in Phoenix",
    "Do I need to call it in to reserve a seat?",
    "Which tiles set should I buy for lessons?",
    "Can I show up before the game starts to get a lesson?",
    "Do you offer hands-on lessons and take a credit card?",
    "Three of us want to learn, any teachers near Boca?",
    "Charlestown mahjong groups?",
    "Charlton games on Tuesday?",
    "never mind, where can I play in Boca?",
    "Is there tournament play near Naples?",
    "tournament play near Naples FL",
    "Is there a tournament director near me?",
    "Mahjong Made Easy classes near Naples",
    "does mahjong suit beginners",
    "which club suits my game night in Naples",
    "where can I buy a set with blanks",
    "looking for a 3 player group in Henderson",
    "do you have a 3 person class",
    "how much for a three person lesson",
    "what is the price for an extra tile set",
    "can I get an extra tile set at the store",
    "can you hold my spot until I call the teacher",
    "is there a 3 person game near me",
    "3 handed groups near 89138",
    "we need an extra tile set",
    "I have an extra tile set to donate",
    "do people talk or play silently",
    "do I have to say anything before I play",
    "how long do I wait for a call back about lessons",
    "do I announce myself or just call the venue",
    "do I have to wait long to get a call back",
    "Where can I play Saturday morning near Naples?",
    "Find an instructor near Phoenix",
    "games near Blind Pass",
    "Any groups in Blind Pass?",
    "find a 3 player group",
    "find a game near us",
    "where can I play in Sheboygan Falls",
    "mahjong in 33101",
  ];
  for (const q of probes) {
    test(`directory: ${q}`, () => {
      expect(classifyTopic(q, hooks), q).toBe("other");
    });
  }

  test("a rules question inside a tournament is a rules question, and a mixed question is mixed", () => {
    expect(classifyTopic("Can I blind pass in a tournament?", hooks)).toBe("rules");
    expect(classifyTopic("can I use a joker in a pair and where can I play near Naples", hooks)).toBe("mixed");
    expect(classifyTopic("Where can I play riichi mahjong in Austin?", hooks)).toBe("mixed");
    expect(directorySignal("Where can I play Saturday morning near Naples?", false)).toBe(true);
    expect(directorySignal("Can I blind pass in a tournament?", true)).toBe(false);
  });

  test("every canonical rule answers its own question from this site's hook", () => {
    for (const e of RULES_KNOWLEDGE) {
      expect(classifyTopic(e.questions[0], hooks), e.questions[0]).not.toBe("other");
      const r = lookup({ question: e.questions[0] });
      // Two owner-approved wordings for one question resolve to the higher-ranked one here
      // (payments-basics over the Las Vegas Mahjong scenario entries); the core proves the
      // other site gets its own entry under its override.
      const accepted = [e.id, ...(e.equivalents ?? [])];
      expect(accepted, e.questions[0]).toContain(r.entry?.id);
      if (isPending(e) && r.entry?.id === e.id) expect(r.label, e.id).toBe("pending");
    }
  });
});

test.describe("server-only boundary", () => {
  test("client components import only the labels and clarify-type leaves of the core", () => {
    const roots = ["app", "components"].map((d) => path.resolve(__dirname, "..", d));
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(name)) {
          const src = fs.readFileSync(p, "utf8");
          const client = /^\s*["']use client["']/m.test(src);
          if (client && /from ["']@\/lib\/ask-core\/(?!engine\/labels\.ts|engine\/clarify\.ts)/.test(src)) offenders.push(p);
          if (client && /lib\/(ask-site|ask-model-client|ask-llm|ask-intent)/.test(src)) offenders.push(p);
        }
      }
    };
    roots.forEach(walk);
    expect(offenders).toEqual([]);
  });
});
