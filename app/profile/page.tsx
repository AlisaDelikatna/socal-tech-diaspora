import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ProfileForm";

export const metadata = {
  title: "Your profile — SoCal Tech Diaspora",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Your profile</h1>
      <p className="mt-1 text-muted">
        This is what other members see. Keep it fresh.
      </p>
      <div className="mt-8">
        <ProfileForm
          initial={{
            name: user.name,
            title: user.title,
            company: user.company ?? "",
            pronouns: user.pronouns ?? "",
            bio: user.bio ?? "",
            linkedinUrl: user.linkedinUrl,
            whatINeed: user.whatINeed,
            howICanHelp: user.howICanHelp,
            photoUrl: user.photoUrl ?? "",
            tags: user.tags,
          }}
        />
      </div>
    </div>
  );
}
