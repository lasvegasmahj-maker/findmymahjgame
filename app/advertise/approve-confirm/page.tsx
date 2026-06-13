import type { Metadata } from "next";
import Link from "next/link";
import { verifyToken } from "@/app/api/advertise-approve/route";

export const metadata: Metadata = { title: "Confirm listing decision", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdvertiseApproveConfirm({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const v = token ? verifyToken(token) : null;

  const shell = (children: React.ReactNode) => (
    <main style={{ maxWidth: 540, margin: "0 auto", padding: "4rem 1.2rem", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
      {children}
      <div><Link href="/admin" style={{ display: "inline-block", marginTop: "1.5rem", color: "var(--pink-text)", fontWeight: 700, textDecoration: "none" }}>&larr; Admin</Link></div>
    </main>
  );

  if (!v || !token) {
    return shell(<h1 style={{ fontSize: "1.8rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>That link has expired</h1>);
  }
  const approve = v.action === "approve";
  return shell(
    <>
      <h1 style={{ fontSize: "1.8rem", color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>
        {approve ? "Approve this listing?" : "Reject this listing?"}
      </h1>
      <p style={{ fontSize: "1.05rem", color: "var(--muted)", lineHeight: 1.6 }}>
        {approve ? "Approving marks the submission approved and emails the advertiser." : "Rejecting marks the submission rejected. The advertiser is not emailed."}
      </p>
      <form method="POST" action="/api/advertise-approve" style={{ marginTop: "1.4rem" }}>
        <input type="hidden" name="token" value={token} />
        <button type="submit" style={{ minHeight: 56, padding: "0 2.2rem", borderRadius: 12, border: "none", background: approve ? "var(--green-dark)" : "var(--gray-mid)", color: "white", fontWeight: 800, fontSize: "1.15rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {approve ? "Yes, approve and notify" : "Yes, reject"}
        </button>
      </form>
    </>
  );
}
