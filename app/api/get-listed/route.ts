import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clampText, isValidEmail, safeHttpUrl } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

// Business/event signups land in the inquiries table (the listing itself is
// created on approval). The promo is evaluated server-side so founding-member
// status can never be self-granted from the browser. On success we email the
// submitter a confirmation and notify the admin, matching the player flow.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const esc = (s: string) => String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

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
  // Reject malformed links instead of silently dropping them, so players never
  // hit a dead "Register" button later.
  if (b.signup_url && !safeHttpUrl(b.signup_url)) {
    return NextResponse.json({ error: "Your sign-up link does not look like a valid web address. It should start with http:// or https://." }, { status: 400 });
  }
  if (b.website && !safeHttpUrl(b.website)) {
    return NextResponse.json({ error: "Your website does not look like a valid web address. It should start with http:// or https://." }, { status: 400 });
  }

  const businessType = clampText(b.business_type, 80) || "";
  const company = clampText(b.business_name, 160) || clampText(b.company, 160) || null;
  const city = clampText(b.city, 80) || "";
  const state = clampText(b.state, 30) || "";

  let promoValid = false;
  let promoLine = "";
  const code = clampText(b.promo_code, 40);
  if (code) {
    const up = code.toUpperCase();
    if (up === "FINDMYMAHJGAME") {
      promoValid = true;
    } else {
      const { data: promo } = await supabase.from("promo_codes").select("code").eq("code", up).eq("active", true).maybeSingle();
      promoValid = !!promo;
    }
    promoLine = promoValid ? `Promo code ${up} (valid)` : `Promo code ${code} (NOT valid)`;
  }

  const details = [
    `Business type: ${businessType || "n/a"}`,
    `Location: ${city || "?"}, ${state || "?"}`,
    clampText(b.host, 120) ? `Host: ${clampText(b.host, 120)}` : "",
    clampText(b.event_date, 160) ? `When: ${clampText(b.event_date, 160)}` : "",
    clampText(b.end_date, 60) ? `Ends: ${clampText(b.end_date, 60)}` : "",
    clampText(b.frequency, 40) ? `Frequency: ${clampText(b.frequency, 40)}` : "",
    b.recurring === true ? "Recurring: yes" : "",
    b.beginner_friendly === true ? "Beginner-friendly: yes" : "",
    clampText(b.venue, 200) ? `Venue: ${clampText(b.venue, 200)}` : "",
    safeHttpUrl(b.signup_url) ? `Sign-up link: ${safeHttpUrl(b.signup_url)}` : "",
    `Website: ${safeHttpUrl(b.website) || "none"}`,
    `Instagram: ${clampText(b.instagram, 120) || "none"}`,
    promoLine,
    clampText(b.message, 800) ? `Message: ${clampText(b.message, 800)}` : "",
  ].filter(Boolean).join("\n");

  const { error } = await supabase.from("inquiries").insert({
    name,
    email,
    company,
    inquiry_type: "get_listed",
    interest: businessType || null,
    message: details,
    status: "new",
  });
  if (error) {
    console.error("get-listed insert failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const adminHtml =
    `<p style="font-size:16px;line-height:1.7;">New get-listed submission pending review.</p>` +
    `<ul style="font-size:15px;line-height:1.9;color:#1a1f5e;padding-left:18px;">` +
    `<li><strong>Contact:</strong> ${esc(name)} (${esc(email)})</li>` +
    `<li><strong>Listing:</strong> ${esc(company || "n/a")}</li>` +
    `<li><strong>Type:</strong> ${esc(businessType || "n/a")}</li>` +
    `<li><strong>Location:</strong> ${esc(city)}, ${esc(state)}</li>` +
    `</ul>` +
    `<pre style="font-size:13px;color:#374151;white-space:pre-wrap;background:#f6f6fb;padding:12px;border-radius:8px;">${esc(details)}</pre>` +
    `<p style="font-size:15px;line-height:1.7;">Review it in the <a href="https://findmymahjgame.com/admin" style="color:#e91e8c;font-weight:700;">admin dashboard</a>.</p>`;
  await sendEmail({
    to: "hello@findmymahjgame.com",
    subject: `New listing submission: ${company || name} (${city}, ${state})`,
    html: adminHtml,
    replyTo: email,
    kind: "get-listed-admin",
  });

  const confirmHtml =
    `<p style="font-size:16px;line-height:1.7;">Thanks, ${esc(name)}! We received your ${esc(businessType || "listing")} for ${esc(city)}, ${esc(state)}.</p>` +
    `<p style="font-size:16px;line-height:1.7;">We review every listing by hand and will email you within 1-2 business days. Once it is approved it goes live on your state page, and we will send you the link plus how to make edits.</p>` +
    (promoValid ? `<p style="font-size:16px;line-height:1.7;">As a Charter Member, your first 6 months are free. Nothing is charged today, we will email you to set up billing before the free period ends.</p>` : "") +
    `<p style="font-size:15px;line-height:1.7;">Questions? Just reply to this email.</p>`;
  await sendEmail({
    to: email,
    subject: "We got your Find My Mahj Game listing",
    html: confirmHtml,
    kind: "get-listed-confirm",
  });

  return NextResponse.json({ success: true });
}
