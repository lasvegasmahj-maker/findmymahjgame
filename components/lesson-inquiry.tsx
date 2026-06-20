"use client";

import { useState } from "react";

// "Request a lesson" inquiry funnel. A player sends a structured request and the
// API emails it to the teacher (reply-to the player), so the teacher just hits
// reply. Shown on paid Member (pro) teacher cards. Players never pay.
export default function LessonInquiry({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", area: "", experience: "", message: "Hi! I'm looking for mahjong lessons. " });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErr("");
    try {
      const res = await fetch("/api/lesson-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, ...form }),
      });
      if (res.ok) { setStatus("sent"); return; }
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Something went wrong. Please try again.");
      setStatus("error");
    } catch {
      setErr("We could not reach the server. Please check your connection and try again.");
      setStatus("error");
    }
  }

  const field: React.CSSProperties = { width: "100%", padding: "0.6rem 0.8rem", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "16px", color: "var(--navy)", background: "white", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--navy)", margin: "0.7rem 0 0.25rem" };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 44, padding: "0 1.1rem", borderRadius: 12, background: "var(--pink)", color: "white", border: "none", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Request a lesson &rarr;</button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={`Request a lesson with ${teacherName}`} onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(26,31,94,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 16, padding: "1.6rem", width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(26,31,94,0.3)" }}>
            {status === "sent" ? (
              <div style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.5rem" }}>Request sent!</div>
                <p style={{ fontSize: "1.02rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.4rem" }}>{teacherName} will reach out to you directly. Players never pay.</p>
                <button type="button" onClick={() => setOpen(false)} style={{ minHeight: 48, padding: "0 1.6rem", borderRadius: 12, background: "var(--navy)", color: "white", border: "none", fontWeight: 800, fontSize: "1rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Done</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.2rem" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", margin: 0, lineHeight: 1.3 }}>Request a lesson with {teacherName}</h3>
                  <button type="button" aria-label="Close" onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "var(--muted)", cursor: "pointer", lineHeight: 1, padding: 0 }}>&times;</button>
                </div>
                <label style={lbl}>Your name</label>
                <input style={field} required value={form.name} onChange={(e) => set("name", e.target.value)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                  <div><label style={lbl}>Email</label><input style={field} type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
                  <div><label style={lbl}>Phone <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label><input style={field} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                </div>
                <label style={lbl}>Your area <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                <input style={field} placeholder="City or neighborhood" value={form.area} onChange={(e) => set("area", e.target.value)} />
                <label style={lbl}>Experience <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {["New", "Beginner", "Some experience"].map((x) => (
                    <button key={x} type="button" onClick={() => set("experience", form.experience === x ? "" : x)} style={{ padding: "0.45rem 0.8rem", borderRadius: 50, border: `1.5px solid ${form.experience === x ? "var(--pink)" : "var(--border)"}`, background: form.experience === x ? "var(--pink)" : "white", color: form.experience === x ? "white" : "var(--navy)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{x}</button>
                  ))}
                </div>
                <label style={lbl}>Message</label>
                <textarea style={{ ...field, minHeight: 90, resize: "vertical" }} required value={form.message} onChange={(e) => set("message", e.target.value)} />
                {err && <p style={{ color: "#b91c1c", fontSize: "0.88rem", margin: "0.7rem 0 0" }}>{err}</p>}
                <button type="submit" disabled={status === "submitting"} style={{ width: "100%", marginTop: "1rem", minHeight: 50, borderRadius: 12, background: "var(--pink)", color: "white", border: "none", fontWeight: 800, fontSize: "1.02rem", cursor: status === "submitting" ? "not-allowed" : "pointer", opacity: status === "submitting" ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif" }}>{status === "submitting" ? "Sending..." : "Send request"}</button>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", textAlign: "center", margin: "0.7rem 0 0" }}>Shared only with this teacher. Players never pay.</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
