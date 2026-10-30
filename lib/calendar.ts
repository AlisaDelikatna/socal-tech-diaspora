import { REPLY_TO } from "@/lib/email-config";

// Calendar invites (.ics, RFC 5545) and "Add to Google Calendar" links.
// Every invite for an event shares one UID, so calendars update or remove
// the same entry when we send a change or a cancellation.

type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  dateTime: Date;
  endDateTime: Date | null;
  address: string;
};

// Events without an end time are shown as two hours long.
const DEFAULT_LENGTH_MS = 2 * 60 * 60 * 1000;

function endOf(event: CalendarEvent): Date {
  return event.endDateTime ?? new Date(event.dateTime.getTime() + DEFAULT_LENGTH_MS);
}

function baseUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function eventUrl(eventId: string): string {
  return `${baseUrl()}/events/${eventId}`;
}

// 2026-11-20T02:00:00.000Z -> 20261120T020000Z
function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Lines longer than 75 bytes are folded onto continuation lines.
function fold(line: string): string {
  const bytes = new TextEncoder();
  if (bytes.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    if (bytes.encode(current + ch).length > (out.length ? 74 : 75)) {
      out.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.join("\r\n ");
}

/**
 * An .ics file for one event.
 * - "REQUEST" is an invite to one attendee (already going, so no RSVP asked).
 *   Gmail and Outlook add these to the calendar; sending it again with the
 *   same UID updates the entry.
 * - "CANCEL" removes the entry from that attendee's calendar.
 * - "PUBLISH" is a plain download for "Add to Apple / Outlook calendar".
 */
export function buildIcs(
  event: CalendarEvent,
  method: "REQUEST" | "CANCEL" | "PUBLISH",
  attendee?: { name: string; email: string }
): string {
  const url = eventUrl(event.id);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kolo Founders Circle//Events//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:event-${event.id}@kolofounders.com`,
    // Seconds since 1970 only ever grow, so each message supersedes the last.
    `SEQUENCE:${Math.floor(Date.now() / 1000)}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(event.dateTime)}`,
    `DTEND:${icsDate(endOf(event))}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(`${event.description}\n\nEvent page: ${url}`)}`,
    `LOCATION:${escapeText(event.address)}`,
    `URL:${url}`,
    `STATUS:${method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`,
    `ORGANIZER;CN=Kolo Founders Circle:mailto:${REPLY_TO}`,
    ...(attendee
      ? [
          // Parameter values are quoted, and can't contain quotes themselves.
          `ATTENDEE;CN="${attendee.name.replace(/"/g, "")}";ROLE=REQ-PARTICIPANT;PARTSTAT=${
            method === "CANCEL" ? "DECLINED" : "ACCEPTED"
          };RSVP=FALSE:mailto:${attendee.email}`,
        ]
      : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Email attachment carrying an invite or cancellation for one attendee. */
export function icsAttachment(
  event: CalendarEvent,
  method: "REQUEST" | "CANCEL",
  attendee: { name: string; email: string }
) {
  return {
    filename: method === "CANCEL" ? "cancel.ics" : "invite.ics",
    content: Buffer.from(buildIcs(event, method, attendee)).toString("base64"),
    contentType: `text/calendar; charset=utf-8; method=${method}`,
  };
}

/** Prefilled "Add to Google Calendar" link. */
export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${icsDate(event.dateTime)}/${icsDate(endOf(event))}`,
    details: `${event.description}\n\nEvent page: ${eventUrl(event.id)}`,
    location: event.address,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Download link for Apple Calendar / Outlook (members who RSVP'd only). */
export function icsDownloadUrl(eventId: string): string {
  return `${baseUrl()}/api/events/${eventId}/calendar`;
}
