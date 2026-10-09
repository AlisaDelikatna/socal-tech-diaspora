import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { founders } from "@/lib/founders";
import { formatEventDate } from "@/lib/time";
import { LinkButton, Card, Tag } from "@/components/ui";
import MemberAvatar from "@/components/MemberAvatar";

export default async function HomePage() {
  // These queries fail gracefully to empty/zero if the DB isn't set up yet,
  // so the marketing homepage still renders before you configure Postgres.
  const [memberCount, featuredMembers, upcomingEvent] = await Promise.all([
    prisma.user.count({ where: { isApproved: true } }).catch(() => 0),
    prisma.user
      .findMany({
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          name: true,
          title: true,
          company: true,
          photoUrl: true,
          howICanHelp: true,
        },
      })
      .catch(() => []),
    prisma.event
      .findFirst({
        where: { dateTime: { gte: new Date() } },
        orderBy: { dateTime: "asc" },
      })
      .catch(() => null),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/5 to-transparent"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Kolo Founders <span className="text-brand">Circle</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-xl text-foreground/80 font-medium">
            Where founders, builders, and entrepreneurs in Southern California
            stand in circle, grow together, and build something none of them
            could build alone.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <LinkButton href="/join">Become a Member</LinkButton>
            <LinkButton href="/events" variant="outline">
              See Events
            </LinkButton>
          </div>
          {memberCount > 0 && (
            <p className="mt-6 text-sm text-muted">
              Join{" "}
              <span className="font-semibold text-foreground">
                {memberCount}
              </span>{" "}
              members already building together.
            </p>
          )}
        </div>
      </section>

      {/* Mission strip */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <Card className="bg-surface border-none text-center">
          <p className="text-lg sm:text-xl font-medium">
            Rooted in Ukrainian identity. Building fully in American tech.{" "}
            <span className="text-brand">A bridge, not a substitute.</span>
          </p>
          <Link
            href="/mission"
            className="mt-3 inline-block text-sm text-brand hover:underline"
          >
            Read our mission &amp; values →
          </Link>
        </Card>
      </section>

      {/* Founders */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold mb-8 text-center">
          Meet the Founders
        </h2>
        <div className="flex flex-wrap justify-center gap-x-16 gap-y-10">
          {founders.map((f) => (
            <a
              key={f.name}
              href={f.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-56 flex-col items-center text-center"
            >
              <Image
                src={f.photo}
                alt={f.name}
                width={176}
                height={176}
                className="h-44 w-44 rounded-full object-cover ring-4 ring-brand/15 transition group-hover:ring-brand/40"
              />
              <h3 className="mt-4 text-lg font-semibold group-hover:text-brand">
                {f.name}
              </h3>
              <p className="mt-1 text-sm text-muted">{f.headline}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Upcoming event */}
      {upcomingEvent && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-bold mb-4">Next up</h2>
          <Card className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-accent font-semibold">
                {formatEventDate(upcomingEvent.dateTime, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <h3 className="text-lg font-semibold mt-1">
                {upcomingEvent.title}
              </h3>
              <p className="text-sm text-muted mt-1">{upcomingEvent.address}</p>
            </div>
            <LinkButton href={`/events/${upcomingEvent.id}`} variant="outline">
              View &amp; RSVP
            </LinkButton>
          </Card>
        </section>
      )}

      {/* Member preview */}
      {featuredMembers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Meet a few members</h2>
            <Link href="/members" className="text-sm text-brand hover:underline">
              See all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {featuredMembers.map((m) => (
              <Card key={m.id} className="text-center">
                <MemberAvatar
                  name={m.name}
                  photoUrl={m.photoUrl}
                  size={64}
                  className="mx-auto"
                />
                <h3 className="mt-3 font-semibold">{m.name}</h3>
                <p className="text-sm text-muted">
                  {m.title}
                  {m.company ? ` · ${m.company}` : ""}
                </p>
                <div className="mt-3 flex justify-center">
                  <Tag>Can help: {m.howICanHelp}</Tag>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Values teaser */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Our People", "We show up for each other first."],
            ["Growth Without Gatekeeping", "We don't hoard access."],
            ["Rooted, Not Isolated", "A bridge to Ukrainian identity."],
            ["Open Door for Newcomers", "There's a seat at the table."],
          ].map(([title, desc]) => (
            <Card key={title}>
              <div className="h-1 w-8 bg-accent rounded-full mb-3" />
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted mt-1">{desc}</p>
            </Card>
          ))}
        </div>
        <div className="text-center mt-10">
          <LinkButton href="/join">Become a Member</LinkButton>
        </div>
      </section>
    </div>
  );
}
