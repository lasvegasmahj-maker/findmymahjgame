import { parseAskIntent, validateIntent, type AskIntent } from "@/lib/ask-intent";

// Optional model refinement for intent extraction. Ships dormant: without ANTHROPIC_API_KEY
// every question goes through the deterministic parser, and the site behaves identically.
// The model never sees the database and never produces answer text; it returns only a filter
// object that must pass validateIntent, so it cannot invent a fact or widen a query beyond
// what deterministic search supports.

const MODEL = "claude-haiku-4-5-20251001";

export async function extractIntent(question: string): Promise<{ intent: AskIntent; via: "rules" | "model" }> {
  const deterministic = parseAskIntent(question);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { intent: deterministic, via: "rules" };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      signal: AbortSignal.timeout(6000),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system:
          "Extract mahjong directory search filters from the user question. Respond with ONLY a JSON object: " +
          '{"kind":"events"|"teachers","types":["open_play"|"tournament"|"league"|"retreat"|"class"|"social"]|null,' +
          '"location":string|null,"radiusMiles":5|10|25|50|null,"days":[lowercase day names],"timeOfDay":"morning"|"afternoon"|"evening"|null}. ' +
          "location is a US city, city+state, or 5-digit ZIP mentioned by the user; null if none. Never invent values the question does not contain.",
        messages: [{ role: "user", content: question.slice(0, 200) }],
      }),
    });
    if (!res.ok) return { intent: deterministic, via: "rules" };
    const body = await res.json();
    const text = body?.content?.[0]?.text ?? "";
    const jsonMatch = String(text).match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { intent: deterministic, via: "rules" };
    const candidate = validateIntent(JSON.parse(jsonMatch[0]));
    if (!candidate) return { intent: deterministic, via: "rules" };
    if (candidate.location && !candidate.radiusMiles) candidate.radiusMiles = 25;
    return { intent: candidate, via: "model" };
  } catch {
    return { intent: deterministic, via: "rules" };
  }
}
