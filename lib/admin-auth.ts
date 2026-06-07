import crypto from "crypto";
import { getHmacSecret } from "@/lib/hmac";

export const ADMIN_COOKIE = "fmg_admin";
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
export const ADMIN_COOKIE_MAX_AGE = Math.floor(TTL_MS / 1000);

function sign(payload: string): string {
  return crypto.createHmac("sha256", getHmacSecret()).update(payload).digest("hex");
}

export function createAdminSessionToken(): string {
  const expires = Date.now() + TTL_MS;
  const payload = `admin-session:${expires}`;
  return Buffer.from(`${payload}:${sign(payload)}`).toString("base64url");
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const parts = Buffer.from(token, "base64url").toString("utf8").split(":");
    if (parts.length !== 3) return false;
    const [label, expiresStr, sig] = parts;
    if (label !== "admin-session") return false;
    const expected = sign(`${label}:${expiresStr}`);
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    return Date.now() <= parseInt(expiresStr, 10);
  } catch {
    return false;
  }
}

// Constant-time password compare that does not throw on length mismatch.
export function passwordMatches(input: unknown, expected: string | undefined): boolean {
  if (typeof input !== "string" || !expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
