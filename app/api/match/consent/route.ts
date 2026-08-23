import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";
import { isLaunched, canUseDarkFeature } from "@/lib/launch-gates";
import { CONSENT_VERSION } from "@/lib/match/consent";
import { rateLimit } from "@/lib/rate-limit";
import { clampText } from "@/lib/sanitize";
import { toStateAbbr } from "@/lib/near-match";
import { detectPrivateLocation } from "@/lib/private-location";
import { track } from "@/lib/analytics/events";
import { DAY_NAMES, type DayName, type TimeOfDay } from "@/lib/schedule";

// Mahj Match consent and preferences. Every write here is server-checked and
// gated behind launch_player_matching (the canUseDarkFeature pattern): while dark,
// only record_class 'test' accounts may opt in, update, or deactivate, so no real
// person can reach matching before it launches.
const supabase = lazyServerClient();

const TIME_OF_DAY_VALUES: readonly TimeOfDay[] = ["morning", "afternoon", "evening"];
const SKILL_VALUES = ["beginner", "intermediate", "advanced", "any"] as const;
const SOCIAL_STYLE_VALUES = ["social", "competitive", "either"] as const;
const HOST_PREF_VALUES = ["can_host", "prefer_travel", "either"] as const;
const GROUP_PREF_VALUES = ["same_group", "new_people", "either"] as const;
const MAX_AVAILABILITY_SLOTS = 21; // 7 days x 3 periods, the natural ceiling
const MAX_CITY_LENGTH = 80;

type ProfileFields = {
  city?: string;
  state?: string;
  travel_radius_miles?: number;
  availability?: { day: DayName; time_of_day: TimeOfDay }[];
  variant?: string;
  skill?: string | null;
  social_style?: string | null;
  host_pref?: string | null;
  group_pref?: string | null;
};

