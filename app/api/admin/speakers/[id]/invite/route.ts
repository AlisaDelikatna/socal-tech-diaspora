import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendBulkEmail, emailLayout, escapeHtml, textToHtml } from "@/lib/email";
import { formatEventDate, formatEventTimeRange } from "@/lib/time";
import { resolveGuestEmails } from "@/lib/guest-invites";
import { FREE_MEMBERSHIP_DEADLINE } from "@/lib/guests";
import { SPEAKING_PATH } from "@/lib/resources";

// POST { userIds, guestEmails?, note? } — email the chosen approved members,
// and non-members by email address, about a speaker opportunity (admin only). Replies go to REPLY_TO (lib/email.ts).
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

  const opp = await prisma.speakerOpportunity.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!opp) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (opp.status !== "open") {
    return NextResponse.json(
      { error: "Reopen this opportunity before sending invites" },
      { status: 409 }
    );
  }

  const members = await prisma.user.findMany({
    where: { isApproved: true, id: { in: userIds } },
    select: { name: true, email: true },
  });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const date = new Date(opp.event.dateTime);
  const when = `${formatEventDate(date, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })}, ${formatEventTimeRange(date, opp.event.endDateTime)}`;
  const where = opp.event.publicLocation ?? opp.event.address;

  const noteHtml = note?.trim() ? textToHtml(note) : "";
  const slot = `
        <p>We have a speaker spot open at <strong>${escapeHtml(opp.event.title)}</strong> (${when}, ${escapeHtml(where)}).</p>
        <p style="font-size:16px;font-weight:600;margin-bottom:4px;">${escapeHtml(opp.topic)}</p>
        <div style="color:#374151;">${textToHtml(opp.description)}</div>`;

  const memberEmails = members.map((m) => ({
    to: m.email,
    subject: `We're looking for a speaker: ${opp.topic}`,
    html: emailLayout(`
        <p>Hi ${escapeHtml(m.name.split(" ")[0])},</p>
        ${noteHtml}
        ${slot}
        <p>Would you like to speak, or do you know someone who'd be great? Apply or recommend them here:</p>
        <p style="margin: 20px 0;">
          <a href="${base}${SPEAKING_PATH}#speak-${opp.id}" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Apply or recommend a speaker</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">You can also just reply to this email.</p>
      `),
  }));

  // Non-members can't use the apply form, so they reply by email instead.
  const guestEmailsOut = guests.map((to) => ({
    to,
    subject: `Speaking opportunity: ${opp.topic}`,
    html: emailLayout(`
        <p>Hi,</p>
        ${noteHtml}
        <p>Kolo Founders Circle is a community where founders, builders, and entrepreneurs in Southern California grow together, and we'd love your help with an upcoming event.</p>
        ${slot}
        <p><strong>Interested in speaking, or know someone who'd be great?</strong> Just reply to this email with a few lines about the talk.</p>
        <div style="background:#F0ECE3;border-radius:8px;padding:14px 16px;margin:20px 0;">
          <p style="margin:0 0 6px;font-weight:600;">Kolo events are for members only.</p>
          <p style="margin:0;">Membership is <strong>free</strong> for everyone who joins by ${FREE_MEMBERSHIP_DEADLINE}.</p>
        </div>
        <p style="margin: 20px 0;">
          <a href="${base}/join" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Join for free</a>
          &nbsp;
          <a href="${base}/events/${opp.event.id}" style="color:#223A5E;">See the event</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">You're receiving this because a Kolo organizer invited you; reply if you'd rather not hear from us.</p>
      `),
  }));

  const { sent, error } = await sendBulkEmail([...memberEmails, ...guestEmailsOut]);

  if (sent === 0) {
    return NextResponse.json(
      { error: `No emails could be sent. Resend said: ${error ?? "unknown error"}` },
      { status: 502 }
    );
  }

  await prisma.speakerOpportunity.update({
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
