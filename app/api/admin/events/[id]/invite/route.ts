import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendBulkEmail, emailLayout, escapeHtml, textToHtml } from "@/lib/email";
import { formatEventDate, formatEventTimeRange } from "@/lib/time";

// POST { userIds, note? } — email the chosen approved members an invitation
// to an event (admin only). Replies go to REPLY_TO (lib/email.ts).
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
    return NextResponse.json({ error: "Choose at least one member" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { rsvps: true } } },
  });
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (event.dateTime < new Date()) {
    return NextResponse.json({ error: "This event has already happened" }, { status: 409 });
  }

  const members = await prisma.user.findMany({
    where: { isApproved: true, id: { in: userIds } },
    select: { name: true, email: true },
  });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const date = new Date(event.dateTime);
  const when = `${formatEventDate(date, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })}, ${formatEventTimeRange(date, event.endDateTime)}`;
  // Keep the exact address private until people RSVP, same as the event page.
  const where = event.publicLocation
    ? `${escapeHtml(event.publicLocation)} (exact address shared after you RSVP)`
    : escapeHtml(event.address);
  const spotsLeft =
    event.capacity != null ? Math.max(event.capacity - event._count.rsvps, 0) : null;

  const { sent, error } = await sendBulkEmail(
    members.map((m) => ({
      to: m.email,
      subject: `You're invited: ${event.title}`,
      html: emailLayout(`
        <p>Hi ${escapeHtml(m.name.split(" ")[0])},</p>
        ${note?.trim() ? textToHtml(note) : ""}
        <p style="font-size:18px;font-weight:700;margin-bottom:4px;">${escapeHtml(event.title)}</p>
        <ul style="padding-left:18px;">
          <li><strong>When:</strong> ${when}</li>
          <li><strong>Where:</strong> ${where}</li>
          ${spotsLeft != null ? `<li><strong>Spots left:</strong> ${spotsLeft} of ${event.capacity}</li>` : ""}
        </ul>
        <div style="color:#374151;">${textToHtml(event.description)}</div>
        <p style="margin: 20px 0;">
          <a href="${base}/events/${event.id}" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">RSVP</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Questions? Just reply to this email.</p>
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
    data: { invitedAt: new Date(), inviteCount: sent },
  });

  return NextResponse.json({ ok: true, sent, total: members.length });
}
