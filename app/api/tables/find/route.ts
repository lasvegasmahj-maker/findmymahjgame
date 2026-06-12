import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Public-safe search for forming tables near a town. Returns no contact info.
export async function GET(req: NextRequest) {
  if (!(await rateLimit(req, "tables-find", 20, 60))) {
    return NextResponse.json({ tables: [] }, { status: 429 });
  }
  const city = (req.nextUrl.searchParams.get("city") || "").trim().slice(0, 80).replace(/[%_]/g, "");
  if (!city) return NextResponse.json({ tables: [] });

  const { data: rows } = await supabase
    .from("tables")
    .select("id, share_code, day_of_week, time_of_day, venue_name, city, state, skill, seats_total, status")
    .neq("status", "full")
    .ilike("city", `%${city}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  const tables = [];
  for (const r of rows || []) {
    const { count } = await supabase
      .from("table_seats")
      .select("id", { count: "exact", head: true })
      .eq("table_id", r.id);
    tables.push({
      share_code: r.share_code,
      day_of_week: r.day_of_week,
      time_of_day: r.time_of_day,
      venue_name: r.venue_name,
      city: r.city,
      state: r.state,
      skill: r.skill,
      seats_total: r.seats_total || 4,
      filled: count ?? 1,
    });
  }

  // Safety ruling (red team #1): nearly-full tables are never surfaced in
  // public search. A table one seat from full is a committed group of women;
  // its last chair fills through the host's own shared link or, later, the
  // host-approved Bench - never by a stranger finding it here. Recency order;
  // never sort by how close to full a table is.
  const safe = tables.filter((t) => t.seats_total - t.filled !== 1);
  return NextResponse.json({ tables: safe });
}
