import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getConversations } from "@/lib/messages";
import MemberAvatar from "@/components/MemberAvatar";

export const metadata = {
  title: "Messages — SoCal Tech Diaspora",
};

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const conversations = await getConversations(session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Messages</h1>

      {conversations.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-center text-muted">
          No conversations yet. Find someone in the{" "}
          <Link href="/members" className="text-brand hover:underline">
            member directory
          </Link>{" "}
          and say hi.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-white">
          {conversations.map((c) => (
            <li key={c.partnerId}>
              <Link
                href={`/messages/${c.partnerId}`}
                className="flex items-center gap-3 p-4 hover:bg-surface"
              >
                <MemberAvatar
                  name={c.partnerName}
                  photoUrl={c.partnerPhotoUrl}
                  size={48}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate">
                      {c.partnerName}
                    </span>
                    <span className="text-xs text-muted shrink-0">
                      {new Date(c.lastAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted truncate">{c.lastBody}</p>
                </div>
                {c.unread && (
                  <span className="h-2.5 w-2.5 rounded-full bg-brand shrink-0" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
