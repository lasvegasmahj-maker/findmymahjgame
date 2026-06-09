import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { clampText, safeHttpUrl } from "@/lib/sanitize";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin-only create for the real teacher directory. Status changes go through
// the shared /api/admin/update route (teachers is in its allowlist).
export async function POST(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = await req.json().catch(() => ({}));
  if (!b?.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  const row = {
    name: clampText(b.name, 120),
    city: clampText(b.city, 80) || null,
    state: clampText(b.state, 60) || null,
    website: safeHttpUrl(b.website) || null,
    contact: clampText(b.contact, 200) || null,
    is_ambassador: !!b.isAmbassador,
    status: "published", // admin enters trusted listings, so publish on create
    reviewed_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("teachers").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
