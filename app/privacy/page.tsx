import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Find My Mahj Game. Learn how we collect, use, and protect your information.",
  alternates: { canonical: "https://findmymahjgame.com/privacy" },
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">Legal</div>
        <h1>Privacy Policy</h1>
        <p>Last updated: May 2026</p>
      </div>

      <div className="page-body" style={{ maxWidth: 740 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", color: "var(--muted)", lineHeight: 1.75, fontSize: "0.93rem" }}>

          <section>
            <h2 style={{ color: "var(--navy)", fontSize: "1.1rem", marginBottom: "0.7rem" }}>What We Collect</h2>
            <p>When you create a listing or contact us, we collect only what you provide: your name, city, email address, and any details you include in your listing. We do not collect payment information (all payments are processed by third-party processors).</p>
            <p style={{ marginTop: "0.8rem" }}>We also collect standard server logs (IP addresses, browser type, pages visited) to understand site traffic and fix errors. These are not linked to individual identities.</p>
          </section>

          <section>
            <h2 style={{ color: "var(--navy)", fontSize: "1.1rem", marginBottom: "0.7rem" }}>How We Use Your Information</h2>
            <p>We use the information you provide to:</p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>Publish and manage your player or venue listing</li>
              <li>Respond to your messages and inquiries</li>
              <li>Deliver lesson requests: when you send a lesson request to a teacher, your name, contact details, and message are emailed directly to that teacher so they can reply to you. We do not keep a copy of your message or contact details from that request; we keep only a delivery record (which teacher, when, and whether the email sent) to spot abuse and confirm delivery</li>
              <li>Send transactional emails related to your listing (confirmations, updates)</li>
              <li>Improve the directory based on usage patterns</li>
            </ul>
            <p style={{ marginTop: "0.8rem" }}>We do not sell your information. We do not send marketing emails unless you specifically opt in.</p>
          </section>

          <section>
            <h2 style={{ color: "var(--navy)", fontSize: "1.1rem", marginBottom: "0.7rem" }}>Public Listings</h2>
            <p>Information you include in a public player or venue listing (name, city, skill level, contact method) is visible to anyone who visits the site. Only include information you are comfortable sharing publicly. You can request removal at any time.</p>
          </section>

          <section>
            <h2 style={{ color: "var(--navy)", fontSize: "1.1rem", marginBottom: "0.7rem" }}>Cookies and Analytics</h2>
            <p>We use cookies only as required for the site to function. We may use privacy-respecting analytics tools to understand page traffic in aggregate. We do not use advertising cookies or cross-site trackers.</p>
          </section>

          <section>
            <h2 style={{ color: "var(--navy)", fontSize: "1.1rem", marginBottom: "0.7rem" }}>Third-Party Services</h2>
            <p>The site uses Supabase (database and storage), Vercel (hosting), and Resend (email). Each has its own privacy policy. We share only the minimum data necessary for these services to function.</p>
          </section>

          <section>
            <h2 style={{ color: "var(--navy)", fontSize: "1.1rem", marginBottom: "0.7rem" }}>Data Removal</h2>
            <p>To have your listing or personal information removed, email us at <a href="mailto:hello@findmymahjgame.com" style={{ color: "var(--pink-text)", fontWeight: 600 }}>hello@findmymahjgame.com</a>. We will process all removal requests within 7 days.</p>
          </section>

          <section>
            <h2 style={{ color: "var(--navy)", fontSize: "1.1rem", marginBottom: "0.7rem" }}>Contact</h2>
            <p>Questions about this policy? <Link href="/contact" style={{ color: "var(--pink-text)", fontWeight: 600 }}>Contact us</Link> or email <a href="mailto:hello@findmymahjgame.com" style={{ color: "var(--pink-text)", fontWeight: 600 }}>hello@findmymahjgame.com</a>.</p>
          </section>

        </div>
      </div>
    </>
  );
}
