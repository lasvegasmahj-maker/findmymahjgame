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

  await supabase.from("tables").update({ played: v.answer === "yes" }).eq("id", v.tableId);
  return NextResponse.redirect(`${siteUrl}/played?result=${v.answer}`);
}
