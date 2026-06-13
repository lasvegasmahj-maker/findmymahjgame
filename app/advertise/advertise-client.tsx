"use client";

import { useState } from "react";
import { AD_EMAIL } from "@/lib/constants";

const LISTING_TYPES = [
  { value: "venue", label: "Venue Listing", icon: "" },
  { value: "instructor", label: "Instructor Listing", icon: "" },
  { value: "event", label: "Event / Tournament Listing", icon: "" },
  { value: "brand", label: "Brand Advertising", icon: "" },
  { value: "founding", label: "Founding Partner", icon: "" },
];

export default function AdvertiseClient() {
  const [form, setForm] = useState({ name: "", email: "", company: "", interest: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/advertise-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">Advertise</div>
        <h1>Reach the Mahjong Community</h1>
        <p>Put your brand, venue, or event in front of mahjong players actively searching for their next game.
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: 860 }}>

        {/* What you can advertise */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", margin: "2.5rem 0" }}>
          {[
            { icon: "", title: "Venues", desc: "Restaurants, studios, JCCs and community spaces that welcome mahjong players." },
            { icon: "", title: "Instructors", desc: "Mahjong teachers and certified instructors reaching students in their area." },
            { icon: "", title: "Events", desc: "Open plays, tournaments, retreats and game nights reaching local and national players." },
            { icon: "", title: "Brands", desc: "Mahjong sets, accessories, and products reaching an engaged niche audience." },
          ].map((item) => (
            <div key={item.title} className="highlight-box" style={{ borderLeft: "4px solid var(--pink)", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{item.icon}</span>
              <div>
                <strong style={{ color: "var(--navy)", display: "block", marginBottom: "0.2rem" }}>{item.title}</strong>
                <span style={{ fontSize: "0.88rem", color: "var(--muted)" }}>{item.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <h2>How It Works</h2>
        <div style={{ display: "flex", margin: "1.5rem 0 2.5rem" }}>
          {[
            { icon: "", title: "1. Get Pricing", desc: "Fill out the short form. We email you options within 1-2 business days." },
            { icon: "", title: "2. Submit Your Details", desc: "Ready to go? Click the link in your pricing email to fill out your full listing." },
            { icon: "", title: "3. Approved & Live", desc: "Once approved and paid, you're listed within 24 hours." },
          ].map((step, i) => (
            <div key={step.title} style={{ flex: 1, textAlign: "center", padding: "1.2rem", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>{step.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--navy)", marginBottom: "0.3rem" }}>{step.title}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{step.desc}</div>
            </div>
          ))}
        </div>

        {/* Founding Partner box */}
        <div style={{ background: "linear-gradient(135deg, #fffdf0, #fff8dc)", border: "2px solid #f5c842", borderRadius: 16, padding: "2rem", textAlign: "center", marginBottom: "2.5rem" }}>
          <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "#5a4000", marginBottom: "0.5rem" }}>Founding Partner Spots Available
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#7a6020", maxWidth: 500, margin: "0 auto 0.5rem" }}>Get in early. Founding Partners receive priority placement, locked-in rates, and a Founding Partner badge featured across the site and in launch marketing.
          </p>
          <p style={{ fontSize: "0.82rem", color: "#a07800" }}>Use code <strong>FINDMYMAHJ</strong> in your inquiry.</p>
        </div>

        {/* Inquiry Form */}
        <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 16, padding: "2.5rem", marginBottom: "2rem" }} id="inquire">
          <h2 style={{ border: "none", marginTop: 0, marginBottom: "0.4rem" }}>Get Pricing</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1.8rem" }}>Fill this out and we'll email your options within 1-2 business days.
          </p>

          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}></div>
              <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.3rem", color: "var(--navy)", marginBottom: "0.5rem" }}>Pricing on its way!</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>Check your inbox. Once you've reviewed options and are ready, click the link in the email to fill out your full listing details.
              </p>
              <a href="/advertise/submit" style={{ display: "inline-block", background: "var(--pink)", color: "white", padding: "0.8rem 2rem", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: "0.95rem" }}>Ready now? Submit Your Listing →
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input type="text" required placeholder="Jane Smith" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" required placeholder="you@company.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Business / Brand Name <span className="form-optional">(optional)</span></label>
                <input type="text" placeholder="Your venue, company, or event name" value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">What are you interested in?</label>
                <select required value={form.interest}
                  onChange={e => setForm({ ...form, interest: e.target.value })} className="form-select">
                  <option value="">Select one...</option>
                  {LISTING_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              {status === "error" && (
                <p style={{ color: "#dc2626", fontSize: "0.85rem", marginBottom: "1rem" }}>Something went wrong. Email <a href={`mailto:${AD_EMAIL}`}>{AD_EMAIL}</a> directly.
                </p>
              )}
              <button type="submit" disabled={status === "submitting"}
                style={{ background: "var(--pink)", color: "white", border: "none", borderRadius: 8, padding: "0.9rem 2.5rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", width: "100%", opacity: status === "submitting" ? 0.7 : 1, transition: "opacity 0.2s" }}>
                {status === "submitting" ? "Sending..." : "Get Pricing →"}
              </button>
            </form>
          )}
        </div>

        <p style={{ fontSize: "0.82rem", color: "var(--muted)", textAlign: "center" }}>Questions? Email <a href={`mailto:${AD_EMAIL}`}>{AD_EMAIL}</a> directly.
        </p>
      </div>
    </>
  );
}
