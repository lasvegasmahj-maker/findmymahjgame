import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyGameToken } from "@/lib/game-token";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const siteUrl = req.nextUrl.origin;
  const token = req.nextUrl.searchParams.get("token");
  const v = token ? verifyGameToken(token) : null;
  if (!v) return NextResponse.redirect(`${siteUrl}/played?result=invalid`);

  // Idempotency guard: mail-scanner prefetch and repeat clicks must not
  // re-flip state. First answer wins; later clicks just see the thank-you.
  const { data: cur, error: readErr } = await supabase.from("tables").select("played, played_at").eq("id", v.tableId).single();
  if (readErr || !cur || cur.played_at) {
    // Fail closed: a read error or an already-answered row never overwrites.
    if (readErr) console.error("played: read failed, skipping write", readErr.message);
    return NextResponse.redirect(`${siteUrl}/played?result=${v.answer}`);
  }
  const { error: writeErr } = await supabase
    .from("tables")
    .update({ played: v.answer === "yes", played_at: new Date().toISOString() })
    .eq("id", v.tableId);
  if (writeErr) console.error("played: update failed", writeErr.message);
  return NextResponse.redirect(`${siteUrl}/played?result=${v.answer}`);
}
