# code-proposal: persistent admin top-nav

FINDING: There is no persistent admin top-nav. The founder hunts between admin sections.

How fixing this improves launch success in the next 10 days: in the launch window the founder lives in the admin (approving listings, working tasks, checking metrics/heatmap, reviewing edits and relationships). Today the only full nav is an inline button row that exists ONLY on the index page (app/admin/page.tsx). Every sub-page (tasks, relationships, edits) has just a single "back to Admin" link, and the two server pages (metrics, heatmap) have no in-page nav at all when signed in. So to go from Tasks to Metrics she must click back to the index, then click Metrics: two hops for every sideways move, many times a day. A shared top-nav makes every section one click from every other section, removing dozens of wasted clicks a day during the busiest 10 days of the business.

WHY THIS IS THE RIGHT, LOW-RISK BUILD (under 2 hours; well under):
- One new file plus a 2-line layout edit. No changes to any page's existing content, data flow, or auth.
- The nav is a server component gated on the existing admin cookie (verifyAdminSessionToken, already imported by metrics/heatmap), so it renders on all six admin surfaces (both the server pages and the client pages) and never appears on the sign-in screen.
- Uses only existing global CSS variables (--navy, --pink, --bg, --border, --muted) and the existing /api/admin/logout route. No new dependencies, no schema, no API changes.
- Brand-compliant: no em/en dashes, no emoji, navy/pink palette, Playfair heading font already global.

NOTE (optional cleanup, not required to ship): once this nav is live, the inline button row inside app/admin/page.tsx (lines ~482-500) and the lone "back to Admin" links on the sub-pages become redundant. Leaving them does no harm; removing them later is a tidy-up, not a launch blocker. I am NOT removing them in this proposal to keep the change minimal and risk-free.

=========================================================================
NEW FILE: app/admin/admin-nav.tsx
=========================================================================
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyAdminSessionToken, ADMIN_COOKIE } from "@/lib/admin-auth";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/edits", label: "Edits" },
  { href: "/admin/relationships", label: "Relationships" },
  { href: "/admin/metrics", label: "Metrics" },
  { href: "/admin/heatmap", label: "Heat Map" },
];

export default async function AdminNav() {
  const c = await cookies();
  if (!verifyAdminSessionToken(c.get(ADMIN_COOKIE)?.value)) return null;

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "white",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 1px 8px rgba(26,31,94,0.05)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0.6rem 1.2rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontWeight: 700,
            color: "var(--navy)",
            fontSize: "1rem",
            marginRight: "0.4rem",
          }}
        >
          Find My Mahj Game
        </span>
        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", flex: 1 }}>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: 6,
                fontSize: "0.82rem",
                fontWeight: 600,
                textDecoration: "none",
                color: "var(--navy)",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "0.4rem 0.85rem",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              color: "var(--muted)",
            }}
          >
            Sign Out
          </button>
        </form>
      </div>
    </nav>
  );
}

=========================================================================
EDIT: app/admin/layout.tsx (render the nav above all admin children)
=========================================================================
Replace the file body with:

import type { Metadata } from "next";
import AdminNav from "./admin-nav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}

=========================================================================
ONE CHECK BEFORE SHIPPING
=========================================================================
1. Confirm /api/admin/logout accepts a plain HTML form POST (the nav Sign Out uses a form, not fetch). The index page already calls it via fetch POST. If the route redirects or returns JSON, a form POST still clears the cookie; if you prefer the no-reload behavior, swap the form for a client "use client" Sign Out button mirroring the one in app/admin/page.tsx lines 493-498. Either works; the form keeps the nav a pure server component (simplest, lowest risk).
2. Run the pre-push gate: npx tsc --noEmit, then the Technical and Brand reviewer workflows, per CLAUDE.md.

FILES:
- /Users/shaunabruckman/Projects/findmymahjgame/app/admin/admin-nav.tsx (new)
- /Users/shaunabruckman/Projects/findmymahjgame/app/admin/layout.tsx (2-line edit)
