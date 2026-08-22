import crypto from "crypto";

// Hashing both sides first keeps the compared buffers the same length, so a header that is
// not plain ASCII cannot make timingSafeEqual throw its way past the check.
export function cronRequestAuthorized(authorizationHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const digest = (v: string) => crypto.createHash("sha256").update(v).digest();
  return crypto.timingSafeEqual(digest(authorizationHeader || ""), digest(`Bearer ${secret}`));
}
