import type { Metadata } from "next";
import MahjMatchClient from "./mahj-match-client";
import { lazyServerClient } from "@/lib/supabase-server";
import { isLaunched } from "@/lib/launch-gates";

export const metadata: Metadata = {
  title: "Mahj Match",
  description: "Get matched into a four-player mahjong table with players near you.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function MahjMatchPage() {
  const launched = await isLaunched(lazyServerClient(), "playerMatching");
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2.5rem 1.2rem 4rem" }}>
      <h1
        style={{
          fontFamily: "var(--font-playfair), 'Playfair Display', serif",
          fontSize: "2.1rem",
          color: "var(--navy)",
          textAlign: "center",
          margin: "0 0 0.4rem",
        }}
      >
        Mahj Match
      </h1>
      <p style={{ textAlign: "center", color: "var(--muted)", margin: "0 0 1.8rem", fontSize: "1.05rem" }}>
        Tell us when and where you want to play. We fill a four-player table with people near you.
      </p>
      <MahjMatchClient launched={launched} />
    </main>
  );
}
