import { NextRequest, NextResponse } from "next/server";
import { lazyServerClient } from "@/lib/supabase-server";
import { verifyUserSessionToken, USER_COOKIE } from "@/lib/user-auth";

const supabase = lazyServerClient();

export async function GET(req: NextRequest) {
  const session = verifyUserSessionToken(req.cookies.get(USER_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("role, display_name, record_class, deactivated_at")
    .eq("id", session.userId)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (data.deactivated_at) return NextResponse.json({ error: "Account deactivated" }, { status: 403 });

  return NextResponse.json({
    ok: true,
    role: data.role,
    displayName: data.display_name,
    qa: data.record_class === "test",
  });
}
