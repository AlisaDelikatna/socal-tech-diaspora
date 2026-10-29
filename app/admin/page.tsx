import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PendingMembers from "./PendingMembers";
import EventManager from "./EventManager";
import ResourceManager from "./ResourceManager";
import AdminAccess from "./AdminAccess";
import SpeakerManager from "./SpeakerManager";
import { formatEventDate } from "@/lib/time";

export const metadata = {
  title: "Admin — Kolo Founders Circle",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/");

  const [pending, events, resources, members, speakerOpps] = await Promise.all([
    prisma.user.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        company: true,
        linkedinUrl: true,
        whatINeed: true,
        howICanHelp: true,
        createdAt: true,
      },
    }),
    prisma.event.findMany({
      orderBy: { dateTime: "desc" },
      include: {
        _count: { select: { rsvps: true } },
        rsvps: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            user: {
              select: { id: true, name: true, email: true, title: true, company: true },
            },
          },
        },
      },
    }),
    prisma.resource.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, description: true, url: true, category: true, subcategory: true },
    }).catch(() => []),
    prisma.user.findMany({
      where: { isApproved: true },
      orderBy: [{ isAdmin: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        company: true,
        isAdmin: true,
        role: true,
        industries: true,
      },
    }),
    prisma.speakerOpportunity.findMany({
      orderBy: [{ event: { dateTime: "asc" } }, { createdAt: "asc" }],
      include: {
        event: { select: { title: true, dateTime: true } },
        applications: {
          orderBy: { createdAt: "asc" },
          include: { submittedBy: { select: { name: true } } },
        },
      },
    }),
  ]);

  const shortDate = (d: Date) =>
    formatEventDate(d, { month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-14">
      <div>
        <h1 className="text-3xl font-extrabold">Admin dashboard</h1>
        <p className="text-muted mt-1">
          Approve members, manage events and admins, and curate resources.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4">
          Pending applications ({pending.length})
        </h2>
        <PendingMembers
          members={pending.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Events</h2>
        <EventManager
          events={events.map((e) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            dateTime: e.dateTime.toISOString(),
            endDateTime: e.endDateTime?.toISOString() ?? null,
            address: e.address,
            publicLocation: e.publicLocation,
            capacity: e.capacity,
            rsvpCount: e._count.rsvps,
            attendees: e.rsvps.map((r) => ({
              id: r.user.id,
              name: r.user.name,
              email: r.user.email,
              title: r.user.title,
              company: r.user.company,
            })),
          }))}
        />
      </section>

      <section id="speakers" className="scroll-mt-24">
        <h2 className="text-xl font-bold mb-1">Speaker opportunities</h2>
        <p className="text-sm text-muted mb-4">
          Open a speaker slot for an event, invite members to apply or
          recommend someone, then accept, sideline, or reply to candidates.
        </p>
        <SpeakerManager
          members={members.map((m) => ({
            id: m.id,
            name: m.name,
            title: m.title,
            company: m.company,
            role: m.role,
            industries: m.industries,
          }))}
          events={events
            .filter((e) => e.dateTime >= new Date())
            .map((e) => ({ id: e.id, title: e.title, date: shortDate(e.dateTime) }))}
          opportunities={speakerOpps.map((o) => ({
            id: o.id,
            eventId: o.eventId,
            eventTitle: o.event.title,
            eventDate: shortDate(o.event.dateTime),
            topic: o.topic,
            description: o.description,
            status: o.status,
            invitedAt: o.invitedAt?.toISOString() ?? null,
            inviteCount: o.inviteCount,
            applications: o.applications.map((a) => ({
              id: a.id,
              isSelf: a.isSelf,
              candidateName: a.candidateName,
              candidateEmail: a.candidateEmail,
              candidateTitle: a.candidateTitle,
              candidateLinkedin: a.candidateLinkedin,
              pitch: a.pitch,
              status: a.status,
              submittedBy: a.submittedBy.name,
              createdAt: a.createdAt.toISOString(),
            })),
          }))}
        />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Admin access</h2>
        <AdminAccess members={members} currentUserId={session.user.id} />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Resources</h2>
        <ResourceManager resources={resources} />
      </section>
    </div>
  );
}
