import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { signActionToken } from "@/lib/game-token";

// Issues the magic links for a listing: the claim link goes in the founder's
// personal outreach email; the still-running and ended links power freshness
// asks. 90-day TTL per the claims ruling (this audience reopens emails for
// weeks). Admin-only; the future drip reuses the same signing path.
const TABLES = ["venue_listings", "event_listings"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const table = String(req.nextUrl.searchParams.get("table") || "");
  const id = String(req.nextUrl.searchParams.get("id") || "");
  if (!TABLES.includes(table) || !UUID.test(id)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://findmymahjgame.com";
  const subject = `${table}|${id}`;
  return NextResponse.json({
    claim: `${base}/claim?token=${signActionToken("claim", subject, 90)}`,
    stillRunning: `${base}/listing/confirm?token=${signActionToken("still-running", subject, 90)}`,
    ended: `${base}/listing/confirm?token=${signActionToken("ended", subject, 90)}`,
  });
}
