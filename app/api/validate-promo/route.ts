import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clampText } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { lazyServerClient } from "@/lib/supabase-server";

// The browser used to query promo_codes directly with the public anon key, which meant the
// whole redeemable coupon list could be enumerated by dropping the filter. This checks one
// submitted code server side and answers only whether that code is valid.
const supabase = lazyServerClient();

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "validate-promo", 10, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const code = (clampText(body.code, 40) || "").toUpperCase();
  if (!code) return NextResponse.json({ valid: false });

  if (code === "FINDMYMAHJGAME") return NextResponse.json({ valid: true });

  const { data, error } = await supabase
    .from("promo_codes")
    .select("code")
    .eq("code", code)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("validate-promo lookup failed:", error.message);
    return NextResponse.json({ valid: false });
  }
  return NextResponse.json({ valid: Boolean(data) });
}
