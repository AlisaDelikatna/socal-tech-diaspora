import { LinkButton } from "@/components/ui";

export const metadata = {
  title: "Mission & Values — Kolo Founders Circle",
};

const values = [
  {
    title: "Our People",
    body: "We show up for each other first — sharing referrals, advice, and a soft landing, simply because that's who we are.",
  },
  {
    title: "Growth Without Gatekeeping",
    body: "Career advice, intros, and startup knowledge get shared freely — we don't hoard access.",
  },
  {
    title: "Rooted, Not Isolated",
    body: "We stay connected to Ukrainian culture and identity while building fully in the American tech/startup world — not a substitute community, a bridge.",
  },
  {
    title: "Open Door for Newcomers",
    body: "Whether you landed in LA last month or have been here 20 years, there's a seat at the table.",
  },
];

export default function MissionPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <span className="text-sm font-semibold text-accent uppercase tracking-wide">
        Our Mission
      </span>
      <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold">
        Kolo Founders Circle unites Ukrainian tech professionals, founders, and
        newcomers in Southern California to grow together — professionally,
        culturally, and as a community that has each other&apos;s back.
      </h1>

      <h2 className="mt-14 text-2xl font-bold">Our Values</h2>
      <div className="mt-6 space-y-6">
        {values.map((v) => (
          <div
            key={v.title}
            className="rounded-xl border border-border bg-white p-6"
          >
            <h3 className="font-semibold text-lg">{v.title}</h3>
            <p className="mt-2 text-muted">{v.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-border bg-white p-8">
        <h2 className="text-xl font-bold">Why &ldquo;Kolo&rdquo;</h2>
        <p className="mt-3 text-muted leading-relaxed">
          Kolo means circle. In vyshyvanka — Ukrainian embroidery — a single
          cross-stitch is almost nothing on its own. Repeated thousands of
          times, it becomes a pattern that tells you where someone is from. One
          founder is one stitch. This community is the pattern we make together.
        </p>
      </div>

      <div className="mt-14 text-center rounded-2xl bg-surface p-10">
        <h2 className="text-2xl font-bold">There&apos;s a seat at the table.</h2>
        <p className="mt-2 text-muted">
          Whether you landed last month or have been here 20 years.
        </p>
        <div className="mt-6">
          <LinkButton href="/join">Become a Member</LinkButton>
        </div>
      </div>
    </div>
  );
}
