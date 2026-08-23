import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";
import { isLaunched, canUseDarkFeature } from "@/lib/launch-gates";
import { rateLimit } from "@/lib/rate-limit";
import { clampText, escapeHtml } from "@/lib/sanitize";
import { notify } from "@/lib/notifications/notify";
import { isReportCategory, triageReport } from "@/lib/safety/triage";

// Filing a report. Triage is fully deterministic (lib/safety/triage.ts, no model in
// the loop); a needs_human result also rings the founder inbox so a person hears
// about it immediately instead of waiting on someone to check a dashboard.
const supabase = lazyServerClient();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_DETAIL_LENGTH = 2000;
// The only kinds of thing a player can report today; anything else is rejected
// rather than stored against a table this route was never meant to touch.
const ALLOWED_SUBJECT_TABLES = ["tables", "venue_listings", "event_listings"];
const FOUNDER_INBOX = "hello@findmymahjgame.com";

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req, "safety-report", 3, 300))) {
    return NextResponse.json({ error: "Too many reports. Please wait a few minutes and try again." }, { status: 429 });
  }

  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("deactivated_at, record_class").eq("id", session.userId).maybeSingle();
  if (profileError) {
    console.error("safety/report profile read failed:", profileError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (profile.deactivated_at) return NextResponse.json({ error: "Account deactivated" }, { status: 403 });

  const launched = await isLaunched(supabase, "playerMatching");
  if (!canUseDarkFeature(launched, profile.record_class)) {
    return NextResponse.json({ error: "Mahj Match is not open yet." }, { status: 403 });
  }

  const body = ((await req.json().catch(() => null)) || {}) as Record<string, unknown>;
  const category = body?.category;
  if (!isReportCategory(category)) {
    return NextResponse.json({ error: "Choose a report category." }, { status: 400 });
  }
  const detail = clampText(body?.detail, MAX_DETAIL_LENGTH).trim();

  const subjectUserId = body?.subject_user_id != null ? String(body.subject_user_id) : "";
  const subjectTable = body?.subject_table != null ? String(body.subject_table) : "";
  const subjectId = body?.subject_id != null ? String(body.subject_id) : "";

  if (subjectUserId && (subjectTable || subjectId)) {
    return NextResponse.json({ error: "A report can name a person or a listing, not both." }, { status: 400 });
  }
  if (subjectUserId && !UUID.test(subjectUserId)) {
    return NextResponse.json({ error: "Invalid account." }, { status: 400 });
  }
  if ((subjectTable || subjectId) && !(subjectTable && subjectId)) {
    return NextResponse.json({ error: "Invalid report subject." }, { status: 400 });
  }
  if (subjectTable && !ALLOWED_SUBJECT_TABLES.includes(subjectTable)) {
    return NextResponse.json({ error: "Invalid report subject." }, { status: 400 });
  }
  if (subjectId && !UUID.test(subjectId)) {
    return NextResponse.json({ error: "Invalid report subject." }, { status: 400 });
  }

  const status = triageReport(category, detail);

  const { data: report, error: insertError } = await supabase
    .from("user_reports")
    .insert({
      reporter_user_id: session.userId,
      subject_user_id: subjectUserId || null,
      subject_table: subjectTable || null,
      subject_id: subjectId || null,
      category,
      detail: detail || null,
      status,
      record_class: profile.record_class,
    })
    .select("id")
    .single();
  if (insertError || !report) {
    console.error("safety/report insert failed:", insertError?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  if (status === "needs_human") {
    const subjectLine = subjectUserId
      ? `player ${subjectUserId}`
      : subjectTable
        ? `${subjectTable} ${subjectId}`
        : "no specific subject";
    await notify(supabase, {
      to: FOUNDER_INBOX,
      kind: "account_security",
      subject: `New safety report: ${category}`,
      html: `<p><strong>Category:</strong> ${escapeHtml(category)}</p>` +
        `<p><strong>Subject:</strong> ${escapeHtml(subjectLine)}</p>` +
        `<p><strong>Reporter account:</strong> ${escapeHtml(session.userId)} (${escapeHtml(profile.record_class)})</p>` +
        `<p><strong>Detail:</strong><br>${escapeHtml(detail || "(none provided)")}</p>` +
        `<p><strong>Report id:</strong> ${escapeHtml(report.id)}</p>`,
      related: { table: "user_reports", id: report.id },
      recordClass: profile.record_class as "real_external" | "test" | "internal" | "seed_demo",
    });
  }

  return NextResponse.json({ ok: true });
}
