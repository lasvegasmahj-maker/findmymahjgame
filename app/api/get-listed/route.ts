import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clampText, isValidEmail, safeHttpUrl } from "@/lib/sanitize";
import { toStateAbbr } from "@/lib/near-match";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { lazyServerClient } from "@/lib/supabase-server";

// Business/event signups become a real listing held at pending_review, so the founder
// approves an existing row rather than retyping it. Status is always set explicitly,
// because both listing tables default to published and an omitted status would go live
// unreviewed. The promo is evaluated server-side so founding-member status can never be
// self-granted from the browser.
const supabase = lazyServerClient();

const esc = (s: string) => String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "get-listed", 5, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const b = (await req.json().catch(() => null)) || {};
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
    const { data: promo } = await supabase.from("promo_codes").select("code").eq("code", up).eq("active", true).maybeSingle();
    promoValid = !!promo;
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

  // Previously this wrote an inquiry and stopped, so the confirmation email below promised a
  // listing that no code path could ever publish. The submission now becomes a real listing
  // held at pending_review, which lands in the admin tabs that already have approve buttons.
  const stateAbbr = toStateAbbr(state);
  const EVENT_TYPE_BY_FORM: Record<string, string> = {
    "Open Play": "open_play",
    Tournament: "tournament",
    Retreat: "retreat",
    League: "league",
  };
  const FREQUENCY_BY_FORM: Record<string, string> = {
    Weekly: "weekly",
    "Every other week": "biweekly",
    Monthly: "monthly",
  };

  const provenance = [
    `Submitted through /get-listed by ${name} (${email}).`,
    promoLine,
    clampText(b.instagram, 120) ? `Instagram: ${clampText(b.instagram, 120)}` : "",
    b.beginner_friendly === true ? "Beginner-friendly: yes" : "",
  ].filter(Boolean).join(" ");

  let listingError: string | null = null;
  if (!company || !stateAbbr || !city) {
    listingError = "missing business name, city or state";
  } else if (businessType === "Mahjong Instructor") {
    const { error: vErr } = await supabase.from("venue_listings").insert({
      business_name: company,
      venue_type: "Mahjong Instructor",
      city,
      state: stateAbbr,
      description: clampText(b.message, 800) || null,
      website: safeHttpUrl(b.website),
      instagram: clampText(b.instagram, 120) || null,
      contact_name: name,
      contact_email: email,
      tier: "free",
      reviewer_notes: provenance,
      status: "pending_review",
    });
    listingError = vErr ? vErr.message : null;
  } else {
    const { error: eErr } = await supabase.from("event_listings").insert({
      event_name: company,
      event_type: EVENT_TYPE_BY_FORM[businessType] || "social",
      city,
      state: stateAbbr,
      venue: clampText(b.venue, 200) || null,
      host: clampText(b.host, 120) || null,
      description: clampText(b.message, 800) || null,
      day_time: clampText(b.event_date, 160) || null,
      frequency: FREQUENCY_BY_FORM[clampText(b.frequency, 40) || ""] || null,
      registration_url: safeHttpUrl(b.signup_url),
      beginner_friendly: b.beginner_friendly === true ? "yes" : null,
      contact_name: name,
      contact_email: email,
      tier: "free",
      reviewer_notes: provenance,
      status: "pending_review",
    });
    listingError = eErr ? eErr.message : null;
  }

  // A submission must never be lost. If the structured write fails for any reason, fall back
  // to the inquiry row so the founder still has the lead and can create the listing by hand.
  if (listingError) {
    console.error("get-listed listing insert failed, falling back to inquiry:", listingError);
    const { error } = await supabase.from("inquiries").insert({
      name,
      email,
      company,
      inquiry_type: "get_listed",
      interest: businessType || null,
      message: `LISTING INSERT FAILED (${listingError}). Create this listing by hand.\n${details}`,
      status: "new",
    });
    if (error) {
      console.error("get-listed insert failed:", error.message);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
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
    `<p style="font-size:15px;line-height:1.7;">Questions? Just reply to this email.</p>`;
  await sendEmail({
    to: email,
    subject: "We got your Find My Mahj Game listing",
    html: confirmHtml,
    kind: "get-listed-confirm",
  });

  return NextResponse.json({ success: true });
}
