import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import ResourcesDropdown from "./ResourcesDropdown";

export default async function Navbar() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.isAdmin;

  return (
    <header className="border-b border-border bg-white/80 backdrop-blur sticky top-0 z-40">
      <nav className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logo.png"
            alt="SoCal Tech Diaspora"
            width={180}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/mission" className="hover:text-brand">
            Mission
          </Link>
          <Link href="/events" className="hover:text-brand">
            Events
          </Link>
          <ResourcesDropdown />
          {isLoggedIn && (
            <>
              <Link href="/members" className="hover:text-brand">
                Members
              </Link>
              <Link href="/dashboard" className="hover:text-brand">
                Dashboard
              </Link>
              <Link href="/messages" className="hover:text-brand">
                Messages
              </Link>
              <Link href="/profile" className="hover:text-brand">
                Profile
              </Link>
              {isAdmin && (
                <Link href="/admin" className="hover:text-brand font-medium">
                  Admin
                </Link>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {isLoggedIn ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface"
              >
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface"
              >
                Log in
              </Link>
              <Link
                href="/join"
                className="rounded-lg bg-brand text-white px-3 py-1.5 hover:bg-brand-dark"
              >
                Become a Member
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
