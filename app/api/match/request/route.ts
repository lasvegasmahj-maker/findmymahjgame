import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";
import { readMatchingConsent } from "@/lib/match/consent";
import { isLaunched, canUseDarkFeature } from "@/lib/launch-gates";
import { rateLimit } from "@/lib/rate-limit";
import { clampText } from "@/lib/sanitize";
import { DAYS_OF_WEEK, TIMES_OF_DAY, firstNameOf } from "@/lib/match/engine";
import { getProfileBasics } from "@/lib/match/service";
import { track } from "@/lib/analytics/events";
import { isMahjongVariant } from "@/lib/mahjong-variant";

const supabase = lazyServerClient();

// A player's standing request is "active" the whole time it can affect matching: waiting to be
// pooled, sitting in a proposed table, or already matched into a confirmed one.
const ACTIVE_STATUSES = ["open", "proposed", "matched"];

function isDay(v: unknown): v is (typeof DAYS_OF_WEEK)[number] {
  return typeof v === "string" && (DAYS_OF_WEEK as readonly string[]).includes(v);
}
function isTime(v: unknown): v is (typeof TIMES_OF_DAY)[number] {
  return typeof v === "string" && (TIMES_OF_DAY as readonly string[]).includes(v);
}

export async function POST(req: NextRequest) {
  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (!(await rateLimit(req, "match-request", 10, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  // Consent and the launch gate are checked on every matching operation, including creating or
  // cancelling a request; there is no path here that skips either.
  const consent = await readMatchingConsent(supabase, session.userId);
  const launched = await isLaunched(supabase, "playerMatching");
  if (!canUseDarkFeature(launched, consent.recordClass)) {
    return NextResponse.json({ error: "Mahj Match is not open to the public yet." }, { status: 403 });
  }
  if (!consent.eligible) {
    return NextResponse.json({ error: "Finish setting up Mahj Match in your account before requesting a table." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "");
  if (action !== "create" && action !== "cancel") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { data: existing, error: existingErr } = await supabase
    .from("play_requests")
    .select("id, status")
    .eq("user_id", session.userId)
    .in("status", ACTIVE_STATUSES)
    .maybeSingle();
  if (existingErr) {
    console.error("match/request existing lookup failed:", existingErr.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  if (action === "cancel") {
    if (!existing) return NextResponse.json({ error: "You have no active request to cancel." }, { status: 404 });
    if (existing.status !== "open") {
      return NextResponse.json(
        { error: "You already have a table proposal or a matched table. Respond to it on the Mahj Match page instead." },
        { status: 409 }
      );
    }
    const { error } = await supabase.from("play_requests").update({ status: "cancelled" }).eq("id", existing.id);
    if (error) {
      console.error("match/request cancel failed:", error.message);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // action === "create"
  if (existing) {
    return NextResponse.json(
      { error: "You already have an active Mahj Match request.", status: existing.status },
      { status: 409 }
    );
  }

  const city = clampText(body?.city, 80).trim();
  const state = clampText(body?.state, 60).trim();
  if (!city || !state) {
    return NextResponse.json({ error: "Add your city and state so we can find nearby players." }, { status: 400 });
  }
  const dayPref = isDay(body?.day) ? body.day : null;
  const timePref = isTime(body?.time) ? body.time : null;
  const variant = isMahjongVariant(body?.variant) ? body.variant : "AMERICAN";

  const profile = await getProfileBasics(supabase, session.userId);
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (profile.deactivatedAt) return NextResponse.json({ error: "Account deactivated" }, { status: 403 });

  const { data: row, error } = await supabase
    .from("play_requests")
    .insert({
      user_id: session.userId,
      name: profile.displayName || "Player",
      city,
      state,
      day_pref: dayPref,
      time_pref: timePref,
      variant,
      status: "open",
      record_class: profile.recordClass,
    })
    .select("id, status, city, state, day_pref, time_pref, variant, created_at")
    .single();
  if (error || !row) {
    console.error("match/request create failed:", error?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  await track(supabase, "match_request_created", {
    recordClass: profile.recordClass,
    props: { variant, hasDay: !!dayPref, hasTime: !!timePref },
  });

  return NextResponse.json({
    ok: true,
    request: {
      id: row.id,
      status: row.status,
      city: row.city,
      state: row.state,
      day: row.day_pref,
      time: row.time_pref,
      variant: row.variant,
    },
  });
}

export async function GET(req: NextRequest) {
  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const history = await loadHistory(session.userId);

  const { data: request, error } = await supabase
    .from("play_requests")
    .select("id, status, city, state, day_pref, time_pref, variant, created_at")
    .eq("user_id", session.userId)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("match/request GET failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!request) return NextResponse.json({ ok: true, request: null, proposal: null, table: null, history });

  const base = {
    id: request.id,
    status: request.status,
    city: request.city,
    state: request.state,
    day: request.day_pref,
    time: request.time_pref,
    variant: request.variant,
  };

  if (request.status === "open") {
    return NextResponse.json({ ok: true, request: base, proposal: null, table: null, history });
  }

  const { data: seat } = await supabase
    .from("table_seats")
    .select("id, table_id, status")
    .eq("user_id", session.userId)
    .in("status", ["invited", "accepted"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!seat) return NextResponse.json({ ok: true, request: base, proposal: null, table: null, history });

  const { data: table } = await supabase
    .from("tables")
    .select("id, status, share_code, city, state, day_of_week, time_of_day, venue_name")
    .eq("id", seat.table_id)
    .maybeSingle();
  if (!table) return NextResponse.json({ ok: true, request: base, proposal: null, table: null, history });

  const { data: otherSeats } = await supabase
    .from("table_seats")
    .select("user_id, status")
    .eq("table_id", table.id)
    .neq("user_id", session.userId)
    .in("status", ["invited", "accepted"]);

  const others = await Promise.all(
    (otherSeats || []).map(async (s) => {
      const p = s.user_id ? await getProfileBasics(supabase, s.user_id) : null;
      return { status: s.status as string, displayName: p?.displayName ?? null };
    })
  );

  if (table.status === "proposed" || table.status === "forming") {
    return NextResponse.json({
      ok: true,
      request: base,
      table: null,
      history,
      proposal: {
        tableId: table.id,
        mySeatStatus: seat.status,
        day: table.day_of_week,
        time: table.time_of_day,
        city: table.city,
        state: table.state,
        variant: request.variant,
        others: others.map((o) => ({ firstName: firstNameOf(o.displayName), accepted: o.status === "accepted" })),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    request: base,
    proposal: null,
    history,
    table: {
      id: table.id,
      shareCode: table.share_code,
      status: table.status,
      day: table.day_of_week,
      time: table.time_of_day,
      area: table.venue_name || table.city,
      members: others.map((o) => o.displayName || "A player"),
    },
  });
}

type HistoryEntry = {
  tableId: string;
  status: string;
  seatStatus: string;
  day: string | null;
  time: string | null;
  city: string | null;
};

// Past seats only: anything no longer invited or accepted, so the currently active proposal or
// table (already returned above) never double-appears in the history list.
async function loadHistory(userId: string): Promise<HistoryEntry[]> {
  const { data: pastSeats } = await supabase
    .from("table_seats")
    .select("table_id, status, created_at")
    .eq("user_id", userId)
    .in("status", ["declined", "left"])
    .order("created_at", { ascending: false })
    .limit(10);
  if (!pastSeats?.length) return [];

  const tableIds = [...new Set(pastSeats.map((s) => s.table_id as string))];
  const { data: tableRows } = await supabase
    .from("tables")
    .select("id, status, day_of_week, time_of_day, city")
    .in("id", tableIds);
  const byId = new Map((tableRows || []).map((t) => [t.id, t]));

  return pastSeats
    .map((s) => {
      const t = byId.get(s.table_id);
      if (!t) return null;
      return { tableId: t.id, status: t.status, seatStatus: s.status, day: t.day_of_week, time: t.time_of_day, city: t.city };
    })
    .filter((v): v is HistoryEntry => v !== null);
}
