// One shared teacher card used by /teachers and the state-page Teachers tab so
// they look identical. The instructor name shows on its own line (no "Taught by"
// prefix). The card is a plain container, not a wrapping link, so the Instagram
// handle and the website link can each be clickable.
type TeacherLike = {
  id: string;
  business_name: string | null;
  city: string | null;
  state: string | null;
  description?: string | null;
  website?: string | null;
  instagram?: string | null;
  logo_url?: string | null;
  instructor?: string | null;
};

export default function TeacherCard({ t }: { t: TeacherLike }) {
  const ig = t.instagram ? String(t.instagram).replace(/^@/, "") : "";
  const site = t.website && /^https?:\/\//i.test(t.website) ? t.website : "";
  const desc = t.description ? String(t.description) : "";
  return (
    <div style={{ display: "flex", flexDirection: "column", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem", height: "100%" }}>
      {t.logo_url && (
        <img src={t.logo_url} alt={t.business_name || "Teacher"} loading="lazy" style={{ width: "100%", height: 150, objectFit: "contain", background: "var(--bg)", borderRadius: 10, marginBottom: "0.9rem", border: "1px solid var(--border)" }} />
      )}
      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{t.business_name || "Teacher"}</div>
      {t.instructor && <div style={{ fontSize: "1rem", color: "var(--pink-text)", fontWeight: 700, marginTop: "0.2rem" }}>{t.instructor}</div>}
      {(t.city || t.state) && <div style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.3rem" }}>{[t.city, t.state].filter(Boolean).join(", ")}</div>}
      {ig && <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.95rem", color: "var(--pink-text)", fontWeight: 600, marginTop: "0.4rem", textDecoration: "none" }}>@{ig}</a>}
      {desc && <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.5rem", lineHeight: 1.5 }}>{desc.slice(0, 120)}{desc.length > 120 ? "..." : ""}</div>}
      {site && (
        <div style={{ marginTop: "auto", paddingTop: "0.9rem" }}>
          <a href={site} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-text)", fontWeight: 800, textDecoration: "none" }}>Visit Website &rarr;</a>
        </div>
      )}
    </div>
  );
}
