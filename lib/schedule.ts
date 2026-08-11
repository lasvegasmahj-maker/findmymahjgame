export const DAY_NAMES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayName = (typeof DAY_NAMES)[number];
export type TimeOfDay = "morning" | "afternoon" | "evening";
export type ScheduleConfidence = "high" | "medium" | "low";
export type Frequency = "once" | "weekly" | "biweekly" | "monthly" | "multi_day";

export type ParsedSchedule = {
  days: DayName[];
  startTime: string | null;
  endTime: string | null;
  timeOfDay: TimeOfDay | null;
  periods: TimeOfDay[];
  isRecurring: boolean;
  frequency: Frequency | null;
  confidence: ScheduleConfidence;
  evidence: string[];
  ambiguities: string[];
};

// Sun, Sat, Wed, Mon and Fri are also ordinary English words, so scanning prose for bare
// abbreviations invents games that do not exist ("Sun, sand, and tiles" is not a Sunday game).
// Prose is matched on full names only. The day_time column is human written schedule text,
// so abbreviations are safe to accept there.
const STRICT_DAY_PATTERNS: Array<[DayName, RegExp]> = [
  ["monday", /\bmondays?\b/gi],
  ["tuesday", /\btues(?:day)?s?\b/gi],
  ["wednesday", /\bwed(?:nes)?days?\b/gi],
  ["thursday", /\bthurs(?:day)?s?\b/gi],
  ["friday", /\bfridays?\b/gi],
  ["saturday", /\bsaturdays?\b/gi],
  ["sunday", /\bsundays?\b/gi],
];

const LOOSE_DAY_PATTERNS: Array<[DayName, RegExp]> = [
  ["monday", /\bmon\.?s?\b|\bmondays?\b/gi],
  ["tuesday", /\btues?\.?s?\b|\btuesdays?\b/gi],
  ["wednesday", /\bweds?\.?\b|\bwed(?:nes)?days?\b/gi],
  ["thursday", /\bthur?s?\.?\b|\bthursdays?\b/gi],
  ["friday", /\bfri\.?s?\b|\bfridays?\b/gi],
  ["saturday", /\bsat\.?s?\b|\bsaturdays?\b/gi],
  ["sunday", /\bsun\.?s?\b|\bsundays?\b/gi],
];

const TIME_RE = /\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s?m\.?\b/gi;
const RANGE_RE =
  /\b(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?\s?m?\.?\s*(?:-|to|until|till|through)\s*(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s?m\.?\b/i;

const WEEKLY_RE = /\b(every|each|weekly|recurring|ongoing|drop[- ]?in|standing)\b/i;
const BIWEEKLY_RE = /\b(bi[- ]?weekly|every other|alternate)\b/i;
// Ordinals appear as words and as numerals. Missing the numeral form turns "1st and 3rd
// Wednesday" into a claim that there is a game every Wednesday, which is a fabricated fact.
const MONTHLY_RE =
  /\b(monthly|first|second|third|fourth|last|1st|2nd|3rd|4th|5th)\s*(?:(?:and|&|,|\/)\s*(?:first|second|third|fourth|last|1st|2nd|3rd|4th|5th)\s*)*(mon|tues?|wed|thur?s?|fri|sat|sun)/i;

// A season with an end date is not an open ended weekly game. Without this, a finished six
// week league keeps advertising itself as a standing Monday night game.
const SEASON_RE =
  /\b(\d{1,2}[- ]week|season|through\s+\w+\s+\d{1,2}|\w+\s+\d{1,2},?\s*\d{4}\s*(?:-|to|through|until)\s*\w+\s+\d{1,2},?\s*\d{4})/i;
const MULTIDAY_RE = /\b(\d+[- ]day|weekend|multi[- ]day|three[- ]day|two[- ]day)\b/i;
const APPOINTMENT_RE = /\b(by appointment|by request|contact for|varies|schedule varies|tbd|tba)\b/i;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function to24h(hour: number, minute: number, meridiem: string): string | null {
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  let h = hour % 12;
  if (meridiem.toLowerCase() === "p") h += 12;
  return `${pad(h)}:${pad(minute)}`;
}

export function timeOfDayFor(start: string | null): TimeOfDay | null {
  if (!start) return null;
  const hour = Number(start.slice(0, 2));
  if (!Number.isFinite(hour)) return null;
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function findDays(text: string, loose = false): DayName[] {
  const found = new Set<DayName>();
  for (const [day, re] of loose ? LOOSE_DAY_PATTERNS : STRICT_DAY_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(text)) found.add(day);
  }
  return DAY_NAMES.filter((d) => found.has(d));
}

// A tournament running 9am to 5pm is genuinely available in the morning and the afternoon.
// Search filters on this list so "Thursday afternoon" matches it, while a single start time
// still resolves to exactly one period.
export function periodsCovered(
  start: string | null,
  end: string | null
): TimeOfDay[] {
  const first = timeOfDayFor(start);
  if (!first) return [];
  if (!end) return [first];
  const startHour = Number(start!.slice(0, 2));
  const endHour = Number(end.slice(0, 2));
  if (!Number.isFinite(endHour) || endHour <= startHour) return [first];
  const out: TimeOfDay[] = [];
  if (startHour < 12) out.push("morning");
  if (startHour < 17 && endHour > 12) out.push("afternoon");
  if (endHour > 17) out.push("evening");
  return out.length > 0 ? out : [first];
}

function findTimes(text: string): string[] {
  const out: string[] = [];
  TIME_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TIME_RE.exec(text)) !== null) {
    const t = to24h(Number(m[1]), m[2] ? Number(m[2]) : 0, m[3]);
    if (t) out.push(t);
  }
  return out;
}

