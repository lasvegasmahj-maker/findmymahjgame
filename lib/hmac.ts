// Single source for the HMAC signing secret. Fails closed: an unset OR empty
// HMAC_SECRET would otherwise let crypto.createHmac sign with a known/empty key,
// making session and approval tokens forgeable. Require a real secret.
let cached: string | null = null;

export function getHmacSecret(): string {
  if (cached) return cached;
  const s = process.env.HMAC_SECRET;
  if (!s || s.length < 32) {
    throw new Error("HMAC_SECRET is missing or too short (need at least 32 characters)");
  }
  cached = s;
  return s;
}
