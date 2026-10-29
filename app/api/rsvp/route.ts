import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";
import { formatEventDate, formatEventTimeRange } from "@/lib/time";

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

  const date = new Date(event.dateTime);
  await sendEmail({
    to: session.user.email!,
    subject: `You're going: ${event.title}`,
    html: emailLayout(`
      <p>You're confirmed for <strong>${event.title}</strong>.</p>
      <ul>
        <li><strong>When:</strong> ${formatEventDate(date, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}, ${formatEventTimeRange(date, event.endDateTime)}</li>
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
