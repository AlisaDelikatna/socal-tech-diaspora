import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-3 text-sm">
        <div>
          <Logo className="h-10 mb-2" />
          <p className="text-muted">
            Ukrainian tech professionals, founders, and newcomers building
            together in Southern California.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-semibold">Explore</span>
          <Link href="/mission" className="text-muted hover:text-brand">
            Mission &amp; Values
          </Link>
          <Link href="/events" className="text-muted hover:text-brand">
            Events
          </Link>
          <Link href="/join" className="text-muted hover:text-brand">
            Become a Member
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-semibold">Connect</span>
          <a
            href="mailto:hello@kolofounders.com"
            className="text-muted hover:text-brand"
          >
            hello@kolofounders.com
          </a>
          <a href="#" className="text-muted hover:text-brand">
            LinkedIn
          </a>
          <a href="#" className="text-muted hover:text-brand">
            Instagram
          </a>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Kolo Founders Circle.
      </div>
    </footer>
  );
}
