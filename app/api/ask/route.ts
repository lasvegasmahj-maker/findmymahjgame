import { NextRequest, NextResponse } from "next/server";
import {
  MAX_QUESTION_CHARS,
  askedEntryIds,
  buildFollowups,
  cancelPhrase,
  classifyTopic,
  composeWithModel,
  entryById,
  excludedIds,
  isSmallTalk,
  lookup,
  makeLimiters,
  modelEligible,
  normalizeQuestion,
  placeAfterPrep,
  replyStaysReply,
  type ClarifyPayload,
  type LookupResult,
  type Turn,
} from "@/lib/ask-core/index.ts";
import { extractIntent } from "@/lib/ask-llm";
import { parseAskIntent } from "@/lib/ask-intent";
import { anthropicClient, isModelEnabled, modelName } from "@/lib/ask-model-client";
import { EVENTS_FALLBACK, FMG_SITE, RULES_SUGGESTIONS } from "@/lib/ask-site";
import { lazyServerClient } from "@/lib/supabase-server";
import { searchEventsWithRelaxation, searchVenues, describeRelaxations } from "@/lib/search";
import { resolveLocation } from "@/lib/resolve-location";
import { formatDistance } from "@/lib/geo";
import { whenLabel } from "@/lib/event-display";
import { safeHttpUrl } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { track, type RecordClass, hostRecordClass } from "@/lib/analytics/events";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";

// Ask Find My Mahj. Rules questions go to the shared Ask core (lib/ask-core), which decides
// every rule outcome identically to Las Vegas Mahjong. Directory questions are interpreted into
// filters, deterministic search runs against published reviewed listings, and the answer
// sentence is composed from the real parameters and counts. No model writes factual text and
// no model sees a database row.

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

// The rules block. Field names kept from the previous contract so the home card and older
// clients keep working; the shared fields (kind, label, followups, clarify) are added beside it.
type RulesBlock = {
  matched: boolean;
  entry_id?: string;
  secondary_id?: string;
  answer?: string;
  ruleset: "american_nmjl";
  varies_by_house?: boolean;
  house_note?: string;
  confidence: "high" | "medium" | "low" | "unsupported";
  source: string;
  last_verified?: string;
  classification?: string;
  evidence?: string;
  needs_clarification?: string;
  clarify?: ClarifyPayload;
  clarified_by?: string;
  unsupported_reason?: string;
};

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Unmatched rules questions are demand data. Only a scrubbed topic summary is stored, never
// the raw question, so the operator queue learns what players ask without the site keeping
// conversations. Card refusals are policy, not gaps, and are not logged here.
async function logRulesGap(escalation: { summary: string; reason: string }) {
  try {
    await lazyServerClient().from("outreach_events").insert({
      agent: "ask-rules-gap",
      action: "rules_question_unmatched",
      reason: escalation.summary,
      evidence: escalation.reason,
      deterministic: true,
    });
  } catch (e) {
    console.error("rules gap log failed:", e instanceof Error ? e.message : e);
  }
}

