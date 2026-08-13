import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import MemberAvatar from "@/components/MemberAvatar";
import ReferralLink from "./ReferralLink";

export const metadata = {
  title: "Dashboard — SoCal Tech Diaspora",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const invitees = await prisma.user.findMany({
    where: { invitedByUserId: session.user.id, isApproved: true },
    select: { id: true, name: true, title: true, photoUrl: true },
    orderBy: { createdAt: "desc" },
  });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const referralUrl = `${base}/join?ref=${session.user.id}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold">
          Welcome, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="text-muted mt-1">
          Grow the community — every member you bring in makes it stronger.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-3">Invite a member</h2>
        <Card>
          <p className="text-sm text-muted mb-3">
            Share your personal invite link. Anyone who joins through it is
            tagged as invited by you.
          </p>
          <ReferralLink url={referralUrl} />
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">
          People you&apos;ve invited ({invitees.length})
        </h2>
        {invitees.length === 0 ? (
          <p className="text-muted text-sm">
            No one yet — share your link above to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {invitees.map((m) => (
              <Link
                key={m.id}
                href={`/members/${m.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-white p-3 hover:bg-surface"
              >
                <MemberAvatar name={m.name} photoUrl={m.photoUrl} size={40} />
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm text-muted">{m.title}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
