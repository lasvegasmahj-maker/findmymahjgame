import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { lazyServerClient } from "@/lib/supabase-server";

const supabase = lazyServerClient();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_TABLES = ["inquiries", "player_listings", "venue_listings", "event_listings", "ad_listings", "ambassadors", "cruise_posts"];
const ALLOWED_STATUS = ["new", "read", "replied", "pending_review", "flagged", "published", "rejected", "approved", "contacted", "declined"];

export async function POST(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { table, id, ids, status } = await req.json().catch(() => ({}));

  const idList: string[] = Array.isArray(ids) ? ids : typeof id === "string" ? [id] : [];
  const idsValid = idList.length > 0 && idList.length <= 500 && idList.every((x) => typeof x === "string" && UUID.test(x));
  if (!ALLOWED_TABLES.includes(table) || !ALLOWED_STATUS.includes(status) || !idsValid) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const patch = table === "inquiries"
    ? { status }
    : { status, reviewed_at: new Date().toISOString() };

  const { error } = await supabase.from(table).update(patch).in("id", idList);
  if (error) {
    console.error("admin update failed:", error.message);
    return NextResponse.json({ error: "Update failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: idList.length });
}
