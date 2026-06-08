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
