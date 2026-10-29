import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendBulkEmail, emailLayout, escapeHtml, textToHtml } from "@/lib/email";
import { formatEventDate, formatEventTimeRange } from "@/lib/time";
import { resolveGuestEmails } from "@/lib/guest-invites";
import { FREE_MEMBERSHIP_DEADLINE } from "@/lib/guests";

// POST { userIds, guestEmails?, note? } — email an event invitation to the
// chosen approved members, and to non-members by email address (admin only).
// Non-members get a version explaining membership is required and free. Replies go to REPLY_TO (lib/email.ts).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { note, userIds = [], guestEmails } = (await req.json().catch(() => ({}))) as {
    note?: string;
    userIds?: string[];
    guestEmails?: string[];
  };
  const { guests, skippedExisting, error: guestError } = await resolveGuestEmails(guestEmails);
  if (guestError) {
    return NextResponse.json({ error: guestError }, { status: 400 });
  }
  if (!Array.isArray(userIds) || (userIds.length === 0 && guests.length === 0)) {
    return NextResponse.json({ error: "Choose at least one recipient" }, { status: 400 });
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

  const details = `
        <p style="font-size:18px;font-weight:700;margin-bottom:4px;">${escapeHtml(event.title)}</p>
        <ul style="padding-left:18px;">
          <li><strong>When:</strong> ${when}</li>
          <li><strong>Where:</strong> ${where}</li>
          ${spotsLeft != null ? `<li><strong>Spots left:</strong> ${spotsLeft} of ${event.capacity}</li>` : ""}
        </ul>
        <div style="color:#374151;">${textToHtml(event.description)}</div>`;
  const noteHtml = note?.trim() ? textToHtml(note) : "";

  const memberEmails = members.map((m) => ({
    to: m.email,
    subject: `You're invited: ${event.title}`,
    html: emailLayout(`
        <p>Hi ${escapeHtml(m.name.split(" ")[0])},</p>
        ${noteHtml}
        ${details}
        <p style="margin: 20px 0;">
          <a href="${base}/events/${event.id}" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">RSVP</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Questions? Just reply to this email.</p>
      `),
  }));

  const guestEmailsOut = guests.map((to) => ({
    to,
    subject: `You're invited: ${event.title}`,
    html: emailLayout(`
        <p>Hi,</p>
        ${noteHtml}
        <p>You're invited to an upcoming Kolo Founders Circle event, a community where founders, builders, and entrepreneurs in Southern California grow together.</p>
        ${details}
        <div style="background:#F0ECE3;border-radius:8px;padding:14px 16px;margin:20px 0;">
          <p style="margin:0 0 6px;font-weight:600;">This event is for members only.</p>
          <p style="margin:0;">Membership is <strong>free</strong> for everyone who joins by ${FREE_MEMBERSHIP_DEADLINE}. Apply in a couple of minutes; once you're approved, you can RSVP.</p>
        </div>
        <p style="margin: 20px 0;">
          <a href="${base}/join" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Join for free</a>
          &nbsp;
          <a href="${base}/events/${event.id}" style="color:#223A5E;">See the event</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Questions? Just reply to this email. You're receiving this because a Kolo organizer invited you; reply if you'd rather not hear from us.</p>
      `),
  }));

  const { sent, error } = await sendBulkEmail([...memberEmails, ...guestEmailsOut]);

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

  return NextResponse.json({
    ok: true,
    sent,
    total: members.length + guests.length,
    guests: guests.length,
    skippedExisting,
  });
}
