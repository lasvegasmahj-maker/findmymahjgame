import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

// Serverless-appropriate rate limiting using Supabase as the shared store
// (in-memory counters do not work across Vercel instances). Fails OPEN on any
// error (including the table not existing yet) so a transient DB issue never
// blocks a real user; run supabase/rate-limit.sql to activate enforcement.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function ipOf(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function rateLimit(
  req: NextRequest,
  route: string,
  max: number,
  windowSec: number
): Promise<boolean> {
  try {
    const k = `${route}:${ipOf(req)}`;
    const since = new Date(Date.now() - windowSec * 1000).toISOString();
    const { count } = await supabase
      .from("rate_hits")
      .select("id", { count: "exact", head: true })
      .eq("k", k)
      .gte("created_at", since);
    if ((count ?? 0) >= max) return false;
    await supabase.from("rate_hits").insert({ k });
    return true;
  } catch {
    return true; // fail open
  }
}
