import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { lazyServerClient } from "@/lib/supabase-server";

// Read-only observability for the notify() ledger: counts by kind and status
// over the last week and month, the latest rows, and the current failure
// list. Recipient emails are always masked in the response, even for test
// and internal rows, so a screenshot of this page never leaks a full address.
const supabase = lazyServerClient();

const DAY_MS = 24 * 60 * 60 * 1000;

function maskEmail(email: unknown): string {
  const s = String(email || "");
  const at = s.indexOf("@");
  if (at < 1) return "***";
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  const shown = local.slice(0, 2);
  const stars = "*".repeat(Math.max(local.length - shown.length, 2));
  return `${shown}${stars}@${domain}`;
}

type LogRow = { kind: string; status: string; created_at: string };

function summarize(rows: LogRow[]) {
  const byKind: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const r of rows) {
    byKind[r.kind] = (byKind[r.kind] || 0) + 1;
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }
  return { total: rows.length, byKind, byStatus };
}

export async function GET(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const cutoff30 = new Date(now - 30 * DAY_MS).toISOString();
  const cutoff7 = new Date(now - 7 * DAY_MS).toISOString();

  const [windowRes, latestRes, failuresRes] = await Promise.all([
    supabase.from("notifications_log").select("kind, status, created_at").gte("created_at", cutoff30).limit(10000),
    supabase.from("notifications_log").select("id, email, kind, subject, status, error, record_class, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("notifications_log").select("id, email, kind, subject, error, created_at").eq("status", "failed").gte("created_at", cutoff30).order("created_at", { ascending: false }).limit(100),
  ]);

  if (windowRes.error || latestRes.error || failuresRes.error) {
    console.error("admin notifications: query failed", windowRes.error?.message || latestRes.error?.message || failuresRes.error?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const rows30 = (windowRes.data || []) as LogRow[];
  const rows7 = rows30.filter((r) => r.created_at >= cutoff7);

  return NextResponse.json({
    windows: { last7Days: summarize(rows7), last30Days: summarize(rows30) },
    latest: (latestRes.data || []).map((r) => ({ ...r, email: maskEmail(r.email) })),
    failures: (failuresRes.data || []).map((r) => ({ ...r, email: maskEmail(r.email) })),
  });
}
