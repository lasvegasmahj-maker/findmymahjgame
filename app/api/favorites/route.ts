import { NextRequest, NextResponse } from "next/server";
import { getEvent, getVenue } from "@/lib/search";
import { whenLabel } from "@/lib/event-display";
import { safeHttpUrl } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";

// Resolves a device's saved favorite ids to current published card data. Reads go through
// lib/search so unpublished listings drop out and private fields can never leak. Nothing
// is written server-side; favorites live only in the visitor's localStorage.

type Card = {
  id: string;
  kind: "event" | "teacher";
  name: string;
  city: string | null;
  state: string | null;
  when: string | null;
  type: string | null;
  url: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 50;

function idList(v: unknown): string[] | null {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.length > MAX_IDS) return null;
  const out = new Set<string>();
  for (const x of v) {
    if (typeof x !== "string" || !UUID.test(x)) return null;
    out.add(x.toLowerCase());
  }
  return Array.from(out);
}

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "favorites", 20, 60))) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Give it a minute and try again." },
      { status: 429 }
    );
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const events = idList((body as Record<string, unknown>).events);
  const teachers = idList((body as Record<string, unknown>).teachers);
  if (events === null || teachers === null) {
    return NextResponse.json(
      { ok: false, error: "events and teachers must each be an array of up to 50 listing ids." },
      { status: 400 }
    );
  }

  try {
    const [eventRows, teacherRows] = await Promise.all([
      Promise.all(events.map((id) => getEvent(id))),
      Promise.all(teachers.map((id) => getVenue(id))),
    ]);

    const eventCards: Card[] = [];
    eventRows.forEach((r) => {
      if (!r) return;
      eventCards.push({
        id: r.id,
        kind: "event",
        name: r.event_name || "Mahjong",
        city: r.city,
        state: r.state,
        when: whenLabel(r) || null,
        type: r.event_type,
        url: safeHttpUrl(r.registration_url) || safeHttpUrl(r.source_url) || null,
      });
    });

    const teacherCards: Card[] = [];
    teacherRows.forEach((r) => {
      if (!r) return;
      teacherCards.push({
        id: r.id,
        kind: "teacher",
        name: r.business_name,
        city: r.city,
        state: r.state,
        when: null,
        type: r.venue_type,
        url: safeHttpUrl(r.website) || `/teachers/${r.id}`,
      });
    });

    return NextResponse.json({ ok: true, events: eventCards, teachers: teacherCards });
  } catch (e) {
    console.error("favorites lookup failed:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { ok: false, error: "Favorites lookup is having trouble right now. Your saved list is still on your device." },
      { status: 500 }
    );
  }
}