function findRange(text: string): { start: string; end: string } | null {
  const m = RANGE_RE.exec(text);
  if (!m) return null;
  const endMeridiem = m[6];
  const startMeridiem = m[3] || endMeridiem;
  const start = to24h(Number(m[1]), m[2] ? Number(m[2]) : 0, startMeridiem);
  const end = to24h(Number(m[4]), m[5] ? Number(m[5]) : 0, endMeridiem);
  if (!start || !end) return null;
  return { start, end };
}

function explicitPeriod(text: string): TimeOfDay | null {
  if (/\b(morning|a\.?m\.? session|breakfast)\b/i.test(text)) return "morning";
  if (/\b(afternoon|midday|lunch)\b/i.test(text)) return "afternoon";
  if (/\b(evening|night|nights|after work)\b/i.test(text)) return "evening";
  return null;
}

export type ScheduleInput = {
  dayTime?: string | null;
  frequency?: string | null;
  description?: string | null;
  eventName?: string | null;
  eventDate?: string | null;
};

// Deterministic only. The day_time column is trusted first because a human wrote it as a
// schedule; description is prose that may mention unrelated dates; the event name is used
// solely to corroborate a day already found elsewhere, never as the only source.
export function parseSchedule(input: ScheduleInput): ParsedSchedule {
  const evidence: string[] = [];
  const ambiguities: string[] = [];

  const dayTime = (input.dayTime || "").trim();
  const description = (input.description || "").trim();
  const eventName = (input.eventName || "").trim();

  const primary = dayTime || description;
  const primaryLabel = dayTime ? "day_time" : "description";
  const primaryIsSchedule = Boolean(dayTime);
  const combined = `${dayTime} ${description}`.trim();

  if (!primary && !eventName) {
    return {
      days: [],
      startTime: null,
      endTime: null,
      timeOfDay: null,
      periods: [],
      isRecurring: false,
      frequency: null,
      confidence: "low",
      evidence: [],
      ambiguities: ["no schedule text available"],
    };
  }

  let days = findDays(primary, primaryIsSchedule);
  if (days.length > 0) {
    evidence.push(`days from ${primaryLabel}: ${days.join(", ")}`);
  } else {
    const nameDays = findDays(eventName);
    if (nameDays.length > 0) {
      days = nameDays;
      evidence.push(`days from event name only: ${nameDays.join(", ")}`);
      ambiguities.push("day derived from the title rather than a schedule field");
    }
  }

  const range = findRange(primary);
  let startTime: string | null = null;
  let endTime: string | null = null;

  if (range) {
    startTime = range.start;
    endTime = range.end;
    evidence.push(`time range from ${primaryLabel}: ${range.start} to ${range.end}`);
  } else {
    const times = findTimes(primary);
    if (times.length === 1) {
      startTime = times[0];
      evidence.push(`start time from ${primaryLabel}: ${times[0]}`);
    } else if (times.length > 1) {
      const unique = Array.from(new Set(times));
      startTime = unique[0];
      if (unique.length > 1) {
        ambiguities.push(`several times mentioned (${unique.join(", ")}), used the first`);
      }
      evidence.push(`start time from ${primaryLabel}: ${unique[0]}`);
    }
  }

  const period = explicitPeriod(combined);
  const derived = timeOfDayFor(startTime);
  let timeOfDay: TimeOfDay | null = derived ?? period;

  if (period && derived && period !== derived) {
    ambiguities.push(`text says ${period} but the clock time reads ${derived}`);
    timeOfDay = derived;
  }

  let frequency: Frequency | null = null;
  if (MULTIDAY_RE.test(combined)) frequency = "multi_day";
  else if (MONTHLY_RE.test(combined)) frequency = "monthly";
  else if (BIWEEKLY_RE.test(combined)) frequency = "biweekly";
  else if (WEEKLY_RE.test(combined) || days.length > 0) frequency = "weekly";

  const declared = (input.frequency || "").trim().toLowerCase();
  if (declared && ["once", "weekly", "biweekly", "monthly", "multi_day"].includes(declared)) {
    if (frequency && declared !== frequency) {
      ambiguities.push(`stored frequency is ${declared} but the text reads ${frequency}`);
    }
    frequency = declared as Frequency;
    evidence.push(`frequency from the frequency column: ${declared}`);
  }

  const isRecurring =
    frequency === "weekly" || frequency === "biweekly" || frequency === "monthly";

  if (MONTHLY_RE.test(combined)) {
    ambiguities.push("month relative recurrence (for example first Monday) is not modelled yet");
  }
  if (SEASON_RE.test(combined)) {
    ambiguities.push("text describes a bounded season or run, so this may have already ended");
  }
  if (APPOINTMENT_RE.test(combined)) {
    ambiguities.push("text suggests the schedule varies or is by appointment");
  }
  if (days.length > 3) {
    ambiguities.push(`${days.length} days matched, which often means prose mentioned dates in passing`);
  }

  let confidence: ScheduleConfidence;
  const dayFromSchedule =
    days.length > 0 && findDays(primary, primaryIsSchedule).length > 0;
  if (dayFromSchedule && startTime && ambiguities.length === 0) {
    confidence = "high";
  } else if ((dayFromSchedule || startTime) && ambiguities.length <= 1) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    days,
    startTime,
    endTime,
    timeOfDay,
    periods: periodsCovered(startTime, endTime),
    isRecurring,
    frequency,
    confidence,
    evidence,
    ambiguities,
  };
}

