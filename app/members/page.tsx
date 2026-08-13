import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, Tag } from "@/components/ui";
import MemberAvatar from "@/components/MemberAvatar";
import MembersFilter from "./MembersFilter";
import type { Prisma } from "@prisma/client";

export const metadata = {
  title: "Members — SoCal Tech Diaspora",
};

// Members-only directory (enforced by proxy.ts). searchParams is async in Next 16.
export default async function MembersPage({
  searchParams,
}: PageProps<"/members">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const role = typeof params.role === "string" ? params.role : "";

  const where: Prisma.UserWhereInput = { isApproved: true };
  const and: Prisma.UserWhereInput[] = [];

  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { whatINeed: { contains: q, mode: "insensitive" } },
        { howICanHelp: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ],
    });
  }
  if (role) {
    and.push({ title: { contains: role, mode: "insensitive" } });
  }
  if (and.length) where.AND = and;

  const members = await prisma.user
    .findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        title: true,
        company: true,
        photoUrl: true,
        linkedinUrl: true,
        whatINeed: true,
        howICanHelp: true,
        tags: true,
      },
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Members</h1>
          <p className="text-muted mt-1">
            {members.length} {members.length === 1 ? "member" : "members"} — find
            your people.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <MembersFilter defaultQ={q} defaultRole={role} />
      </div>

      {members.length === 0 ? (
        <p className="mt-12 text-center text-muted">
          No members match your search yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <Card key={m.id} className="flex flex-col">
              <div className="flex items-start gap-3">
                <MemberAvatar name={m.name} photoUrl={m.photoUrl} size={56} />
                <div className="min-w-0">
                  <Link
                    href={`/members/${m.id}`}
                    className="font-semibold hover:text-brand"
                  >
                    {m.name}
                  </Link>
                  <p className="text-sm text-muted truncate">
                    {m.title}
                    {m.company ? ` · ${m.company}` : ""}
                  </p>
                  <a
                    href={m.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand hover:underline"
                  >
                    LinkedIn ↗
                  </a>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <span className="font-medium">Needs:</span>{" "}
                  <span className="text-muted">{m.whatINeed}</span>
                </p>
                <p>
                  <span className="font-medium">Can help:</span>{" "}
                  <span className="text-muted">{m.howICanHelp}</span>
                </p>
              </div>

              {m.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.tags.slice(0, 5).map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <Link
                  href={`/members/${m.id}`}
                  className="text-sm text-brand hover:underline"
                >
                  View profile →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
