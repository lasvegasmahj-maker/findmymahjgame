import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_TABLES = ["inquiries", "player_listings", "venue_listings", "event_listings", "ad_listings", "ambassadors"];
const ALLOWED_STATUS = ["new", "read", "replied", "pending_review", "flagged", "published", "rejected", "approved", "contacted", "declined"];

export async function POST(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { table, id, status } = await req.json().catch(() => ({}));

  if (!ALLOWED_TABLES.includes(table) || !ALLOWED_STATUS.includes(status) || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const patch = table === "inquiries"
    ? { status }
    : { status, reviewed_at: new Date().toISOString() };

  const { error } = await supabase.from(table).update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