// A one time event that has already happened should stop appearing as upcoming. A recurring
// game whose stored event_date is an old single instance should keep appearing, because the
// game itself still runs. Both cases look identical without this distinction.
export function isUpcoming(
  row: {
    event_date?: string | null;
    is_recurring?: boolean | null;
    day_of_week?: string[] | null;
    day_time?: string | null;
    frequency?: string | null;
    event_type?: string | null;
    event_name?: string | null;
    description?: string | null;
  },
  now: Date = new Date()
): boolean {
  let recurring =
    row.is_recurring === true ||
    (Array.isArray(row.day_of_week) && row.day_of_week.length > 0) ||
    Boolean(row.day_time) ||
    ["weekly", "biweekly", "monthly"].includes((row.frequency || "").toLowerCase());

  // Most rows still carry their recurrence only in prose. Reading it here keeps a real
  // weekly game visible even though its stored date is an old single instance, which is
  // the difference between hiding stale data and hiding live inventory.
  if (!recurring && (row.description || row.event_name)) {
    const parsed = parseSchedule({
      description: row.description,
      eventName: row.event_name,
      frequency: row.frequency,
    });
    recurring = parsed.isRecurring && parsed.days.length > 0;
  }

  if (recurring) return true;
  if (!row.event_date) return false;

  const when = new Date(row.event_date);
  if (Number.isNaN(when.getTime())) return false;

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return when >= startOfToday;
}
