// In-memory sliding windows. Serverless instances are ephemeral, so this protects a warm
// instance against bursts and runaway loops rather than promising a global count. Sites with
// a shared store add their own per-IP limiter in front; these windows are the spend fuses that
// bound how often the model layer can be consulted from one instance regardless.

export function ipOf(headers: { get(name: string): string | null }): string {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = headers.get("x-forwarded-for") || "";
  const first = fwd.split(",").map((v) => v.trim()).filter(Boolean)[0];
  return first || "unknown";
}

const MAX_KEYS = 10_000;
const SWEEP_EVERY_MS = 60_000;

export class SlidingWindow {
  private hits = new Map<string, number[]>();
  private lastSweep = 0;
  private readonly max: number;
  private readonly windowMs: number;
  // Only erasable TypeScript here: the core runs under Node's strip-types mode in its own tests.
  constructor(max: number, windowMs: number) {
    this.max = max;
    this.windowMs = windowMs;
  }

  check(key: string, now = Date.now()): boolean {
    const since = now - this.windowMs;
    const list = (this.hits.get(key) ?? []).filter((t) => t > since);
    if (list.length >= this.max) {
      this.hits.set(key, list);
      return false;
    }
    list.push(now);
    this.hits.delete(key);
    this.hits.set(key, list);
    if (now - this.lastSweep > SWEEP_EVERY_MS) this.sweep(now);
    // Map keeps insertion order, so the first keys are the least recently active.
    while (this.hits.size > MAX_KEYS) this.hits.delete(this.hits.keys().next().value!);
    return true;
  }

  private sweep(now: number) {
    this.lastSweep = now;
    const since = now - this.windowMs;
    for (const [k, list] of this.hits) {
      const kept = list.filter((t) => t > since);
      if (kept.length) this.hits.set(k, kept);
      else this.hits.delete(k);
    }
  }
}

// Shared defaults. Per-IP: above a 20/min baseline because a whole table (or a venue) shares
// one IP. Model fuses: per warm instance; beyond them answers fall back to approved text.
export const DEFAULT_LIMITS = {
  perMinute: 30,
  perDay: 400,
  modelPerMinute: 40,
  modelPerDay: 1500,
} as const;

export function makeLimiters(limits = DEFAULT_LIMITS) {
  return {
    perMinute: new SlidingWindow(limits.perMinute, 60_000),
    perDay: new SlidingWindow(limits.perDay, 24 * 60 * 60_000),
    modelPerMinute: new SlidingWindow(limits.modelPerMinute, 60_000),
    modelPerDay: new SlidingWindow(limits.modelPerDay, 24 * 60 * 60_000),
  };
}
