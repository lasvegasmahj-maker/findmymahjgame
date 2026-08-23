import { NextResponse } from "next/server";

// Retired. This was the founder one-click approval step for match_drafts in status 'draft', the
// architecture Mahj Match's rewrite (lib/match/engine.ts, app/api/cron/matcher) replaces with
// per-player consent (lib/match/consent.ts) checked on every matching operation instead. A
// policy audit flagged this as the one remaining matching entry point that could bypass consent,
// since it never called readMatchingConsent; nothing generates match-approve/match-skip tokens
// anymore, and match_drafts rows are always created with status 'proposed' now, never 'draft', so
// this route has no live caller. Retired rather than folded in: consent is checked per player,
// per seat, and a founder-side bulk approval has no such per-player identity to check it against.
function gone() {
  return NextResponse.json({ error: "This match approval flow has been retired." }, { status: 410 });
}

export async function GET() {
  return gone();
}

export async function POST() {
  return gone();
}
