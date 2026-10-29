import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendBulkEmail, emailLayout, escapeHtml, textToHtml } from "@/lib/email";
import { formatEventDate, formatEventTimeRange } from "@/lib/time";

// POST { userIds, note? } — email a reminder to members who RSVP'd to an event
// (admin only). Includes the full address. Replies go to REPLY_TO (lib/email.ts).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { note, userIds } = (await req.json().catch(() => ({}))) as {
    note?: string;
    userIds?: string[];
  };
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "Choose at least one attendee" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (event.dateTime < new Date()) {
    return NextResponse.json({ error: "This event has already happened" }, { status: 409 });
  }

  // Only people actually going get the reminder (and the full address).
  const attendees = await prisma.rsvp.findMany({
    where: { eventId: id, userId: { in: userIds } },
    select: { user: { select: { name: true, email: true } } },
  });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const date = new Date(event.dateTime);
  const when = `${formatEventDate(date, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })}, ${formatEventTimeRange(date, event.endDateTime)}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`;

  const { sent, error } = await sendBulkEmail(
    attendees.map(({ user }) => ({
      to: user.email,
      subject: `Reminder: ${event.title}, ${formatEventDate(date, { weekday: "long", month: "short", day: "numeric" })}`,
      html: emailLayout(`
        <p>Hi ${escapeHtml(user.name.split(" ")[0])},</p>
        ${note?.trim() ? textToHtml(note) : `<p>A quick reminder that you're going to <strong>${escapeHtml(event.title)}</strong>. We're looking forward to seeing you.</p>`}
        <ul style="padding-left:18px;">
          <li><strong>When:</strong> ${when}</li>
          <li><strong>Where:</strong> <a href="${mapsUrl}">${escapeHtml(event.address)}</a></li>
        </ul>
        <p style="margin: 20px 0;">
          <a href="${base}/events/${event.id}" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Event details</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Can't make it anymore? Please <a href="${base}/events/${event.id}">cancel your RSVP</a> so someone else can take your spot.</p>
      `),
    }))
  );

  if (sent === 0) {
    return NextResponse.json(
      { error: `No emails could be sent. Resend said: ${error ?? "unknown error"}` },
      { status: 502 }
    );
  }

  await prisma.event.update({
    where: { id },
    data: { reminderSentAt: new Date() },
  });

  return NextResponse.json({ ok: true, sent, total: attendees.length });
}
