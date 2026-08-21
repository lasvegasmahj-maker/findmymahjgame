"use client";

import { useState } from "react";
import Link from "next/link";
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
  fontSize: "0.95rem",
  fontWeight: 700,
  color: "var(--navy)",
  marginBottom: "0.4rem",
};

type PromoStatus = "idle" | "checking" | "valid" | "invalid";

const ALLOWED_TYPES = ["Mahjong Instructor", "Open Play", "Tournament", "Retreat", "League"];
const fmtDate = (d: string) => {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export default function GetListedClient({ defaultType = "" }: { defaultType?: string }) {
  const [form, setForm] = useState({
    contact_name: "",
    business_name: "",
    type: ALLOWED_TYPES.includes(defaultType) ? defaultType : "",
    city: "",
    state: "",
    email: "",
    website: "",
    instagram: "",
    description: "",
    promo_code: "",
    host: "",
    event_schedule: "one_time",
    event_date: "",
    event_time: "",
    end_date: "",
    frequency: "Weekly",
    day_time: "",
    beginner_friendly: false,
    venue: "",
    signup_url: "",
  });
  const [promoStatus, setPromoStatus] = useState<PromoStatus>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const isEvent = ["Open Play", "Tournament", "Retreat", "League"].includes(form.type);
  const recurring = form.event_schedule === "recurring";

  async function validatePromo() {
    const code = form.promo_code.trim().toUpperCase();
    if (!code) return;
    // Founding code is accepted directly; billing is set up manually until the
    // Stripe build lands. Other codes validate against the promo_codes table.
    if (code === "FINDMYMAHJGAME") { setPromoStatus("valid"); return; }
    setPromoStatus("checking");
    try {
      const res = await fetch("/api/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setPromoStatus(data?.valid ? "valid" : "invalid");
    } catch {
      setPromoStatus("invalid");
    }
  }

  function whenText(): string {
    if (!isEvent) return "";
    if (recurring) return `${form.day_time}${form.frequency ? ` (${form.frequency})` : ""}`.trim();
    let t = `${fmtDate(form.event_date)}${form.event_time ? ` ${form.event_time}` : ""}`.trim();
    if (form.end_date) t += ` to ${fmtDate(form.end_date)}`;
    return t;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.type === "Mahjong Instructor" && !form.website && !form.instagram) {
      setError("Please add a website or Instagram handle so players can reach you.");
      return;
    }
    if (isEvent) {
      if (!form.host.trim()) { setError("Please add who is hosting."); return; }
      if (recurring ? !form.day_time.trim() : !form.event_date.trim()) {
        setError("Please add when the event happens."); return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/get-listed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.contact_name,
          business_name: form.business_name,
          email: form.email,
          business_type: form.type,
          city: form.city,
          state: form.state,
          website: form.website || null,
          instagram: form.instagram || null,
          message: form.description,
          host: form.host || null,
          event_date: whenText() || null,
          end_date: isEvent && !recurring && form.end_date ? fmtDate(form.end_date) : null,
          frequency: isEvent && recurring ? form.frequency : null,
          recurring: isEvent ? recurring : null,
          beginner_friendly: isEvent ? form.beginner_friendly : null,
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
    const firstName = form.contact_name.trim().split(/\s+/)[0];
    const typeLabel = (form.type || "listing").toLowerCase();
    return (
      <div className="page-body" style={{ maxWidth: 600, textAlign: "center", paddingTop: "4rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "2rem", color: "var(--navy)", marginBottom: "0.8rem" }}>Listing submitted!</h1>
        <p style={{ fontSize: "1.05rem", color: "var(--muted)", lineHeight: 1.7, marginBottom: "1rem" }}>
          Thanks{firstName ? `, ${firstName}` : ""}! We received your {typeLabel} listing and emailed a confirmation to <strong>{form.email}</strong>. We&rsquo;ll review it and email you within 1-2 business days. Once it&rsquo;s approved it goes live on your {STATE_OPTIONS.find((s) => s.abbr === form.state)?.name || "state"} page, and we&rsquo;ll send you the link plus how to edit it.
        </p>
        {promoStatus === "valid" && (
          <p style={{ fontSize: "1rem", color: "#1a6e3a", lineHeight: 1.7, marginBottom: "2rem", fontWeight: 600 }}>
            As a Charter Member, your first 6 months are free. Nothing is charged today, we&rsquo;ll email you to set up billing before the free period ends.
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", alignItems: "center" }}>
          <Link href="/states" style={{ display: "inline-block", padding: "0.75rem 1.8rem", background: "var(--navy)", color: "white", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: "0.95rem" }}>Browse the directory &rarr;</Link>
          <Link href="/" style={{ color: "var(--muted)", fontSize: "0.85rem", textDecoration: "none" }}>Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-hero">
        <div className="eyebrow">Get Listed</div>
        <h1>List Your Business or Event</h1>
        <p>Reach mahjong players searching for instructors and events in their area.</p>
      </div>

      <div className="page-body" style={{ maxWidth: 680 }}>
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 20, padding: "2.5rem" }}>
          <h2 style={{ border: "none", marginTop: 0, marginBottom: "0.3rem" }}>Tell us about what you offer</h2>
          <p style={{ color: "var(--muted)", fontSize: "16px", marginBottom: "2rem" }}>We review every listing by hand and email you within 1-2 business days. Have a promo code? Enter it below.</p>

          <form onSubmit={handleSubmit}>
            {/* Type first, so the form adapts */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>What are you listing?</label>
              <select required aria-label="What are you listing" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="form-select">
                <option value="">Select a type...</option>
                <option value="Mahjong Instructor">Mahjong Instructor</option>
                <option value="Open Play">Open Play</option>
                <option value="Tournament">Tournament</option>
                <option value="Retreat">Retreat</option>
                <option value="League">League</option>
              </select>
            </div>

            {/* Your name */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>Your name <span style={{ fontWeight: 400, color: "var(--muted)" }}>(the person we should contact)</span></label>
              <input type="text" placeholder="Sandra Martinez" required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} style={inputStyle} />
            </div>

            {/* Business / Event name */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>{isEvent ? "Event name" : "Business / listing name"}</label>
              <input type="text" placeholder={isEvent ? "Spring Mahjong Tournament" : "NYC Mahjong Studio"} required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} style={inputStyle} />
            </div>

            {/* City + State */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
              <div>
                <label style={labelStyle}>City</label>
                <input type="text" placeholder="New York" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <select required aria-label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="form-select">
                  <option value="">Select a state...</option>
                  {STATE_OPTIONS.map((s) => (<option key={s.abbr} value={s.abbr}>{s.name}</option>))}
                </select>
              </div>
            </div>

            {isEvent && (
              <>
                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={labelStyle}>Hosted by / organizer</label>
                  <input type="text" required placeholder="Las Vegas Mahjong Club (or your name)" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} style={inputStyle} />
                </div>

                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={labelStyle}>Is this a one-time event or a recurring game?</label>
                  <select aria-label="One-time or recurring" value={form.event_schedule} onChange={(e) => setForm({ ...form, event_schedule: e.target.value })} className="form-select">
                    <option value="one_time">One-time event (a specific date)</option>
                    <option value="recurring">Recurring game (repeats regularly)</option>
                  </select>
                </div>

                {recurring ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
                    <div>
                      <label style={labelStyle}>Day &amp; time</label>
                      <input type="text" required placeholder="Tuesdays 6:30pm" value={form.day_time} onChange={(e) => setForm({ ...form, day_time: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>How often?</label>
                      <select aria-label="How often" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="form-select">
                        <option>Weekly</option>
                        <option>Every other week</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
                    <div>
                      <label style={labelStyle}>Date</label>
                      <input type="date" required aria-label="Event date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Time <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                      <input type="text" placeholder="1-4pm" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>End date <span style={{ fontWeight: 400, color: "var(--muted)" }}>(only for multi-day events)</span></label>
                      <input type="date" aria-label="Event end date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
                  <div>
                    <label style={labelStyle}>Venue / location <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                    <input type="text" placeholder="Honey Salt Restaurant" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Sign-up / invite link <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                    <input type="url" placeholder="https://..." value={form.signup_url} onChange={(e) => setForm({ ...form, signup_url: e.target.value })} style={inputStyle} />
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.2rem", cursor: "pointer", color: "var(--navy)", fontWeight: 600 }}>
                  <input type="checkbox" checked={form.beginner_friendly} onChange={(e) => setForm({ ...form, beginner_friendly: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--pink)" }} />
                  This event is beginner-friendly
                </label>
              </>
            )}

            {/* Email */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>Email address <span style={{ fontWeight: 400, color: "var(--muted)" }}>(we email you here, players see it only if you choose)</span></label>
              <input type="email" placeholder="you@example.com" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            </div>

            {form.type === "Mahjong Instructor" && (
              <div style={{ background: "rgba(233,30,140,0.05)", border: "1px solid rgba(233,30,140,0.2)", borderRadius: 8, padding: "0.8rem 1rem", marginBottom: "1rem", fontSize: "0.85rem", color: "var(--navy)" }}>Players will see your email, website, and Instagram on your listing. Please provide at least one way for them to reach you.</div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
              <div>
                <label style={labelStyle}>Website <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                <input type="url" placeholder="https://yoursite.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Instagram {form.type === "Mahjong Instructor" ? <span style={{ fontWeight: 400, color: "var(--muted)" }}>(recommended)</span> : <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>}</label>
                <input type="text" placeholder="@yourhandle" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} style={inputStyle} />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={labelStyle}>{isEvent ? "About this event" : "Tell players about what you offer"}</label>
              <textarea placeholder={isEvent ? "What is it, who is it for, and what should players expect?" : "Describe your classes, venue, or events..."} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 120, resize: "vertical" }} />
            </div>

            {/* Promo Code */}
            <div style={{ marginBottom: "1.8rem" }}>
              <label style={labelStyle}>Promo Code <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <input type="text" placeholder="FINDMYMAHJGAME" value={form.promo_code} onChange={(e) => { setForm({ ...form, promo_code: e.target.value }); setPromoStatus("idle"); }} style={{ ...inputStyle, flex: 1, textTransform: "uppercase" }} />
                <button type="button" onClick={validatePromo} disabled={!form.promo_code.trim() || promoStatus === "checking"} style={{ background: "var(--navy)", color: "white", border: "none", borderRadius: 8, padding: "0.7rem 1.2rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", fontWeight: 700, cursor: !form.promo_code.trim() || promoStatus === "checking" ? "not-allowed" : "pointer", opacity: !form.promo_code.trim() ? 0.5 : 1, whiteSpace: "nowrap" }}>{promoStatus === "checking" ? "Checking..." : "Validate"}</button>
              </div>
              {promoStatus === "valid" && (
                <div style={{ marginTop: "0.6rem", background: "rgba(46,201,92,0.1)", border: "1.5px solid rgba(46,201,92,0.4)", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.88rem", color: "#1a9648", fontWeight: 600 }}>Code {form.promo_code.trim().toUpperCase()} applied. As a Charter Member your first 6 months are free. Nothing is charged today, we&rsquo;ll set up billing by email.</div>
              )}
              {promoStatus === "invalid" && (
                <div style={{ marginTop: "0.6rem", background: "rgba(220,38,38,0.08)", border: "1.5px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.88rem", color: "#b91c1c" }}>Code not recognized. Please check your code and try again.</div>
              )}
            </div>

            {error && (
              <div style={{ background: "rgba(220,38,38,0.08)", border: "1.5px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "0.8rem 1rem", fontSize: "0.88rem", color: "#b91c1c", marginBottom: "1.2rem" }}>{error}</div>
            )}

            <button type="submit" disabled={submitting} style={{ width: "100%", background: "var(--pink)", color: "white", border: "none", borderRadius: 8, padding: "0.95rem", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, transition: "opacity 0.2s" }}>{submitting ? "Submitting..." : "Submit My Listing →"}</button>

            <p style={{ fontSize: "0.78rem", color: "var(--muted)", textAlign: "center", marginTop: "1rem" }}>We review every listing by hand and email you within 1-2 business days.</p>
          </form>
        </div>
      </div>
    </>
  );
}
