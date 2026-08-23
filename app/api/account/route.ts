import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";
import { enforcePublicName } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";

const supabase = lazyServerClient();

// Account self-service: display name, deactivation, deletion request. Deletion is a
// logged request handled by a person, not an instant destructive write, so a hijacked
// session cannot erase someone's history before they notice.
export async function POST(req: NextRequest) {
  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (!(await rateLimit(req, "account", 10, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "");

  if (action === "set_display_name") {
    const displayName = enforcePublicName(body?.display_name);
    if (!displayName) return NextResponse.json({ error: "Enter a name." }, { status: 400 });
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("id", session.userId);
    if (error) {
      console.error("account name update failed:", error.message);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
    await supabase.from("account_events").insert({ user_id: session.userId, action: "display_name_changed" });
    return NextResponse.json({ ok: true, displayName });
  }

  if (action === "deactivate") {
    const { error } = await supabase
      .from("profiles")
      .update({ deactivated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", session.userId);
    if (error) {
      console.error("account deactivate failed:", error.message);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
    await supabase.from("account_events").insert({ user_id: session.userId, action: "deactivated" });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(USER_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
    return res;
  }

  if (action === "request_deletion") {
    await supabase.from("account_events").insert({ user_id: session.userId, action: "deletion_requested" });
    return NextResponse.json({ ok: true, message: "We received your deletion request and will confirm by email once it is done." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
