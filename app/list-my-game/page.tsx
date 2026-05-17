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
  fontSize: "0.9rem",
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

export default function ListMyGamePage() {
  const [form, setForm] = useState({
    name: "",
    city: "",
    state: "",
    skill_level: "",
    availability: "",
    bio: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/player_listings`,
        {
          method: "POST",
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            name: form.name,
            city: form.city,
            state: form.state,
            skill_level: form.skill_level.toLowerCase(),
            availability: form.availability || null,
            bio: form.bio || null,
            email: form.email,
            status: "pending_review",
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedStateName =
    STATE_OPTIONS.find((s) => s.abbr === form.state)?.name || form.state;

  if (submitted) {
    return (
      <div className="page-body" style={{ maxWidth: 600, textAlign: "center", paddingTop: "4rem" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🀄</div>
        <h1
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontSize: "2rem",
            color: "var(--navy)",
            marginBottom: "0.8rem",
          }}
        >
          Thanks for submitting!
        </h1>
        <p style={{ fontSize: "1.05rem", color: "var(--muted)", lineHeight: 1.7 }}>
          Thanks! Your listing has been submitted for review. We&rsquo;ll approve it within 1-2 business days and you&rsquo;ll appear on your state page once approved.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">Free Player Listing</div>
        <h1>Create My Free Listing</h1>
        <p>
          List yourself so other players in your area can find you. Always free, no promo code needed.
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
          <h2 style={{ border: "none", marginTop: 0, marginBottom: "0.3rem" }}>
            Tell us about yourself
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
            Your email will never be shown publicly. We use it only to forward connection requests.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>
                Your Name <span style={{ fontWeight: 400, color: "var(--muted)" }}>(first name + last initial only, e.g. Sandra M.)</span>
              </label>
              <input
                type="text"
                placeholder="Sandra M."
                required
                maxLength={40}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* City + State */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  type="text"
                  placeholder="Boca Raton"
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
                  style={inputStyle}
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

            {/* Skill Level */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>Skill Level</label>
              <select
                required
                value={form.skill_level}
                onChange={(e) => setForm({ ...form, skill_level: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select your level...</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {/* Availability */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>
                Availability <span style={{ fontWeight: 400, color: "var(--muted)" }}>(e.g. Weekday Mornings, Weekend Afternoons)</span>
              </label>
              <input
                type="text"
                placeholder="Weekday Mornings"
                value={form.availability}
                onChange={(e) => setForm({ ...form, availability: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>
                About You <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional, max 200 characters)</span>
              </label>
              <textarea
                placeholder="Tell players a little about yourself..."
                maxLength={200}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                style={{ ...inputStyle, height: 100, resize: "vertical" }}
              />
              <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                {form.bio.length} / 200
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: "1.8rem" }}>
              <label style={labelStyle}>
                Email Address <span style={{ fontWeight: 400, color: "var(--muted)" }}>(for contact, will NOT be shown publicly)</span>
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
              />
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
              {submitting ? "Creating your listing..." : "Create My Free Listing →"}
            </button>

            <p style={{ fontSize: "0.78rem", color: "var(--muted)", textAlign: "center", marginTop: "1rem" }}>
              Always free. No credit card. No promo code needed.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
