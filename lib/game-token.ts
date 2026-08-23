import crypto from "crypto";
import { getHmacSecret } from "@/lib/hmac";

// Signed one-click "did you play?" links for emails and the table page.
export function signGameToken(tableId: string, answer: "yes" | "no"): string {
  const expires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const payload = `played:${tableId}:${answer}:${expires}`;
  const sig = crypto.createHmac("sha256", getHmacSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyGameToken(token: string): { tableId: string; answer: "yes" | "no" } | null {
  try {
    const parts = Buffer.from(token, "base64url").toString("utf8").split(":");
    if (parts.length !== 5) return null;
    const [label, tableId, answer, expiresStr, sig] = parts;
    if (label !== "played" || (answer !== "yes" && answer !== "no")) return null;
    // See lib/admin-auth.ts: Buffer.from(sig, "hex") truncates instead of
    // rejecting on trailing garbage, so pin the exact digest length first.
    if (sig.length !== 64) return null;
    const expected = crypto.createHmac("sha256", getHmacSecret()).update(`${label}:${tableId}:${answer}:${expiresStr}`).digest("hex");
    const a = Buffer.from(sig, "hex");
    const e = Buffer.from(expected, "hex");
    if (a.length !== e.length || !crypto.timingSafeEqual(a, e)) return null;
    if (Date.now() > parseInt(expiresStr, 10)) return null;
    return { tableId, answer };
  } catch {
    return null;
  }
}

// Generalized one-click action tokens: one namespace for every email action
// so claim, match-approve, still-running, and future actions share one
// verified pattern instead of growing parallel token files.
const ACTIONS = ["match-approve", "match-skip", "claim", "still-running", "ended", "unsub"] as const;
export type ActionKind = (typeof ACTIONS)[number];

export function signActionToken(action: ActionKind, subjectId: string, ttlDays = 30): string {
  if (subjectId.includes(":")) throw new Error("subjectId must not contain ':'");
  const expires = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  const payload = `act:${action}:${subjectId}:${expires}`;
  const sig = crypto.createHmac("sha256", getHmacSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyActionToken(token: string): { action: ActionKind; subjectId: string } | null {
  try {
    const parts = Buffer.from(token, "base64url").toString("utf8").split(":");
    if (parts.length !== 5) return null;
    const [label, action, subjectId, expiresStr, sig] = parts;
    if (label !== "act" || !ACTIONS.includes(action as ActionKind)) return null;
    // See lib/admin-auth.ts: Buffer.from(sig, "hex") truncates instead of
    // rejecting on trailing garbage, so pin the exact digest length first.
    if (sig.length !== 64) return null;
    const expected = crypto.createHmac("sha256", getHmacSecret()).update(`${label}:${action}:${subjectId}:${expiresStr}`).digest("hex");
    const a = Buffer.from(sig, "hex");
    const e = Buffer.from(expected, "hex");
    if (a.length !== e.length || !crypto.timingSafeEqual(a, e)) return null;
    if (Date.now() > parseInt(expiresStr, 10)) return null;
    return { action: action as ActionKind, subjectId };
  } catch {
    return null;
  }
}
