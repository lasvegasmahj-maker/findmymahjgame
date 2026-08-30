import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isLaunched, canUseDarkFeature } from "@/lib/launch-gates";
import type { RecordClass } from "@/lib/analytics/events";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";

// The legacy quick-table routes (/api/tables/*) let a visitor start, find, join, confirm, and
// repeat a table with no account, so they cannot be gated on a profile the way Mahj Match's
// routes are. They sit behind the same launch_player_matching gate and the same dark-launch
// rule: while the gate is OFF, only test traffic may use them. Test traffic here is a local
// development host (the test suites) or a signed-in profile classified test (the QA
// walkthrough); a deployment alias such as the vercel.app hostname is reachable by anyone, so
// it does not count. The pages that front these routes apply the same decision.

export const TABLES_CLOSED_MESSAGE = "Game tables are not open yet.";

export type Requester = { host: string | null | undefined; sessionCookie: string | null | undefined };

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])$/i;

export async function requesterRecordClass(who: Requester, supabase: SupabaseClient): Promise<RecordClass> {
  const host = (who.host || "").toLowerCase().replace(/:\d+$/, "");
  // The same local-only escape hatch pattern as rate-limit.ts: a Host header is trusted only
  // where no proxy could forward a spoofed one.
  if (LOCAL_HOST.test(host) && !process.env.VERCEL) return "test";
  const session = verifyUserSessionToken(who.sessionCookie);
  if (!session) return "real_external";
  try {
    const { data } = await supabase.from("profiles").select("record_class").eq("id", session.userId).maybeSingle();
    // Only test is special here; an internal or seed profile is a real member of these
    // no-account routes, otherwise it could be locked out of every real table.
    return data?.record_class === "test" ? "test" : "real_external";
  } catch {
    return "real_external";
  }
}

export async function quickTablesOpenFor(who: Requester, supabase: SupabaseClient): Promise<{ allowed: boolean; recordClass: RecordClass }> {
  const [launched, recordClass] = await Promise.all([isLaunched(supabase, "playerMatching"), requesterRecordClass(who, supabase)]);
  return { allowed: canUseDarkFeature(launched, recordClass), recordClass };
}

export function quickTablesAccess(req: NextRequest, supabase: SupabaseClient): Promise<{ allowed: boolean; recordClass: RecordClass }> {
  return quickTablesOpenFor({ host: req.headers.get("host"), sessionCookie: req.cookies.get(USER_COOKIE)?.value }, supabase);
}
