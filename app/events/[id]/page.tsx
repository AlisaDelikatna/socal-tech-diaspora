import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatEventDate, formatEventTimeRange } from "@/lib/time";
import { auth } from "@/auth";
import MemberAvatar from "@/components/MemberAvatar";
import RsvpButton from "./RsvpButton";
import SpeakerApply from "./SpeakerApply";

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
        speakerOpportunities: {
          where: { status: "open" },
          orderBy: { createdAt: "asc" },
          include: {
            applications: {
              where: { submittedByUserId: session?.user?.id ?? "" },
              select: { candidateName: true, isSelf: true },
            },
          },
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
  const isFull =
    event.capacity != null && event.rsvps.length >= event.capacity;
  const addressHidden = !!event.publicLocation && !alreadyGoing;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/events" className="text-sm text-brand hover:underline">
        ← All events
      </Link>

      <div className="mt-4 rounded-2xl border border-border bg-white p-8">
        <div className="text-sm font-semibold text-accent uppercase tracking-wide">
          {formatEventDate(date, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          ·{" "}
          {formatEventTimeRange(date, event.endDateTime)}
        </div>
        <h1 className="mt-2 text-3xl font-extrabold">{event.title}</h1>
        <p className="mt-2 text-muted">
          📍 {addressHidden ? event.publicLocation : event.address}
        </p>
        {addressHidden && (
          <p className="mt-1 text-sm text-muted">
            The exact address is shared with members after they RSVP.
          </p>
        )}

        <div className="mt-6 whitespace-pre-line text-foreground/90">
          {event.description}
        </div>

        <div className="mt-8 flex items-center gap-4">
          {isPast ? (
            <span className="text-sm text-muted">This event has ended.</span>
          ) : isFull && !alreadyGoing ? (
            <span className="text-sm font-medium text-muted">
              This event is full.
            </span>
          ) : isLoggedIn ? (
            <RsvpButton eventId={event.id} initialGoing={alreadyGoing} />
          ) : (
            <div className="flex flex-col gap-1">
              <Link
                href={`/login?callbackUrl=/events/${event.id}`}
                className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark"
              >
                Members: log in to RSVP
              </Link>
              <Link href="/join" className="text-xs text-brand hover:underline">
                Not a member yet? Apply to join
              </Link>
            </div>
          )}
          <span className="text-sm text-muted">
            {event.rsvps.length} going
            {event.capacity != null &&
              !isFull &&
              ` · ${event.capacity - event.rsvps.length} spots left`}
          </span>
        </div>

        <p className="mt-6 text-xs text-muted">
          Hosted by {event.createdBy.name}
        </p>
      </div>

      {!isPast && event.speakerOpportunities.length > 0 && (
        <div id="speak" className="mt-8 scroll-mt-24 space-y-4">
          {event.speakerOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="rounded-2xl border border-brand/30 bg-brand/5 p-6"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-brand">
                Speaker wanted
              </div>
              <h2 className="mt-1 text-xl font-bold">{opp.topic}</h2>
              <p className="mt-2 whitespace-pre-line text-foreground/90">
                {opp.description}
              </p>
              <div className="mt-5">
                {!isLoggedIn ? (
                  <Link
                    href={`/login?callbackUrl=/events/${event.id}%23speak`}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Members: log in to apply or recommend a speaker
                  </Link>
                ) : (
                  <>
                    {opp.applications.length > 0 && (
                      <p className="mb-3 text-sm text-muted">
                        You submitted:{" "}
                        {opp.applications
                          .map((a) => (a.isSelf ? "yourself" : a.candidateName))
                          .join(", ")}
                        . You can recommend someone else too.
                      </p>
                    )}
                    <SpeakerApply opportunityId={opp.id} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
