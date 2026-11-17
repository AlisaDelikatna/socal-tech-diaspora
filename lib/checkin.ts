// Members check in by scanning the QR code on the event slideshow. Check-in
// opens a little before the start and closes a few hours after the end, so
// the link can't be used to mark attendance from home on another day.
const OPENS_BEFORE_MS = 2 * 60 * 60 * 1000;
const CLOSES_AFTER_MS = 3 * 60 * 60 * 1000;
// Events without an end time are treated as two hours long.
const DEFAULT_LENGTH_MS = 2 * 60 * 60 * 1000;

export type CheckInWindow = "early" | "open" | "closed";

export function checkInWindow(
  event: { dateTime: Date; endDateTime: Date | null },
  now = new Date()
): CheckInWindow {
  const start = event.dateTime.getTime();
  const end = event.endDateTime?.getTime() ?? start + DEFAULT_LENGTH_MS;
  if (now.getTime() < start - OPENS_BEFORE_MS) return "early";
  if (now.getTime() > end + CLOSES_AFTER_MS) return "closed";
  return "open";
}

export function checkInPath(eventId: string): string {
  return `/events/${eventId}/checkin`;
}
