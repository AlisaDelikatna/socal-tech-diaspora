import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, LinkButton } from "@/components/ui";

export const metadata = {
  title: "Events — SoCal Tech Diaspora",
};

function EventRow({
  event,
}: {
  event: {
    id: string;
    title: string;
    description: string;
    dateTime: Date;
    address: string;
    _count: { rsvps: number };
  };
}) {
  const date = new Date(event.dateTime);
  return (
    <Card className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
      <div className="flex gap-4">
        <div className="text-center shrink-0 w-14">
          <div className="text-xs uppercase text-accent font-semibold">
            {date.toLocaleDateString("en-US", { month: "short" })}
          </div>
          <div className="text-2xl font-extrabold leading-none">
            {date.getDate()}
          </div>
        </div>
        <div>
          <Link
            href={`/events/${event.id}`}
            className="font-semibold hover:text-brand"
          >
            {event.title}
          </Link>
          <p className="text-sm text-muted mt-0.5">
            {date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · {event.address}
          </p>
          <p className="text-sm text-muted mt-1 line-clamp-2">
            {event.description}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <LinkButton href={`/events/${event.id}`}>RSVP</LinkButton>
        <span className="text-xs text-muted">{event._count.rsvps} going</span>
      </div>
    </Card>
  );
}

export default async function EventsPage() {
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    prisma.event
      .findMany({
        where: { dateTime: { gte: now } },
        orderBy: { dateTime: "asc" },
        include: { _count: { select: { rsvps: true } } },
      })
      .catch(() => []),
    prisma.event
      .findMany({
        where: { dateTime: { lt: now } },
        orderBy: { dateTime: "desc" },
        take: 10,
        include: { _count: { select: { rsvps: true } } },
      })
      .catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Events</h1>
      <p className="text-muted mt-1">
        Meetups, workshops, and get-togethers for the community.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted">No upcoming events yet — check back soon.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-4">Past events</h2>
          <div className="space-y-3 opacity-75">
            {past.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
