import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Tag, LinkButton } from "@/components/ui";
import MemberAvatar from "@/components/MemberAvatar";

export default async function MemberProfilePage({
  params,
}: PageProps<"/members/[id]">) {
  const { id } = await params;
  const session = await auth();

  const member = await prisma.user
    .findFirst({
      where: { id, isApproved: true },
      include: { invitedBy: { select: { id: true, name: true } } },
    })
    .catch(() => null);

  if (!member) notFound();

  const isOwnProfile = session?.user?.id === member.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/members" className="text-sm text-brand hover:underline">
        ← Back to members
      </Link>

      <div className="mt-6 rounded-2xl border border-border bg-white p-8">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
          <MemberAvatar name={member.name} photoUrl={member.photoUrl} size={96} />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold">{member.name}</h1>
              {member.pronouns && (
                <span className="text-sm text-muted">({member.pronouns})</span>
              )}
            </div>
            <p className="text-muted mt-1">
              {member.title}
              {member.company ? ` · ${member.company}` : ""}
            </p>
            <div className="mt-3 flex gap-3 flex-wrap">
              <a
                href={member.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand hover:underline"
              >
                LinkedIn ↗
              </a>
              {isOwnProfile ? (
                <Link
                  href="/profile"
                  className="text-sm text-brand hover:underline"
                >
                  Edit your profile
                </Link>
              ) : (
                <LinkButton
                  href={`/messages/${member.id}`}
                  className="!py-1.5"
                >
                  Message me
                </LinkButton>
              )}
            </div>
          </div>
        </div>

        {member.bio && (
          <div className="mt-8">
            <h2 className="font-semibold">About</h2>
            <p className="mt-2 text-foreground/90 whitespace-pre-line">
              {member.bio}
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-surface p-4">
            <h3 className="font-semibold text-sm">What I need</h3>
            <p className="mt-1 text-sm text-muted">{member.whatINeed}</p>
          </div>
          <div className="rounded-xl bg-surface p-4">
            <h3 className="font-semibold text-sm">How I can help</h3>
            <p className="mt-1 text-sm text-muted">{member.howICanHelp}</p>
          </div>
        </div>

        {member.tags.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-sm mb-2">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {member.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border text-xs text-muted flex justify-between flex-wrap gap-2">
          <span>
            Member since{" "}
            {new Date(member.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          {member.invitedBy && (
            <span>
              Invited by{" "}
              <Link
                href={`/members/${member.invitedBy.id}`}
                className="text-brand hover:underline"
              >
                {member.invitedBy.name}
              </Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
