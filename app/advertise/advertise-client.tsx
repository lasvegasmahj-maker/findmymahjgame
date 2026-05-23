"use client";

import { useState } from "react";
import { AD_EMAIL } from "@/lib/constants";

export default function AdvertiseClient() {
  const [form, setForm] = useState({ name: "", email: "", company: "", interest: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    const res = await fetch("/api/advertise-inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setStatus(res.ok ? "success" : "error");
  }

  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">Advertise</div>
        <h1>Reach the Mahjong Community</h1>
        <p>
          Put your brand, venue, or event in front of mahjong players actively searching for their next game.
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: 860 }}>

        {/* What you can advertise */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", margin: "2.5rem 0" }}>
          {[
            { icon: "🏛", title: "Venues", desc: "Restaurants, studios, JCCs and community spaces that welcome mahjong players." },
            { icon: "🎓", title: "Instructors", desc: "Mahjong teachers and certified instructors reaching students in their area." },
            { icon: "🎫", title: "Events", desc: "Open plays, tournaments, retreats and game nights reaching local and national players." },
            { icon: "🛍️", title: "Brands", desc: "Mahjong sets, accessories, and products reaching an engaged niche audience." },
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
            { icon: "📝", title: "1. Send an inquiry", desc: "Fill out the form below. Takes 2 minutes." },
            { icon: "📬", title: "2. Get pricing", desc: "We email you options tailored to what you need." },
            { icon: "✅", title: "3. Go live", desc: "Once approved and paid, you're listed within 24 hrs." },
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
          <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.4rem", color: "#5a4000", marginBottom: "0.5rem" }}>
            Founding Partner Spots Available
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#7a6020", maxWidth: 500, margin: "0 auto 0.5rem" }}>
            Get in early. Founding Partners receive priority placement, locked-in rates, and a Founding Partner badge featured across the site and in launch marketing.
          </p>
          <p style={{ fontSize: "0.82rem", color: "#a07800" }}>Use code <strong>FINDMYMAHJ</strong> in your inquiry.</p>
        </div>

        {/* Inquiry Form */}
        <div className="bg-bg border border-border rounded-2xl p-8 my-8" id="inquire">
          <h2 style={{ border: "none", marginTop: 0 }}>Get in Touch</h2>
          <p className="page-body p" style={{ marginBottom: "1.5rem" }}>
            Tell us what you&rsquo;re looking for and we&rsquo;ll send you tailored pricing options within 1-2 business days.
          </p>

          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✅</div>
              <h3 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.3rem", color: "var(--navy)", marginBottom: "0.5rem" }}>Inquiry received!</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
                Check your inbox -- we just sent you our advertising options. We&rsquo;ll follow up personally within 1-2 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
                <div>
                  <label className="block text-[0.82rem] font-bold text-navy mb-1">Your Name</label>
                  <input type="text" required placeholder="Jane Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-[0.82rem] font-bold text-navy mb-1">Email Address</label>
                  <input type="email" required placeholder="you@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none" />
                </div>
              </div>
              <div style={{ marginBottom: "1.2rem" }}>
                <label className="block text-[0.82rem] font-bold text-navy mb-1">Business / Brand Name</label>
                <input type="text" placeholder="Your venue, company, or event name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                  className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none" />
              </div>
              <div style={{ marginBottom: "1.2rem" }}>
                <label className="block text-[0.82rem] font-bold text-navy mb-1">What are you interested in?</label>
                <select required value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })}
                  className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none">
                  <option value="">Select one...</option>
                  <option>Venue Listing</option>
                  <option>Instructor Listing</option>
                  <option>Event / Tournament Listing</option>
                  <option>Brand Advertising</option>
                  <option>Founding Partner</option>
                  <option>Not sure yet</option>
                </select>
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="block text-[0.82rem] font-bold text-navy mb-1">Tell us about what you offer <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                <textarea placeholder="Where are you located? What are you hoping to achieve?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full py-2.5 px-4 border-[1.5px] border-border rounded-lg font-body text-[0.9rem] text-text bg-white outline-none"
                  style={{ height: 100, resize: "vertical" }} />
              </div>
              {status === "error" && <p style={{ color: "#dc2626", fontSize: "0.85rem", marginBottom: "1rem" }}>Something went wrong. Email us directly at <a href={`mailto:${AD_EMAIL}`}>{AD_EMAIL}</a>.</p>}
              <button type="submit" disabled={status === "submitting"}
                className="bg-pink text-white border-none rounded-lg py-3.5 px-10 font-body text-[1rem] font-bold cursor-pointer w-full"
                style={{ opacity: status === "submitting" ? 0.7 : 1 }}>
                {status === "submitting" ? "Sending..." : "Get Advertising Options →"}
              </button>
            </form>
          )}
        </div>

        <p className="text-[0.82rem] text-muted text-center">
          Questions? Email <a href={`mailto:${AD_EMAIL}`}>{AD_EMAIL}</a> directly.
        </p>
      </div>
    </>
  );
}
