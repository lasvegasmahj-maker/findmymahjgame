"use client";

import { useState } from "react";
import { AD_EMAIL } from "@/lib/constants";

type ListingType = "venue" | "instructor" | "event" | "brand" | "";

const TYPE_OPTIONS = [
  { value: "venue", label: "Venue Listing", icon: "🏛", desc: "Restaurant, studio, community space" },
  { value: "instructor", label: "Instructor Listing", icon: "🎓", desc: "Mahjong teacher or certified instructor" },
  { value: "event", label: "Event / Tournament", icon: "🎫", desc: "Open play, tournament, retreat, workshop" },
  { value: "brand", label: "Brand Advertising", icon: "🛍️", desc: "Mahjong sets, accessories, related products" },
];

export default function SubmitClient() {
  const [listingType, setListingType] = useState<ListingType>("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    const res = await fetch("/api/advertise-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingType, ...form }),
    });
    setStatus(res.ok ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="page-body" style={{ maxWidth: 600, textAlign: "center", paddingTop: "4rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
        <h1 style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: "1.8rem", color: "var(--navy)", marginBottom: "0.75rem" }}>
          Listing submitted!
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "0.5rem" }}>
          We'll review your details and send you an approval confirmation within 24 hours. Once approved, you'll be live.
        </p>
        <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
          Questions? <a href={`mailto:${AD_EMAIL}`}>{AD_EMAIL}</a>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="page-hero" style={{ paddingBottom: "2rem" }}>
        <div className="eyebrow">Step 2 of 2</div>
        <h1>Submit Your Listing Details</h1>
        <p>Fill this out completely so we can build your listing exactly right and approve it with one click.</p>
      </div>

      <div className="page-body" style={{ maxWidth: 680 }}>
        <form onSubmit={handleSubmit}>

          {/* Contact info */}
          <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: "1.8rem", marginBottom: "1.5rem" }}>
            <h2 style={{ border: "none", marginTop: 0, marginBottom: "1.2rem", fontSize: "1.1rem" }}>Your Contact Info</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Your Name</label>
                <input type="text" required placeholder="Jane Smith" value={form.contactName || ""}
                  onChange={e => set("contactName", e.target.value)} className="form-input" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input type="email" required placeholder="you@company.com" value={form.contactEmail || ""}
                  onChange={e => set("contactEmail", e.target.value)} className="form-input" />
              </div>
            </div>
          </div>

          {/* Listing type selector */}
          <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: "1.8rem", marginBottom: "1.5rem" }}>
            <h2 style={{ border: "none", marginTop: 0, marginBottom: "1.2rem", fontSize: "1.1rem" }}>What type of listing?</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {TYPE_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setListingType(opt.value as ListingType)}
                  style={{
                    padding: "1rem", borderRadius: 10, textAlign: "left", cursor: "pointer",
                    border: listingType === opt.value ? "2px solid var(--pink)" : "1.5px solid var(--border)",
                    background: listingType === opt.value ? "rgba(233,30,140,0.04)" : "white",
                    transition: "all 0.15s",
                  }}>
                  <div style={{ fontSize: "1.3rem", marginBottom: "0.3rem" }}>{opt.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: listingType === opt.value ? "var(--pink)" : "var(--navy)", marginBottom: "0.15rem" }}>{opt.label}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific fields */}
          {listingType === "venue" && (
            <VenueFields form={form} set={set} />
          )}
          {listingType === "instructor" && (
            <InstructorFields form={form} set={set} />
          )}
          {listingType === "event" && (
            <EventFields form={form} set={set} />
          )}
          {listingType === "brand" && (
            <BrandFields form={form} set={set} />
          )}

          {/* Shared social + logo */}
          {listingType && (
            <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: "1.8rem", marginBottom: "1.5rem" }}>
              <h2 style={{ border: "none", marginTop: 0, marginBottom: "1.2rem", fontSize: "1.1rem" }}>Links & Logo</h2>
              {listingType !== "brand" && (
                <div className="form-group">
                  <label className="form-label">Website URL <span className="form-optional">(optional)</span></label>
                  <input type="url" placeholder="https://yourwebsite.com" value={form.website || ""}
                    onChange={e => set("website", e.target.value)} className="form-input" />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Instagram <span className="form-optional">(optional)</span></label>
                  <input type="text" placeholder="@yourhandle" value={form.instagram || ""}
                    onChange={e => set("instagram", e.target.value)} className="form-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Facebook URL <span className="form-optional">(optional)</span></label>
                  <input type="url" placeholder="https://facebook.com/yourpage" value={form.facebook || ""}
                    onChange={e => set("facebook", e.target.value)} className="form-input" />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Logo or Image URL <span className="form-optional">(optional)</span></label>
                <input type="url" placeholder="https://yourwebsite.com/logo.png" value={form.logoUrl || ""}
                  onChange={e => set("logoUrl", e.target.value)} className="form-input" />
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.35rem" }}>
                  Paste a direct link to your logo. Or email it to <a href={`mailto:${AD_EMAIL}`}>{AD_EMAIL}</a> and we'll add it for you.
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Anything else we should know? <span className="form-optional">(optional)</span></label>
                <textarea placeholder="Special requests, notes, or questions..." value={form.notes || ""}
                  onChange={e => set("notes", e.target.value)} className="form-textarea" style={{ height: 80 }} />
              </div>
            </div>
          )}

          {listingType && (
            <>
              {status === "error" && (
                <p style={{ color: "#dc2626", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  Something went wrong. Email <a href={`mailto:${AD_EMAIL}`}>{AD_EMAIL}</a> directly.
                </p>
              )}
              <button type="submit" disabled={status === "submitting"}
                style={{ background: "var(--pink)", color: "white", border: "none", borderRadius: 8, padding: "1rem 2.5rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", width: "100%", opacity: status === "submitting" ? 0.7 : 1 }}>
                {status === "submitting" ? "Submitting..." : "Submit My Listing for Review →"}
              </button>
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", textAlign: "center", marginTop: "0.75rem" }}>
                We'll review and send you an approval within 24 hours.
              </p>
            </>
          )}

        </form>
      </div>
    </>
  );
}

