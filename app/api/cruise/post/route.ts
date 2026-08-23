import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { clampText, enforcePublicName, isValidEmail, escapeHtml } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { lazyServerClient } from "@/lib/supabase-server";

// A passenger posts their sailing to find other players aboard. Posts land as
// pending_review, not published: a card pairs a real name with an exact ship
// and dates on an indexable page, which says where a person will be and when,
// so a human approves it first like every other public submission.
const supabase = lazyServerClient();

const SKILLS = ["beginner", "intermediate", "advanced", "any"];
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "cruise-post", 5, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }
  const b = await req.json().catch(() => ({}));
  const name = enforcePublicName(b.name);
  const email = clampText(b.email, 254);
  const cruiseLine = clampText(b.cruise_line, 80);
  const ship = clampText(b.ship, 80) || null;
  const departDate = clampText(b.depart_date, 10);
  const returnDate = clampText(b.return_date, 10) || null;
  const skill = String(b.skill_level || "").toLowerCase();

  if (!name || !email || !cruiseLine || !departDate) {
    return NextResponse.json({ error: "Please add your name, email, cruise line, and departure date." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!isDate(departDate) || (returnDate && !isDate(returnDate))) {
    return NextResponse.json({ error: "Please pick valid dates." }, { status: 400 });
  }

  const { error } = await supabase.from("cruise_posts").insert({
    name,
    contact_email: email.toLowerCase(),
    cruise_line: cruiseLine,
    ship,
    depart_date: departDate,
    return_date: returnDate,
    skill_level: SKILLS.includes(skill) ? skill : "any",
    status: "pending_review",
  });
  if (error) {
    console.error("cruise post failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  await sendEmail({
    kind: "cruise-post",
    to: "hello@findmymahjgame.com",
    subject: `New cruise post: ${cruiseLine}${ship ? " " + ship : ""} departing ${departDate}`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
      <h2 style="color:#1a1f5e;">New cruise companion post</h2>
      <p style="color:#374151;line-height:1.7;"><strong>${escapeHtml(name)}</strong> posted ${escapeHtml(cruiseLine)}${ship ? " " + escapeHtml(ship) : ""}, departing ${escapeHtml(departDate)}${returnDate ? " - " + escapeHtml(returnDate) : ""} (skill: ${escapeHtml(SKILLS.includes(skill) ? skill : "any")}).</p>
      <p style="color:#6b7280;font-size:0.9rem;">It is waiting for review before it appears on /cruise. Players connect through us; the email stays private.</p>
    </div>`,
  });

  return NextResponse.json({ success: true, status: "pending_review" });
}
