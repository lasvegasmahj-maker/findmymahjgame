// One shared teacher card used by /teachers and the state-page Teachers tab so
// they look identical. The instructor name shows on its own line (no "Taught by"
// prefix). The card is a plain container, not a wrapping link, so the Instagram
// handle and the website link can each be clickable.
import StatusBadge from "@/components/status-badge";
import LessonInquiry from "@/components/lesson-inquiry";

type TeacherLike = {
  id: string;
  business_name: string | null;
  city: string | null;
  state: string | null;
  description?: string | null;
  website?: string | null;
  instagram?: string | null;
  display_email?: string | null;
  instructor?: string | null;
  tier?: string | null;
  charter?: boolean | null;
};

export default function TeacherCard({ t }: { t: TeacherLike }) {
  const ig = t.instagram ? String(t.instagram).replace(/^@/, "") : "";
  const site = t.website && /^https?:\/\//i.test(t.website) ? t.website : "";
  const desc = t.description ? String(t.description) : "";
  return (
    <div style={{ display: "flex", flexDirection: "column", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem", height: "100%" }}>
      {(t.charter || t.tier === "pro") && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.6rem" }}>
          {t.charter && <StatusBadge type="charter" />}
          {t.tier === "pro" && <StatusBadge type="verified" />}
        </div>
      )}
      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{t.business_name || "Teacher"}</div>
      {t.instructor && <div style={{ fontSize: "1rem", color: "var(--pink-text)", fontWeight: 700, marginTop: "0.2rem" }}>{t.instructor}</div>}
      {(t.city || t.state) && <div style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.3rem" }}>{[t.city, t.state].filter(Boolean).join(", ")}</div>}
      {t.display_email && <a href={`mailto:${t.display_email}`} style={{ display: "block", fontSize: "0.95rem", color: "var(--pink-text)", fontWeight: 600, marginTop: "0.4rem", textDecoration: "none" }}>{t.display_email}</a>}
      {ig && <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: "0.95rem", color: "var(--pink-text)", fontWeight: 600, marginTop: "0.4rem", textDecoration: "none" }}>@{ig}</a>}
      {desc && <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.5rem", lineHeight: 1.5 }}>{desc.slice(0, 280)}{desc.length > 280 ? "..." : ""}</div>}
      {(t.tier === "pro" || site) && (
        <div style={{ marginTop: "auto", paddingTop: "0.9rem", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.7rem" }}>
          {t.tier === "pro" && <LessonInquiry teacherId={t.id} teacherName={t.business_name || "this teacher"} />}
          {site && <a href={site} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-text)", fontWeight: 800, textDecoration: "none" }}>Visit Website &rarr;</a>}
        </div>
      )}
    </div>
  );
}
