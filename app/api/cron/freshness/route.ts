import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { fetchAllRows } from "@/lib/fetch-all";

// Proposes reverification and never changes what a player sees, so a scheduled job can run
// unattended without any path to publishing or unpublishing. Failures return non-200 and
// write an audit row, because a scan that silently stops looks identical to a clean scan.
const supabase = lazyServerClient();

export const maxDuration = 300;

const DAY = 86400000;
const FRESHNESS_AGENT = "freshness-agent-scheduled";

type Row = {
  id: string;
  kind: "venue" | "event";
  name: string;
  city: string | null;
  state: string | null;
  event_date?: string | null;
  is_recurring?: boolean | null;
  ended_reports?: number | null;
  confirmed_active_at?: string | null;
  schedule_parsed_at?: string | null;
  updated_at?: string | null;
  review_flag?: string | null;
};

function severityFor(priority: number): string {
  if (priority >= 5) return "REVIEW_REQUIRED";
  if (priority >= 3) return "REVIEW_SOON";
  return "CHANGED";
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const presented = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  const digest = (v: string) => crypto.createHash("sha256").update(v).digest();
  const ok = !!secret && crypto.timingSafeEqual(digest(presented), digest(expected));
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  try {
    const { data: cfg } = await supabase
      .from("app_settings").select("value").eq("key", "growth_freshness_interval_days").maybeSingle();
    const parsed = Number(cfg?.value);
    const intervalDays = Number.isFinite(parsed) ? parsed : 14;

    const PUBLISHED: Array<[string, string]> = [["status", "published"]];
    const [v, e] = await Promise.all([
      fetchAllRows<Record<string, unknown>>(supabase, "venue_listings", "id,business_name,city,state,confirmed_active_at,updated_at,ended_reports,review_flag", PUBLISHED),
      fetchAllRows<Record<string, unknown>>(supabase, "event_listings", "id,event_name,city,state,confirmed_active_at,updated_at,event_date,is_recurring,ended_reports,schedule_parsed_at,review_flag", PUBLISHED),
    ]);
    if (v.error || e.error) {
      console.error("freshness cron: listing query failed", v.error || e.error);
      return NextResponse.json({ error: "listing query failed" }, { status: 500 });
    }

    const rows: Row[] = [
      ...v.rows.map((r) => ({ ...r, kind: "venue" as const, name: String(r.business_name) })),
      ...e.rows.map((r) => ({ ...r, kind: "event" as const, name: String(r.event_name) })),
    ] as Row[];

    const findings: Array<{ row: Row; severity: string; reasons: string[] }> = [];
    for (const r of rows) {
      const verifiedAt = r.confirmed_active_at || r.schedule_parsed_at || r.updated_at;
      const ageDays = verifiedAt ? (now - new Date(verifiedAt).getTime()) / DAY : Infinity;
      const datePassed = Boolean(r.kind === "event" && !r.is_recurring && r.event_date && new Date(r.event_date).getTime() < now);
      const urgent = (r.ended_reports ?? 0) > 0 || datePassed;
      if (Number.isFinite(ageDays) && ageDays < intervalDays && !urgent) continue;

      const reasons: string[] = [];
      let priority = 0;
      if (datePassed) { priority += 3; reasons.push("one-off event date has passed"); }
      if ((r.ended_reports ?? 0) > 0) { priority += 3; reasons.push(`${r.ended_reports} player report(s) that it ended`); }
      if (r.kind === "event" && r.is_recurring && ageDays > 45) { priority += 2; reasons.push("recurring game unverified for over 45 days"); }
      if (!verifiedAt || ageDays > 90) { priority += 1; reasons.push("no verification in 90 days"); }
      if (!reasons.length) continue;
      findings.push({ row: r, severity: severityFor(priority), reasons });
    }

    let filed = 0;
    let skippedDuplicate = 0;
    let skippedHumanFlag = 0;
    // A timeout mid loop would skip the catch and leave no audit row, so each run takes a
    // bounded slice and reports the remainder for the next one.
    const PER_RUN = 200;
    const batch = findings.slice(0, PER_RUN);
    for (const f of batch) {
      const table = f.row.kind === "event" ? "event_listings" : "venue_listings";
      const newFlag = `freshness_${f.severity.toLowerCase()}`;
      if (f.row.review_flag === newFlag) { skippedDuplicate++; continue; }
      // A flag a person is working through outranks anything this job wants to say.
      if (f.row.review_flag && !f.row.review_flag.startsWith("freshness_")) { skippedHumanFlag++; continue; }

      const { error: upErr } = await supabase.from(table).update({ review_flag: newFlag }).eq("id", f.row.id);
      if (upErr) { console.error(`freshness cron: flag failed for ${table}/${f.row.id}: ${upErr.message}`); continue; }
      await supabase.from("outreach_events").insert({
        agent: FRESHNESS_AGENT,
        action: "reverification_proposed",
        reason: f.reasons.join("; ").slice(0, 500),
        evidence: `listing ${table}/${f.row.id} severity=${f.severity}`,
        deterministic: true,
      });
      filed++;
    }

    const deferred = Math.max(0, findings.length - batch.length);
    const summary = { scanned: rows.length, findings: findings.length, filed, skippedDuplicate, skippedHumanFlag, deferred, intervalDays };
    await supabase.from("outreach_events").insert({
      agent: FRESHNESS_AGENT,
      action: "scheduled_run_completed",
      reason: `scanned ${summary.scanned}, findings ${summary.findings}, filed ${filed}, duplicates skipped ${skippedDuplicate}, human flags respected ${skippedHumanFlag}, deferred to next run ${deferred}`,
      evidence: `interval_days=${intervalDays}`,
      deterministic: true,
    });
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("freshness cron failed:", message);
    // Recorded so a silent scheduler failure still shows up in the console history.
    await supabase.from("outreach_events").insert({
      agent: FRESHNESS_AGENT,
      action: "scheduled_run_failed",
      reason: message.slice(0, 400),
      deterministic: true,
    }).then(() => undefined, () => undefined);
    return NextResponse.json({ error: "freshness scan failed" }, { status: 500 });
  }
}
