import { parseAskIntent, validateIntent, type AskIntent } from "@/lib/ask-intent";
import { synthesisDigitGuard } from "@/lib/rules/lookup";

// Optional model refinement for intent extraction. Ships dormant: without ANTHROPIC_API_KEY
// every question goes through the deterministic parser, and the site behaves identically.
// The model never sees the database and never produces answer text; it returns only a filter
// object that must pass validateIntent, so it cannot invent a fact or widen a query beyond
// what deterministic search supports.

const MODEL = "claude-haiku-4-5-20251001";

const MONTH_RE = /\b(january|february|march|april|june|july|august|september|october|november|december)\b|\b(in|every|each|late|early|mid) may\b/i;

export async function rephraseApprovedAnswer(approved: string, question: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return approved;
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
          "Rephrase the approved mahjong rules answer so it directly addresses the player's question. " +
          "Use ONLY facts present in the approved answer. Never add, remove, or change a rule, a number, or a tile name. " +
          "Plain language, active voice, no dashes, no month names. Respond with the rephrased answer text only.",
        messages: [
          { role: "user", content: `Question: ${question.slice(0, 200)}\n\nApproved answer: ${approved}` },
        ],
      }),
    });
    if (!res.ok) return approved;
    const body = await res.json();
    const text = String(body?.content?.[0]?.text ?? "").trim();
    if (!text) return approved;
    if (!synthesisDigitGuard(approved, text)) return approved;
    if (MONTH_RE.test(text) && !MONTH_RE.test(approved)) return approved;
    if (/[–—]/.test(text)) return approved;
    return text;
  } catch {
    return approved;
  }
}

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
