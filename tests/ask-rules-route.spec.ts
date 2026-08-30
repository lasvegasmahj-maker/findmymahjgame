import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

// Multi-turn clarification through the REAL Ask route and the real /ask page, not only
// unit-level retrieval. The server keeps no state: the clarification id and the original
// question ride along with each reply.

async function ask(request: APIRequestContext, q: string, clarify?: { id: string; question: string }) {
  const res = await request.post("/api/ask", { data: clarify ? { q, clarify } : { q } });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

test.describe("Ask route: rules clarification turns", () => {
  test("Can I call that tile? -> clarification -> Complete mahjong. -> the correct rule", async ({ request }) => {
    const first = await ask(request, "Can I call that tile?");
    expect(first.ok).toBe(true);
    expect(first.topic).toBe("rules");
    expect(first.rules.clarify.id).toBe("call-purpose");
    expect(first.answer).toBe("Are you calling it to make an exposure, or would it complete mahjong?");
    expect(first.rules.clarify.options.map((o: { label: string }) => o.label)).toEqual(["To make an exposure", "It would complete mahjong"]);
    expect(first.results).toEqual([]);

    const second = await ask(request, "Complete mahjong.", { id: first.rules.clarify.id, question: first.rules.clarify.question });
    expect(second.ok).toBe(true);
    expect(second.via).toBe("rules");
    expect(second.rules.matched).toBe(true);
    expect(second.rules.entry_id).toBe("calling-for-mahjong");
    expect(second.rules.clarify).toBeUndefined();
    expect(second.answer).toMatch(/Any discard that completes your mahjong may be called/);
    expect(second.answer).toMatch(/discarded joker/);
  });

  test("the other branch resolves to the exposure rule", async ({ request }) => {
    const second = await ask(request, "To make an exposure", { id: "call-purpose", question: "Can I call that tile?" });
    expect(second.rules.entry_id).toBe("calling-for-exposure");
    expect(second.answer).toMatch(/group of 3 or more identical tiles/);
  });

  test("another style asks, then yes answers the American rule and no ends honestly", async ({ request }) => {
    const q = "How does the charleston work in Chinese mahjong?";
    const first = await ask(request, q);
    expect(first.rules.clarify.id).toBe("ruleset");
    expect(first.answer).toMatch(/Did you mean American mahjong/);
    const yes = await ask(request, "yes", { id: "ruleset", question: q });
    expect(yes.rules.entry_id).toBe("charleston");
    expect(yes.answer).toMatch(/3 tiles right, then 3 across, then 3 left/);
    const no = await ask(request, "no, Chinese", { id: "ruleset", question: q });
    expect(no.rules.matched).toBe(false);
    expect(no.answer).toMatch(/only verify American mahjong rules/);
  });

  test("tournament context asks which rules, and standard answers the underlying rule", async ({ request }) => {
    const q = "Can I blind pass in a tournament?";
    const first = await ask(request, q);
    expect(first.topic).toBe("rules");
    expect(first.rules.clarify.id).toBe("tournament");
    const std = await ask(request, "Standard League play", { id: "tournament", question: q });
    expect(std.rules.entry_id).toBe("charleston-blind-pass");
  });

  test("an unmatched rules question offers topics; a reply that matches none re-asks", async ({ request }) => {
    const q = "What happens if my elbow knocks over the rack?";
    const first = await ask(request, q);
    expect(first.rules.clarify.id).toBe("topic");
    expect(first.answer).toMatch(/Which part of the game/);
    expect(first.answer).not.toMatch(/cannot verify/i);
    const again = await ask(request, "???", { id: "topic", question: q });
    expect(again.rules.clarify.id).toBe("topic");
    expect(again.answer).toMatch(/^I want to get this right\. Which part of the game is your question about\? You can answer with "/);
  });

  test("a mixed directory-plus-rules question never ships a clarification for the client to act on", async ({ request }) => {
    const r = await ask(request, "Where can I play riichi mahjong in Austin?");
    expect(r.topic).toBe("mixed");
    expect(r.rules?.clarify).toBeUndefined();
    expect(r.rules?.needs_clarification).toBeUndefined();
    expect(r.answer).not.toMatch(/Did you mean American mahjong/);
  });

  test("a malformed clarification object is ignored and the text is answered as a question", async ({ request }) => {
    const r = await ask(request, "Can I use a joker in a pair?", { id: 42 as unknown as string, question: "x" });
    expect(r.rules.entry_id).toBe("joker-in-pair");
  });

  test("responses carry provenance status but never source text or private fields", async ({ request }) => {
    const r = await ask(request, "Can a discarded joker be called?");
    expect(r.rules.entry_id).toBe("joker-discarded");
    expect(r.rules.classification).toBe("standard_nmjl_rule");
    expect(["verified", "owner_review_pending", "owner_question_pending"]).toContain(r.rules.evidence);
    const raw = JSON.stringify(r);
    expect(raw).not.toMatch(/mahjlife|Mahj Life|source_title|source_ref/i);
    for (const f of ["contact_email", "reviewer_notes", "phone", "stripe"]) expect(raw).not.toContain(f);
  });
});

async function askOnPage(page: Page, text: string) {
  await page.getByLabel("Ask where to play or how to play").fill(text);
  await page.getByRole("button", { name: /^(Ask|Reply)$/ }).click();
}

test.describe("/ask page: clarification UI", () => {
  test("the player sees the clarifying question, picks an option, and gets the rule", async ({ page }) => {
    await page.goto("/ask");
    await askOnPage(page, "Can I call that tile?");
    await expect(page.getByRole("status")).toContainText("Are you calling it to make an exposure, or would it complete mahjong?");
    const options = page.getByTestId("ask-clarify").getByRole("button");
    await expect(options).toHaveCount(2);
    await options.filter({ hasText: "It would complete mahjong" }).click();
    await expect(page.getByRole("status")).toContainText("Any discard that completes your mahjong may be called");
    await expect(page.getByTestId("ask-clarify")).toHaveCount(0);
  });

  test("a typed reply also resolves the clarification", async ({ page }) => {
    await page.goto("/ask");
    await askOnPage(page, "Can I call that tile?");
    await expect(page.getByTestId("ask-clarify")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reply" })).toBeVisible();
    await askOnPage(page, "for an exposure");
    await expect(page.getByRole("status")).toContainText("group of 3 or more identical tiles");
  });
});
