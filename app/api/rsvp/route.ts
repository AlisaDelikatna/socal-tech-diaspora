import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout, escapeHtml } from "@/lib/email";
import { formatEventDate, formatEventTimeRange } from "@/lib/time";
import { googleCalendarUrl, icsAttachment, icsDownloadUrl, eventUrl } from "@/lib/calendar";

// POST { eventId } — RSVP to an event. DELETE { eventId } — cancel RSVP.
// Both email the member a calendar invite / cancellation for the event.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = (await req.json().catch(() => ({}))) as {
    eventId?: string;
  };
  if (!eventId) {
    return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const userId = session.user.id;
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.rsvp.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) return "already";
    if (event.capacity != null) {
      const count = await tx.rsvp.count({ where: { eventId } });
      if (count >= event.capacity) return "full";
    }
    await tx.rsvp.create({ data: { eventId, userId } });
    return "created";
  });

  if (result === "full") {
    return NextResponse.json({ error: "This event is full" }, { status: 409 });
  }
  if (result === "already") {
    return NextResponse.json({ ok: true, going: true });
  }

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (me) {
    const date = new Date(event.dateTime);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`;
    await sendEmail({
      to: me.email,
      subject: `You're going: ${event.title}`,
      html: emailLayout(`
        <p>Hi ${escapeHtml(me.name.split(" ")[0])},</p>
        <p>You're confirmed for <strong>${escapeHtml(event.title)}</strong>.</p>
        <ul style="padding-left:18px;">
          <li><strong>When:</strong> ${formatEventDate(date, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}, ${formatEventTimeRange(date, event.endDateTime)}</li>
          <li><strong>Where:</strong> <a href="${mapsUrl}">${escapeHtml(event.address)}</a></li>
        </ul>
        <p>The calendar invite is attached. If it didn't land in your calendar, add it here:
          <a href="${escapeHtml(googleCalendarUrl(event))}">Google Calendar</a> ·
          <a href="${icsDownloadUrl(event.id)}">Apple / Outlook</a></p>
        <p style="margin: 20px 0;">
          <a href="${eventUrl(event.id)}" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Event details</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Can't make it? Please <a href="${eventUrl(event.id)}">cancel your RSVP</a> so someone else can take your spot.</p>
      `),
      attachments: [icsAttachment(event, "REQUEST", me)],
    });
  }

  return NextResponse.json({ ok: true, going: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = (await req.json().catch(() => ({}))) as {
    eventId?: string;
  };
  if (!eventId) {
    return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  }

  const removed = await prisma.rsvp
    .delete({
      where: { eventId_userId: { eventId, userId: session.user.id } },
      include: { event: true, user: { select: { name: true, email: true } } },
    })
    .catch(() => null); // ignore if not RSVP'd

  // Take the event off their calendar.
  if (removed && removed.event.dateTime > new Date()) {
    const { event, user } = removed;
    await sendEmail({
      to: user.email,
      subject: `RSVP cancelled: ${event.title}`,
      html: emailLayout(`
        <p>Hi ${escapeHtml(user.name.split(" ")[0])},</p>
        <p>You're no longer going to <strong>${escapeHtml(event.title)}</strong>, and we've removed it from your calendar. Thanks for letting us know.</p>
        <p>Changed your mind? <a href="${eventUrl(event.id)}">RSVP again</a> while spots are open.</p>
      `),
      attachments: [icsAttachment(event, "CANCEL", user)],
    });
  }

  return NextResponse.json({ ok: true, going: false });
}
