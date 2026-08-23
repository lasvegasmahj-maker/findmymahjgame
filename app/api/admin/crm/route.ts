import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { clampText } from "@/lib/sanitize";
import { lazyServerClient } from "@/lib/supabase-server";

const supabase = lazyServerClient();

const TYPES = ["teacher", "ambassador", "partner", "sponsor", "media", "org"];
const STATUSES = ["not_contacted", "contacted", "replied", "claimed", "activated", "declined", "do_not_contact"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function authed(req: NextRequest) {
  return verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}
function missingTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = clampText(req.nextUrl.searchParams.get("q"), 80);
  const status = clampText(req.nextUrl.searchParams.get("status"), 30);
  const wave = clampText(req.nextUrl.searchParams.get("wave"), 2);

  let query = supabase
    .from("crm_contacts")
    .select("*")
    .order("wave", { ascending: true, nullsFirst: false })
    .order("rank", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .limit(500);
  if (q) query = query.or(`name.ilike.%${q.replace(/[%_,().]/g, "")}%,organization.ilike.%${q.replace(/[%_,().]/g, "")}%,city.ilike.%${q.replace(/[%_,().]/g, "")}%`);
  if (status && STATUSES.includes(status)) query = query.eq("status", status);
  if (wave && ["1", "2", "3"].includes(wave)) query = query.eq("wave", Number(wave));

  const { data, error } = await query;
  if (error) {
    if (missingTable(error)) return NextResponse.json({ needsMigration: true, items: [] });
    console.error("crm list failed:", error.message);
    return NextResponse.json({ error: "Could not load contacts." }, { status: 500 });
  }
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => null)) || {};
  const name = clampText(b.name, 120);
  if (!name) return NextResponse.json({ error: "Please add a name." }, { status: 400 });
  const type = String(b.contact_type || "teacher");
  const row = {
    name,
    organization: clampText(b.organization, 160) || null,
    email: clampText(b.email, 254) || null,
    phone: clampText(b.phone, 40) || null,
    city: clampText(b.city, 80) || null,
    state: clampText(b.state, 30) || null,
    contact_type: TYPES.includes(type) ? type : "teacher",
    notes: clampText(b.notes, 1000) || null,
    wave: [1, 2, 3].includes(Number(b.wave)) ? Number(b.wave) : null,
  };
  const { error } = await supabase.from("crm_contacts").insert(row);
  if (error) {
    if (missingTable(error)) return NextResponse.json({ needsMigration: true }, { status: 409 });
    console.error("crm insert failed:", error.message);
    return NextResponse.json({ error: "Could not add the contact." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => null)) || {};
  const id = String(b.id || "");
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (b.status !== undefined && STATUSES.includes(String(b.status))) {
    patch.status = b.status;
    patch.last_touch = new Date().toISOString().slice(0, 10);
  }
  if (b.notes !== undefined) patch.notes = clampText(b.notes, 1000) || null;
  if (b.next_touch !== undefined) patch.next_touch = clampText(b.next_touch, 10) || null;
  if (b.contact_type !== undefined && TYPES.includes(String(b.contact_type))) patch.contact_type = b.contact_type;
  if (b.wave !== undefined && [1, 2, 3].includes(Number(b.wave))) patch.wave = Number(b.wave);
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  patch.updated_at = new Date().toISOString();

  const { error } = await supabase.from("crm_contacts").update(patch).eq("id", id);
  if (error) {
    console.error("crm update failed:", error.message);
    return NextResponse.json({ error: "Could not update the contact." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
