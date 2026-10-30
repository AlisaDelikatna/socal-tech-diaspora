import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";
import { parseEventInput } from "@/lib/time";
import { notifyAttendees } from "@/lib/event-updates";
import { removeFiles, PHOTO_BUCKET } from "@/lib/storage";

// PUT — update an event (admin only).
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const d = parsed.data;
  const before = await prisma.event.findUnique({ where: { id } });
  let updated;
  try {
    updated = await prisma.event.update({
      where: { id },
      data: {
        title: d.title,
        description: d.description,
        dateTime: parseEventInput(d.dateTime),
        endDateTime: d.endDateTime ? parseEventInput(d.endDateTime) : null,
        address: d.address,
        publicLocation: d.publicLocation?.trim() || null,
        posterUrl: d.posterUrl || null,
        capacity: d.capacity ?? null,
      },
    });
  } catch (err) {
    console.error("[events PUT] update failed:", err);
    return NextResponse.json(
      { error: "Could not save the event. The database may be unavailable — try again in a moment." },
      { status: 500 }
    );
  }

  // If anything that's on people's calendars changed, send everyone going an
  // updated invite. Runs after the response so saving stays fast.
  const changed =
    before &&
    (before.title !== updated.title ||
      before.dateTime.getTime() !== updated.dateTime.getTime() ||
      before.endDateTime?.getTime() !== updated.endDateTime?.getTime() ||
      before.address !== updated.address);
  const notify = !!changed && updated.dateTime > new Date();
  if (notify) {
    const event = updated;
    after(() => notifyAttendees(event, "REQUEST"));
  }

  return NextResponse.json({ ok: true, attendeesNotified: notify });
}

// DELETE — remove an event (admin only).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  // Load attendees first; they're deleted along with the event.
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      rsvps: { select: { user: { select: { name: true, email: true } } } },
      photos: { select: { path: true } },
    },
  });
  await prisma.event.delete({ where: { id } }).catch(() => null);
  if (event?.photos.length) {
    await removeFiles(PHOTO_BUCKET, event.photos.map((p) => p.path));
  }

  // Take an upcoming event off everyone's calendar.
  if (event && event.dateTime > new Date() && event.rsvps.length > 0) {
    const attendees = event.rsvps.map((r) => r.user);
    after(() => notifyAttendees(event, "CANCEL", attendees));
  }
  return NextResponse.json({ ok: true });
}
