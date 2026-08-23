import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { isLaunched, isQaEmail } from "@/lib/launch-gates";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { isValidEmail } from "@/lib/sanitize";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const supabase = lazyServerClient();

// Passwordless sign in. auth.users is the identity source of truth; this route only ever
// sends a link, so a typo'd or hostile email address receives nothing but a sign-in prompt.
export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "auth-signin", 5, 300))) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) || {};
  const email = String(body?.email || "").trim().toLowerCase();
  const role = body?.role === "provider" ? "provider" : "player";
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const qa = isQaEmail(email);
  const adminSession = verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value);

  // The master gate. While signups are unlaunched, only QA identities may proceed, and only
  // when an authenticated admin is driving, so no member of the public can reach the flow.
  if (!(await isLaunched(supabase, "publicSignup"))) {
    if (!qa || !adminSession) {
      return NextResponse.json({ error: "Accounts are not open yet. Browsing and search are free and need no account." }, { status: 403 });
    }
  }
  if (qa && !adminSession) {
    return NextResponse.json({ error: "Accounts are not open yet." }, { status: 403 });
  }

  const admin = supabase.auth.admin;
  const { error: createErr } = await admin.createUser({
    email,
    email_confirm: false,
    user_metadata: { requested_role: role },
  });
  // An already-registered address is the normal repeat sign-in path, not an error.
  if (createErr && !/already|registered|exists/i.test(createErr.message)) {
    console.error("auth createUser failed:", createErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const { data: link, error: linkErr } = await admin.generateLink({ type: "magiclink", email });
  if (linkErr || !link?.properties?.hashed_token) {
    console.error("auth generateLink failed:", linkErr?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://findmymahjgame.com";
  const confirmUrl = `${base}/auth/confirm?token_hash=${encodeURIComponent(link.properties.hashed_token)}&role=${role}`;

  // QA identities use an unroutable domain, so the link comes back in the response instead of
  // an email. Only reachable with an admin session, checked above.
  if (qa) {
    return NextResponse.json({ ok: true, qa: true, confirmUrl });
  }

  const sent = await sendEmail({
    kind: "auth-signin",
    to: email,
    subject: "Sign in to Find My Mahj Game",
    html: `<p>Click to sign in. This link works once, so use it soon.</p><p><a href="${confirmUrl}">Sign in to Find My Mahj Game</a></p><p>If you did not request this, ignore this email.</p>`,
  });
  if (!sent.ok) {
    return NextResponse.json({ error: "We could not send the email. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, message: "Check your email for a sign-in link." });
}
