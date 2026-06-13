// Every event tells players who it is for. We have one optional free-text signal
// (beginner_friendly); when it is set we honor it, otherwise we fall back to a
// welcoming default by activity type (lessons are for beginners; open plays,
// leagues, tournaments, and getaways are open to all players unless stated).
export type AttendInfo = { label: string; color: string; bg: string };

const norm = (t?: string | null) => (t || "").toString().toLowerCase();

const WELCOME = { color: "#1a6e3a", bg: "rgba(46,201,92,0.14)" };
const EXPERIENCED = { color: "#8a5a00", bg: "rgba(245,200,66,0.20)" };

export function attendInfo(eventType?: string | null, beginnerFriendly?: string | null): AttendInfo {
  const bf = norm(beginnerFriendly);
  if (bf) {
    if (/(experienc|advanced|seasoned|intermediate only|intermediate\+)/.test(bf)) return { label: "For experienced players", ...EXPERIENCED };
    if (/(beginner|new player|all level|any level|everyone|all are welcome|all welcome|learn)/.test(bf)) return { label: "All levels welcome, beginners included", ...WELCOME };
  }
  const t = norm(eventType).replace(/[^a-z]/g, "");
  if (/(lesson|class|instruct|teacher|school|workshop)/.test(t)) return { label: "Beginners welcome", ...WELCOME };
  return { label: "All players welcome", ...WELCOME };
}
