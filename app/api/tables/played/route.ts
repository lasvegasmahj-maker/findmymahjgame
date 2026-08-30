import { NextRequest, NextResponse } from "next/server";
import { verifyGameToken } from "@/lib/game-token";
import { rateLimit } from "@/lib/rate-limit";
import { lazyServerClient } from "@/lib/supabase-server";
import { quickTablesAccess } from "@/lib/tables-gate";

const supabase = lazyServerClient();

// GET never mutates: mail scanners prefetch GET links from emails, so the
// emailed link lands on a confirmation page and only a human's form POST
// records the answer. Scanners do not submit forms.
export async function GET(req: NextRequest) {
  const siteUrl = req.nextUrl.origin;
  const token = req.nextUrl.searchParams.get("token") || "";
  return NextResponse.redirect(`${siteUrl}/played/confirm?token=${encodeURIComponent(token)}`);
}

export async function POST(req: NextRequest) {
  const siteUrl = req.nextUrl.origin;
  if (!(await rateLimit(req, "played", 20, 60))) return NextResponse.redirect(`${siteUrl}/played?result=retry`, 303);
  if (!(await quickTablesAccess(req, supabase)).allowed) return NextResponse.redirect(`${siteUrl}/played?result=closed`, 303);
  let token = "";
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("form")) {
    const form = await req.formData().catch(() => null);
    token = String(form?.get("token") || "");
  } else {
    const b = (await req.json().catch(() => null)) || {};
    token = String(b?.token || "");
  }
  const v = token ? verifyGameToken(token) : null;
  if (!v) return NextResponse.redirect(`${siteUrl}/played?result=invalid`, 303);

  const { data: cur, error: readErr } = await supabase.from("tables").select("played, played_at").eq("id", v.tableId).single();
  // Fail closed on read errors. A confirmed "yes" is final. A "not yet" can be
  // upgraded by a later genuine "yes" (several seats receive the ask, and an
  // early "not yet" must not permanently silence the player who really played).
  const locked = readErr || !cur || cur.played === true || (cur.played_at && v.answer !== "yes");
  if (locked) {
    if (readErr) console.error("played: read failed, skipping write", readErr.message);
    return NextResponse.redirect(`${siteUrl}/played?result=${v.answer}${v.answer === "yes" ? `&token=${encodeURIComponent(token)}` : ""}`, 303);
  }
  const { error: writeErr } = await supabase
    .from("tables")
    .update({ played: v.answer === "yes", played_at: new Date().toISOString() })
    .eq("id", v.tableId);
  if (writeErr) console.error("played: update failed", writeErr.message);
  return NextResponse.redirect(`${siteUrl}/played?result=${v.answer}${v.answer === "yes" ? `&token=${encodeURIComponent(token)}` : ""}`, 303);
}
