import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";
import { isLaunched, canUseDarkFeature } from "@/lib/launch-gates";
import { rateLimit } from "@/lib/rate-limit";

// Blocking is silent by design: the blocked person is never notified, on this
// route or anywhere else. A block only ever writes or removes the caller's own
// row; there is no path here to act on another user's blocks.
const supabase = lazyServerClient();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Auth = { session: { userId: string; role: "player" | "provider" }; profile: { deactivated_at: string | null; record_class: string } };

async function loadSessionProfile(req: NextRequest): Promise<Auth | { error: NextResponse }> {
  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };

  const { data: profile, error } = await supabase
    .from("profiles").select("deactivated_at, record_class").eq("id", session.userId).maybeSingle();
  if (error) {
    console.error("safety/block profile read failed:", error.message);
    return { error: NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) };
  }
  if (!profile) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  if (profile.deactivated_at) return { error: NextResponse.json({ error: "Account deactivated" }, { status: 403 }) };
  return { session, profile };
}

// Lists only the signed-in caller's own blocks, with a display name for each
// blocked account when one is set. Never accepts a user id to look up someone
// else's list.
export async function GET(req: NextRequest) {
  const auth = await loadSessionProfile(req);
  if ("error" in auth) return auth.error;
  const { session, profile } = auth;

  const launched = await isLaunched(supabase, "playerMatching");
  if (!canUseDarkFeature(launched, profile.record_class)) {
    return NextResponse.json({ error: "Mahj Match is not open yet." }, { status: 403 });
  }

  const { data: blocks, error } = await supabase
    .from("user_blocks")
    .select("blocked_user_id, created_at")
    .eq("blocker_user_id", session.userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("safety/block list failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const ids = (blocks || []).map((b) => b.blocked_user_id);
  let names: Record<string, string | null> = {};
  if (ids.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", ids);
    names = Object.fromEntries((profiles || []).map((p) => [p.id, p.display_name]));
  }

  return NextResponse.json({
    ok: true,
    blocks: (blocks || []).map((b) => ({
      userId: b.blocked_user_id,
      displayName: names[b.blocked_user_id] || null,
      createdAt: b.created_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "safety-block", 20, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const auth = await loadSessionProfile(req);
  if ("error" in auth) return auth.error;
  const { session, profile } = auth;

  const launched = await isLaunched(supabase, "playerMatching");
  if (!canUseDarkFeature(launched, profile.record_class)) {
    return NextResponse.json({ error: "Mahj Match is not open yet." }, { status: 403 });
  }

  const body = ((await req.json().catch(() => null)) || {}) as Record<string, unknown>;
  const action = String(body?.action || "");
  const userId = String(body?.user_id || "");

  if (action !== "block" && action !== "unblock") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  if (!UUID.test(userId)) {
    return NextResponse.json({ error: "Invalid account." }, { status: 400 });
  }
  if (userId === session.userId) {
    return NextResponse.json({ error: "You cannot block yourself." }, { status: 400 });
  }

  if (action === "block") {
    const { error } = await supabase
      .from("user_blocks")
      .upsert({ blocker_user_id: session.userId, blocked_user_id: userId }, { onConflict: "blocker_user_id,blocked_user_id", ignoreDuplicates: true });
    if (error) {
      if (error.code === "23503") return NextResponse.json({ error: "That account was not found." }, { status: 400 });
      console.error("safety/block block failed:", error.message);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, blocked: true });
  }

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_user_id", session.userId)
    .eq("blocked_user_id", userId);
  if (error) {
    console.error("safety/block unblock failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, blocked: false });
}
