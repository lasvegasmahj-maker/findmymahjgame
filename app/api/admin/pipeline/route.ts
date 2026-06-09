import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { clampText } from "@/lib/sanitize";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STAGES = ["identified", "contacted", "conversation", "candidate", "approved", "activated"];
const HEAT = ["hot", "warm", "cold"];
const SOURCES = ["oh_my_mahjong", "referral", "inbound", "other"];

// Admin-only. POST {action:"create", ...fields} or {action:"update", id, ...fields}.
export async function POST(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = await req.json().catch(() => ({}));

  if (b.action === "update") {
    if (!b.id || typeof b.id !== "string") return NextResponse.json({ error: "Missing id." }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (b.stage !== undefined) patch.stage = STAGES.includes(b.stage) ? b.stage : "identified";
    if (b.heat !== undefined) patch.heat = HEAT.includes(b.heat) ? b.heat : "warm";
    if (b.next_action !== undefined) patch.next_action = clampText(b.next_action, 200) || null;
    if (b.notes !== undefined) patch.notes = clampText(b.notes, 1000) || null;
    const { error } = await supabase.from("warm_contacts").update(patch).eq("id", b.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // default: create
  if (!b?.name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  const row = {
    name: clampText(b.name, 120),
    email: clampText(b.email, 254) || null,
    phone: clampText(b.phone, 40) || null,
    city: clampText(b.city, 80) || null,
    state: clampText(b.state, 60) || null,
    source: SOURCES.includes(b.source) ? b.source : "oh_my_mahjong",
    role: clampText(b.role, 40) || null,
    heat: HEAT.includes(b.heat) ? b.heat : "warm",
    priority_city: !!b.priority_city,
    stage: STAGES.includes(b.stage) ? b.stage : "identified",
    next_action: clampText(b.next_action, 200) || null,
    notes: clampText(b.notes, 1000) || null,
  };
  const { error } = await supabase.from("warm_contacts").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
