import { NextRequest, NextResponse } from "next/server";
import { clampText, enforcePublicName, isValidEmail } from "@/lib/sanitize";
import { detectPrivateLocation } from "@/lib/private-location";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { lazyServerClient } from "@/lib/supabase-server";

// Player listings are created here server-side (service role) and always land
// as pending_review. The browser no longer writes player_listings directly: a
// restrictive RLS policy blocks anon inserts so nobody can self-publish a
// listing without review.
const supabase = lazyServerClient();

const SKILLS = ["beginner", "intermediate", "advanced", "any"];

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "list-my-game", 5, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const b = await req.json().catch(() => ({}));
  if (!b?.name || !b?.city || !b?.state) {
    return NextResponse.json({ error: "Please add your name, city, and state." }, { status: 400 });
  }
  if (b.email && !isValidEmail(b.email)) {
    return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
  }

  const skill = String(b.skill_level || "").toLowerCase();
  const row = {
    name: enforcePublicName(b.name),
    city: clampText(b.city, 80),
    state: clampText(b.state, 60),
    skill_level: SKILLS.includes(skill) ? skill : "any",
    availability: clampText(b.availability, 300) || null,
    bio: clampText(b.bio, 600) || null,
    contact_email: clampText(b.email, 254) || null,
    status: "pending_review",
  };

  // Bio and availability appear on a public state page; nothing narrower than a
  // city may pass, or a home game listing pinpoints someone's home.
  const privacy = detectPrivateLocation({ description: row.bio, day_time: row.availability });
  if (privacy.hasStreetDetail) {
    return NextResponse.json(
      { error: "Please leave street addresses out of your listing. We only show city and state to keep hosts safe; you can share exact locations privately once you connect with a player." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("player_listings").insert(row);
  if (error) {
    console.error("list-my-game insert failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // Notify the admin to review, and confirm to the submitter. Best-effort:
  // sendEmail never throws, so a mail hiccup never fails the submission.
  const esc = (s: string) => String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));
  const adminHtml =
    `<p style="font-size:16px;line-height:1.7;">New player listing pending review.</p>` +
    `<ul style="font-size:15px;line-height:1.9;color:#1a1f5e;padding-left:18px;">` +
    `<li><strong>Name:</strong> ${esc(row.name)}</li>` +
    `<li><strong>Location:</strong> ${esc(row.city)}, ${esc(row.state)}</li>` +
    `<li><strong>Skill:</strong> ${esc(row.skill_level)}</li>` +
    (row.availability ? `<li><strong>Availability:</strong> ${esc(row.availability)}</li>` : "") +
    (row.bio ? `<li><strong>Bio:</strong> ${esc(row.bio)}</li>` : "") +
    `<li><strong>Contact:</strong> ${esc(row.contact_email || "not provided")}</li>` +
    `</ul>` +
    `<p style="font-size:15px;line-height:1.7;">Approve or reject it in the <a href="https://findmymahjgame.com/admin" style="color:#e91e8c;font-weight:700;">admin dashboard</a>.</p>`;
  await sendEmail({
    to: "hello@findmymahjgame.com",
    subject: `New player listing: ${row.name} (${row.city}, ${row.state})`,
    html: adminHtml,
    ...(row.contact_email ? { replyTo: row.contact_email } : {}),
    kind: "player-listing-admin",
  });

  if (row.contact_email) {
    const confirmHtml =
      `<p style="font-size:16px;line-height:1.7;">Thanks, ${esc(row.name)}! We received your free player listing for ${esc(row.city)}, ${esc(row.state)}.</p>` +
      `<p style="font-size:16px;line-height:1.7;">We will review and approve it within 1-2 business days. Once it is live, you will appear on your state page so local players can find you.</p>` +
      `<p style="font-size:16px;line-height:1.7;">While you wait, you can already find games and events near you at <a href="https://findmymahjgame.com" style="color:#e91e8c;font-weight:700;">findmymahjgame.com</a>.</p>`;
    await sendEmail({
      to: row.contact_email,
      subject: "We got your Find My Mahj Game listing",
      html: confirmHtml,
      kind: "player-listing-confirm",
    });
  }

  return NextResponse.json({ success: true });
}