// Anonymous asks count as real usage unless the request carries a session cookie whose
// profile is classified test (the admin-driven QA walkthrough), so QA traffic run against
// this route in production never inflates real ask numbers.
async function resolveAskRecordClass(req: NextRequest): Promise<RecordClass> {
  const hostClass = hostRecordClass(req.headers.get("host"));
  if (hostClass === "test") return "test";
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

function trackAskOutcome(recordClass: RecordClass, topic: "directory" | "rules" | "mixed", results: number, matched: boolean, clarify?: string | null) {
  const supabase = lazyServerClient();
  const props = { topic, results, matched, ...(clarify ? { clarify } : {}) };
  // An open clarification turn is not an unanswered question yet.
  const turnOpen = Boolean(clarify?.endsWith(":asked"));
  void track(supabase, "ask_submitted", { props, recordClass });
  const intentName = topic === "directory" ? "ask_intent_directory" : topic === "rules" ? "ask_intent_rules" : "ask_intent_mixed";
  void track(supabase, intentName, { props, recordClass });
  if (!matched && !turnOpen) void track(supabase, "ask_unverified", { props, recordClass });
}

const STRONG_SEARCH_CUE = /\b(where|near|nearby|find|looking for|teachers?|instructors?|lessons?|class|classes|zip)\b/i;

// A parsed location alone is not a search cue: extractLocation reads "at all really" as a
// place, so a plain reply would be ejected from its clarification.
function looksLikeDirectorySearch(q: string): boolean {
  const intent = parseAskIntent(q);
  return (
    intent.days.length > 0 || intent.timeOfDay !== null || intent.types !== null || intent.kind === "teachers" ||
    /\b(where|near|nearby|find|looking for|events?|games?|groups?|clubs?|meetups?|teachers?|instructors?|lessons?)\b/i.test(q) ||
    placeAfterPrep(q)
  );
}

const MAX_HISTORY = 10;
const MAX_TURN_CHARS = 900;
const limits = makeLimiters();
const EXCLUDE = excludedIds(FMG_SITE);
const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

function parseHistory(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];
  const out: Turn[] = [];
  for (const t of raw.slice(0, MAX_HISTORY)) {
    if (!t || typeof t !== "object") continue;
    const o = t as Record<string, unknown>;
    if ((o.role !== "user" && o.role !== "assistant") || typeof o.content !== "string") continue;
    const turn: Turn = { role: o.role, content: o.content.slice(0, MAX_TURN_CHARS) };
    if (typeof o.entry_id === "string") {
      const e = entryById(o.entry_id);
      if (e) turn.entry_id = e.id;
    }
    out.push(turn);
  }
  return out;
}

function rulesBlock(det: LookupResult): RulesBlock {
  const e = det.entry;
  if (det.kind === "answer" && e) {
    return {
      matched: true,
      entry_id: e.id,
      secondary_id: det.secondary?.id,
      answer: det.answer,
      ruleset: "american_nmjl",
      varies_by_house: e.varies_by_house,
      ...(e.house_note ? { house_note: e.house_note } : {}),
      confidence: e.confidence,
      source: e.approval,
      last_verified: e.last_verified,
      classification: e.classification,
      evidence: e.provenance.evidence,
      ...(det.clarified_by ? { clarified_by: det.clarified_by } : {}),
    };
  }
  if (det.kind === "clarify") {
    return { matched: false, ruleset: "american_nmjl", confidence: "low", source: "none", needs_clarification: det.answer, clarify: det.clarify, ...(det.unsupported_reason ? { unsupported_reason: det.unsupported_reason } : {}) };
  }
  if (det.kind === "card_refusal") {
    return { matched: false, ruleset: "american_nmjl", confidence: "unsupported", source: "policy", answer: det.answer, unsupported_reason: "annual_card_content" };
  }
  return {
    matched: false,
    ruleset: "american_nmjl",
    confidence: "low",
    source: det.kind === "gap" || det.kind === "variant_scope" ? "policy" : "none",
    answer: det.answer,
    unsupported_reason: det.unsupported_reason ?? det.kind,
    ...(det.clarified_by ? { clarified_by: det.clarified_by } : {}),
  };
}

export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({ ok: false, error: "Send a POST with { question }." }, { status: 405, headers: { ...NO_STORE, Allow: "POST" } });
}

