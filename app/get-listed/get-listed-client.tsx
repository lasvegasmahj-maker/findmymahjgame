"use client";

import { useState } from "react";
import { STATES } from "@/lib/states-data";

const STATE_OPTIONS = Object.values(STATES).sort((a, b) => a.name.localeCompare(b.name));

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem 1rem",
  border: "1.5px solid var(--border)",
  borderRadius: 8,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "16px",
  color: "var(--text)",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "var(--navy)",
  marginBottom: "0.4rem",
};

type PromoStatus = "idle" | "checking" | "valid" | "invalid";

export default function GetListedClient({ defaultType = "" }: { defaultType?: string }) {
  const [form, setForm] = useState({
    business_name: "",
    type: ["Mahjong Instructor", "Open Play", "Tournament", "Retreat", "League", "Brand"].includes(defaultType) ? defaultType : "",
    city: "",
    state: "",
    email: "",
    website: "",
    instagram: "",
    description: "",
    promo_code: "",
    host: "",
    event_date: "",
    venue: "",
    signup_url: "",
  });
  const [promoStatus, setPromoStatus] = useState<PromoStatus>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const EVENT_TYPES = ["Open Play", "Tournament", "Retreat", "League"];
  const isEvent = EVENT_TYPES.includes(form.type);

  async function validatePromo() {
    const code = form.promo_code.trim().toUpperCase();
    if (!code) return;
    setPromoStatus("checking");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/promo_codes?code=eq.${encodeURIComponent(code)}&active=eq.true&select=code`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
        }
      );
      const data = await res.json();
      setPromoStatus(Array.isArray(data) && data.length > 0 ? "valid" : "invalid");
    } catch {
      setPromoStatus("invalid");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Instructors must have at least a website or Instagram
    if (form.type === "Mahjong Instructor" && !form.website && !form.instagram) {
      setError("Please add a website or Instagram handle so players can reach you.");
      return;
    }
    if (isEvent && (!form.host.trim() || !form.event_date.trim())) {
      setError("Please add who is hosting and the date & time.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/get-listed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.business_name,
          business_name: form.business_name,
          email: form.email,
          business_type: form.type,
          city: form.city,
          state: form.state,
          website: form.website || null,
          instagram: form.instagram || null,
          message: form.description,
          host: form.host || null,
          event_date: form.event_date || null,
          venue: form.venue || null,
          signup_url: form.signup_url || null,
          promo_code: form.promo_code.trim().toUpperCase() || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "We could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="page-body" style={{ maxWidth: 600, textAlign: "center", paddingTop: "4rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontSize: "2rem",
            color: "var(--navy)",
            marginBottom: "0.8rem",
          }}
        >Application received!
        </h1>
        <p style={{ fontSize: "1.05rem", color: "var(--muted)", lineHeight: 1.7, marginBottom: "2rem" }}>We&rsquo;ll review your listing and be in touch within 1-2 business days.
          {promoStatus === "valid" && (
            <> Your 6 months free starts on your approval date.</>
          )}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", alignItems: "center" }}>
          <a
            href="/states"
            style={{ display: "inline-block", padding: "0.75rem 1.8rem", background: "var(--navy)", color: "white", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: "0.95rem" }}
          >Browse Players by State &rarr;
          </a>
          <a
            href="/advertise"
            style={{ color: "var(--pink-text)", fontWeight: 600, textDecoration: "none", fontSize: "16px" }}
          >See advertising options
          </a>
          <a
            href="/"
            style={{ color: "var(--muted)", fontSize: "0.85rem", textDecoration: "none" }}
          >Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">Get Listed</div>
        <h1>List Your Business or Event</h1>
        <p>Reach mahjong players searching for instructors and events in their area.
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: 680 }}>
        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "2.5rem",
          }}
        >
          <h2 style={{ border: "none", marginTop: 0, marginBottom: "0.3rem" }}>Tell us about what you offer
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "16px", marginBottom: "2rem" }}>Have a promo code? Enter it below to unlock a special offer.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Business Name */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>{isEvent ? "Event name" : "Business / Name"}</label>
              <input
                type="text"
                placeholder={isEvent ? "Spring Mahjong Tournament" : "NYC Mahjong Studio"}
                required
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Type */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>Type</label>
              <select
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="form-select"
              >
                <option value="">Select a type...</option>
                <option value="Mahjong Instructor">Mahjong Instructor</option>
                <option value="Open Play">Open Play</option>
                <option value="Tournament">Tournament</option>
                <option value="Retreat">Retreat</option>
                <option value="League">League</option>
                <option value="Brand">Brand</option>
              </select>
            </div>

            {/* City + State */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  type="text"
                  placeholder="New York"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <select
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select a state...</option>
                  {STATE_OPTIONS.map((s) => (
                    <option key={s.abbr} value={s.abbr}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isEvent && (
              <>
                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={labelStyle}>Hosted by / Organizer</label>
                  <input type="text" required placeholder="Las Vegas Mahjong Club (or your name)" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
                  <div>
                    <label style={labelStyle}>Date &amp; time</label>
                    <input type="text" required placeholder="Tuesdays 6:30pm (or June 14, 1-4pm)" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Venue / location <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                    <input type="text" placeholder="Honey Salt Restaurant" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={labelStyle}>Sign-up / invite link <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                  <input type="url" placeholder="Where players sign up: your page, a form, or a link to your invite" value={form.signup_url} onChange={(e) => setForm({ ...form, signup_url: e.target.value })} style={inputStyle} />
                </div>
              </>
            )}

            {/* Email */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Website + Instagram */}
            {form.type === "Mahjong Instructor" && (
              <div style={{ background: "rgba(233,30,140,0.05)", border: "1px solid rgba(233,30,140,0.2)", borderRadius: 8, padding: "0.8rem 1rem", marginBottom: "1rem", fontSize: "0.85rem", color: "var(--navy)" }}>Players will see your email, website, and Instagram on your listing. Please provide at least one way for them to reach you.
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
              <div>
                <label style={labelStyle}>Website <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://yoursite.com"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Instagram {form.type === "Mahjong Instructor"
                    ? <span style={{ fontWeight: 400, color: "var(--muted)" }}>(recommended)</span>
                    : <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>}
                </label>
                <input
                  type="text"
                  placeholder="@yourhandle"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>{isEvent ? "About this event" : "Tell players about what you offer"}</label>
              <textarea
                placeholder={isEvent ? "What is it, who is it for, and what should players expect?" : "Describe your classes, venue, or events..."}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ ...inputStyle, height: 120, resize: "vertical" }}
              />
            </div>

            {/* Promo Code */}
            <div style={{ marginBottom: "1.8rem" }}>
              <label style={labelStyle}>Promo Code <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
              </label>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <input
                  type="text"
                  placeholder="FINDMYMAHJ"
                  value={form.promo_code}
                  onChange={(e) => {
                    setForm({ ...form, promo_code: e.target.value });
                    setPromoStatus("idle");
                  }}
                  style={{ ...inputStyle, flex: 1, textTransform: "uppercase" }}
                />
                <button
                  type="button"
                  onClick={validatePromo}
                  disabled={!form.promo_code.trim() || promoStatus === "checking"}
                  style={{
                    background: "var(--navy)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "0.7rem 1.2rem",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: !form.promo_code.trim() || promoStatus === "checking" ? "not-allowed" : "pointer",
                    opacity: !form.promo_code.trim() ? 0.5 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {promoStatus === "checking" ? "Checking..." : "Validate"}
                </button>
              </div>

              {promoStatus === "valid" && (
                <div
                  style={{
                    marginTop: "0.6rem",
                    background: "rgba(46,201,92,0.1)",
                    border: "1.5px solid rgba(46,201,92,0.4)",
                    borderRadius: 8,
                    padding: "0.75rem 1rem",
                    fontSize: "0.88rem",
                    color: "#1a9648",
                    fontWeight: 600,
                  }}
                >Code {form.promo_code.trim().toUpperCase()} applied. 6 months free! You&rsquo;ll be a Founding Member.
                </div>
              )}

              {promoStatus === "invalid" && (
                <div
                  style={{
                    marginTop: "0.6rem",
                    background: "rgba(220,38,38,0.08)",
                    border: "1.5px solid rgba(220,38,38,0.3)",
                    borderRadius: 8,
                    padding: "0.75rem 1rem",
                    fontSize: "0.88rem",
                    color: "#b91c1c",
                  }}
                >Code not recognized. Please check your code and try again.
                </div>
              )}
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(220,38,38,0.08)",
                  border: "1.5px solid rgba(220,38,38,0.3)",
                  borderRadius: 8,
                  padding: "0.8rem 1rem",
                  fontSize: "0.88rem",
                  color: "#b91c1c",
                  marginBottom: "1.2rem",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                background: "var(--pink)",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "0.95rem",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {submitting ? "Submitting..." : "Submit My Listing →"}
            </button>

            <p style={{ fontSize: "0.78rem", color: "var(--muted)", textAlign: "center", marginTop: "1rem" }}>We&rsquo;ll review your listing and be in touch within 1-2 business days.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
