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
  const { data: cur } = await supabase.from("tables").select("played, played_at").eq("id", v.tableId).single();
  if (cur && cur.played_at) {
    return NextResponse.redirect(`${siteUrl}/played?result=${v.answer}`);
  }
  await supabase
    .from("tables")
    .update({ played: v.answer === "yes", played_at: new Date().toISOString() })
    .eq("id", v.tableId);
  return NextResponse.redirect(`${siteUrl}/played?result=${v.answer}`);
}
