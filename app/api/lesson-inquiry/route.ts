import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { LAS_VEGAS_MAHJONG } from "@/lib/featured-listings";
import { isPremiumActive } from "@/lib/premium";
import { hostRecordClass } from "@/lib/analytics/events";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const esc = (s: string) => String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

// The structured lesson inquiry is a Premium conversion feature. It sends the lead
// straight to the provider (reply-to the player), and records only minimal metadata,
// no message content and no player name or email, enough to confirm delivery and to
// measure whether Premium generated qualified leads. The founder is not copied on
// routine inquiries; the platform is meant to run hands-off.
export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "lesson-inquiry", 8, 60))) {
    return NextResponse.json({ error: "Please wait a moment and try again." }, { status: 429 });
  }

  let body: Record<string, string> = {};
  try { body = (await req.json()) || {}; } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const teacherId = String(body.teacherId || "").trim();
  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 160);
  const phone = String(body.phone || "").trim().slice(0, 40);
  const area = String(body.area || "").trim().slice(0, 120);
  const experience = String(body.experience || "").trim().slice(0, 40);
  const message = String(body.message || "").trim().slice(0, 2000);

  if (!teacherId || !name || !EMAIL_RE.test(email) || !message) {
    return NextResponse.json({ error: "Please add your name, a valid email, and a message." }, { status: 400 });
  }

  // Resolve the teacher server-side (never trust a client-sent address) and confirm
  // Premium is active: the structured inquiry is a Premium feature, so the API
  // refuses it for a Basic or expired listing even if a request is crafted directly.
  let teacherEmail = "";
  let teacherName = "this teacher";
  let premium = false;
  if (teacherId === LAS_VEGAS_MAHJONG.id) {
    teacherEmail = LAS_VEGAS_MAHJONG.display_email;
    teacherName = LAS_VEGAS_MAHJONG.business_name;
    premium = true;
  } else {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("venue_listings")
      .select("business_name, display_email, premium_until")
      .eq("id", teacherId)
      .eq("status", "published")
      .maybeSingle();
    if (data?.display_email) {
      teacherEmail = String(data.display_email);
      teacherName = String(data.business_name || teacherName);
      premium = isPremiumActive(data.premium_until);
    }
  }
  if (!teacherEmail || !EMAIL_RE.test(teacherEmail)) {
    return NextResponse.json({ error: "We could not reach this teacher right now." }, { status: 422 });
  }
  if (!premium) {
    return NextResponse.json({ error: "This provider is not set up for lesson requests. Try their website or email instead." }, { status: 403 });
  }

  const html =
    `<p style="font-size:16px;line-height:1.7;">You have a new lesson request from <strong>${esc(name)}</strong> through Find My Mahj Game.</p>` +
    `<ul style="font-size:15px;line-height:1.9;color:#1a1f5e;padding-left:18px;">` +
    `<li><strong>Name:</strong> ${esc(name)}</li>` +
    `<li><strong>Email:</strong> ${esc(email)}</li>` +
    (phone ? `<li><strong>Phone:</strong> ${esc(phone)}</li>` : "") +
    (area ? `<li><strong>Area:</strong> ${esc(area)}</li>` : "") +
    (experience ? `<li><strong>Experience:</strong> ${esc(experience)}</li>` : "") +
    `</ul>` +
    `<p style="font-size:16px;line-height:1.7;"><strong>Message:</strong><br/>${esc(message)}</p>` +
    `<p style="font-size:14px;color:#6b7280;">Just reply to this email to reach ${esc(name)} directly.</p>`;

  const res = await sendEmail({
    to: teacherEmail,
    // The send log stores subjects, so the player's name stays out of the subject
    // (the metadata-only promise on /privacy depends on it).
    subject: `New lesson request for ${teacherName}`,
    html,
    replyTo: email,
    kind: "lesson-inquiry",
  });

  // Record only structured metadata, never the message or the player's identity.
  // The founder demo card is skipped entirely (no row at all); record_class keeps
  // non-production-host QA traffic out of the real lead counts that feed the
  // Premium conversion diagnostic.
  if (teacherId !== LAS_VEGAS_MAHJONG.id) {
    const recordClass = hostRecordClass(req.headers.get("host")) === "test" ? "test" : "real_external";
    const { error: leadErr } = await createServerClient().from("provider_leads").insert({
      provider_table: "venue_listings",
      provider_id: teacherId,
      status: res.ok ? "sent" : "failed",
      record_class: recordClass,
    });
    if (leadErr) console.error("provider_leads insert failed:", leadErr.message);
  }

  if (!res.ok) {
    return NextResponse.json({ error: "Something went wrong sending your request. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
