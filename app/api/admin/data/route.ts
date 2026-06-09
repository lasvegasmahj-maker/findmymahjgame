import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TAB_TABLE: Record<string, string> = {
  inquiries: "inquiries",
  players: "player_listings",
  venues: "venue_listings",
  events: "event_listings",
  ads: "ad_listings",
  ambassadors: "ambassadors",
};

export async function GET(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tab = req.nextUrl.searchParams.get("tab") || "inquiries";
  const table = TAB_TABLE[tab];
  if (!table) {
    return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const [{ count: pending }, { count: newInq }, { count: newAmb }] = await Promise.all([
    supabase.from("player_listings").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("ambassadors").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return NextResponse.json({
    items: data ?? [],
    counts: { pending: pending ?? 0, newInquiries: newInq ?? 0, newAmbassadors: newAmb ?? 0 },
  });
}
