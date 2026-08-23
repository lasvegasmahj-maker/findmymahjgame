import { NextRequest, NextResponse } from "next/server";
import { extractIntent, rephraseApprovedAnswer } from "@/lib/ask-llm";
import { parseAskIntent, detectAskTopic } from "@/lib/ask-intent";
import { lookupRule, summarizeRulesGap, type RulesLookupResult } from "@/lib/rules/lookup";
import { lazyServerClient } from "@/lib/supabase-server";
import { searchEventsWithRelaxation, searchVenues, describeRelaxations } from "@/lib/search";
import { resolveLocation } from "@/lib/resolve-location";
import { formatDistance } from "@/lib/geo";
import { whenLabel } from "@/lib/event-display";
import { safeHttpUrl } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { track, type RecordClass } from "@/lib/analytics/events";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";

// Ask Find My Mahj. The question is interpreted into filters, deterministic search runs
// against published reviewed listings, and the answer sentence is composed from the real
// parameters and counts. No model writes factual text and no model sees a database row.

type Card = {
  id: string;
  kind: "event" | "teacher";
  name: string;
  city: string | null;
  state: string | null;
  when: string | null;
  distance: string | null;
  type: string | null;
  url: string | null;
};

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Unmatched rules questions are demand data. Only a scrubbed topic summary is stored,
// never the raw question, so the operator queue learns what players ask without the site
// keeping conversations.
async function logRulesGap(question: string, rules: RulesLookupResult) {
  try {
    await lazyServerClient().from("outreach_events").insert({
      agent: "ask-rules-gap",
      action: "rules_question_unmatched",
      reason: summarizeRulesGap(question),
      evidence: rules.unsupported_reason ?? null,
      deterministic: true,
    });
  } catch (e) {
    console.error("rules gap log failed:", e instanceof Error ? e.message : e);
  }
}

async function composeRulesAnswer(rules: RulesLookupResult, question: string): Promise<string> {
  if (rules.needs_clarification) return rules.needs_clarification;
  if (!rules.matched || !rules.answer) return rules.answer ?? "";
  const approved = rules.house_note ? `${rules.answer} ${rules.house_note}` : rules.answer;
  return rephraseApprovedAnswer(approved, question);
}

// Anonymous asks count as real usage unless the request carries a session cookie whose
// profile is classified test (the admin-driven QA walkthrough), so QA traffic run against
// this route in production never inflates real ask numbers.
async function resolveAskRecordClass(req: NextRequest): Promise<RecordClass> {
  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return "real_external";
  try {
    const { data } = await lazyServerClient()
      .from("profiles")
      .select("record_class")
      .eq("id", session.userId)
      .maybeSingle();
    return data?.record_class === "test" ? "test" : "real_external";
  } catch {
    return "real_external";
  }
}

