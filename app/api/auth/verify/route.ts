import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { lazyServerClient } from "@/lib/supabase-server";
import { isQaEmail } from "@/lib/launch-gates";
import { createUserSessionToken, USER_COOKIE, USER_COOKIE_MAX_AGE } from "@/lib/user-auth";
import { rateLimit } from "@/lib/rate-limit";

const supabase = lazyServerClient();

// Exchanges the emailed token for a session. POST on purpose: email scanners
// prefetch GET links, and Supabase tokens are single use, so the confirm page
// submits here with a button instead of consuming the token on page load.
export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "auth-verify", 10, 300))) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const tokenHash = String(body?.token_hash || "");
  const role = body?.role === "provider" ? "provider" : "player";
  if (!tokenHash) {
    return NextResponse.json({ error: "This link is missing its code. Request a new one." }, { status: 400 });
  }

  // verifyOtp signs its client in as the verified user, so it must never run on the
  // shared service-role client: that would leave the singleton authenticated as this
  // user and every later query on any request would run with the user's permissions.
  // A throwaway anon client keeps the session contained to this call.
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await authClient.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  const user = data?.user;
  if (error || !user?.id || !user.email) {
    return NextResponse.json({ error: "This link has expired or was already used. Request a new one." }, { status: 400 });
  }

  // QA identities are test-classified at the database level, always. This is what
  // keeps every QA walkthrough out of every real business number.
  const recordClass = isQaEmail(user.email) ? "test" : "real_external";
  const { data: existing, error: readError } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (readError) {
    console.error("auth/verify profile read failed:", readError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // A repeat sign-in reactivates but never rewrites role or classification;
  // the role in the request only matters the first time, so a crafted sign-in
  // cannot flip an existing account's role.
  const sessionRole = existing?.role === "provider" ? "provider" : existing ? "player" : role;
  const { error: profileError } = existing
    ? await supabase.from("profiles")
        .update({ deactivated_at: null, updated_at: new Date().toISOString() })
        .eq("id", user.id)
    : await supabase.from("profiles").insert({ id: user.id, role, record_class: recordClass });
  if (profileError) {
    console.error("auth/verify profile write failed:", profileError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  await supabase.from("account_events").insert({ user_id: user.id, action: "signed_in", detail: recordClass === "test" ? "qa" : null });

  const res = NextResponse.json({ ok: true, role: sessionRole });
  res.cookies.set(USER_COOKIE, createUserSessionToken({ userId: user.id, role: sessionRole }), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: USER_COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
