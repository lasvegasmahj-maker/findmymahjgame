import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken, passwordMatches, ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "admin-login", 5, 300))) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin login is not configured" }, { status: 500 });
  }
  if (!passwordMatches(body?.password, process.env.ADMIN_PASSWORD)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
