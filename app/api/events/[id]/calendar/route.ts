import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildIcs } from "@/lib/calendar";

// GET — download the event as an .ics file for Apple Calendar / Outlook.
// It includes the full address, so only members who RSVP'd (and admins) get it.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // On Netlify, req.nextUrl.origin is the internal deploy host, not our domain.
  const origin = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
  const session = await auth();
  if (!session?.user?.id) {
    const login = new URL("/login", origin);
    login.searchParams.set("callbackUrl", `/api/events/${id}/calendar`);
    return NextResponse.redirect(login);
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const going = await prisma.rsvp.findUnique({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
  });
  if (!going && !session.user.isAdmin) {
    return NextResponse.redirect(new URL(`/events/${id}`, origin));
  }

  return new NextResponse(buildIcs(event, "PUBLISH"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kolo-event.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
