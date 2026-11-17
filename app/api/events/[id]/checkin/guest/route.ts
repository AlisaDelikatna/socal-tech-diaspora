import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { guestCheckInSchema } from "@/lib/validations";
import { checkInWindow } from "@/lib/checkin";
import { sendEmail, emailLayout, escapeHtml } from "@/lib/email";

// POST { name, email, linkedinUrl, title, company? } — check in someone
// without an account. Their details become a pending membership application
// (shown in Admin with the event they came to), and the check-in is recorded
// against it, so approving them later keeps their attendance.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = guestCheckInSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return NextResponse.json({ error: first ?? "Check the form and try again." }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    select: { title: true, dateTime: true, endDateTime: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (checkInWindow(event) !== "open") {
    return NextResponse.json({ error: "Check-in for this event isn't open." }, { status: 409 });
  }

  const d = parsed.data;
  const email = d.email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isApproved: true },
  });
  // Members check in by logging in, so nobody can check in as them by email.
  if (existing?.isApproved) {
    return NextResponse.json(
      { error: "You're already a member. Log in to check in.", member: true },
      { status: 409 }
    );
  }

  // An earlier application (or guest check-in) is reused as-is.
  const userId =
    existing?.id ??
    (
      await prisma.user.create({
        data: {
          name: d.name,
          email,
          // Guests set a real password from the link in their approval email.
          passwordHash: await bcrypt.hash(crypto.randomUUID() + crypto.randomUUID(), 10),
          linkedinUrl: d.linkedinUrl,
          title: d.title,
          company: d.company || null,
          whatINeed: "",
          howICanHelp: "",
          isApproved: false,
        },
        select: { id: true },
      })
    ).id;

  await prisma.checkIn.upsert({
    where: { eventId_userId: { eventId: id, userId } },
    create: { eventId: id, userId },
    update: {},
  });

  if (!existing) {
    await sendEmail({
      to: email,
      subject: `Thanks for coming to ${event.title}`,
      html: emailLayout(`
        <p>Hi ${escapeHtml(d.name.split(" ")[0])},</p>
        <p>You're checked in at <strong>${escapeHtml(event.title)}</strong>. Glad you came.</p>
        <p>We've also started your Kolo Founders Circle membership application with the details you gave us. Once an organizer approves it, you'll get an email with a link to set your password, so you can RSVP to events, message members, and use the resource library.</p>
      `),
    });
  }

  return NextResponse.json({ ok: true });
}
