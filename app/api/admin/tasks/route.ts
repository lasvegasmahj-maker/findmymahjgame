import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { clampText } from "@/lib/sanitize";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CATEGORIES = ["outreach", "follow-up", "approval", "decision", "relationship", "ops"];
const PRIORITIES = ["high", "normal", "low"];
const STATUSES = ["open", "in_progress", "waiting", "done", "snoozed"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function authed(req: NextRequest) {
  return verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

// The table arrives via a founder SQL paste; until then the UI shows the
// instruction instead of an error.
function missingTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("founder_tasks")
    .select("*")
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    if (missingTable(error)) return NextResponse.json({ needsMigration: true, items: [] });
    console.error("tasks list failed:", error.message);
    return NextResponse.json({ error: "Could not load tasks." }, { status: 500 });
  }
  return NextResponse.json({ items: data || [] });
}

function cleanBody(b: Record<string, unknown>) {
  const category = String(b.category || "ops");
  const priority = String(b.priority || "normal");
  const status = String(b.status || "open");
  return {
    task: clampText(b.task, 200),
    notes: clampText(b.notes, 1000) || null,
    category: CATEGORIES.includes(category) ? category : "ops",
    priority: PRIORITIES.includes(priority) ? priority : "normal",
    status: STATUSES.includes(status) ? status : "open",
    due_date: clampText(b.due_date, 10) || null,
    waiting_on: clampText(b.waiting_on, 120) || null,
    related_name: clampText(b.related_name, 120) || null,
    snoozed_until: clampText(b.snoozed_until, 10) || null,
  };
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));

  if (Array.isArray(b.bulk)) {
    const rows = b.bulk.slice(0, 50).map((x: Record<string, unknown>) => cleanBody(x)).filter((r: { task: string }) => r.task);
    if (!rows.length) return NextResponse.json({ error: "Nothing to add." }, { status: 400 });
    const { error } = await supabase.from("founder_tasks").insert(rows);
    if (error) {
      if (missingTable(error)) return NextResponse.json({ needsMigration: true }, { status: 409 });
      console.error("tasks bulk insert failed:", error.message);
      return NextResponse.json({ error: "Could not add tasks." }, { status: 500 });
    }
    return NextResponse.json({ success: true, added: rows.length });
  }

  const row = cleanBody(b);
  if (!row.task) return NextResponse.json({ error: "Please write the task." }, { status: 400 });
  const { error } = await supabase.from("founder_tasks").insert(row);
  if (error) {
    if (missingTable(error)) return NextResponse.json({ needsMigration: true }, { status: 409 });
    console.error("tasks insert failed:", error.message);
    return NextResponse.json({ error: "Could not add the task." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || "");
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (b.task !== undefined && clampText(b.task, 200)) patch.task = clampText(b.task, 200);
  if (b.notes !== undefined) patch.notes = clampText(b.notes, 1000) || null;
  if (b.category !== undefined && CATEGORIES.includes(String(b.category))) patch.category = b.category;
  if (b.priority !== undefined && PRIORITIES.includes(String(b.priority))) patch.priority = b.priority;
  if (b.due_date !== undefined) patch.due_date = clampText(b.due_date, 10) || null;
  if (b.waiting_on !== undefined) patch.waiting_on = clampText(b.waiting_on, 120) || null;
  if (b.related_name !== undefined) patch.related_name = clampText(b.related_name, 120) || null;
  if (b.snoozed_until !== undefined) patch.snoozed_until = clampText(b.snoozed_until, 10) || null;
  if (b.status !== undefined && STATUSES.includes(String(b.status))) {
    patch.status = b.status;
    patch.completed_at = b.status === "done" ? new Date().toISOString() : null;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  patch.updated_at = new Date().toISOString();

  const { error } = await supabase.from("founder_tasks").update(patch).eq("id", id);
  if (error) {
    console.error("tasks update failed:", error.message);
    return NextResponse.json({ error: "Could not update the task." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = String(req.nextUrl.searchParams.get("id") || "");
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { error } = await supabase.from("founder_tasks").delete().eq("id", id);
  if (error) {
    console.error("tasks delete failed:", error.message);
    return NextResponse.json({ error: "Could not delete the task." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
