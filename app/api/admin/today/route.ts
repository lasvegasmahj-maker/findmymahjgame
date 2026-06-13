import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { signActionToken } from "@/lib/game-token";

// One read-only roll-up of everything waiting on the founder: listings to
// approve, new inquiries and ambassador applications, claimer-proposed edits,
// and match drafts. Match drafts have no other admin surface today (they only
// went out by email), so this page is their only safety net. Mutations stay on
// the existing audited routes; this endpoint never writes.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// A table the migration has not created yet must not blank the whole page.
function missingTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

async function countPending(table: string, column: string, value: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);
  if (error) {
    if (!missingTable(error)) console.error(`today count ${table} failed:`, error.message);
    return 0;
  }
  return count ?? 0;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://findmymahjgame.com";

  const [
    pendingPlayers,
    pendingVenues,
    pendingEvents,
    newInquiries,
    newAmbassadors,
    pendingEditsCount,
    draftsResult,
  ] = await Promise.all([
    countPending("player_listings", "status", "pending_review"),
    countPending("venue_listings", "status", "pending_review"),
    countPending("event_listings", "status", "pending_review"),
    countPending("inquiries", "status", "new"),
    countPending("ambassadors", "status", "new"),
    countPending("pending_edits", "status", "pending"),
    supabase
      .from("match_drafts")
      .select("id, city, day_pref, time_pref, request_ids, created_at")
      .eq("status", "draft")
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  if (draftsResult.error && !missingTable(draftsResult.error)) {
    console.error("today match_drafts failed:", draftsResult.error.message);
  }
  const draftRows = draftsResult.data ?? [];

  // Resolve player names in one query so each draft reads like the email did.
  const allRequestIds = [...new Set(draftRows.flatMap((d) => (d.request_ids as string[]) || []))];
  const namesById = new Map<string, string>();
  if (allRequestIds.length) {
    const { data: players } = await supabase
      .from("play_requests")
      .select("id, name")
      .in("id", allRequestIds);
    for (const p of players || []) namesById.set(p.id, p.name || "Player");
  }

  const matches = draftRows.map((d) => ({
    id: d.id as string,
    city: d.city as string,
    day_pref: (d.day_pref as string | null) || null,
    time_pref: (d.time_pref as string | null) || null,
    players: ((d.request_ids as string[]) || []).map((rid) => namesById.get(rid) || "Player"),
    created_at: d.created_at as string,
    approveUrl: `${base}/api/match/decide?token=${signActionToken("match-approve", d.id as string, 7)}`,
    skipUrl: `${base}/api/match/decide?token=${signActionToken("match-skip", d.id as string, 7)}`,
  }));

  return NextResponse.json({
    counts: {
      pendingPlayers,
      pendingVenues,
      pendingEvents,
      newInquiries,
      newAmbassadors,
      pendingEdits: pendingEditsCount,
      matchDrafts: matches.length,
    },
    matches,
  });
}
