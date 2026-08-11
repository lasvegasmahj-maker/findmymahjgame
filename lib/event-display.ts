export type WhenFields = {
  event_date?: string | null;
  day_time?: string | null;
  day_of_week?: string[] | null;
  time_of_day?: string | null;
};

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// day_of_week is a text[] of lowercase day names. Reading it as a plain string prints
// "monday,thursday" to a player, so the join is deliberate.
export function structuredWhen(days?: string[] | null, tod?: string | null): string {
  const named = (days || []).filter(Boolean).map((d) => `${titleCase(d)}s`);
  const when =
    named.length === 0
      ? ""
      : named.length === 1
        ? named[0]
        : `${named.slice(0, -1).join(", ")} and ${named[named.length - 1]}`;
  return [when, tod || ""].filter(Boolean).join(", ");
}

// One definition for every surface that prints when a game happens. day_time is the human
// written string and wins when present; the structured columns are the fallback, which is
// what most rows now carry after the schedule backfill.
export function whenLabel(e: WhenFields): string {
  if (e.day_time && !e.event_date) return e.day_time;
  if (e.day_time && e.event_date && new Date(e.event_date).getTime() < Date.now()) return e.day_time;
  if (e.event_date) {
    const d = new Date(e.event_date);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });
    }
  }
  return e.day_time || structuredWhen(e.day_of_week, e.time_of_day);
}
