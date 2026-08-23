import type { NextRequest } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";

// Serverless-appropriate rate limiting using Supabase as the shared store
// (in-memory counters do not work across Vercel instances). The caller picks
// the failure mode: "open" allows the request when the rate_hits table is
// unreachable, so a transient DB issue never blocks a real user on a public
// form; "strict" denies instead, because for admin login a dead counter would
// silently disable brute force protection. Run supabase/rate-limit.sql to
// activate enforcement.
const supabase = lazyServerClient();

export type RateLimitMode = "open" | "strict";

// Each hop that proxies a request is supposed to APPEND its own observed client IP
// to x-forwarded-for, so the leftmost (first) entry is whatever the original caller
// claimed to be, fully attacker-controlled, while the rightmost (last) entry is what
// our own edge actually saw on the connection. Keying on the first value let a caller
// mint an unlimited number of fresh rate-limit buckets just by sending a different
// made-up IP on every request. Exported so tests can exercise it without a full
// NextRequest or the local RATE_LIMIT_TEST_BYPASS escape hatch.
export function ipOf(req: NextRequest): string {
  // On Vercel, x-real-ip is the true client IP set by the platform from the TCP
  // connection; a client cannot spoof it. Prefer it over x-forwarded-for, whose
  // first entry is client-controllable (spoofable to mint fresh buckets) and whose
  // last entry is Vercel's own edge IP (shared, which would bucket everyone
  // together). Fall back to the first forwarded hop only when x-real-ip is absent.
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const fwd = req.headers.get("x-forwarded-for") || "";
  const first = fwd.split(",").map((v) => v.trim()).filter(Boolean)[0];
  return first || "unknown";
}

// The minimal query surface the limiter uses. Structural so tests can pass a
// plain object stub while production passes the real supabase client.
export type RateLimitStore = {
  from(table: string): {
    select(
      columns: string,
      opts: { count: "exact"; head: true }
    ): {
      eq(
        column: string,
        value: string
      ): {
        gte(column: string, value: string): PromiseLike<{ count: number | null; error: unknown }>;
      };
    };
    insert(row: { k: string }): PromiseLike<{ error: unknown }>;
  };
};

// Core check, separated from the request so tests can stub the store. The key
// keeps the existing `${route}:${ip}` shape so live rate_hits rows stay valid.
export async function rateLimitCheck(
  store: RateLimitStore,
  key: string,
  max: number,
  windowSec: number,
  mode: RateLimitMode = "open"
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - windowSec * 1000).toISOString();
    const { count, error } = await store
      .from("rate_hits")
      .select("id", { count: "exact", head: true })
      .eq("k", key)
      .gte("created_at", since);
    // supabase-js reports query failures in the result instead of throwing, so
    // a missing table used to slide through as count 0 and fail open even when
    // the caller needs strictness. Surface it and let mode decide below.
    if (error) throw error;
    if ((count ?? 0) >= max) return false;
    const inserted = await store.from("rate_hits").insert({ k: key });
    if (inserted.error) throw inserted.error;
    return true;
  } catch {
    return mode !== "strict";
  }
}

export async function rateLimit(
  req: NextRequest,
  route: string,
  max: number,
  windowSec: number,
  mode: RateLimitMode = "open"
): Promise<boolean> {
  // Local test escape hatch. Playwright suites share one production rate_hits table,
  // so repeated runs exhaust real windows and fail tests that never test limiting.
  // Set only in .env.local; production Vercel env never defines it, and the strict
  // mode tests exercise rateLimitCheck directly so they bypass this bypass.
  if (process.env.RATE_LIMIT_TEST_BYPASS === "1" && !process.env.VERCEL) return true;
  return rateLimitCheck(
    supabase as unknown as RateLimitStore,
    `${route}:${ipOf(req)}`,
    max,
    windowSec,
    mode
  );
}
