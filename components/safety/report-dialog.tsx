"use client";

import { useState } from "react";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "harassment", label: "Harassment or unwanted contact" },
  { value: "unsafe", label: "I feel unsafe" },
  { value: "false_identity", label: "This doesn't seem like a real person" },
  { value: "spam_scam", label: "Spam or a scam" },
  { value: "other", label: "Something else" },
];

const MAX_DETAIL = 2000;

// Reusable report entry point. Drop it anywhere a player, table, or listing
// needs a way to flag a problem; pass exactly one subject shape (a user id, or a
// table + id) or none for a general report.
export default function ReportDialog({
  subjectUserId,
  subjectTable,
  subjectId,
  triggerLabel = "Report",
}: {
  subjectUserId?: string;
  subjectTable?: string;
  subjectId?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    setStatus("idle");
    setCategory("");
    setDetail("");
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) {
      setError("Choose what this report is about.");
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/safety/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, detail, subject_user_id: subjectUserId, subject_table: subjectTable, subject_id: subjectId }),
      });
      if (res.ok) {
        setStatus("sent");
        return;
      }
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Something went wrong. Please try again.");
      setStatus("error");
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
      setStatus("error");
    }
  }

  const field: React.CSSProperties = { width: "100%", padding: "0.6rem 0.8rem", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "16px", color: "var(--navy)", background: "white", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--navy)", margin: "0.7rem 0 0.25rem" };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline", fontFamily: "'DM Sans', sans-serif", padding: 0 }}
      >
        {triggerLabel}
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Report a problem" onClick={close} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(26,31,94,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 16, padding: "1.6rem", width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(26,31,94,0.3)" }}>
            {status === "sent" ? (
              <div style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.5rem" }}>Report received</div>
                <p style={{ fontSize: "1.02rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.4rem" }}>A person reviews serious reports.</p>
                <button type="button" onClick={close} style={{ minHeight: 48, padding: "0 1.6rem", borderRadius: 12, background: "var(--navy)", color: "white", border: "none", fontWeight: 800, fontSize: "1rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Done</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.2rem" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", margin: 0, lineHeight: 1.3 }}>Report a problem</h3>
                  <button type="button" aria-label="Close" onClick={close} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "var(--muted)", cursor: "pointer", lineHeight: 1, padding: 0 }}>&times;</button>
                </div>

                <label style={lbl}>What&rsquo;s going on?</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      style={{
                        textAlign: "left",
                        padding: "0.6rem 0.8rem",
                        borderRadius: 8,
                        border: `1.5px solid ${category === c.value ? "var(--pink)" : "var(--border)"}`,
                        background: category === c.value ? "rgba(233,30,140,0.08)" : "white",
                        color: "var(--navy)",
                        fontWeight: category === c.value ? 700 : 500,
                        fontSize: "0.92rem",
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <label style={lbl}>Details <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span></label>
                <textarea
                  style={{ ...field, minHeight: 90, resize: "vertical" }}
                  value={detail}
                  maxLength={MAX_DETAIL}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Tell us what happened, if you're comfortable sharing."
                />

                <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0.7rem 0 0" }}>A person reviews serious reports.</p>
                {error && <p style={{ color: "#b91c1c", fontSize: "0.88rem", margin: "0.5rem 0 0" }}>{error}</p>}
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  style={{ width: "100%", marginTop: "1rem", minHeight: 50, borderRadius: 12, background: "var(--pink)", color: "white", border: "none", fontWeight: 800, fontSize: "1.02rem", cursor: status === "submitting" ? "not-allowed" : "pointer", opacity: status === "submitting" ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif" }}
                >
                  {status === "submitting" ? "Sending..." : "Submit report"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