export async function POST(req: NextRequest) {
  if (process.env.ASK_DISABLED === "1") {
    return json({ ok: false, error: "Ask is switched off for the moment. The Events page and the Teachers page still work.", fallback: EVENTS_FALLBACK }, 503);
  }
  if (!(await rateLimit(req, "ask", 30, 60))) {
    return NextResponse.json(
      { ok: false, error: "That is a lot of questions at once. Give it a minute and ask again, or browse the Events page.", fallback: EVENTS_FALLBACK },
      { status: 429, headers: { ...NO_STORE, "Retry-After": "60" } },
    );
  }
  const body = (await req.json().catch(() => null)) || {};
  // Both field names are accepted: `question` is the shared contract, `q` the older home-card shape.
  const rawQuestion = typeof body?.question === "string" ? body.question : typeof body?.q === "string" ? body.q : "";
  const question = normalizeQuestion(rawQuestion, MAX_QUESTION_CHARS);
  const history = parseHistory(body?.history);
  const recordClass = await resolveAskRecordClass(req);
  try {
    const clarifyRaw = body?.clarify;
    let clarify =
      clarifyRaw && typeof clarifyRaw.id === "string" && typeof clarifyRaw.question === "string"
        ? { id: clarifyRaw.id.slice(0, 40), question: normalizeQuestion(clarifyRaw.question, MAX_QUESTION_CHARS) }
        : null;
    // A player who changes their mind mid-clarification and types a directory question gets
    // the search, not a forced rules reply. A clicked label, or a short reply that answers an
    // option ("in a tournament" reads as a place to the search parser), stays a reply.
    if (clarify && question) {
      const keep = replyStaysReply(clarify, question, (q) => STRONG_SEARCH_CUE.test(q) || placeAfterPrep(q));
      if (!keep && looksLikeDirectorySearch(question) && classifyTopic(question, { discoverySignal: FMG_SITE.discoverySignal }) === "other") clarify = null;
    }
    const cancelled = cancelPhrase(question);
    const rawTopic = clarify ? "rules" : classifyTopic(question, { discoverySignal: FMG_SITE.discoverySignal });
    // Small talk and "never mind" belong to the rules helper, not to search.
    const topic: "directory" | "rules" | "mixed" = rawTopic === "other" ? (isSmallTalk(question) || (cancelled.cancelled && !cancelled.remainder) ? "rules" : "directory") : rawTopic === "mixed" ? "mixed" : "rules";
    const opts = { exclude: EXCLUDE };
    let rules: LookupResult | null = null;
    let via: "rules" | "model" = "rules";
    let served: { answer: string; label: string; kind: string; entry_id?: string; followups: string[]; clarify?: ClarifyPayload; year_note?: string } | null = null;

    if (topic !== "directory") {
      rules = lookup({ question, history, clarify }, opts);
      served = { answer: rules.answer, label: rules.label, kind: rules.kind, entry_id: rules.entry?.id, followups: rules.followups, clarify: rules.clarify, year_note: rules.year_note };
      if (rules.escalation && rules.kind === "gap") void logRulesGap(rules.escalation);
      else if (rules.escalation && rules.kind === "clarify" && rules.clarify?.id === "topic") void logRulesGap(rules.escalation);

      const consultModel = topic === "rules" && isModelEnabled() && modelEligible(rules, question) && limits.modelPerMinute.check("global") && limits.modelPerDay.check("global");
      if (consultModel) {
        const options = rules.entry ? buildFollowups(rules.entry, askedEntryIds(history), 6, opts) : rules.followups;
        const m = await composeWithModel(
          { question, history, candidates: rules.candidates, followupOptions: options, preferred: rules.entry?.id },
          { client: anthropicClient, site: { helperName: FMG_SITE.helperName, siteHost: FMG_SITE.siteHost }, model: modelName(), log: (e) => console.info(JSON.stringify(e)) },
        );
        if (m?.kind === "answer") {
          via = "model";
          served = { answer: m.answer, label: m.label, kind: "answer", entry_id: m.entry.id, followups: m.followups.length ? m.followups : buildFollowups(m.entry, askedEntryIds(history), 3, opts), year_note: rules.year_note };
          rules = { ...rules, kind: "answer", entry: m.entry, secondary: m.secondary, answer: m.answer, label: m.label, clarify: undefined };
        } else if (m?.kind === "clarify") {
          via = "model";
          served = { answer: m.answer, label: "clarify", kind: "clarify", followups: m.followups };
          rules = { ...rules, kind: "clarify", entry: undefined, answer: m.answer, label: "clarify", clarify: undefined };
        }
      }
    }

    const rulesVerified = Boolean(rules?.kind === "answer" && rules.entry && rules.entry.provenance.evidence !== "owner_question_pending");

    if (topic === "rules" && rules && served) {
      const block = rulesBlock(rules);
      trackAskOutcome(recordClass, topic, 0, rulesVerified, rules.clarify ? `${rules.clarify.id}:asked` : rules.clarified_by ? `${rules.clarified_by}:resolved` : null);
      return json({
        ok: true,
        answer: served.answer,
        label: served.label,
        kind: served.kind,
        entry_id: served.entry_id,
        secondary_id: rules.secondary?.id,
        category: rules.entry?.category,
        classification: rules.entry?.classification,
        evidence: rules.entry?.provenance.evidence,
        followups: served.followups,
        clarify: served.clarify,
        year_note: served.year_note,
        results: [],
        suggestions: served.kind === "answer" || served.kind === "gap" ? RULES_SUGGESTIONS : [],
        intent: parseAskIntent(question),
        via,
        topic,
        rules: block,
      });
    }

    const [{ intent, via: intentVia }, rulesLead] = await Promise.all([
      extractIntent(question),
      // An unmatched rules half contributes nothing useful to a mixed answer; prepending a
      // cannot-verify paragraph to real directory results would bury them.
      Promise.resolve(rules && rules.kind === "answer" ? rules.answer : ""),
    ]);
    const withRulesLead = (answer: string) => (rulesLead ? `${rulesLead} ${answer}` : answer);
    // A mixed answer never shows a clarifying question, so it must not ship one for the
    // client to act on; the directory half is the answer here.
    const extras = rules
      ? { topic, rules: { ...rulesBlock(rules), clarify: undefined, needs_clarification: undefined }, entry_id: rules.entry?.id, kind: rules.kind === "answer" ? "answer" : "directory", label: rules.kind === "answer" ? rules.label : "chat", followups: rules.kind === "answer" ? rules.followups : [] }
      : { topic, kind: "directory", label: "chat", followups: [] as string[] };

    if (!intent.recognized) {
      trackAskOutcome(recordClass, topic, 0, rulesVerified);
      return json({
        ok: true,
        answer: withRulesLead(
          "I can help you find reviewed mahjong games, teachers, and events, or answer American Mahjong rules questions. Try asking something like: where can I play Saturday morning near Naples? Or a rules question, like: can I use a joker in a pair?",
        ),
        results: [],
        suggestions: [
          { label: "Browse all events", href: "/events" },
          { label: "Find a teacher", href: "/teachers" },
        ],
        intent,
        via: intentVia,
        ...extras,
      });
    }

    // "can I use a joker in a pair and where can I play near Naples": the extractor swallows the
    // rules half as a place, so a too-long location is re-parsed from the last "and" clause.
    if (topic === "mixed" && intent.location && intent.location.split(/\s+/).length > 4 && /\band\b/i.test(question)) {
      const tail = question.split(/\band\b/i).pop() ?? "";
      const again = parseAskIntent(tail);
      intent.location = again.location && again.location.split(/\s+/).length <= 4 ? again.location : null;
      if (!intent.location) intent.radiusMiles = null;
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
      trackAskOutcome(recordClass, topic, cards.length, cards.length > 0 || rulesVerified);
      return json({ ok: true, answer: withRulesLead(answer), results: cards, suggestions, intent, via: intentVia, ...extras });
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
      1,
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

    trackAskOutcome(recordClass, topic, cards.length, cards.length > 0 || rulesVerified);
    return json({
      ok: true,
      answer: withRulesLead(answer),
      results: cards,
      relaxations: out.exact ? [] : out.relaxations,
      suggestions,
      intent,
      via: intentVia,
      ...extras,
    });
  } catch (e) {
    console.error("ask failed:", e instanceof Error ? e.message : e);
    return json({ ok: false, error: "Search is having trouble right now. The Events page still works.", results: [], suggestions: [{ label: "Browse all events", href: "/events" }], fallback: EVENTS_FALLBACK }, 500);
  }
}
