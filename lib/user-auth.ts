import crypto from "crypto";
import { getHmacSecret } from "@/lib/hmac";

// Player and provider sessions, modeled on the admin session but with a separate cookie and
// a user id inside the payload. The two never mix: nothing that reads this cookie grants
// admin access, and the admin gate never reads this cookie, so a manipulated user session
// cannot escalate.

export const USER_COOKIE = "fmg_user";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const USER_COOKIE_MAX_AGE = Math.floor(TTL_MS / 1000);

export type UserSession = { userId: string; role: "player" | "provider" };

function sign(payload: string): string {
  return crypto.createHmac("sha256", getHmacSecret()).update(payload).digest("hex");
}

export function createUserSessionToken(session: UserSession): string {
  const expires = Date.now() + TTL_MS;
  const payload = `user-session:${session.userId}:${session.role}:${expires}`;
  return Buffer.from(`${payload}:${sign(payload)}`).toString("base64url");
}

export function verifyUserSessionToken(token: string | undefined | null): UserSession | null {
  if (!token) return null;
  try {
    const parts = Buffer.from(token, "base64url").toString("utf8").split(":");
    if (parts.length !== 5) return null;
    const [label, userId, role, expiresStr, sig] = parts;
    if (label !== "user-session") return null;
    if (role !== "player" && role !== "provider") return null;
    // Buffer.from(sig, "hex") stops decoding at the first non-hex character
    // rather than rejecting the string, so garbage appended after a genuine
    // signature (as long as it introduces no extra colon) can still decode
    // to the real 32-byte digest and pass. Requiring the exact hex length
    // closes that off before the lenient decode runs.
    if (sig.length !== 64) return null;
    const expected = sign(`${label}:${userId}:${role}:${expiresStr}`);
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    if (Date.now() > parseInt(expiresStr, 10)) return null;
    return { userId, role };
  } catch {
    return null;
  }
}
