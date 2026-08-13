import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import MemberAvatar from "@/components/MemberAvatar";
import RsvpButton from "./RsvpButton";

export default async function EventDetailPage({
  params,
}: PageProps<"/events/[id]">) {
  const { id } = await params;
  const session = await auth();

  const event = await prisma.event
    .findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        rsvps: {
          include: {
            user: { select: { id: true, name: true, photoUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })
    .catch(() => null);

  if (!event) notFound();

  const date = new Date(event.dateTime);
  const isPast = date < new Date();
  const isLoggedIn = !!session?.user?.id;
  const alreadyGoing = session?.user?.id
    ? event.rsvps.some((r) => r.userId === session.user.id)
    : false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/events" className="text-sm text-brand hover:underline">
        ← All events
      </Link>

      <div className="mt-4 rounded-2xl border border-border bg-white p-8">
        <div className="text-sm font-semibold text-accent uppercase tracking-wide">
          {date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          ·{" "}
          {date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <h1 className="mt-2 text-3xl font-extrabold">{event.title}</h1>
        <p className="mt-2 text-muted">📍 {event.address}</p>

        <div className="mt-6 whitespace-pre-line text-foreground/90">
          {event.description}
        </div>

        <div className="mt-8 flex items-center gap-4">
          {isPast ? (
            <span className="text-sm text-muted">This event has ended.</span>
          ) : isLoggedIn ? (
            <RsvpButton eventId={event.id} initialGoing={alreadyGoing} />
          ) : (
            <Link
              href={`/login?callbackUrl=/events/${event.id}`}
              className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark"
            >
              Log in to RSVP
            </Link>
          )}
          <span className="text-sm text-muted">
            {event.rsvps.length} going
          </span>
        </div>

        <p className="mt-6 text-xs text-muted">
          Hosted by {event.createdBy.name}
        </p>
      </div>

      {event.rsvps.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-3">Who&apos;s going</h2>
          <div className="flex flex-wrap gap-3">
            {event.rsvps.map((r) => (
              <Link
                key={r.user.id}
                href={`/members/${r.user.id}`}
                className="flex items-center gap-2 rounded-full border border-border bg-white pr-3 hover:bg-surface"
              >
                <MemberAvatar
                  name={r.user.name}
                  photoUrl={r.user.photoUrl}
                  size={28}
                />
                <span className="text-sm">{r.user.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
