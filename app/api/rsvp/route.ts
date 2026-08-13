import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";

// POST { eventId } — RSVP to an event. DELETE { eventId } — cancel RSVP.
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

  // Idempotent — unique constraint on (eventId, userId).
  await prisma.rsvp.upsert({
    where: { eventId_userId: { eventId, userId: session.user.id } },
    create: { eventId, userId: session.user.id },
    update: {},
  });

  const date = new Date(event.dateTime);
  await sendEmail({
    to: session.user.email!,
    subject: `You're going: ${event.title}`,
    html: emailLayout(`
      <p>You're confirmed for <strong>${event.title}</strong>.</p>
      <ul>
        <li><strong>When:</strong> ${date.toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</li>
        <li><strong>Where:</strong> ${event.address}</li>
      </ul>
      <p>See you there!</p>
    `),
  });

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

  await prisma.rsvp
    .delete({
      where: { eventId_userId: { eventId, userId: session.user.id } },
    })
    .catch(() => null); // ignore if not RSVP'd

  return NextResponse.json({ ok: true, going: false });
}
