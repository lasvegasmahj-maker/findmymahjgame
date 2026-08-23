import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { track, hostRecordClass, EVENT_NAMES, type EventName, type RecordClass } from "@/lib/analytics/events";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";
import { rateLimit } from "@/lib/rate-limit";

// Client event ingestion. The response is always the same 200 {ok:true}, whether the name
// is unknown, the request is rate limited, or the insert actually happened, so nothing about
// this endpoint can be used to enumerate valid event names or discover the rate limit window.
// The calling page never has a reason to check the result.

const NAME_SET = new Set<string>(EVENT_NAMES);
const MAX_SESSION_KEY = 128;

async function resolveRecordClass(req: NextRequest): Promise<RecordClass> {
  if (hostRecordClass(req.headers.get("host")) === "test") return "test";
  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return "real_external";
  try {
    const { data } = await lazyServerClient()
      .from("profiles")
      .select("record_class")
      .eq("id", session.userId)
      .maybeSingle();
    return data?.record_class === "test" ? "test" : "real_external";
  } catch {
    return "real_external";
  }
}

export async function POST(req: NextRequest) {
  const ok = NextResponse.json({ ok: true });

  if (!(await rateLimit(req, "events", 60, 60))) return ok;

  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name : "";
  if (!NAME_SET.has(name)) return ok;

  const props = body?.props && typeof body.props === "object" && !Array.isArray(body.props) ? body.props : undefined;
  const sessionKey = typeof body?.sessionKey === "string" ? body.sessionKey.slice(0, MAX_SESSION_KEY) : null;
  const recordClass = await resolveRecordClass(req);

  void track(lazyServerClient(), name as EventName, { props, sessionKey, recordClass });

  return ok;
}
