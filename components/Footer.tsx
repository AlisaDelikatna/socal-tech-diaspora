import Link from "next/link";
import Image from "next/image";
import PartnerLogo from "./PartnerLogo";

const PARTNERS = [
  {
    name: "Ukrainian Culture Center LA",
    logo: "/partners/ucc-melrose.svg",
    url: "https://ukrainianculturecenterla.com",
  },
  {
    name: "Consulate General of Ukraine in San Francisco",
    logo: "/partners/embassy-sf.svg",
    url: "https://san-francisco.mfa.gov.ua/en",
  },
  {
    name: "Ministry of Defence of Ukraine",
    logo: "/partners/ministry-defence-ukraine.svg",
    url: "https://www.mil.gov.ua",
  },
  {
    name: "Stanford University",
    logo: "/partners/stanford.png",
    url: "https://www.stanford.edu",
  },
  {
    name: "YEP Accelerator",
    logo: "/partners/yep.png",
    url: "https://yepworld.org",
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      {/* Partners strip */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted text-center mb-6">
            Partners &amp; Supporters
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {PARTNERS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                title={p.name}
                className="flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
              >
                <PartnerLogo src={p.logo} alt={p.name} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted text-center leading-tight max-w-[120px]">
                  {p.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-3 text-sm">
        <div>
          <Image src="/logo.png" alt="SoCal Tech Diaspora" width={160} height={36} className="h-9 w-auto object-contain mb-2" />
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
            href="mailto:hello@socaltechdiaspora.org"
            className="text-muted hover:text-brand"
          >
            hello@socaltechdiaspora.org
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
        © {new Date().getFullYear()} SoCal Tech Diaspora. Svoi — our people.
      </div>
    </footer>
  );
}
