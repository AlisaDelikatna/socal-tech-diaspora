// All events happen in Southern California, so event times are entered and
// displayed in Pacific time regardless of where the code runs (the server is
// UTC, visitors may be anywhere).
export const EVENT_TIME_ZONE = "America/Los_Angeles";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function wallClockParts(date: Date) {
  const parts = partsFormatter.formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

// Minutes the event time zone is ahead of UTC at the given instant (-420 for PDT).
function offsetMinutes(date: Date) {
  const p = wallClockParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return (asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000;
}

// Parse a datetime-local value ("2026-10-15T17:00") as Pacific time.
// Values that already carry a zone ("...Z", "...-07:00") are taken as-is.
export function parseEventInput(value: string): Date {
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(value)) return new Date(value);
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return new Date(NaN);
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Second pass settles the offset around DST switches.
  let utc = wall - offsetMinutes(new Date(wall)) * 60000;
  utc = wall - offsetMinutes(new Date(utc)) * 60000;
  return new Date(utc);
}

// Format a stored instant as the datetime-local value, in Pacific time.
export function toEventInput(value: Date | string): string {
  const p = wallClockParts(new Date(value));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatEventDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Date(value).toLocaleString("en-US", {
    ...options,
    timeZone: EVENT_TIME_ZONE,
  });
}
