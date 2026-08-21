import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { verifyActionToken } from "@/lib/game-token";
import { lazyServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Confirm match", robots: { index: false } };
export const dynamic = "force-dynamic";

const supabase = lazyServerClient();

// Mail scanners prefetch GET links, so the emailed approve/skip links land
// here and the decision happens only on the founder's form POST below.
export default async function MatchConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const v = token ? verifyActionToken(token) : null;
  const valid = v && (v.action === "match-approve" || v.action === "match-skip");

  const shell = (children: React.ReactNode) => (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "4rem 1.2rem", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
      {children}
      <div><Link href="/admin" style={{ display: "inline-block", marginTop: "1.5rem", fontSize: "1.05rem", color: "var(--pink-text)", fontWeight: 700, textDecoration: "none" }}>&larr; Admin</Link></div>
    </main>
  );

  if (!valid || !token) {
    return shell(<h1 style={{ fontSize: "1.8rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>That link has expired</h1>);
  }

  const { data: draft } = await supabase.from("match_drafts").select("*").eq("id", v.subjectId).single();
  if (!draft) {
    return shell(<h1 style={{ fontSize: "1.8rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Match not found</h1>);
  }
  if (draft.status !== "draft") {
    return shell(
      <>
        <h1 style={{ fontSize: "1.8rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Already decided</h1>
        <p style={{ fontSize: "1.1rem", color: "var(--muted)" }}>This match was {draft.status}.</p>
      </>
    );
  }

  const { data: players } = await supabase
    .from("play_requests")
    .select("name, city, day_pref, time_pref")
    .in("id", draft.request_ids as string[]);
  const approve = v.action === "match-approve";

  return shell(
    <>
      <h1 style={{ fontSize: "1.8rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>
        {approve ? "Approve this match?" : "Skip this match?"}
      </h1>
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.2rem 1.4rem", margin: "1.4rem 0", textAlign: "left" }}>
        <p style={{ margin: 0, fontSize: "1.05rem", color: "var(--navy)", lineHeight: 1.7 }}>
          <strong>{draft.city}</strong> &middot; {draft.day_pref || "any day"}, {draft.time_pref || "any time"}
        </p>
        {(players || []).map((p, i) => (
          <p key={i} style={{ margin: "0.3rem 0 0", fontSize: "0.98rem", color: "var(--muted)" }}>{p.name || "Player"}</p>
        ))}
      </div>
      <p style={{ fontSize: "1rem", color: "var(--muted)", lineHeight: 1.6 }}>
        {approve
          ? "Approving creates the table and emails each player a claim link. Nothing has been sent yet."
          : "Skipping releases these players back into the pool. They are not notified."}
      </p>
      <form method="POST" action="/api/match/decide" style={{ marginTop: "1.4rem" }}>
        <input type="hidden" name="token" value={token} />
        <button type="submit" style={{ minHeight: 56, padding: "0 2.2rem", borderRadius: 12, border: "none", background: approve ? "var(--green-dark)" : "var(--gray-mid)", color: "white", fontWeight: 800, fontSize: "1.15rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {approve ? "Yes, approve and send invites" : "Yes, skip this match"}
        </button>
      </form>
    </>
  );
}
