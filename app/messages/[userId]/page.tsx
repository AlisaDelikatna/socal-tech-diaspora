import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getThread } from "@/lib/messages";
import MemberAvatar from "@/components/MemberAvatar";
import MessageThread from "./MessageThread";

export default async function ThreadPage({
  params,
}: PageProps<"/messages/[userId]">) {
  const { userId: partnerId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (partnerId === session.user.id) redirect("/messages");

  const thread = await getThread(session.user.id, partnerId);
  if (!thread) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/messages" className="text-sm text-brand hover:underline">
        ← All messages
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <MemberAvatar
          name={thread.partner.name}
          photoUrl={thread.partner.photoUrl}
          size={44}
        />
        <div>
          <Link
            href={`/members/${thread.partner.id}`}
            className="font-semibold hover:text-brand"
          >
            {thread.partner.name}
          </Link>
          {thread.partner.title && (
            <p className="text-xs text-muted">{thread.partner.title}</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <MessageThread
          currentUserId={session.user.id}
          partnerId={thread.partner.id}
          initialMessages={thread.messages.map((m) => ({
            id: m.id,
            body: m.body,
            senderId: m.senderId,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
