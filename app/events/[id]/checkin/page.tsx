import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkInPath, checkInWindow } from "@/lib/checkin";
import { formatEventDate } from "@/lib/time";
import CheckInNow from "./CheckInNow";

export const metadata = {
  title: "Check in — Kolo Founders Circle",
  robots: { index: false },
};

// Opened from the QR code on the event slideshow.
export default async function CheckInPage({
  params,
}: PageProps<"/events/[id]/checkin">) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(checkInPath(id))}`);
  }

  const event = await prisma.event
    .findUnique({
      where: { id },
      select: { id: true, title: true, dateTime: true, endDateTime: true },
    })
    .catch(() => null);
  if (!event) notFound();

  const already = await prisma.checkIn.findUnique({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
    select: { id: true },
  });
  const window = checkInWindow(event);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="text-sm font-semibold text-accent uppercase tracking-wide">
        {formatEventDate(event.dateTime, { weekday: "long", month: "long", day: "numeric" })}
      </div>
      <h1 className="mt-2 text-2xl font-extrabold">{event.title}</h1>
      <div className="mt-8">
        {already ? (
          <p className="text-2xl font-bold text-brand">You&apos;re checked in. Welcome!</p>
        ) : window === "open" ? (
          <CheckInNow eventId={event.id} />
        ) : (
          <p className="text-muted">
            {window === "early"
              ? "Check-in opens two hours before the event starts."
              : "Check-in for this event has closed."}
          </p>
        )}
      </div>
      <Link href={`/events/${event.id}`} className="mt-10 inline-block text-sm text-brand hover:underline">
        Go to the event page
      </Link>
    </div>
  );
}
