"use client";

// "Add to Calendar" so players remember when their table is. Computes the next
// occurrence of the table's day + time in the user's own timezone and links to
// Google Calendar (sufficient for preview). Renders nothing if day/time unknown.
const DAY_IDX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};
const TIME_HOUR: Record<string, number> = { Morning: 10, Afternoon: 14, Evening: 18 };

function pad(n: number) { return String(n).padStart(2, "0"); }
function gfmt(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

export default function AddToCalendar({
  title, dayOfWeek, timeOfDay, place,
}: { title: string; dayOfWeek: string | null; timeOfDay: string | null; place?: string | null }) {
  if (!dayOfWeek || !(dayOfWeek in DAY_IDX)) return null;

  const now = new Date();
  const start = new Date(now);
  start.setHours(TIME_HOUR[timeOfDay || "Morning"] ?? 10, 0, 0, 0);
  let add = (DAY_IDX[dayOfWeek] - now.getDay() + 7) % 7;
  if (add === 0 && start <= now) add = 7;
  start.setDate(now.getDate() + add);
  const end = new Date(start.getTime() + 90 * 60 * 1000);

  const enc = encodeURIComponent;
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(title)}&dates=${gfmt(start)}/${gfmt(end)}&details=${enc("Your mahjong table from Find My Mahj Game")}${place ? `&location=${enc(place)}` : ""}`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", alignItems: "center", justifyContent: "center", minHeight: 60,
      borderRadius: 14, background: "white", color: "var(--navy)", border: "2px solid var(--navy)",
      fontSize: "1.2rem", fontWeight: 800, textDecoration: "none",
    }}>&nbsp; Add to Calendar</a>
  );
}
