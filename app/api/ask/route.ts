import { NextRequest, NextResponse } from "next/server";
import { extractIntent } from "@/lib/ask-llm";
import { searchEventsWithRelaxation, searchVenues, describeRelaxations } from "@/lib/search";
import { resolveLocation } from "@/lib/resolve-location";
import { formatDistance } from "@/lib/geo";
import { whenLabel } from "@/lib/event-display";
import { safeHttpUrl } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";

// Ask Find My Mahj. The question is interpreted into filters, deterministic search runs
// against published verified listings, and the answer sentence is composed from the real
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

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "ask", 15, 60))) {
    return NextResponse.json({ error: "Too many questions at once. Give it a minute and ask again." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const question = typeof body?.q === "string" ? body.q.slice(0, 200) : "";
  try {
  const { intent, via } = await extractIntent(question);

  if (!intent.recognized) {
    return NextResponse.json({
      ok: true,
      answer:
        "I can help you find verified mahjong games, teachers, leagues, and events. Try asking something like: where can I play Saturday morning near Naples?",
      results: [],
      suggestions: [
        { label: "Browse all events", href: "/events" },
        { label: "Find a teacher", href: "/teachers" },
      ],
      intent,
      via,
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
    return NextResponse.json({ ok: true, answer, results: cards, suggestions, intent, via });
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
      : `Nothing verified matches${where}${dayPart}${todPart} yet.`;
    suggestions.push({ label: "Browse all events", href: `/events${intent.location ? `?near=${encodeURIComponent(intent.location)}` : ""}` });
    if (located) suggestions.push({ label: "Widen to 50 miles", href: `/events?near=${encodeURIComponent(intent.location!)}&radius=50` });
    if (intent.location) suggestions.push({ label: "Get notified when something is added", href: `/events?near=${encodeURIComponent(intent.location)}` });
  } else {
    const relaxNote = out.exact ? "" : ` ${describeRelaxations(out.relaxations) || ""}`;
    answer = `Found ${cards.length} listing${cards.length === 1 ? "" : "s"}${where}${dayPart}${todPart}, every one reviewed before publishing.${relaxNote}`.trim();
    const bq = browseQs.toString();
    suggestions.push({ label: bq ? "See these on the Events page" : "Browse the Events page", href: `/events${bq ? `?${bq}` : ""}` });
  }

  return NextResponse.json({
    ok: true,
    answer,
    results: cards,
    relaxations: out.exact ? [] : out.relaxations,
    suggestions,
    intent,
    via,
  });
  } catch (e) {
    console.error("ask failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Search is having trouble right now. The Events page still works.", results: [], suggestions: [{ label: "Browse all events", href: "/events" }] }, { status: 500 });
  }
}
