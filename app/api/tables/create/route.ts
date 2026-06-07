import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { clampText, isValidEmail } from "@/lib/sanitize";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = ["Morning", "Afternoon", "Evening"];
const VENUES = ["public", "home"];
const SKILLS = ["anyone", "beginner", "experienced"];

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));

  if (!b?.hostName || (!b?.hostPhone && !b?.hostEmail)) {
    return NextResponse.json({ error: "Please add your name and a phone or email." }, { status: 400 });
  }
  if (b.hostEmail && !isValidEmail(b.hostEmail)) {
    return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
  }

  const shareCode = crypto.randomBytes(4).toString("hex");
  const row = {
    share_code: shareCode,
    host_name: clampText(b.hostName, 80),
    host_phone: clampText(b.hostPhone, 40) || null,
    host_email: clampText(b.hostEmail, 254) || null,
    city: clampText(b.city, 80) || null,
    state: clampText(b.state, 60) || null,
    day_of_week: DAYS.includes(b.day) ? b.day : null,
    time_of_day: TIMES.includes(b.time) ? b.time : null,
    venue_type: VENUES.includes(b.venueType) ? b.venueType : "public",
    venue_name: clampText(b.venueName, 160) || null,
    skill: SKILLS.includes(b.skill) ? b.skill : "anyone",
    seats_total: 4,
    status: "forming",
    referred_by: clampText(b.referredBy, 40) || null,
  };

  const { data, error } = await supabase.from("tables").insert(row).select("id, share_code").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("table_seats").insert({
    table_id: data.id,
    name: row.host_name,
    phone: row.host_phone,
    email: row.host_email,
    is_host: true,
  });

  return NextResponse.json({ shareCode: data.share_code });
}
