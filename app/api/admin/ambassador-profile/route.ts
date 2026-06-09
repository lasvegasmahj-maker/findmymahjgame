import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { clampText, safeHttpUrl } from "@/lib/sanitize";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const slugify = (s: string) => clampText(s, 60).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Admin-only: set the public profile fields on an ambassador row.
// Requires supabase/ambassador-profiles.sql to have been run.
export async function POST(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = await req.json().catch(() => ({}));
  if (!b?.id || typeof b.id !== "string") {
    return NextResponse.json({ error: "Missing ambassador id." }, { status: 400 });
  }
  const status = b.profile_status === "published" ? "published" : "draft";
  const patch: Record<string, unknown> = {
    slug: b.slug ? slugify(b.slug) : null,
    bio: clampText(b.bio, 2000) || null,
    photo_url: safeHttpUrl(b.photo_url) || null,
    referral_code: clampText(b.referral_code, 40) || null,
    profile_status: status,
  };
  if (status === "published" && (!patch.slug || !patch.bio)) {
    return NextResponse.json({ error: "A published profile needs at least a slug and a bio." }, { status: 400 });
  }
  const { error } = await supabase.from("ambassadors").update(patch).eq("id", b.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