function VenueFields({ form, set }: { form: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: "1.8rem", marginBottom: "1.5rem" }}>
      <h2 style={{ border: "none", marginTop: 0, marginBottom: "1.2rem", fontSize: "1.1rem" }}>🏛 Venue Details</h2>
      <div className="form-group">
        <label className="form-label">Venue Name</label>
        <input type="text" required placeholder="The Mahjong Cafe" value={form.displayName || ""}
          onChange={e => set("displayName", e.target.value)} className="form-input" />
      </div>
      <div className="form-group">
        <label className="form-label">Street Address</label>
        <input type="text" required placeholder="123 Main St" value={form.address || ""}
          onChange={e => set("address", e.target.value)} className="form-input" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">City</label>
          <input type="text" required placeholder="Las Vegas" value={form.city || ""}
            onChange={e => set("city", e.target.value)} className="form-input" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">State</label>
          <input type="text" required placeholder="NV" value={form.stateName || ""}
            onChange={e => set("stateName", e.target.value)} className="form-input" />
        </div>
      </div>
      <div className="form-group" style={{ marginTop: "1rem" }}>
        <label className="form-label">Mahjong Hours</label>
        <input type="text" required placeholder="Tuesdays 10am-12pm, Fridays 1pm-3pm" value={form.hours || ""}
          onChange={e => set("hours", e.target.value)} className="form-input" />
      </div>
      <div className="form-group">
        <label className="form-label">Contact Phone <span className="form-optional">(optional)</span></label>
        <input type="tel" placeholder="(555) 555-5555" value={form.phone || ""}
          onChange={e => set("phone", e.target.value)} className="form-input" />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea required placeholder="Tell players what makes your venue great for mahjong. Who plays here? What's the vibe? What should they know before coming?" value={form.description || ""}
          onChange={e => set("description", e.target.value)} className="form-textarea" />
      </div>
    </div>
  );
}

function InstructorFields({ form, set }: { form: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: "1.8rem", marginBottom: "1.5rem" }}>
      <h2 style={{ border: "none", marginTop: 0, marginBottom: "1.2rem", fontSize: "1.1rem" }}>🎓 Instructor Details</h2>
      <div className="form-group">
        <label className="form-label">Instructor / Business Name</label>
        <input type="text" required placeholder="Jane Smith Mahjong" value={form.displayName || ""}
          onChange={e => set("displayName", e.target.value)} className="form-input" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">City</label>
          <input type="text" required placeholder="Las Vegas" value={form.city || ""}
            onChange={e => set("city", e.target.value)} className="form-input" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">State</label>
          <input type="text" required placeholder="NV" value={form.stateName || ""}
            onChange={e => set("stateName", e.target.value)} className="form-input" />
        </div>
      </div>
      <div className="form-group" style={{ marginTop: "1rem" }}>
        <label className="form-label">Bio</label>
        <textarea required placeholder="Tell players about yourself: your background, certifications, teaching style, and what makes your lessons great." value={form.bio || ""}
          onChange={e => set("bio", e.target.value)} className="form-textarea" />
      </div>
      <div className="form-group">
        <label className="form-label">What you offer</label>
        <textarea required placeholder="Group lessons, private lessons, MAHJ101, MAHJ102, beginner/intermediate, session length, price range, etc." value={form.whatOffered || ""}
          onChange={e => set("whatOffered", e.target.value)} className="form-textarea" />
      </div>
    </div>
  );
}

