import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PendingMembers from "./PendingMembers";
import EventManager from "./EventManager";
import ResourceManager from "./ResourceManager";

export const metadata = {
  title: "Admin — Kolo Founders Circle",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/");

  const [pending, events, resources] = await Promise.all([
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
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-14">
      <div>
        <h1 className="text-3xl font-extrabold">Admin dashboard</h1>
        <p className="text-muted mt-1">
          Approve members, manage events, and curate resources.
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
            address: e.address,
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

      <section>
        <h2 className="text-xl font-bold mb-4">Resources</h2>
        <ResourceManager resources={resources} />
      </section>
    </div>
  );
}
