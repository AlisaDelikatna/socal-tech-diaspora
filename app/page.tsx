import Link from "next/link";
import { prisma } from "@/lib/prisma";
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
            SoCal Tech <span className="text-brand">Diaspora</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-xl text-foreground/80 font-medium">
            Professional network of Ukrainian-rooted founders, entrepreneurs,
            investors, and techies in Southern California.
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

      {/* Upcoming event */}
      {upcomingEvent && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-bold mb-4">Next up</h2>
          <Card className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-accent font-semibold">
                {new Date(upcomingEvent.dateTime).toLocaleDateString("en-US", {
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
            ["Svoi — Our People", "We show up for each other first."],
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
