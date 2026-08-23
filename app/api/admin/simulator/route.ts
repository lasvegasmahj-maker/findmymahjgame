import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { lazyServerClient } from "@/lib/supabase-server";
import { runLaunchSimulation } from "@/lib/simulator/run";

export const maxDuration = 60;

const supabase = lazyServerClient();

// Runs the full launch rehearsal on test-classified identities and returns the
// PASS/FAIL matrix. Admin only. It never mutates a real record and cleans up
// everything it creates; even so it is a POST so it is never triggered by a crawl.
export async function POST(req: NextRequest) {
  if (!verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const report = await runLaunchSimulation(supabase);
    return NextResponse.json(report);
  } catch (e) {
    console.error("launch simulation failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "The simulation could not complete. Check the server logs." }, { status: 500 });
  }
}
