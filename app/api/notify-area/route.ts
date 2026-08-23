import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { clampText, isValidEmail, escapeHtml } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { lazyServerClient } from "@/lib/supabase-server";

// Demand capture: when a discovery page has no inventory, players leave their
// email + area so we know where to recruit and can tell them when games appear.
// Stored as a play_request (the demand signal) tagged day_pref="area-notify".
const supabase = lazyServerClient();

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "notify-area", 5, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }
  const b = (await req.json().catch(() => null)) || {};
  const email = clampText(b.email, 254);
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  // The form calls this field optional but play_requests.name is NOT NULL, so a player who
  // skips it used to get a 500 on the main empty-state form. Verified against production.
  const name = clampText(b.name, 80) || "Not given";
  const city = clampText(b.city, 80) || null;
  const state = clampText(b.state, 60) || null;

  const { error } = await supabase.from("play_requests").insert({
    name,
    email: email.toLowerCase(),
    city,
    state,
    status: "new",
    day_pref: "area-notify",
  });
  if (error) {
    console.error("notify-area failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  await sendEmail({
    to: "hello@findmymahjgame.com",
    replyTo: email,
    kind: "area-notify",
    subject: `New area demand: ${city || "unknown city"}${state ? `, ${state}` : ""}`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
      <h2 style="color:#1a1f5e;">Someone wants Mahjong near them</h2>
      <p style="color:#374151;line-height:1.7;">${name ? `Name: <strong>${escapeHtml(name)}</strong><br/>` : ""}Email: <strong>${escapeHtml(email)}</strong><br/>Area: <strong>${escapeHtml(city || "n/a")}${state ? ", " + escapeHtml(state) : ""}</strong></p>
      <p style="color:#6b7280;font-size:0.9rem;">Demand signal captured from an empty discovery page. Recruit supply here.</p>
    </div>`,
  });

  return NextResponse.json({ success: true });
}
