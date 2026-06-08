import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ShareSheet from "@/components/share-sheet";
import SeatDots from "@/components/seat-dots";
import AddToCalendar from "@/components/add-to-calendar";
import { signGameToken } from "@/lib/game-token";
import ClaimClient from "./claim-client";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function TablePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { code } = await params;
  const { created } = await searchParams;

  const { data: t } = await supabase.from("tables").select("*").eq("share_code", code).single();
  if (!t) notFound();

  const { data: seats } = await supabase
    .from("table_seats")
    .select("name")
    .eq("table_id", t.id)
    .order("created_at", { ascending: true });

  const people = seats || [];
  const total = t.seats_total || 4;
  const filled = people.length;
  const remaining = Math.max(0, total - filled);
  const isFull = remaining === 0;

  const h = await headers();
  const host = h.get("host") || "findmymahjgame.com";
  const base = `${host.includes("localhost") ? "http" : "https"}://${host}`;
  const url = `${base}/t/${code}`;

  const title = `${t.day_of_week || ""} ${t.time_of_day || ""} Mahjong`.trim();
  const place = [t.venue_name, t.city].filter(Boolean).join(", ");
  const shareMsg = `Join my mahjong table: ${title}${t.city ? ` in ${t.city}` : ""}. ${isFull ? "We're full!" : `${filled} of ${total} players so far, ${remaining} seat${remaining === 1 ? "" : "s"} to go!`}`;

  const card: React.CSSProperties = { background: "white", border: "2px solid var(--border)", borderRadius: 18, padding: "1.6rem", marginBottom: "1.4rem" };

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem 1.2rem 4rem" }}>
      <a href="/" style={{ fontSize: "1.05rem", color: "var(--pink)", fontWeight: 700, textDecoration: "none" }}>&larr; Home</a>

      {created && (
        <div style={{ background: "rgba(46,201,92,0.12)", border: "2px solid #2ec95c", borderRadius: 16, padding: "1.4rem", margin: "1rem 0", textAlign: "center" }}>
          <div style={{ fontSize: "2rem" }}>🎉</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a9648", marginBottom: "0.8rem" }}>Your table is up!</div>
          <div style={{ display: "inline-block" }}><SeatDots filled={filled} total={total} you /></div>
          {!isFull && <p style={{ fontSize: "1.05rem", color: "var(--navy)", marginTop: "0.8rem" }}>Invite {remaining} more to fill it (buttons below).</p>}
          <p style={{ fontSize: "1rem", color: "var(--navy)", marginTop: "0.8rem", lineHeight: 1.5 }}>
            As the table starter, you&rsquo;re the coordinator. When it fills, we&rsquo;ll email everyone, and replies come to you, so the group can choose a safe public place.
          </p>
          <div style={{ maxWidth: 320, margin: "1rem auto 0" }}>
            <AddToCalendar title={title} dayOfWeek={t.day_of_week} timeOfDay={t.time_of_day} place={place} />
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--navy)", fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}>{title}</div>
        {place && <div style={{ fontSize: "1.2rem", color: "var(--muted)", marginTop: "0.4rem" }}>📍 {place}</div>}
        <div style={{ fontSize: "1.2rem", color: "var(--muted)", marginTop: "0.3rem", marginBottom: "1.2rem" }}>
          {t.skill === "beginner" ? "Beginners welcome" : t.skill === "experienced" ? "Experienced players" : "Anyone can join"}
        </div>
        <SeatDots filled={filled} total={total} />
        {remaining === 1 && <div style={{ marginTop: "0.7rem", fontSize: "1.15rem", fontWeight: 800, color: "var(--pink)" }}>🔥 Need a 4th! Just 1 seat left, share now to fill it.</div>}
        <div style={{ fontSize: "1.1rem", color: "var(--navy)", marginTop: "0.9rem" }}>
          Who is coming: {people.map((p) => p.name).join(", ") || "just the host so far"}
        </div>
      </div>

      <div style={{ ...card, background: isFull ? "rgba(46,201,92,0.1)" : "var(--bg)", borderColor: isFull ? "#2ec95c" : "var(--border)" }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.5rem" }}>
          {isFull ? "🎉 Now pick a place to meet" : "🛡️ Where you'll meet"}
        </div>
        <p style={{ fontSize: "1.1rem", color: "#1a6e3a", fontWeight: 700, lineHeight: 1.5, marginTop: 0 }}>
          For safety, we recommend new groups meet in public places for their first game.
        </p>
        <p style={{ fontSize: "1.05rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "0.6rem" }}>
          Good first-game spots{t.city ? ` in ${t.city}` : ""}: a public library, a community center, a café, or a senior center. Decide together once your table is full, no need to share home addresses.
        </p>
        <p style={{ fontSize: "0.95rem", color: "var(--navy)", fontWeight: 700, margin: 0 }}>
          We never share phone numbers or home addresses.
        </p>
      </div>

      {isFull && (
        <div style={card}>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.5rem" }}>Did you play?</div>
          <p style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: 0, marginBottom: "1rem" }}>After your game, tap one. It helps us know our tables become real games.</p>
          <div style={{ display: "flex", gap: "0.8rem" }}>
            <a href={`${base}/api/tables/played?token=${signGameToken(t.id, "yes")}`} style={{ flex: 1, textAlign: "center", minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "#1a6e3a", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Yes, we played</a>
            <a href={`${base}/api/tables/played?token=${signGameToken(t.id, "no")}`} style={{ flex: 1, textAlign: "center", minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "#6b7280", color: "white", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none" }}>Not yet</a>
          </div>
        </div>
      )}

      {!isFull && (
        <div style={card}>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.8rem" }}>Want a seat?</div>
          <ClaimClient
            shareCode={code}
            title={title}
            dayOfWeek={t.day_of_week}
            timeOfDay={t.time_of_day}
            place={place}
            filled={filled}
            total={total}
          />
        </div>
      )}

      <div style={card}>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.4rem" }}>
          {created ? "Invite players to fill it" : "Know someone who plays?"}
        </div>
        <p style={{ fontSize: "1.05rem", color: "var(--muted)", marginTop: 0, marginBottom: "1rem", lineHeight: 1.5 }}>
          Tap to share. The fastest way to fill a table is to invite your friends and your mahjong group.
        </p>
        <ShareSheet url={url} message={shareMsg} />
      </div>

      <p style={{ textAlign: "center", marginTop: "0.5rem" }}>
        <a href={`mailto:hello@findmymahjgame.com?subject=${encodeURIComponent(`Report a problem: table ${code}`)}`} style={{ color: "var(--muted)", fontSize: "0.95rem" }}>Report a problem with this table</a>
      </p>
    </main>
  );
}
