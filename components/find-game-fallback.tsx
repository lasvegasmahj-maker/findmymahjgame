import Link from "next/link";
import NotifyMe from "@/components/notify-me";

// Shared empty-handed fallback. When a player finds no game, give them the two
// real next actions with equal weight: start their own table, or get notified
// when one opens nearby. Used on the state page tabs and other discovery dead ends.
export default function FindGameFallback({
  city = "",
  state = "",
  startLabel = "Start a table",
  tablesOpen = true,
}: {
  city?: string;
  state?: string;
  startLabel?: string;
  tablesOpen?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 460, margin: "1.5rem auto 0" }}>
      {tablesOpen ? (
        <Link href="/start" style={{ minHeight: 54, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "var(--navy)", color: "white", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none" }}>{startLabel} &rarr;</Link>
      ) : (
        <p style={{ margin: 0, textAlign: "center", color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.5 }}>Starting a table is not open yet.</p>
      )}
      <NotifyMe defaultCity={city} defaultState={state} heading={tablesOpen ? "Or get notified when a game opens near you" : "Get notified when a game opens near you"} />
    </div>
  );
}
