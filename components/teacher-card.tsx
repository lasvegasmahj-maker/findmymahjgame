// One shared teacher card used by /teachers and the state-page Teachers tab so
// they look identical. The instructor name shows on its own line (no "Taught by"
// prefix). The card is a plain container, not a wrapping link, so the Instagram
// handle and the website link can each be clickable.
import StatusBadge from "@/components/status-badge";
import LessonInquiry from "@/components/lesson-inquiry";
import { isPremiumActive } from "@/lib/premium";

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
  advisor?: boolean | null;
  account_id?: string | null;
  premium_until?: string | null;
};

// The founder's own business gets a clearly disclosed house treatment. The
// block carries the label "From our founder" on the card itself, sits before
// or beside the organic list, and is never mixed into ranked results. It must
// never replace or reorder the real list.
export function FounderSpotlight({ t }: { t: TeacherLike }) {
  return (
    <aside data-testid="founder-card" aria-label="From our founder" style={{ background: "linear-gradient(135deg, rgba(233,30,140,0.04), rgba(233,30,140,0.08))", border: "2px solid rgba(233,30,140,0.3)", borderRadius: 18, padding: "1.2rem 1.3rem", marginBottom: "1.6rem" }}>
      <p style={{ fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--pink-text)", margin: "0 0 0.3rem" }}>From our founder</p>
      <p style={{ fontSize: "0.95rem", color: "var(--muted)", lineHeight: 1.5, margin: "0 0 0.9rem" }}>The teacher behind Las Vegas Mahjong started Find My Mahj Game. We list it here as our own business, clearly marked. It never changes how other teachers appear or rank.</p>
      <div style={{ maxWidth: 380 }}><TeacherCard t={t} /></div>
    </aside>
  );
}

export default function TeacherCard({ t }: { t: TeacherLike }) {
  const ig = t.instagram ? String(t.instagram).replace(/^@/, "") : "";
  const site = t.website && /^https?:\/\//i.test(t.website) ? t.website : "";
  const desc = t.description ? String(t.description) : "";
  // Verified means an owner claimed this listing through the evidence-based claim
  // process; it is a trust state, never bought. Premium is the commercial
  // membership (paid or in the complimentary trial). They are independent.
  const verified = Boolean(t.account_id);
  const premium = isPremiumActive(t.premium_until);
  return (
    <div style={{ display: "flex", flexDirection: "column", background: "white", border: "2px solid var(--border)", borderRadius: 16, padding: "1.4rem", height: "100%" }}>
      {(t.advisor || t.charter || verified || premium) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.6rem" }}>
          {t.advisor && <StatusBadge type="advisor" />}
          {t.charter && <StatusBadge type="charter" />}
          {verified && <StatusBadge type="verified" />}
          {premium && <StatusBadge type="premium" />}
        </div>
      )}
      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>{t.business_name || "Teacher"}</div>
      {t.instructor && <div style={{ fontSize: "1rem", color: "var(--pink-text)", fontWeight: 700, marginTop: "0.2rem" }}>{t.instructor}</div>}
      {(t.city || t.state) && <div style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.3rem" }}>{[t.city, t.state].filter(Boolean).join(", ")}</div>}
      {t.display_email && <a href={`mailto:${t.display_email}`} style={{ display: "block", fontSize: "0.95rem", color: "var(--pink-text)", fontWeight: 600, marginTop: "0.4rem", textDecoration: "none" }}>{t.display_email}</a>}
      {ig && <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: "0.95rem", color: "var(--pink-text)", fontWeight: 600, marginTop: "0.4rem", textDecoration: "none" }}>@{ig}</a>}
      {desc && <div style={{ fontSize: "1rem", color: "var(--muted)", marginTop: "0.5rem", lineHeight: 1.5 }}>{desc.slice(0, 280)}{desc.length > 280 ? "..." : ""}</div>}
      {(premium || site) && (
        <div style={{ marginTop: "auto", paddingTop: "0.9rem", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.7rem" }}>
          {premium && <LessonInquiry teacherId={t.id} teacherName={t.business_name || "this teacher"} />}
          {site && <a href={site} target="_blank" rel="noopener noreferrer" style={{ color: "var(--pink-text)", fontWeight: 800, textDecoration: "none" }}>Visit Website &rarr;</a>}
        </div>
      )}
    </div>
  );
}