function EventFields({ form, set }: { form: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: "1.8rem", marginBottom: "1.5rem" }}>
      <h2 style={{ border: "none", marginTop: 0, marginBottom: "1.2rem", fontSize: "1.1rem" }}>🎫 Event Details</h2>
      <div className="form-group">
        <label className="form-label">Event Name</label>
        <input type="text" required placeholder="Spring Mahjong Tournament" value={form.displayName || ""}
          onChange={e => set("displayName", e.target.value)} className="form-input" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Event Type</label>
          <select required value={form.eventType || ""} onChange={e => set("eventType", e.target.value)} className="form-select">
            <option value="">Select...</option>
            <option>Open Play</option>
            <option>Tournament</option>
            <option>Retreat</option>
            <option>Workshop</option>
            <option>Fundraiser</option>
            <option>Other</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Date(s)</label>
          <input type="text" required placeholder="June 14, 2026" value={form.eventDate || ""}
            onChange={e => set("eventDate", e.target.value)} className="form-input" />
        </div>
      </div>
      <div className="form-group" style={{ marginTop: "1rem" }}>
        <label className="form-label">Venue / Location Name</label>
        <input type="text" required placeholder="The Venetian Resort, Las Vegas" value={form.eventLocation || ""}
          onChange={e => set("eventLocation", e.target.value)} className="form-input" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">City</label>
          <input type="text" required placeholder="Las Vegas" value={form.city || ""}
            onChange={e => set("city", e.target.value)} className="form-input" />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">State</label>
          <input type="text" required placeholder="NV" value={form.stateName || ""}
            onChange={e => set("stateName", e.target.value)} className="form-input" />
        </div>
      </div>
      <div className="form-group" style={{ marginTop: "1rem" }}>
        <label className="form-label">Cost / Ticket Price <span className="form-optional">(optional)</span></label>
        <input type="text" placeholder="Free, $25, $50-100" value={form.price || ""}
          onChange={e => set("price", e.target.value)} className="form-input" />
      </div>
      <div className="form-group">
        <label className="form-label">Registration / Ticket Link <span className="form-optional">(optional)</span></label>
        <input type="url" placeholder="https://eventbrite.com/..." value={form.registrationUrl || ""}
          onChange={e => set("registrationUrl", e.target.value)} className="form-input" />
      </div>
      <div className="form-group">
        <label className="form-label">Event Description</label>
        <textarea required placeholder="What is this event? Who is it for? What should attendees know? Why should they come?" value={form.description || ""}
          onChange={e => set("description", e.target.value)} className="form-textarea" />
      </div>
    </div>
  );
}

function BrandFields({ form, set }: { form: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 14, padding: "1.8rem", marginBottom: "1.5rem" }}>
      <h2 style={{ border: "none", marginTop: 0, marginBottom: "1.2rem", fontSize: "1.1rem" }}>🛍️ Brand Details</h2>
      <div className="form-group">
        <label className="form-label">Company / Brand Name</label>
        <input type="text" required placeholder="Oh My Mahjong" value={form.displayName || ""}
          onChange={e => set("displayName", e.target.value)} className="form-input" />
      </div>
      <div className="form-group">
        <label className="form-label">Website URL</label>
        <input type="url" required placeholder="https://yourstore.com" value={form.website || ""}
          onChange={e => set("website", e.target.value)} className="form-input" />
      </div>
      <div className="form-group">
        <label className="form-label">Target States <span className="form-optional">(optional)</span></label>
        <input type="text" placeholder="Nationwide, or list specific states: CA, NY, FL" value={form.targetStates || ""}
          onChange={e => set("targetStates", e.target.value)} className="form-input" />
      </div>
      <div className="form-group">
        <label className="form-label">What you offer / Ad copy</label>
        <textarea required placeholder="Describe your product or service. What do you sell? What makes it special for mahjong players? Include any discount code you'd like featured." value={form.description || ""}
          onChange={e => set("description", e.target.value)} className="form-textarea" />
      </div>
    </div>
  );
}
