import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { verifyActionToken } from "@/lib/game-token";

export const metadata: Metadata = { title: "Confirm a listing", robots: { index: false } };
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ListingConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const { token, done } = await searchParams;

  const shell = (children: React.ReactNode) => (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "4rem 1.2rem", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
      {children}
      <div><Link href="/" style={{ display: "inline-block", marginTop: "1.5rem", fontSize: "1.05rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Back home</Link></div>
    </main>
  );

  if (done === "alive") {
    return shell(
      <>
        <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Thank you!</h1>
        <p style={{ fontSize: "1.15rem", color: "var(--navy)", lineHeight: 1.6 }}>The listing is confirmed active. Players searching this week will see it is real.</p>
      </>
    );
  }
  if (done === "ended") {
    return shell(
      <>
        <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>Thank you for telling us</h1>
        <p style={{ fontSize: "1.15rem", color: "var(--navy)", lineHeight: 1.6 }}>A real person will check on it so no one shows up to an empty room.</p>
      </>
    );
  }

  const v = token ? verifyActionToken(token) : null;
  if (!v || (v.action !== "still-running" && v.action !== "ended") || !token) {
    return shell(
      <>
        <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>That link has expired</h1>
        <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6 }}>Email hello@findmymahjgame.com and we will sort it out.</p>
      </>
    );
  }

  const [table, id] = String(v.subjectId).split("|");
  const { data: listing } = await supabase.from(table).select("business_name, event_name, city, state").eq("id", id).single();
  const name = String(listing?.business_name || listing?.event_name || "this listing");
  const alive = v.action === "still-running";

  return shell(
    <>
      <h1 style={{ fontSize: "1.9rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>
        {alive ? `Is ${name} still going?` : `Has ${name} ended?`}
      </h1>
      <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.6 }}>
        {listing?.city ? `${listing.city}, ${listing.state || ""}` : ""}
      </p>
      <form method="POST" action="/api/listing/confirm" style={{ marginTop: "1.4rem" }}>
        <input type="hidden" name="token" value={token} />
        <button type="submit" style={{ minHeight: 56, padding: "0 2.2rem", borderRadius: 12, border: "none", background: alive ? "var(--green-dark)" : "var(--gray-mid)", color: "white", fontWeight: 800, fontSize: "1.15rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {alive ? "Yes, still going strong" : "Yes, it has ended"}
        </button>
      </form>
    </>
  );
}