// Parses only the keys present on the body, so the opt-in form (which sends
// everything at once) and update-preferences (which may send a subset) share one
// validator. skill/social_style/host_pref/group_pref accept an explicit null to
// clear a preference; city/state/travel radius/availability do not, since matching
// cannot work without them once a player is opted in.
function parseProfileFields(body: Record<string, unknown>): { ok: true; fields: ProfileFields } | { ok: false; error: string } {
  const fields: ProfileFields = {};

  if ("city" in body) {
    const city = clampText(body.city, MAX_CITY_LENGTH).trim();
    if (!city) return { ok: false, error: "Enter a city." };
    fields.city = city;
  }
  if ("state" in body) {
    const state = toStateAbbr(body.state as string);
    if (!state) return { ok: false, error: "Enter a valid US state." };
    fields.state = state;
  }
  if ("travel_radius_miles" in body) {
    const n = Number(body.travel_radius_miles);
    if (!Number.isInteger(n) || n < 1 || n > 200) {
      return { ok: false, error: "Travel radius must be between 1 and 200 miles." };
    }
    fields.travel_radius_miles = n;
  }
  if ("availability" in body) {
    const raw = body.availability;
    if (!Array.isArray(raw) || raw.length > MAX_AVAILABILITY_SLOTS) {
      return { ok: false, error: "Invalid availability." };
    }
    const out: { day: DayName; time_of_day: TimeOfDay }[] = [];
    const seen = new Set<string>();
    for (const item of raw) {
      const day = item && typeof item === "object" ? (item as Record<string, unknown>).day : undefined;
      const tod = item && typeof item === "object" ? (item as Record<string, unknown>).time_of_day : undefined;
      if (!(DAY_NAMES as readonly string[]).includes(day as string)) return { ok: false, error: "Invalid availability." };
      if (!TIME_OF_DAY_VALUES.includes(tod as TimeOfDay)) return { ok: false, error: "Invalid availability." };
      const key = `${day}:${tod}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ day: day as DayName, time_of_day: tod as TimeOfDay });
    }
    fields.availability = out;
  }
  if ("variant" in body) {
    // The directory is American mahjong only; there is no UI path today for any
    // other variant, so any other value is rejected rather than stored unused.
    if (body.variant !== "AMERICAN") return { ok: false, error: "Only American mahjong is supported right now." };
    fields.variant = "AMERICAN";
  }
  if ("skill" in body) {
    const v = body.skill === null ? null : String(body.skill || "");
    if (v !== null && !(SKILL_VALUES as readonly string[]).includes(v)) return { ok: false, error: "Invalid skill level." };
    fields.skill = v;
  }
  if ("social_style" in body) {
    const v = body.social_style === null ? null : String(body.social_style || "");
    if (v !== null && !(SOCIAL_STYLE_VALUES as readonly string[]).includes(v)) return { ok: false, error: "Invalid social style." };
    fields.social_style = v;
  }
  if ("host_pref" in body) {
    const v = body.host_pref === null ? null : String(body.host_pref || "");
    if (v !== null && !(HOST_PREF_VALUES as readonly string[]).includes(v)) return { ok: false, error: "Invalid hosting preference." };
    fields.host_pref = v;
  }
  if ("group_pref" in body) {
    const v = body.group_pref === null ? null : String(body.group_pref || "");
    if (v !== null && !(GROUP_PREF_VALUES as readonly string[]).includes(v)) return { ok: false, error: "Invalid group preference." };
    fields.group_pref = v;
  }

  // City and state are the only free-ish text this form accepts, and a street
  // address in either narrows a player to a block: exactly what the private
  // location policy exists to stop. detectPrivateLocation scans venue/address/
  // description/day_time, not city/state directly, so the combined string goes
  // through as "address" to reach its actual street-detail check.
  if (fields.city || fields.state) {
    const signals = detectPrivateLocation({ address: [fields.city, fields.state].filter(Boolean).join(", ") });
    if (signals.hasStreetDetail) {
      return { ok: false, error: "Enter a city, not a street address. We never share your exact address." };
    }
  }

  return { ok: true, fields };
}

type Auth = { session: { userId: string; role: "player" | "provider" }; profile: { deactivated_at: string | null; record_class: string } };

async function loadSessionProfile(req: NextRequest): Promise<Auth | { error: NextResponse }> {
  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };

  const { data: profile, error } = await supabase
    .from("profiles").select("deactivated_at, record_class").eq("id", session.userId).maybeSingle();
  if (error) {
    console.error("match/consent profile read failed:", error.message);
    return { error: NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }) };
  }
  if (!profile) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  if (profile.deactivated_at) return { error: NextResponse.json({ error: "Account deactivated" }, { status: 403 }) };
  return { session, profile };
}

// Read-only status for the signed-in caller's own matching profile. There is no
// path here to pass another user's id, so this can only ever answer for the
// session that made the request.
export async function GET(req: NextRequest) {
  const auth = await loadSessionProfile(req);
  if ("error" in auth) return auth.error;
  const { session, profile } = auth;

  const launched = await isLaunched(supabase, "playerMatching");
  if (!canUseDarkFeature(launched, profile.record_class)) {
    return NextResponse.json({ error: "Mahj Match is not open yet." }, { status: 403 });
  }

  const { data: mp, error } = await supabase
    .from("matching_profiles")
    .select("adult_affirmed_at, consent_version, matching_opt_in_at, matching_deactivated_at, city, state, travel_radius_miles, availability, variant, skill, social_style, host_pref, group_pref")
    .eq("user_id", session.userId)
    .maybeSingle();
  if (error) {
    console.error("match/consent read failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!mp) return NextResponse.json({ ok: true, optedIn: false });

  return NextResponse.json({
    ok: true,
    optedIn: Boolean(mp.matching_opt_in_at) && !mp.matching_deactivated_at && mp.consent_version === CONSENT_VERSION,
    consentVersion: mp.consent_version,
    adultAffirmedAt: mp.adult_affirmed_at,
    matchingOptInAt: mp.matching_opt_in_at,
    matchingDeactivatedAt: mp.matching_deactivated_at,
    city: mp.city,
    state: mp.state,
    travelRadiusMiles: mp.travel_radius_miles,
    availability: mp.availability,
    variant: mp.variant,
    skill: mp.skill,
    socialStyle: mp.social_style,
    hostPref: mp.host_pref,
    groupPref: mp.group_pref,
  });
}

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "match-consent", 20, 60))) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  const auth = await loadSessionProfile(req);
  if ("error" in auth) return auth.error;
  const { session, profile } = auth;

  const launched = await isLaunched(supabase, "playerMatching");
  if (!canUseDarkFeature(launched, profile.record_class)) {
    return NextResponse.json({ error: "Mahj Match is not open yet." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const action = String(body?.action || "");

  if (action === "opt_in") {
    // Both facts must be affirmed explicitly; anything else, including a missing
    // key or a truthy-but-not-boolean value, is rejected rather than coerced.
    if (body.adult !== true || body.agree !== true) {
      return NextResponse.json({ error: "Confirm you are 18 or older and agree to how we share your information." }, { status: 400 });
    }
    const parsed = parseProfileFields(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    if (!parsed.fields.city || !parsed.fields.state || parsed.fields.travel_radius_miles === undefined) {
      return NextResponse.json({ error: "Enter your city, state, and travel radius to opt in." }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("matching_profiles").select("matching_opt_in_at").eq("user_id", session.userId).maybeSingle();
    const firstOptIn = !existing?.matching_opt_in_at;

    const now = new Date().toISOString();
    const { error } = await supabase.from("matching_profiles").upsert(
      {
        user_id: session.userId,
        adult_affirmed_at: now,
        consent_version: CONSENT_VERSION,
        matching_opt_in_at: now,
        matching_deactivated_at: null,
        record_class: profile.record_class,
        updated_at: now,
        ...parsed.fields,
        availability: parsed.fields.availability ?? [],
      },
      { onConflict: "user_id" }
    );
    if (error) {
      console.error("match/consent opt_in failed:", error.message);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }

    await supabase.from("account_events").insert({ user_id: session.userId, action: "matching_opt_in" });
    if (firstOptIn) await track(supabase, "matching_opt_in", { recordClass: profile.record_class as "real_external" | "test" | "internal" | "seed_demo" });
    return NextResponse.json({ ok: true });
  }

  if (action === "update_preferences") {
    const { data: existing } = await supabase
      .from("matching_profiles").select("matching_opt_in_at").eq("user_id", session.userId).maybeSingle();
    if (!existing?.matching_opt_in_at) {
      return NextResponse.json({ error: "Opt in to Mahj Match first." }, { status: 400 });
    }
    const parsed = parseProfileFields(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    if (Object.keys(parsed.fields).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    const { error } = await supabase
      .from("matching_profiles")
      .update({ ...parsed.fields, updated_at: new Date().toISOString() })
      .eq("user_id", session.userId);
    if (error) {
      console.error("match/consent update failed:", error.message);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "deactivate") {
    // Flips one flag. Leaving formed tables is the player's own explicit action on
    // the table page; nothing here touches tables or seats.
    const { data: existing } = await supabase
      .from("matching_profiles").select("matching_opt_in_at").eq("user_id", session.userId).maybeSingle();
    if (!existing?.matching_opt_in_at) {
      return NextResponse.json({ error: "You are not opted in to Mahj Match." }, { status: 400 });
    }
    const { error } = await supabase
      .from("matching_profiles")
      .update({ matching_deactivated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", session.userId);
    if (error) {
      console.error("match/consent deactivate failed:", error.message);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
    await supabase.from("account_events").insert({ user_id: session.userId, action: "matching_deactivated" });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
