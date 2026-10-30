import { prisma } from "@/lib/prisma";
import { sendEmailsOneByOne, emailLayout, escapeHtml } from "@/lib/email";
import { formatEventDate, formatEventTimeRange } from "@/lib/time";
import { icsAttachment, eventUrl } from "@/lib/calendar";

type Event = {
  id: string;
  title: string;
  description: string;
  dateTime: Date;
  endDateTime: Date | null;
  address: string;
};
type Person = { name: string; email: string };

/**
 * Emails everyone going an updated calendar invite ("REQUEST") after the
 * time, place, or title changes, or a cancellation ("CANCEL") when the event
 * is deleted. Pass attendees for a deleted event, since its RSVPs are gone.
 */
export async function notifyAttendees(
  event: Event,
  method: "REQUEST" | "CANCEL",
  attendees?: Person[]
) {
  const people =
    attendees ??
    (
      await prisma.rsvp.findMany({
        where: { eventId: event.id },
        select: { user: { select: { name: true, email: true } } },
      })
    ).map((r) => r.user);
  if (people.length === 0) return;

  const date = new Date(event.dateTime);
  const when = `${formatEventDate(date, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })}, ${formatEventTimeRange(date, event.endDateTime)}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`;

  const sent = await sendEmailsOneByOne(
    people.map((p) => ({
      to: p.email,
      subject:
        method === "CANCEL" ? `Cancelled: ${event.title}` : `Updated: ${event.title}`,
      html: emailLayout(
        method === "CANCEL"
          ? `
        <p>Hi ${escapeHtml(p.name.split(" ")[0])},</p>
        <p>Unfortunately, <strong>${escapeHtml(event.title)}</strong> on ${when} has been cancelled, and we've removed it from your calendar.</p>
        <p>We're sorry for the change. Keep an eye on <a href="${process.env.NEXTAUTH_URL ?? ""}/events">upcoming events</a>.</p>
        <p style="color:#6b7280;font-size:13px;">Questions? Just reply to this email.</p>`
          : `
        <p>Hi ${escapeHtml(p.name.split(" ")[0])},</p>
        <p>The details for <strong>${escapeHtml(event.title)}</strong> have changed. Here's the latest, and your calendar invite has been updated:</p>
        <ul style="padding-left:18px;">
          <li><strong>When:</strong> ${when}</li>
          <li><strong>Where:</strong> <a href="${mapsUrl}">${escapeHtml(event.address)}</a></li>
        </ul>
        <p style="margin: 20px 0;">
          <a href="${eventUrl(event.id)}" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Event details</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Can't make it anymore? Please <a href="${eventUrl(event.id)}">cancel your RSVP</a> so someone else can take your spot.</p>`
      ),
      attachments: [icsAttachment(event, method, p)],
    }))
  );
  console.log(`[event-updates] ${method} for ${event.id}: sent ${sent} of ${people.length}`);
}
