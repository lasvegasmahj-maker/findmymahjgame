import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clampText, isValidEmail } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";

// Player listings are created here server-side (service role) and always land
// as pending_review. The browser no longer writes player_listings directly: a
// restrictive RLS policy blocks anon inserts so nobody can self-publish a
// listing without review.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    name: clampText(b.name, 80),
    city: clampText(b.city, 80),
    state: clampText(b.state, 60),
    skill_level: SKILLS.includes(skill) ? skill : "any",
    availability: clampText(b.availability, 200) || null,
    bio: clampText(b.bio, 600) || null,
    contact_email: clampText(b.email, 254) || null,
    status: "pending_review",
  };

  const { error } = await supabase.from("player_listings").insert(row);
  if (error) return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });

  return NextResponse.json({ success: true });
}
