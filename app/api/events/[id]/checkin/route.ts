import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkInWindow } from "@/lib/checkin";

// POST — check the signed-in member in at the event. Safe to repeat.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log in to check in" }, { status: 401 });
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { dateTime: true, endDateTime: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  const window = checkInWindow(event);
  if (window !== "open") {
    return NextResponse.json(
      {
        error:
          window === "early"
            ? "Check-in opens two hours before the event starts."
            : "Check-in for this event has closed.",
      },
      { status: 409 }
    );
  }

  await prisma.checkIn.upsert({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
    create: { eventId: id, userId: session.user.id },
    update: {},
  });
  return NextResponse.json({ ok: true });
}
