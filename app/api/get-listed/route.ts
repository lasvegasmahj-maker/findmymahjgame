import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clampText, isValidEmail, safeHttpUrl } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";

// The old client posted columns that do not exist on inquiries, so every
// submission failed. This route maps the business signup into the real
// inquiries schema and evaluates the promo server-side so founding-member
// status can never be self-granted from the browser.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "get-listed", 5, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const b = await req.json().catch(() => ({}));
  const name = clampText(b.name, 120);
  const email = clampText(b.email, 254);
  if (!name || !email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please add your name and a valid email." }, { status: 400 });
  }

  let promoLine = "";
  const code = clampText(b.promo_code, 40);
  if (code) {
    const { data: promo } = await supabase
      .from("promo_codes")
      .select("code")
      .eq("code", code.toUpperCase())
      .eq("active", true)
      .maybeSingle();
    promoLine = promo ? `Promo code ${promo.code} (valid)` : `Promo code ${code} (NOT valid)`;
  }

  const details = [
    `Business type: ${clampText(b.business_type, 80) || "n/a"}`,
    `Location: ${clampText(b.city, 80) || "?"}, ${clampText(b.state, 30) || "?"}`,
    `Website: ${safeHttpUrl(b.website) || "none"}`,
    `Instagram: ${clampText(b.instagram, 120) || "none"}`,
    `Logo: ${safeHttpUrl(b.logo_url) || "none"}`,
    promoLine,
    clampText(b.message, 800) ? `Message: ${clampText(b.message, 800)}` : "",
  ].filter(Boolean).join("\n");

  const { error } = await supabase.from("inquiries").insert({
    name,
    email,
    company: clampText(b.business_name, 160) || clampText(b.company, 160) || null,
    inquiry_type: "get_listed",
    interest: clampText(b.business_type, 80) || null,
    message: details,
    status: "new",
  });
  if (error) {
    console.error("get-listed insert failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