function trackAskOutcome(
  recordClass: RecordClass,
  topic: "directory" | "rules" | "mixed",
  results: number,
  matched: boolean
) {
  const supabase = lazyServerClient();
  const props = { topic, results, matched };
  void track(supabase, "ask_submitted", { props, recordClass });
  const intentName =
    topic === "directory" ? "ask_intent_directory" : topic === "rules" ? "ask_intent_rules" : "ask_intent_mixed";
  void track(supabase, intentName, { props, recordClass });
  if (!matched) void track(supabase, "ask_unverified", { props, recordClass });
}

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "ask", 15, 60))) {
    return NextResponse.json({ error: "Too many questions at once. Give it a minute and ask again." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const question = typeof body?.q === "string" ? body.q.slice(0, 200) : "";
  const recordClass = await resolveAskRecordClass(req);
  try {
  const topic = detectAskTopic(question);
  let rules: RulesLookupResult | null = null;
  if (topic !== "directory") {
    rules = lookupRule({ question });
    if (!rules.matched && !rules.needs_clarification) void logRulesGap(question, rules);
  }

  if (topic === "rules" && rules) {
    const answer = await composeRulesAnswer(rules, question);
    trackAskOutcome(recordClass, topic, 0, rules.matched);
    return NextResponse.json({
      ok: true,
      answer,
      results: [],
      suggestions: [
        { label: "Find a teacher", href: "/teachers" },
        { label: "Browse events", href: "/events" },
      ],
      intent: parseAskIntent(question),
      via: "rules",
      topic,
      rules,
    });
  }

  const [{ intent, via }, rulesLead] = await Promise.all([
    extractIntent(question),
    // An unmatched rules half contributes nothing useful to a mixed answer; prepending a
    // cannot-verify paragraph to real directory results would bury them.
    rules && rules.matched ? composeRulesAnswer(rules, question) : Promise.resolve(""),
  ]);
  const withRulesLead = (answer: string) => (rulesLead ? `${rulesLead} ${answer}` : answer);
  const extras = rules ? { topic, rules } : { topic };

  if (!intent.recognized) {
    trackAskOutcome(recordClass, topic, 0, Boolean(rules?.matched));
    return NextResponse.json({
      ok: true,
      answer: withRulesLead(
        "I can help you find reviewed mahjong games, teachers, and events, or answer American Mahjong rules questions. Try asking something like: where can I play Saturday morning near Naples? Or a rules question, like: can I use a joker in a pair?"
      ),
      results: [],
      suggestions: [
        { label: "Browse all events", href: "/events" },
        { label: "Find a teacher", href: "/teachers" },
      ],
      intent,
      via,
      ...extras,
    });
  }

  const located = intent.location ? await resolveLocation(intent.location) : null;
  const placeLabel = located ? located.label : intent.location ? titleCase(intent.location) : null;

  const suggestions: Array<{ label: string; href: string }> = [];
  const browseQs = new URLSearchParams();
  if (intent.location) browseQs.set("near", intent.location);
  if (located && intent.radiusMiles) browseQs.set("radius", String(intent.radiusMiles));

  if (intent.kind === "teachers") {
    const rows = await searchVenues({
      venueKind: "teacher",
      center: located ? located.coords : null,
      radiusMiles: located ? intent.radiusMiles : null,
      near: located ? null : intent.location,
      limit: 8,
    });
    const cards: Card[] = rows.map((r) => ({
      id: r.id,
      kind: "teacher",
      name: r.business_name,
      city: r.city,
      state: r.state,
      when: null,
      distance: r.distanceMiles != null ? formatDistance(r.distanceMiles, r.geo_precision) : null,
      type: r.venue_type,
      url: safeHttpUrl(r.website) || `/teachers/${r.id}`,
    }));
    const where = placeLabel ? ` near ${placeLabel}` : "";
    const answer = cards.length
      ? `Found ${cards.length} mahjong teacher${cards.length === 1 ? "" : "s"}${where}, every listing reviewed by a real person.`
      : `No teachers are listed${where} yet. We would rather show you none than guess.`;
    if (!cards.length) {
      suggestions.push({ label: "Browse all teachers", href: "/teachers" });
      if (intent.location) suggestions.push({ label: "Get notified when one is added", href: `/teachers?near=${encodeURIComponent(intent.location)}` });
    }
    trackAskOutcome(recordClass, topic, cards.length, cards.length > 0 || Boolean(rules?.matched));
    return NextResponse.json({ ok: true, answer: withRulesLead(answer), results: cards, suggestions, intent, via, ...extras });
  }

  const out = await searchEventsWithRelaxation(
    {
      center: located ? located.coords : null,
      radiusMiles: located ? intent.radiusMiles : null,
      near: located ? null : intent.location,
      types: intent.types,
      daysOfWeek: intent.days.length ? intent.days : null,
      timeOfDay: intent.timeOfDay,
      limit: 8,
    },
    1
  );
  // A category the player named is a hard constraint. Answering "tournaments?" with open
  // plays, however clearly labelled, buries the honest "none exist yet". The ladder may widen
  // radius, day, and time, but never the asked-for category.
  const typeWasRelaxed = intent.types && !out.exact && out.relaxations.some((r) => r.constraint === "type");
  if (typeWasRelaxed) out.results = [];

  const cards: Card[] = out.results.slice(0, 8).map((r) => ({
    id: r.id,
    kind: "event",
    name: r.event_name,
    city: r.city,
    state: r.state,
    when: whenLabel(r) || null,
    distance: r.distanceMiles != null ? formatDistance(r.distanceMiles, r.geo_precision) : null,
    type: r.event_type,
    url: safeHttpUrl(r.registration_url) || safeHttpUrl(r.source_url) || null,
  }));

  const askedTournaments = intent.types?.includes("tournament");
  const where = placeLabel ? ` near ${placeLabel}` : "";
  const dayPart = intent.days.length ? ` on ${intent.days.map(titleCase).join(" or ")}` : "";
  const todPart = intent.timeOfDay ? ` in the ${intent.timeOfDay}` : "";

  let answer: string;
  if (cards.length === 0) {
    answer = askedTournaments
      ? `No tournaments are listed${where} yet, and we never relabel casual games as tournaments to fill the page.`
      : `Nothing reviewed matches${where}${dayPart}${todPart} yet.`;
    suggestions.push({ label: "Browse all events", href: `/events${intent.location ? `?near=${encodeURIComponent(intent.location)}` : ""}` });
    if (located) suggestions.push({ label: "Widen to 50 miles", href: `/events?near=${encodeURIComponent(intent.location!)}&radius=50` });
    if (intent.location) suggestions.push({ label: "Get notified when something is added", href: `/events?near=${encodeURIComponent(intent.location)}` });
  } else {
    const relaxNote = out.exact ? "" : ` ${describeRelaxations(out.relaxations) || ""}`;
    answer = `Found ${cards.length} listing${cards.length === 1 ? "" : "s"}${where}${dayPart}${todPart}, every one reviewed before publishing.${relaxNote}`.trim();
    const bq = browseQs.toString();
    suggestions.push({ label: bq ? "See these on the Events page" : "Browse the Events page", href: `/events${bq ? `?${bq}` : ""}` });
  }

  trackAskOutcome(recordClass, topic, cards.length, cards.length > 0 || Boolean(rules?.matched));
  return NextResponse.json({
    ok: true,
    answer: withRulesLead(answer),
    results: cards,
    relaxations: out.exact ? [] : out.relaxations,
    suggestions,
    intent,
    via,
    ...extras,
  });
  } catch (e) {
    console.error("ask failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Search is having trouble right now. The Events page still works.", results: [], suggestions: [{ label: "Browse all events", href: "/events" }] }, { status: 500 });
  }
}
